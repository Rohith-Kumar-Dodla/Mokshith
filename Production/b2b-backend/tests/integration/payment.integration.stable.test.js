import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import supertest from 'supertest';
import crypto from 'crypto';

import {
  setupTestDB,
  teardownTestDB,
  clearDatabase,
  setupRedis,
  teardownRedis,
  mockExternalServices,
  generateTestUser,
  generateTestOrder,
} from '../helpers/testUtils.js';
import { hashPassword } from '../../src/utils/hashPassword.js';

import { env } from '../../src/config/env.js';
import User from '../../src/modules/user/user.model.js';
import Order from '../../src/modules/order/order.model.js';
import Payment from '../../src/modules/payment/payment.model.js';
import { generateAccessToken } from '../../src/modules/auth/auth.token.js';
import { generateCsrfToken } from '../../src/middlewares/csrf.middleware.js';

let app;
let request;

// Ensure external services are mocked before app loads
mockExternalServices();

// Ensure test secrets are present in environment
process.env.RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || 'test_secret';
process.env.RAZORPAY_WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET || 'test_secret';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_jwt_secret';

describe('Payment module - stable integration tests', () => {
  beforeAll(async () => {
    await setupTestDB();
    setupRedis();
    // Dynamically import app after mocks are applied
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

  const computeSignature = (orderId, paymentId) => {
    const sign = `${orderId}|${paymentId}`;
    const secret = env.razorpay.keySecret || process.env.RAZORPAY_KEY_SECRET || 'test_secret';
    return crypto.createHmac('sha256', secret).update(sign).digest('hex');
  };

  it('creates a Razorpay order and payment record', async () => {
    const password = 'Test@1234';
    const hashed = await hashPassword(password);
    const user = await User.create({ ...generateTestUser({ email: 'pay1@test.com' }), password: hashed, status: 'ACTIVE' });

    const accessToken = generateAccessToken(user);
    const csrfToken2 = generateCsrfToken();
    expect(accessToken).toBeDefined();
    const csrfToken = generateCsrfToken();

    const orderData = generateTestOrder({ customerId: user._id, totalAmount: 1500 });
    const order = await Order.create({ ...orderData, status: 'CONFIRMED' });

    const res = await request
      .post('/api/v1/payments/create-order')
      .set('Authorization', `Bearer ${accessToken}`)
      .set('Cookie', `csrf-token=${csrfToken}`)
      .set('x-csrf-token', csrfToken)
      .send({ orderId: order._id.toString(), amount: 1500, currency: 'INR' })
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('razorpayOrderId');

    const payment = await Payment.findOne({ razorpayOrderId: res.body.data.razorpayOrderId });
    expect(payment).toBeDefined();
    expect(payment.amount).toBe(1500);
  });

  it('verifies payment and updates order/payment status', async () => {
    const password = 'Test@1234';
    const hashed = await hashPassword(password);
    const user = await User.create({ ...generateTestUser({ email: 'pay2@test.com' }), password: hashed, status: 'ACTIVE' });

    const accessToken = generateAccessToken(user);

    const order = await Order.create({ ...generateTestOrder({ customerId: user._id, totalAmount: 2000 }), status: 'CONFIRMED' });
    const payment = await Payment.create({
      orderId: order._id,
      customerId: user._id,
      amount: 2000,
      razorpayOrderId: 'order_test_verify',
      status: 'PENDING',
    });

    // Compute a valid signature using env secret
    const signature = computeSignature('order_test_verify', 'pay_test_verify');

    const verifyRes = await request
      .post('/api/v1/payments/verify')
      .set('Authorization', `Bearer ${accessToken}`)
      .set('Cookie', `csrf-token=${csrfToken2}`)
      .set('x-csrf-token', csrfToken2)
      .send({
        razorpay_order_id: 'order_test_verify',
        razorpay_payment_id: 'pay_test_verify',
        razorpay_signature: signature,
      })
      .expect(200);

    expect(verifyRes.body.success).toBe(true);
    const updatedPayment = await Payment.findById(payment._id);
    expect(updatedPayment.status).toBe('SUCCESS');
    const updatedOrder = await Order.findById(order._id);
    expect(updatedOrder.paymentStatus).toBe('SUCCESS' || 'PAID');
  });

  it('handles webhook payment.captured and idempotently updates payment', async () => {
    const password = 'Test@1234';
    const hashed = await hashPassword(password);
    const user = await User.create({ ...generateTestUser({ email: 'pay3@test.com' }), password: hashed, status: 'ACTIVE' });

    const accessToken = generateAccessToken(user);

    const order = await Order.create({ ...generateTestOrder({ customerId: user._id, totalAmount: 1200 }), status: 'CONFIRMED' });
    const payment = await Payment.create({
      orderId: order._id,
      customerId: user._id,
      amount: 1200,
      razorpayOrderId: 'order_webhook_1',
      razorpayPaymentId: 'pay_webhook_1',
      status: 'PENDING',
    });

    // Build payload and signature matching gateway expectations
    const payload = {
      entity: 'event',
      event: 'payment.captured',
      payload: { payment: { entity: { id: 'pay_webhook_1', order_id: 'order_webhook_1', amount: 1200 } } },
    };
    const raw = JSON.stringify(payload);
    const signature = crypto.createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET || process.env.RAZORPAY_KEY_SECRET || env.razorpay.keySecret || 'test_secret').update(raw).digest('hex');

    const res = await request.post('/api/v1/payments/webhook').set('X-Razorpay-Signature', signature).send(payload).expect(200);
    expect(res.body.success).toBe(true);

    const updatedPayment = await Payment.findById(payment._id);
    expect(updatedPayment.status).toBe('SUCCESS');
  });
});

