import { jest } from '@jest/globals';
import mongoose from 'mongoose';
import Order from '../../src/modules/order/order.model.js';
import * as paymentService from '../../src/modules/payment/payment.service.js';
import * as gateway from '../../src/modules/payment/payment.gateway.js';
import { setupTestDB, teardownTestDB, clearDatabase, setupRedis, teardownRedis } from '../helpers/testUtils.js';

describe('Webhook signature negative cases', () => {
  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    process.env.RAZORPAY_WEBHOOK_SECRET = 'test_secret';
    await setupTestDB();
    setupRedis();
  });
  afterAll(async () => {
    await clearDatabase();
    await teardownTestDB();
    await teardownRedis();
  });

  beforeEach(async () => {
    jest.restoreAllMocks();
    await clearDatabase();
  });

  it('rejects webhook with invalid signature', async () => {
    const userId = new mongoose.Types.ObjectId();
    const order = await Order.create({
      userId,
      items: [{ productId: new mongoose.Types.ObjectId(), name: 'P', price: 100, quantity: 1 }],
      totalAmount: 100,
      paymentMethod: 'ONLINE',
      paymentStatus: 'PENDING',
      status: 'PENDING',
      address: { name: 'T', phone: '9', addressLine: 'a', city: 'c', state: 's', pincode: '500001' }
    });

    const payload = { id: 'wh1', event: 'payment.captured', payload: { payment: { entity: { id: 'p1', order_id: 'tx1', amount: 10000 } } } };
    const rawBody = JSON.stringify(payload);
    // Make gateway verify return false
    jest.spyOn(gateway, 'verifyWebhookSignature').mockReturnValue(false);

    await expect(paymentService.handleWebhook(rawBody, 'bad_sig')).rejects.toThrow('Invalid webhook signature');
  });
});

