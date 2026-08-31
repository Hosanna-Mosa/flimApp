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
    feed: new Queue('feed-update', queueConfig),
    notification: new Queue('notification', queueConfig),
    subscription: new Queue('subscription-sync', queueConfig),
  };
} else {
  logger.info('Redis disabled. Using MockQueues.');
  queues = {
    feed: new MockQueue('feed-update'),
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

  async addNotificationRemovalJob(data) {
    try {
      await queues.notification.add('remove-notification', data, {
        priority: 1, // High priority
      });
      logger.info(`Notification removal job queued for user ${data.userId}`);
      return true;
    } catch (error) {
      logger.error('Error adding notification removal job:', error);
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
