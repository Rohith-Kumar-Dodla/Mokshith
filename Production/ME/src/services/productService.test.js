import { describe, it, expect, beforeEach, vi } from 'vitest';
import productService from './productService';
import api from './api';

vi.mock('./api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
    patch: vi.fn(),
  },
}));

describe('productService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls products list endpoint with params', async () => {
    api.get.mockResolvedValue({
      data: {
        success: true,
        data: {
          products: [{ _id: 'prod-1', name: 'Rice' }],
          pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
        },
      },
    });

    await productService.getAllProducts({ page: 1, limit: 20, categoryId: 'cat-1', search: 'rice' });

    expect(api.get).toHaveBeenCalledWith('/products', {
      params: { page: 1, limit: 20, categoryId: 'cat-1', search: 'rice' },
    });
  });

  it('calls product by id endpoint', async () => {
    api.get.mockResolvedValue({
      data: {
        success: true,
        data: { _id: 'prod-1', name: 'Rice' },
      },
    });

    await productService.getProductById('prod-1');

    expect(api.get).toHaveBeenCalledWith('/products/prod-1');
  });

  it('calls stock update endpoint with stock body', async () => {
    api.patch.mockResolvedValue({ data: { success: true, data: {} } });

    await productService.updateProductStock('prod-1', 25);

    expect(api.patch).toHaveBeenCalledWith('/products/prod-1/stock', { stock: 25 });
  });
});
