import { Request, Response, NextFunction } from 'express';
import { redisClient } from '../config/redis.js';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

export interface RateLimitOptions {
  windowMs?: number;
  maxRequests?: number;
  keyPrefix?: string;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
}

/**
 * Rate limiter middleware
 */
export const rateLimiter = (options: RateLimitOptions = {}) => {
  const {
    windowMs = env.RATE_LIMIT_WINDOW_MS,
    maxRequests = env.RATE_LIMIT_MAX_REQUESTS,
    keyPrefix = 'rate_limit',
    skipSuccessfulRequests = false,
    skipFailedRequests = false,
  } = options;

  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Get identifier (IP or user ID)
      const identifier = req.ip || req.connection.remoteAddress || 'unknown';
      const key = `${keyPrefix}:${identifier}`;

      // Check rate limit
      const { allowed, remaining, reset } = await redisClient.rateLimit(
        key,
        maxRequests,
        Math.floor(windowMs / 1000)
      );

      // Set rate limit headers
      res.setHeader('X-RateLimit-Limit', maxRequests.toString());
      res.setHeader('X-RateLimit-Remaining', remaining.toString());
      res.setHeader('X-RateLimit-Reset', new Date(reset).toISOString());

      if (!allowed) {
        const retryAfter = Math.ceil((reset - Date.now()) / 1000);
        res.setHeader('Retry-After', retryAfter.toString());

        logger.warn(`Rate limit exceeded for ${identifier}`, {
          ip: identifier,
          path: req.path,
        });

        res.status(429).json({
          success: false,
          error: 'Too many requests, please try again later',
          retryAfter,
        });
        return;
      }

      // Track response status for conditional counting
      if (skipSuccessfulRequests || skipFailedRequests) {
        const originalSend = res.send;
        res.send = function (data): Response {
          const statusCode = res.statusCode;

          if (
            (skipSuccessfulRequests && statusCode < 400) ||
            (skipFailedRequests && statusCode >= 400)
          ) {
            // Decrement counter if we should skip this request
            redisClient.getClient().decr(key).catch(() => {
              // Ignore errors
            });
          }

          return originalSend.call(this, data);
        };
      }

      next();
    } catch (error) {
      logger.error('Rate limiter error:', error);
      // Fail open - allow request if rate limiter fails
      next();
    }
  };
};

/**
 * Strict rate limiter for sensitive endpoints (login, register, etc.)
 */
export const strictRateLimiter = rateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 5,
  keyPrefix: 'strict_rate_limit',
  skipSuccessfulRequests: true,
});

/**
 * Login rate limiter
 */
export const loginRateLimiter = rateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 5,
  keyPrefix: 'login_rate_limit',
  skipSuccessfulRequests: true,
});

/**
 * Registration rate limiter
 */
export const registerRateLimiter = rateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  maxRequests: 3,
  keyPrefix: 'register_rate_limit',
});

/**
 * Password reset rate limiter
 */
export const passwordResetRateLimiter = rateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  maxRequests: 3,
  keyPrefix: 'password_reset_rate_limit',
});

/**
 * Email verification rate limiter
 */
export const emailVerificationRateLimiter = rateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  maxRequests: 5,
  keyPrefix: 'email_verification_rate_limit',
});

/**
 * API rate limiter
 */
export const apiRateLimiter = rateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 100,
  keyPrefix: 'api_rate_limit',
});
