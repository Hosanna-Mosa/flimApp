const { Schema, model, Types } = require('mongoose');

const CommunitySchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, maxlength: 500 },
    type: { type: String, enum: ['industry', 'role', 'project'], required: true },
    industry: { type: String },
    role: { type: String },
    createdBy: { type: Types.ObjectId, ref: 'User', required: true },
    members: [{ type: Types.ObjectId, ref: 'User' }],
  },
  { timestamps: true }
);

module.exports = model('Community', CommunitySchema);

