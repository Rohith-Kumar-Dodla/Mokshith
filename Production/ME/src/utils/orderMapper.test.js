import { describe, it, expect } from 'vitest';
import {
  mapBackendOrder,
  mapBackendOrderStatus,
  computeOrderStats,
  buildOrderTimeline,
} from './orderMapper';

describe('orderMapper', () => {
  it('maps backend order statuses to vendor UI statuses', () => {
    expect(mapBackendOrderStatus('CONFIRMED')).toBe('confirmed');
    expect(mapBackendOrderStatus('OUT_FOR_DELIVERY')).toBe('dispatched');
    expect(mapBackendOrderStatus('PENDING_PAYMENT')).toBe('pending');
  });

  it('maps backend order document', () => {
    const mapped = mapBackendOrder({
      _id: 'order-1',
      status: 'CONFIRMED',
      paymentStatus: 'PAID',
      paymentMethod: 'COD',
      totalAmount: 1180,
      createdAt: '2026-06-01T10:00:00.000Z',
      shippingAddress: {
        name: 'Fresh Mart',
        phone: '9876543210',
        addressLine: '12 Market Road',
        city: 'Hyderabad',
        state: 'Telangana',
        pincode: '500001',
      },
      items: [
        {
          name: 'Basmati Rice',
          price: 100,
          finalPrice: 100,
          quantity: 10,
        },
      ],
    });

    expect(mapped.id).toBe('order-1');
    expect(mapped.status).toBe('confirmed');
    expect(mapped.paymentStatus).toBe('paid');
    expect(mapped.items).toHaveLength(1);
    expect(mapped.amount).toBe(1180);
    expect(mapped.address).toContain('Hyderabad');
  });

  it('builds timeline from order status', () => {
    const timeline = buildOrderTimeline('PROCESSING', '2026-06-01T10:00:00.000Z');
    expect(timeline[0].completed).toBe(true);
    expect(timeline[2].completed).toBe(true);
    expect(timeline[4].completed).toBe(false);
  });

  it('computes order stats from mapped orders', () => {
    const stats = computeOrderStats([
      { status: 'pending', amount: 100 },
      { status: 'confirmed', amount: 200 },
      { status: 'delivered', amount: 300 },
    ]);

    expect(stats.totalOrders).toBe(3);
    expect(stats.pendingOrders).toBe(1);
    expect(stats.deliveredOrders).toBe(1);
    expect(stats.totalSpending).toBe(600);
  });
});
