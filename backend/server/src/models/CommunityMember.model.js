const { Schema, model, Types } = require('mongoose');

const CommunityMemberSchema = new Schema(
  {
    community: { 
      type: Types.ObjectId, 
      ref: 'Community', 
      required: true,
      index: true 
    },
    user: { 
      type: Types.ObjectId, 
      ref: 'User', 
      required: true,
      index: true 
    },
    
    // Role
    role: { 
      type: String, 
      enum: ['owner', 'admin', 'moderator', 'member'], 
      default: 'member' 
    },
    
    // Groups they're in
    groups: [{ type: Types.ObjectId }],
    
    // Settings
    notificationSettings: {
      announcements: { type: Boolean, default: true },
      allPosts: { type: Boolean, default: true },
      mentions: { type: Boolean, default: true },
      groupMessages: { type: Map, of: String, default: {} } // groupId -> 'all' | 'mentions' | 'none'
    },
    
    // Stats
    joinedAt: { type: Date, default: Date.now },
    lastActiveAt: { type: Date, default: Date.now },
    postsCount: { type: Number, default: 0 },
    messagesCount: { type: Number, default: 0 },
    
    // Status
    isMuted: { type: Boolean, default: false },
    mutedUntil: { type: Date },
    isBanned: { type: Boolean, default: false },
    bannedAt: { type: Date },
    bannedBy: { type: Types.ObjectId, ref: 'User' },
    banReason: { type: String }
  },
  { timestamps: true }
);

// Compound unique index to prevent duplicate memberships
CommunityMemberSchema.index({ community: 1, user: 1 }, { unique: true });
CommunityMemberSchema.index({ user: 1, joinedAt: -1 });
CommunityMemberSchema.index({ role: 1 });

// Method to check if member can post
CommunityMemberSchema.methods.canPost = function() {
  return !this.isMuted && !this.isBanned;
};

// Method to check if member is admin or higher
CommunityMemberSchema.methods.isAdminOrHigher = function() {
  return ['owner', 'admin'].includes(this.role);
};

// Method to check if member is moderator or higher
CommunityMemberSchema.methods.isModeratorOrHigher = function() {
  return ['owner', 'admin', 'moderator'].includes(this.role);
};

module.exports = model('CommunityMember', CommunityMemberSchema);
