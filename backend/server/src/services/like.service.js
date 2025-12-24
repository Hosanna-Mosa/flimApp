const Like = require('../models/Like.model');
const Post = require('../models/Post.model');
const User = require('../models/User.model');
const cacheService = require('./cache.service');
const queueService = require('./queue.service');
const logger = require('../config/logger');

/**
 * Like Service - Handles all like/unlike operations
 * Uses cache-first approach for optimal performance
 */
class LikeService {
  /**
   * Like a post
   * @param {string} userId - User ID
   * @param {string} postId - Post ID
   * @returns {Promise<Object>} Result with success status
   */
  async likePost(userId, postId) {
    try {
      logger.info(`[Like] User ${userId} attempting to like post ${postId}`);
      
      // Check if already liked in DATABASE (not cache)
      const existingLike = await Like.findOne({ user: userId, post: postId });
      if (existingLike) {
        logger.warn(`[Like] Post ${postId} already liked by user ${userId}`);
        return { success: false, message: 'Post already liked' };
      }

      // Create like document in DATABASE
      const like = await Like.create({ user: userId, post: postId });
      logger.info(`[Like] Created like document: ${like._id}`);
      
      // Update post engagement count in DATABASE
      const post = await Post.findByIdAndUpdate(
        postId,
        { $inc: { 'engagement.likesCount': 1 } },
        { new: true }
      );
      
      if (!post) {
        // Rollback if post doesn't exist
        await Like.findByIdAndDelete(like._id);
        throw new Error('Post not found');
      }

      logger.info(`[Like] Updated post ${postId} likes count to ${post.engagement.likesCount}`);

      // Update user stats in DATABASE
      await User.findByIdAndUpdate(post.author, {
        $inc: { 'stats.likesReceived': 1 },
      });

      // Recalculate post score
      post.calculateScore();
      await post.save();

      // Update cache (optional, for performance)
      try {
        await cacheService.addLike(userId, postId);
        await cacheService.setPostStats(postId, { likesCount: post.engagement.likesCount });
      } catch (cacheError) {
        logger.warn('[Like] Cache update failed (non-critical):', cacheError.message);
      }

      logger.info(`[Like] Successfully liked post ${postId}. New count: ${post.engagement.likesCount}`);
      
      return {
        success: true,
        message: 'Post liked successfully',
        likesCount: post.engagement.likesCount,
      };
    } catch (error) {
      logger.error('[Like] Error in likePost:', error);
      throw new Error('Failed to like post');
    }
  }

  /**
   * Unlike a post
   * @param {string} userId - User ID
   * @param {string} postId - Post ID
   * @returns {Promise<Object>} Result with success status
   */
  async unlikePost(userId, postId) {
    try {
      logger.info(`[Unlike] User ${userId} attempting to unlike post ${postId}`);
      
      // Find and delete like document in DATABASE
      const like = await Like.findOneAndDelete({ user: userId, post: postId });
      if (!like) {
        logger.warn(`[Unlike] Post ${postId} not liked by user ${userId}`);
        return { success: false, message: 'Post not liked' };
      }

      logger.info(`[Unlike] Deleted like document: ${like._id}`);

      // Update post engagement count in DATABASE
      const post = await Post.findByIdAndUpdate(
        postId,
        { $inc: { 'engagement.likesCount': -1 } },
        { new: true }
      );

      if (!post) {
        // Recreate like if post doesn't exist (rollback)
        await Like.create({ user: userId, post: postId });
        throw new Error('Post not found');
      }

      logger.info(`[Unlike] Updated post ${postId} likes count to ${post.engagement.likesCount}`);

      // Update user stats in DATABASE
      await User.findByIdAndUpdate(post.author, {
        $inc: { 'stats.likesReceived': -1 },
      });

      // Recalculate post score
      post.calculateScore();
      await post.save();

      // Update cache (optional, for performance)
      try {
        await cacheService.removeLike(userId, postId);
        await cacheService.setPostStats(postId, { likesCount: post.engagement.likesCount });
      } catch (cacheError) {
        logger.warn('[Unlike] Cache update failed (non-critical):', cacheError.message);
      }

      logger.info(`[Unlike] Successfully unliked post ${postId}. New count: ${post.engagement.likesCount}`);
      
      return {
        success: true,
        message: 'Post unliked successfully',
        likesCount: post.engagement.likesCount,
      };
    } catch (error) {
      logger.error('[Unlike] Error in unlikePost:', error);
      throw new Error('Failed to unlike post');
    }
  }

