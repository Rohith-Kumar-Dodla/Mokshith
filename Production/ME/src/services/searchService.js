import api from './api';
import { mapBackendProducts } from '../utils/productMapper';

const searchService = {
  searchProducts: async (query, params = {}) => {
    const response = await api.get('/search', {
      params: { q: query, ...params },
    });
    const payload = response.data?.data ?? response.data ?? [];
    const products = Array.isArray(payload) ? payload : payload.products ?? [];

    return {
      products: mapBackendProducts(products),
      pagination: payload.pagination ?? null,
    };
  },
};

export default searchService;
