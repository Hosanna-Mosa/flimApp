const { Schema, model, Types } = require('mongoose');

const PostSchema = new Schema(
  {
    author: { type: Types.ObjectId, ref: 'User', required: true },
    type: {
      type: String,
      enum: ['video', 'audio', 'image', 'script'],
      required: true,
    },
    mediaUrl: { type: String, required: true },
    thumbnailUrl: { type: String },
    caption: { type: String, maxlength: 1000 },
    industries: [{ type: String }],
    roles: [{ type: String }],
    engagement: {
      likes: { type: Number, default: 0 },
      comments: { type: Number, default: 0 },
      shares: { type: Number, default: 0 },
    },
    score: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = model('Post', PostSchema);

