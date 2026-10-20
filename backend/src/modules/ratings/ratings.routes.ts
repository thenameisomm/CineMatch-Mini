import { Router } from 'express';
import { z } from 'zod';
import mongoose from 'mongoose';
import { requireAuth } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { catchAsync } from '../../middleware/catchAsync.js';
import { RatingModel } from '../../shared/database/models/Rating.js';
import { MovieModel } from '../../shared/database/models/Movie.js';
import { UserModel } from '../../shared/database/models/User.js';
import { NotFoundError, ValidationError } from '../../shared/errors/AppError.js';
import { toContent } from '../movies/movies.presenter.js';

const listQuery = z.object({ limit: z.coerce.number().int().min(1).max(100).default(50) });
const saveBody = z.object({
  contentId: z.string().min(1),
  score: z.number().int().min(1).max(10),
  review: z.string().max(2000).optional(),
});
const idParam = z.object({ contentId: z.string().min(1) });

function present(r: unknown) {
  const rec = r as {
    _id: unknown;
    movieId?: unknown;
    score: unknown;
    review?: unknown;
    updatedAt: unknown;
  };
  const content = rec.movieId as Record<string, unknown> | undefined;
  return {
    _id: String(rec._id),
    contentId: content && content.title ? toContent(content) : content,
    score: rec.score,
    review: rec.review,
    isPublic: true,
    updatedAt: rec.updatedAt,
  };
}

async function syncStats(userId: string): Promise<void> {
  const rows = await RatingModel.aggregate([
    { $match: { userId: new mongoose.Types.ObjectId(userId) } },
    { $group: { _id: null, count: { $sum: 1 } } },
  ]);
  await UserModel.updateOne(
    { _id: userId },
    { $set: { 'stats.ratingsCount': rows[0]?.count ?? 0 } }
  );
}

export const ratingsRouter = Router();
ratingsRouter.use(requireAuth);

ratingsRouter.get(
  '/',
  validate({ query: listQuery }),
  catchAsync(async (req, res) => {
    const q = (req.validated?.query ?? req.query) as { limit: number };
    const items = await RatingModel.find({ userId: req.user!.id })
      .sort({ updatedAt: -1 })
      .limit(q.limit)
      .populate('movieId')
      .lean();
    res.json({ success: true, data: { items: items.map(present) } });
  })
);

ratingsRouter.get(
  '/summary',
  catchAsync(async (req, res) => {
    const rows = await RatingModel.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(req.user!.id) } },
      { $group: { _id: null, count: { $sum: 1 }, avgScore: { $avg: '$score' } } },
    ]);
    res.json({
      success: true,
      data: {
        count: rows[0]?.count ?? 0,
        avgScore: Math.round((rows[0]?.avgScore ?? 0) * 10) / 10,
      },
    });
  })
);

ratingsRouter.get(
  '/content/:contentId',
  validate({ params: idParam }),
  catchAsync(async (req, res) => {
    const { contentId } = (req.validated?.params ?? req.params) as { contentId: string };
    if (!mongoose.isValidObjectId(contentId)) {
      res.json({ success: true, data: { rating: null } });
      return;
    }
    const r = await RatingModel.findOne({ userId: req.user!.id, movieId: contentId }).lean();
    res.json({
      success: true,
      data: { rating: r ? { score: r.score, review: r.review } : null },
    });
  })
);

ratingsRouter.post(
  '/',
  validate({ body: saveBody }),
  catchAsync(async (req, res) => {
    const body = (req.validated?.body ?? req.body) as {
      contentId: string;
      score: number;
      review?: string;
    };
    if (!mongoose.isValidObjectId(body.contentId)) throw new ValidationError('Invalid content id');
    const movie = await MovieModel.findById(body.contentId).select('_id').lean();
    if (!movie) throw new NotFoundError('Title not found');
    const r = await RatingModel.findOneAndUpdate(
      { userId: req.user!.id, movieId: body.contentId },
      { $set: { score: body.score, ...(body.review !== undefined && { review: body.review }) } },
      { new: true, upsert: true, runValidators: true }
    ).lean();
    await syncStats(req.user!.id);
    res
      .status(201)
      .json({ success: true, data: { rating: present(r as unknown as Record<string, unknown>) } });
  })
);

ratingsRouter.delete(
  '/:contentId',
  validate({ params: idParam }),
  catchAsync(async (req, res) => {
    const { contentId } = (req.validated?.params ?? req.params) as { contentId: string };
    if (!mongoose.isValidObjectId(contentId)) throw new NotFoundError('Rating not found');
    const deleted = await RatingModel.findOneAndDelete({
      userId: req.user!.id,
      movieId: contentId,
    }).lean();
    if (!deleted) throw new NotFoundError('Rating not found');
    await syncStats(req.user!.id);
    res.json({ success: true, data: { message: 'Rating removed' } });
  })
);
