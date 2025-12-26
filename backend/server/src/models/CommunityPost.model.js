const { Schema, model, Types } = require('mongoose');

const CommunityPostSchema = new Schema(
  {
    community: { 
      type: Types.ObjectId, 
      ref: 'Community', 
      required: true,
      index: true 
    },
    group: { 
      type: Types.ObjectId, 
      required: true,
      index: true 
    },
    author: { 
      type: Types.ObjectId, 
      ref: 'User', 
      required: true,
      index: true 
    },
    
    // Content
    type: { 
      type: String, 
      enum: ['text', 'image', 'video', 'poll', 'announcement'], 
      default: 'text' 
    },
    content: { type: String, required: true, maxlength: 5000 },
    media: [{
      url: { type: String, required: true },
      type: { type: String, enum: ['image', 'video', 'document'] },
      thumbnail: { type: String },
      size: { type: Number },
      format: { type: String }
    }],
    
    // Poll (if type=poll)
    poll: {
      question: { type: String },
      options: [{
        text: { type: String, required: true },
        votes: [{ type: Types.ObjectId, ref: 'User' }]
      }],
      endsAt: { type: Date },
      allowMultiple: { type: Boolean, default: false }
    },
    
    // Engagement
    likes: [{ type: Types.ObjectId, ref: 'User' }],
    likesCount: { type: Number, default: 0 },
    comments: [{ type: Types.ObjectId, ref: 'Comment' }],
    commentsCount: { type: Number, default: 0 },
    
    // Moderation
    isPinned: { type: Boolean, default: false },
    pinnedAt: { type: Date },
    pinnedBy: { type: Types.ObjectId, ref: 'User' },
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date },
    deletedBy: { type: Types.ObjectId, ref: 'User' }
  },
  { timestamps: true }
);

// Indexes
CommunityPostSchema.index({ community: 1, createdAt: -1 });
CommunityPostSchema.index({ group: 1, createdAt: -1 });
CommunityPostSchema.index({ isPinned: 1, createdAt: -1 });
CommunityPostSchema.index({ author: 1, createdAt: -1 });
CommunityPostSchema.index({ isDeleted: 1 });

// Method to check if user has voted in poll
CommunityPostSchema.methods.hasVoted = function(userId) {
  if (!this.poll || !this.poll.options) return false;
  return this.poll.options.some(option => 
    option.votes.some(vote => vote.equals(userId))
  );
};

module.exports = model('CommunityPost', CommunityPostSchema);
