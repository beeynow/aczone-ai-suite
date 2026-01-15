import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger.js';
import { env } from '../config/env.js';

export interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

/**
 * Error handler middleware
 */
export const errorHandler = (
  err: AppError,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction
): void => {
  const statusCode = err.statusCode || 500;
  const isOperational = err.isOperational !== undefined ? err.isOperational : true;

  // Log error
  if (statusCode >= 500) {
    logger.error('Server error:', {
      message: err.message,
      stack: err.stack,
      path: req.path,
      method: req.method,
    });
  } else {
    logger.warn('Client error:', {
      message: err.message,
      path: req.path,
      method: req.method,
    });
  }

  // Prepare error response
  const errorResponse: {
    success: boolean;
    error: string;
    stack?: string;
    details?: unknown;
  } = {
    success: false,
    error: isOperational ? err.message : 'Internal server error',
  };

  // Include stack trace in development
  if (env.NODE_ENV === 'development') {
    errorResponse.stack = err.stack;
  }

  res.status(statusCode).json(errorResponse);
};

/**
 * Not found handler
 */
export const notFoundHandler = (req: Request, res: Response): void => {
  logger.warn(`Route not found: ${req.method} ${req.path}`);
  
  res.status(404).json({
    success: false,
    error: 'Route not found',
    path: req.path,
  });
};

/**
 * Async handler wrapper to catch errors in async route handlers
 */
export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>
) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Create operational error
 */
export const createError = (message: string, statusCode: number = 500): AppError => {
  const error: AppError = new Error(message);
  error.statusCode = statusCode;
  error.isOperational = true;
  return error;
};
