const Follow = require('../models/Follow.model');
const User = require('../models/User.model');
const cacheService = require('./cache.service');
const queueService = require('./queue.service');
const logger = require('../config/logger');

/**
 * Follow Service - Handles all follow/unfollow operations
 * Supports public and private accounts with follow requests
 */
class FollowService {
  /**
   * Follow a user
   * @param {string} followerId - User who is following
   * @param {string} followingId - User being followed
   * @returns {Promise<Object>} Result with success status
   */
  async followUser(followerId, followingId) {
    try {
      logger.info(`[Follow] User ${followerId} attempting to follow user ${followingId}`);

      // Can't follow yourself
      if (followerId === followingId) {
        return { success: false, message: 'Cannot follow yourself' };
      }

      // Check if already following in DATABASE
      const existingFollow = await Follow.findOne({
        follower: followerId,
        following: followingId,
      });

      if (existingFollow) {
        logger.warn(`[Follow] Already following/requested: ${followerId} -> ${followingId}`);
        return { success: false, message: 'Already following this user' };
      }

      // Get the user being followed to check account type
      const userToFollow = await User.findById(followingId).select('accountType privacy');
      if (!userToFollow) {
        return { success: false, message: 'User not found' };
      }

      // Determine if follow requires approval
      const requiresApproval = userToFollow.accountType === 'private';
      const status = requiresApproval ? 'pending' : 'accepted';

      // Create follow document in DATABASE
      const follow = await Follow.create({
        follower: followerId,
        following: followingId,
        status,
      });

      logger.info(`[Follow] Created follow document: ${follow._id} (${status})`);

      // Update stats only for accepted follows
      let followingCount = 0;
      let followersCount = 0;

      if (status === 'accepted') {
        // Increment following count for follower
        const follower = await User.findByIdAndUpdate(followerId, {
          $inc: { 'stats.followingCount': 1 },
        }, { new: true });
        followingCount = follower?.stats?.followingCount || 0;

        // Increment followers count for followed user
        const following = await User.findByIdAndUpdate(followingId, {
          $inc: { 'stats.followersCount': 1 },
        }, { new: true });
        followersCount = following?.stats?.followersCount || 0;

        logger.info(`[Follow] Updated stats: Following(${followingCount}) Followers(${followersCount})`);

        // Queue feed update (no immediate need for feed update, can still use queue)
        queueService.addFeedUpdateJob(followerId).catch(err => logger.error('Feed update job failed', err));
      }

      // Update cache (optional, for performance)
      try {
        if (!requiresApproval) {
          await cacheService.addFollow(followerId, followingId);
        }
      } catch (cacheError) {
        logger.warn('[Follow] Cache update failed (non-critical):', cacheError.message);
      }

      return {
        success: true,
        message: requiresApproval 
          ? 'Follow request sent' 
          : 'User followed successfully',
        status,
        followingCount,
        followersCount,
      };
    } catch (error) {
      logger.error('[Follow] Error in followUser:', error);
      throw new Error('Failed to follow user');
    }
  }

  /**
   * Unfollow a user
   * @param {string} followerId - User who is unfollowing
   * @param {string} followingId - User being unfollowed
   * @returns {Promise<Object>} Result with success status
   */
  async unfollowUser(followerId, followingId) {
    try {
      logger.info(`[Unfollow] User ${followerId} attempting to unfollow user ${followingId}`);

      // Delete follow document in DATABASE
      const follow = await Follow.findOneAndDelete({
        follower: followerId,
        following: followingId,
      });

      if (!follow) {
        logger.warn(`[Unfollow] Not following: ${followerId} -> ${followingId}`);
        return { success: false, message: 'Not following this user' };
      }

      logger.info(`[Unfollow] Deleted follow document: ${follow._id}`);

      let followingCount = 0;
      let followersCount = 0;

      // Update stats only if it was an accepted follow
      if (follow.status === 'accepted') {
        const follower = await User.findByIdAndUpdate(followerId, {
          $inc: { 'stats.followingCount': -1 },
        }, { new: true });
        followingCount = follower?.stats?.followingCount || 0;

        const following = await User.findByIdAndUpdate(followingId, {
          $inc: { 'stats.followersCount': -1 },
        }, { new: true });
        followersCount = following?.stats?.followersCount || 0;

        logger.info(`[Unfollow] Updated stats: Following(${followingCount}) Followers(${followersCount})`);

        // Invalidate feed (no immediate need, can run in background)
        cacheService.invalidateUserFeed(followerId).catch(err => logger.error('Feed inavlidation failed', err));
      }

      // Update cache (optional, for performance)
      try {
        await cacheService.removeFollow(followerId, followingId);
      } catch (cacheError) {
        logger.warn('[Unfollow] Cache update failed (non-critical):', cacheError.message);
      }

      return {
        success: true,
        message: 'User unfollowed successfully',
        followingCount,
        followersCount,
      };
    } catch (error) {
      logger.error('[Unfollow] Error in unfollowUser:', error);
      throw new Error('Failed to unfollow user');
    }
  }

