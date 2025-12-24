const { Schema, model, Types } = require('mongoose');

const CommentSchema = new Schema(
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
    content: { 
      type: String, 
      required: true, 
      maxlength: 500,
      trim: true 
    },
    // For nested replies
    parentComment: { 
      type: Types.ObjectId, 
      ref: 'Comment',
      default: null,
      index: true
    },
    // Denormalized counts
    likesCount: { type: Number, default: 0 },
    repliesCount: { type: Number, default: 0 },
    
    // Status
    isActive: { type: Boolean, default: true },
    isEdited: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Indexes for efficient queries
CommentSchema.index({ post: 1, createdAt: -1 }); // Get post's comments
CommentSchema.index({ parentComment: 1, createdAt: -1 }); // Get comment's replies
CommentSchema.index({ user: 1, createdAt: -1 }); // Get user's comments
CommentSchema.index({ post: 1, isActive: 1, parentComment: 1, createdAt: -1 }); // Active top-level comments

// Virtual for reply depth (to prevent too deep nesting)
CommentSchema.virtual('isReply').get(function() {
  return this.parentComment !== null;
});

// Method to get all replies
CommentSchema.methods.getReplies = async function() {
  return await this.model('Comment').find({ 
    parentComment: this._id,
    isActive: true 
  }).populate('user', 'name avatar isVerified');
};

module.exports = model('Comment', CommentSchema);
