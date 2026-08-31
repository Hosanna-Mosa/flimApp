const redis = require('../config/redis');
const logger = require('../config/logger');

/**
 * Cache Service - Handles all caching operations with Redis
 * Implements patterns used by major social media platforms
 */
class CacheService {
  constructor() {
    this.DEFAULT_TTL = 300; // 5 minutes
    this.FEED_TTL = 300; // 5 minutes for feed cache
    this.STATS_TTL = 60; // 1 minute for stats
    this.USER_TTL = 600; // 10 minutes for user data
  }

  /**
   * Generate cache keys
   */
  keys = {
    userStats: (userId) => `user:${userId}:stats`,
    userLiked: (userId) => `user:${userId}:liked`,
    userFollowers: (userId) => `user:${userId}:followers`,
    userFollowing: (userId) => `user:${userId}:following`,
    postLikes: (postId) => `post:${postId}:likes`,
    postStats: (postId) => `post:${postId}:stats`,
    postComments: (postId) => `post:${postId}:comments`,
    userFeed: (userId) => `feed:${userId}`,
    trendingPosts: () => 'trending:posts',
    userProfile: (userId) => `user:${userId}:profile`,
  };

  /**
   * Post Stats Operations
   */
  async getPostStats(postId) {
    try {
      const stats = await redis.hgetall(this.keys.postStats(postId));
      if (Object.keys(stats).length === 0) return null;
      
      return {
        likesCount: parseInt(stats.likesCount) || 0,
        commentsCount: parseInt(stats.commentsCount) || 0,
        sharesCount: parseInt(stats.sharesCount) || 0,
        viewsCount: parseInt(stats.viewsCount) || 0,
      };
    } catch (error) {
      logger.error('Error getting post stats from cache:', error);
      return null;
    }
  }

  async setPostStats(postId, stats) {
    try {
      await redis.hmset(this.keys.postStats(postId), stats);
      await redis.expire(this.keys.postStats(postId), this.STATS_TTL);
      return true;
    } catch (error) {
      logger.error('Error setting post stats in cache:', error);
      return false;
    }
  }

  async incrementPostStat(postId, field, value = 1) {
    try {
      await redis.hincrby(this.keys.postStats(postId), field, value);
      await redis.expire(this.keys.postStats(postId), this.STATS_TTL);
      return true;
    } catch (error) {
      logger.error('Error incrementing post stat:', error);
      return false;
    }
  }

  /**
   * Like Operations
   */
  async addLike(userId, postId) {
    try {
      const timestamp = Date.now();
      const pipeline = redis.pipeline();
      
      // Add to user's liked posts set
      pipeline.sadd(this.keys.userLiked(userId), postId);
      
      // Add to post's likes sorted set (score = timestamp for chronological order)
      pipeline.zadd(this.keys.postLikes(postId), timestamp, userId);
      
      // Increment post likes count
      pipeline.hincrby(this.keys.postStats(postId), 'likesCount', 1);
      
      // Set expiration
      pipeline.expire(this.keys.userLiked(userId), this.USER_TTL);
      pipeline.expire(this.keys.postLikes(postId), this.STATS_TTL);
      pipeline.expire(this.keys.postStats(postId), this.STATS_TTL);
      
      await pipeline.exec();
      return true;
    } catch (error) {
      logger.error('Error adding like to cache:', error);
      return false;
    }
  }

  async removeLike(userId, postId) {
    try {
      const pipeline = redis.pipeline();
      
      // Remove from user's liked posts
      pipeline.srem(this.keys.userLiked(userId), postId);
      
      // Remove from post's likes
      pipeline.zrem(this.keys.postLikes(postId), userId);
      
      // Decrement post likes count
      pipeline.hincrby(this.keys.postStats(postId), 'likesCount', -1);
      
      await pipeline.exec();
      return true;
    } catch (error) {
      logger.error('Error removing like from cache:', error);
      return false;
    }
  }

  async hasLiked(userId, postId) {
    try {
      const result = await redis.sismember(this.keys.userLiked(userId), postId);
      return result === 1;
    } catch (error) {
      logger.error('Error checking like status:', error);
      return false;
    }
  }

  /**
   * Follow Operations
   */
  async addFollow(followerId, followingId) {
    try {
      const timestamp = Date.now();
      const pipeline = redis.pipeline();
      
      // Add to follower's following list
      pipeline.zadd(this.keys.userFollowing(followerId), timestamp, followingId);
      
      // Add to following's followers list
      pipeline.zadd(this.keys.userFollowers(followingId), timestamp, followerId);
      
      // Update stats
      pipeline.hincrby(this.keys.userStats(followerId), 'followingCount', 1);
      pipeline.hincrby(this.keys.userStats(followingId), 'followersCount', 1);
      
      // Set expiration
      pipeline.expire(this.keys.userFollowing(followerId), this.USER_TTL);
      pipeline.expire(this.keys.userFollowers(followingId), this.USER_TTL);
      
      await pipeline.exec();
      return true;
    } catch (error) {
      logger.error('Error adding follow to cache:', error);
      return false;
    }
  }

  async removeFollow(followerId, followingId) {
    try {
      const pipeline = redis.pipeline();
      
      // Remove from lists
      pipeline.zrem(this.keys.userFollowing(followerId), followingId);
      pipeline.zrem(this.keys.userFollowers(followingId), followerId);
      
      // Update stats
      pipeline.hincrby(this.keys.userStats(followerId), 'followingCount', -1);
      pipeline.hincrby(this.keys.userStats(followingId), 'followersCount', -1);
      
      await pipeline.exec();
      return true;
    } catch (error) {
      logger.error('Error removing follow from cache:', error);
      return false;
    }
  }

  /**
   * Feed Operations
   */
  async getUserFeed(userId, page = 0, limit = 20) {
    try {
      const start = page * limit;
      const end = start + limit - 1;
      const postIds = await redis.lrange(this.keys.userFeed(userId), start, end);
      return postIds;
    } catch (error) {
      logger.error('Error getting user feed from cache:', error);
      return null;
    }
  }

  async setUserFeed(userId, postIds) {
    try {
      const key = this.keys.userFeed(userId);
      await redis.del(key); // Clear existing feed
      if (postIds.length > 0) {
        await redis.rpush(key, ...postIds);
        await redis.expire(key, this.FEED_TTL);
      }
      return true;
    } catch (error) {
      logger.error('Error setting user feed in cache:', error);
      return false;
    }
  }

  async invalidateUserFeed(userId) {
    try {
      await redis.del(this.keys.userFeed(userId));
      return true;
    } catch (error) {
      logger.error('Error invalidating user feed:', error);
      return false;
    }
  }

}

module.exports = new CacheService();
