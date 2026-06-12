import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import supertest from 'supertest';

import {
  setupTestDB,
  teardownTestDB,
  clearDatabase,
  mockExternalServices,
  setupRedis,
  teardownRedis,
} from '../helpers/testUtils.js';

import User from '../../src/modules/user/user.model.js';
import { hashPassword } from '../../src/utils/hashPassword.js';

// Ensure external services mocked before app import
mockExternalServices();
// Disable strict auth rate limiting in tests to avoid 429 during repeated logins
process.env.AUTH_STRICT_MODE = process.env.AUTH_STRICT_MODE || 'false';

describe('Single Active Session - integration', () => {
  let app;
  let request;

  beforeAll(async () => {
    await setupTestDB();
    setupRedis();
    const mod = await import('../../src/app.js');
    app = mod.default || mod;
    request = supertest(app);
  });

  afterAll(async () => {
    await teardownRedis();
    await teardownTestDB();
  });

  beforeEach(async () => {
    await clearDatabase();
  });

  it('LOGIN CREATES ACTIVE SESSION and protected route accessible', async () => {
    const pwd = 'Test@1234';
    const hashed = await hashPassword(pwd);
    const user = await User.create({ name: 'IntSess1', email: 'intsess1@test.com', mobile: '9000000001', password: hashed, status: 'ACTIVE' });

    const loginRes = await request.post('/api/v1/auth/login').send({ identifier: user.email, password: pwd }).expect(200);
    const accessToken = loginRes.body.data?.accessToken;
    expect(accessToken).toBeDefined();

    const dbUser = await User.findById(user._id).lean();
    expect(dbUser.activeSessionId).toBeDefined();

    const meRes = await request.get('/api/v1/users/me').set('Authorization', `Bearer ${accessToken}`).expect(200);
    expect(meRes.body.success).toBe(true);
  });

  it('NEW LOGIN INVALIDATES OLD SESSION', async () => {
    const pwd = 'Test@1234';
    const hashed = await hashPassword(pwd);
    const user = await User.create({ name: 'IntSess2', email: 'intsess2@test.com', mobile: '9000000002', password: hashed, status: 'ACTIVE' });

    const loginA = await request.post('/api/v1/auth/login').send({ identifier: user.email, password: pwd }).expect(200);
    const tokenA = loginA.body.data?.accessToken;

    const loginB = await request.post('/api/v1/auth/login').send({ identifier: user.email, password: pwd }).expect(200);
    const tokenB = loginB.body.data?.accessToken;

    // Old token should be rejected
    const resA = await request.get('/api/v1/users/me').set('Authorization', `Bearer ${tokenA}`).expect(401);
    expect(resA.body.error?.code).toBe('SESSION_REPLACED');

    // New token should succeed
    await request.get('/api/v1/users/me').set('Authorization', `Bearer ${tokenB}`).expect(200);
  });

  it('LOGOUT INVALIDATES SESSION', async () => {
    const pwd = 'Test@1234';
    const hashed = await hashPassword(pwd);
    const user = await User.create({ name: 'IntSess3', email: 'intsess3@test.com', mobile: '9000000003', password: hashed, status: 'ACTIVE' });

    const loginRes = await request.post('/api/v1/auth/login').send({ identifier: user.email, password: pwd }).expect(200);
    const token = loginRes.body.data?.accessToken;
    const refreshToken = loginRes.body.data?.refreshToken;
    const csrfToken = loginRes.body.data?.csrfToken;

    // Before logout, protected route ok
    await request.get('/api/v1/users/me').set('Authorization', `Bearer ${token}`).expect(200);

    // Logout (CSRF protected)
    await request.post('/api/v1/auth/logout')
      .set('Authorization', `Bearer ${token}`)
      .set('Cookie', `csrf-token=${csrfToken}`)
      .set('x-csrf-token', csrfToken)
      .send({ refreshToken })
      .expect(200);

    // After logout, token should be rejected
    const after = await request.get('/api/v1/users/me').set('Authorization', `Bearer ${token}`).expect(401);
    expect(after.body.error?.code).toBe('SESSION_REPLACED');
  });

  it('REFRESH TOKEN PRESERVES SESSION', async () => {
    const pwd = 'Test@1234';
    const hashed = await hashPassword(pwd);
    const user = await User.create({ name: 'IntSess4', email: 'intsess4@test.com', mobile: '9000000004', password: hashed, status: 'ACTIVE' });

    const loginRes = await request.post('/api/v1/auth/login').send({ identifier: user.email, password: pwd }).expect(200);
    const oldAccess = loginRes.body.data?.accessToken;
    const refreshToken = loginRes.body.data?.refreshToken;

    const refreshRes = await request.post('/api/v1/auth/refresh-token').send({ refreshToken }).expect(200);
    const newAccess = refreshRes.body.data?.accessToken;
    expect(newAccess).toBeDefined();

    // Old access may be invalidated depending on session; new access must work
    await request.get('/api/v1/users/me').set('Authorization', `Bearer ${newAccess}`).expect(200);
  });
});

