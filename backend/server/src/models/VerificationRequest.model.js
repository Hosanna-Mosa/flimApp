const { Schema, model, Types } = require('mongoose');

const VerificationDocumentSchema = new Schema({
  type: { 
    type: String, 
    enum: ['ID_DOCUMENT', 'PROOF_OF_WORK', 'SOCIAL_LINK', 'OTHER'], 
    required: true 
  },
  url: { type: String, required: true },
  name: { type: String, required: true }
});

const VerificationRequestSchema = new Schema(
  {
    user: { type: Types.ObjectId, ref: 'User', required: true },
    verificationType: { 
      type: String, 
      enum: ['CREATOR', 'CELEBRITY', 'BRAND', 'PUBLIC_FIGURE', 'JOURNALIST'], 
      required: true 
    },
    status: { 
      type: String, 
      enum: ['PENDING', 'APPROVED', 'REJECTED'], 
      default: 'PENDING' 
    },
    reason: { type: String, required: true },
    documents: [VerificationDocumentSchema],
    adminNotes: { type: String },
    reviewedAt: { type: Date },
    reviewedBy: { type: Types.ObjectId, ref: 'Admin' },
  },
  { timestamps: true }
);

// Indexes
VerificationRequestSchema.index({ user: 1 });
VerificationRequestSchema.index({ status: 1 });
VerificationRequestSchema.index({ createdAt: -1 });

module.exports = model('VerificationRequest', VerificationRequestSchema);
