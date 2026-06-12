import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import supertest from 'supertest';
import app from '../../src/app.js';
import User from '../../src/modules/user/user.model.js';
import {
  clearDatabase,
  generateTestUser,
} from '../helpers/testUtils.js';
import { hashPassword } from '../../src/utils/hashPassword.js';
import { ROLES } from '../../src/constants/roles.js';
import { USER_STATUS } from '../../src/constants/userStatus.js';
import { redisClient } from '../../src/config/redis.js';

const request = supertest(app);

describe('User Profile API - Integration Tests', () => {
  let accessToken;
  let csrfToken;

  beforeEach(async () => {
    await clearDatabase();
    await redisClient.flushdb();

    const hashedPassword = await hashPassword('Admin@1234');
    await User.create({
      ...generateTestUser({
        email: 'profile@test.com',
        mobile: '9876500002',
        name: 'Original Name',
      }),
      password: hashedPassword,
      role: ROLES.B2B_CUSTOMER,
      status: USER_STATUS.ACTIVE,
    });

    const login = await request
      .post('/api/v1/auth/login')
      .send({ identifier: 'profile@test.com', password: 'Admin@1234' });

    accessToken = login.body.data.accessToken;
    csrfToken = login.body.data.csrfToken;
  });

  afterEach(async () => {
    await redisClient.flushdb();
  });

  describe('GET /api/v1/users/me', () => {
    it('returns authenticated user profile', async () => {
      const response = await request
        .get('/api/v1/users/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.email).toBe('profile@test.com');
      expect(response.body.data.password).toBeUndefined();
    });

    it('rejects unauthenticated access', async () => {
      await request.get('/api/v1/users/me').expect(401);
    });
  });

  describe('PUT /api/v1/users/me', () => {
    it('updates profile fields for authenticated user', async () => {
      const response = await request
        .put('/api/v1/users/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .set('x-csrf-token', csrfToken)
        .set('Cookie', `csrf-token=${csrfToken}`)
        .send({
          name: 'Updated Vendor',
          companyName: 'Fresh Mart',
          businessAddress: '12 Market Road',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('Updated Vendor');
    });

    it('rejects profile update without CSRF token', async () => {
      const response = await request
        .put('/api/v1/users/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ name: 'No CSRF' })
        .expect(403);

      expect(response.body.success).toBe(false);
    });
  });
});
