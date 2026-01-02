const { Schema, model, Types } = require('mongoose');

const VerificationLogSchema = new Schema(
  {
    userId: { type: Types.ObjectId, ref: 'User', required: true },
    userName: { type: String, required: true },
    userAvatar: { type: String },
    action: { 
      type: String, 
      enum: ['APPROVE', 'REJECT', 'REVOKE'], 
      required: true 
    },
    adminId: { type: Types.ObjectId, ref: 'Admin', required: true },
    adminName: { type: String, required: true },
    notes: { type: String },
    timestamp: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

// Indexes
VerificationLogSchema.index({ userId: 1 });
VerificationLogSchema.index({ adminId: 1 });
VerificationLogSchema.index({ timestamp: -1 });

module.exports = model('VerificationLog', VerificationLogSchema);
