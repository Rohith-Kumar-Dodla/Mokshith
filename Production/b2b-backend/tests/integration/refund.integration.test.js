import { describe, it, expect, beforeAll, beforeEach, afterAll } from '@jest/globals';
import supertest from 'supertest';

import {
  setupTestDB,
  teardownTestDB,
  clearDatabase,
  setupRedis,
  teardownRedis,
  generateTestUser,
  generateTestOrder,
} from '../helpers/testUtils.js';

import User from '../../src/modules/user/user.model.js';
import Order from '../../src/modules/order/order.model.js';
import Payment from '../../src/modules/payment/payment.model.js';
import Refund from '../../src/modules/payment/refund.model.js';

import { hashPassword } from '../../src/utils/hashPassword.js';
import { generateAccessToken } from '../../src/modules/auth/auth.token.js';
import { generateCsrfToken } from '../../src/middlewares/csrf.middleware.js';
import { MockRazorpay } from '../helpers/razorpayMock.js';

let app;
let request;

describe('Refund API - lean integration', () => {
  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    process.env.RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || 'test_key_id';
    process.env.RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || 'test_key_secret';
    process.env.RAZORPAY_WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET || 'test_webhook_secret';

    // Provide Razorpay mock for gateway calls
    global.__RAZORPAY_MOCK__ = new MockRazorpay();

    await setupTestDB();
    setupRedis();

    const mod = await import('../../src/app.js');
    app = mod.default || mod;
    request = supertest(app);
  });

  afterAll(async () => {
    delete global.__RAZORPAY_MOCK__;
    await teardownRedis();
    await teardownTestDB();
  });

  beforeEach(async () => {
    await clearDatabase();
  });

  async function seedPaidOrder() {
    const hashed = await hashPassword('Test@1234');
    const user = await User.create({
      ...generateTestUser({ email: 'refund_owner@test.com' }),
      password: hashed,
      status: 'ACTIVE',
      role: 'B2B_CUSTOMER',
    });

    const accessToken = generateAccessToken(user);
    const csrfToken = generateCsrfToken();

    const order = await Order.create({
      ...generateTestOrder({ userId: user._id, totalAmount: 5000 }),
      userId: user._id,
      paymentStatus: 'PAID',
      status: 'CONFIRMED',
      paymentMethod: 'ONLINE',
    });

    await Payment.create({
      orderId: order._id,
      userId: user._id,
      amount: 5000,
      status: 'SUCCESS',
      paymentMethod: 'ONLINE',
      razorpayPaymentId: 'pay_refund_seed',
      transactionId: 'order_refund_seed',
    });

    return { user, accessToken, csrfToken, order };
  }

  it('creates a full refund (idempotent on repeat)', async () => {
    const { accessToken, csrfToken, order } = await seedPaidOrder();

    const res1 = await request
      .post('/api/v1/payments/refund')
      .set('Authorization', `Bearer ${accessToken}`)
      .set('Cookie', `csrf-token=${csrfToken}`)
      .set('x-csrf-token', csrfToken)
      .send({ orderId: order._id.toString(), amount: 5000, reason: 'Customer request' })
      .expect(200);

    expect(res1.body.success).toBe(true);

    const created = await Refund.findOne({ orderId: order._id });
    expect(created).toBeDefined();

    // Repeat same request — should not create a second refund
    const res2 = await request
      .post('/api/v1/payments/refund')
      .set('Authorization', `Bearer ${accessToken}`)
      .set('Cookie', `csrf-token=${csrfToken}`)
      .set('x-csrf-token', csrfToken)
      .send({ orderId: order._id.toString(), amount: 5000, reason: 'Retry' })
      .expect(200);

    expect(res2.body.success).toBe(true);
    const refunds = await Refund.find({ orderId: order._id });
    expect(refunds).toHaveLength(1);
  });

  it('rejects refund exceeding order amount', async () => {
    const { accessToken, csrfToken, order } = await seedPaidOrder();

    await request
      .post('/api/v1/payments/refund')
      .set('Authorization', `Bearer ${accessToken}`)
      .set('Cookie', `csrf-token=${csrfToken}`)
      .set('x-csrf-token', csrfToken)
      .send({ orderId: order._id.toString(), amount: 999999, reason: 'Invalid' })
      .expect(400);
  });

  it('fails with 404 when order does not exist', async () => {
    const { accessToken, csrfToken } = await seedPaidOrder();

    await request
      .post('/api/v1/payments/refund')
      .set('Authorization', `Bearer ${accessToken}`)
      .set('Cookie', `csrf-token=${csrfToken}`)
      .set('x-csrf-token', csrfToken)
      .send({ orderId: '507f1f77bcf86cd799439011', amount: 100, reason: 'Non-existent order' })
      .expect(404);
  });

  it('returns 500 when gateway refund fails', async () => {
    const { accessToken, csrfToken, order } = await seedPaidOrder();

    global.__RAZORPAY_MOCK__.payments.refund.mockRejectedValueOnce(new Error('Refund failed'));

    await request
      .post('/api/v1/payments/refund')
      .set('Authorization', `Bearer ${accessToken}`)
      .set('Cookie', `csrf-token=${csrfToken}`)
      .set('x-csrf-token', csrfToken)
      .send({ orderId: order._id.toString(), amount: 5000, reason: 'Gateway failure' })
      .expect(500);
  });
});

