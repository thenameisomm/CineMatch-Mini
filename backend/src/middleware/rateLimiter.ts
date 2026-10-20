import { Request, Response, NextFunction } from 'express';
import { RateLimitError } from '../shared/errors/AppError.js';
import { env } from '../config/env.js';

interface RateLimitRecord {
  count: number;
  resetTime: number;
}

const ipStore = new Map<string, RateLimitRecord>();

function cleanup(): void {
  const now = Date.now();
  for (const [key, record] of ipStore.entries()) {
    if (record.resetTime < now) ipStore.delete(key);
  }
}

setInterval(cleanup, 5 * 60 * 1000).unref?.();

interface RateLimiterOptions {
  windowMs: number;
  maxRequests: number;
  keyPrefix: string;
  getIdentifier: (req: Request) => string;
  skipSuccessfulRequests?: boolean;
}

export function createRateLimiter(options: RateLimiterOptions) {
  const { windowMs, maxRequests, keyPrefix, getIdentifier, skipSuccessfulRequests } = options;

  return (req: Request, res: Response, next: NextFunction): void => {
    const key = `${keyPrefix}:${getIdentifier(req)}`;
    const now = Date.now();

    let record = ipStore.get(key);
    if (!record || record.resetTime < now) {
      record = { count: 0, resetTime: now + windowMs };
      ipStore.set(key, record);
    }

    record.count++;
    const windowRecord = record;

    // Refund successes once the outcome is known, so only FAILED attempts
    // consume the budget. This was the root cause of the old
    // "Too many attempts" bug: every login (even successful) counted.
    if (skipSuccessfulRequests) {
      res.on('finish', () => {
        if (res.statusCode < 400) {
          windowRecord.count = Math.max(0, windowRecord.count - 1);
        }
      });
    }

    if (record.count > maxRequests) {
      const retryAfter = Math.ceil((record.resetTime - now) / 1000);
      res.setHeader('Retry-After', String(retryAfter));
      throw new RateLimitError('Too many attempts, please try again later', retryAfter);
    }

    next();
  };
}

export const ipRateLimiter = createRateLimiter({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  maxRequests: env.RATE_LIMIT_MAX_REQUESTS,
  keyPrefix: 'ip',
  getIdentifier: req => req.ip || req.socket.remoteAddress || 'unknown',
});

// Failed auth attempts only; relaxed default outside production.
const authMax = env.AUTH_RATE_LIMIT_MAX ?? (env.NODE_ENV === 'production' ? 5 : 30);

export const authRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  maxRequests: authMax,
  keyPrefix: 'auth',
  getIdentifier: req => req.ip || req.socket.remoteAddress || 'unknown',
  skipSuccessfulRequests: true,
});
