import { describe, it, expect, beforeAll, beforeEach, afterAll } from '@jest/globals';
import supertest from 'supertest';
import Refund from '../../src/modules/payment/refund.model.js';
import { clearDatabase, setupRedis, teardownRedis } from '../helpers/testUtils.js';
import { withAuth } from '../helpers/httpTestHelpers.js';
import { seedPaidOrderWithPayment } from '../helpers/integrationFixtures.js';
import { ensureRazorpayMock } from '../helpers/razorpayMock.js';

let app;
let request;

describe('Refund API - lean integration', () => {
  beforeAll(async () => {
    process.env.RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || 'test_key_id';
    process.env.RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || 'test_key_secret';
    process.env.RAZORPAY_WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET || 'test_webhook_secret';
    ensureRazorpayMock();
    setupRedis();
    const mod = await import('../../src/app.js');
    app = mod.default || mod;
    request = supertest(app);
  });

  afterAll(async () => {
    await teardownRedis();
  });

  beforeEach(async () => {
    ensureRazorpayMock();
    await clearDatabase();
  });

  it('creates a full refund (idempotent on repeat)', async () => {
    const { accessToken, csrfToken, order } = await seedPaidOrderWithPayment({
      user: { email: 'refund_owner@test.com', mobile: '9876599999' },
      order: { totalAmount: 5000 },
    });

    const res1 = await withAuth(
      request.post('/api/v1/payments/refund').send({
        orderId: order._id.toString(),
        amount: 5000,
        reason: 'Customer request',
      }),
      { accessToken, csrfToken }
    ).expect(200);

    expect(res1.body.success).toBe(true);

    const created = await Refund.findOne({ orderId: order._id });
    expect(created).toBeDefined();

    const res2 = await withAuth(
      request.post('/api/v1/payments/refund').send({
        orderId: order._id.toString(),
        amount: 5000,
        reason: 'Retry',
      }),
      { accessToken, csrfToken }
    ).expect(200);

    expect(res2.body.success).toBe(true);
    const refunds = await Refund.find({ orderId: order._id });
    expect(refunds).toHaveLength(1);
  });

  it('rejects refund exceeding order amount', async () => {
    const { accessToken, csrfToken, order } = await seedPaidOrderWithPayment({
      user: { email: 'refund_cap@test.com', mobile: '9876599998' },
      order: { totalAmount: 5000 },
    });

    await withAuth(
      request.post('/api/v1/payments/refund').send({
        orderId: order._id.toString(),
        amount: 99999,
        reason: 'Too much',
      }),
      { accessToken, csrfToken }
    ).expect(400);
  });

  it('rejects refund for unpaid order', async () => {
    const { seedActiveUser, seedPendingOrder } = await import('../helpers/integrationFixtures.js');
    const session = await seedActiveUser({ email: 'refund_unpaid@test.com', mobile: '9876599997' });
    const order = await seedPendingOrder(session.user._id, { totalAmount: 3000 });

    await withAuth(
      request.post('/api/v1/payments/refund').send({
        orderId: order._id.toString(),
        amount: 3000,
        reason: 'Should fail',
      }),
      { accessToken: session.accessToken, csrfToken: session.csrfToken }
    ).expect(400);
  });

  it('requires authentication', async () => {
    await request
      .post('/api/v1/payments/refund')
      .send({ orderId: '507f1f77bcf86cd799439011', amount: 100 })
      .expect(401);
  });
});
