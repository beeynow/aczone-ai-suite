import Redis from 'ioredis';
import { env } from './env.js';
import { logger } from '../utils/logger.js';

class RedisClient {
  private client: Redis;
  private isConnected: boolean = false;

  constructor() {
    this.client = new Redis({
      host: env.REDIS_HOST,
      port: env.REDIS_PORT,
      password: env.REDIS_PASSWORD,
      db: env.REDIS_DB,
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      maxRetriesPerRequest: 3,
    });

    this.client.on('connect', () => {
      this.isConnected = true;
      logger.info('✅ Redis connected successfully');
    });

    this.client.on('error', (error) => {
      this.isConnected = false;
      logger.error('❌ Redis connection error:', error);
    });

    this.client.on('close', () => {
      this.isConnected = false;
      logger.warn('⚠️  Redis connection closed');
    });
  }

  /**
   * Get Redis client instance
   */
  getClient(): Redis {
    return this.client;
  }

  /**
   * Check if Redis is connected
   */
  isReady(): boolean {
    return this.isConnected;
  }

  /**
   * Set a key with expiration
   */
  async set(key: string, value: string, expirationSeconds?: number): Promise<void> {
    if (expirationSeconds) {
      await this.client.setex(key, expirationSeconds, value);
    } else {
      await this.client.set(key, value);
    }
  }

  /**
   * Get a key value
   */
  async get(key: string): Promise<string | null> {
    return await this.client.get(key);
  }

  /**
   * Delete a key
   */
  async del(key: string): Promise<void> {
    await this.client.del(key);
  }

  /**
   * Check if key exists
   */
  async exists(key: string): Promise<boolean> {
    const result = await this.client.exists(key);
    return result === 1;
  }

  /**
   * Increment a counter
   */
  async incr(key: string): Promise<number> {
    return await this.client.incr(key);
  }

  /**
   * Set expiration on a key
   */
  async expire(key: string, seconds: number): Promise<void> {
    await this.client.expire(key, seconds);
  }

  /**
   * Get TTL of a key
   */
  async ttl(key: string): Promise<number> {
    return await this.client.ttl(key);
  }

  /**
   * Add token to blacklist
   */
  async blacklistToken(token: string, expirationSeconds: number): Promise<void> {
    await this.set(`blacklist:${token}`, '1', expirationSeconds);
  }

  /**
   * Check if token is blacklisted
   */
  async isTokenBlacklisted(token: string): Promise<boolean> {
    return await this.exists(`blacklist:${token}`);
  }

  /**
   * Store rate limit data
   */
  async rateLimit(key: string, limit: number, windowSeconds: number): Promise<{ allowed: boolean; remaining: number; reset: number }> {
    const current = await this.incr(key);
    
    if (current === 1) {
      await this.expire(key, windowSeconds);
    }

    const ttl = await this.ttl(key);
    const allowed = current <= limit;
    const remaining = Math.max(0, limit - current);

    return {
      allowed,
      remaining,
      reset: Date.now() + (ttl * 1000),
    };
  }

  /**
   * Close Redis connection
   */
  async close(): Promise<void> {
    await this.client.quit();
    logger.info('Redis connection closed');
  }
}

export const redisClient = new RedisClient();
