import { Request, Response, NextFunction } from 'express';
import { UnauthorizedError } from '../shared/errors/AppError.js';
import { verifyAccessToken } from '../shared/auth/tokens.js';

declare module 'express' {
  interface Request {
    user?: { id: string; email: string };
  }
}

function tokenFrom(req: Request): string | undefined {
  const cookie = req.cookies?.accessToken as string | undefined;
  if (cookie) return cookie;
  const header = req.headers.authorization;
  if (header?.startsWith('Bearer ')) return header.slice(7);
  return undefined;
}

export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  const token = tokenFrom(req);
  if (!token) throw new UnauthorizedError();
  try {
    const payload = verifyAccessToken(token);
    req.user = { id: payload.sub, email: payload.email };
    next();
  } catch {
    throw new UnauthorizedError('Session expired, please log in again');
  }
}

export function optionalAuth(req: Request, _res: Response, next: NextFunction): void {
  const token = tokenFrom(req);
  if (token) {
    try {
      const payload = verifyAccessToken(token);
      req.user = { id: payload.sub, email: payload.email };
    } catch {
      // ignore — treat as anonymous
    }
  }
  next();
}
