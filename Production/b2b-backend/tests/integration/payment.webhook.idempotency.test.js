import mongoose from 'mongoose';
import * as paymentRepo from '../../src/modules/payment/payment.repository.js';
import Order from '../../src/modules/order/order.model.js';
let paymentService;
import crypto from 'crypto';
import { clearDatabase, setupRedis, teardownRedis } from '../helpers/testUtils.js';
import { redisClient } from '../../src/config/redis.js';

describe('Payment Webhook — idempotency and signature handling', () => {
  beforeAll(async () => {
    process.env.RAZORPAY_WEBHOOK_SECRET = 'test_secret_123';
    setupRedis();
    paymentService = await import('../../src/modules/payment/payment.service.js');
  });

  afterAll(async () => {
    await teardownRedis();
  });

  beforeEach(async () => {
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
    const signature = crypto
      .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET)
      .update(rawBody)
      .digest('hex');

    // Act - first processing
    const first = await paymentService.handleWebhook(rawBody, signature);
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
    const second = await paymentService.handleWebhook(rawBody, signature);
    expect(second).toBeDefined();
    // Should be idempotent
    expect(second.status).toBe('ok');
    if (second.message) {
      expect(second.message.toLowerCase()).toContain('already');
    }
  }, 20000);
});

