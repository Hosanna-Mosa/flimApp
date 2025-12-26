const CommunityPost = require('../models/CommunityPost.model');
const Community = require('../models/Community.model');
const CommunityMember = require('../models/CommunityMember.model');
const { getIo } = require('../utils/socketStore');

/**
 * Create a post in a community group
 */
const createPost = async (communityId, groupId, postData, userId) => {
  const community = await Community.findById(communityId);
  
  if (!community) {
    throw new Error('Community not found');
  }

  // Check if user is a member
  const member = await CommunityMember.findOne({
    community: communityId,
    user: userId
  });

  if (!member || !member.canPost()) {
    throw new Error('You do not have permission to post');
  }

  // Check if user is in the group
  if (!member.groups.some(g => g.equals(groupId))) {
    throw new Error('You must be a member of this group to post');
  }

  // Check if group exists
  const group = community.groups.id(groupId);
  if (!group) {
    throw new Error('Group not found');
  }

  // Check if group is announcement-only
  if (group.isAnnouncementOnly && !member.isAdminOrHigher()) {
    throw new Error('Only admins can post in announcement groups');
  }

  // Create post
  const post = await CommunityPost.create({
    community: communityId,
    group: groupId,
    author: userId,
    type: postData.type || 'text',
    content: postData.content,
    media: postData.media || [],
    poll: postData.poll || null
  });

  // Update stats
  community.stats.totalPosts += 1;
  await community.save();

  member.postsCount += 1;
  member.lastActiveAt = new Date();
  await member.save();

  // Populate author
  await post.populate('author', 'name avatar isVerified roles');

  // Emit socket events
  const io = getIo();
  if (io) {
    io.to(`community_${communityId}`).emit('new_community_post', post);
    io.to(`group_${groupId}`).emit('new_group_post', post);
  }

  return post;
};

/**
 * Get community feed (all posts from all groups)
 */
const getCommunityFeed = async (communityId, userId, page = 0, limit = 20) => {
  // Check if user is a member
  const member = await CommunityMember.findOne({
    community: communityId,
    user: userId
  });

  if (!member) {
    throw new Error('You must be a member to view posts');
  }

  // Get posts from groups the user is in
  const posts = await CommunityPost.find({
    community: communityId,
    group: { $in: member.groups },
    isDeleted: false
  })
    .populate('author', 'name avatar isVerified roles industries')
    .sort({ isPinned: -1, createdAt: -1 })
    .skip(page * limit)
    .limit(limit)
    .lean();

  // Add user-specific data
  const postsWithUserData = posts.map(post => ({
    ...post,
    isLiked: post.likes.some(like => like.equals(userId)),
    hasVoted: post.poll ? post.poll.options.some(opt => 
      opt.votes.some(vote => vote.equals(userId))
    ) : false
  }));

  const total = await CommunityPost.countDocuments({
    community: communityId,
    group: { $in: member.groups },
    isDeleted: false
  });

  return {
    data: postsWithUserData,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  };
};

/**
 * Get posts from a specific group
 */
const getGroupPosts = async (communityId, groupId, userId, page = 0, limit = 20) => {
  // Check if user is in the group
  const member = await CommunityMember.findOne({
    community: communityId,
    user: userId
  });

  if (!member || !member.groups.some(g => g.equals(groupId))) {
    throw new Error('You must be a member of this group to view posts');
  }

  const posts = await CommunityPost.find({
    community: communityId,
    group: groupId,
    isDeleted: false
  })
    .populate('author', 'name avatar isVerified roles industries')
    .sort({ isPinned: -1, createdAt: -1 })
    .skip(page * limit)
    .limit(limit)
    .lean();

  // Add user-specific data
  const postsWithUserData = posts.map(post => ({
    ...post,
    isLiked: post.likes.some(like => like.equals(userId)),
    hasVoted: post.poll ? post.poll.options.some(opt => 
      opt.votes.some(vote => vote.equals(userId))
    ) : false
  }));

  const total = await CommunityPost.countDocuments({
    community: communityId,
    group: groupId,
    isDeleted: false
  });

  return {
    data: postsWithUserData,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  };
};

/**
 * Update a post
 */
const updatePost = async (postId, userId, updates) => {
  const post = await CommunityPost.findById(postId);
  
  if (!post) {
    throw new Error('Post not found');
  }

  // Only author can update
  if (!post.author.equals(userId)) {
    throw new Error('Only the author can update this post');
  }

  // Can only update content and media
  if (updates.content) post.content = updates.content;
  if (updates.media) post.media = updates.media;

  await post.save();
  return post;
};

