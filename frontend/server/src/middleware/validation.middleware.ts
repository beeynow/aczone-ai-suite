import { Request, Response, NextFunction } from 'express';
import { z, ZodError, ZodSchema } from 'zod';
import { logger } from '../utils/logger.js';

/**
 * Validation middleware using Zod
 */
export const validate = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      schema.parse({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        }));

        res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors,
        });
        return;
      }

      logger.error('Validation error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  };
};

/**
 * Common validation schemas
 */

// Email validation
export const emailSchema = z.string().email('Invalid email address');

// Password validation
export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password must be less than 128 characters')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(
    /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/,
    'Password must contain at least one special character'
  );

// UUID validation
export const uuidSchema = z.string().uuid('Invalid UUID');

// Register validation schema
export const registerSchema = z.object({
  body: z.object({
    email: emailSchema,
    password: passwordSchema,
    fullName: z.string().min(1).max(100).optional(),
  }),
});

// Login validation schema
export const loginSchema = z.object({
  body: z.object({
    email: emailSchema,
    password: z.string().min(1, 'Password is required'),
    deviceInfo: z.string().optional(),
  }),
});

// Refresh token validation schema
export const refreshTokenSchema = z.object({
  body: z.object({
    refreshToken: z.string().min(1, 'Refresh token is required'),
  }),
});

// Email verification validation schema
export const emailVerificationSchema = z.object({
  query: z.object({
    token: z.string().min(1, 'Verification token is required'),
  }),
});

// Password reset request validation schema
export const passwordResetRequestSchema = z.object({
  body: z.object({
    email: emailSchema,
  }),
});

// Password reset validation schema
export const passwordResetSchema = z.object({
  body: z.object({
    token: z.string().min(1, 'Reset token is required'),
    newPassword: passwordSchema,
  }),
});

// Change password validation schema
export const changePasswordSchema = z.object({
  body: z.object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: passwordSchema,
  }),
});

// Update profile validation schema
export const updateProfileSchema = z.object({
  body: z.object({
    fullName: z.string().min(1).max(100).optional(),
    avatarUrl: z.string().url().optional(),
  }),
});
