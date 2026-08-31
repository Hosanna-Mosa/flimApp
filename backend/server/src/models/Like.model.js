const { Schema, model, Types } = require('mongoose');

const LikeSchema = new Schema(
  {
    user: { 
      type: Types.ObjectId, 
      ref: 'User', 
      required: true,
      index: true 
    },
    post: { 
      type: Types.ObjectId, 
      ref: 'Post', 
      required: true,
      index: true 
    },
    // Optional: Track like type for future features (love, haha, etc.)
    type: {
      type: String,
      enum: ['like', 'love', 'celebrate'],
      default: 'like'
    }
  },
  { timestamps: true }
);

// Compound index to prevent duplicate likes and enable fast lookups
LikeSchema.index({ user: 1, post: 1 }, { unique: true });
LikeSchema.index({ post: 1, createdAt: -1 }); // Get post's likes chronologically
LikeSchema.index({ user: 1, createdAt: -1 }); // Get user's liked posts

module.exports = model('Like', LikeSchema);
