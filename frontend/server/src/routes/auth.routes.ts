import { Router } from 'express';
import * as authController from '../controllers/auth.controller.js';
import { authenticate, optionalAuthenticate } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validation.middleware.js';
import {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
  emailVerificationSchema,
  passwordResetRequestSchema,
  passwordResetSchema,
  changePasswordSchema,
} from '../middleware/validation.middleware.js';
import {
  registerRateLimiter,
  loginRateLimiter,
  passwordResetRateLimiter,
  emailVerificationRateLimiter,
} from '../middleware/rateLimiter.middleware.js';

const router = Router();

/**
 * @route   POST /api/v1/auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post(
  '/register',
  registerRateLimiter,
  validate(registerSchema),
  authController.register
);

/**
 * @route   POST /api/v1/auth/login
 * @desc    Login user
 * @access  Public
 */
router.post(
  '/login',
  loginRateLimiter,
  validate(loginSchema),
  authController.login
);

/**
 * @route   POST /api/v1/auth/logout
 * @desc    Logout user
 * @access  Private
 */
router.post(
  '/logout',
  authenticate,
  authController.logout
);

/**
 * @route   POST /api/v1/auth/refresh
 * @desc    Refresh access token
 * @access  Public
 */
router.post(
  '/refresh',
  validate(refreshTokenSchema),
  authController.refreshToken
);

/**
 * @route   GET /api/v1/auth/verify-email
 * @desc    Verify email address
 * @access  Public
 */
router.get(
  '/verify-email',
  emailVerificationRateLimiter,
  validate(emailVerificationSchema),
  authController.verifyEmail
);

/**
 * @route   POST /api/v1/auth/request-password-reset
 * @desc    Request password reset
 * @access  Public
 */
router.post(
  '/request-password-reset',
  passwordResetRateLimiter,
  validate(passwordResetRequestSchema),
  authController.requestPasswordReset
);

/**
 * @route   POST /api/v1/auth/reset-password
 * @desc    Reset password
 * @access  Public
 */
router.post(
  '/reset-password',
  validate(passwordResetSchema),
  authController.resetPassword
);

/**
 * @route   POST /api/v1/auth/change-password
 * @desc    Change password (when logged in)
 * @access  Private
 */
router.post(
  '/change-password',
  authenticate,
  validate(changePasswordSchema),
  authController.changePassword
);

/**
 * @route   GET /api/v1/auth/profile
 * @desc    Get current user profile
 * @access  Private
 */
router.get(
  '/profile',
  authenticate,
  authController.getProfile
);

/**
 * @route   GET /api/v1/auth/check
 * @desc    Check authentication status
 * @access  Public (optional auth)
 */
router.get(
  '/check',
  optionalAuthenticate,
  authController.checkAuth
);

export default router;