  /**
   * Get users who liked a post (paginated)
   * @param {string} postId - Post ID
   * @param {number} page - Page number
   * @param {number} limit - Items per page
   * @returns {Promise<Object>} Paginated likes
   */
  async getPostLikes(postId, page = 0, limit = 20) {
    try {
      const skip = page * limit;

      const likes = await Like.find({ post: postId })
        .populate('user', 'name avatar isVerified roles')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();

      const total = await Like.countDocuments({ post: postId });

      return {
        success: true,
        data: likes.map(like => like.user),
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      logger.error('Error getting post likes:', error);
      throw new Error('Failed to get post likes');
    }
  }

  /**
   * Get posts liked by a user (paginated)
   * @param {string} userId - User ID
   * @param {number} page - Page number
   * @param {number} limit - Items per page
   * @returns {Promise<Object>} Paginated liked posts
   */
  async getUserLikedPosts(userId, page = 0, limit = 20) {
    try {
      const skip = page * limit;

      const likes = await Like.find({ user: userId })
        .populate({
          path: 'post',
          populate: {
            path: 'author',
            select: 'name avatar isVerified roles',
          },
        })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();

      const total = await Like.countDocuments({ user: userId });

      return {
        success: true,
        data: likes.map(like => like.post).filter(post => post), // Filter out deleted posts
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      logger.error('Error getting user liked posts:', error);
      throw new Error('Failed to get liked posts');
    }
  }

  /**
   * Check if user liked a post
   * @param {string} userId - User ID
   * @param {string} postId - Post ID
   * @returns {Promise<boolean>} True if liked
   */
  async hasUserLikedPost(userId, postId) {
    try {
      // Try cache first
      const cachedResult = await cacheService.hasLiked(userId, postId);
      if (cachedResult !== null) {
        return cachedResult;
      }

      // Fallback to database
      const like = await Like.findOne({ user: userId, post: postId });
      return !!like;
    } catch (error) {
      logger.error('Error checking like status:', error);
      return false;
    }
  }

  /**
   * Get like count for a post
   * @param {string} postId - Post ID
   * @returns {Promise<number>} Like count
   */
  async getPostLikeCount(postId) {
    try {
      // Try cache first
      const cachedCount = await cacheService.getPostLikesCount(postId);
      if (cachedCount !== null && cachedCount > 0) {
        return cachedCount;
      }

      // Fallback to database
      const count = await Like.countDocuments({ post: postId });
      
      // Update cache
      if (count > 0) {
        await cacheService.setPostStats(postId, { likesCount: count });
      }

      return count;
    } catch (error) {
      logger.error('Error getting like count:', error);
      return 0;
    }
  }

  /**
   * Sync like from cache to database (called by queue processor)
   * @param {string} userId - User ID
   * @param {string} postId - Post ID
   * @returns {Promise<boolean>} Success status
   */
  async syncLikeToDatabase(userId, postId) {
    try {
      // Check if already exists
      const existingLike = await Like.findOne({ user: userId, post: postId });
      if (existingLike) {
        return true; // Already synced
      }

      // Create like document
      await Like.create({ user: userId, post: postId });

      // Update post engagement count
      const post = await Post.findByIdAndUpdate(
        postId,
        { $inc: { 'engagement.likesCount': 1 } },
        { new: true }
      );

      if (post) {
        // Update post author's stats
        await User.findByIdAndUpdate(post.author, {
          $inc: { 'stats.likesReceived': 1 },
        });

        // Recalculate post score
        post.calculateScore();
        await post.save();
      }

      logger.info(`Like synced to database: ${userId} -> ${postId}`);
      return true;
    } catch (error) {
      logger.error('Error syncing like to database:', error);
      throw error;
    }
  }

  /**
   * Sync unlike from cache to database (called by queue processor)
   * @param {string} userId - User ID
   * @param {string} postId - Post ID
   * @returns {Promise<boolean>} Success status
   */
  async syncUnlikeToDatabase(userId, postId) {
    try {
      // Delete like document
      const like = await Like.findOneAndDelete({ user: userId, post: postId });
      if (!like) {
        return true; // Already removed
      }

      // Update post engagement count
      const post = await Post.findByIdAndUpdate(
        postId,
        { $inc: { 'engagement.likesCount': -1 } },
        { new: true }
      );

      if (post) {
        // Update post author's stats
        await User.findByIdAndUpdate(post.author, {
          $inc: { 'stats.likesReceived': -1 },
        });

        // Recalculate post score
        post.calculateScore();
        await post.save();
      }

      logger.info(`Unlike synced to database: ${userId} -> ${postId}`);
      return true;
    } catch (error) {
      logger.error('Error syncing unlike to database:', error);
      throw error;
    }
  }
}

module.exports = new LikeService();
