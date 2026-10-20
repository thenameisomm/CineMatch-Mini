import { beforeAll, afterAll, beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import { createApp } from '../app.js';
import { clearTestDb, startTestDb, stopTestDb } from './db.js';
import { MovieModel } from '../shared/database/models/Movie.js';
import { parseNaturalQuery } from '../modules/search/search.routes.js';

const app = createApp();

// Small deterministic catalog exercising genres, years, runtimes, cast,
// ratings, and poster presence/absence.
const seed = [
  {
    tmdbId: 101,
    title: 'Space Comedy',
    type: 'movie',
    overview: 'Laughs among the stars',
    genres: [{ id: 35, name: 'Comedy' }],
    keywords: ['space'],
    cast: [{ name: 'Funny Person', character: 'Pilot' }],
    releaseDate: new Date('2019-05-01'),
    runtime: 95,
    popularity: 70,
    voteAverage: 8.5,
    voteCount: 500,
    posterPath: '/space-comedy.jpg',
  },
  {
    tmdbId: 102,
    title: 'Space Drama',
    type: 'movie',
    overview: 'A serious voyage',
    genres: [
      { id: 18, name: 'Drama' },
      { id: 878, name: 'Science Fiction' },
    ],
    keywords: ['space'],
    cast: [{ name: 'Serious Actor', character: 'Captain' }],
    releaseDate: new Date('2019-11-01'),
    runtime: 150,
    popularity: 60,
    voteAverage: 9.0,
    voteCount: 600,
    posterPath: '/space-drama.jpg',
  },
  {
    tmdbId: 103,
    title: 'Old Western',
    type: 'movie',
    overview: 'Gunslingers at dusk',
    genres: [{ id: 37, name: 'Western' }],
    releaseDate: new Date('1972-03-01'),
    runtime: 175,
    popularity: 50,
    voteAverage: 9.2,
    voteCount: 400,
    // No posterPath on purpose: exercises the placeholder path.
  },
  {
    tmdbId: 104,
    title: 'Funny Family',
    type: 'movie',
    overview: 'A feel-good night in',
    genres: [
      { id: 35, name: 'Comedy' },
      { id: 10751, name: 'Family' },
    ],
    cast: [{ name: 'Tom Hanks', character: 'Dad' }],
    releaseDate: new Date('2017-11-01'),
    runtime: 105,
    popularity: 65,
    voteAverage: 8.2,
    voteCount: 700,
    posterPath: '/funny-family.jpg',
  },
  {
    tmdbId: 105,
    title: 'Bad Comedy',
    type: 'movie',
    overview: 'Nobody laughed',
    genres: [{ id: 35, name: 'Comedy' }],
    releaseDate: new Date('2020-01-01'),
    runtime: 90,
    popularity: 90,
    voteAverage: 4.0,
    voteCount: 100,
    posterPath: '/bad-comedy.jpg',
  },
];

const titles = (body: { items: { title?: string; content?: { title: string } }[] }) =>
  body.items.map(i => i.title ?? i.content?.title);

beforeAll(async () => {
  await startTestDb();
});
beforeEach(async () => {
  await clearTestDb();
  await MovieModel.insertMany(seed);
});
afterAll(async () => {
  await stopTestDb();
});

describe('natural-language intent parser (pure function)', () => {
  it('maps genre synonyms and moods', () => {
    expect(parseNaturalQuery('funny movies').genres).toContain(35);
    expect(parseNaturalQuery('romantic movies').genres).toContain(10749);
    expect(parseNaturalQuery('movies about space').genres).toContain(878);
    expect(parseNaturalQuery('animated family movies').genres).toEqual(
      expect.arrayContaining([16, 10751])
    );
  });

  it('parses years, decades, and ranges', () => {
    expect(parseNaturalQuery('thrillers from 2019')).toMatchObject({
      yearFrom: 2019,
      yearTo: 2019,
    });
    expect(parseNaturalQuery('movies from the 70s')).toMatchObject({
      yearFrom: 1970,
      yearTo: 1979,
    });
    expect(parseNaturalQuery('films between 2010 and 2020')).toMatchObject({
      yearFrom: 2010,
      yearTo: 2020,
    });
    expect(parseNaturalQuery('movies after 2015').yearFrom).toBe(2016);
  });

  it('parses runtime limits, sort intent, rating thresholds, and cast', () => {
    expect(parseNaturalQuery('movies under 2 hours').maxRuntime).toBe(120);
    expect(parseNaturalQuery('popular comedy movies').sort?.field).toBe('popularity');
    expect(parseNaturalQuery('highly rated movies').sort?.field).toBe('rating');
    expect(parseNaturalQuery('movies rated above 8').minRating).toBe(8);
    expect(parseNaturalQuery('movies starring Tom Hanks').cast).toBe('Tom Hanks');
  });

  it('parses negations as excluded genres', () => {
    expect(parseNaturalQuery('comedies, no family').excludedGenres).toContain(10751);
  });
});

describe('POST /search/natural (against the real catalog)', () => {
  const nl = (query: string, extra: Record<string, unknown> = {}) =>
    request(app)
      .post('/api/v1/search/natural')
      .send({ query, ...extra });

  it('always reports an honest text_fallback search path', async () => {
    for (const q of ['funny movies', 'movies from 2019', 'zxqwkj asdf']) {
      const r = await nl(q);
      expect(r.status).toBe(200);
      expect(r.body.data.searchPath).toBe('text_fallback');
    }
  });

  it('handles genre queries ("funny movies")', async () => {
    const r = await nl('funny movies');
    const t = titles(r.body.data);
    expect(t).toEqual(expect.arrayContaining(['Space Comedy', 'Funny Family', 'Bad Comedy']));
    expect(t).not.toContain('Old Western');
  });

  it('handles year queries ("movies from 2019")', async () => {
    const r = await nl('movies from 2019');
    expect(r.body.data.totalResults).toBe(2);
    expect(titles(r.body.data)).toEqual(expect.arrayContaining(['Space Comedy', 'Space Drama']));
  });

  it('handles decade queries ("movies from the 70s")', async () => {
    const r = await nl('movies from the 70s');
    expect(titles(r.body.data)).toEqual(['Old Western']);
  });

  it('handles sort intent ("popular comedy movies" / "highly rated movies")', async () => {
    const popular = await nl('popular comedy movies');
    expect(titles(popular.body.data)[0]).toBe('Bad Comedy');
    const rated = await nl('highly rated movies');
    expect(titles(rated.body.data)[0]).toBe('Old Western');
    expect(titles(rated.body.data)).not.toContain('Bad Comedy');
  });

  it('handles rating thresholds ("movies rated above 8")', async () => {
    const r = await nl('movies rated above 8');
    expect(r.body.data.totalResults).toBe(4);
    expect(titles(r.body.data)).not.toContain('Bad Comedy');
  });

  it('handles cast queries ("movies starring Tom Hanks")', async () => {
    const r = await nl('movies starring Tom Hanks');
    expect(titles(r.body.data)).toEqual(['Funny Family']);
  });

  it('handles reference titles ("movies like Space Comedy") without the source', async () => {
    const r = await nl('movies like Space Comedy');
    const t = titles(r.body.data);
    expect(t).toEqual(expect.arrayContaining(['Funny Family', 'Bad Comedy']));
    expect(t).not.toContain('Space Comedy');
    expect(r.body.data.intent.similarTo).toBe('Space Comedy');
  });

  it('keeps negations inside reference-title queries', async () => {
    // Funny Family's only genre-mates are comedies, so "no comedy" must
    // yield an honest empty set instead of dropping the exclusion.
    const r = await nl('movies like Funny Family with no comedy');
    expect(r.body.data.intent.similarTo).toBe('Funny Family');
    expect(r.body.data.totalResults).toBe(0);
    expect(r.body.data.items).toEqual([]);
  });

  it('handles runtime limits ("short comedies under 2 hours")', async () => {
    const r = await nl('short comedies under 2 hours');
    const t = titles(r.body.data);
    expect(t).not.toContain('Old Western');
    expect(t).toEqual(expect.arrayContaining(['Space Comedy', 'Funny Family']));
    // "short" sorts runtime ascending: 90, 95, 105.
    expect(t).toEqual(['Bad Comedy', 'Space Comedy', 'Funny Family']);
  });

  it('handles negations ("funny movies with no family")', async () => {
    const r = await nl('funny movies with no family');
    const t = titles(r.body.data);
    expect(t).not.toContain('Funny Family');
    expect(t).toEqual(expect.arrayContaining(['Space Comedy', 'Bad Comedy']));
  });

  it('returns honest empty results for unknown terms', async () => {
    const r = await nl('zxqwkj asdf');
    expect(r.status).toBe(200);
    expect(r.body.data.totalResults).toBe(0);
    expect(r.body.data.items).toEqual([]);
  });

  it('rejects empty queries and preserves pagination', async () => {
    const empty = await nl('');
    expect(empty.status).toBe(400);
    const p1 = await nl('comedy', { page: 1, limit: 2 });
    expect(p1.body.data.items).toHaveLength(2);
    expect(p1.body.data.hasNextPage).toBe(true);
    const p2 = await nl('comedy', { page: 2, limit: 2 });
    expect(p2.body.data.hasPrevPage).toBe(true);
  });
});

describe('poster metadata across API responses', () => {
  it('includes posterPath in list, detail, and search responses', async () => {
    const list = await request(app).get('/api/v1/content').query({ limit: 10 });
    const comedy = list.body.data.items.find((i: { title: string }) => i.title === 'Space Comedy');
    expect(comedy.posterPath).toBe('/space-comedy.jpg');

    const detail = await request(app).get(`/api/v1/content/${comedy._id}`);
    expect(detail.body.data.content.posterPath).toBe('/space-comedy.jpg');

    const search = await request(app).get('/api/v1/search').query({ q: 'Space Comedy' });
    const found = search.body.data.items.find((i: { title: string }) => i.title === 'Space Comedy');
    expect(found.posterPath).toBe('/space-comedy.jpg');
  });

  it('leaves posterPath undefined for movies without one (frontend shows placeholder)', async () => {
    const list = await request(app).get('/api/v1/content').query({ limit: 10 });
    const western = list.body.data.items.find((i: { title: string }) => i.title === 'Old Western');
    expect(western.posterPath).toBeUndefined();
  });

  it('includes movie poster metadata in watchlist and ratings responses', async () => {
    const agent = request.agent(app);
    await agent
      .post('/api/v1/auth/register')
      .send({ email: 'art@example.com', username: 'art', password: 'Strong@123' });
    const docs = (await MovieModel.find({}).select('_id title posterPath').lean()).reduce(
      (m, d) => ({ ...m, [d.title]: d }),
      {} as Record<string, { _id: unknown; posterPath?: string }>
    );
    const id = String(docs['Space Comedy']._id);
    await agent.post('/api/v1/watchlist').send({ contentId: id });
    const wl = await agent.get('/api/v1/watchlist');
    const content = wl.body.data.items[0].contentId;
    expect(typeof content).toBe('object');
    expect(content.posterPath).toBe('/space-comedy.jpg');

    await agent.post('/api/v1/ratings').send({ contentId: id, score: 9 });
    const ratings = await agent.get('/api/v1/ratings');
    expect(ratings.body.data.items[0].contentId.posterPath).toBe('/space-comedy.jpg');
  });
});

describe('similar + recommendations guarantees', () => {
  it('excludes the source movie, returns no duplicates, and 404s unknown ids', async () => {
    const doc = await MovieModel.findOne({ title: 'Space Comedy' }).select('_id').lean();
    const id = String(doc?._id);
    const sim = await request(app).get(`/api/v1/content/${id}/similar`).query({ limit: 10 });
    expect(sim.status).toBe(200);
    const ids = sim.body.data.items.map((i: { content: { _id: string } }) => i.content._id);
    expect(ids).not.toContain(id);
    expect(new Set(ids).size).toBe(ids.length);
    const missing = await request(app).get('/api/v1/content/000000000000000000000000/similar');
    expect(missing.status).toBe(404);
  });

  it('never recommends duplicates or already-seen titles', async () => {
    const agent = request.agent(app);
    await agent
      .post('/api/v1/auth/register')
      .send({ email: 'rec@example.com', username: 'rec', password: 'Strong@123' });
    const docs = (await MovieModel.find({}).select('_id title').lean()).reduce(
      (m, d) => ({ ...m, [d.title]: String(d._id) }),
      {} as Record<string, string>
    );
    await agent.post('/api/v1/ratings').send({ contentId: docs['Space Comedy'], score: 9 });
    await agent.post('/api/v1/watchlist').send({ contentId: docs['Funny Family'] });
    const r = await agent.get('/api/v1/recommendations/for-you').query({ limit: 10 });
    expect(r.body.data.personalized).toBe(true);
    const ids = r.body.data.items.map((i: { content: { _id: string } }) => i.content._id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids).not.toContain(docs['Space Comedy']);
    expect(ids).not.toContain(docs['Funny Family']);
  });
});
