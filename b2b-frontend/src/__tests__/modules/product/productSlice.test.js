import { describe, it, expect, beforeEach } from 'vitest';
import productReducer, {
  fetchStart,
  fetchProductsSuccess,
  fetchProductDetailSuccess,
  fetchFailure,
} from '../../../modules/product/productSlice.js';

describe('productSlice', () => {
  let initialState;

  beforeEach(() => {
    initialState = {
      products: [],
      pagination: null,
      selectedProduct: null,
      loading: false,
      error: null,
    };
  });

  describe('initial state', () => {
    it('should return the initial state', () => {
      const state = productReducer(undefined, { type: '@@INIT' });
      expect(state).toEqual(initialState);
    });
  });

  describe('fetchStart', () => {
    it('should set loading to true and clear error', () => {
      const previousState = {
        ...initialState,
        error: 'Previous error',
      };

      const state = productReducer(previousState, fetchStart());

      expect(state.loading).toBe(true);
      expect(state.error).toBe(null);
    });
  });

  describe('fetchProductsSuccess', () => {
    it('should set products array and stop loading', () => {
      const products = [
        { id: '1', name: 'Product 1', price: 100 },
        { id: '2', name: 'Product 2', price: 200 },
      ];

      const state = productReducer(initialState, fetchProductsSuccess(products));

      expect(state.products).toEqual(products);
      expect(state.loading).toBe(false);
      expect(state.pagination).toBe(null);
    });

    it('should handle payload with data property (array)', () => {
      const payload = {
        data: [
          { id: '1', name: 'Product 1', price: 100 },
          { id: '2', name: 'Product 2', price: 200 },
        ],
      };

      const state = productReducer(initialState, fetchProductsSuccess(payload));

      expect(state.products).toEqual(payload.data);
      expect(state.loading).toBe(false);
    });

    it('should handle payload with products and pagination', () => {
      const payload = {
        data: {
          products: [
            { id: '1', name: 'Product 1' },
            { id: '2', name: 'Product 2' },
          ],
          pagination: {
            page: 1,
            limit: 10,
            total: 50,
          },
        },
      };

      const state = productReducer(initialState, fetchProductsSuccess(payload));

      expect(state.products).toEqual(payload.data.products);
      expect(state.pagination).toEqual(payload.data.pagination);
      expect(state.loading).toBe(false);
    });

    it('should handle object payload without data property', () => {
      const payload = {
        products: [
          { id: '1', name: 'Product 1' },
        ],
        pagination: {
          page: 1,
          limit: 10,
        },
      };

      const state = productReducer(initialState, fetchProductsSuccess(payload));

      expect(state.products).toEqual(payload.products);
      expect(state.pagination).toEqual(payload.pagination);
    });

    it('should handle empty products array', () => {
      const state = productReducer(initialState, fetchProductsSuccess([]));
      
      expect(state.products).toEqual([]);
      expect(state.loading).toBe(false);
    });

    it('should handle payload with missing products property', () => {
      const payload = {
        data: {
          pagination: { page: 1 },
        },
      };

      const state = productReducer(initialState, fetchProductsSuccess(payload));

      expect(state.products).toEqual([]);
      expect(state.pagination).toEqual({ page: 1 });
    });

    it('should clear previous products when new ones are fetched', () => {
      const previousState = {
        ...initialState,
        products: [{ id: 'old', name: 'Old Product' }],
      };

      const newProducts = [
        { id: '1', name: 'New Product 1' },
        { id: '2', name: 'New Product 2' },
      ];

      const state = productReducer(previousState, fetchProductsSuccess(newProducts));

      expect(state.products).toEqual(newProducts);
      expect(state.products).not.toContainEqual({ id: 'old', name: 'Old Product' });
    });
  });

  describe('fetchProductDetailSuccess', () => {
    it('should set selected product and stop loading', () => {
      const product = {
        id: '1',
        name: 'Product 1',
        description: 'Description',
        price: 100,
        moq: 10,
        category: 'Electronics',
      };

      const state = productReducer(initialState, fetchProductDetailSuccess(product));

      expect(state.selectedProduct).toEqual(product);
      expect(state.loading).toBe(false);
    });

    it('should replace previous selected product', () => {
      const previousState = {
        ...initialState,
        selectedProduct: { id: 'old', name: 'Old Product' },
      };

      const newProduct = { id: '1', name: 'New Product' };

      const state = productReducer(previousState, fetchProductDetailSuccess(newProduct));

      expect(state.selectedProduct).toEqual(newProduct);
    });

    it('should not affect products list', () => {
      const previousState = {
        ...initialState,
        products: [
          { id: '1', name: 'Product 1' },
          { id: '2', name: 'Product 2' },
        ],
      };

      const selectedProduct = { id: '3', name: 'Product 3' };

      const state = productReducer(previousState, fetchProductDetailSuccess(selectedProduct));

      expect(state.products).toEqual(previousState.products);
      expect(state.selectedProduct).toEqual(selectedProduct);
    });
  });

  describe('fetchFailure', () => {
    it('should set error and stop loading', () => {
      const previousState = {
        ...initialState,
        loading: true,
      };

      const error = 'Failed to fetch products';
      const state = productReducer(previousState, fetchFailure(error));

      expect(state.loading).toBe(false);
      expect(state.error).toBe(error);
    });

    it('should preserve existing products on error', () => {
      const previousState = {
        ...initialState,
        loading: true,
        products: [{ id: '1', name: 'Existing Product' }],
      };

      const state = productReducer(previousState, fetchFailure('Error'));

      expect(state.products).toEqual(previousState.products);
      expect(state.error).toBe('Error');
    });
  });

  describe('pagination', () => {
    it('should set pagination data', () => {
      const payload = {
        data: {
          products: [{ id: '1', name: 'Product 1' }],
          pagination: {
            page: 2,
            limit: 20,
            total: 100,
            totalPages: 5,
          },
        },
      };

      const state = productReducer(initialState, fetchProductsSuccess(payload));

      expect(state.pagination).toEqual(payload.data.pagination);
    });

    it('should set pagination to null when not provided', () => {
      const products = [{ id: '1', name: 'Product 1' }];

      const state = productReducer(initialState, fetchProductsSuccess(products));

      expect(state.pagination).toBe(null);
    });

    it('should update pagination on subsequent fetches', () => {
      const firstFetch = {
        data: {
          products: [{ id: '1' }],
          pagination: { page: 1, total: 100 },
        },
      };

      let state = productReducer(initialState, fetchProductsSuccess(firstFetch));
      expect(state.pagination.page).toBe(1);

      const secondFetch = {
        data: {
          products: [{ id: '2' }],
          pagination: { page: 2, total: 100 },
        },
      };

      state = productReducer(state, fetchProductsSuccess(secondFetch));
      expect(state.pagination.page).toBe(2);
    });
  });

  describe('loading states', () => {
    it('should start loading on fetchStart', () => {
      const state = productReducer(initialState, fetchStart());
      expect(state.loading).toBe(true);
    });

    it('should stop loading on fetchProductsSuccess', () => {
      const previousState = { ...initialState, loading: true };
      const state = productReducer(previousState, fetchProductsSuccess([]));
      expect(state.loading).toBe(false);
    });

    it('should stop loading on fetchProductDetailSuccess', () => {
      const previousState = { ...initialState, loading: true };
      const state = productReducer(previousState, fetchProductDetailSuccess({}));
      expect(state.loading).toBe(false);
    });

    it('should stop loading on fetchFailure', () => {
      const previousState = { ...initialState, loading: true };
      const state = productReducer(previousState, fetchFailure('Error'));
      expect(state.loading).toBe(false);
    });
  });

  describe('edge cases', () => {
    it('should handle null payload in fetchProductsSuccess', () => {
      const state = productReducer(initialState, fetchProductsSuccess(null));
      
      expect(state.products).toEqual([]);
      expect(state.pagination).toBe(null);
    });

    it('should handle undefined payload in fetchProductsSuccess', () => {
      const state = productReducer(initialState, fetchProductsSuccess(undefined));
      
      expect(state.products).toEqual([]);
      expect(state.pagination).toBe(null);
    });

    it('should handle empty object payload', () => {
      const state = productReducer(initialState, fetchProductsSuccess({}));
      
      expect(state.products).toEqual([]);
    });

    it('should handle null selectedProduct', () => {
      const state = productReducer(initialState, fetchProductDetailSuccess(null));
      expect(state.selectedProduct).toBe(null);
    });

    it('should handle error as object', () => {
      const error = { message: 'Network error', code: 500 };
      const state = productReducer(initialState, fetchFailure(error));
      expect(state.error).toEqual(error);
    });

    it('should clear error on successful fetch', () => {
      const previousState = {
        ...initialState,
        error: 'Previous error',
      };

      const state = productReducer(previousState, fetchStart());
      expect(state.error).toBe(null);
    });
  });

  describe('complete workflow', () => {
    it('should handle full product listing flow', () => {
      let state = initialState;

      // Start loading
      state = productReducer(state, fetchStart());
      expect(state.loading).toBe(true);
      expect(state.error).toBe(null);

      // Fetch success
      const products = [
        { id: '1', name: 'Product 1', price: 100 },
        { id: '2', name: 'Product 2', price: 200 },
      ];
      state = productReducer(state, fetchProductsSuccess(products));
      expect(state.loading).toBe(false);
      expect(state.products).toEqual(products);

      // Fetch product detail
      state = productReducer(state, fetchStart());
      const detailedProduct = {
        id: '1',
        name: 'Product 1',
        description: 'Detailed description',
        price: 100,
      };
      state = productReducer(state, fetchProductDetailSuccess(detailedProduct));
      expect(state.selectedProduct).toEqual(detailedProduct);
      expect(state.products).toEqual(products);
    });

    it('should handle error flow', () => {
      let state = initialState;

      // Start loading
      state = productReducer(state, fetchStart());
      expect(state.loading).toBe(true);

      // Fetch failure
      state = productReducer(state, fetchFailure('Network error'));
      expect(state.loading).toBe(false);
      expect(state.error).toBe('Network error');

      // Retry
      state = productReducer(state, fetchStart());
      expect(state.error).toBe(null);
      expect(state.loading).toBe(true);

      // Success
      state = productReducer(state, fetchProductsSuccess([{ id: '1' }]));
      expect(state.loading).toBe(false);
      expect(state.error).toBe(null);
      expect(state.products).toHaveLength(1);
    });
  });
});
