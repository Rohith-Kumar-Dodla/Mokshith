import { renderHook, waitFor, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import useCart from './useCart';
import cartService from '../services/cartService';

vi.mock('../services/cartService', () => ({
  default: {
    getCart: vi.fn(),
    addToCart: vi.fn(),
    removeFromCart: vi.fn(),
  },
}));

const backendCartItem = {
  productId: {
    _id: 'prod-1',
    name: 'Basmati Rice',
    price: 100,
    stock: 50,
    moq: 10,
    bulkPricing: [{ minQuantity: 25, price: 90 }],
    categoryId: { _id: 'cat-1', name: 'Grains' },
  },
  quantity: 30,
};

function apiCart(payload) {
  return { success: true, data: payload };
}

describe('useCart', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('loads and maps cart from API', async () => {
    cartService.getCart.mockResolvedValue(
      apiCart({
        _id: 'cart-1',
        items: [backendCartItem],
      })
    );

    const { result } = renderHook(() => useCart());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.cartItems).toHaveLength(1);
    expect(result.current.cartItems[0].productName).toBe('Basmati Rice');
    expect(result.current.itemCount).toBe(1);
    expect(result.current.subtotal).toBe(2700);
    expect(result.current.discount).toBe(300);
    expect(result.current.tax).toBeCloseTo(486);
    expect(result.current.grandTotal).toBeCloseTo(3186);
  });

  it('handles empty cart response', async () => {
    cartService.getCart.mockResolvedValue(apiCart(null));

    const { result } = renderHook(() => useCart());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.cartItems).toHaveLength(0);
    expect(result.current.subtotal).toBe(0);
    expect(result.current.grandTotal).toBe(0);
  });

  it('handles load errors', async () => {
    cartService.getCart.mockRejectedValue({
      response: { status: 401, data: { message: 'Unauthorized' } },
    });

    const { result } = renderHook(() => useCart());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe('Your session has expired. Please sign in again.');
    expect(result.current.cartItems).toHaveLength(0);
  });

  it('adds item to cart and updates state', async () => {
    cartService.getCart.mockResolvedValue(apiCart(null));
    cartService.addToCart.mockResolvedValue(
      apiCart({
        _id: 'cart-1',
        items: [backendCartItem],
      })
    );

    const { result } = renderHook(() => useCart());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.addToCart('prod-1', 30);
    });

    expect(cartService.addToCart).toHaveBeenCalledWith('prod-1', 30);
    expect(result.current.cartItems).toHaveLength(1);
    expect(result.current.error).toBeNull();
  });

  it('removes item from cart and updates state', async () => {
    cartService.getCart.mockResolvedValue(
      apiCart({
        _id: 'cart-1',
        items: [backendCartItem],
      })
    );
    cartService.removeFromCart.mockResolvedValue(
      apiCart({
        _id: 'cart-1',
        items: [],
      })
    );

    const { result } = renderHook(() => useCart());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.removeFromCart('prod-1');
    });

    expect(cartService.removeFromCart).toHaveBeenCalledWith('prod-1');
    expect(result.current.cartItems).toHaveLength(0);
  });

  it('calculates totals from mapped cart items', async () => {
    cartService.getCart.mockResolvedValue(
      apiCart({
        _id: 'cart-1',
        items: [
          backendCartItem,
          {
            productId: {
              _id: 'prod-2',
              name: 'Dal',
              price: 50,
              stock: 40,
              moq: 5,
            },
            quantity: 10,
          },
        ],
      })
    );

    const { result } = renderHook(() => useCart());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.subtotal).toBe(3200);
    expect(result.current.itemCount).toBe(2);
    expect(result.current.tax).toBeCloseTo(576);
    expect(result.current.grandTotal).toBeCloseTo(3776);
  });
});
