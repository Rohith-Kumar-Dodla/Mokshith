import api from './api';

const paymentService = {
  createRazorpayOrder: async (amount) => {
    const response = await api.post('/payments/create-order', { amount });
    return response.data;
  },

  initiatePayment: async (orderId) => {
    const response = await api.post(`/payments/initiate/${orderId}`);
    return response.data;
  },

  verifyPayment: async (payload) => {
    const response = await api.post('/payments/verify', payload);
    return response.data;
  },

  failPayment: async (orderId, reason) => {
    const response = await api.post('/payments/fail', { orderId, reason });
    return response.data;
  },

  hybridPayment: async (payload) => {
    const response = await api.post('/payments/hybrid', payload);
    return response.data;
  },
};

export default paymentService;
