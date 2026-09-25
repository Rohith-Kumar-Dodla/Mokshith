import api from './api';

const warehouseService = {
  list: async () => (await api.get('/warehouses')).data,
  update: async (id, payload) => (await api.put(`/warehouses/${id}`, payload)).data,
};

export default warehouseService;
