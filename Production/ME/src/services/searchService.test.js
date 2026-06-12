import { describe, it, expect, beforeEach, vi } from 'vitest';
import searchService from './searchService';
import api from './api';

vi.mock('./api', () => ({
  default: {
    get: vi.fn(),
  },
}));

describe('searchService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls search endpoint with q param', async () => {
    api.get.mockResolvedValue({
      data: {
        success: true,
        data: [
          {
            _id: 'prod-1',
            name: 'Basmati Rice',
            price: 100,
            stock: 50,
            moq: 10,
            categoryId: { _id: 'cat-1', name: 'Grains' },
          },
        ],
      },
    });

    await searchService.searchProducts('rice');

    expect(api.get).toHaveBeenCalledWith('/search', {
      params: { q: 'rice' },
    });
  });

  it('maps search results to frontend products', async () => {
    api.get.mockResolvedValue({
      data: {
        success: true,
        data: [
          {
            _id: 'prod-1',
            name: 'Basmati Rice',
            price: 100,
            stock: 50,
            moq: 10,
            categoryId: { _id: 'cat-1', name: 'Grains' },
          },
        ],
      },
    });

    const result = await searchService.searchProducts('rice');

    expect(result.products).toHaveLength(1);
    expect(result.products[0].id).toBe('prod-1');
    expect(result.products[0].category).toBe('Grains');
  });
});
