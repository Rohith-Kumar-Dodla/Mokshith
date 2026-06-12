import api from './api';

const inventoryService = {
  getInventory: async () => {
    const response = await api.get('/inventory');
    return response.data;
  },

  getLowStockItems: async () => {
    const response = await api.get('/inventory/low-stock');
    return response.data;
  },

  getInventoryStats: async () => {
    const response = await api.get('/inventory/stats');
    return response.data;
  },

  updateStock: async (payload) => {
    const response = await api.patch('/inventory/update', payload);
    return response.data;
  },

  addStock: async (payload) => {
    const response = await api.post('/inventory', payload);
    return response.data;
  },
};

export default inventoryService;
