import { hashPassword, comparePassword, validatePasswordStrength } from '../utils/password.js';
import { generateTokenPair, TokenPair } from '../utils/jwt.js';
import { redisClient } from '../config/redis.js';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';
import { emailService } from './email.service.js';
import { User, IUser } from '../models/User.model.js';
import { RefreshToken } from '../models/RefreshToken.model.js';

export interface RegisterInput {
  email: string;
  password: string;
  fullName?: string;
}

export interface LoginInput {
  email: string;
  password: string;
  deviceInfo?: string;
}

export interface AuthResponse {
  user: Partial<IUser>;
  tokens: TokenPair;
}

class AuthService {
  /**
   * Register a new user
   */
  async register(input: RegisterInput): Promise<{ userId: string; message: string }> {
    const { email, password, fullName } = input;

    // Validate password strength
    const passwordValidation = validatePasswordStrength(password);
    if (!passwordValidation.valid) {
      throw new Error(`Weak password: ${passwordValidation.errors.join(', ')}`);
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create user
    const user = new User({
      email: email.toLowerCase(),
      password_hash: passwordHash,
      email_verified: false,
      full_name: fullName,
      role: 'user',
      is_active: true,
      login_attempts: 0,
    });

    await user.save();

    // Send verification email
    await emailService.sendVerificationEmail(user.email, user._id.toString(), fullName);

    logger.info(`New user registered: ${user._id}`, { email });

    return {
      userId: user._id.toString(),
      message: 'Registration successful. Please check your email to verify your account.',
    };
  }

  /**
   * Login user
   */
  async login(input: LoginInput): Promise<AuthResponse> {
    const { email, password, deviceInfo } = input;

    // Get user by email
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      throw new Error('Invalid email or password');
    }

    // Check if user is active
    if (!user.is_active) {
      throw new Error('Account is deactivated');
    }

    // Check if account is locked
    if (user.locked_until && new Date(user.locked_until) > new Date()) {
      const remainingTime = Math.ceil((new Date(user.locked_until).getTime() - Date.now()) / 1000 / 60);
      throw new Error(`Account is locked. Try again in ${remainingTime} minutes.`);
    }

    // Verify password
    const isPasswordValid = await comparePassword(password, user.password_hash);
    if (!isPasswordValid) {
      // Increment login attempts
      await this.handleFailedLogin(user);
      throw new Error('Invalid email or password');
    }

    // Reset login attempts on successful login
    await this.handleSuccessfulLogin(user);

    // Check if email is verified
    if (!user.email_verified) {
      logger.warn(`Login attempt with unverified email: ${user.email}`);
      // You can choose to block login or just warn
      // throw new Error('Please verify your email before logging in');
    }

    // Generate tokens
    const tokens = generateTokenPair({
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
    });

    // Store refresh token in database
    const refreshToken = new RefreshToken({
      user_id: user._id,
      token: tokens.refreshToken,
      expires_at: tokens.refreshTokenExpiresAt,
      device_info: deviceInfo,
      revoked: false,
    });
    await refreshToken.save();

    logger.info(`User logged in: ${user._id}`, { email: user.email });

    // Return user without password
    const userObject = user.toJSON();

    return {
      user: userObject,
      tokens,
    };
  }

  /**
   * Handle failed login attempt
   */
  private async handleFailedLogin(user: IUser): Promise<void> {
    user.login_attempts = (user.login_attempts || 0) + 1;

    if (user.login_attempts >= env.MAX_LOGIN_ATTEMPTS) {
      user.locked_until = new Date(Date.now() + env.LOCKOUT_DURATION);
      logger.warn(`Account locked due to failed login attempts: ${user.email}`);
    }

    await user.save();
  }

  /**
   * Handle successful login
   */
  private async handleSuccessfulLogin(user: IUser): Promise<void> {
    user.login_attempts = 0;
    user.locked_until = undefined;
    user.last_login = new Date();

    await user.save();
  }

  /**
   * Logout user (blacklist tokens)
   */
  async logout(userId: string, accessToken: string, refreshToken: string): Promise<void> {
    // Blacklist both tokens
    await redisClient.blacklistToken(accessToken, 15 * 60); // 15 minutes
    await redisClient.blacklistToken(refreshToken, 7 * 24 * 60 * 60); // 7 days

    // Revoke refresh token in database
    await RefreshToken.findOneAndUpdate(
      { token: refreshToken, user_id: userId },
      { revoked: true }
    );

    logger.info(`User logged out: ${userId}`);
  }

