import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { v4 as uuidv4 } from 'uuid';

export interface TokenPayload {
  userId: string;
  email: string;
  role?: string;
  type: 'access' | 'refresh' | 'email-verification' | 'password-reset';
  jti?: string;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresAt: Date;
  refreshTokenExpiresAt: Date;
}

/**
 * Generate access token
 */
export const generateAccessToken = (payload: Omit<TokenPayload, 'type' | 'jti'>): string => {
  return jwt.sign(
    {
      ...payload,
      type: 'access',
      jti: uuidv4(),
    },
    env.JWT_SECRET,
    {
      expiresIn: env.JWT_ACCESS_EXPIRATION,
      issuer: 'tryinterview-auth',
      audience: 'tryinterview-api',
    }
  );
};

/**
 * Generate refresh token
 */
export const generateRefreshToken = (payload: Omit<TokenPayload, 'type' | 'jti'>): string => {
  return jwt.sign(
    {
      ...payload,
      type: 'refresh',
      jti: uuidv4(),
    },
    env.JWT_REFRESH_SECRET,
    {
      expiresIn: env.JWT_REFRESH_EXPIRATION,
      issuer: 'tryinterview-auth',
      audience: 'tryinterview-api',
    }
  );
};

/**
 * Generate email verification token
 */
export const generateEmailVerificationToken = (userId: string, email: string): string => {
  return jwt.sign(
    {
      userId,
      email,
      type: 'email-verification',
      jti: uuidv4(),
    },
    env.JWT_SECRET,
    {
      expiresIn: env.JWT_EMAIL_VERIFICATION_EXPIRATION,
      issuer: 'tryinterview-auth',
      audience: 'tryinterview-api',
    }
  );
};

/**
 * Generate password reset token
 */
export const generatePasswordResetToken = (userId: string, email: string): string => {
  return jwt.sign(
    {
      userId,
      email,
      type: 'password-reset',
      jti: uuidv4(),
    },
    env.JWT_SECRET,
    {
      expiresIn: env.JWT_PASSWORD_RESET_EXPIRATION,
      issuer: 'tryinterview-auth',
      audience: 'tryinterview-api',
    }
  );
};

/**
 * Generate token pair (access + refresh)
 */
export const generateTokenPair = (payload: Omit<TokenPayload, 'type' | 'jti'>): TokenPair => {
  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken(payload);

  const accessDecoded = jwt.decode(accessToken) as jwt.JwtPayload;
  const refreshDecoded = jwt.decode(refreshToken) as jwt.JwtPayload;

  return {
    accessToken,
    refreshToken,
    accessTokenExpiresAt: new Date(accessDecoded.exp! * 1000),
    refreshTokenExpiresAt: new Date(refreshDecoded.exp! * 1000),
  };
};

/**
 * Verify access token
 */
export const verifyAccessToken = (token: string): TokenPayload => {
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET, {
      issuer: 'tryinterview-auth',
      audience: 'tryinterview-api',
    }) as TokenPayload;

    if (decoded.type !== 'access') {
      throw new Error('Invalid token type');
    }

    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error('Token expired');
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new Error('Invalid token');
    }
    throw error;
  }
};

/**
 * Verify refresh token
 */
export const verifyRefreshToken = (token: string): TokenPayload => {
  try {
    const decoded = jwt.verify(token, env.JWT_REFRESH_SECRET, {
      issuer: 'tryinterview-auth',
      audience: 'tryinterview-api',
    }) as TokenPayload;

    if (decoded.type !== 'refresh') {
      throw new Error('Invalid token type');
    }

    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error('Refresh token expired');
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new Error('Invalid refresh token');
    }
    throw error;
  }
};

/**
 * Verify email verification token
 */
export const verifyEmailVerificationToken = (token: string): TokenPayload => {
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET, {
      issuer: 'tryinterview-auth',
      audience: 'tryinterview-api',
    }) as TokenPayload;

    if (decoded.type !== 'email-verification') {
      throw new Error('Invalid token type');
    }

    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error('Verification link expired');
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new Error('Invalid verification token');
    }
    throw error;
  }
};

/**
 * Verify password reset token
 */
export const verifyPasswordResetToken = (token: string): TokenPayload => {
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET, {
      issuer: 'tryinterview-auth',
      audience: 'tryinterview-api',
    }) as TokenPayload;

    if (decoded.type !== 'password-reset') {
      throw new Error('Invalid token type');
    }

    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error('Password reset link expired');
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new Error('Invalid password reset token');
    }
    throw error;
  }
};

/**
 * Decode token without verification (for debugging)
 */
export const decodeToken = (token: string): TokenPayload | null => {
  try {
    return jwt.decode(token) as TokenPayload;
  } catch {
    return null;
  }
};

/**
 * Get token expiration time
 */
export const getTokenExpiration = (token: string): Date | null => {
  const decoded = decodeToken(token);
  if (!decoded || !decoded.exp) return null;
  return new Date(decoded.exp * 1000);
};
