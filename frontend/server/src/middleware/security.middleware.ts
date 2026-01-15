import { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import { env } from '../config/env.js';

/**
 * Helmet security middleware
 */
export const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:'],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
});

/**
 * CORS middleware
 */
export const corsMiddleware = cors({
  origin: (origin, callback) => {
    const allowedOrigins = env.CORS_ORIGIN.split(',').map(o => o.trim());
    
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) {
      callback(null, true);
      return;
    }

    if (allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['X-RateLimit-Limit', 'X-RateLimit-Remaining', 'X-RateLimit-Reset'],
  maxAge: 86400, // 24 hours
});

/**
 * Compression middleware
 */
export const compressionMiddleware = compression({
  level: 6,
  threshold: 1024, // Only compress responses larger than 1KB
  filter: (req: Request, res: Response) => {
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  },
});

/**
 * Request sanitization middleware
 */
export const sanitizeRequest = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Sanitize request body
  if (req.body && typeof req.body === 'object') {
    sanitizeObject(req.body);
  }

  // Sanitize query parameters
  if (req.query && typeof req.query === 'object') {
    sanitizeObject(req.query);
  }

  next();
};

/**
 * Sanitize object recursively
 */
function sanitizeObject(obj: Record<string, unknown>): void {
  for (const key in obj) {
    if (typeof obj[key] === 'string') {
      // Remove potential XSS
      obj[key] = (obj[key] as string)
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/javascript:/gi, '')
        .replace(/on\w+\s*=/gi, '');
    } else if (typeof obj[key] === 'object' && obj[key] !== null) {
      sanitizeObject(obj[key] as Record<string, unknown>);
    }
  }
}

/**
 * Request logger middleware
 */
export const requestLogger = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    const logData = {
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userAgent: req.get('user-agent'),
    };

    if (res.statusCode >= 500) {
      // Log server errors
      console.error('Server error:', logData);
    } else if (res.statusCode >= 400) {
      // Log client errors
      console.warn('Client error:', logData);
    } else if (env.NODE_ENV === 'development') {
      // Log all requests in development
      console.log('Request:', logData);
    }
  });

  next();
};

/**
 * IP whitelist middleware (for admin routes)
 */
export const ipWhitelist = (whitelist: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const clientIp = req.ip || req.connection.remoteAddress;

    if (!clientIp || !whitelist.includes(clientIp)) {
      res.status(403).json({
        success: false,
        error: 'Access denied from your IP address',
      });
      return;
    }

    next();
  };
};
