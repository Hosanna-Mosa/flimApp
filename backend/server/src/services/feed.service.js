const Post = require('../models/Post.model');
const Follow = require('../models/Follow.model');
const User = require('../models/User.model');
const Like = require('../models/Like.model');
const cacheService = require('./cache.service');
const logger = require('../config/logger');

/**
 * Feed Service - Generates personalized feeds using algorithmic ranking
 * Similar to Instagram, Twitter, and TikTok feed algorithms
 */
class FeedService {
  /**
   * Get personalized feed for a user
   * @param {string} userId - User ID
   * @param {number} page - Page number
   * @param {number} limit - Items per page
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} Paginated feed
   */
  async getPersonalizedFeed(userId, page = 0, limit = 20, options = {}) {
    try {
      const { algorithm = 'hybrid', timeRange = 7 } = options;

      // Try to get cached feed first
      // Try to get cached feed first
      const cachedFeed = await cacheService.getUserFeed(userId, page, limit);
      if (cachedFeed && cachedFeed.length > 0) {
        // Fetch full post data
        const posts = await Post.find({ _id: { $in: cachedFeed } })
          .populate('author', 'name avatar isVerified roles')
          .lean();

        // Maintain cache order
        const orderedPosts = cachedFeed.map(id =>
          posts.find(p => p._id.toString() === id)
        ).filter(Boolean);

        const enrichedPosts = await this.enrichPosts(orderedPosts, userId);

        return {
          success: true,
          data: enrichedPosts,
          source: 'cache',
        };
      }

      // Generate fresh feed
      let feedPosts;

      switch (algorithm) {
        case 'chronological':
          feedPosts = await this.getChronologicalFeed(userId, timeRange);
          break;
        case 'engagement':
          feedPosts = await this.getEngagementFeed(userId, timeRange);
          break;
        case 'hybrid':
        default:
          feedPosts = await this.getHybridFeed(userId, timeRange);
          break;
      }

      // Paginate
      const start = page * limit;
      const paginatedPosts = feedPosts.slice(start, start + limit);

      const enrichedPosts = await this.enrichPosts(paginatedPosts, userId);

      // Cache the feed (store post IDs only)
      if (page === 0) {
        const postIds = feedPosts.slice(0, 100).map(p => p._id.toString());
        await cacheService.setUserFeed(userId, postIds);
      }

      return {
        success: true,
        data: enrichedPosts,
        pagination: {
          page,
          limit,
          total: feedPosts.length,
          pages: Math.ceil(feedPosts.length / limit),
        },
        source: 'database',
      };
    } catch (error) {
      logger.error('Error getting personalized feed:', error);
      throw new Error('Failed to get feed');
    }
  }

  /**
   * Enrich posts with isLiked and isFollowing status
   * @param {Array} posts - List of posts
   * @param {string} userId - Current user ID
   */
  async enrichPosts(posts, userId) {
    if (!posts || posts.length === 0) return [];

    // Filter out posts where author is null/missing (e.g. deleted users)
    const validPosts = posts.filter(p => p.author && p.author._id);
    if (validPosts.length === 0) return [];

    const postIds = validPosts.map(p => p._id);
    const authorIds = [...new Set(validPosts.map(p => p.author._id))];

    const [userLikes, userFollows] = await Promise.all([
      Like.find({
        user: userId,
        post: { $in: postIds }
      }).select('post').lean(),
      Follow.find({
        follower: userId,
        following: { $in: authorIds },
        status: 'accepted'
      }).select('following').lean()
    ]);

    const likedPostIds = new Set(userLikes.map(like => like.post.toString()));
    const followedUserIds = new Set(userFollows.map(follow => follow.following.toString()));

    return validPosts.map(post => ({
      ...post,
      isLiked: likedPostIds.has(post._id.toString()),
      author: {
        ...post.author,
        isFollowing: followedUserIds.has(post.author._id.toString())
      }
    }));
  }

  /**
   * Get chronological feed (latest posts from following)
   * @private
   */
  async getChronologicalFeed(userId, timeRange = 7) {
    try {
      // Get users that the current user follows
      const following = await Follow.find({
        follower: userId,
        status: 'accepted',
      }).select('following').lean();

      const followingIds = following.map(f => f.following);

      // If user follows no one, show trending/public posts as fallback (excluding own posts)
      if (followingIds.length === 0) {
        logger.info(`User ${userId} has no follows, showing trending posts as fallback`);

        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - timeRange);

        const posts = await Post.find({
          author: { $ne: userId }, // Exclude user's own posts
          isActive: true,
          visibility: 'public',
          createdAt: { $gte: cutoffDate },
        })
          .populate('author', 'name avatar isVerified roles')
          .sort({ score: -1, createdAt: -1 }) // Sort by score then recency
          .limit(100)
          .lean();

        return posts;
      }

      // Get posts from followed users (excluding own posts)
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - timeRange);

