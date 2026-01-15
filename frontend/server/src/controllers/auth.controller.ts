import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware.js';
import { authService } from '../services/auth.service.js';
import { logger } from '../utils/logger.js';
import { asyncHandler } from '../middleware/error.middleware.js';

/**
 * Register a new user
 */
export const register = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const { email, password, fullName } = req.body;

  const result = await authService.register({ email, password, fullName });

  logger.info(`User registration successful: ${result.userId}`);

  res.status(201).json({
    success: true,
    message: result.message,
    data: {
      userId: result.userId,
    },
  });
});

/**
 * Login user
 */
export const login = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const { email, password, deviceInfo } = req.body;

  const result = await authService.login({ email, password, deviceInfo });

  logger.info(`User login successful: ${result.user.id}`);

  res.status(200).json({
    success: true,
    message: 'Login successful',
    data: {
      user: result.user,
      tokens: result.tokens,
    },
  });
});

/**
 * Logout user
 */
export const logout = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.user!.userId;
  const accessToken = req.headers.authorization!.substring(7);
  const { refreshToken } = req.body;

  await authService.logout(userId, accessToken, refreshToken);

  logger.info(`User logout successful: ${userId}`);

  res.status(200).json({
    success: true,
    message: 'Logout successful',
  });
});

/**
 * Refresh access token
 */
export const refreshToken = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const { refreshToken } = req.body;

  const tokens = await authService.refreshAccessToken(refreshToken);

  logger.info('Access token refreshed successfully');

  res.status(200).json({
    success: true,
    message: 'Token refreshed successfully',
    data: {
      tokens,
    },
  });
});

/**
 * Verify email
 */
export const verifyEmail = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const { token } = req.query;

  await authService.verifyEmail(token as string);

  logger.info('Email verified successfully');

  res.status(200).json({
    success: true,
    message: 'Email verified successfully',
  });
});

/**
 * Request password reset
 */
export const requestPasswordReset = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const { email } = req.body;

  await authService.requestPasswordReset(email);

  logger.info(`Password reset requested for: ${email}`);

  res.status(200).json({
    success: true,
    message: 'If an account exists with this email, a password reset link has been sent',
  });
});

/**
 * Reset password
 */
export const resetPassword = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const { token, newPassword } = req.body;

  await authService.resetPassword(token, newPassword);

  logger.info('Password reset successful');

  res.status(200).json({
    success: true,
    message: 'Password reset successful',
  });
});

/**
 * Change password (when user is logged in)
 */
export const changePassword = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.user!.userId;
  const { currentPassword, newPassword } = req.body;

  await authService.changePassword(userId, currentPassword, newPassword);

  logger.info(`Password changed successfully: ${userId}`);

  res.status(200).json({
    success: true,
    message: 'Password changed successfully',
  });
});

/**
 * Get current user profile
 */
export const getProfile = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.user!.userId;

  // In production, fetch user from database
  // For now, return the user data from token
  res.status(200).json({
    success: true,
    data: {
      user: req.user,
    },
  });
});

/**
 * Check authentication status
 */
export const checkAuth = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  res.status(200).json({
    success: true,
    data: {
      authenticated: !!req.user,
      user: req.user || null,
    },
  });
});
