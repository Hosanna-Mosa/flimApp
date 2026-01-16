const feedService = require('../services/feed.service');
const { success, error } = require('../utils/response');

/**
 * Feed Controller - Handles feed operations
 */

/**
 * Get personalized feed for authenticated user
 * GET /api/feed?page=0&limit=20&algorithm=hybrid
 */
const getPersonalizedFeed = async (req, res, next) => {
  try {
    const { page = 0, limit = 20, algorithm = 'hybrid', timeRange = 7 } = req.query;

    const result = await feedService.getPersonalizedFeed(
      req.user.id,
      parseInt(page),
      parseInt(limit),
      { algorithm, timeRange: parseInt(timeRange) }
    );

    // Disable HTTP caching to prevent 304 responses that break feed loading
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');

    return res.status(200).json(result);
  } catch (err) {
    return next(err);
  }
};

/**
 * Get trending/explore feed
 * GET /api/feed/trending?page=0&limit=20
 */
const getTrendingFeed = async (req, res, next) => {
  try {
    const { page = 0, limit = 20 } = req.query;

    const result = await feedService.getTrendingFeed(
      req.user.id,
      parseInt(page),
      parseInt(limit)
    );

    return res.status(200).json(result);
  } catch (err) {
    return next(err);
  }
};

/**
 * Get posts by industry
 * GET /api/feed/industry/:industry?page=0&limit=20
 */
const getIndustryFeed = async (req, res, next) => {
  try {
    const { page = 0, limit = 20 } = req.query;

    const result = await feedService.getIndustryFeed(
      req.params.industry,
      parseInt(page),
      parseInt(limit)
    );

    return res.status(200).json(result);
  } catch (err) {
    return next(err);
  }
};

/**
 * Get user's posts (profile feed)
 * GET /api/users/:id/posts?page=0&limit=20
 */
const getUserFeed = async (req, res, next) => {
  try {
    const { page = 0, limit = 20 } = req.query;

    const result = await feedService.getUserPosts(
      req.params.id,
      req.user?.id, // Viewer ID (may be undefined for public viewing)
      parseInt(page),
      parseInt(limit)
    );

    return res.status(200).json(result);
  } catch (err) {
    return next(err);
  }
};

/**
 * Invalidate feed cache for authenticated user
 * POST /api/feed/invalidate
 */
const invalidateFeed = async (req, res, next) => {
  try {
    await feedService.invalidateFeed(req.user.id);

    return success(res, {
      success: true,
      message: 'Feed cache invalidated',
    });
  } catch (err) {
    return next(err);
  }
};

module.exports = {
  getPersonalizedFeed,
  getTrendingFeed,
  getIndustryFeed,
  getUserFeed,
  invalidateFeed,
};
