import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useWishlist } from './useWishlist';
import wishlistService from '../services/wishlistService';

vi.mock('../services/wishlistService', () => ({
  default: {
    getWishlist: vi.fn(),
    addToWishlist: vi.fn(),
    removeFromWishlist: vi.fn(),
    clearWishlist: vi.fn(),
  },
}));

describe('useWishlist', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    wishlistService.getWishlist.mockResolvedValue({
      data: {
        _id: 'wish-1',
        items: [
          {
            productId: {
              _id: 'prod-1',
              name: 'Basmati Rice',
              price: 120,
              stock: 20,
              moq: 1,
            },
          },
        ],
      },
    });
  });

  it('loads wishlist items on mount', async () => {
    const { result } = renderHook(() => useWishlist());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(wishlistService.getWishlist).toHaveBeenCalled();
    expect(result.current.wishlistItems).toHaveLength(1);
    expect(result.current.wishlistItems[0].productName).toBe('Basmati Rice');
  });

  it('adds product to wishlist', async () => {
    wishlistService.addToWishlist.mockResolvedValue({ data: { items: [] } });

    const { result } = renderHook(() => useWishlist());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.addToWishlist('prod-2');
    });

    expect(wishlistService.addToWishlist).toHaveBeenCalledWith('prod-2');
  });
});
