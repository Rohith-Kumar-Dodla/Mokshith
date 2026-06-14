import { describe, it, expect, beforeEach, vi } from 'vitest';
import orderService from './orderService';
import api from './api';

vi.mock('./api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
  },
}));

describe('orderService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls getAllOrders endpoint', async () => {
    api.get.mockResolvedValue({ data: { success: true, data: [] } });

    await orderService.getAllOrders();

    expect(api.get).toHaveBeenCalledWith('/orders', { params: {} });
  });

  it('calls getOrderById endpoint', async () => {
    api.get.mockResolvedValue({ data: { success: true, data: { _id: 'order-1' } } });

    await orderService.getOrderById('order-1');

    expect(api.get).toHaveBeenCalledWith('/orders/order-1');
  });

  it('calls createOrder endpoint', async () => {
    api.post.mockResolvedValue({ data: { success: true, data: { _id: 'order-1' } } });

    await orderService.createOrder({
      paymentMethod: 'COD',
      shippingAddress: {
        name: 'Test',
        phone: '9876543210',
        addressLine: '12 Road',
        city: 'Hyderabad',
        state: 'Telangana',
        pincode: '500001',
      },
    });

    expect(api.post).toHaveBeenCalledWith(
      '/orders',
      expect.objectContaining({ paymentMethod: 'COD' }),
      expect.objectContaining({ headers: {} })
    );
  });

  it('calls downloadInvoice endpoint with blob response', async () => {
    api.get.mockResolvedValue({ data: new Blob(['pdf']) });

    await orderService.downloadInvoice('order-1');

    expect(api.get).toHaveBeenCalledWith('/orders/order-1/invoice', {
      responseType: 'blob',
    });
  });
});
