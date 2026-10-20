import { Router } from 'express';
import mongoose from 'mongoose';
import { optionalAuth } from '../../middleware/auth.js';
import { catchAsync } from '../../middleware/catchAsync.js';
import { MovieModel } from '../../shared/database/models/Movie.js';
import { RatingModel } from '../../shared/database/models/Rating.js';
import { WatchlistItemModel } from '../../shared/database/models/WatchlistItem.js';
import { UserModel } from '../../shared/database/models/User.js';
import { toContent } from '../movies/movies.presenter.js';

// Simple genre-based recommendations (no embeddings, no AI):
// build a taste profile from ratings >= 7 + watchlist genres, then suggest
// unseen titles with the biggest genre overlap, with honest reasons.
async function tasteGenres(
  userId: string
): Promise<{ id: number; name: string; weight: number }[]> {
  const [ratings, watchlist, user] = await Promise.all([
    RatingModel.find({ userId, score: { $gte: 7 } })
      .populate('movieId')
      .lean(),
    WatchlistItemModel.find({ userId, status: { $in: ['completed', 'watching'] } })
      .populate('movieId')
      .lean(),
    UserModel.findById(userId).select('preferences').lean(),
  ]);
  const weights = new Map<number, { name: string; weight: number }>();
  const add = (genres: { id: number; name: string }[], w: number) => {
    for (const g of genres ?? []) {
      const cur = weights.get(g.id) ?? { name: g.name, weight: 0 };
      cur.weight += w;
      weights.set(g.id, cur);
    }
  };
  for (const r of ratings) {
    const m = r.movieId as unknown as { genres?: { id: number; name: string }[] } | undefined;
    add(m?.genres ?? [], (r.score as number) / 10);
  }
  for (const w of watchlist) {
    const m = w.movieId as unknown as { genres?: { id: number; name: string }[] } | undefined;
    add(m?.genres ?? [], 0.5);
  }
  for (const id of user?.preferences?.favoriteGenres ?? []) {
    const cur = weights.get(id) ?? { name: `Genre ${id}`, weight: 0 };
    cur.weight += 0.3;
    weights.set(id, cur);
  }
  return [...weights.entries()]
    .map(([id, v]) => ({ id, ...v }))
    .sort((a, b) => b.weight - a.weight);
}

export const recommendationsRouter = Router();

recommendationsRouter.get(
  '/for-you',
  optionalAuth,
  catchAsync(async (req, res) => {
    const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 20));
    const userId = req.user?.id;

    const seen = new Set<string>();
    let profile: { id: number; name: string; weight: number }[] = [];
    if (userId && mongoose.isValidObjectId(userId)) {
      profile = await tasteGenres(userId);
      const [rIds, wIds] = await Promise.all([
        RatingModel.find({ userId }).select('movieId').lean(),
        WatchlistItemModel.find({ userId }).select('movieId').lean(),
      ]);
      for (const r of [...rIds, ...wIds]) seen.add(String(r.movieId));
    }

    // Cold start: no taste yet → trending, flagged honestly.
    if (profile.length === 0) {
      const items = await MovieModel.find({}).sort({ popularity: -1 }).limit(limit).lean();
      res.json({
        success: true,
        data: {
          items: items.map(content => ({
            content: toContent(content),
            score: content.popularity,
            reasons: [{ type: 'trending', detail: 'Popular right now' }],
          })),
          personalized: false,
        },
      });
      return;
    }

    const topGenreIds = profile.slice(0, 5).map(g => g.id);
    const topGenreNames = new Map(profile.map(g => [g.id, g.name]));
    const candidates = await MovieModel.find({ 'genres.id': { $in: topGenreIds } })
      .limit(100)
      .lean();
    const scored = candidates
      .filter(c => !seen.has(String(c._id)))
      .map(c => {
        const overlap = (c.genres ?? []).filter(g => topGenreIds.includes(g.id));
        const score = overlap.length * 2 + (c.voteAverage ?? 0) / 10 + (c.popularity ?? 0) / 100;
        const names = overlap.map(g => topGenreNames.get(g.id) ?? g.name).join(', ');
        return {
          content: toContent(c),
          score: Math.round(score * 100) / 100,
          reasons: [
            {
              type: 'genre',
              detail: overlap.length ? `Matches your ${names} taste` : 'Highly rated',
            },
          ],
        };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
    res.json({ success: true, data: { items: scored, personalized: true } });
  })
);

recommendationsRouter.get(
  '/trending',
  catchAsync(async (req, res) => {
    const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 10));
    const items = await MovieModel.find({}).sort({ popularity: -1 }).limit(limit).lean();
    res.json({
      success: true,
      data: {
        items: items.map(content => ({
          content: toContent(content),
          score: content.popularity,
          reasons: [{ type: 'trending', detail: 'Popular right now' }],
        })),
      },
    });
  })
);
