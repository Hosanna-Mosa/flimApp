const crypto = require('crypto');
const ErrorLog = require('../models/ErrorLog.model');

/**
 * Replace the parts of a path that vary per request, so every user hitting the
 * same broken endpoint lands in one group instead of thousands.
 *
 *   /users/6952a9aa3b532a50a47cee89/posts  ->  /users/:id/posts
 */
const normalisePath = (path = '') =>
  String(path)
    .split('?')[0]
    .replace(/\/[0-9a-fA-F]{24}(?=\/|$)/g, '/:id')
    .replace(/\/\d+(?=\/|$)/g, '/:n');

/**
 * Same idea for the message, which often carries the offending value.
 * Quoted strings, long hex ids and bare numbers all become placeholders.
 */
const normaliseMessage = (message = '') =>
  String(message)
    .replace(/[0-9a-fA-F]{24}/g, ':id')
    .replace(/"[^"]*"/g, '"?"')
    .replace(/\b\d+\b/g, ':n')
    .slice(0, 300);

const fingerprintOf = (err, method, path) =>
  crypto
    .createHash('sha1')
    .update([err.name || 'Error', normaliseMessage(err.message), method || '', normalisePath(path)].join('|'))
    .digest('hex');

/**
 * Record a server fault.
 *
 * Deliberately fire-and-forget and deliberately silent on failure. This is
 * called from the express error handler, which is the last thing standing
 * between a crash and the client — if writing the log throws, or the database
 * is the very thing that is down, the user must still get their response.
 * A logger that can break the request it is describing is worse than no logger.
 */
const recordError = (err, req, statusCode) => {
  try {
    const method = req?.method;
    const path = req?.originalUrl || req?.url;
    const now = new Date();

    // One atomic upsert: no read-then-write, so concurrent occurrences of the
    // same fault increment cleanly instead of racing to create duplicates.
    ErrorLog.findOneAndUpdate(
      { fingerprint: fingerprintOf(err, method, path) },
      {
        $inc: { count: 1 },
        $set: {
          name: err.name || 'Error',
          message: String(err.message || 'Unknown error').slice(0, 500),
          stack: String(err.stack || '').slice(0, 6000),
          method,
          path: normalisePath(path),
          statusCode,
          lastSeenAt: now,
          lastUserId: req?.user?.sub || req?.user?.id || req?.user?._id,
          // A fault that recurs is not resolved any more, whatever was ticked.
          resolved: false,
        },
        $setOnInsert: { firstSeenAt: now },
      },
      { upsert: true }
    ).catch((writeErr) => {
      console.error('[ErrorLog] Could not record error:', writeErr.message);
    });
  } catch (fatal) {
    console.error('[ErrorLog] Recording threw:', fatal.message);
  }
};

module.exports = { recordError, normalisePath, normaliseMessage };
