import api from './api';

// Order service for order management API calls
const orderService = {
  // Get all orders
  getAllOrders: async (params = {}) => {
    const response = await api.get('/orders', { params });
    return response.data;
  },

  // Get order by ID
  getOrderById: async (orderId) => {
    const response = await api.get(`/orders/${orderId}`);
    return response.data;
  },

  // Create new order
  createOrder: async (orderData) => {
    const response = await api.post('/orders', orderData);
    return response.data;
  },

  // Update order
  updateOrder: async (orderId, orderData) => {
    const response = await api.put(`/orders/${orderId}`, orderData);
    return response.data;
  },

  // Delete order
  deleteOrder: async (orderId) => {
    const response = await api.delete(`/orders/${orderId}`);
    return response.data;
  },

  // Get orders by vendor
  getOrdersByVendor: async (vendorId) => {
    const response = await api.get(`/orders/vendor/${vendorId}`);
    return response.data;
  },

  // Get orders by admin area
  getOrdersByArea: async (areaId) => {
    const response = await api.get(`/orders/area/${areaId}`);
    return response.data;
  },

  // Update order status
  updateOrderStatus: async (orderId, statusData) => {
    const response = await api.patch(`/orders/${orderId}/status`, statusData);
    return response.data;
  },
};

export default orderService;
