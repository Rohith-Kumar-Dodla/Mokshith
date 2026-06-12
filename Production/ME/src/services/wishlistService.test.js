import { describe, it, expect, beforeEach, vi } from 'vitest';
import wishlistService from './wishlistService';
import api from './api';

vi.mock('./api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('wishlistService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls getWishlist endpoint', async () => {
    api.get.mockResolvedValue({ data: { success: true, data: { items: [] } } });

    await wishlistService.getWishlist();

    expect(api.get).toHaveBeenCalledWith('/wishlist');
  });

  it('calls addToWishlist endpoint', async () => {
    api.post.mockResolvedValue({ data: { success: true, data: { items: [] } } });

    await wishlistService.addToWishlist('prod-1');

    expect(api.post).toHaveBeenCalledWith('/wishlist/add', { productId: 'prod-1' });
  });

  it('calls removeFromWishlist endpoint', async () => {
    api.delete.mockResolvedValue({ data: { success: true, data: { items: [] } } });

    await wishlistService.removeFromWishlist('prod-1');

    expect(api.delete).toHaveBeenCalledWith('/wishlist/remove/prod-1');
  });

  it('calls clearWishlist endpoint', async () => {
    api.delete.mockResolvedValue({ data: { success: true, data: null } });

    await wishlistService.clearWishlist();

    expect(api.delete).toHaveBeenCalledWith('/wishlist/clear');
  });
});
