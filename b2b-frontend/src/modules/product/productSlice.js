import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  products: [],
  pagination: null,
  selectedProduct: null,
  loading: false,
  error: null,
};

const productSlice = createSlice({
  name: 'product',
  initialState,
  reducers: {
    fetchStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    fetchProductsSuccess: (state, action) => {
      state.loading = false;
      
      // Handle null/undefined payload
      if (!action.payload) {
        state.products = [];
        state.pagination = null;
        return;
      }
      
      const payloadData = action.payload.data || action.payload;
      
      if (Array.isArray(payloadData)) {
        state.products = payloadData;
        state.pagination = null;
      } else if (payloadData && typeof payloadData === 'object') {
        state.products = payloadData.products || [];
        state.pagination = payloadData.pagination || null;
      } else {
        state.products = [];
        state.pagination = null;
      }
    },
    fetchProductDetailSuccess: (state, action) => {
      state.loading = false;
      state.selectedProduct = action.payload;
    },
    fetchFailure: (state, action) => {
      state.loading = false;
      state.error = action.payload;
    },
  },
});

export const { fetchStart, fetchProductsSuccess, fetchProductDetailSuccess, fetchFailure } = productSlice.actions;
export default productSlice.reducer;
