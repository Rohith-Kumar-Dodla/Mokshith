import { combineReducers } from '@reduxjs/toolkit';
import authReducer from '../modules/auth/authSlice.js';
import adminReducer from '../modules/admin/adminSlice.js';
import superAdminReducer from '../modules/superadmin/superAdminSlice.js';
import productReducer from '../modules/product/productSlice.js';
import orderReducer from '../modules/order/orderSlice.js';

const rootReducer = combineReducers({
  auth: authReducer,
  admin: adminReducer,
  superAdmin: superAdminReducer,
  product: productReducer,
  order: orderReducer,
});

export default rootReducer;
