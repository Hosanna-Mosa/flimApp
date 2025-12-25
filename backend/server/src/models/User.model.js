const { Schema, model, Types } = require('mongoose');

const UserSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    phone: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    avatar: { type: String },
    bio: { type: String, maxlength: 500 },
    roles: [{ type: String, required: true }],
    industries: [{ type: String, required: true }],
    experience: { type: Number, default: 0 },
    location: { type: String },
    portfolio: [
      {
        title: String,
        type: { type: String },
        url: String,
      },
    ],
    
    // Social Features
    isVerified: { type: Boolean, default: false },
    accountType: { 
      type: String, 
      enum: ['public', 'private', 'business'], 
      default: 'public' 
    },
    
    // Denormalized Stats (for performance)
    stats: {
      followersCount: { type: Number, default: 0 },
      followingCount: { type: Number, default: 0 },
      postsCount: { type: Number, default: 0 },
      likesReceived: { type: Number, default: 0 }
    },
    
    // Recent posts reference (limit to last 100 for quick access)
    posts: [{ type: Types.ObjectId, ref: 'Post' }],
    
    // Privacy Settings
    privacy: {
      showFollowers: { type: Boolean, default: true },
      showFollowing: { type: Boolean, default: true },
      allowComments: { type: Boolean, default: true },
      allowShares: { type: Boolean, default: true },
      allowMessages: { type: Boolean, default: true }
    },
    
    refreshTokens: [{ type: String }],
    pushTokens: [{ type: String }],
    lastLoginAt: { type: Date },
  },
  { timestamps: true }
);

// Indexes for performance
UserSchema.index({ email: 1 });
UserSchema.index({ phone: 1 });
UserSchema.index({ 'stats.followersCount': -1 });
UserSchema.index({ roles: 1 });
UserSchema.index({ industries: 1 });

// Virtual for public profile
UserSchema.virtual('publicProfile').get(function() {
  return {
    id: this._id,
    name: this.name,
    avatar: this.avatar,
    bio: this.bio,
    roles: this.roles,
    industries: this.industries,
    isVerified: this.isVerified,
    accountType: this.accountType,
    stats: this.stats
  };
});

module.exports = model('User', UserSchema);

