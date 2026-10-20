import { Router } from 'express';
import { z } from 'zod';
import mongoose from 'mongoose';
import { requireAuth } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { catchAsync } from '../../middleware/catchAsync.js';
import { WatchlistItemModel } from '../../shared/database/models/WatchlistItem.js';
import { ValidationError } from '../../shared/errors/AppError.js';

// "Mark as watched" from the detail page: stored as a completed watchlist
// entry (no separate history collection in the simplified schema).
const markBody = z.object({
  contentId: z.string().min(1),
  progress: z.number().int().min(0).max(100).default(100),
});

export const historyRouter = Router();
historyRouter.use(requireAuth);

historyRouter.post(
  '/',
  validate({ body: markBody }),
  catchAsync(async (req, res) => {
    const body = (req.validated?.body ?? req.body) as { contentId: string; progress: number };
    if (!mongoose.isValidObjectId(body.contentId)) throw new ValidationError('Invalid content id');
    const item = await WatchlistItemModel.findOneAndUpdate(
      { userId: req.user!.id, movieId: body.contentId },
      { $set: { status: 'completed', progress: body.progress } },
      { new: true, upsert: true, runValidators: true }
    ).lean();
    res.status(201).json({ success: true, data: { item } });
  })
);
