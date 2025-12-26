const Community = require('../models/Community.model');
const CommunityMember = require('../models/CommunityMember.model');

/**
 * Create a new group within a community
 */
const createGroup = async (communityId, groupData, userId) => {
  const community = await Community.findById(communityId);
  
  if (!community) {
    throw new Error('Community not found');
  }

  // Check if user is admin or if members can create groups
  const member = await CommunityMember.findOne({
    community: communityId,
    user: userId
  });

  if (!member) {
    throw new Error('You must be a member to create groups');
  }

  const canCreate = member.isAdminOrHigher() || community.settings.allowGroupCreation;
  
  if (!canCreate) {
    throw new Error('Insufficient permissions to create groups');
  }

  // Check max groups limit
  if (community.groups.length >= community.settings.maxGroups) {
    throw new Error(`Maximum number of groups (${community.settings.maxGroups}) reached`);
  }

  // Create new group
  const newGroup = {
    name: groupData.name,
    description: groupData.description || '',
    type: groupData.type || 'general',
    isAnnouncementOnly: groupData.isAnnouncementOnly || false,
    members: [userId], // Creator is automatically added
    memberCount: 1
  };

  community.groups.push(newGroup);
  await community.save();

  // Add group to creator's member record
  const createdGroup = community.groups[community.groups.length - 1];
  member.groups.push(createdGroup._id);
  await member.save();

  return createdGroup;
};

/**
 * Get all groups in a community
 */
const getGroups = async (communityId, userId = null) => {
  const community = await Community.findById(communityId).lean();
  
  if (!community) {
    throw new Error('Community not found');
  }

  let groups = community.groups;

  // If user is provided, mark which groups they're in
  if (userId) {
    const member = await CommunityMember.findOne({
      community: communityId,
      user: userId
    });

    groups = groups.map(group => ({
      ...group,
      isMember: member?.groups.some(g => g.equals(group._id)) || false
    }));
  }

  return groups;
};

/**
 * Get a specific group
 */
const getGroup = async (communityId, groupId) => {
  const community = await Community.findById(communityId).lean();
  
  if (!community) {
    throw new Error('Community not found');
  }

  const group = community.groups.find(g => g._id.toString() === groupId);
  
  if (!group) {
    throw new Error('Group not found');
  }

  return group;
};

/**
 * Update a group
 */
const updateGroup = async (communityId, groupId, updates, userId) => {
  const community = await Community.findById(communityId);
  
  if (!community) {
    throw new Error('Community not found');
  }

  // Check if user is admin
  if (!community.isAdmin(userId)) {
    throw new Error('Only admins can update groups');
  }

  const group = community.groups.id(groupId);
  
  if (!group) {
    throw new Error('Group not found');
  }

  // Update allowed fields
  if (updates.name) group.name = updates.name;
  if (updates.description !== undefined) group.description = updates.description;
  if (updates.type) group.type = updates.type;
  if (updates.isAnnouncementOnly !== undefined) {
    group.isAnnouncementOnly = updates.isAnnouncementOnly;
  }

  await community.save();
  return group;
};

/**
 * Delete a group
 */
const deleteGroup = async (communityId, groupId, userId) => {
  const community = await Community.findById(communityId);
  
  if (!community) {
    throw new Error('Community not found');
  }

  // Check if user is admin
  if (!community.isAdmin(userId)) {
    throw new Error('Only admins can delete groups');
  }

  const group = community.groups.id(groupId);
  
  if (!group) {
    throw new Error('Group not found');
  }

  // Can't delete announcement or general groups
  if (group.type === 'announcement' || group.name === 'General') {
    throw new Error('Cannot delete default groups');
  }

  // Remove group
  community.groups.pull(groupId);
  await community.save();

  // Remove group from all member records
  await CommunityMember.updateMany(
    { community: communityId },
    { $pull: { groups: groupId } }
  );

  return { success: true, message: 'Group deleted successfully' };
};

/**
 * Join a group
 */
const joinGroup = async (communityId, groupId, userId) => {
  const community = await Community.findById(communityId);
  
  if (!community) {
    throw new Error('Community not found');
  }

  // Check if user is a community member
  const member = await CommunityMember.findOne({
    community: communityId,
    user: userId
  });

  if (!member) {
    throw new Error('You must be a community member to join groups');
  }

  const group = community.groups.id(groupId);
  
  if (!group) {
    throw new Error('Group not found');
  }

  // Check if already in group
  if (group.members.includes(userId)) {
    return { 
      success: false, 
      message: 'Already a member of this group' 
    };
  }

  // Add to group
  group.members.push(userId);
  group.memberCount += 1;
  await community.save();

  // Add to member's groups
  if (!member.groups.includes(groupId)) {
    member.groups.push(groupId);
    await member.save();
  }

  return {
    success: true,
    message: 'Joined group successfully'
  };
};

/**
 * Leave a group
 */
const leaveGroup = async (communityId, groupId, userId) => {
  const community = await Community.findById(communityId);
  
  if (!community) {
    throw new Error('Community not found');
  }

  const group = community.groups.id(groupId);
  
  if (!group) {
    throw new Error('Group not found');
  }

  // Can't leave announcement or general groups
  if (group.type === 'announcement' || group.name === 'General') {
    throw new Error('Cannot leave default groups');
  }

  // Remove from group
  group.members = group.members.filter(m => !m.equals(userId));
  group.memberCount = Math.max(0, group.memberCount - 1);
  await community.save();

  // Remove from member's groups
  await CommunityMember.updateOne(
    { community: communityId, user: userId },
    { $pull: { groups: groupId } }
  );

  return {
    success: true,
    message: 'Left group successfully'
  };
};

/**
 * Get group members
 */
const getGroupMembers = async (communityId, groupId, page = 0, limit = 50) => {
  const community = await Community.findById(communityId)
    .populate({
      path: 'groups.$*.members',
      select: 'name avatar isVerified bio'
    })
    .lean();
  
  if (!community) {
    throw new Error('Community not found');
  }

  const group = community.groups.find(g => g._id.toString() === groupId);
  
  if (!group) {
    throw new Error('Group not found');
  }

  // Get member details with their roles
  const memberIds = group.members.slice(page * limit, (page + 1) * limit);
  const members = await CommunityMember.find({
    community: communityId,
    user: { $in: memberIds }
  })
    .populate('user', 'name avatar isVerified bio roles industries')
    .lean();

  return {
    data: members,
    pagination: {
      page,
      limit,
      total: group.memberCount,
      pages: Math.ceil(group.memberCount / limit)
    }
  };
};

module.exports = {
  createGroup,
  getGroups,
  getGroup,
  updateGroup,
  deleteGroup,
  joinGroup,
  leaveGroup,
  getGroupMembers
};
