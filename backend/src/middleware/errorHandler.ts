/* eslint-disable @typescript-eslint/no-unused-vars -- Express error middleware requires (err, req, res, next) */
import { Request, Response, NextFunction } from 'express';
import { AppError, ConflictError } from '../shared/errors/AppError.js';

export function notFoundHandler(_req: Request, res: Response): void {
  res.status(404).json({
    success: false,
    error: { message: 'Route not found', code: 'NOT_FOUND' },
  });
}

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err instanceof AppError) {
    if (err.code === 'RATE_LIMIT_EXCEEDED' && 'retryAfter' in err) {
      res.setHeader('Retry-After', String((err as { retryAfter: number }).retryAfter));
    }
    res.status(err.statusCode).json({
      success: false,
      error: { message: err.message, code: err.code, details: err.details },
    });
    return;
  }
  // DEMO integrity: a unique index (users email/username, watchlist
  // userId+movieId, ratings userId+movieId) won a race that the
  // application-level pre-check missed — report 409, not 500.
  if (err !== null && typeof err === 'object' && (err as { code?: unknown }).code === 11000) {
    const conflict = new ConflictError('Duplicate value violates a unique constraint');
    res.status(conflict.statusCode).json({
      success: false,
      error: { message: conflict.message, code: conflict.code },
    });
    return;
  }
  console.error(err);
  res.status(500).json({
    success: false,
    error: { message: 'Internal server error', code: 'INTERNAL_ERROR' },
  });
}
