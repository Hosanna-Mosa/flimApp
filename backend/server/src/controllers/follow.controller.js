const followService = require('../services/follow.service');
const { success, error } = require('../utils/response');

/**
 * Follow Controller - Handles follow/unfollow operations
 */

/**
 * Follow a user
 * POST /api/users/:id/follow
 */
const followUser = async (req, res, next) => {
  try {
    const result = await followService.followUser(req.user.id, req.params.id);

    if (!result.success) {
      return res.status(400).json(result);
    }

    return success(res, result);
  } catch (err) {
    return next(err);
  }
};

/**
 * Unfollow a user
 * DELETE /api/users/:id/follow
 */
const unfollowUser = async (req, res, next) => {
  try {
    const result = await followService.unfollowUser(req.user.id, req.params.id);

    if (!result.success) {
      return res.status(400).json(result);
    }

    return success(res, result);
  } catch (err) {
    return next(err);
  }
};

/**
 * Accept a follow request
 * POST /api/follow-requests/:userId/accept
 */
const acceptFollowRequest = async (req, res, next) => {
  try {
    const result = await followService.acceptFollowRequest(
      req.user.id,
      req.params.userId
    );

    if (!result.success) {
      return res.status(400).json(result);
    }

    return success(res, result);
  } catch (err) {
    return next(err);
  }
};

/**
 * Reject a follow request
 * POST /api/follow-requests/:userId/reject
 */
const rejectFollowRequest = async (req, res, next) => {
  try {
    const result = await followService.rejectFollowRequest(
      req.user.id,
      req.params.userId
    );

    if (!result.success) {
      return res.status(400).json(result);
    }

    return success(res, result);
  } catch (err) {
    return next(err);
  }
};

/**
 * Get user's followers (paginated)
 * GET /api/users/:id/followers?page=0&limit=20
 */
const getFollowers = async (req, res, next) => {
  try {
    const { page = 0, limit = 20, q } = req.query;
    const result = await followService.getFollowers(
      req.params.id,
      parseInt(page),
      parseInt(limit),
      q
    );

    return success(res, result);
  } catch (err) {
    return next(err);
  }
};

/**
 * Get users that a user is following (paginated)
 * GET /api/users/:id/following?page=0&limit=20
 */
const getFollowing = async (req, res, next) => {
  try {
    const { page = 0, limit = 20, q } = req.query;
    const result = await followService.getFollowing(
      req.params.id,
      parseInt(page),
      parseInt(limit),
      q
    );

    return success(res, result);
  } catch (err) {
    return next(err);
  }
};

/**
 * Get pending follow requests for the authenticated user
 * GET /api/follow-requests?page=0&limit=20
 */
const getPendingRequests = async (req, res, next) => {
  try {
    const { page = 0, limit = 20 } = req.query;
    const result = await followService.getPendingRequests(
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
 * Check if user is following another user
 * GET /api/users/:id/following-status
 */
const isFollowing = async (req, res, next) => {
  try {
    const following = await followService.isFollowing(req.user.id, req.params.id);

    // Disable caching to ensure fresh data
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');

    return success(res, { following });
  } catch (err) {
    return next(err);
  }
};

/**
 * Get mutual followers between two users
 * GET /api/users/:id/mutual-followers
 */
const getMutualFollowers = async (req, res, next) => {
  try {
    const result = await followService.getMutualFollowers(req.user.id, req.params.id);

    return success(res, result);
  } catch (err) {
    return next(err);
  }
};

module.exports = {
  followUser,
  unfollowUser,
  acceptFollowRequest,
  rejectFollowRequest,
  getFollowers,
  getFollowing,
  getPendingRequests,
  isFollowing,
  getMutualFollowers,
};
