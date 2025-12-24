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

// Static method to check if user liked a post
LikeSchema.statics.hasLiked = async function(userId, postId) {
  const like = await this.findOne({ user: userId, post: postId });
  return !!like;
};

// Static method to get like count for a post
LikeSchema.statics.getCount = async function(postId) {
  return await this.countDocuments({ post: postId });
};

module.exports = model('Like', LikeSchema);