  /**
   * Accept a follow request (for private accounts)
   * @param {string} userId - User accepting the request
   * @param {string} followerId - User who requested to follow
   * @returns {Promise<Object>} Result with success status
   */
  async acceptFollowRequest(userId, followerId) {
    try {
      const follow = await Follow.findOne({
        follower: followerId,
        following: userId,
        status: 'pending',
      });

      if (!follow) {
        return { success: false, message: 'No pending follow request found' };
      }

      // Update follow status
      follow.status = 'accepted';
      await follow.save();

      // Update cache
      await cacheService.addFollow(followerId, userId);

      // Update stats in database
      await User.findByIdAndUpdate(followerId, {
        $inc: { 'stats.followingCount': 1 },
      });
      await User.findByIdAndUpdate(userId, {
        $inc: { 'stats.followersCount': 1 },
      });

      // Queue feed update for the new follower
      await queueService.addFeedUpdateJob(followerId);

      logger.info(`User ${userId} accepted follow request from ${followerId}`);

      return {
        success: true,
        message: 'Follow request accepted',
      };
    } catch (error) {
      logger.error('Error accepting follow request:', error);
      throw new Error('Failed to accept follow request');
    }
  }

  /**
   * Reject a follow request (for private accounts)
   * @param {string} userId - User rejecting the request
   * @param {string} followerId - User who requested to follow
   * @returns {Promise<Object>} Result with success status
   */
  async rejectFollowRequest(userId, followerId) {
    try {
      const follow = await Follow.findOneAndDelete({
        follower: followerId,
        following: userId,
        status: 'pending',
      });

      if (!follow) {
        return { success: false, message: 'No pending follow request found' };
      }

      logger.info(`User ${userId} rejected follow request from ${followerId}`);

      return {
        success: true,
        message: 'Follow request rejected',
      };
    } catch (error) {
      logger.error('Error rejecting follow request:', error);
      throw new Error('Failed to reject follow request');
    }
  }

