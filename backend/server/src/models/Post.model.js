const { Schema, model, Types } = require('mongoose');

const PostSchema = new Schema(
  {
    author: { type: Types.ObjectId, ref: 'User', required: true, index: true },
    type: {
      type: String,
      enum: ['video', 'audio', 'image', 'script', 'text'],
      required: true,
    },

    // Legacy fields (kept for backward compatibility)
    mediaUrl: { type: String },
    thumbnailUrl: { type: String },

    // Enhanced media metadata (NEW - Production ready)
    media: {
      url: { type: String }, // Main media URL from Cloudinary
      thumbnail: { type: String }, // Thumbnail URL (for videos)
      duration: { type: Number }, // Duration in seconds (for video/audio)
      format: { type: String }, // File format (mp4, jpg, pdf, etc.)
      size: { type: Number }, // File size in bytes
      width: { type: Number }, // Image/video width
      height: { type: Number }, // Image/video height
      pages: { type: Number }, // Number of pages for scripts/PDFs
      publicId: { type: String }, // Cloudinary public ID for management
    },

    caption: { type: String, maxlength: 1000 },
    industries: [{ type: String }],
    roles: { type: [String], default: [] },

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

    // Donation Flag
    isDonation: { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
);

// Compound Indexes for efficient queries
PostSchema.index({ author: 1, createdAt: -1 }); // User's posts timeline
PostSchema.index({ 'engagement.likesCount': -1, createdAt: -1 }); // Trending posts
PostSchema.index({ industries: 1, createdAt: -1 }); // Industry-specific feed
PostSchema.index({ score: -1, createdAt: -1 }); // Algorithmic feed
PostSchema.index({ isActive: 1, visibility: 1, createdAt: -1 }); // Active public posts

// Virtual for backward compatibility
PostSchema.virtual('mediaUrlCompat').get(function () {
  return this.media?.url || this.mediaUrl;
});

PostSchema.virtual('thumbnailUrlCompat').get(function () {
  return this.media?.thumbnail || this.thumbnailUrl;
});

// Method to populate compatible media fields for legacy posts
PostSchema.pre('validate', function (next) {
  if ((!this.media || !this.media.url) && this.mediaUrl) {
    if (!this.media) this.media = {};
    this.media.url = this.mediaUrl;
  }
  next();
});

// Method to calculate engagement score
PostSchema.methods.calculateScore = function () {
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