      const posts = await Post.find({
        author: { $in: followingIds, $ne: userId }, // Exclude user's own posts
        isActive: true,
        visibility: { $in: ['public', 'followers'] },
        createdAt: { $gte: cutoffDate },
      })
        .populate('author', 'name avatar isVerified roles')
        .sort({ createdAt: -1 })
        .limit(100)
        .lean();

      return posts;
    } catch (error) {
      logger.error('Error getting chronological feed:', error);
      throw error;
    }
  }

  /**
   * Get engagement-based feed (most popular posts)
   * @private
   */
  async getEngagementFeed(userId, timeRange = 7) {
    try {
      // Get users that the current user follows
      const following = await Follow.find({
        follower: userId,
        status: 'accepted',
      }).select('following').lean();

      const followingIds = following.map(f => f.following);

      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - timeRange);

      // Global Feed: Show all public posts + posts from users I follow (excluding own posts)
      const posts = await Post.find({
        author: { $ne: userId }, // Exclude user's own posts
        isActive: true,
        createdAt: { $gte: cutoffDate },
        $or: [
          { visibility: 'public' }, // Show ALL public posts
          { author: { $in: followingIds } } // Show posts from people I follow (including private/followers-only)
        ]
      })
        .populate('author', 'name avatar isVerified roles')
        .sort({ 'engagement.likesCount': -1, 'engagement.commentsCount': -1 })
        .limit(100)
        .lean();

      return posts;
    } catch (error) {
      logger.error('Error getting engagement feed:', error);
      throw error;
    }
  }

  /**
   * Get hybrid feed (algorithmic ranking)
   * Combines recency, engagement, and relevance
   * @private
   */
  async getHybridFeed(userId, timeRange = 7) {
    try {
      // Get user data for relevance scoring
      const user = await User.findById(userId).select('industries roles').lean();

      // Get users that the current user follows
      const following = await Follow.find({
        follower: userId,
        status: 'accepted',
      }).select('following').lean();

      const followingIds = following.map(f => f.following);

      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - timeRange);

      // Global Feed: Show all public posts + posts from users I follow (excluding own posts)
      const posts = await Post.find({
        author: { $ne: userId }, // Exclude user's own posts
        isActive: true,
        createdAt: { $gte: cutoffDate },
        $or: [
          { visibility: 'public' }, // Show ALL public posts
          { author: { $in: followingIds } } // Show posts from people I follow (including private/followers-only)
        ]
      })
        .populate('author', 'name avatar isVerified roles')
        .lean();

      // Calculate score for each post
      const scoredPosts = posts.map(post => {
        const score = this.calculateFeedScore(post, user);
        return { ...post, feedScore: score };
      });

      // Sort by score
      scoredPosts.sort((a, b) => b.feedScore - a.feedScore);

      return scoredPosts.slice(0, 100);
    } catch (error) {
      logger.error('Error getting hybrid feed:', error);
      throw error;
    }
  }

  /**
   * Calculate feed score for a post
   * @private
   */
  calculateFeedScore(post, user) {
    const now = Date.now();
    const postAge = (now - new Date(post.createdAt).getTime()) / (1000 * 60 * 60); // in hours

    // Engagement score (weighted)
    const likes = post.engagement?.likesCount || 0;
    const comments = post.engagement?.commentsCount || 0;
    const shares = post.engagement?.sharesCount || 0;
    const engagementScore = Math.log(likes + comments * 2 + shares * 3 + 1);

    // Recency score (decay function)
    const recencyScore = 1 / (postAge + 1);

    // Relevance score (industry/role match)
    let relevanceScore = 0;
    if (user.industries && post.industries) {
      const matchingIndustries = user.industries.filter(ind =>
        post.industries.includes(ind)
      ).length;
      relevanceScore = matchingIndustries / Math.max(user.industries.length, 1);
    }

    // Verified author boost
    const verifiedBoost = post.author?.isVerified ? 1.2 : 1.0;

    // Weighted combination
    const finalScore = (
      (engagementScore * 0.4) +
      (recencyScore * 0.4) +
      (relevanceScore * 0.2)
    ) * verifiedBoost;

    return finalScore;
  }

  /**
   * Get trending/explore feed (posts from all users)
   * @param {string} userId - User ID (for personalization)
   * @param {number} page - Page number
   * @param {number} limit - Items per page
   * @returns {Promise<Object>} Paginated trending posts
   */
  async getTrendingFeed(userId, page = 0, limit = 20) {
    try {
      const skip = page * limit;

      // Get user for relevance
      const user = await User.findById(userId).select('industries roles').lean();

      // Get trending posts from last 24 hours
      const cutoffDate = new Date();
      cutoffDate.setHours(cutoffDate.getHours() - 24);

      const posts = await Post.find({
        isActive: true,
        visibility: 'public',
        createdAt: { $gte: cutoffDate },
      })
        .populate('author', 'name avatar isVerified roles')
        .sort({ score: -1, 'engagement.likesCount': -1 })
        .skip(skip)
        .limit(limit)
        .lean();

      const total = await Post.countDocuments({
        isActive: true,
        visibility: 'public',
        createdAt: { $gte: cutoffDate },
      });

      return {
        success: true,
        data: posts,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      logger.error('Error getting trending feed:', error);
      throw new Error('Failed to get trending feed');
    }
  }

  /**
   * Get posts by industry
   * @param {string} industry - Industry name
   * @param {number} page - Page number
   * @param {number} limit - Items per page
   * @returns {Promise<Object>} Paginated posts
   */
  async getIndustryFeed(industry, page = 0, limit = 20) {
    try {
      const skip = page * limit;

      const posts = await Post.find({
        industries: industry,
        isActive: true,
        visibility: 'public',
      })
        .populate('author', 'name avatar isVerified roles')
        .sort({ score: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();

      const total = await Post.countDocuments({
        industries: industry,
        isActive: true,
        visibility: 'public',
      });

      return {
        success: true,
        data: posts,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      logger.error('Error getting industry feed:', error);
      throw new Error('Failed to get industry feed');
    }
  }

  /**
   * Get user's posts (profile feed)
   * @param {string} userId - User ID
   * @param {string} viewerId - Viewer ID (for privacy checks)
   * @param {number} page - Page number
   * @param {number} limit - Items per page
   * @returns {Promise<Object>} Paginated user posts
   */
  async getUserPosts(userId, viewerId, page = 0, limit = 20) {
    try {
      const skip = page * limit;

      // Check if viewer is following the user
      const isFollowing = viewerId
        ? await Follow.findOne({
          follower: viewerId,
          following: userId,
          status: 'accepted',
        })
        : null;

      const isOwnProfile = userId === viewerId;

      // Determine visibility filter
      let visibilityFilter;
      if (isOwnProfile) {
        visibilityFilter = {}; // Show all posts
      } else if (isFollowing) {
        visibilityFilter = { visibility: { $in: ['public', 'followers'] } };
      } else {
        visibilityFilter = { visibility: 'public' };
      }

      const posts = await Post.find({
        author: userId,
        isActive: true,
        ...visibilityFilter,
      })
        .populate('author', 'name avatar isVerified roles')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();

      const total = await Post.countDocuments({
        author: userId,
        isActive: true,
        ...visibilityFilter,
      });

      return {
        success: true,
        data: posts,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      logger.error('Error getting user posts:', error);
      throw new Error('Failed to get user posts');
    }
  }

  /**
   * Regenerate and cache user feed (called by queue processor)
   * @param {string} userId - User ID
   * @returns {Promise<boolean>} Success status
   */
  async regenerateFeed(userId) {
    try {
      // Generate fresh hybrid feed
      const feedPosts = await this.getHybridFeed(userId, 7);

      // Cache post IDs (store up to 100 posts)
      const postIds = feedPosts.slice(0, 100).map(p => p._id.toString());
      await cacheService.setUserFeed(userId, postIds);

      logger.info(`Feed regenerated for user ${userId} (${postIds.length} posts)`);
      return true;
    } catch (error) {
      logger.error('Error regenerating feed:', error);
      throw error;
    }
  }

  /**
   * Invalidate feed cache for user
   * @param {string} userId - User ID
   * @returns {Promise<boolean>} Success status
   */
  async invalidateFeed(userId) {
    try {
      await cacheService.invalidateUserFeed(userId);
      logger.info(`Feed invalidated for user ${userId}`);
      return true;
    } catch (error) {
      logger.error('Error invalidating feed:', error);
      return false;
    }
  }
}

module.exports = new FeedService();
