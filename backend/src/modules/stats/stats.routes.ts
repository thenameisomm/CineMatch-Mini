import { Router } from 'express';
import mongoose from 'mongoose';
import { optionalAuth, requireAuth } from '../../middleware/auth.js';
import { catchAsync } from '../../middleware/catchAsync.js';
import { MovieModel } from '../../shared/database/models/Movie.js';
import { RatingModel } from '../../shared/database/models/Rating.js';
import { UserModel } from '../../shared/database/models/User.js';
import { WatchlistItemModel } from '../../shared/database/models/WatchlistItem.js';

// Basic database statistics for the viva demo. Every endpoint below is a
// live MongoDB aggregation pipeline — no mock data.
export const statsRouter = Router();

statsRouter.get(
  '/user',
  requireAuth,
  catchAsync(async (req, res) => {
    const userId = new mongoose.Types.ObjectId(req.user!.id);

    // Watch time by genre: join watchlist → movies, unwind genres, weight by
    // runtime × progress. (Estimated minutes, stated honestly in the UI.)
    const watchTimeByGenre = await WatchlistItemModel.aggregate([
      { $match: { userId } },
      {
        $lookup: {
          from: 'movies',
          localField: 'movieId',
          foreignField: '_id',
          as: 'movie',
        },
      },
      { $unwind: '$movie' },
      { $unwind: '$movie.genres' },
      {
        $group: {
          _id: '$movie.genres.name',
          minutes: {
            $sum: {
              $multiply: [{ $ifNull: ['$movie.runtime', 100] }, { $divide: ['$progress', 100] }],
            },
          },
        },
      },
      { $project: { _id: 0, genreName: '$_id', minutes: { $round: '$minutes' } } },
      { $sort: { minutes: -1 } },
    ]);

    const totalWatchTimeMinutes = watchTimeByGenre.reduce((s, g) => s + g.minutes, 0);

    const ratingDistribution = await RatingModel.aggregate([
      { $match: { userId } },
      { $group: { _id: '$score', count: { $sum: 1 } } },
      { $project: { _id: 0, score: '$_id', count: 1 } },
      { $sort: { score: 1 } },
    ]);

    const statusCounts = await WatchlistItemModel.aggregate([
      { $match: { userId } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);
    const total = statusCounts.reduce((s, r) => s + r.count, 0);
    const completed = statusCounts.find(r => r._id === 'completed')?.count ?? 0;
    const completionRate = total ? Math.round((completed / total) * 100) : 0;

    res.json({
      success: true,
      data: { totalWatchTimeMinutes, completionRate, watchTimeByGenre, ratingDistribution },
    });
  })
);

statsRouter.get(
  '/global',
  optionalAuth,
  catchAsync(async (_req, res) => {
    const [contentCount, userCount, ratingsCount, watchlistCount] = await Promise.all([
      MovieModel.countDocuments(),
      UserModel.countDocuments(),
      RatingModel.countDocuments(),
      WatchlistItemModel.countDocuments(),
    ]);

    const genrePopularity = await MovieModel.aggregate([
      { $unwind: '$genres' },
      { $group: { _id: '$genres.name', count: { $sum: 1 } } },
      { $project: { _id: 0, genreName: '$_id', count: 1 } },
      { $sort: { count: -1 } },
    ]);

    const releaseTrends = await MovieModel.aggregate([
      { $match: { releaseDate: { $ne: null } } },
      { $group: { _id: { $year: '$releaseDate' }, count: { $sum: 1 } } },
      { $project: { _id: 0, year: '$_id', count: 1 } },
      { $sort: { year: 1 } },
    ]);

    const topDirectors = await MovieModel.aggregate([
      { $match: { director: { $ne: null } } },
      { $group: { _id: '$director', count: { $sum: 1 } } },
      { $project: { _id: 0, name: '$_id', count: 1 } },
      { $sort: { count: -1 } },
      { $limit: 8 },
    ]);

    const ratingBuckets = await RatingModel.aggregate([
      { $group: { _id: '$score', count: { $sum: 1 } } },
      { $project: { _id: 0, score: '$_id', count: 1 } },
      { $sort: { score: 1 } },
    ]);

    res.json({
      success: true,
      data: {
        contentCount,
        userCount,
        ratingsCount,
        watchlistCount,
        genrePopularity,
        releaseTrends,
        topDirectors,
        ratingBuckets,
        // No search logging in the simplified app — kept as an empty
        // series so the existing chart renders honestly with no data.
        searchTrends: [],
      },
    });
  })
);
