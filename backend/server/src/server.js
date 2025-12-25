require('dotenv').config();
const http = require('http');
const { Server } = require('socket.io');
const app = require('./app');
const connectDB = require('./config/db');
const registerChatHandlers = require('./sockets/chat.socket');
const configureCloudinary = require('./config/cloudinary');
const logger = require('./config/logger');

const PORT = process.env.PORT || 4000;

const start = async () => {
  await connectDB(process.env.MONGODB_URI);
  configureCloudinary();

  // Initialize Redis and Queue Processors
  try {
    const redis = require('./config/redis');
    await redis.ping();
    logger.info('Redis connected successfully');

    // Initialize queue processors
    require('./workers/processors');
    logger.info('Queue processors initialized');
  } catch (error) {
    logger.warn('Redis/Queue initialization warning:', error.message);
    logger.warn('Social features will fall back to direct database operations');
  }

  const server = http.createServer(app);
  const io = new Server(server, {
    cors: { origin: '*', methods: ['GET', 'POST'] },
  });
  
  // Set IO instance for global usage
  const { setIo } = require('./utils/socketStore');
  setIo(io);
  
  registerChatHandlers(io);

  server.listen(PORT, '0.0.0.0', () => {
    logger.info(`Server running on port ${PORT}`);
  });

  // Graceful shutdown
  const shutdown = async () => {
    logger.info('Shutting down gracefully...');
    
    try {
      // Close server
      server.close(() => {
        logger.info('HTTP server closed');
      });

      // Close Redis connection
      const redis = require('./config/redis');
      await redis.quit();
      logger.info('Redis connection closed');

      // Close queue connections
      const queueService = require('./services/queue.service');
      const queues = queueService.getQueues();
      await Promise.all(Object.values(queues).map(q => q.close()));
      logger.info('Queue connections closed');

      process.exit(0);
    } catch (error) {
      logger.error('Error during shutdown:', error);
      process.exit(1);
    }
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
};

start();

