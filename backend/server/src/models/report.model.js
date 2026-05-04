const { Schema, model, Types } = require('mongoose');

const ReportSchema = new Schema(
  {
    reporterId: { type: Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: ['post', 'user', 'comment'], required: true },
    targetId: { type: Types.ObjectId, required: true },
    reason: { type: String, default: 'inappropriate' },
    status: { type: String, enum: ['pending', 'reviewed', 'resolved'], default: 'pending' },
  },
  { timestamps: true }
);

ReportSchema.index({ type: 1 });
ReportSchema.index({ status: 1 });

module.exports = model('Report', ReportSchema);
