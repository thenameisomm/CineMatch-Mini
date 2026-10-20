import { z } from 'zod';

export const browseQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  type: z.enum(['movie', 'tv']).optional(),
  genre: z.coerce.number().int().optional(),
  year: z.coerce.number().int().min(1900).max(2100).optional(),
  minRating: z.coerce.number().min(0).max(10).optional(),
  q: z.string().max(200).optional(),
  sort: z
    .enum(['popularity', 'rating', 'release-date', 'runtime', 'alphabetical'])
    .default('popularity'),
  order: z.enum(['asc', 'desc']).default('desc'),
});

export const idParamSchema = z.object({ id: z.string().min(1) });

export type BrowseQuery = z.infer<typeof browseQuerySchema>;
