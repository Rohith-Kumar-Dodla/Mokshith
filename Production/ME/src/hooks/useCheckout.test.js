import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useCheckout, buildShippingAddress, mapPaymentMethodToBackend } from './useCheckout';
import orderService from '../services/orderService';

const navigateMock = vi.fn();

vi.mock('react-router-dom', () => ({
  useNavigate: () => navigateMock,
}));

vi.mock('../services/orderService', () => ({
  default: {
    createOrder: vi.fn(),
  },
}));

describe('useCheckout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    orderService.createOrder.mockResolvedValue({
      data: {
        _id: 'order-1',
        status: 'CONFIRMED',
        paymentStatus: 'PENDING',
        paymentMethod: 'COD',
        totalAmount: 1180,
        createdAt: '2026-06-01T10:00:00.000Z',
        items: [],
      },
    });
  });

  it('maps payment methods to backend enums', () => {
    expect(mapPaymentMethodToBackend('cod')).toBe('COD');
    expect(mapPaymentMethodToBackend('upi')).toBe('UPI');
    expect(mapPaymentMethodToBackend('credit')).toBe('CREDIT');
    expect(mapPaymentMethodToBackend('hybrid')).toBe('ONLINE');
    expect(mapPaymentMethodToBackend('bank_transfer')).toBe('BANK_TRANSFER');
  });

  it('builds shipping address payload', () => {
    const address = buildShippingAddress({
      businessName: 'Fresh Mart',
      contactPerson: 'Rajesh',
      phone: '+91 9876543210',
      deliveryAddress: '12 Market Road',
      city: 'Hyderabad',
      state: 'Telangana',
      pincode: '500001',
    });

    expect(address.phone).toBe('9876543210');
    expect(address.city).toBe('Hyderabad');
    expect(address.pincode).toBe('500001');
  });

  it('places order and navigates to success page', async () => {
    const { result } = renderHook(() => useCheckout());

    await act(async () => {
      await result.current.placeOrder({
        paymentMethodId: 'cod',
        formData: {
          businessName: 'Fresh Mart',
          contactPerson: 'Rajesh',
          phone: '9876543210',
          deliveryAddress: '12 Market Road',
          city: 'Hyderabad',
          state: 'Telangana',
          pincode: '500001',
        },
      });
    });

    expect(orderService.createOrder).toHaveBeenCalled();
    // Navigate includes orderId query param and state with order/payment info
    expect(navigateMock).toHaveBeenCalledWith(
      expect.stringMatching(/^\/vendor\/order-success\?orderId=order-1$/),
      expect.objectContaining({
        replace: true,
        state: expect.objectContaining({
          paymentMethodId: 'cod',
        }),
      })
    );
  });
});
