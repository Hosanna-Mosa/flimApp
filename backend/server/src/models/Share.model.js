const { Schema, model, Types } = require('mongoose');

const ShareSchema = new Schema(
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
    shareType: {
      type: String,
      enum: ['repost', 'quote', 'external'],
      default: 'repost'
    },
    // For quote shares (sharing with additional commentary)
    caption: { 
      type: String, 
      maxlength: 500,
      trim: true 
    },
    // Track external shares (e.g., WhatsApp, Twitter)
    platform: {
      type: String,
      enum: ['whatsapp', 'twitter', 'facebook', 'instagram', 'other'],
    }
  },
  { timestamps: true }
);

// Indexes for efficient queries
ShareSchema.index({ user: 1, post: 1 }); // User's shares
ShareSchema.index({ post: 1, createdAt: -1 }); // Post's shares
ShareSchema.index({ user: 1, createdAt: -1 }); // User's share history

// Static method to get share count
ShareSchema.statics.getCount = async function(postId) {
  return await this.countDocuments({ post: postId });
};

// Static method to check if user shared a post
ShareSchema.statics.hasShared = async function(userId, postId) {
  const share = await this.findOne({ user: userId, post: postId });
  return !!share;
};

module.exports = model('Share', ShareSchema);
