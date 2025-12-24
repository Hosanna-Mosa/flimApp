const { Schema, model, Types } = require('mongoose');

const FollowSchema = new Schema(
  {
    follower: { 
      type: Types.ObjectId, 
      ref: 'User', 
      required: true,
      index: true 
    },
    following: { 
      type: Types.ObjectId, 
      ref: 'User', 
      required: true,
      index: true 
    },
    status: {
      type: String,
      enum: ['pending', 'accepted'],
      default: 'accepted' // Auto-accept for public accounts
    },
  },
  { timestamps: true }
);

// Compound indexes for efficient queries
FollowSchema.index({ follower: 1, following: 1 }, { unique: true }); // Prevent duplicate follows
FollowSchema.index({ following: 1, status: 1, createdAt: -1 }); // Get user's followers
FollowSchema.index({ follower: 1, status: 1, createdAt: -1 }); // Get user's following

// Static method to check if user follows another
FollowSchema.statics.isFollowing = async function(followerId, followingId) {
  const follow = await this.findOne({
    follower: followerId,
    following: followingId,
    status: 'accepted'
  });
  return !!follow;
};

// Static method to get mutual followers
FollowSchema.statics.getMutualFollowers = async function(userId1, userId2) {
  const user1Followers = await this.find({ 
    following: userId1, 
    status: 'accepted' 
  }).select('follower');
  
  const user2Followers = await this.find({ 
    following: userId2, 
    status: 'accepted' 
  }).select('follower');
  
  const user1FollowerIds = new Set(user1Followers.map(f => f.follower.toString()));
  const mutualFollowers = user2Followers.filter(f => 
    user1FollowerIds.has(f.follower.toString())
  );
  
  return mutualFollowers.length;
};

module.exports = model('Follow', FollowSchema);
