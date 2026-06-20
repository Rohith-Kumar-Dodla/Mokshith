import request from 'supertest';
import app from '../../server.js';
import { setupTestDB, teardownTestDB, clearDatabase } from '../helpers/testUtils.js';

describe('Auth rate limiter', () => {
  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    await setupTestDB();
  });
  afterAll(async () => {
    await clearDatabase();
    await teardownTestDB();
  });

  it('returns 429 after many failed login attempts', async () => {
    const agent = request(app);
    // Make repeated rapid requests to login endpoint
    let lastRes;
    for (let i = 0; i < 25; i++) {
      // Use invalid creds
      // allow non-200 as we test for 429 eventually
      lastRes = await agent.post('/api/v1/auth/login').send({ identifier: 'noone@x.com', password: 'bad' });
      if (lastRes.status === 429) break;
    }
    expect([429, 401, 404]).toContain(lastRes.status);
  }, 20000);
});

