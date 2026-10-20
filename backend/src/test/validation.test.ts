import { beforeAll, afterAll, beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import { createApp } from '../app.js';
import { errorHandler } from '../middleware/errorHandler.js';
import { clearTestDb, startTestDb, stopTestDb } from './db.js';
import { MovieModel } from '../shared/database/models/Movie.js';
import { RatingModel } from '../shared/database/models/Rating.js';
import { WatchlistItemModel } from '../shared/database/models/WatchlistItem.js';

const app = createApp();
const MISSING_ID = '000000000000000000000000';

beforeAll(async () => {
  await startTestDb();
});
beforeEach(async () => {
  await clearTestDb();
  await MovieModel.insertMany([
    { tmdbId: 1, title: 'Alpha', type: 'movie', genres: [{ id: 28, name: 'Action' }] },
    { tmdbId: 2, title: 'Beta', type: 'movie', genres: [{ id: 18, name: 'Drama' }] },
  ]);
});
afterAll(async () => {
  await stopTestDb();
});

async function register(
  email: string,
  username: string,
  password = 'Strong@123'
): Promise<ReturnType<typeof request.agent>> {
  const agent = request.agent(app);
  const r = await agent.post('/api/v1/auth/register').send({ email, username, password });
  expect(r.status).toBe(201);
  return agent;
}

async function movieId(title: string): Promise<string> {
  const doc = await MovieModel.findOne({ title }).select('_id').lean();
  return String(doc?._id);
}

describe('database validation and integrity', () => {
  it('rejects out-of-range, non-integer, and missing rating scores', async () => {
    const agent = await register('r1@example.com', 'rater1');
    const id = await movieId('Alpha');
    for (const score of [0, 11, 2.5, -3]) {
      const r = await agent.post('/api/v1/ratings').send({ contentId: id, score });
      expect(r.status).toBe(400);
      expect(r.body.success).toBe(false);
    }
    const missing = await agent.post('/api/v1/ratings').send({ contentId: id });
    expect(missing.status).toBe(400);
  });

  it('rejects invalid watchlist statuses and empty updates', async () => {
    const agent = await register('r2@example.com', 'rater2');
    const id = await movieId('Alpha');
    await agent.post('/api/v1/watchlist').send({ contentId: id });
    const bad = await agent.patch(`/api/v1/watchlist/${id}`).send({ status: 'finished' });
    expect(bad.status).toBe(400);
    const empty = await agent.patch(`/api/v1/watchlist/${id}`).send({});
    expect(empty.status).toBe(400);
    const badProgress = await agent.patch(`/api/v1/watchlist/${id}`).send({ progress: 101 });
    expect(badProgress.status).toBe(400);
  });

  it('handles invalid and nonexistent ObjectIds without crashing', async () => {
    const agent = await register('r3@example.com', 'rater3');
    const addBad = await agent.post('/api/v1/watchlist').send({ contentId: 'not-an-id' });
    expect(addBad.status).toBe(400);
    const addMissing = await agent.post('/api/v1/watchlist').send({ contentId: MISSING_ID });
    expect(addMissing.status).toBe(404);
    const rateBad = await agent.post('/api/v1/ratings').send({ contentId: 'nope', score: 5 });
    expect(rateBad.status).toBe(400);
    const rateMissing = await agent
      .post('/api/v1/ratings')
      .send({ contentId: MISSING_ID, score: 5 });
    expect(rateMissing.status).toBe(404);
    const patchBad = await agent.patch('/api/v1/watchlist/not-an-id').send({ status: 'watching' });
    expect(patchBad.status).toBe(400);
    const patchMissing = await agent
      .patch(`/api/v1/watchlist/${MISSING_ID}`)
      .send({ status: 'watching' });
    expect(patchMissing.status).toBe(404);
    const delMissing = await agent.delete(`/api/v1/watchlist/${MISSING_ID}`);
    expect(delMissing.status).toBe(404);
    const detailBad = await request(app).get('/api/v1/content/not-an-id');
    expect(detailBad.status).toBe(404);
  });

  it('isolates private watchlist and ratings per user', async () => {
    const alice = await register('aliceiso@example.com', 'aliceiso');
    const bob = await register('bobiso@example.com', 'bobiso');
    const alpha = await movieId('Alpha');

    await alice.post('/api/v1/watchlist').send({ contentId: alpha });
    await alice.post('/api/v1/ratings').send({ contentId: alpha, score: 9 });

    const bobList = await bob.get('/api/v1/watchlist');
    expect(bobList.body.data.totalResults).toBe(0);
    const bobRatings = await bob.get('/api/v1/ratings');
    expect(bobRatings.body.data.items).toEqual([]);
    const bobPatch = await bob.patch(`/api/v1/watchlist/${alpha}`).send({ status: 'watching' });
    expect(bobPatch.status).toBe(404);
    const bobDel = await bob.delete(`/api/v1/watchlist/${alpha}`);
    expect(bobDel.status).toBe(404);
    const bobRateDel = await bob.delete(`/api/v1/ratings/${alpha}`);
    expect(bobRateDel.status).toBe(404);
    const bobSees = await bob.get(`/api/v1/ratings/content/${alpha}`);
    expect(bobSees.body.data.rating).toBeNull();
  });

  it('rejects duplicate usernames and case-variant duplicate emails', async () => {
    await register('dup@example.com', 'dupe');
    const sameUser = await request(app)
      .post('/api/v1/auth/register')
      .send({ email: 'other@example.com', username: 'dupe', password: 'Strong@123' });
    expect(sameUser.status).toBe(409);
    const sameEmail = await request(app)
      .post('/api/v1/auth/register')
      .send({ email: 'DUP@example.com', username: 'dupe2', password: 'Strong@123' });
    expect(sameEmail.status).toBe(409);
  });

  it('enforces unique user/movie pairs at the database index level', async () => {
    const agent = await register('idx@example.com', 'idxuser');
    const me = await agent.get('/api/v1/auth/me');
    const userId = me.body.data.user._id ?? me.body.data.user.id;
    const alpha = await movieId('Alpha');

    await WatchlistItemModel.create({ userId, movieId: alpha });
    await expect(WatchlistItemModel.create({ userId, movieId: alpha })).rejects.toMatchObject({
      code: 11000,
    });
    await RatingModel.create({ userId, movieId: alpha, score: 7 });
    await expect(RatingModel.create({ userId, movieId: alpha, score: 8 })).rejects.toMatchObject({
      code: 11000,
    });
  });

  it('enforces Mongoose field validation at the model level', async () => {
    const agent = await register('mdl@example.com', 'mdluser');
    const me = await agent.get('/api/v1/auth/me');
    const userId = me.body.data.user._id ?? me.body.data.user.id;
    const alpha = await movieId('Alpha');

    await expect(RatingModel.create({ userId, movieId: alpha, score: 11 })).rejects.toThrow();
    await expect(
      WatchlistItemModel.create({ userId, movieId: alpha, progress: 200 })
    ).rejects.toThrow();
  });

  it('maps duplicate-key (11000) errors to 409 instead of 500', () => {
    const status = vi.fn().mockReturnThis();
    const json = vi.fn().mockReturnThis();
    const res = { status, json, setHeader: vi.fn() } as unknown as Parameters<
      typeof errorHandler
    >[2];
    errorHandler({ code: 11000, message: 'E11000 duplicate key' }, {} as never, res, () => {});
    expect(status).toHaveBeenCalledWith(409);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: expect.objectContaining({ code: 'CONFLICT' }),
      })
    );
  });
});
