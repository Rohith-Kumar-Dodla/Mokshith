import api from './api';

const creditService = {
  getCredit: async () => {
    const response = await api.get('/credit');
    return response.data;
  },

  getLedger: async () => {
    const response = await api.get('/credit/ledger');
    return response.data;
  },

  useCredit: async (orderId) => {
    const response = await api.post('/credit/use', { orderId });
    return response.data;
  },

  repayCredit: async (amount) => {
    const response = await api.post('/credit/repay', { amount });
    return response.data;
  },
};

export default creditService;
