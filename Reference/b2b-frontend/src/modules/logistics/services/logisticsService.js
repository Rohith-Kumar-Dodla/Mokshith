import { simulateApi } from '../../../mocks/mockApi.js';
import { mockLogisticsQueue, mockLogisticsHistory } from '../../../mocks/data/index.js';

let queueStore = [...mockLogisticsQueue];
let historyStore = [...mockLogisticsHistory];

export const logisticsService = {
  async getDeliveryQueue() {
    return simulateApi(() => [...queueStore]);
  },

  async getAdminQueue() {
    return simulateApi(() => ({
      pending: queueStore.filter((d) => d.status === 'PENDING'),
      assigned: queueStore.filter((d) => ['ACCEPTED', 'OUT_FOR_DELIVERY'].includes(d.status)),
      all: [...queueStore],
    }));
  },

  async acceptDelivery(id) {
    return simulateApi(() => {
      const index = queueStore.findIndex((d) => d._id === id);
      if (index === -1) throw new Error('Delivery not found');
      queueStore[index] = { ...queueStore[index], status: 'ACCEPTED' };
      return queueStore[index];
    });
  },

  async startDelivery(id) {
    return simulateApi(() => {
      const index = queueStore.findIndex((d) => d._id === id);
      if (index === -1) throw new Error('Delivery not found');
      queueStore[index] = { ...queueStore[index], status: 'OUT_FOR_DELIVERY' };
      return queueStore[index];
    });
  },

  async markDelivered(id, data = {}) {
    return simulateApi(() => {
      const index = queueStore.findIndex((d) => d._id === id);
      if (index === -1) throw new Error('Delivery not found');
      const delivered = { ...queueStore[index], status: 'DELIVERED', deliveredAt: new Date().toISOString(), ...data };
      historyStore.unshift(delivered);
      queueStore = queueStore.filter((d) => d._id !== id);
      return delivered;
    });
  },

  async updateLocation(id, location) {
    return simulateApi(() => {
      const index = queueStore.findIndex((d) => d._id === id);
      if (index === -1) throw new Error('Delivery not found');
      queueStore[index] = { ...queueStore[index], currentLocation: location };
      return queueStore[index];
    });
  },

  async getDeliveryHistory() {
    return simulateApi(() => [...historyStore]);
  },
};
