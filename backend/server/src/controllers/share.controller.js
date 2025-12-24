const shareService = require('../services/share.service');
const { success, error } = require('../utils/response');

/**
 * Share Controller - Handles share operations
 */

/**
 * Share a post
 * POST /api/posts/:id/share
 * Body: { shareType?, caption?, platform? }
 */
const sharePost = async (req, res, next) => {
  try {
    const { shareType = 'repost', caption, platform } = req.body;
    
    const result = await shareService.sharePost({
      userId: req.user.id,
      postId: req.params.id,
      shareType,
      caption,
      platform,
    });
    
    if (!result.success) {
      return res.status(400).json(result);
    }
    
    return success(res, result, 201);
  } catch (err) {
    return next(err);
  }
};

/**
 * Get shares for a post (paginated)
 * GET /api/posts/:id/shares?page=0&limit=20
 */
const getPostShares = async (req, res, next) => {
  try {
    const { page = 0, limit = 20 } = req.query;
    const result = await shareService.getPostShares(
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
 * Get user's shared posts (paginated)
 * GET /api/users/:id/shares?page=0&limit=20
 */
const getUserShares = async (req, res, next) => {
  try {
    const { page = 0, limit = 20 } = req.query;
    const result = await shareService.getUserShares(
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
 * Delete a share
 * DELETE /api/shares/:id
 */
const deleteShare = async (req, res, next) => {
  try {
    const result = await shareService.deleteShare(req.params.id, req.user.id);
    
    if (!result.success) {
      return res.status(400).json(result);
    }
    
    return success(res, result);
  } catch (err) {
    return next(err);
  }
};

/**
 * Get share statistics by platform
 * GET /api/posts/:id/share-stats
 */
const getShareStats = async (req, res, next) => {
  try {
    const result = await shareService.getShareStatsByPlatform(req.params.id);
    
    return success(res, result);
  } catch (err) {
    return next(err);
  }
};

module.exports = {
  sharePost,
  getPostShares,
  getUserShares,
  deleteShare,
  getShareStats,
};
