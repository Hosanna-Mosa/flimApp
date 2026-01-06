const Queue = require('bull');
const logger = require('../config/logger');

const enableRedis = process.env.ENABLE_REDIS !== 'false';

// Mock Queue class for when Redis is disabled
class MockQueue {
  constructor(name) {
    this.name = name;
    this.handlers = {};
    this.eventHandlers = {};
  }

  process(name, handler) {
    // If name is function, it's the default handler
    if (typeof name === 'function') {
      this.handlers['__default__'] = name;
    } else {
      this.handlers[name] = handler;
    }
  }

  async add(name, data, opts) {
    // Handle optional name argument (Bull signature: (name?, data, opts?))
    if (typeof name !== 'string') {
      opts = data;
      data = name;
      name = '__default__';
    }

    logger.info(`[MockQueue] Adding job to ${this.name}: ${name}`);

    // Execute handler immediately
    const handler = this.handlers[name];
    if (handler) {
      try {
        const job = { data, id: 'mock-id-' + Date.now() };
        await handler(job);
        this.emit('completed', job, { mocked: true });
        return job;
      } catch (err) {
        logger.error(`[MockQueue] Error processing job ${name}:`, err);
        this.emit('failed', { data, id: 'mock-id' }, err);
        // We don't rethrow to avoid crashing the caller
      }
    } else {
      logger.warn(`[MockQueue] No handler found for job ${name} in queue ${this.name}`);
    }
    return { id: 'mock-id' };
  }

  async addBulk(jobs) {
    logger.info(`[MockQueue] Adding bulk jobs to ${this.name}`);
    return Promise.all(jobs.map(job => this.add(job.name, job.data, job.opts)));
  }

  on(event, callback) {
    if (!this.eventHandlers[event]) {
      this.eventHandlers[event] = [];
    }
    this.eventHandlers[event].push(callback);
  }

  emit(event, ...args) {
    if (this.eventHandlers[event]) {
      this.eventHandlers[event].forEach(cb => cb(...args));
    }
  }

  async getWaitingCount() { return 0; }
  async getActiveCount() { return 0; }
  async getCompletedCount() { return 0; }
  async getFailedCount() { return 0; }
  async getDelayedCount() { return 0; }
  async clean() { return []; }
  async pause() { return true; }
  async resume() { return true; }
  async close() { return true; }
}

// Queue configuration
const queueConfig = {
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
    password: process.env.REDIS_PASSWORD || undefined,
  },
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
    removeOnComplete: true,
    removeOnFail: false,
  },
};

// Create queues for different job types
let queues = {};

if (enableRedis) {
  queues = {
    like: new Queue('like-sync', queueConfig),
    follow: new Queue('follow-sync', queueConfig),
    comment: new Queue('comment-sync', queueConfig),
    share: new Queue('share-sync', queueConfig),
    feed: new Queue('feed-update', queueConfig),
    stats: new Queue('stats-sync', queueConfig),
    notification: new Queue('notification', queueConfig),
    subscription: new Queue('subscription-sync', queueConfig),
  };
} else {
  logger.info('Redis disabled. Using MockQueues.');
  queues = {
    like: new MockQueue('like-sync'),
    follow: new MockQueue('follow-sync'),
    comment: new MockQueue('comment-sync'),
    share: new MockQueue('share-sync'),
    feed: new MockQueue('feed-update'),
    stats: new MockQueue('stats-sync'),
    notification: new MockQueue('notification'),
    subscription: new MockQueue('subscription-sync'),
  };
}

/**
 * Queue Service - Manages background jobs for async operations
 */
class QueueService {
  constructor() {
    this.initRecurringJobs();
  }

  initRecurringJobs() {
    // Check for expired subscriptions every hour
    queues.subscription.add('check-expiry', {}, {
      repeat: { cron: '0 * * * *' }, // Every hour
      removeOnComplete: true,
    }).catch(err => logger.error('Error starting subscription expiry check job:', err));
  }
  /**
   * Like/Unlike Jobs
   */
  async addLikeJob(data) {
    try {
      await queues.like.add('sync-like', data, {
        priority: 2,
      });
      logger.info(`Like job queued for user ${data.userId} on post ${data.postId}`);
      return true;
    } catch (error) {
      logger.error('Error adding like job:', error);
      return false;
    }
  }

  async addUnlikeJob(data) {
    try {
      await queues.like.add('sync-unlike', data, {
        priority: 2,
      });
      logger.info(`Unlike job queued for user ${data.userId} on post ${data.postId}`);
      return true;
    } catch (error) {
      logger.error('Error adding unlike job:', error);
      return false;
    }
  }

  /**
   * Follow/Unfollow Jobs
   */
  async addFollowJob(data) {
    try {
      await queues.follow.add('sync-follow', data, {
        priority: 2,
      });
      logger.info(`Follow job queued for ${data.followerId} -> ${data.followingId}`);
      return true;
    } catch (error) {
      logger.error('Error adding follow job:', error);
      return false;
    }
  }

