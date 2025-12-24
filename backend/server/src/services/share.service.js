const Share = require('../models/Share.model');
const Post = require('../models/Post.model');
const User = require('../models/User.model');
const cacheService = require('./cache.service');
const queueService = require('./queue.service');
const logger = require('../config/logger');

/**
 * Share Service - Handles all share operations
 * Supports different share types (repost, quote, external)
 */
class ShareService {
  /**
   * Share a post
   * @param {Object} data - Share data
   * @returns {Promise<Object>} Created share
   */
  async sharePost(data) {
    try {
      const { userId, postId, shareType = 'repost', caption = '', platform = null } = data;

      // Validate post exists
      const post = await Post.findById(postId).select('author privacy visibility');
      if (!post) {
        return { success: false, message: 'Post not found' };
      }

      // Check if shares are allowed
      const postAuthor = await User.findById(post.author).select('privacy');
      if (postAuthor && !postAuthor.privacy.allowShares) {
        return { success: false, message: 'Sharing is disabled for this post' };
      }

      // Check post visibility
      if (post.visibility === 'private') {
        return { success: false, message: 'Cannot share private posts' };
      }

      // Create share
      const share = await Share.create({
        user: userId,
        post: postId,
        shareType,
        caption: caption ? caption.trim() : undefined,
        platform,
      });

      // Update cache - increment share count
      await cacheService.incrementPostStat(postId, 'sharesCount', 1);

      // Update post engagement count in database
      await Post.findByIdAndUpdate(postId, {
        $inc: { 'engagement.sharesCount': 1 },
      });

      // Update post score
      const updatedPost = await Post.findById(postId);
      if (updatedPost) {
        updatedPost.calculateScore();
        await updatedPost.save();
      }

      // Queue notification job (notify post author)
      if (post.author.toString() !== userId) {
        await queueService.addNotificationJob({
          userId: post.author,
          type: 'share',
          actorId: userId,
          postId,
          shareId: share._id,
        });
      }

      logger.info(`Post ${postId} shared by user ${userId} (type: ${shareType})`);

      return {
        success: true,
        message: 'Post shared successfully',
        data: share,
      };
    } catch (error) {
      logger.error('Error sharing post:', error);
      throw new Error('Failed to share post');
    }
  }

  /**
   * Get shares for a post (paginated)
   * @param {string} postId - Post ID
   * @param {number} page - Page number
   * @param {number} limit - Items per page
   * @returns {Promise<Object>} Paginated shares
   */
  async getPostShares(postId, page = 0, limit = 20) {
    try {
      const skip = page * limit;

      const shares = await Share.find({ post: postId })
        .populate('user', 'name avatar isVerified roles')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();

      const total = await Share.countDocuments({ post: postId });

      return {
        success: true,
        data: shares,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      logger.error('Error getting post shares:', error);
      throw new Error('Failed to get shares');
    }
  }

  /**
   * Get user's shared posts (paginated)
   * @param {string} userId - User ID
   * @param {number} page - Page number
   * @param {number} limit - Items per page
   * @returns {Promise<Object>} Paginated shared posts
   */
  async getUserShares(userId, page = 0, limit = 20) {
    try {
      const skip = page * limit;

      const shares = await Share.find({ user: userId })
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

      const total = await Share.countDocuments({ user: userId });

      return {
        success: true,
        data: shares.filter(s => s.post), // Filter out shares of deleted posts
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      logger.error('Error getting user shares:', error);
      throw new Error('Failed to get user shares');
    }
  }

  /**
   * Check if user has shared a post
   * @param {string} userId - User ID
   * @param {string} postId - Post ID
   * @returns {Promise<boolean>} True if shared
   */
  async hasShared(userId, postId) {
    try {
      const share = await Share.findOne({ user: userId, post: postId });
      return !!share;
    } catch (error) {
      logger.error('Error checking share status:', error);
      return false;
    }
  }

  /**
   * Get share count for a post
   * @param {string} postId - Post ID
   * @returns {Promise<number>} Share count
   */
  async getPostShareCount(postId) {
    try {
      // Try cache first
      const cachedStats = await cacheService.getPostStats(postId);
      if (cachedStats && cachedStats.sharesCount !== undefined) {
        return cachedStats.sharesCount;
      }

      // Fallback to database
      const count = await Share.countDocuments({ post: postId });

      // Update cache
      if (count > 0) {
        await cacheService.setPostStats(postId, { sharesCount: count });
      }

      return count;
    } catch (error) {
      logger.error('Error getting share count:', error);
      return 0;
    }
  }

  /**
   * Delete a share
   * @param {string} shareId - Share ID
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Result
   */
  async deleteShare(shareId, userId) {
    try {
      const share = await Share.findById(shareId);

      if (!share) {
        return { success: false, message: 'Share not found' };
      }

      // Check ownership
      if (share.user.toString() !== userId) {
        return { success: false, message: 'Not authorized to delete this share' };
      }

      await share.deleteOne();

      // Update cache - decrement share count
      await cacheService.incrementPostStat(share.post, 'sharesCount', -1);

      // Update post engagement count
      await Post.findByIdAndUpdate(share.post, {
        $inc: { 'engagement.sharesCount': -1 },
      });

      // Update post score
      const post = await Post.findById(share.post);
      if (post) {
        post.calculateScore();
        await post.save();
      }

      logger.info(`Share ${shareId} deleted by user ${userId}`);

      return {
        success: true,
        message: 'Share deleted successfully',
      };
    } catch (error) {
      logger.error('Error deleting share:', error);
      throw new Error('Failed to delete share');
    }
  }

  /**
   * Get share statistics by platform
   * @param {string} postId - Post ID
   * @returns {Promise<Object>} Share stats by platform
   */
  async getShareStatsByPlatform(postId) {
    try {
      const stats = await Share.aggregate([
        { $match: { post: postId } },
        {
          $group: {
            _id: '$platform',
            count: { $sum: 1 },
          },
        },
        {
          $sort: { count: -1 },
        },
      ]);

      return {
        success: true,
        data: stats,
      };
    } catch (error) {
      logger.error('Error getting share stats by platform:', error);
      throw new Error('Failed to get share statistics');
    }
  }
}

module.exports = new ShareService();