  /**
   * Get user's followers (paginated)
   * @param {string} userId - User ID
   * @param {number} page - Page number
   * @param {number} limit - Items per page
   * @returns {Promise<Object>} Paginated followers
   */
  async getFollowers(userId, page = 0, limit = 20) {
    try {
      const skip = page * limit;

      const follows = await Follow.find({
        following: userId,
        status: 'accepted',
      })
        .populate('follower', 'name avatar isVerified roles bio stats')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();

      const total = await Follow.countDocuments({
        following: userId,
        status: 'accepted',
      });

      return {
        success: true,
        data: follows.map(f => f.follower).filter(Boolean),
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      logger.error('Error getting followers:', error);
      throw new Error('Failed to get followers');
    }
  }

  /**
   * Get users that a user is following (paginated)
   * @param {string} userId - User ID
   * @param {number} page - Page number
   * @param {number} limit - Items per page
   * @returns {Promise<Object>} Paginated following
   */
  async getFollowing(userId, page = 0, limit = 20) {
    try {
      const skip = page * limit;

      const follows = await Follow.find({
        follower: userId,
        status: 'accepted',
      })
        .populate('following', 'name avatar isVerified roles bio stats')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();

      const total = await Follow.countDocuments({
        follower: userId,
        status: 'accepted',
      });

      return {
        success: true,
        data: follows.map(f => f.following).filter(Boolean),
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      logger.error('Error getting following:', error);
      throw new Error('Failed to get following');
    }
  }

  /**
   * Get pending follow requests for a user
   * @param {string} userId - User ID
   * @param {number} page - Page number
   * @param {number} limit - Items per page
   * @returns {Promise<Object>} Paginated pending requests
   */
  async getPendingRequests(userId, page = 0, limit = 20) {
    try {
      const skip = page * limit;

      const follows = await Follow.find({
        following: userId,
        status: 'pending',
      })
        .populate('follower', 'name avatar isVerified roles bio')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();

      const total = await Follow.countDocuments({
        following: userId,
        status: 'pending',
      });

      return {
        success: true,
        data: follows.map(f => f.follower).filter(Boolean),
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      logger.error('Error getting pending requests:', error);
      throw new Error('Failed to get pending requests');
    }
  }

  /**
   * Check if user is following another user
   * @param {string} followerId - User ID
   * @param {string} followingId - User ID
   * @returns {Promise<boolean>} True if following
   */
  async isFollowing(followerId, followingId) {
    try {
      // Try cache first
      const cachedResult = await cacheService.isFollowing(followerId, followingId);
      if (cachedResult !== null) {
        return cachedResult;
      }

      // Fallback to database
      const follow = await Follow.findOne({
        follower: followerId,
        following: followingId,
        status: 'accepted',
      });

      return !!follow;
    } catch (error) {
      logger.error('Error checking follow status:', error);
      return false;
    }
  }

  /**
   * Get mutual followers between two users
   * @param {string} userId1 - First user ID
   * @param {string} userId2 - Second user ID
   * @returns {Promise<Object>} Mutual followers data
   */
  async getMutualFollowers(userId1, userId2) {
    try {
      const mutualCount = await Follow.getMutualFollowers(userId1, userId2);

      return {
        success: true,
        count: mutualCount,
      };
    } catch (error) {
      logger.error('Error getting mutual followers:', error);
      throw new Error('Failed to get mutual followers');
    }
  }

  /**
   * Sync follow to database (called by queue processor)
   * @param {Object} data - Follow data
   * @returns {Promise<boolean>} Success status
   */
  async syncFollowToDatabase(data) {
    try {
      const { followerId, followingId, status } = data;

      // Check if already exists
      const existingFollow = await Follow.findOne({
        follower: followerId,
        following: followingId,
      });

      if (existingFollow) {
        return true; // Already synced
      }

      // Create follow document
      await Follow.create({
        follower: followerId,
        following: followingId,
        status,
      });

      // Update stats only for accepted follows
      if (status === 'accepted') {
        await User.findByIdAndUpdate(followerId, {
          $inc: { 'stats.followingCount': 1 },
        });
        await User.findByIdAndUpdate(followingId, {
          $inc: { 'stats.followersCount': 1 },
        });

        // Queue feed update for the follower
        await queueService.addFeedUpdateJob(followerId);
      }

      logger.info(`Follow synced to database: ${followerId} -> ${followingId} (${status})`);
      return true;
    } catch (error) {
      logger.error('Error syncing follow to database:', error);
      throw error;
    }
  }

  /**
   * Sync unfollow to database (called by queue processor)
   * @param {Object} data - Unfollow data
   * @returns {Promise<boolean>} Success status
   */
  async syncUnfollowToDatabase(data) {
    try {
      const { followerId, followingId } = data;

      // Delete follow document
      const follow = await Follow.findOneAndDelete({
        follower: followerId,
        following: followingId,
      });

      if (!follow) {
        return true; // Already removed
      }

      // Update stats only if it was an accepted follow
      if (follow.status === 'accepted') {
        await User.findByIdAndUpdate(followerId, {
          $inc: { 'stats.followingCount': -1 },
        });
        await User.findByIdAndUpdate(followingId, {
          $inc: { 'stats.followersCount': -1 },
        });
      }

      logger.info(`Unfollow synced to database: ${followerId} -> ${followingId}`);
      return true;
    } catch (error) {
      logger.error('Error syncing unfollow to database:', error);
      throw error;
    }
  }
}

module.exports = new FollowService();
