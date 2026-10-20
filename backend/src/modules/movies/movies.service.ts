import mongoose from 'mongoose';
import { MovieModel } from '../../shared/database/models/Movie.js';
import { NotFoundError } from '../../shared/errors/AppError.js';
import { toContent } from './movies.presenter.js';
import type { BrowseQuery } from './movies.schemas.js';

const SORT_MAP: Record<string, string> = {
  popularity: 'popularity',
  rating: 'voteAverage',
  'release-date': 'releaseDate',
  runtime: 'runtime',
  alphabetical: 'title',
};

export async function browse(query: BrowseQuery) {
  const { page, limit, type, genre, year, minRating, q, sort, order } = query;
  // DEMO: filtering (equality + range) + sorting + pagination.
  const filter: Record<string, unknown> = {};
  if (type) filter.type = type;
  if (genre) filter['genres.id'] = genre;
  if (minRating) filter.voteAverage = { $gte: minRating };
  if (year) {
    filter.releaseDate = {
      $gte: new Date(`${year}-01-01`),
      $lt: new Date(`${year + 1}-01-01`),
    };
  }
  if (q && q.trim()) filter.$text = { $search: q.trim() };

  const sortField = SORT_MAP[sort] ?? 'popularity';
  const direction = order === 'asc' ? 1 : -1;

  const [items, totalResults] = await Promise.all([
    MovieModel.find(filter)
      .sort({ [sortField]: direction })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    MovieModel.countDocuments(filter),
  ]);

  const totalPages = Math.max(1, Math.ceil(totalResults / limit));
  return {
    items: items.map(toContent),
    totalResults,
    totalPages,
    currentPage: page,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  };
}

export async function trending(limit = 10, type?: 'movie' | 'tv') {
  const filter: Record<string, unknown> = {};
  if (type) filter.type = type;
  const items = await MovieModel.find(filter).sort({ popularity: -1 }).limit(limit).lean();
  return { items: items.map(toContent) };
}

export async function genres() {
  // DEMO aggregation: unwind genres, group + count, sort by count.
  const rows = await MovieModel.aggregate([
    { $unwind: '$genres' },
    { $group: { _id: '$genres.id', name: { $first: '$genres.name' }, count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $project: { _id: 0, id: '$_id', name: 1, count: 1 } },
  ]);
  return { items: rows };
}

export async function detail(id: string) {
  if (!mongoose.isValidObjectId(id)) throw new NotFoundError('Title not found');
  const doc = await MovieModel.findById(id).lean();
  if (!doc) throw new NotFoundError('Title not found');
  return { content: toContent(doc) };
}

export async function similar(id: string, limit = 10) {
  if (!mongoose.isValidObjectId(id)) throw new NotFoundError('Title not found');
  const doc = await MovieModel.findById(id).lean();
  if (!doc) throw new NotFoundError('Title not found');
  const genreIds = (doc.genres ?? []).map(g => g.id);
  const genreNames = (doc.genres ?? []).map(g => g.name).join(', ');
  const candidates = await MovieModel.find({
    _id: { $ne: doc._id },
    'genres.id': { $in: genreIds.length ? genreIds : [-1] },
  })
    .limit(50)
    .lean();
  // Simple explainable score: genre overlap + rating closeness.
  const scored = candidates
    .map(c => {
      const overlap = (c.genres ?? []).filter(g => genreIds.includes(g.id)).length;
      const ratingCloseness =
        1 - Math.min(1, Math.abs((c.voteAverage ?? 0) - (doc.voteAverage ?? 0)) / 10);
      const score = overlap * 2 + ratingCloseness;
      return { c, score, overlap };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
  return {
    items: scored.map(({ c, score, overlap }) => ({
      content: toContent(c),
      score: Math.round(score * 100) / 100,
      reason:
        overlap > 0
          ? `Shares ${overlap} genre${overlap > 1 ? 's' : ''} (${genreNames})`
          : 'Highly rated like this title',
    })),
  };
}
