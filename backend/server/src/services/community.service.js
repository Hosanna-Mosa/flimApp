const Community = require('../models/Community.model');
const CommunityMember = require('../models/CommunityMember.model');
const CommunityPost = require('../models/CommunityPost.model');
const User = require('../models/User.model');

/**
 * Create a new community
 */
const createCommunity = async (payload, creatorId) => {
  const {
    name,
    description,
    avatar,
    coverImage,
    type,
    industry,
    role,
    privacy = 'public',
    tags = []
  } = payload;

  // Create community
  const community = await Community.create({
    name,
    description,
    avatar,
    coverImage,
    type,
    industry,
    role,
    privacy,
    tags,
    createdBy: creatorId,
    admins: [creatorId],
    members: [creatorId],
    memberCount: 1,
    groups: [
      {
        name: 'Announcements',
        description: 'Official announcements from admins',
        type: 'announcement',
        isAnnouncementOnly: true,
        members: [creatorId],
        memberCount: 1
      },
      {
        name: 'General',
        description: 'General discussion',
        type: 'general',
        isAnnouncementOnly: false,
        members: [creatorId],
        memberCount: 1
      }
    ]
  });

  // Create member record for creator
  await CommunityMember.create({
    community: community._id,
    user: creatorId,
    role: 'owner',
    groups: community.groups.map(g => g._id),
    joinedAt: new Date()
  });

  return community;
};

/**
 * List all communities with filters
 */
const listCommunities = async (filters = {}, page = 0, limit = 20, userId = null) => {
  const query = { isActive: true };

  // Apply filters
  if (filters.type) query.type = filters.type;
  if (filters.industry) query.industry = filters.industry;
  if (filters.role) query.role = filters.role;
  if (filters.privacy) query.privacy = filters.privacy;
  if (filters.tags && filters.tags.length > 0) {
    query.tags = { $in: filters.tags };
  }
  if (filters.search) {
    query.$or = [
      { name: { $regex: filters.search, $options: 'i' } },
      { description: { $regex: filters.search, $options: 'i' } }
    ];
  }

  const communities = await Community.find(query)
    .populate('createdBy', 'name avatar isVerified')
    .sort({ 'stats.memberCount': -1, createdAt: -1 })
    .skip(page * limit)
    .limit(limit)
    .lean();

  // Populate isMember status and role if userId provided
  if (userId) {
    communities.forEach(comm => {
      const uId = userId.toString();
      comm.isMember = comm.members.some(m => m.toString() === uId);
      comm.isPending = comm.pendingRequests?.some(r => r.toString() === uId);
      
      // Compute Role
      if (comm.createdBy && (comm.createdBy._id || comm.createdBy).toString() === uId) {
        comm.memberRole = 'owner';
      } else if (comm.admins && comm.admins.some(a => a.toString() === uId)) {
        comm.memberRole = 'admin';
      } else if (comm.moderators && comm.moderators.some(m => m.toString() === uId)) {
        comm.memberRole = 'moderator';
      } else if (comm.isMember) {
        comm.memberRole = 'member';
      }
    });
  }

  const total = await Community.countDocuments(query);

  return {
    data: communities,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  };
};

/**
 * Get user's communities
 */
const getUserCommunities = async (userId, page = 0, limit = 20) => {
  const memberships = await CommunityMember.find({ user: userId })
    .populate({
      path: 'community',
      match: { isActive: true },
      populate: {
        path: 'createdBy',
        select: 'name avatar isVerified'
      }
    })
    .sort({ lastActiveAt: -1 })
    .skip(page * limit)
    .limit(limit)
    .lean();

  const communities = memberships
    .filter(m => m.community)
    .map(m => ({
      ...m.community,
      memberRole: m.role,
      isMember: true,
      joinedAt: m.joinedAt,
      lastActiveAt: m.lastActiveAt
    }));

  const total = await CommunityMember.countDocuments({ user: userId });

  return {
    data: communities,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  };
};

/**
 * Get community by ID
 */
