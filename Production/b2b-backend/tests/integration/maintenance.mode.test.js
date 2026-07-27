import { describe, it, expect, beforeEach } from '@jest/globals';
import supertest from 'supertest';
import app from '../../src/app.js';
import { clearDatabase } from '../helpers/testUtils.js';
import {
  seedAdminUser,
  seedCheckoutFixture,
} from '../helpers/integrationFixtures.js';
import { updatePlatformSettings } from '../../src/modules/platformSettings/platformSettings.service.js';
import { redisClient } from '../../src/config/redis.js';

const request = supertest(app);

describe('Maintenance mode middleware', () => {
  let adminToken;

  beforeEach(async () => {
    await clearDatabase();
    await redisClient.flushdb();
    await updatePlatformSettings({ maintenanceMode: true });

    const admin = await seedAdminUser();
    adminToken = admin.accessToken;
    await seedCheckoutFixture();
  });

  it('allows read-only GET requests while maintenance mode is enabled', async () => {
    const response = await request.get('/api/v1/products').expect(200);
    expect(response.body.success).toBe(true);
  });

  it('blocks POST write requests with HTTP 503', async () => {
    const response = await request
      .post('/api/v1/cart')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ productId: '507f1f77bcf86cd799439011', quantity: 1 })
      .expect(503);

    expect(response.body.success).toBe(false);
    expect(response.body.message).toMatch(/maintenance/i);
    expect(response.body.error.code).toBe('MAINTENANCE_MODE');
  });

  it('allows login POST during maintenance mode', async () => {
    const response = await request
      .post('/api/v1/auth/login')
      .send({
        identifier: 'nonexistent@test.com',
        password: 'WrongPassword@123',
      })
      .expect(401);

    expect(response.body.message).toContain('Invalid credentials');
  });
});
