import api from './api';

const pricingService = {
  calculatePrice: async ({ price, quantity, productId }) => {
    const response = await api.post('/pricing', { price, quantity, productId });
    return response.data;
  },
};

export default pricingService;