const getCommunity = async (id, userId = null) => {
  const community = await Community.findById(id)
    .populate('createdBy', 'name avatar isVerified bio')
    .populate('admins', 'name avatar isVerified')
    .populate('moderators', 'name avatar isVerified')
    .lean();

  if (!community) {
    throw new Error('Community not found');
  }

  // If user is provided, check their membership status
  if (userId) {
    const membership = await CommunityMember.findOne({
      community: id,
      user: userId
    });

    community.isMember = !!membership;
    community.memberRole = membership?.role || null;
    community.isPending = community.pendingRequests?.some(req => req.toString() === userId.toString());

    // Populate pending requests for admins/owners
    if (membership && ['owner', 'admin'].includes(membership.role)) {
      await Community.populate(community, {
        path: 'pendingRequests',
        select: 'name avatar isVerified bio'
      });
    }
  }

  return community;
};

/**
 * Update community
 */
const updateCommunity = async (id, userId, updates) => {
  const community = await Community.findById(id);
  
  if (!community) {
    throw new Error('Community not found');
  }

  // Check if user is admin
  if (!community.isAdmin(userId)) {
    throw new Error('Only admins can update community');
  }

  // Allowed updates
  const allowedUpdates = [
    'name', 'description', 'avatar', 'coverImage', 
    'privacy', 'tags', 'settings'
  ];

  Object.keys(updates).forEach(key => {
    if (allowedUpdates.includes(key)) {
      if (key === 'settings') {
        community.settings = { ...community.settings, ...updates.settings };
      } else {
        community[key] = updates[key];
      }
    }
  });

  await community.save();
  return community;
};

/**
 * Delete community
 */
const deleteCommunity = async (id, userId) => {
  const community = await Community.findById(id);
  
  if (!community) {
    throw new Error('Community not found');
  }

  // Only owner can delete
  if (!community.createdBy.equals(userId)) {
    throw new Error('Only the owner can delete this community');
  }

  // Soft delete
  community.isActive = false;
  await community.save();

  // Delete all member records
  await CommunityMember.deleteMany({ community: id });

  return { success: true, message: 'Community deleted successfully' };
};

/**
 * Join community
 */
const joinCommunity = async (id, userId) => {
  const community = await Community.findById(id);
  
  if (!community) {
    throw new Error('Community not found');
  }

  // Check if already a member
  const existingMember = await CommunityMember.findOne({
    community: id,
    user: userId
  });

  if (existingMember) {
    return { 
      success: false, 
      message: 'Already a member',
      status: 'already_member'
    };
  }

  // Handle based on privacy
  if (community.privacy === 'public') {
    // Add to members immediately
    community.members.push(userId);
    community.memberCount += 1;
    
    // Add to general group
    const generalGroup = community.groups.find(g => g.type === 'general');
    if (generalGroup) {
      generalGroup.members.push(userId);
      generalGroup.memberCount += 1;
    }
    
    await community.save();

    // Create member record
    await CommunityMember.create({
      community: id,
      user: userId,
      role: 'member',
      groups: generalGroup ? [generalGroup._id] : []
    });

    return {
      success: true,
      message: 'Joined community successfully',
      status: 'joined'
    };
  } else {
    // Add to pending requests
    if (!community.pendingRequests.includes(userId)) {
      community.pendingRequests.push(userId);
      await community.save();
    }

    return {
      success: true,
      message: 'Join request sent',
      status: 'pending'
    };
  }
};

/**
 * Leave community
 */
const leaveCommunity = async (id, userId) => {
  const community = await Community.findById(id);
  
  if (!community) {
    throw new Error('Community not found');
  }

  // Can't leave if you're the owner
  if (community.createdBy.equals(userId)) {
    throw new Error('Owner cannot leave community. Transfer ownership or delete the community.');
  }

  // Remove from members
  community.members = community.members.filter(m => !m.equals(userId));
  community.memberCount = Math.max(0, community.memberCount - 1);
  
  // Remove from all groups
  community.groups.forEach(group => {
    group.members = group.members.filter(m => !m.equals(userId));
    group.memberCount = Math.max(0, group.memberCount - 1);
  });
  
  // Remove from admins/moderators if applicable
  community.admins = community.admins.filter(a => !a.equals(userId));
  community.moderators = community.moderators.filter(m => !m.equals(userId));
  
  await community.save();

  // Delete member record
  await CommunityMember.deleteOne({ community: id, user: userId });

  return {
    success: true,
    message: 'Left community successfully'
  };
};

/**
 * Approve join request
 */
