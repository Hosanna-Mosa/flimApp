const logger = require('../config/logger');
const { fail } = require('../utils/response');

// Mongoose throws these for malformed input rather than genuine server faults.
// Without translating them, a bad id in a URL (e.g. /posts/feed) surfaces as a
// 500 and pollutes error monitoring.
const normalize = (err) => {
  if (err.status) return { status: err.status, message: err.message };
  if (err.name === 'CastError') {
    return { status: 400, message: `Invalid ${err.path || 'identifier'}` };
  }
  if (err.name === 'ValidationError') {
    const first = Object.values(err.errors || {})[0];
    return { status: 400, message: first?.message || 'Validation failed' };
  }
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern || {})[0];
    return { status: 409, message: field ? `${field} already exists` : 'Already exists' };
  }
  return { status: 500, message: err.message };
};

// eslint-disable-next-line no-unused-vars
module.exports = (err, req, res, next) => {
  logger.error(err.message, { stack: err.stack });
  if (res.headersSent) return;

  const { status, message } = normalize(err);

  // Never expose 500 internal/database error messages to the client
  return fail(res, status >= 500 ? 'Internal Server Error' : message, status);
};