/**
 * Delete a post
 */
const deletePost = async (postId, userId) => {
  const post = await CommunityPost.findById(postId);
  
  if (!post) {
    throw new Error('Post not found');
  }

  // Check permissions (author or moderator+)
  const member = await CommunityMember.findOne({
    community: post.community,
    user: userId
  });

  const canDelete = post.author.equals(userId) || member?.isModeratorOrHigher();
  
  if (!canDelete) {
    throw new Error('Insufficient permissions to delete this post');
  }

  // Soft delete
  post.isDeleted = true;
  post.deletedAt = new Date();
  post.deletedBy = userId;
  await post.save();

  // Update stats
  await Community.findByIdAndUpdate(post.community, {
    $inc: { 'stats.totalPosts': -1 }
  });

  // Emit socket events
  const io = getIo();
  if (io) {
    io.to(`community_${post.community}`).emit('delete_community_post', { 
      postId: post._id, 
      communityId: post.community, 
      groupId: post.group 
    });
    io.to(`group_${post.group}`).emit('delete_group_post', { 
      postId: post._id, 
      communityId: post.community, 
      groupId: post.group 
    });
  }

  return { success: true, message: 'Post deleted successfully' };
};

/**
 * Pin/Unpin a post
 */
const togglePinPost = async (postId, userId) => {
  const post = await CommunityPost.findById(postId);
  
  if (!post) {
    throw new Error('Post not found');
  }

  // Check if user is moderator or higher
  const member = await CommunityMember.findOne({
    community: post.community,
    user: userId
  });

  if (!member?.isModeratorOrHigher()) {
    throw new Error('Only moderators and admins can pin posts');
  }

  post.isPinned = !post.isPinned;
  post.pinnedAt = post.isPinned ? new Date() : null;
  post.pinnedBy = post.isPinned ? userId : null;
  
  await post.save();

  return {
    success: true,
    isPinned: post.isPinned,
    message: post.isPinned ? 'Post pinned' : 'Post unpinned'
  };
};

/**
 * Like a post
 */
const likePost = async (postId, userId) => {
  const post = await CommunityPost.findById(postId);
  
  if (!post) {
    throw new Error('Post not found');
  }

  // Check if already liked
  if (post.likes.includes(userId)) {
    return {
      success: false,
      message: 'Already liked',
      likesCount: post.likesCount
    };
  }

  post.likes.push(userId);
  post.likesCount += 1;
  await post.save();

  return {
    success: true,
    message: 'Post liked',
    likesCount: post.likesCount
  };
};

/**
 * Unlike a post
 */
const unlikePost = async (postId, userId) => {
  const post = await CommunityPost.findById(postId);
  
  if (!post) {
    throw new Error('Post not found');
  }

  post.likes = post.likes.filter(like => !like.equals(userId));
  post.likesCount = Math.max(0, post.likesCount - 1);
  await post.save();

  return {
    success: true,
    message: 'Post unliked',
    likesCount: post.likesCount
  };
};

/**
 * Vote in a poll
 */
const voteInPoll = async (postId, optionIndex, userId) => {
  const post = await CommunityPost.findById(postId);
  
  if (!post) {
    throw new Error('Post not found');
  }

  if (post.type !== 'poll' || !post.poll) {
    throw new Error('This is not a poll');
  }

  // Check if poll has ended
  if (post.poll.endsAt && new Date() > post.poll.endsAt) {
    throw new Error('Poll has ended');
  }

  // Check if already voted
  const hasVoted = post.poll.options.some(opt => 
    opt.votes.some(vote => vote.equals(userId))
  );

  if (hasVoted && !post.poll.allowMultiple) {
    // Remove previous vote if not allowing multiple
    post.poll.options.forEach(opt => {
      opt.votes = opt.votes.filter(vote => !vote.equals(userId));
    });
  }

  // Add vote
  if (post.poll.options[optionIndex]) {
    post.poll.options[optionIndex].votes.push(userId);
    await post.save();

    return {
      success: true,
      message: 'Vote recorded',
      poll: post.poll
    };
  } else {
    throw new Error('Invalid option index');
  }
};

module.exports = {
  createPost,
  getCommunityFeed,
  getGroupPosts,
  updatePost,
  deletePost,
  togglePinPost,
  likePost,
  unlikePost,
  voteInPoll
};
