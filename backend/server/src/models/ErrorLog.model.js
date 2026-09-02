const { Schema, model, Types } = require('mongoose');

/**
 * Server faults, grouped rather than listed.
 *
 * One row per distinct fault, not per occurrence: the same bug hit five
 * thousand times is one document with count 5000. Storing every occurrence is
 * what makes self-hosted error logging dangerous — a single failing endpoint in
 * a retry loop can write faster than anyone reads, and the logging then takes
 * down the database it was meant to help diagnose.
 *
 * Only genuine faults are recorded (status >= 500). A bad id in a URL is a
 * client mistake already normalised to a 400 by error.middleware, and recording
 * those would bury the real problems.
 */
const ErrorLogSchema = new Schema(
  {
    /** Hash of name + shape of the message + method + route. */
    fingerprint: { type: String, required: true, unique: true, index: true },

    name: { type: String, required: true },
    message: { type: String, required: true },
    /** Stack from the most recent occurrence. */
    stack: { type: String },

    method: { type: String },
    /** Route with ids replaced, so /users/abc and /users/def group together. */
    path: { type: String },
    statusCode: { type: Number },

    count: { type: Number, default: 1 },
    firstSeenAt: { type: Date, default: Date.now },
    lastSeenAt: { type: Date, default: Date.now },

    /** Who hit it last — enough to reply to a support ticket about it. */
    lastUserId: { type: Types.ObjectId, ref: 'User' },

    resolved: { type: Boolean, default: false },
    resolvedBy: { type: Types.ObjectId, ref: 'Admin' },
    resolvedByName: { type: String },
    resolvedAt: { type: Date },
  },
  { timestamps: true }
);

// Newest fault first is the default view.
ErrorLogSchema.index({ lastSeenAt: -1 });
ErrorLogSchema.index({ resolved: 1, lastSeenAt: -1 });

// Retention. Mongo drops a group 30 days after it was last seen, so a fault
// that stops happening disappears on its own and nobody has to prune anything.
ErrorLogSchema.index({ lastSeenAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 30 });

module.exports = model('ErrorLog', ErrorLogSchema);
