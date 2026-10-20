import { beforeAll, afterAll, beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import { createApp } from '../app.js';
import { clearTestDb, startTestDb, stopTestDb } from './db.js';
import { MovieModel } from '../shared/database/models/Movie.js';

const app = createApp();

const seed = [
  {
    tmdbId: 1,
    title: 'Space Odyssey',
    type: 'movie',
    overview: 'A voyage across the stars',
    genres: [{ id: 878, name: 'Science Fiction' }],
    releaseDate: new Date('1968-01-01'),
    popularity: 80,
    voteAverage: 8.3,
    voteCount: 1000,
  },
  {
    tmdbId: 2,
    title: 'Space Adventure',
    type: 'movie',
    overview: 'An adventure among planets',
    genres: [
      { id: 878, name: 'Science Fiction' },
      { id: 12, name: 'Adventure' },
    ],
    releaseDate: new Date('2014-01-01'),
    popularity: 95,
    voteAverage: 8.7,
    voteCount: 2000,
  },
  {
    tmdbId: 3,
    title: 'Quiet Drama',
    type: 'movie',
    overview: 'A small family story',
    genres: [{ id: 18, name: 'Drama' }],
    releaseDate: new Date('2020-01-01'),
    popularity: 40,
    voteAverage: 7.1,
    voteCount: 100,
  },
];

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

describe('movies + search', () => {
  it('browses with pagination', async () => {
    const r = await request(app).get('/api/v1/content').query({ limit: 2 });
    expect(r.status).toBe(200);
    expect(r.body.data.items).toHaveLength(2);
    expect(r.body.data.totalResults).toBe(3);
  });

  it('filters by genre and sorts by rating', async () => {
    const r = await request(app)
      .get('/api/v1/content')
      .query({ genre: 878, sort: 'rating', order: 'desc' });
    expect(r.status).toBe(200);
    expect(r.body.data.totalResults).toBe(2);
    expect(r.body.data.items[0].title).toBe('Space Adventure');
  });

  it('searches by title and suggests prefixes', async () => {
    const s = await request(app).get('/api/v1/search').query({ q: 'Space' });
    expect(s.status).toBe(200);
    expect(s.body.data.totalResults).toBeGreaterThanOrEqual(1);
    const sug = await request(app).get('/api/v1/search/suggest').query({ q: 'Sp' });
    expect(sug.status).toBe(200);
    expect(sug.body.data.items.length).toBeGreaterThanOrEqual(1);
  });

  it('answers natural-language queries without AI', async () => {
    const r = await request(app)
      .post('/api/v1/search/natural')
      .send({ query: 'show me a space adventure' });
    expect(r.status).toBe(200);
    expect(r.body.data.searchPath).toBe('text_fallback');
    expect(r.body.data.totalResults).toBeGreaterThanOrEqual(1);
  });

  it('returns genres with counts, trending, detail, and similar', async () => {
    const g = await request(app).get('/api/v1/content/genres');
    expect(g.body.data.items.find((x: { id: number }) => x.id === 878).count).toBe(2);
    const t = await request(app).get('/api/v1/content/trending').query({ limit: 1 });
    expect(t.body.data.items[0].title).toBe('Space Adventure');
    const id = t.body.data.items[0]._id;
    const d = await request(app).get(`/api/v1/content/${id}`);
    expect(d.body.data.content.title).toBe('Space Adventure');
    const sim = await request(app).get(`/api/v1/content/${id}/similar`);
    expect(sim.status).toBe(200);
    expect(sim.body.data.items[0].content.title).toBe('Space Odyssey');
  });
});
