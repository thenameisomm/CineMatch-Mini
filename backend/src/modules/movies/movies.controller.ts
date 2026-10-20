import { Request, Response } from 'express';
import { catchAsync } from '../../middleware/catchAsync.js';
import * as service from './movies.service.js';
import type { BrowseQuery } from './movies.schemas.js';

export const browse = catchAsync(async (req: Request, res: Response) => {
  const data = await service.browse((req.validated?.query ?? req.query) as BrowseQuery);
  res.json({ success: true, data });
});

function queryType(value: unknown): 'movie' | 'tv' | undefined {
  const t = Array.isArray(value) ? value[0] : value;
  return t === 'movie' || t === 'tv' ? t : undefined;
}

function paramId(value: unknown): string {
  return String(Array.isArray(value) ? value[0] : value);
}

export const trending = catchAsync(async (req: Request, res: Response) => {
  const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 10));
  const type = queryType(req.query.type);
  res.json({ success: true, data: await service.trending(limit, type) });
});

export const genres = catchAsync(async (_req: Request, res: Response) => {
  res.json({ success: true, data: await service.genres() });
});

export const detail = catchAsync(async (req: Request, res: Response) => {
  const id = (req.validated?.params as { id: string } | undefined)?.id ?? paramId(req.params.id);
  res.json({ success: true, data: await service.detail(id) });
});

export const similar = catchAsync(async (req: Request, res: Response) => {
  const id = (req.validated?.params as { id: string } | undefined)?.id ?? paramId(req.params.id);
  const limit = Math.min(20, Math.max(1, Number(req.query.limit) || 10));
  res.json({ success: true, data: await service.similar(id, limit) });
});