  /**
   * Refresh access token
   */
  async refreshAccessToken(refreshToken: string): Promise<TokenPair> {
    // Verify refresh token
    const { verifyRefreshToken } = await import('../utils/jwt.js');
    const payload = verifyRefreshToken(refreshToken);

    // Check if refresh token is blacklisted
    const isBlacklisted = await redisClient.isTokenBlacklisted(refreshToken);
    if (isBlacklisted) {
      throw new Error('Invalid refresh token');
    }

    // Check if refresh token exists in database and is not revoked
    const tokenDoc = await RefreshToken.findOne({
      token: refreshToken,
      user_id: payload.userId,
      revoked: false,
    });

    if (!tokenDoc) {
      throw new Error('Refresh token not found or expired');
    }

    // Check if token is expired
    if (tokenDoc.expires_at < new Date()) {
      throw new Error('Refresh token expired');
    }

    // Get user
    const user = await User.findById(payload.userId);
    if (!user) {
      throw new Error('User not found');
    }

    if (!user.is_active) {
      throw new Error('Account is deactivated');
    }

    // Generate new token pair
    const newTokens = generateTokenPair({
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
    });

    // Blacklist old refresh token
    await redisClient.blacklistToken(refreshToken, 7 * 24 * 60 * 60);
    
    // Revoke old token and create new one
    await RefreshToken.findOneAndUpdate(
      { token: refreshToken },
      { revoked: true, replaced_by: newTokens.refreshToken }
    );

    const newRefreshToken = new RefreshToken({
      user_id: user._id,
      token: newTokens.refreshToken,
      expires_at: newTokens.refreshTokenExpiresAt,
      revoked: false,
    });
    await newRefreshToken.save();

    logger.info(`Access token refreshed: ${user._id}`);

    return newTokens;
  }

  /**
   * Verify email
   */
  async verifyEmail(token: string): Promise<void> {
    const { verifyEmailVerificationToken } = await import('../utils/jwt.js');
    const payload = verifyEmailVerificationToken(token);

    // Get user
    const user = await User.findById(payload.userId);
    if (!user) {
      throw new Error('User not found');
    }

    if (user.email_verified) {
      throw new Error('Email already verified');
    }

    // Update user
    user.email_verified = true;
    await user.save();

    // Send welcome email
    await emailService.sendWelcomeEmail(user.email, user.full_name);

    logger.info(`Email verified: ${user._id}`);
  }

  /**
   * Request password reset
   */
  async requestPasswordReset(email: string): Promise<void> {
    const user = await User.findOne({ email: email.toLowerCase() });
    
    if (!user) {
      // Don't reveal if email exists
      logger.warn(`Password reset requested for non-existent email: ${email}`);
      return;
    }

    // Send password reset email
    await emailService.sendPasswordResetEmail(user.email, user._id.toString(), user.full_name);

    logger.info(`Password reset requested: ${user._id}`);
  }

  /**
   * Reset password
   */
  async resetPassword(token: string, newPassword: string): Promise<void> {
    const { verifyPasswordResetToken } = await import('../utils/jwt.js');
    const payload = verifyPasswordResetToken(token);

    // Validate new password
    const passwordValidation = validatePasswordStrength(newPassword);
    if (!passwordValidation.valid) {
      throw new Error(`Weak password: ${passwordValidation.errors.join(', ')}`);
    }

    // Get user
    const user = await User.findById(payload.userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Hash new password
    const passwordHash = await hashPassword(newPassword);

    // Update user
    user.password_hash = passwordHash;
    await user.save();

    // Revoke all refresh tokens for this user
    await RefreshToken.updateMany(
      { user_id: user._id, revoked: false },
      { revoked: true }
    );

    logger.info(`Password reset successful: ${user._id}`);

    // Send confirmation email
    await emailService.sendPasswordResetConfirmationEmail(user.email, user.full_name);
  }

  /**
   * Change password (when user is logged in)
   */
  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    // Get user
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Verify current password
    const isPasswordValid = await comparePassword(currentPassword, user.password_hash);
    if (!isPasswordValid) {
      throw new Error('Current password is incorrect');
    }

    // Validate new password
    const passwordValidation = validatePasswordStrength(newPassword);
    if (!passwordValidation.valid) {
      throw new Error(`Weak password: ${passwordValidation.errors.join(', ')}`);
    }

    // Hash new password
    const passwordHash = await hashPassword(newPassword);

    // Update user
    user.password_hash = passwordHash;
    await user.save();

    logger.info(`Password changed: ${user._id}`);
  }
}

export const authService = new AuthService();
