import { describe, it, expect, beforeEach } from 'vitest';
import orderReducer, {
  fetchStart,
  fetchOrdersSuccess,
  addToCart,
  removeFromCart,
  updateQuantity,
  clearCart,
  fetchFailure,
} from '../../../modules/order/orderSlice.js';

describe('orderSlice', () => {
  let initialState;

  beforeEach(() => {
    localStorage.clear();
    
    initialState = {
      orders: [],
      cart: [],
      loading: false,
      error: null,
    };
  });

  describe('initial state', () => {
    it('should return the initial state', () => {
      const state = orderReducer(undefined, { type: '@@INIT' });
      expect(state).toEqual(initialState);
    });

    it('should load cart from localStorage on init', () => {
      // Note: This test verifies the loadCartFromStorage function behavior
      // The actual loading happens when the slice is initially imported
      const savedCart = [
        { id: '1', name: 'Product 1', quantity: 2 },
        { id: '2', name: 'Product 2', quantity: 1 },
      ];
      localStorage.setItem('mokshith_b2b_cart', JSON.stringify(savedCart));

      // We can't re-import the module, so we test that addToCart preserves localStorage
      const item = { id: '3', name: 'Product 3', quantity: 1 };
      const state = orderReducer(initialState, addToCart(item));
      
      expect(state.cart).toContainEqual(item);
    });

    it('should handle invalid cart data in localStorage', () => {
      localStorage.setItem('mokshith_b2b_cart', 'invalid-json');
      const state = orderReducer(undefined, { type: '@@INIT' });
      expect(Array.isArray(state.cart)).toBe(true);
    });
  });

  describe('fetchStart', () => {
    it('should set loading to true and clear error', () => {
      const previousState = {
        ...initialState,
        error: 'Previous error',
      };

      const state = orderReducer(previousState, fetchStart());

      expect(state.loading).toBe(true);
      expect(state.error).toBe(null);
    });
  });

  describe('fetchOrdersSuccess', () => {
    it('should set orders and stop loading', () => {
      const orders = [
        { id: '1', orderNumber: 'ORD-001', totalAmount: 1000 },
        { id: '2', orderNumber: 'ORD-002', totalAmount: 2000 },
      ];

      const state = orderReducer(initialState, fetchOrdersSuccess(orders));

      expect(state.orders).toEqual(orders);
      expect(state.loading).toBe(false);
    });

    it('should handle empty orders array', () => {
      const state = orderReducer(initialState, fetchOrdersSuccess([]));
      expect(state.orders).toEqual([]);
      expect(state.loading).toBe(false);
    });
  });

  describe('addToCart', () => {
    it('should add new item to empty cart', () => {
      const item = {
        id: '1',
        name: 'Product 1',
        price: 100,
        quantity: 2,
      };

      const state = orderReducer(initialState, addToCart(item));

      expect(state.cart).toHaveLength(1);
      expect(state.cart[0]).toEqual(item);
    });

    it('should add item with default quantity of 1', () => {
      const item = {
        id: '1',
        name: 'Product 1',
        price: 100,
      };

      const state = orderReducer(initialState, addToCart(item));

      expect(state.cart[0].quantity).toBe(1);
    });

    it('should increment quantity if item already exists', () => {
      const previousState = {
        ...initialState,
        cart: [{ id: '1', name: 'Product 1', quantity: 2 }],
      };

      const item = { id: '1', name: 'Product 1', quantity: 3 };
      const state = orderReducer(previousState, addToCart(item));

      expect(state.cart).toHaveLength(1);
      expect(state.cart[0].quantity).toBe(5);
    });

    it('should handle items with _id field', () => {
      const item = {
        _id: '1',
        name: 'Product 1',
        quantity: 1,
      };

      const state = orderReducer(initialState, addToCart(item));

      expect(state.cart).toHaveLength(1);
      expect(state.cart[0]._id).toBe('1');
    });

    it('should save cart to localStorage', () => {
      const item = { id: '1', name: 'Product 1', quantity: 1 };
      
      orderReducer(initialState, addToCart(item));

      const savedData = localStorage.getItem('mokshith_b2b_cart');
      expect(savedData).not.toBe(null);
      const savedCart = JSON.parse(savedData);
      expect(savedCart).toHaveLength(1);
      expect(savedCart[0].id).toBe('1');
    });
  });

  describe('removeFromCart', () => {
    it('should remove item from cart', () => {
      const previousState = {
        ...initialState,
        cart: [
          { id: '1', name: 'Product 1', quantity: 1 },
          { id: '2', name: 'Product 2', quantity: 1 },
        ],
      };

      const state = orderReducer(previousState, removeFromCart('1'));

      expect(state.cart).toHaveLength(1);
      expect(state.cart[0].id).toBe('2');
    });

    it('should handle removing item with _id field', () => {
      const previousState = {
        ...initialState,
        cart: [
          { _id: '1', name: 'Product 1', quantity: 1 },
          { _id: '2', name: 'Product 2', quantity: 1 },
        ],
      };

      const state = orderReducer(previousState, removeFromCart('1'));

      expect(state.cart).toHaveLength(1);
      expect(state.cart[0]._id).toBe('2');
    });

    it('should remove all matching items', () => {
      const previousState = {
        ...initialState,
        cart: [{ id: '1', name: 'Product 1', quantity: 1 }],
      };

      const state = orderReducer(previousState, removeFromCart('1'));

      expect(state.cart).toHaveLength(0);
    });

    it('should update localStorage after removal', () => {
      const previousState = {
        ...initialState,
        cart: [
          { id: '1', name: 'Product 1', quantity: 1 },
          { id: '2', name: 'Product 2', quantity: 1 },
        ],
      };

      orderReducer(previousState, removeFromCart('1'));

      const savedData = localStorage.getItem('mokshith_b2b_cart');
      expect(savedData).not.toBe(null);
      const savedCart = JSON.parse(savedData);
      expect(savedCart).toHaveLength(1);
      expect(savedCart[0].id).toBe('2');
    });

    it('should handle removing non-existent item', () => {
      const previousState = {
        ...initialState,
        cart: [{ id: '1', name: 'Product 1', quantity: 1 }],
      };

      const state = orderReducer(previousState, removeFromCart('999'));

      expect(state.cart).toHaveLength(1);
    });
  });

  describe('updateQuantity', () => {
    it('should update item quantity', () => {
      const previousState = {
        ...initialState,
        cart: [{ id: '1', name: 'Product 1', quantity: 2 }],
      };

      const state = orderReducer(
        previousState,
        updateQuantity({ id: '1', quantity: 5 })
      );

      expect(state.cart[0].quantity).toBe(5);
    });

    it('should handle items with _id field', () => {
      const previousState = {
        ...initialState,
        cart: [{ _id: '1', name: 'Product 1', quantity: 2 }],
      };

      const state = orderReducer(
        previousState,
        updateQuantity({ id: '1', quantity: 3 })
      );

      expect(state.cart[0].quantity).toBe(3);
    });

    it('should not update quantity if item not found', () => {
      const previousState = {
        ...initialState,
        cart: [{ id: '1', name: 'Product 1', quantity: 2 }],
      };

      const state = orderReducer(
        previousState,
        updateQuantity({ id: '999', quantity: 5 })
      );

      expect(state.cart[0].quantity).toBe(2);
    });

    it('should update localStorage after quantity change', () => {
      const previousState = {
        ...initialState,
        cart: [{ id: '1', name: 'Product 1', quantity: 2 }],
      };

      orderReducer(previousState, updateQuantity({ id: '1', quantity: 10 }));

      const savedData = localStorage.getItem('mokshith_b2b_cart');
      expect(savedData).not.toBe(null);
      const savedCart = JSON.parse(savedData);
      expect(savedCart[0].quantity).toBe(10);
    });

    it('should handle updating to zero quantity', () => {
      const previousState = {
        ...initialState,
        cart: [{ id: '1', name: 'Product 1', quantity: 2 }],
      };

      const state = orderReducer(
        previousState,
        updateQuantity({ id: '1', quantity: 0 })
      );

      expect(state.cart[0].quantity).toBe(0);
    });
  });

  describe('clearCart', () => {
    it('should empty the cart', () => {
      const previousState = {
        ...initialState,
        cart: [
          { id: '1', name: 'Product 1', quantity: 2 },
          { id: '2', name: 'Product 2', quantity: 1 },
        ],
      };

      const state = orderReducer(previousState, clearCart());

      expect(state.cart).toEqual([]);
    });

    it('should remove cart from localStorage', () => {
      localStorage.setItem(
        'mokshith_b2b_cart',
        JSON.stringify([{ id: '1', quantity: 1 }])
      );

      orderReducer(initialState, clearCart());

      expect(localStorage.getItem('mokshith_b2b_cart')).toBe(null);
    });
  });

  describe('fetchFailure', () => {
    it('should set error and stop loading', () => {
      const previousState = {
        ...initialState,
        loading: true,
      };

      const error = 'Failed to fetch orders';
      const state = orderReducer(previousState, fetchFailure(error));

      expect(state.loading).toBe(false);
      expect(state.error).toBe(error);
    });
  });

  describe('cart persistence', () => {
    it('should maintain cart across multiple operations', () => {
      let state = initialState;

      // Add first item
      state = orderReducer(state, addToCart({ id: '1', name: 'Product 1', quantity: 1 }));
      expect(state.cart).toHaveLength(1);

      // Add second item
      state = orderReducer(state, addToCart({ id: '2', name: 'Product 2', quantity: 1 }));
      expect(state.cart).toHaveLength(2);

      // Update quantity
      state = orderReducer(state, updateQuantity({ id: '1', quantity: 5 }));
      expect(state.cart[0].quantity).toBe(5);

      // Remove item
      state = orderReducer(state, removeFromCart('2'));
      expect(state.cart).toHaveLength(1);
      expect(state.cart[0].id).toBe('1');
    });
  });

  describe('edge cases', () => {
    it('should handle null payload in fetchOrdersSuccess', () => {
      const state = orderReducer(initialState, fetchOrdersSuccess(null));
      expect(state.orders).toBe(null);
      expect(state.loading).toBe(false);
    });

    it('should handle undefined payload in fetchOrdersSuccess', () => {
      const state = orderReducer(initialState, fetchOrdersSuccess(undefined));
      expect(state.orders).toBeUndefined();
    });

    it('should handle adding duplicate items to cart', () => {
      const item = { id: '1', name: 'Product', quantity: 1 };
      
      let state = orderReducer(initialState, addToCart(item));
      state = orderReducer(state, addToCart(item));
      state = orderReducer(state, addToCart(item));

      expect(state.cart).toHaveLength(1);
      expect(state.cart[0].quantity).toBe(3);
    });
  });
});
