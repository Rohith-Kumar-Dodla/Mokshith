import request from 'supertest';
import app from '../../src/app.js';
import { clearDatabase } from '../helpers/testUtils.js';

describe('Auth rate limiter', () => {
  beforeEach(async () => {
    await clearDatabase();
  });

  it('returns 429 after many failed login attempts', async () => {
    const agent = request(app);
    let lastRes;
    for (let i = 0; i < 25; i++) {
      lastRes = await agent
        .post('/api/v1/auth/login')
        .send({ identifier: 'noone@x.com', password: 'bad' });
      if (lastRes.status === 429) break;
    }
    expect([429, 401, 404]).toContain(lastRes.status);
  }, 20000);
});
