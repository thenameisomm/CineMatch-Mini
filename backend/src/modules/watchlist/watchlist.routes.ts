import { Router } from 'express';
import { z } from 'zod';
import mongoose from 'mongoose';
import { requireAuth } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { catchAsync } from '../../middleware/catchAsync.js';
import { WatchlistItemModel } from '../../shared/database/models/WatchlistItem.js';
import { MovieModel } from '../../shared/database/models/Movie.js';
import { ConflictError, NotFoundError, ValidationError } from '../../shared/errors/AppError.js';
import { toContent } from '../movies/movies.presenter.js';
import { UserModel } from '../../shared/database/models/User.js';

const STATUSES = ['plan_to_watch', 'watching', 'completed', 'dropped', 'on_hold'] as const;

const listQuery = z.object({
  status: z.enum(STATUSES).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

const addBody = z.object({ contentId: z.string().min(1) });
const updateBody = z
  .object({
    status: z.enum(STATUSES).optional(),
    priority: z.number().int().min(0).max(100).optional(),
    progress: z.number().int().min(0).max(100).optional(),
  })
  .refine(o => Object.keys(o).length > 0, 'Nothing to update');
const idParam = z.object({ contentId: z.string().min(1) });

function present(item: unknown) {
  const it = item as {
    _id: unknown;
    userId: unknown;
    movieId?: unknown;
    status: unknown;
    priority: unknown;
    progress: unknown;
  };
  const content = it.movieId as Record<string, unknown> | undefined;
  return {
    _id: String(it._id),
    userId: String(it.userId),
    contentId: content && content.title ? toContent(content) : String(content),
    status: it.status,
    priority: it.priority,
    progress: it.progress,
  };
}

async function movieIdOrThrow(contentId: string) {
  if (!mongoose.isValidObjectId(contentId)) throw new ValidationError('Invalid content id');
  const movie = await MovieModel.findById(contentId).select('_id').lean();
  if (!movie) throw new NotFoundError('Title not found');
  return movie._id;
}

async function syncStats(userId: string): Promise<void> {
  const count = await WatchlistItemModel.countDocuments({ userId });
  await UserModel.updateOne({ _id: userId }, { $set: { 'stats.watchlistCount': count } });
}

export const watchlistRouter = Router();
watchlistRouter.use(requireAuth);

watchlistRouter.get(
  '/',
  validate({ query: listQuery }),
  catchAsync(async (req, res) => {
    const q = (req.validated?.query ?? req.query) as { status?: string; limit: number };
    const filter: Record<string, unknown> = { userId: req.user!.id };
    if (q.status) filter.status = q.status;
    const [items, totalResults] = await Promise.all([
      WatchlistItemModel.find(filter)
        .sort({ priority: -1, updatedAt: -1 })
        .limit(q.limit)
        .populate('movieId')
        .lean(),
      WatchlistItemModel.countDocuments(filter),
    ]);
    res.json({ success: true, data: { items: items.map(present), totalResults } });
  })
);

watchlistRouter.post(
  '/',
  validate({ body: addBody }),
  catchAsync(async (req, res) => {
    const { contentId } = (req.validated?.body ?? req.body) as { contentId: string };
    const movieId = await movieIdOrThrow(contentId);
    const dupe = await WatchlistItemModel.findOne({ userId: req.user!.id, movieId }).lean();
    if (dupe) throw new ConflictError('Already in watchlist');
    const item = await WatchlistItemModel.create({ userId: req.user!.id, movieId });
    await item.populate('movieId');
    await syncStats(req.user!.id);
    res.status(201).json({ success: true, data: { item: present(item.toObject()) } });
  })
);

watchlistRouter.get(
  '/check/:contentId',
  validate({ params: idParam }),
  catchAsync(async (req, res) => {
    const { contentId } = (req.validated?.params ?? req.params) as { contentId: string };
    if (!mongoose.isValidObjectId(contentId)) {
      res.json({ success: true, data: { inWatchlist: false, item: null } });
      return;
    }
    const item = await WatchlistItemModel.findOne({
      userId: req.user!.id,
      movieId: contentId,
    }).lean();
    res.json({
      success: true,
      data: { inWatchlist: Boolean(item), item: item ? { status: item.status } : null },
    });
  })
);

watchlistRouter.patch(
  '/:contentId',
  validate({ params: idParam, body: updateBody }),
  catchAsync(async (req, res) => {
    const { contentId } = (req.validated?.params ?? req.params) as { contentId: string };
    const patch = (req.validated?.body ?? req.body) as Record<string, unknown>;
    if (!mongoose.isValidObjectId(contentId)) throw new ValidationError('Invalid content id');
    const item = await WatchlistItemModel.findOneAndUpdate(
      { userId: req.user!.id, movieId: contentId },
      { $set: patch },
      { new: true, runValidators: true }
    )
      .populate('movieId')
      .lean();
    if (!item) throw new NotFoundError('Not in watchlist');
    res.json({ success: true, data: { item: present(item) } });
  })
);

watchlistRouter.delete(
  '/:contentId',
  validate({ params: idParam }),
  catchAsync(async (req, res) => {
    const { contentId } = (req.validated?.params ?? req.params) as { contentId: string };
    if (!mongoose.isValidObjectId(contentId)) throw new NotFoundError('Not in watchlist');
    const deleted = await WatchlistItemModel.findOneAndDelete({
      userId: req.user!.id,
      movieId: contentId,
    }).lean();
    if (!deleted) throw new NotFoundError('Not in watchlist');
    await syncStats(req.user!.id);
    res.json({ success: true, data: { message: 'Removed' } });
  })
);
