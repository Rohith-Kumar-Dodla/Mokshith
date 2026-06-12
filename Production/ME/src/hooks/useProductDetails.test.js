import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import useProductDetails from './useProductDetails';
import productService from '../services/productService';

vi.mock('../services/productService', () => ({
  default: {
    getProductById: vi.fn(),
    getAllProducts: vi.fn(),
  },
}));

describe('useProductDetails', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('loads product details and related products', async () => {
    productService.getProductById.mockResolvedValue({
      data: {
        _id: 'prod-1',
        name: 'Basmati Rice',
        price: 100,
        stock: 50,
        moq: 10,
        categoryId: { _id: 'cat-1', name: 'Grains' },
      },
    });

    productService.getAllProducts.mockResolvedValue({
      data: {
        products: [
          {
            _id: 'prod-1',
            name: 'Basmati Rice',
            price: 100,
            stock: 50,
            moq: 10,
            categoryId: { _id: 'cat-1', name: 'Grains' },
          },
          {
            _id: 'prod-2',
            name: 'Brown Rice',
            price: 90,
            stock: 30,
            moq: 10,
            categoryId: { _id: 'cat-1', name: 'Grains' },
          },
        ],
      },
    });

    const { result } = renderHook(() => useProductDetails('prod-1'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.product.id).toBe('prod-1');
    expect(result.current.product.category).toBe('Grains');
    expect(result.current.relatedProducts).toHaveLength(1);
    expect(result.current.relatedProducts[0].id).toBe('prod-2');
  });

  it('handles missing product', async () => {
    productService.getProductById.mockRejectedValue({
      response: { data: { message: 'Product not found' } },
    });

    const { result } = renderHook(() => useProductDetails('missing'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.product).toBeNull();
    expect(result.current.error).toBe('Product not found');
  });

  it('skips fetch when product id is missing', async () => {
    const { result } = renderHook(() => useProductDetails(null));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(productService.getProductById).not.toHaveBeenCalled();
    expect(result.current.product).toBeNull();
  });
});
