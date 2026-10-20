import { beforeAll, afterAll, beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import { createApp } from '../app.js';
import { clearTestDb, startTestDb, stopTestDb } from './db.js';

const app = createApp();

beforeAll(async () => {
  await startTestDb();
});
beforeEach(async () => {
  await clearTestDb();
});
afterAll(async () => {
  await stopTestDb();
});

const user = { email: 'alice@example.com', username: 'alice', password: 'Strong@123' };

describe('auth flow', () => {
  it('registers, reads me, refreshes, and logs out', async () => {
    const agent = request.agent(app);
    const reg = await agent.post('/api/v1/auth/register').send(user);
    expect(reg.status).toBe(201);
    expect(reg.body.data.user.email).toBe(user.email);

    const me = await agent.get('/api/v1/auth/me');
    expect(me.status).toBe(200);

    const ref = await agent.post('/api/v1/auth/refresh');
    expect(ref.status).toBe(200);

    const out = await agent.post('/api/v1/auth/logout');
    expect(out.status).toBe(200);
    const meAfter = await agent.get('/api/v1/auth/me');
    expect(meAfter.status).toBe(401);
  });

  it('rejects duplicate registration and bad credentials', async () => {
    const agent = request.agent(app);
    await agent.post('/api/v1/auth/register').send(user);
    const dupe = await agent.post('/api/v1/auth/register').send(user);
    expect(dupe.status).toBe(409);
    const bad = await agent
      .post('/api/v1/auth/login')
      .send({ email: user.email, password: 'Wrong@123' });
    expect(bad.status).toBe(401);
  });

  it('does not lock out users after repeated successful logins (rate-limit refund)', async () => {
    const agent = request.agent(app);
    await agent.post('/api/v1/auth/register').send(user);
    for (let i = 0; i < 8; i++) {
      const r = await agent
        .post('/api/v1/auth/login')
        .send({ email: user.email, password: user.password });
      expect(r.status).toBe(200);
    }
  });
});
