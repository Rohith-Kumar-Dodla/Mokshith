import { describe, it, expect } from '@jest/globals';
import { buildPaymentCompletedFilter } from '../../src/modules/order/order.service.js';
import { PAYMENT_STATUS } from '../../src/constants/paymentStatus.js';
import { ORDER_STATUS } from '../../src/constants/orderStatus.js';

describe('buildPaymentCompletedFilter', () => {
  it('includes PAID payments and delivered/completed COD orders', () => {
    expect(buildPaymentCompletedFilter()).toEqual({
      $or: [
        { paymentStatus: PAYMENT_STATUS.PAID },
        {
          paymentMethod: 'COD',
          status: { $in: [ORDER_STATUS.DELIVERED, ORDER_STATUS.COMPLETED] },
        },
      ],
    });
  });
});
