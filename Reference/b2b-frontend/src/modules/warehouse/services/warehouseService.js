import { simulateApi, generateId } from '../../../mocks/mockApi.js';
import { mockWarehouses } from '../../../mocks/data/index.js';

let warehouseStore = [...mockWarehouses];

export const warehouseService = {
  async getWarehouses() {
    return simulateApi(() => [...warehouseStore]);
  },

  async createWarehouse(data) {
    return simulateApi(() => {
      const warehouse = {
        _id: generateId('wh'),
        ...data,
        city: data.location?.city || '',
        state: data.location?.state || '',
        isActive: true,
        currentLoad: 0,
        createdAt: new Date().toISOString(),
      };
      warehouseStore.push(warehouse);
      return warehouse;
    });
  },

  async updateWarehouse(id, data) {
    return simulateApi(() => {
      const index = warehouseStore.findIndex((w) => w._id === id);
      if (index === -1) throw new Error('Warehouse not found');
      warehouseStore[index] = {
        ...warehouseStore[index],
        ...data,
        city: data.location?.city || warehouseStore[index].city,
        state: data.location?.state || warehouseStore[index].state,
        updatedAt: new Date().toISOString(),
      };
      return warehouseStore[index];
    });
  },

  async deleteWarehouse(id) {
    return simulateApi(() => {
      warehouseStore = warehouseStore.filter((w) => w._id !== id);
      return { success: true };
    });
  },

  async getWarehouseStats(id) {
    return simulateApi(() => {
      const warehouse = warehouseStore.find((w) => w._id === id);
      if (!warehouse) throw new Error('Warehouse not found');
      return {
        capacity: warehouse.capacity,
        currentLoad: warehouse.currentLoad,
        utilization: Math.round((warehouse.currentLoad / warehouse.capacity) * 100),
        available: warehouse.capacity - warehouse.currentLoad,
      };
    });
  },
};
