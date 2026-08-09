import { describe, it, expect } from 'vitest';
import {
  mapBackendOrder,
  mapBackendOrderStatus,
  computeOrderStats,
  buildOrderTimeline,
  isPaymentCompletedOrder,
  formatPaymentMethodLabel,
} from './orderMapper';

describe('orderMapper', () => {
  it('maps backend order statuses to vendor UI statuses', () => {
    expect(mapBackendOrderStatus('CONFIRMED')).toBe('confirmed');
    expect(mapBackendOrderStatus('OUT_FOR_DELIVERY')).toBe('dispatched');
    expect(mapBackendOrderStatus('ASSIGNED')).toBe('assigned');
    expect(mapBackendOrderStatus('ACCEPTED')).toBe('accepted');
    expect(mapBackendOrderStatus('PICKED_UP')).toBe('picked_up');
    expect(mapBackendOrderStatus('PENDING_PAYMENT')).toBe('pending');
    expect(mapBackendOrderStatus('PROCESSING')).toBe('processing');
    expect(mapBackendOrderStatus('SHIPPED')).toBe('shipped');
    expect(mapBackendOrderStatus('DELIVERED')).toBe('delivered');
    expect(mapBackendOrderStatus('COMPLETED')).toBe('completed');
  });

  it('does not show Estimated Delivery Processing for COMPLETED orders', () => {
    const completed = mapBackendOrder({
      _id: 'order-done',
      status: 'COMPLETED',
      paymentStatus: 'PAID',
      paymentMethod: 'COD',
      totalAmount: 500,
      createdAt: '2026-06-01T10:00:00.000Z',
      updatedAt: '2026-06-03T10:00:00.000Z',
      items: [],
    });

    expect(completed.status).toBe('completed');
    expect(completed.estimatedDelivery).toBeNull();
    expect(completed.deliveryDate).not.toBeNull();

    const processing = mapBackendOrder({
      _id: 'order-proc',
      status: 'PROCESSING',
      paymentStatus: 'PAID',
      paymentMethod: 'ONLINE',
      totalAmount: 500,
      createdAt: '2026-06-01T10:00:00.000Z',
      items: [],
    });
    expect(processing.estimatedDelivery).toBe('Processing');
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
    expect(timeline[1].completed).toBe(true);
    expect(timeline[2].completed).toBe(false);

    const assignedTimeline = buildOrderTimeline('ASSIGNED', '2026-06-01T10:00:00.000Z');
    expect(assignedTimeline[3].completed).toBe(true);
    expect(assignedTimeline[4].completed).toBe(false);
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

  it('classifies payment-completed online and COD orders correctly', () => {
    expect(isPaymentCompletedOrder({
      paymentStatus: 'paid',
      paymentMethod: 'ONLINE',
      backendStatus: 'CONFIRMED',
    })).toBe(true);

    expect(isPaymentCompletedOrder({
      paymentStatus: 'pending',
      paymentMethod: 'ONLINE',
      backendStatus: 'PENDING',
    })).toBe(false);

    expect(isPaymentCompletedOrder({
      paymentStatus: 'pending',
      paymentMethod: 'COD',
      backendStatus: 'DELIVERED',
    })).toBe(true);

    expect(isPaymentCompletedOrder({
      paymentStatus: 'pending',
      paymentMethod: 'COD',
      backendStatus: 'CONFIRMED',
    })).toBe(false);

    expect(formatPaymentMethodLabel('COD')).toBe('COD');
    expect(formatPaymentMethodLabel('ONLINE')).toBe('ONLINE');
  });
});
