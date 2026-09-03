const { Schema, model, Types } = require('mongoose');

/**
 * A report filed by a user against a post, comment, or another user.
 *
 * Written by moderation.controller.reportContent and, until the admin queue
 * existed, read by nothing — every report sat pending and unseen.
 *
 * Apple's Guideline 1.2 expects objectionable content reports to be acted on
 * within 24 hours; India's IT Rules 2021 expect a grievance to be acknowledged
 * within 24 hours and resolved within 15 days. Both clocks run from createdAt,
 * so nothing here stores a deadline — it is derived at read time and cannot
 * drift out of step with a policy change.
 */
const RESOLUTIONS = [
  'content_removed',
  'user_warned',
  'user_suspended',
  'no_action',
  'escalated',
];

const ReportSchema = new Schema(
  {
    reporterId: { type: Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: ['post', 'user', 'comment'], required: true },
    targetId: { type: Types.ObjectId, required: true },
    reason: { type: String, default: 'inappropriate' },
    status: { type: String, enum: ['pending', 'reviewed', 'resolved'], default: 'pending' },

    /** What the reviewer actually did. Set together with status 'resolved'. */
    resolution: { type: String, enum: RESOLUTIONS },

    reviewedBy: { type: Types.ObjectId, ref: 'Admin' },
    reviewedByName: { type: String },
    reviewedAt: { type: Date },

    /** Internal only — never shown to the reporter or the reported user. */
    adminNotes: { type: String, maxlength: 2000 },

    escalatedAt: { type: Date },
  },
  { timestamps: true }
);

ReportSchema.index({ type: 1 });
ReportSchema.index({ status: 1 });
// The queue is always "open reports, oldest first".
ReportSchema.index({ status: 1, createdAt: 1 });
// Counting how many people reported the same thing.
ReportSchema.index({ targetId: 1, status: 1 });

module.exports = model('Report', ReportSchema);
module.exports.RESOLUTIONS = RESOLUTIONS;
