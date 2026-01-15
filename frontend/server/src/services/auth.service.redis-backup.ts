import { v4 as uuidv4 } from 'uuid';
import { hashPassword, comparePassword, validatePasswordStrength } from '../utils/password.js';
import { generateTokenPair, TokenPair } from '../utils/jwt.js';
import { redisClient } from '../config/redis.js';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';
import { User } from '../config/database.js';
import { emailService } from './email.service.js';

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
  user: Omit<User, 'password_hash'>;
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

    // Check if user already exists (this would be a database query in production)
    // For now, we'll use Redis to simulate
    const existingUser = await redisClient.get(`user:email:${email.toLowerCase()}`);
    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create user
    const userId = uuidv4();
    const user: User = {
      id: userId,
      email: email.toLowerCase(),
      password_hash: passwordHash,
      email_verified: false,
      created_at: new Date(),
      updated_at: new Date(),
      full_name: fullName,
      role: 'user',
      is_active: true,
    };

    // Store user in Redis (in production, this would be a database)
    await redisClient.set(`user:${userId}`, JSON.stringify(user));
    await redisClient.set(`user:email:${email.toLowerCase()}`, userId);

    // Send verification email
    await emailService.sendVerificationEmail(user.email, user.id, fullName);

    logger.info(`New user registered: ${userId}`, { email });

    return {
      userId,
      message: 'Registration successful. Please check your email to verify your account.',
    };
  }

  /**
   * Login user
   */
  async login(input: LoginInput): Promise<AuthResponse> {
    const { email, password, deviceInfo } = input;

    // Get user by email
    const userId = await redisClient.get(`user:email:${email.toLowerCase()}`);
    if (!userId) {
      throw new Error('Invalid email or password');
    }

    const userJson = await redisClient.get(`user:${userId}`);
    if (!userJson) {
      throw new Error('User not found');
    }

    const user: User = JSON.parse(userJson);

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
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    // Store refresh token in Redis
    await redisClient.set(
      `refresh_token:${user.id}:${tokens.refreshToken}`,
      JSON.stringify({ deviceInfo, createdAt: new Date() }),
      7 * 24 * 60 * 60 // 7 days
    );

    logger.info(`User logged in: ${user.id}`, { email: user.email });

    // Remove password_hash from response
    const { password_hash, ...userWithoutPassword } = user;

    return {
      user: userWithoutPassword,
      tokens,
    };
  }

  /**
   * Handle failed login attempt
   */
  private async handleFailedLogin(user: User): Promise<void> {
    const attempts = (user.login_attempts || 0) + 1;
    user.login_attempts = attempts;
    user.updated_at = new Date();

    if (attempts >= env.MAX_LOGIN_ATTEMPTS) {
      user.locked_until = new Date(Date.now() + env.LOCKOUT_DURATION);
      logger.warn(`Account locked due to failed login attempts: ${user.email}`);
    }

    await redisClient.set(`user:${user.id}`, JSON.stringify(user));
  }

  /**
   * Handle successful login
   */
  private async handleSuccessfulLogin(user: User): Promise<void> {
    user.login_attempts = 0;
    user.locked_until = undefined;
    user.last_login = new Date();
    user.updated_at = new Date();

    await redisClient.set(`user:${user.id}`, JSON.stringify(user));
  }

  /**
   * Logout user (blacklist tokens)
   */
  async logout(userId: string, accessToken: string, refreshToken: string): Promise<void> {
    // Blacklist both tokens
    await redisClient.blacklistToken(accessToken, 15 * 60); // 15 minutes
    await redisClient.blacklistToken(refreshToken, 7 * 24 * 60 * 60); // 7 days

    // Remove refresh token from storage
    await redisClient.del(`refresh_token:${userId}:${refreshToken}`);

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

    // Check if refresh token exists in storage
    const tokenExists = await redisClient.exists(`refresh_token:${payload.userId}:${refreshToken}`);
    if (!tokenExists) {
      throw new Error('Refresh token not found or expired');
    }

    // Get user
    const userJson = await redisClient.get(`user:${payload.userId}`);
    if (!userJson) {
      throw new Error('User not found');
    }

    const user: User = JSON.parse(userJson);

    if (!user.is_active) {
      throw new Error('Account is deactivated');
    }

    // Generate new token pair
    const newTokens = generateTokenPair({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    // Blacklist old refresh token
    await redisClient.blacklistToken(refreshToken, 7 * 24 * 60 * 60);
    await redisClient.del(`refresh_token:${payload.userId}:${refreshToken}`);

    // Store new refresh token
    await redisClient.set(
      `refresh_token:${user.id}:${newTokens.refreshToken}`,
      JSON.stringify({ createdAt: new Date() }),
      7 * 24 * 60 * 60
    );

    logger.info(`Access token refreshed: ${user.id}`);

    return newTokens;
  }

  /**
   * Verify email
   */
  async verifyEmail(token: string): Promise<void> {
    const { verifyEmailVerificationToken } = await import('../utils/jwt.js');
    const payload = verifyEmailVerificationToken(token);

    // Get user
    const userJson = await redisClient.get(`user:${payload.userId}`);
    if (!userJson) {
      throw new Error('User not found');
    }

    const user: User = JSON.parse(userJson);

    if (user.email_verified) {
      throw new Error('Email already verified');
    }

    // Update user
    user.email_verified = true;
    user.updated_at = new Date();

    await redisClient.set(`user:${user.id}`, JSON.stringify(user));

    // Send welcome email
    await emailService.sendWelcomeEmail(user.email, user.full_name);

    logger.info(`Email verified: ${user.id}`);
  }

  /**
   * Request password reset
   */
  async requestPasswordReset(email: string): Promise<void> {
    const userId = await redisClient.get(`user:email:${email.toLowerCase()}`);
    if (!userId) {
      // Don't reveal if email exists
      logger.warn(`Password reset requested for non-existent email: ${email}`);
      return;
    }

    const userJson = await redisClient.get(`user:${userId}`);
    if (!userJson) {
      return;
    }

    const user: User = JSON.parse(userJson);

    // Send password reset email
    await emailService.sendPasswordResetEmail(user.email, user.id, user.full_name);

    logger.info(`Password reset requested: ${user.id}`);
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
    const userJson = await redisClient.get(`user:${payload.userId}`);
    if (!userJson) {
      throw new Error('User not found');
    }

    const user: User = JSON.parse(userJson);

    // Hash new password
    const passwordHash = await hashPassword(newPassword);

    // Update user
    user.password_hash = passwordHash;
    user.updated_at = new Date();

    await redisClient.set(`user:${user.id}`, JSON.stringify(user));

    // Invalidate all existing sessions
    // In production, you'd query all refresh tokens and blacklist them
    logger.info(`Password reset successful: ${user.id}`);

    // Send confirmation email
    await emailService.sendPasswordResetConfirmationEmail(user.email, user.full_name);
  }

  /**
   * Change password (when user is logged in)
   */
  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    // Get user
    const userJson = await redisClient.get(`user:${userId}`);
    if (!userJson) {
      throw new Error('User not found');
    }

    const user: User = JSON.parse(userJson);

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
    user.updated_at = new Date();

    await redisClient.set(`user:${user.id}`, JSON.stringify(user));

    logger.info(`Password changed: ${user.id}`);
  }
}

export const authService = new AuthService();
