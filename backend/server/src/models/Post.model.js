const { Schema, model, Types } = require('mongoose');

const PostSchema = new Schema(
  {
    author: { type: Types.ObjectId, ref: 'User', required: true, index: true },
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
    
    // Denormalized Engagement Counts (for performance)
    engagement: {
      likesCount: { type: Number, default: 0, index: true },
      commentsCount: { type: Number, default: 0 },
      sharesCount: { type: Number, default: 0 },
      viewsCount: { type: Number, default: 0 }
    },
    
    // Visibility & Privacy
    visibility: { 
      type: String, 
      enum: ['public', 'followers', 'private'], 
      default: 'public' 
    },
    
    // Status
    isActive: { type: Boolean, default: true },
    
    // Algorithmic Score (for feed ranking)
    score: { type: Number, default: 0, index: true },
  },
  { timestamps: true }
);

// Compound Indexes for efficient queries
PostSchema.index({ author: 1, createdAt: -1 }); // User's posts timeline
PostSchema.index({ 'engagement.likesCount': -1, createdAt: -1 }); // Trending posts
PostSchema.index({ industries: 1, createdAt: -1 }); // Industry-specific feed
PostSchema.index({ score: -1, createdAt: -1 }); // Algorithmic feed
PostSchema.index({ isActive: 1, visibility: 1, createdAt: -1 }); // Active public posts

// Method to calculate engagement score
PostSchema.methods.calculateScore = function() {
  const ageInHours = (Date.now() - this.createdAt) / (1000 * 60 * 60);
  const engagementScore = Math.log(
    this.engagement.likesCount + 
    this.engagement.commentsCount * 2 + 
    this.engagement.sharesCount * 3 + 
    1
  );
  const recencyScore = 1 / (ageInHours + 1);
  
  this.score = (engagementScore * 0.6) + (recencyScore * 0.4);
  return this.score;
};

module.exports = model('Post', PostSchema);

