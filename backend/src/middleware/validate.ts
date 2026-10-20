import { Request, Response, NextFunction } from 'express';
import { ZodType } from 'zod';
import { ValidationError } from '../shared/errors/AppError.js';

declare module 'express' {
  interface Request {
    validated?: { body?: unknown; query?: unknown; params?: unknown };
  }
}

export function validate(schemas: { body?: ZodType; query?: ZodType; params?: ZodType }) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      req.validated = {
        body: schemas.body ? schemas.body.parse(req.body) : undefined,
        query: schemas.query ? schemas.query.parse(req.query) : undefined,
        params: schemas.params ? schemas.params.parse(req.params) : undefined,
      };
      next();
    } catch (error) {
      if (error && typeof error === 'object' && 'issues' in (error as Record<string, unknown>)) {
        const issues = (error as { issues: { message: string }[] }).issues;
        throw new ValidationError(
          'Validation failed',
          issues.map(i => ({ message: i.message }))
        );
      }
      throw error;
    }
  };
}
