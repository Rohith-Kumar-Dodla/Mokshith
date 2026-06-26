/**
 * In-process Razorpay SDK mock for integration tests.
 * Uses plain async functions (not jest.fn) so jest.clearAllMocks() cannot strip implementations.
 */
export class MockRazorpay {
  constructor() {
    this.orders = {
      create: async (options) => ({
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
      }),

      fetch: async (orderId) => ({
        id: orderId,
        entity: 'order',
        amount: 10000,
        amount_paid: 10000,
        amount_due: 0,
        currency: 'INR',
        status: 'paid',
        attempts: 1,
      }),

      fetchAll: async () => ({
        entity: 'collection',
        count: 1,
        items: [],
      }),
    };

    this.payments = {
      fetch: async (paymentId) => ({
        id: paymentId,
        entity: 'payment',
        amount: 10000,
        currency: 'INR',
        status: 'captured',
        method: 'card',
        captured: true,
        created_at: Math.floor(Date.now() / 1000),
      }),

      capture: async (paymentId, amount) => ({
        id: paymentId,
        entity: 'payment',
        amount,
        currency: 'INR',
        status: 'captured',
        captured: true,
      }),

      refund: async (paymentId, options = {}) => ({
        id: `rfnd_${Date.now()}`,
        entity: 'refund',
        amount: options.amount ?? 10000,
        currency: 'INR',
        payment_id: paymentId,
        status: 'processed',
        created_at: Math.floor(Date.now() / 1000),
        notes: options.notes,
      }),

      fetchMultiple: async () => ({
        entity: 'collection',
        count: 0,
        items: [],
      }),
    };

    this.refunds = {
      fetch: async (refundId) => ({
        id: refundId,
        entity: 'refund',
        amount: 10000,
        currency: 'INR',
        status: 'processed',
      }),

      fetchAll: async () => ({
        entity: 'collection',
        count: 0,
        items: [],
      }),
    };
  }

  reset() {
    // no-op: implementations are stable plain functions
  }
}

/** Ensure global Razorpay mock is present for payment integration suites. */
export function ensureRazorpayMock() {
  if (!global.__RAZORPAY_MOCK__) {
    global.__RAZORPAY_MOCK__ = new MockRazorpay();
  }
  return global.__RAZORPAY_MOCK__;
}

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

export default MockRazorpay;
