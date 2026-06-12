import api from './api';

const pricingService = {
  calculatePrice: async ({ price, quantity }) => {
    const response = await api.post('/pricing', { price, quantity });
    return response.data;
  },
};

export default pricingService;
