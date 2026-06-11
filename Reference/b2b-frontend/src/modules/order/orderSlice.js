import { createSlice } from '@reduxjs/toolkit';

const CART_STORAGE_KEY = 'mokshith_b2b_cart';

const loadCartFromStorage = () => {
  try {
    const savedCart = localStorage.getItem(CART_STORAGE_KEY);
    return savedCart ? JSON.parse(savedCart) : [];
  } catch (err) {
    console.error('Error loading cart from storage:', err);
    return [];
  }
};

const saveCartToStorage = (cart) => {
  try {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
  } catch (err) {
    console.error('Error saving cart to storage:', err);
  }
};

const initialState = {
  orders: [],
  cart: loadCartFromStorage(),
  loading: false,
  error: null,
};

const orderSlice = createSlice({
  name: 'order',
  initialState,
  reducers: {
    fetchStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    fetchOrdersSuccess: (state, action) => {
      state.loading = false;
      state.orders = action.payload;
    },
    addToCart: (state, action) => {
      const item = action.payload;
      const itemId = item._id || item.id;
      const quantityToAdd = item.quantity || 1;
      const existingItem = state.cart.find((i) => (i._id || i.id) === itemId);
      
      if (existingItem) {
        existingItem.quantity += quantityToAdd;
      } else {
        state.cart.push({ ...item, quantity: quantityToAdd });
      }
      saveCartToStorage(state.cart);
    },
    removeFromCart: (state, action) => {
      state.cart = state.cart.filter((item) => (item._id || item.id) !== action.payload);
      saveCartToStorage(state.cart);
    },
    updateQuantity: (state, action) => {
      const { id, quantity } = action.payload;
      const item = state.cart.find((i) => (i._id || i.id) === id);
      if (item) {
        item.quantity = quantity;
      }
      saveCartToStorage(state.cart);
    },
    clearCart: (state) => {
      state.cart = [];
      localStorage.removeItem(CART_STORAGE_KEY);
    },
    fetchFailure: (state, action) => {
      state.loading = false;
      state.error = action.payload;
    },
  },
});

export const { fetchStart, fetchOrdersSuccess, addToCart, removeFromCart, updateQuantity, clearCart, fetchFailure } = orderSlice.actions;
export default orderSlice.reducer;
