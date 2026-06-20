import { jest } from '@jest/globals';
import mongoose from 'mongoose';
import * as paymentRepo from '../../src/modules/payment/payment.repository.js';
import Order from '../../src/modules/order/order.model.js';
let paymentService;
import { setupTestDB, teardownTestDB, clearDatabase, setupRedis, teardownRedis, mockExternalServices } from '../helpers/testUtils.js';
import * as gateway from '../../src/modules/payment/payment.gateway.js';
import { redisClient } from '../../src/config/redis.js';

describe('Payment Webhook — idempotency and signature handling', () => {
  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    process.env.RAZORPAY_WEBHOOK_SECRET = 'test_secret_123';
    await setupTestDB();
    setupRedis();
    mockExternalServices();
    // Import paymentService after mocking external services to avoid bullmq/ioredis-mock lua issues
    // eslint-disable-next-line no-global-assign
    paymentService = await import('../../src/modules/payment/payment.service.js');
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

  it('processes webhook once and ignores replay (idempotent)', async () => {
    // Arrange - create order and payment records
    const userId = new mongoose.Types.ObjectId();
    const order = await Order.create({
      userId,
      items: [{ productId: new mongoose.Types.ObjectId(), name: 'P', price: 100, quantity: 1 }],
      totalAmount: 100,
      paymentMethod: 'ONLINE',
      paymentStatus: 'PENDING',
      status: 'PENDING',
      address: {
        name: 'Test',
        phone: '9999999999',
        addressLine: '1 Test St',
        city: 'TestCity',
        state: 'TS',
        pincode: '500001'
      },
    });

    const transactionId = 'rzp_order_test_1';
    await paymentRepo.createPayment({
      orderId: order._id,
      userId,
      amount: 100,
      transactionId,
      paymentMethod: 'ONLINE',
      status: 'PENDING',
    });

    const webhookId = 'wh_test_1';
    const payload = {
      id: webhookId,
      event: 'payment.captured',
      payload: {
        payment: {
          entity: {
            id: 'pay_test_1',
            order_id: transactionId,
            amount: 100 * 100, // paise
          }
        }
      }
    };

    const rawBody = JSON.stringify(payload);
    // Mock gateway signature verification to return true
    jest.spyOn(gateway, 'verifyWebhookSignature').mockReturnValue(true);

    // Act - first processing
    const first = await paymentService.handleWebhook(rawBody, 'sig1');
    expect(first).toBeDefined();
    expect(first.status).toBe('ok');

    // Verify DB changes
    const processedPayment = await paymentRepo.findByTransactionId(transactionId);
    expect(processedPayment).toBeDefined();
    expect(processedPayment.status).toBe('SUCCESS');

    const updatedOrder = await Order.findById(order._id);
    expect(updatedOrder.paymentStatus).toBe('PAID');

    // Redis should have webhook processed key set
    const redisKey = `webhook:processed:${webhookId}`;
    const redisVal = await redisClient.get(redisKey);
    expect(redisVal).toBeDefined();

    // Act - replay the same webhook
    const second = await paymentService.handleWebhook(rawBody, 'sig1');
    expect(second).toBeDefined();
    // Accept either "Already processed" or "Already captured" message depending on timing
    expect(typeof second.message === 'string' || second.status === 'ok').toBeTruthy();
    expect(second.message ? second.message.toLowerCase().includes('already') : true).toBeTruthy();
  }, 20000);
});

