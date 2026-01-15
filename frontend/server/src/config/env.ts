import { config } from 'dotenv';
import { z } from 'zod';

config();

const envSchema = z.object({
  // Server
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().transform(Number).default('5000'),
  API_VERSION: z.string().default('v1'),

  // Database
  MONGODB_URI: z.string().min(1, 'MongoDB URI is required'),

  // JWT
  JWT_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  JWT_ACCESS_EXPIRATION: z.string().default('15m'),
  JWT_REFRESH_EXPIRATION: z.string().default('7d'),
  JWT_EMAIL_VERIFICATION_EXPIRATION: z.string().default('24h'),
  JWT_PASSWORD_RESET_EXPIRATION: z.string().default('1h'),

  // Redis
  REDIS_HOST: z.string().default('localhost'),
  REDIS_PORT: z.string().transform(Number).default('6379'),
  REDIS_PASSWORD: z.string().optional(),
  REDIS_DB: z.string().transform(Number).default('0'),

  // Email
  SMTP_HOST: z.string(),
  SMTP_PORT: z.string().transform(Number),
  SMTP_SECURE: z.string().transform((val) => val === 'true').default('false'),
  SMTP_USER: z.string().email(),
  SMTP_PASSWORD: z.string(),
  EMAIL_FROM: z.string(),

  // Frontend
  FRONTEND_URL: z.string().url(),
  VERIFY_EMAIL_URL: z.string().url(),
  RESET_PASSWORD_URL: z.string().url(),

  // Security
  BCRYPT_ROUNDS: z.string().transform(Number).default('12'),
  MAX_LOGIN_ATTEMPTS: z.string().transform(Number).default('5'),
  LOCKOUT_DURATION: z.string().transform(Number).default('900000'),

  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: z.string().transform(Number).default('900000'),
  RATE_LIMIT_MAX_REQUESTS: z.string().transform(Number).default('100'),

  // CORS
  CORS_ORIGIN: z.string(),

  // Logging
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
  LOG_FILE_PATH: z.string().default('./logs'),
});

export type Env = z.infer<typeof envSchema>;

let env: Env;

try {
  env = envSchema.parse(process.env);
} catch (error) {
  if (error instanceof z.ZodError) {
    console.error('❌ Invalid environment variables:');
    console.error(JSON.stringify(error.errors, null, 2));
    process.exit(1);
  }
  throw error;
}

export { env };
