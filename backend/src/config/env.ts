import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3000),

  MONGODB_URI: z.string().min(1).default('mongodb://localhost:27017/cinematch_mini'),
  MONGODB_DB_NAME: z.string().default('cinematch_mini'),

  JWT_ACCESS_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  JWT_ACCESS_EXPIRY: z.string().default('15m'),
  JWT_REFRESH_EXPIRY: z.string().default('7d'),
  BCRYPT_COST: z.coerce.number().default(10),

  FRONTEND_URL: z.string().url().default('http://localhost:5173'),

  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(900000),
  RATE_LIMIT_MAX_REQUESTS: z.coerce.number().default(100),
  // Optional override. When unset: 30 in development/test, 5 in production.
  // Only FAILED auth attempts consume the budget (see rateLimiter.ts).
  AUTH_RATE_LIMIT_MAX: z.coerce.number().int().min(1).optional(),
});

export type Env = z.infer<typeof envSchema>;

let env: Env;
try {
  env = envSchema.parse(process.env);
} catch (error) {
  if (error instanceof z.ZodError) {
    console.error('Invalid environment variables:');
    error.issues.forEach(e => console.error(`  - ${e.path.join('.')}: ${e.message}`));
  }
  throw error;
}

export { env };
