import { describe, it, expect } from '@jest/globals';
import {
  mapLogisticsStatusToOrderStatus,
  shouldApplyDeliveryOrderStatus,
  LOGISTICS_TO_ORDER_STATUS,
} from '../../src/modules/order/orderStatusSync.js';
import { ORDER_STATUS } from '../../src/constants/orderStatus.js';
import { DELIVERY_STATUS } from '../../src/constants/deliveryStatus.js';

describe('orderStatusSync', () => {
  it('maps logistics statuses to canonical order statuses', () => {
    expect(mapLogisticsStatusToOrderStatus(DELIVERY_STATUS.ASSIGNED)).toBe(ORDER_STATUS.ASSIGNED);
    expect(mapLogisticsStatusToOrderStatus(DELIVERY_STATUS.ACCEPTED)).toBe(ORDER_STATUS.ACCEPTED);
    expect(mapLogisticsStatusToOrderStatus(DELIVERY_STATUS.PICKED)).toBe(ORDER_STATUS.PICKED_UP);
    expect(mapLogisticsStatusToOrderStatus(DELIVERY_STATUS.OUT_FOR_DELIVERY)).toBe(
      ORDER_STATUS.OUT_FOR_DELIVERY
    );
    expect(mapLogisticsStatusToOrderStatus(DELIVERY_STATUS.DELIVERED)).toBe(ORDER_STATUS.DELIVERED);
    expect(mapLogisticsStatusToOrderStatus(DELIVERY_STATUS.FAILED)).toBe(ORDER_STATUS.DELIVERY_FAILED);
  });

  it('exposes full logistics mapping table', () => {
    expect(LOGISTICS_TO_ORDER_STATUS[DELIVERY_STATUS.COMPLETED]).toBe(ORDER_STATUS.COMPLETED);
    expect(LOGISTICS_TO_ORDER_STATUS[DELIVERY_STATUS.CANCELLED]).toBe(ORDER_STATUS.CANCELLED);
  });

  it('allows delivery phase transitions from packed order state', () => {
    expect(shouldApplyDeliveryOrderStatus(ORDER_STATUS.PACKED, ORDER_STATUS.ASSIGNED)).toBe(true);
    expect(shouldApplyDeliveryOrderStatus(ORDER_STATUS.ASSIGNED, ORDER_STATUS.ACCEPTED)).toBe(true);
    expect(
      shouldApplyDeliveryOrderStatus(ORDER_STATUS.OUT_FOR_DELIVERY, ORDER_STATUS.DELIVERED)
    ).toBe(true);
  });

  it('blocks backwards delivery transitions', () => {
    expect(shouldApplyDeliveryOrderStatus(ORDER_STATUS.DELIVERED, ORDER_STATUS.OUT_FOR_DELIVERY)).toBe(
      false
    );
    expect(shouldApplyDeliveryOrderStatus(ORDER_STATUS.ACCEPTED, ORDER_STATUS.ASSIGNED)).toBe(false);
  });

  it('always applies failure statuses', () => {
    expect(shouldApplyDeliveryOrderStatus(ORDER_STATUS.OUT_FOR_DELIVERY, ORDER_STATUS.DELIVERY_FAILED)).toBe(
      true
    );
    expect(
      shouldApplyDeliveryOrderStatus(ORDER_STATUS.OUT_FOR_DELIVERY, ORDER_STATUS.CUSTOMER_UNAVAILABLE)
    ).toBe(true);
  });
});
