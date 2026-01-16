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
      const { algorithm = 'hybrid', timeRange = 36500 } = options;

      // Try to get cached feed first (only use cache for page > 0 to ensure fresh data on first load)
      if (page > 0) {
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

      // Cache invalidation and caching logic
      if (page === 0) {
        // Always invalidate cache for page 0 to ensure fresh data
        await cacheService.invalidateUserFeed(userId);
        logger.info(`[Feed] Cache invalidated for user ${userId} (page 0)`);
        
        // Cache the fresh feed (store post IDs only)
        const postIds = feedPosts.slice(0, 100).map(p => p._id.toString());
        await cacheService.setUserFeed(userId, postIds);
        logger.info(`[Feed] Cached ${postIds.length} post IDs for user ${userId}`);
      }

      // Log the enriched posts for debugging
      const enrichedAuthors = [...new Set(enrichedPosts.map(p => p.author?.name || 'Unknown').filter(Boolean))];
      logger.info(`[Feed] Returning ${enrichedPosts.length} enriched posts from ${enrichedAuthors.length} authors:`, enrichedAuthors.slice(0, 5));

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
      throw new Error(error.message || 'Failed to get feed');
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
    
    if (validPosts.length === 0) {
      logger.warn(`[Feed] enrichPosts: No valid posts after filtering (input: ${posts.length})`);
      return [];
    }

    // Log unique authors before enrichment
    const authorsBefore = [...new Set(validPosts.map(p => p.author?.name || 'Unknown'))];
    logger.info(`[Feed] enrichPosts: Enriching ${validPosts.length} posts from ${authorsBefore.length} authors:`, authorsBefore.slice(0, 5));

    const postIds = validPosts.map(p => p._id);
    const authorIds = [...new Set(validPosts.map(p => p.author._id))];

    const [userLikes, userFollows, userData] = await Promise.all([
      Like.find({
        user: userId,
        post: { $in: postIds }
      }).select('post').lean(),
      Follow.find({
        follower: userId,
        following: { $in: authorIds },
        status: 'accepted'
      }).select('following').lean(),
      User.findById(userId).select('savedPosts').lean()
    ]);

    const likedPostIds = new Set(userLikes.map(like => like.post.toString()));
    const followedUserIds = new Set(userFollows.map(follow => follow.following.toString()));
    const savedPostIds = new Set((userData?.savedPosts || []).map(id => id.toString()));

    const enriched = validPosts.map(post => ({
      ...post,
      isLiked: likedPostIds.has(post._id.toString()),
      isSaved: savedPostIds.has(post._id.toString()),
      author: {
        ...post.author,
        isFollowing: followedUserIds.has(post.author._id.toString())
      }
    }));

    // Log unique authors after enrichment
    const authorsAfter = [...new Set(enriched.map(p => p.author?.name || 'Unknown'))];
    logger.info(`[Feed] enrichPosts: Enriched ${enriched.length} posts from ${authorsAfter.length} authors:`, authorsAfter.slice(0, 5));

    return enriched;
  }

  /**
   * Get chronological feed (latest posts from following)
   * @private
   */
  async getChronologicalFeed(userId, timeRange = 36500) {
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
        $and: [
          { author: { $in: followingIds } },
          { author: { $ne: userId } } // Exclude user's own posts
        ],
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
  async getEngagementFeed(userId, timeRange = 36500) {
    try {
      // Get users that the current user follows
      const following = await Follow.find({
        follower: userId,
        status: 'accepted',
      }).select('following').lean();

      const followingIds = following.map(f => f.following);

      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - timeRange);

      // Get all private account user IDs
      const privateUsers = await User.find({ accountType: 'private' }).select('_id').lean();
      const privateUserIds = privateUsers.map(u => u._id.toString());

      // Global Feed: Show all public posts (excluding private accounts) + posts from users I follow
      const posts = await Post.find({
        author: { $ne: userId }, // Exclude user's own posts
        isActive: true,
        createdAt: { $gte: cutoffDate },
        $or: [
          {
            visibility: 'public',
            // Exclude posts from private accounts (they should only be visible to followers)
            author: { $nin: privateUserIds }
          },
          { author: { $in: followingIds } } // Show posts from people I follow (including private/followers-only)
        ]
      })
        .populate('author', 'name avatar isVerified roles accountType')
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
  async getHybridFeed(userId, timeRange = 36500) {
    try {
      // Get user data for relevance scoring
      const user = await User.findById(userId).select('industries roles').lean();

      if (!user) {
        // Fallback for when user record is missing (should trigger logout ideally)
        logger.warn(`User ${userId} not found during feed generation`);
        const trending = await this.getTrendingFeed(userId, 0, 100);
        return trending.data || [];
      }

      // Get users that the current user follows
      const following = await Follow.find({
        follower: userId,
        status: 'accepted',
      }).select('following').lean();

      const followingIds = following.map(f => f.following.toString());
      logger.info(`[Feed] User ${userId} follows ${followingIds.length} users`);

      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - timeRange);

      // Get all private account user IDs
      const privateUsers = await User.find({ accountType: 'private' }).select('_id').lean();
      const privateUserIds = privateUsers.map(u => u._id.toString());

      // Build query conditions - ensure we get ALL public posts from ALL users (except self and private accounts)
      // PLUS posts from users we follow (regardless of visibility)
      let queryConditions;

      // If user follows someone, show their posts + all public posts
      // If user follows no one, show all public posts
      if (followingIds.length > 0) {
        // Show: (public posts from non-private accounts) OR (posts from users I follow)
        // Use $and to ensure author is not self in both conditions
        queryConditions = {
          isActive: true,
          createdAt: { $gte: cutoffDate },
          author: { $ne: userId }, // Exclude user's own posts
          $or: [
            {
              visibility: 'public',
              author: { $nin: privateUserIds }
            },
            { 
              author: { $in: followingIds }
            }
          ]
        };
      } else {
        // No follows - show all public posts (excluding private accounts and self)
        queryConditions = {
          isActive: true,
          createdAt: { $gte: cutoffDate },
          visibility: 'public',
          author: { 
            $ne: userId,
            $nin: privateUserIds 
          }
        };
      }

      logger.info(`[Feed] Query conditions for user ${userId}:`, JSON.stringify(queryConditions, null, 2));
      logger.info(`[Feed] Following ${followingIds.length} users, Private accounts: ${privateUserIds.length}`);

      const posts = await Post.find(queryConditions)
        .populate('author', 'name avatar isVerified roles accountType')
        .sort({ createdAt: -1 }) // Get most recent first, then we'll score them
        .limit(500) // Get more posts to score and filter
        .lean();

      // Filter out posts with null/missing authors (deleted users)
      const validPosts = posts.filter(p => p.author && p.author._id);
      
      logger.info(`[Feed] Found ${posts.length} total posts, ${validPosts.length} with valid authors`);
      
      // Log unique authors for debugging
      const uniqueAuthors = [...new Set(validPosts.map(p => {
        const authorId = p.author?._id?.toString();
        const authorName = p.author?.name || 'Unknown';
        return `${authorName} (${authorId})`;
      }))];
      logger.info(`[Feed] Posts from ${uniqueAuthors.length} unique authors:`, uniqueAuthors.slice(0, 10));

      // Calculate score for each post
      const scoredPosts = validPosts.map(post => {
        const score = this.calculateFeedScore(post, user);
        return { ...post, feedScore: score };
      });

      // Sort by score
      scoredPosts.sort((a, b) => b.feedScore - a.feedScore);

      const result = scoredPosts.slice(0, 100);
      logger.info(`[Feed] Returning ${result.length} posts after scoring and limiting`);
      
      return result;
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

      const isOwnProfile = userId === viewerId;

      // Get user account type
      const user = await User.findById(userId).select('accountType').lean();
      const isPrivateAccount = user?.accountType === 'private';

      // Check if viewer is following the user (only for non-own profiles)
      const isFollowing = !isOwnProfile && viewerId
        ? await Follow.findOne({
          follower: viewerId,
          following: userId,
          status: 'accepted',
        })
        : null;

      // For private accounts: only show posts if viewer is the owner or an approved follower
      if (isPrivateAccount && !isOwnProfile && !isFollowing) {
        // Private account and viewer is not an approved follower - return empty
        return {
          success: true,
          data: [],
          pagination: {
            page,
            limit,
            total: 0,
            pages: 0,
          },
        };
      }

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
      const feedPosts = await this.getHybridFeed(userId, 36500);

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