  async addUnfollowJob(data) {
    try {
      await queues.follow.add('sync-unfollow', data, {
        priority: 2,
      });
      logger.info(`Unfollow job queued for ${data.followerId} -> ${data.followingId}`);
      return true;
    } catch (error) {
      logger.error('Error adding unfollow job:', error);
      return false;
    }
  }

  /**
   * Comment Jobs
   */
  async addCommentJob(data) {
    try {
      await queues.comment.add('sync-comment', data, {
        priority: 2,
      });
      logger.info(`Comment job queued for post ${data.postId}`);
      return true;
    } catch (error) {
      logger.error('Error adding comment job:', error);
      return false;
    }
  }

  async addDeleteCommentJob(data) {
    try {
      await queues.comment.add('delete-comment', data, {
        priority: 2,
      });
      logger.info(`Delete comment job queued for comment ${data.commentId}`);
      return true;
    } catch (error) {
      logger.error('Error adding delete comment job:', error);
      return false;
    }
  }

  /**
   * Share Jobs
   */
  async addShareJob(data) {
    try {
      await queues.share.add('sync-share', data, {
        priority: 2,
      });
      logger.info(`Share job queued for post ${data.postId}`);
      return true;
    } catch (error) {
      logger.error('Error adding share job:', error);
      return false;
    }
  }

  /**
   * Feed Update Jobs
   */
  async addFeedUpdateJob(userId) {
    try {
      await queues.feed.add('update-feed', { userId }, {
        priority: 3, // Lower priority
        delay: 5000, // Delay 5 seconds to batch updates
      });
      logger.info(`Feed update job queued for user ${userId}`);
      return true;
    } catch (error) {
      logger.error('Error adding feed update job:', error);
      return false;
    }
  }

  async addBulkFeedUpdateJob(userIds) {
    try {
      const jobs = userIds.map(userId => ({
        name: 'update-feed',
        data: { userId },
        opts: { priority: 3, delay: 5000 },
      }));

      await queues.feed.addBulk(jobs);
      logger.info(`Bulk feed update jobs queued for ${userIds.length} users`);
      return true;
    } catch (error) {
      logger.error('Error adding bulk feed update jobs:', error);
      return false;
    }
  }

  /**
   * Stats Sync Jobs
   */
  async addStatsSyncJob(data) {
    try {
      await queues.stats.add('sync-stats', data, {
        priority: 4, // Lowest priority
        delay: 10000, // Delay 10 seconds to batch
      });
      logger.info(`Stats sync job queued`);
      return true;
    } catch (error) {
      logger.error('Error adding stats sync job:', error);
      return false;
    }
  }

  /**
   * Notification Jobs
   */
  async addNotificationJob(data) {
    try {
      await queues.notification.add('send-notification', data, {
        priority: 1, // High priority
      });
      logger.info(`Notification job queued for user ${data.userId}`);
      return true;
    } catch (error) {
      logger.error('Error adding notification job:', error);
      return false;
    }
  }

  /**
   * Queue Management
   */
  async getQueueStats() {
    try {
      const stats = {};

      for (const [name, queue] of Object.entries(queues)) {
        const [waiting, active, completed, failed, delayed] = await Promise.all([
          queue.getWaitingCount(),
          queue.getActiveCount(),
          queue.getCompletedCount(),
          queue.getFailedCount(),
          queue.getDelayedCount(),
        ]);

        stats[name] = {
          waiting,
          active,
          completed,
          failed,
          delayed,
          total: waiting + active + delayed,
        };
      }

      return stats;
    } catch (error) {
      logger.error('Error getting queue stats:', error);
      return null;
    }
  }

  async cleanQueues() {
    try {
      for (const queue of Object.values(queues)) {
        await queue.clean(24 * 3600 * 1000, 'completed'); // Clean completed jobs older than 24h
        await queue.clean(7 * 24 * 3600 * 1000, 'failed'); // Clean failed jobs older than 7 days
      }
      logger.info('Queues cleaned successfully');
      return true;
    } catch (error) {
      logger.error('Error cleaning queues:', error);
      return false;
    }
  }

  async pauseAllQueues() {
    try {
      await Promise.all(Object.values(queues).map(q => q.pause()));
      logger.info('All queues paused');
      return true;
    } catch (error) {
      logger.error('Error pausing queues:', error);
      return false;
    }
  }

  async resumeAllQueues() {
    try {
      await Promise.all(Object.values(queues).map(q => q.resume()));
      logger.info('All queues resumed');
      return true;
    } catch (error) {
      logger.error('Error resuming queues:', error);
      return false;
    }
  }

  /**
   * Get queue instances for processor registration
   */
  getQueues() {
    return queues;
  }
}

module.exports = new QueueService();
