const { Schema, model, Types } = require('mongoose');

/**
 * Every consequential admin action, across all modules.
 *
 * VerificationLog already covers approve/reject/revoke decisions in detail and
 * stays as it is; this is the wider trail that previously did not exist, so
 * wallet adjustments, suspensions and config changes left no record at all.
 *
 * Admin identity is denormalised because the log has to stay readable after an
 * admin account is deleted.
 */
const AdminAuditLogSchema = new Schema(
  {
    adminId: { type: Types.ObjectId, ref: 'Admin', required: true },
    adminName: { type: String, required: true },
    adminRole: { type: String, required: true },

    action: { type: String, required: true },

    targetType: { type: String },
    targetId: { type: Types.ObjectId },
    targetLabel: { type: String },

    /** One line, already written for a human reader. */
    summary: { type: String, required: true },

    /** Before/after values, request body, whatever the action needs. */
    meta: { type: Schema.Types.Mixed },

    ip: { type: String },
  },
  { timestamps: true }
);

AdminAuditLogSchema.index({ createdAt: -1 });
AdminAuditLogSchema.index({ adminId: 1, createdAt: -1 });
AdminAuditLogSchema.index({ targetId: 1, createdAt: -1 });
AdminAuditLogSchema.index({ action: 1, createdAt: -1 });

module.exports = model('AdminAuditLog', AdminAuditLogSchema);
