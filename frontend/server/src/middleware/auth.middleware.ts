import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt.js';
import { redisClient } from '../config/redis.js';
import { logger } from '../utils/logger.js';

export interface AuthRequest extends Request {
  user?: {
    userId: string;
    email: string;
    role?: string;
  };
}

/**
 * Authenticate JWT token
 */
export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        error: 'No token provided',
      });
      return;
    }

    const token = authHeader.substring(7);

    // Check if token is blacklisted
    const isBlacklisted = await redisClient.isTokenBlacklisted(token);
    if (isBlacklisted) {
      res.status(401).json({
        success: false,
        error: 'Token has been revoked',
      });
      return;
    }

    // Verify token
    const payload = verifyAccessToken(token);

    // Attach user to request
    req.user = {
      userId: payload.userId,
      email: payload.email,
      role: payload.role,
    };

    next();
  } catch (error) {
    logger.warn('Authentication failed:', error);
    res.status(401).json({
      success: false,
      error: error instanceof Error ? error.message : 'Invalid token',
    });
  }
};

/**
 * Optional authentication (doesn't fail if no token)
 */
export const optionalAuthenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const isBlacklisted = await redisClient.isTokenBlacklisted(token);
      
      if (!isBlacklisted) {
        const payload = verifyAccessToken(token);
        req.user = {
          userId: payload.userId,
          email: payload.email,
          role: payload.role,
        };
      }
    }

    next();
  } catch (error) {
    // Continue without authentication
    next();
  }
};

/**
 * Authorize specific roles
 */
export const authorize = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
      return;
    }

    if (roles.length > 0 && !roles.includes(req.user.role || 'user')) {
      res.status(403).json({
        success: false,
        error: 'Insufficient permissions',
      });
      return;
    }

    next();
  };
};

/**
 * Check if user owns the resource
 */
export const checkOwnership = (userIdField: string = 'userId') => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
      return;
    }

    const resourceUserId = req.params[userIdField] || req.body[userIdField];

    if (req.user.userId !== resourceUserId && req.user.role !== 'admin') {
      res.status(403).json({
        success: false,
        error: 'You do not have permission to access this resource',
      });
      return;
    }

    next();
  };
};
