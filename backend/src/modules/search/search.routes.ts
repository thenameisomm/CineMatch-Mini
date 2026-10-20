import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../../middleware/validate.js';
import { catchAsync } from '../../middleware/catchAsync.js';
import { MovieModel } from '../../shared/database/models/Movie.js';
import { toContent } from '../movies/movies.presenter.js';

const searchQuery = z.object({
  q: z.string().min(1).max(200),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  type: z.enum(['movie', 'tv']).optional(),
});

const suggestQuery = z.object({
  q: z.string().min(1).max(200),
  limit: z.coerce.number().int().min(1).max(10).default(6),
  type: z.enum(['movie', 'tv']).optional(),
});

const naturalBody = z.object({
  query: z.string().min(1).max(500),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

async function keywordSearch(q: string, page: number, limit: number, type?: string) {
  const base: Record<string, unknown> = type ? { type } : {};
  // Try $text search first, fall back to case-insensitive regex (works
  // with zero Atlas setup and tiny local data).
  let items = await MovieModel.find({ ...base, $text: { $search: q } })
    .skip((page - 1) * limit)
    .limit(limit)
    .lean();
  let totalResults = await MovieModel.countDocuments({ ...base, $text: { $search: q } });
  if (items.length === 0) {
    const rx = { $regex: q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' };
    items = await MovieModel.find({ ...base, title: rx })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();
    totalResults = await MovieModel.countDocuments({ ...base, title: rx });
  }
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

const STOPWORDS = new Set(
  'a,an,the,and,or,but,of,for,with,like,show,me,movie,movies,film,films,series,find,something,good,great,best,under,over,about,that,this,what,which,who,whom,less,more,than,very,really,just,want,need,looking,some,any,all'.split(
    ','
  )
);

function extractKeywords(query: string): string[] {
  return query
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 2 && !STOPWORDS.has(w))
    .slice(0, 6);
}

export const searchRouter = Router();

searchRouter.get(
  '/',
  validate({ query: searchQuery }),
  catchAsync(async (req, res) => {
    const q = (req.validated?.query ?? req.query) as {
      q: string;
      page: number;
      limit: number;
      type?: string;
    };
    res.json({ success: true, data: await keywordSearch(q.q, q.page, q.limit, q.type) });
  })
);

searchRouter.get(
  '/suggest',
  validate({ query: suggestQuery }),
  catchAsync(async (req, res) => {
    const q = (req.validated?.query ?? req.query) as { q: string; limit: number; type?: string };
    const rx = { $regex: `^${q.q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, $options: 'i' };
    const filter: Record<string, unknown> = { title: rx };
    if (q.type) filter.type = q.type;
    const docs = await MovieModel.find(filter).limit(q.limit).select('_id title type').lean();
    res.json({
      success: true,
      data: { items: docs.map(d => ({ _id: String(d._id), title: d.title, type: d.type })) },
    });
  })
);

// Simplified NL search: rule-based keyword extraction + plain text search.
// Same request/response shape as the original AI version, so the existing
// frontend works unchanged (searchPath reports text_fallback honestly).
searchRouter.post(
  '/natural',
  validate({ body: naturalBody }),
  catchAsync(async (req, res) => {
    const body = (req.validated?.body ?? req.body) as {
      query: string;
      page: number;
      limit: number;
    };
    const result = await naturalSearch(body.query, body.page, body.limit);
    res.json({ success: true, data: result });
  })
);

// ---------------------------------------------------------------------------
// Rule-based natural-language intent parser (no AI, no embeddings).
// Understands genre words ("funny" → Comedy), moods ("feel-good"),
// negations ("less serious"), years/decades/ranges, runtime limits
// ("under 2 hours"), sort intent ("popular", "highly rated", "recent"),
// rating thresholds ("rated above 8"), cast ("starring Tom Hanks") and
// reference titles ("movies like Interstellar") — using only fields that
// exist in the movies collection. Anything unrecognized falls back to the
// ordinary keyword search, and searchPath honestly reports text_fallback.
// ---------------------------------------------------------------------------

// Genre id vocabulary (movie + tv ids as used in the local catalog).
const GENRE_WORDS: Record<string, number[]> = {
  action: [28, 10759],
  adventure: [12, 10759],
  animation: [16],
  animated: [16],
  anime: [16],
  cartoon: [16],
  cartoons: [16],
  comedy: [35],
  comedies: [35],
  funny: [35],
  hilarious: [35],
  sitcom: [35],
  mockumentary: [35],
  crime: [80],
  gangster: [80],
  mafia: [80],
  heist: [80],
  drama: [18],
  dramas: [18],
  serious: [18],
  family: [10751],
  kids: [10751],
  fantasy: [14, 10765],
  horror: [27],
  scary: [27],
  creepy: [27],
  haunted: [27],
  music: [10402],
  musical: [10402],
  jazz: [10402],
  mystery: [9648],
  romance: [10749],
  romantic: [10749],
  love: [10749],
  scifi: [878, 10765],
  'sci-fi': [878, 10765],
  science: [878, 10765],
  fiction: [878, 10765],
  space: [878, 10765],
  futuristic: [878, 10765],
  thriller: [53],
  thrillers: [53],
  suspense: [53],
  suspenseful: [53],
  war: [10752],
  western: [37],
  westerns: [37],
  documentary: [99],
  history: [36],
};

// Mood words broaden the genre filter (OR semantics, ranked by overlap).
const MOOD_WORDS: Record<string, number[]> = {
  'feel-good': [35, 10751, 10749],
  feelgood: [35, 10751, 10749],
  uplifting: [35, 10751, 10749],
  wholesome: [10751, 35],
  dark: [80, 53],
  gritty: [80, 53],
  bleak: [18, 80],
  tense: [53, 9648],
  epic: [12, 28],
};

const NEGATIONS = new Set(['less', 'not', 'no', 'without']);

export interface NaturalIntent {
  keywords: string[];
  genres: number[];
  excludedGenres: number[];
  yearFrom?: number;
  yearTo?: number;
  maxRuntime?: number;
  minRating?: number;
  cast?: string;
  similarTo?: string;
  sort?: { field: string; dir: 1 | -1 };
}

const SORT_FIELDS: Record<string, string> = {
  popularity: 'popularity',
  rating: 'voteAverage',
  'release-date': 'releaseDate',
  runtime: 'runtime',
};

export function parseNaturalQuery(rawQuery: string): NaturalIntent {
  const q = rawQuery.toLowerCase();
  const words = q
    .replace(/[^a-z0-9\s-]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);

  const genres = new Set<number>();
  const excluded = new Set<number>();
  for (let i = 0; i < words.length; i += 1) {
    const w = words[i];
    const ids = GENRE_WORDS[w] ?? MOOD_WORDS[w];
    if (!ids) continue;
    const prev = words[i - 1];
    if (prev && NEGATIONS.has(prev)) {
      for (const id of ids) excluded.add(id);
    } else {
      for (const id of ids) genres.add(id);
    }
  }

  let yearFrom: number | undefined;
  let yearTo: number | undefined;
  const between = q.match(/between\s+((?:19|20)\d{2})\s+and\s+((?:19|20)\d{2})/);
  const after = q.match(/(after|since)\s+((?:19|20)\d{2})/);
  const before = q.match(/(before|until)\s+((?:19|20)\d{2})/);
  const decade = q.match(/\b((?:19|20)\d)0s\b/);
  const shortDecade = q.match(/\b([0-9])0s\b/);
  const exact = q.match(/\b((?:19|20)\d{2})\b/);
  if (between) {
    yearFrom = Math.min(Number(between[1]), Number(between[2]));
    yearTo = Math.max(Number(between[1]), Number(between[2]));
  } else if (after) {
    const y = Number(after[2]);
    yearFrom = after[1] === 'after' ? y + 1 : y;
  } else if (before) {
    yearTo = Number(before[2]) - 1;
  } else if (decade) {
    yearFrom = Number(`${decade[1]}0`);
    yearTo = yearFrom + 9;
  } else if (shortDecade) {
    // Bare decades ("90s", "00s"): 2–9 map to 19xx, 0–1 to 20xx.
    const d = Number(shortDecade[1]);
    yearFrom = (d >= 2 ? 1900 : 2000) + d * 10;
    yearTo = yearFrom + 9;
  } else if (exact) {
    yearFrom = Number(exact[1]);
    yearTo = yearFrom;
  }

  let maxRuntime: number | undefined;
  const under = q.match(
    /(?:under|less than|(?:or )?at most)\s+(\d+(?:\.\d+)?)\s*(hours?|hrs?|h|minutes?|mins?|m)\b/
  );
  const orLess = q.match(/(\d+(?:\.\d+)?)\s*(hours?|minutes?)\s+or\s+less/);
  const m = under ?? orLess;
  if (m) {
    const v = Number(m[1]);
    maxRuntime = /hours?|hrs?|h/.test(m[2]) ? Math.round(v * 60) : Math.round(v);
  }

  let minRating: number | undefined;
  const ratedAbove = q.match(/rated?\s+(above|over|at least|>=?)\s*(\d+(?:\.\d+)?)/);
  const slashTen = q.match(/(\d+(?:\.\d+)?)\s*\/\s*10/);
  const stars = q.match(/at least\s+(\d+(?:\.\d+)?)\s*stars?/);
  const rm = ratedAbove ?? slashTen ?? stars;
  if (rm) {
    const v = Number(rm[rm.length - 1]);
    if (Number.isFinite(v)) minRating = Math.min(10, Math.max(0, v));
  }

  let sort: NaturalIntent['sort'];
  if (/\b(popular|trending|blockbuster)\b/.test(q)) sort = { field: 'popularity', dir: -1 };
  else if (/\b(new|recent|latest|newest)\b/.test(q)) sort = { field: 'release-date', dir: -1 };
  else if (/\b(old|oldest)\b/.test(q)) sort = { field: 'release-date', dir: 1 };
  else if (/\bshort\b/.test(q)) sort = { field: 'runtime', dir: 1 };
  else if (/\blong\b/.test(q)) sort = { field: 'runtime', dir: -1 };
  else if (/\b(highly rated|top rated|best|acclaimed)\b/.test(q)) {
    sort = { field: 'rating', dir: -1 };
    minRating ??= 7;
  } else if (/\bclassic\b/.test(q)) {
    sort = { field: 'rating', dir: -1 };
    minRating ??= 8;
  }

  // Cast is matched on the ORIGINAL query to keep capitalised names.
  let cast: string | undefined;
  const castMatch = rawQuery.match(
    /(?:starring|stars|featuring|starred)\s+([A-Z][\w'.-]+(?:\s+[A-Z][\w'.-]+){0,2})/
  );
  if (castMatch) cast = castMatch[1].trim();

  return {
    keywords: extractKeywords(rawQuery),
    genres: [...genres],
    excludedGenres: [...excluded],
    ...(yearFrom !== undefined && { yearFrom }),
    ...(yearTo !== undefined && { yearTo }),
    ...(maxRuntime !== undefined && { maxRuntime }),
    ...(minRating !== undefined && { minRating }),
    ...(cast && { cast }),
    ...(sort && { sort }),
  };
}

function intentHasConstraints(intent: NaturalIntent): boolean {
  return (
    intent.genres.length > 0 ||
    intent.excludedGenres.length > 0 ||
    intent.yearFrom !== undefined ||
    intent.yearTo !== undefined ||
    intent.maxRuntime !== undefined ||
    intent.minRating !== undefined ||
    intent.cast !== undefined ||
    intent.similarTo !== undefined ||
    intent.sort !== undefined
  );
}

function escapeRx(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function buildIntentFilter(intent: NaturalIntent): Record<string, unknown> {
  const filter: Record<string, unknown> = {};
  const genreClause: Record<string, unknown> = {};
  if (intent.genres.length > 0) genreClause.$in = intent.genres;
  if (intent.excludedGenres.length > 0) genreClause.$nin = intent.excludedGenres;
  if (Object.keys(genreClause).length > 0) filter['genres.id'] = genreClause;
  const from = intent.yearFrom ?? (intent.yearTo !== undefined ? 1900 : undefined);
  const to = intent.yearTo ?? (intent.yearFrom !== undefined ? 2100 : undefined);
  if (from !== undefined && to !== undefined) {
    filter.releaseDate = { $gte: new Date(`${from}-01-01`), $lt: new Date(`${to + 1}-01-01`) };
  }
  if (intent.maxRuntime !== undefined) filter.runtime = { $lte: intent.maxRuntime };
  if (intent.minRating !== undefined) filter.voteAverage = { $gte: intent.minRating };
  if (intent.cast) filter['cast.name'] = { $regex: escapeRx(intent.cast), $options: 'i' };
  return filter;
}

function rankAndPage(
  docs: Record<string, unknown>[],
  genreIds: number[],
  page: number,
  limit: number,
  sort?: NaturalIntent['sort']
) {
  const scored = docs.map(d => {
    const gs = (d.genres as { id: number }[] | undefined) ?? [];
    const overlap = gs.filter(g => genreIds.includes(g.id)).length;
    const score =
      overlap * 2 + ((d.voteAverage as number) ?? 0) / 10 + ((d.popularity as number) ?? 0) / 100;
    return { d, score: Math.round(score * 100) / 100 };
  });
  if (sort) {
    const field = SORT_FIELDS[sort.field] ?? 'popularity';
    const num = (v: unknown) => (v instanceof Date ? v.getTime() : ((v as number) ?? 0));
    scored.sort((a, b) => {
      const av = num(a.d[field]);
      const bv = num(b.d[field]);
      return sort.dir === 1 ? av - bv : bv - av;
    });
  } else {
    scored.sort((a, b) => b.score - a.score);
  }
  const totalResults = scored.length;
  const totalPages = Math.max(1, Math.ceil(totalResults / limit));
  const items = scored.slice((page - 1) * limit, page * limit);
  return {
    items: items.map(s => s.d).map(toContent),
    totalResults,
    totalPages,
    currentPage: page,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  };
}

export async function naturalSearch(query: string, page: number, limit: number) {
  const intent = parseNaturalQuery(query);

  // Reference-title queries ("movies like Interstellar"): resolve the title
  // against the real catalog, then rank by genre overlap with that title.
  const titles = await MovieModel.find({}).select('title').lean();
  const norm = (s: string) =>
    s
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, ' ')
      .trim();
  const qNorm = ` ${norm(query)} `;
  let ref: { _id: unknown; title: string } | undefined;
  for (const t of titles) {
    const tNorm = norm(t.title);
    if (tNorm.length > 3 && qNorm.includes(` ${tNorm} `) && qNorm.trim() !== tNorm) {
      if (!ref || t.title.length > ref.title.length) ref = t;
    }
  }
  if (ref) {
    const source = await MovieModel.findById(ref._id).lean();
    if (source) {
      intent.similarTo = source.title;
      const sourceGenres = (source.genres ?? []).map(g => g.id);
      const base = buildIntentFilter({ ...intent, genres: [] });
      // buildIntentFilter sets genres.id from exclusions only here; merge the
      // source-genre overlap requirement instead of overwriting it.
      const genreClause: Record<string, unknown> = {
        $in: sourceGenres.length ? sourceGenres : [-1],
      };
      const baseGenres = base['genres.id'] as Record<string, unknown> | undefined;
      if (baseGenres?.['$nin']) genreClause.$nin = baseGenres['$nin'];
      const candidates = await MovieModel.find({
        ...base,
        _id: { $ne: source._id },
        'genres.id': genreClause,
      })
        .limit(100)
        .lean();
      const ranked = rankAndPage(
        candidates as unknown as Record<string, unknown>[],
        sourceGenres,
        page,
        limit,
        intent.sort
      );
      return { ...ranked, intent, searchPath: 'text_fallback' };
    }
  }

  if (intentHasConstraints(intent)) {
    const candidates = await MovieModel.find(buildIntentFilter(intent)).limit(200).lean();
    const ranked = rankAndPage(
      candidates as unknown as Record<string, unknown>[],
      intent.genres,
      page,
      limit,
      intent.sort
    );
    return { ...ranked, intent, searchPath: 'text_fallback' };
  }

  // No recognizable intent → ordinary keyword search (may honestly be empty).
  const keywords = intent.keywords;
  const qText = keywords.join(' ') || query;
  const result = await keywordSearch(qText, page, limit);
  return { ...result, intent, searchPath: 'text_fallback' };
}
