const { Schema, model, Types } = require('mongoose');

const GroupSchema = new Schema({
  name: { type: String, required: true, trim: true },
  description: { type: String, maxlength: 500 },
  type: { 
    type: String, 
    enum: ['announcement', 'discussion', 'general'], 
    default: 'general' 
  },
  isAnnouncementOnly: { type: Boolean, default: false },
  members: [{ type: Types.ObjectId, ref: 'User' }],
  memberCount: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

const CommunitySchema = new Schema(
  {
    // Basic Info
    name: { type: String, required: true, trim: true },
    description: { type: String, maxlength: 1000 },
    avatar: { type: String },
    coverImage: { type: String },
    
    // Type & Category
    type: { 
      type: String, 
      enum: ['industry', 'role', 'project', 'general'], 
      required: true 
    },
    industry: { type: String },
    role: { type: String },
    
    // Privacy & Access
    privacy: { 
      type: String, 
      enum: ['public', 'private', 'invite-only'], 
      default: 'public' 
    },
    isVerified: { type: Boolean, default: false },
    
    // Management
    createdBy: { type: Types.ObjectId, ref: 'User', required: true },
    admins: [{ type: Types.ObjectId, ref: 'User' }],
    moderators: [{ type: Types.ObjectId, ref: 'User' }],
    
    // Members
    members: [{ type: Types.ObjectId, ref: 'User' }],
    memberCount: { type: Number, default: 0 },
    pendingRequests: [{ type: Types.ObjectId, ref: 'User' }],
    
    // Groups/Channels within Community
    groups: [GroupSchema],
    
    // Settings
    settings: {
      allowMemberInvites: { type: Boolean, default: true },
      requireApproval: { type: Boolean, default: false },
      allowGroupCreation: { type: Boolean, default: false },
      maxGroups: { type: Number, default: 10 }
    },
    
    // Stats
    stats: {
      totalPosts: { type: Number, default: 0 },
      totalMessages: { type: Number, default: 0 },
      activeMembers: { type: Number, default: 0 }
    },
    
    // Metadata
    tags: [{ type: String }],
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

// Indexes for performance
CommunitySchema.index({ type: 1, privacy: 1 });
CommunitySchema.index({ members: 1 });
CommunitySchema.index({ 'stats.memberCount': -1 });
CommunitySchema.index({ industry: 1 });
CommunitySchema.index({ role: 1 });
CommunitySchema.index({ tags: 1 });
CommunitySchema.index({ isActive: 1, privacy: 1 });

// Virtual for checking if user is admin
CommunitySchema.methods.isAdmin = function(userId) {
  return this.createdBy.equals(userId) || 
         this.admins.some(admin => admin.equals(userId));
};

// Virtual for checking if user is moderator
CommunitySchema.methods.isModerator = function(userId) {
  return this.isAdmin(userId) || 
         this.moderators.some(mod => mod.equals(userId));
};

// Virtual for checking if user is member
CommunitySchema.methods.isMember = function(userId) {
  return this.members.some(member => member.equals(userId));
};

module.exports = model('Community', CommunitySchema);
