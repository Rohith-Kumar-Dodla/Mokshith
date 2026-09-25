import api from './api';

const promotionService = {
  getAll: async () => (await api.get('/promotions')).data,
  create: async (payload) => (await api.post('/promotions', payload)).data,
  update: async (id, payload) => (await api.put(`/promotions/${id}`, payload)).data,
  toggle: async (id) => (await api.patch(`/promotions/${id}/toggle`)).data,
  remove: async (id) => (await api.delete(`/promotions/${id}`)).data,
};

export default promotionService;
