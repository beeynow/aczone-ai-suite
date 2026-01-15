import express, { Application } from 'express';
import morgan from 'morgan';
import { env } from './config/env.js';
import { logger } from './utils/logger.js';
import routes from './routes/index.js';
import {
  securityHeaders,
  corsMiddleware,
  compressionMiddleware,
  sanitizeRequest,
  requestLogger,
} from './middleware/security.middleware.js';
import { errorHandler, notFoundHandler } from './middleware/error.middleware.js';
import { apiRateLimiter } from './middleware/rateLimiter.middleware.js';

/**
 * Create Express application
 */
export const createApp = (): Application => {
  const app = express();

  // Trust proxy (for rate limiting with correct IP)
  app.set('trust proxy', 1);

  // Security middleware
  app.use(securityHeaders);
  app.use(corsMiddleware);
  app.use(compressionMiddleware);

  // Body parsing middleware
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Request sanitization
  app.use(sanitizeRequest);

  // Logging middleware
  if (env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
  } else {
    app.use(morgan('combined'));
  }
  app.use(requestLogger);

  // API rate limiting
  app.use(`/api/${env.API_VERSION}`, apiRateLimiter);

  // Mount routes
  app.use(`/api/${env.API_VERSION}`, routes);

  // 404 handler
  app.use(notFoundHandler);

  // Error handler (must be last)
  app.use(errorHandler);

  return app;
};

/**
 * Start server
 */
export const startServer = async (app: Application): Promise<void> => {
  try {
    // Start server
    app.listen(env.PORT, () => {
      logger.info(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   🚀 Tryinterview Authentication Server Started!               ║
║                                                           ║
║   Environment: ${env.NODE_ENV.padEnd(43)}║
║   Port:        ${env.PORT.toString().padEnd(43)}║
║   API Version: ${env.API_VERSION.padEnd(43)}║
║                                                           ║
║   📡 Server:   http://localhost:${env.PORT.toString().padEnd(28)}║
║   🔐 API:      http://localhost:${env.PORT.toString()}/api/${env.API_VERSION.padEnd(15)}║
║   💚 Health:   http://localhost:${env.PORT.toString()}/api/${env.API_VERSION}/health${' '.padEnd(5)}║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
      `);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};
