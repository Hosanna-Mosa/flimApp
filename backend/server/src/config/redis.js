const Redis = require('ioredis');
const logger = require('./logger');

// Redis configuration
const redisConfig = {
 host: process.env.REDIS_HOST,
  port: Number(process.env.REDIS_PORT),
  password: process.env.REDIS_PASSWORD,
  db: Number(process.env.REDIS_DB || 0),

  // ✅ REQUIRED FOR UPSTASH
  tls: {},

  // Optional but recommended
  maxRetriesPerRequest: 3,
  retryStrategy: (times) => Math.min(times * 50, 2000),
};

// Create Redis client
const redis = new Redis(redisConfig);

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

module.exports = redis;
