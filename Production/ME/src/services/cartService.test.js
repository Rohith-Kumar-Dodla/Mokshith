import { describe, it, expect, beforeEach, vi } from 'vitest';
import cartService from './cartService';
import api from './api';

vi.mock('./api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('cartService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls getCart endpoint', async () => {
    api.get.mockResolvedValue({
      data: {
        success: true,
        data: { _id: 'cart-1', items: [] },
      },
    });

    const result = await cartService.getCart();

    expect(api.get).toHaveBeenCalledWith('/cart');
    expect(result.data.items).toEqual([]);
  });

  it('calls addToCart endpoint with productId and quantity', async () => {
    api.post.mockResolvedValue({
      data: {
        success: true,
        data: {
          _id: 'cart-1',
          items: [{ productId: 'prod-1', quantity: 10 }],
        },
      },
    });

    await cartService.addToCart('prod-1', 10);

    expect(api.post).toHaveBeenCalledWith('/cart', {
      productId: 'prod-1',
      quantity: 10,
    });
  });

  it('calls removeFromCart endpoint with productId', async () => {
    api.delete.mockResolvedValue({
      data: {
        success: true,
        data: { _id: 'cart-1', items: [] },
      },
    });

    await cartService.removeFromCart('prod-1');

    expect(api.delete).toHaveBeenCalledWith('/cart/prod-1');
  });

  it('propagates API failures', async () => {
    const apiError = {
      response: { data: { message: 'Insufficient stock' } },
    };
    api.post.mockRejectedValue(apiError);

    await expect(cartService.addToCart('prod-1', 100)).rejects.toEqual(apiError);
  });
});
