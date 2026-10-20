import { beforeAll, afterAll, beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import { createApp } from '../app.js';
import { clearTestDb, startTestDb, stopTestDb } from './db.js';
import { MovieModel } from '../shared/database/models/Movie.js';

const app = createApp();

beforeAll(async () => {
  await startTestDb();
});
beforeEach(async () => {
  await clearTestDb();
  await MovieModel.insertMany([
    {
      tmdbId: 1,
      title: 'Alpha',
      type: 'movie',
      genres: [{ id: 28, name: 'Action' }],
      popularity: 90,
      voteAverage: 8.5,
      director: 'Dir A',
    },
    {
      tmdbId: 2,
      title: 'Beta',
      type: 'movie',
      genres: [{ id: 28, name: 'Action' }],
      popularity: 70,
      voteAverage: 7.5,
      director: 'Dir A',
    },
    {
      tmdbId: 3,
      title: 'Gamma',
      type: 'movie',
      genres: [{ id: 18, name: 'Drama' }],
      popularity: 60,
      voteAverage: 8.0,
      director: 'Dir B',
    },
  ]);
});
afterAll(async () => {
  await stopTestDb();
});

async function authed() {
  const agent = request.agent(app);
  await agent
    .post('/api/v1/auth/register')
    .send({ email: 'bob@example.com', username: 'bob', password: 'Strong@123' });
  const movies = (await MovieModel.find({}).select('_id title').lean()).reduce(
    (m, d) => ({ ...m, [d.title]: String(d._id) }),
    {} as Record<string, string>
  );
  return { agent, movies };
}

describe('watchlist + ratings + recommendations + stats', () => {
  it('adds, checks, updates, and removes watchlist items (409 on duplicate)', async () => {
    const { agent, movies } = await authed();
    const add = await agent.post('/api/v1/watchlist').send({ contentId: movies['Alpha'] });
    expect(add.status).toBe(201);
    const dupe = await agent.post('/api/v1/watchlist').send({ contentId: movies['Alpha'] });
    expect(dupe.status).toBe(409);
    const check = await agent.get(`/api/v1/watchlist/check/${movies['Alpha']}`);
    expect(check.body.data.inWatchlist).toBe(true);
    const patch = await agent
      .patch(`/api/v1/watchlist/${movies['Alpha']}`)
      .send({ status: 'watching', progress: 50 });
    expect(patch.body.data.item.status).toBe('watching');
    const list = await agent.get('/api/v1/watchlist').query({ status: 'watching' });
    expect(list.body.data.totalResults).toBe(1);
    const del = await agent.delete(`/api/v1/watchlist/${movies['Alpha']}`);
    expect(del.status).toBe(200);
  });

  it('marks as watched via history shortcut', async () => {
    const { agent, movies } = await authed();
    const r = await agent
      .post('/api/v1/history')
      .send({ contentId: movies['Beta'], progress: 100 });
    expect(r.status).toBe(201);
    const list = await agent.get('/api/v1/watchlist').query({ status: 'completed' });
    expect(list.body.data.totalResults).toBe(1);
  });

  it('upserts ratings, reports summary, and deletes', async () => {
    const { agent, movies } = await authed();
    await agent
      .post('/api/v1/ratings')
      .send({ contentId: movies['Alpha'], score: 9, review: 'Great' });
    await agent.post('/api/v1/ratings').send({ contentId: movies['Alpha'], score: 8 });
    const mine = await agent.get(`/api/v1/ratings/content/${movies['Alpha']}`);
    expect(mine.body.data.rating.score).toBe(8);
    const summary = await agent.get('/api/v1/ratings/summary');
    expect(summary.body.data).toEqual({ count: 1, avgScore: 8 });
    const del = await agent.delete(`/api/v1/ratings/${movies['Alpha']}`);
    expect(del.status).toBe(200);
  });

  it('recommends by genre for active users, trending for cold start', async () => {
    const { agent, movies } = await authed();
    const cold = await agent.get('/api/v1/recommendations/for-you');
    expect(cold.body.data.personalized).toBe(false);
    await agent.post('/api/v1/ratings').send({ contentId: movies['Alpha'], score: 9 });
    const warm = await agent.get('/api/v1/recommendations/for-you');
    expect(warm.body.data.personalized).toBe(true);
    expect(warm.body.data.items[0].content.title).toBe('Beta');
    expect(warm.body.data.items[0].reasons[0].detail).toMatch(/Action/);
  });

  it('serves user + global stats from aggregation pipelines', async () => {
    const { agent, movies } = await authed();
    await agent.post('/api/v1/watchlist').send({ contentId: movies['Alpha'] });
    await agent.post('/api/v1/ratings').send({ contentId: movies['Alpha'], score: 9 });
    const mine = await agent.get('/api/v1/analytics/user');
    expect(mine.status).toBe(200);
    expect(mine.body.data.ratingDistribution).toEqual([{ score: 9, count: 1 }]);
    const stats = await agent.get('/api/v1/users/me/stats');
    expect(stats.body.data.watchlistCount).toBe(1);
    expect(stats.body.data.ratingsCount).toBe(1);
    const global = await request(app).get('/api/v1/analytics/global');
    expect(global.body.data.contentCount).toBe(3);
    expect(
      global.body.data.genrePopularity.find((g: { genreName: string }) => g.genreName === 'Action')
        .count
    ).toBe(2);
    expect(
      global.body.data.topDirectors.find((d: { name: string }) => d.name === 'Dir A').count
    ).toBe(2);
  });
});
