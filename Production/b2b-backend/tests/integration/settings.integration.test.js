import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import supertest from 'supertest';
import app from '../../src/app.js';
import User from '../../src/modules/user/user.model.js';
import UserSettings from '../../src/modules/userSettings/userSettings.model.js';
import {
  clearDatabase,
  generateTestUser,
} from '../helpers/testUtils.js';
import { hashPassword } from '../../src/utils/hashPassword.js';
import { ROLES } from '../../src/constants/roles.js';
import { USER_STATUS } from '../../src/constants/userStatus.js';
import { redisClient } from '../../src/config/redis.js';

const request = supertest(app);

describe('Settings API - Integration Tests', () => {
  let accessToken;
  let csrfToken;
  let userId;

  beforeEach(async () => {
    await clearDatabase();
    await redisClient.flushdb();

    const hashedPassword = await hashPassword('Admin@1234');
    const user = await User.create({
      ...generateTestUser({
        email: 'vendor-settings@test.com',
        mobile: '9876500001',
      }),
      password: hashedPassword,
      role: ROLES.B2B_CUSTOMER,
      status: USER_STATUS.ACTIVE,
    });
    userId = user._id.toString();

    const login = await request
      .post('/api/v1/auth/login')
      .send({ identifier: 'vendor-settings@test.com', password: 'Admin@1234' });

    accessToken = login.body.data.accessToken;
    csrfToken = login.body.data.csrfToken;
  });

  afterEach(async () => {
    await redisClient.flushdb();
  });

  describe('GET /api/v1/settings', () => {
    it('returns default user settings for authenticated user', async () => {
      const response = await request
        .get('/api/v1/settings')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.notifications.email).toBe(true);
      expect(response.body.data.preferences.theme).toBe('light');

      const stored = await UserSettings.findOne({ userId });
      expect(stored).toBeTruthy();
    });

    it('rejects unauthenticated requests', async () => {
      const response = await request.get('/api/v1/settings').expect(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /api/v1/settings', () => {
    it('updates notification and theme preferences', async () => {
      const response = await request
        .put('/api/v1/settings')
        .set('Authorization', `Bearer ${accessToken}`)
        .set('x-csrf-token', csrfToken)
        .set('Cookie', `csrf-token=${csrfToken}`)
        .send({
          notifications: { email: false, sms: true },
          preferences: { theme: 'dark', language: 'en' },
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.notifications.email).toBe(false);
      expect(response.body.data.preferences.theme).toBe('dark');
    });

    it('rejects empty update payload', async () => {
      const response = await request
        .put('/api/v1/settings')
        .set('Authorization', `Bearer ${accessToken}`)
        .set('x-csrf-token', csrfToken)
        .set('Cookie', `csrf-token=${csrfToken}`)
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('rejects invalid theme value', async () => {
      const response = await request
        .put('/api/v1/settings')
        .set('Authorization', `Bearer ${accessToken}`)
        .set('x-csrf-token', csrfToken)
        .set('Cookie', `csrf-token=${csrfToken}`)
        .send({ preferences: { theme: 'neon' } })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });
});
