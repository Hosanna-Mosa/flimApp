const likeService = require('../services/like.service');
const { success, error } = require('../utils/response');

/**
 * Like Controller - Handles like/unlike operations
 */

/**
 * Like a post
 * POST /api/posts/:id/like
 */
const likePost = async (req, res, next) => {
  try {
    const result = await likeService.likePost(req.user.id, req.params.id);
    
    if (!result.success) {
      return res.status(400).json(result);
    }
    
    return success(res, result);
  } catch (err) {
    return next(err);
  }
};

/**
 * Unlike a post
 * DELETE /api/posts/:id/like
 */
const unlikePost = async (req, res, next) => {
  try {
    const result = await likeService.unlikePost(req.user.id, req.params.id);
    
    if (!result.success) {
      return res.status(400).json(result);
    }
    
    return success(res, result);
  } catch (err) {
    return next(err);
  }
};

/**
 * Get users who liked a post (paginated)
 * GET /api/posts/:id/likes?page=0&limit=20
 */
const getPostLikes = async (req, res, next) => {
  try {
    const { page = 0, limit = 20 } = req.query;
    const result = await likeService.getPostLikes(
      req.params.id,
      parseInt(page),
      parseInt(limit)
    );
    
    return success(res, result);
  } catch (err) {
    return next(err);
  }
};

/**
 * Get posts liked by a user (paginated)
 * GET /api/users/:id/liked?page=0&limit=20
 */
const getUserLikedPosts = async (req, res, next) => {
  try {
    const { page = 0, limit = 20 } = req.query;
    const result = await likeService.getUserLikedPosts(
      req.params.id,
      parseInt(page),
      parseInt(limit)
    );
    
    return success(res, result);
  } catch (err) {
    return next(err);
  }
};

/**
 * Check if user liked a post
 * GET /api/posts/:id/liked
 */
const hasLiked = async (req, res, next) => {
  try {
    const liked = await likeService.hasUserLikedPost(req.user.id, req.params.id);
    
    return success(res, { liked });
  } catch (err) {
    return next(err);
  }
};

module.exports = {
  likePost,
  unlikePost,
  getPostLikes,
  getUserLikedPosts,
  hasLiked,
};
