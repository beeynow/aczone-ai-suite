import { createApp, startServer } from './app.js';
import { redisClient } from './config/redis.js';
import { mongoClient } from './config/mongodb.js';
import { logger } from './utils/logger.js';
import { env } from './config/env.js';

/**
 * Initialize application
 */
const initialize = async (): Promise<void> => {
  try {
    logger.info('🚀 Initializing Tryinterview Authentication Server...');

    // Connect to MongoDB
    await mongoClient.connect();

    // Wait for Redis connection
    let retries = 0;
    const maxRetries = 10;
    
    while (!redisClient.isReady() && retries < maxRetries) {
      logger.info(`Waiting for Redis connection... (${retries + 1}/${maxRetries})`);
      await new Promise(resolve => setTimeout(resolve, 1000));
      retries++;
    }

    if (!redisClient.isReady()) {
      logger.warn('⚠️  Redis connection failed, but server will continue (some features may be limited)');
    }

    // Create and start Express app
    const app = createApp();
    await startServer(app);

    // Handle graceful shutdown
    const gracefulShutdown = async (signal: string) => {
      logger.info(`\n${signal} received, starting graceful shutdown...`);

      try {
        // Close MongoDB connection
        await mongoClient.disconnect();
        logger.info('✅ MongoDB connection closed');

        // Close Redis connection
        await redisClient.close();
        logger.info('✅ Redis connection closed');

        // Exit process
        logger.info('✅ Server shutdown complete');
        process.exit(0);
      } catch (error) {
        logger.error('Error during shutdown:', error);
        process.exit(1);
      }
    };

    // Listen for termination signals
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      logger.error('Uncaught Exception:', error);
      process.exit(1);
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
      process.exit(1);
    });

  } catch (error) {
    logger.error('Failed to initialize server:', error);
    process.exit(1);
  }
};

// Start the application
initialize();
