import { jest } from '@jest/globals';

/**
 * Mock Razorpay SDK for payment testing
 */
export class MockRazorpay {
  constructor() {
    this.orders = {
      create: jest.fn().mockImplementation((options) =>
        Promise.resolve({
          id: `order_${Date.now()}`,
          entity: 'order',
          amount: options.amount,
          amount_paid: 0,
          amount_due: options.amount,
          currency: options.currency || 'INR',
          receipt: options.receipt,
          status: 'created',
          attempts: 0,
          created_at: Math.floor(Date.now() / 1000),
        })
      ),

      fetch: jest.fn().mockImplementation((orderId) =>
        Promise.resolve({
          id: orderId,
          entity: 'order',
          amount: 10000,
          amount_paid: 10000,
          amount_due: 0,
          currency: 'INR',
          status: 'paid',
          attempts: 1,
        })
      ),

      fetchAll: jest.fn().mockResolvedValue({
        entity: 'collection',
        count: 1,
        items: [],
      }),
    };

    this.payments = {
      fetch: jest.fn().mockImplementation((paymentId) =>
        Promise.resolve({
          id: paymentId,
          entity: 'payment',
          amount: 10000,
          currency: 'INR',
          status: 'captured',
          method: 'card',
          captured: true,
          created_at: Math.floor(Date.now() / 1000),
        })
      ),

      capture: jest.fn().mockImplementation((paymentId, amount) =>
        Promise.resolve({
          id: paymentId,
          entity: 'payment',
          amount,
          currency: 'INR',
          status: 'captured',
          captured: true,
        })
      ),

      refund: jest.fn().mockImplementation((paymentId, options = {}) =>
        Promise.resolve({
          id: `rfnd_${Date.now()}`,
          entity: 'refund',
          amount: options.amount || 10000,
          currency: 'INR',
          payment_id: paymentId,
          status: 'processed',
          created_at: Math.floor(Date.now() / 1000),
        })
      }),

      fetchMultiple: jest.fn().mockResolvedValue({
        entity: 'collection',
        count: 0,
        items: [],
      }),
    };

    this.refunds = {
      fetch: jest.fn().mockImplementation((refundId) =>
        Promise.resolve({
          id: refundId,
          entity: 'refund',
          amount: 10000,
          currency: 'INR',
          status: 'processed',
        })
      ),

      fetchAll: jest.fn().mockResolvedValue({
        entity: 'collection',
        count: 0,
        items: [],
      }),
    };
  }

  // Simulate payment failure
  simulateFailure(method = 'create') {
    if (method === 'create') {
      this.orders.create.mockRejectedValueOnce(
        new Error('Razorpay API Error: Invalid amount')
      );
    } else if (method === 'capture') {
      this.payments.capture.mockRejectedValueOnce(
        new Error('Payment capture failed')
      );
    }
  }

  // Simulate payment success
  simulateSuccess(type = 'order') {
    if (type === 'order') {
      this.orders.fetch.mockResolvedValueOnce({
        id: 'order_success',
        status: 'paid',
        amount_paid: 10000,
      });
    }
  }

  // Reset all mocks
  reset() {
    this.orders.create.mockClear();
    this.orders.fetch.mockClear();
    this.payments.fetch.mockClear();
    this.payments.capture.mockClear();
    this.payments.refund.mockClear();
  }
}

/**
 * Mock Razorpay webhook signature verification
 */
export const mockVerifyWebhookSignature = jest.fn().mockReturnValue(true);

/**
 * Generate Razorpay webhook payload
 */
export const generateWebhookPayload = (event = 'payment.captured', data = {}) => ({
  entity: 'event',
  account_id: 'acc_test123',
  event,
  contains: ['payment'],
  payload: {
    payment: {
      entity: {
        id: data.paymentId || 'pay_test123',
        order_id: data.orderId || 'order_test123',
        amount: data.amount || 10000,
        currency: 'INR',
        status: 'captured',
        method: 'card',
        captured: true,
        ...data,
      },
    },
  },
  created_at: Math.floor(Date.now() / 1000),
});

/**
 * Generate webhook signature
 */
export const generateWebhookSignature = (payload, secret = 'test_secret') => {
  // Mock signature - in real tests we'd use crypto
  return 'mock_signature_' + Buffer.from(JSON.stringify(payload)).toString('base64').slice(0, 20);
};

export default MockRazorpay;
