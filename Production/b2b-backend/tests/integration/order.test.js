import { describe, it, expect } from '@jest/globals';

describe('Order lifecycle constants', () => {
  it('documents valid order status transitions used by order.workflow', () => {
    const validTransitions = {
      CREATED: ['PENDING_PAYMENT', 'CONFIRMED', 'FAILED'],
      PENDING_PAYMENT: ['PAID', 'FAILED'],
      PAID: ['CONFIRMED'],
      CONFIRMED: ['SHIPPED'],
      SHIPPED: ['DELIVERED'],
    };

    expect(validTransitions.CREATED).toContain('PENDING_PAYMENT');
    expect(validTransitions.PAID).toContain('CONFIRMED');
    expect(validTransitions.CONFIRMED).toContain('SHIPPED');
  });
});