const approveJoinRequest = async (communityId, userId, adminId) => {
  const community = await Community.findById(communityId);
  
  if (!community) {
    throw new Error('Community not found');
  }

  // Check if requester is admin
  if (!community.isAdmin(adminId)) {
    throw new Error('Only admins can approve requests');
  }

  // Check if user has pending request
  if (!community.pendingRequests.some(req => req.equals(userId))) {
    throw new Error('No pending request found');
  }

  // Remove from pending
  community.pendingRequests = community.pendingRequests.filter(
    req => !req.equals(userId)
  );
  
  // Add to members
  community.members.push(userId);
  community.memberCount += 1;
  
  // Add to general group
  const generalGroup = community.groups.find(g => g.type === 'general');
  if (generalGroup) {
    generalGroup.members.push(userId);
    generalGroup.memberCount += 1;
  }
  
  await community.save();

  // Create member record
  await CommunityMember.create({
    community: communityId,
    user: userId,
    role: 'member',
    groups: generalGroup ? [generalGroup._id] : []
  });

  return {
    success: true,
    message: 'Join request approved'
  };
};

/**
 * Reject join request
 */
const rejectJoinRequest = async (communityId, userId, adminId) => {
  const community = await Community.findById(communityId);
  
  if (!community) {
    throw new Error('Community not found');
  }

  // Check if requester is admin
  if (!community.isAdmin(adminId)) {
    throw new Error('Only admins can reject requests');
  }

  // Remove from pending
  community.pendingRequests = community.pendingRequests.filter(
    req => !req.equals(userId)
  );
  
  await community.save();

  return {
    success: true,
    message: 'Join request rejected'
  };
};

/**
 * Get community members
 */
const getCommunityMembers = async (communityId, page = 0, limit = 50) => {
  const members = await CommunityMember.find({ community: communityId })
    .populate('user', 'name avatar isVerified bio roles industries')
    .sort({ role: 1, joinedAt: -1 })
    .skip(page * limit)
    .limit(limit)
    .lean();

  const total = await CommunityMember.countDocuments({ community: communityId });

  return {
    data: members,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  };
};

/**
 * Update member role
 */
const updateMemberRole = async (communityId, targetUserId, newRole, adminId) => {
  const community = await Community.findById(communityId);
  
  if (!community) {
    throw new Error('Community not found');
  }

  // Check permissions
  const adminMember = await CommunityMember.findOne({
    community: communityId,
    user: adminId
  });

  if (!adminMember || !['owner', 'admin'].includes(adminMember.role)) {
    throw new Error('Insufficient permissions');
  }

  // Can't change owner role
  if (community.createdBy.equals(targetUserId)) {
    throw new Error('Cannot change owner role');
  }

  // Update member record
  const member = await CommunityMember.findOneAndUpdate(
    { community: communityId, user: targetUserId },
    { role: newRole },
    { new: true }
  );

  // Update community arrays
  if (newRole === 'admin') {
    if (!community.admins.includes(targetUserId)) {
      community.admins.push(targetUserId);
    }
    community.moderators = community.moderators.filter(m => !m.equals(targetUserId));
  } else if (newRole === 'moderator') {
    if (!community.moderators.includes(targetUserId)) {
      community.moderators.push(targetUserId);
    }
    community.admins = community.admins.filter(a => !a.equals(targetUserId));
  } else {
    community.admins = community.admins.filter(a => !a.equals(targetUserId));
    community.moderators = community.moderators.filter(m => !m.equals(targetUserId));
  }

  await community.save();

  return member;
};

/**
 * Remove member
 */
const removeMember = async (communityId, targetUserId, adminId) => {
  const community = await Community.findById(communityId);
  
  if (!community) {
    throw new Error('Community not found');
  }

  // Check if requester is admin
  if (!community.isAdmin(adminId)) {
    throw new Error('Only admins can remove members');
  }

  // Can't remove owner
  if (community.createdBy.equals(targetUserId)) {
    throw new Error('Cannot remove community owner');
  }

  // Remove from community (same as leave)
  return leaveCommunity(communityId, targetUserId);
};

module.exports = {
  createCommunity,
  listCommunities,
  getUserCommunities,
  getCommunity,
  updateCommunity,
  deleteCommunity,
  joinCommunity,
  leaveCommunity,
  approveJoinRequest,
  rejectJoinRequest,
  getCommunityMembers,
  updateMemberRole,
  removeMember
};
