const queueService = require('../services/queue.service');
const likeService = require('../services/like.service');
const followService = require('../services/follow.service');
const feedService = require('../services/feed.service');
const logger = require('../config/logger');

/**
 * Queue Processors - Handle background job processing
 * Keeps database in sync with cache
 */

// Get all queues
const queues = queueService.getQueues();

/**
 * Like Queue Processor
 */
queues.like.process('sync-like', async (job) => {
  const { userId, postId } = job.data;
  logger.info(`Processing like sync: ${userId} -> ${postId}`);
  
  try {
    await likeService.syncLikeToDatabase(userId, postId);
    return { success: true, userId, postId };
  } catch (error) {
    logger.error('Like sync failed:', error);
    throw error; // Will trigger retry
  }
});

queues.like.process('sync-unlike', async (job) => {
  const { userId, postId } = job.data;
  logger.info(`Processing unlike sync: ${userId} -> ${postId}`);
  
  try {
    await likeService.syncUnlikeToDatabase(userId, postId);
    return { success: true, userId, postId };
  } catch (error) {
    logger.error('Unlike sync failed:', error);
    throw error;
  }
});

/**
 * Follow Queue Processor
 */
queues.follow.process('sync-follow', async (job) => {
  const data = job.data;
  logger.info(`Processing follow sync: ${data.followerId} -> ${data.followingId}`);
  
  try {
    await followService.syncFollowToDatabase(data);
    return { success: true, ...data };
  } catch (error) {
    logger.error('Follow sync failed:', error);
    throw error;
  }
});

queues.follow.process('sync-unfollow', async (job) => {
  const data = job.data;
  logger.info(`Processing unfollow sync: ${data.followerId} -> ${data.followingId}`);
  
  try {
    await followService.syncUnfollowToDatabase(data);
    return { success: true, ...data };
  } catch (error) {
    logger.error('Unfollow sync failed:', error);
    throw error;
  }
});

/**
 * Feed Queue Processor
 */
queues.feed.process('update-feed', async (job) => {
  const { userId } = job.data;
  logger.info(`Processing feed update: ${userId}`);
  
  try {
    await feedService.regenerateFeed(userId);
    return { success: true, userId };
  } catch (error) {
    logger.error('Feed update failed:', error);
    throw error;
  }
});

/**
 * Notification Queue Processor (placeholder)
 */
queues.notification.process('send-notification', async (job) => {
  const data = job.data;
  logger.info(`Processing notification: ${data.type} for user ${data.userId}`);
  
  try {
    // TODO: Implement notification sending logic
    // This could send push notifications, emails, or in-app notifications
    
    // For now, just log it
    logger.info('Notification sent:', data);
    return { success: true, ...data };
  } catch (error) {
    logger.error('Notification failed:', error);
    throw error;
  }
});

/**
 * Event Handlers
 */

// Like queue events
queues.like.on('completed', (job, result) => {
  logger.info(`Like job ${job.id} completed:`, result);
});

queues.like.on('failed', (job, err) => {
  logger.error(`Like job ${job.id} failed:`, err.message);
});

// Follow queue events
queues.follow.on('completed', (job, result) => {
  logger.info(`Follow job ${job.id} completed:`, result);
});

queues.follow.on('failed', (job, err) => {
  logger.error(`Follow job ${job.id} failed:`, err.message);
});

// Feed queue events
queues.feed.on('completed', (job, result) => {
  logger.info(`Feed job ${job.id} completed:`, result);
});

queues.feed.on('failed', (job, err) => {
  logger.error(`Feed job ${job.id} failed:`, err.message);
});

// Notification queue events
queues.notification.on('completed', (job, result) => {
  logger.info(`Notification job ${job.id} completed:`, result);
});

queues.notification.on('failed', (job, err) => {
  logger.error(`Notification job ${job.id} failed:`, err.message);
});

// Global error handler
Object.values(queues).forEach(queue => {
  queue.on('error', (error) => {
    logger.error('Queue error:', error);
  });
});

logger.info('Queue processors initialized successfully');

module.exports = { queues };
