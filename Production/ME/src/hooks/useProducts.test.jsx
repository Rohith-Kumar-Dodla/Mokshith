import { renderHook, waitFor, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import useProducts from './useProducts';
import productService from '../services/productService';
import searchService from '../services/searchService';

vi.mock('../services/productService', () => ({
  default: {
    getAllProducts: vi.fn(),
  },
}));

vi.mock('../services/searchService', () => ({
  default: {
    searchProducts: vi.fn(),
  },
}));

const wrapper = ({ children, initialEntries = ['/vendor/products'] }) => (
  <MemoryRouter initialEntries={initialEntries}>
    <Routes>
      <Route path="/vendor/products" element={<div>{children}</div>} />
    </Routes>
  </MemoryRouter>
);

describe('useProducts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('loads and maps products from API', async () => {
    // Return the API-shaped payload that unwrapApiData expects (success + data).
    productService.getAllProducts.mockResolvedValue({
      success: true,
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
        ],
        pagination: { page: 1, limit: 100, total: 1, totalPages: 1 },
      },
    });

    const { result } = renderHook(() => useProducts(), {
      wrapper: ({ children }) => wrapper({ children }),
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.products).toHaveLength(1);
    expect(result.current.products[0].id).toBe('prod-1');
    expect(result.current.products[0].category).toBe('Grains');
    expect(result.current.filteredProducts).toHaveLength(1);
  });

  it('passes categoryId from URL to API', async () => {
    productService.getAllProducts.mockResolvedValue({
      data: { products: [], pagination: null },
    });

    renderHook(() => useProducts(), {
      wrapper: ({ children }) =>
        wrapper({ children, initialEntries: ['/vendor/products?categoryId=cat-1'] }),
    });

    await waitFor(() => {
      // getAllProducts is called with (params, options). Check first call's first arg.
      expect(productService.getAllProducts).toHaveBeenCalled();
      const firstCallFirstArg = productService.getAllProducts.mock.calls[0][0];
      expect(firstCallFirstArg).toEqual(expect.objectContaining({ categoryId: 'cat-1' }));
    });
  });

  it('handles API errors', async () => {
    productService.getAllProducts.mockRejectedValue({
      response: { data: { message: 'Server error' } },
    });

    const { result } = renderHook(() => useProducts(), {
      wrapper: ({ children }) => wrapper({ children }),
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe('Server error');
    expect(result.current.products).toHaveLength(0);
  });

  it('uses searchService when search term is provided', async () => {
    searchService.searchProducts.mockResolvedValue({
      products: [
        {
          id: 'prod-1',
          name: 'Basmati Rice',
          price: 100,
          stock: 50,
          minimumOrderQuantity: 10,
          category: 'Grains',
          categoryId: 'cat-1',
          status: 'active',
        },
      ],
      pagination: null,
    });

    const { result } = renderHook(() => useProducts(), {
      wrapper: ({ children }) => wrapper({ children }),
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    act(() => {
      result.current.handleSearch('rice');
    });

    await waitFor(() => {
      expect(searchService.searchProducts).toHaveBeenCalledWith('rice');
      expect(result.current.products).toHaveLength(1);
    });
  });

  it('applies client-side filters', async () => {
    productService.getAllProducts.mockResolvedValue({
      success: true,
      data: {
        products: [
          {
            _id: 'prod-1',
            name: 'Basmati Rice',
            price: 100,
            stock: 50,
            moq: 10,
            categoryId: { _id: 'cat-1', name: 'Grains' },
            brand: 'India Gate',
          },
          {
            _id: 'prod-2',
            name: 'Wheat Flour',
            price: 50,
            stock: 20,
            moq: 5,
            categoryId: { _id: 'cat-2', name: 'Flour' },
            brand: 'Aashirvaad',
          },
        ],
      },
    });

    const { result } = renderHook(() => useProducts(), {
      wrapper: ({ children }) => wrapper({ children }),
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    act(() => {
      result.current.handleFilterChange({ categoryIds: ['cat-1'] });
    });

    await waitFor(() => {
      expect(result.current.filteredProducts).toHaveLength(1);
      expect(result.current.filteredProducts[0].name).toBe('Basmati Rice');
    });
  });
});
