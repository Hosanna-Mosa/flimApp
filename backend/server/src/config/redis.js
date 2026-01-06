const Redis = require('ioredis');
const logger = require('./logger');

const enableRedis = process.env.ENABLE_REDIS === 'true';

class MockRedis {
  constructor() {
    this.status = 'ready';
  }

  on(event, callback) {
    if (event === 'ready' || event === 'connect') {
      callback();
    }
  }

  async get() { return null; }
  async set() { return 'OK'; }
  async setex() { return 'OK'; }
  async del() { return 1; }
  async keys() { return []; }
  async ping() { return 'PONG'; }
  async quit() { return 'OK'; }

  // Hash operations
  async hgetall() { return {}; }
  async hmset() { return 'OK'; }
  async hincrby() { return 1; }
  async hget() { return null; }

  // Set operations
  async sadd() { return 1; }
  async srem() { return 1; }
  async sismember() { return 0; }
  async smembers() { return []; }

  // Sorted Set operations
  async zadd() { return 1; }
  async zrem() { return 1; }
  async zcard() { return 0; }
  async zscore() { return null; }
  async zrange() { return []; }

  // List operations
  async lrange() { return []; }
  async rpush() { return 1; }
  async lpush() { return 1; }

  pipeline() {
    return {
      sadd: () => this,
      zadd: () => this,
      hincrby: () => this,
      expire: () => this,
      srem: () => this,
      zrem: () => this,
      exec: async () => []
    };
  }

  async expire() { return 1; }
}

let redis;

if (enableRedis) {
  // Redis configuration
  const redisConfig = {
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
    password: process.env.REDIS_PASSWORD || undefined,
    db: process.env.REDIS_DB || 0,
    retryStrategy: (times) => {
      const delay = Math.min(times * 50, 2000);
      return delay;
    },
    maxRetriesPerRequest: 3,
  };

  // Create Redis client
  redis = new Redis(redisConfig);

  // Event handlers
  redis.on('connect', () => {
    logger.info('Redis client connected');
  });

  redis.on('error', (err) => {
    logger.error('Redis client error:', err);
  });

  redis.on('ready', () => {
    logger.info('Redis client ready');
  });

  redis.on('reconnecting', () => {
    logger.warn('Redis client reconnecting');
  });
} else {
  logger.info('Redis is disabled via ENABLE_REDIS. Using MockRedis.');
  redis = new MockRedis();
}

module.exports = redis;
