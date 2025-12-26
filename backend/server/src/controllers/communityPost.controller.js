const postService = require('../services/communityPost.service');
const { success } = require('../utils/response');

/**
 * Create a post in a community group
 */
const createPost = async (req, res, next) => {
  try {
    const post = await postService.createPost(
      req.params.communityId,
      req.body.groupId,
      req.body,
      req.user.id
    );
    return success(res, post, 201);
  } catch (err) {
    return next(err);
  }
};

/**
 * Get community feed (all posts from user's groups)
 */
const getCommunityFeed = async (req, res, next) => {
  try {
    const { page = 0, limit = 20 } = req.query;
    const result = await postService.getCommunityFeed(
      req.params.communityId,
      req.user.id,
      parseInt(page),
      parseInt(limit)
    );
    return success(res, result);
  } catch (err) {
    return next(err);
  }
};

/**
 * Get posts from a specific group
 */
const getGroupPosts = async (req, res, next) => {
  try {
    const { page = 0, limit = 20 } = req.query;
    const result = await postService.getGroupPosts(
      req.params.communityId,
      req.params.groupId,
      req.user.id,
      parseInt(page),
      parseInt(limit)
    );
    return success(res, result);
  } catch (err) {
    return next(err);
  }
};

/**
 * Update a post
 */
const updatePost = async (req, res, next) => {
  try {
    const post = await postService.updatePost(
      req.params.postId,
      req.user.id,
      req.body
    );
    return success(res, post);
  } catch (err) {
    return next(err);
  }
};

/**
 * Delete a post
 */
const deletePost = async (req, res, next) => {
  try {
    const result = await postService.deletePost(
      req.params.postId,
      req.user.id
    );
    return success(res, result);
  } catch (err) {
    return next(err);
  }
};

/**
 * Pin/Unpin a post
 */
const togglePin = async (req, res, next) => {
  try {
    const result = await postService.togglePinPost(
      req.params.postId,
      req.user.id
    );
    return success(res, result);
  } catch (err) {
    return next(err);
  }
};

/**
 * Like a post
 */
const likePost = async (req, res, next) => {
  try {
    const result = await postService.likePost(
      req.params.postId,
      req.user.id
    );
    return success(res, result);
  } catch (err) {
    return next(err);
  }
};

/**
 * Unlike a post
 */
const unlikePost = async (req, res, next) => {
  try {
    const result = await postService.unlikePost(
      req.params.postId,
      req.user.id
    );
    return success(res, result);
  } catch (err) {
    return next(err);
  }
};

/**
 * Vote in a poll
 */
const voteInPoll = async (req, res, next) => {
  try {
    const { optionIndex } = req.body;
    const result = await postService.voteInPoll(
      req.params.postId,
      optionIndex,
      req.user.id
    );
    return success(res, result);
  } catch (err) {
    return next(err);
  }
};

module.exports = {
  createPost,
  getCommunityFeed,
  getGroupPosts,
  updatePost,
  deletePost,
  togglePin,
  likePost,
  unlikePost,
  voteInPoll
};
