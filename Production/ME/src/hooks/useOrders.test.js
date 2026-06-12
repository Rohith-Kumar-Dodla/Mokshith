import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useOrders, useOrderDetails } from './useOrders';
import orderService from '../services/orderService';

vi.mock('../services/orderService', () => ({
  default: {
    getAllOrders: vi.fn(),
    getOrderById: vi.fn(),
  },
}));

describe('useOrders', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    orderService.getAllOrders.mockResolvedValue({
      data: [
        {
          _id: 'order-1',
          status: 'CONFIRMED',
          paymentStatus: 'PAID',
          totalAmount: 500,
          createdAt: '2026-06-01T10:00:00.000Z',
          items: [{ name: 'Rice', price: 50, quantity: 10 }],
        },
      ],
    });
  });

  it('loads and maps orders', async () => {
    const { result } = renderHook(() => useOrders());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(orderService.getAllOrders).toHaveBeenCalled();
    expect(result.current.orders).toHaveLength(1);
    expect(result.current.stats.totalOrders).toBe(1);
  });

  it('loads order details by id', async () => {
    orderService.getOrderById.mockResolvedValue({
      data: {
        _id: 'order-1',
        status: 'DELIVERED',
        paymentStatus: 'PAID',
        totalAmount: 500,
        createdAt: '2026-06-01T10:00:00.000Z',
        items: [{ name: 'Rice', price: 50, quantity: 10 }],
      },
    });

    const { result } = renderHook(() => useOrderDetails('order-1'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(orderService.getOrderById).toHaveBeenCalledWith('order-1');
    expect(result.current.order?.status).toBe('delivered');
  });
});
