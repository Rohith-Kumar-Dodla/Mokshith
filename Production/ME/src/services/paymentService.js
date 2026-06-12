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

  getBankTransferDetails: async () => {
    const response = await api.get('/payments/bank-transfer/bank-details');
    return response.data;
  },

  uploadBankTransferProof: async (formData) => {
    const response = await api.post('/payments/bank-transfer/upload', formData);
    return response.data;
  },

  getPendingBankTransfers: async () => {
    const response = await api.get('/payments/bank-transfer/pending');
    return response.data;
  },

  approveBankTransfer: async (proofId) => {
    const response = await api.patch(`/payments/bank-transfer/${proofId}/approve`);
    return response.data;
  },

  rejectBankTransfer: async (proofId, reason) => {
    const response = await api.patch(`/payments/bank-transfer/${proofId}/reject`, { reason });
    return response.data;
  },

  getBankTransferByOrder: async (orderId) => {
    const response = await api.get(`/payments/bank-transfer/order/${orderId}`);
    return response.data;
  },
};

export default paymentService;
