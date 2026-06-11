import { simulateApi } from '../../../mocks/mockApi.js';
import { mockShipments } from '../../../mocks/data/index.js';

let shipmentStore = [...mockShipments];

export const shipmentService = {
  async getShipmentDetails(id) {
    return simulateApi(() => {
      const shipment = shipmentStore.find((s) => s._id === id);
      if (!shipment) throw new Error('Shipment not found');
      return shipment;
    });
  },

  async updateShipmentStatus(id, data) {
    return simulateApi(() => {
      const index = shipmentStore.findIndex((s) => s._id === id);
      if (index === -1) throw new Error('Shipment not found');
      shipmentStore[index] = { ...shipmentStore[index], status: data.status, updatedAt: new Date().toISOString() };
      return shipmentStore[index];
    });
  },

  async getShipmentHistory(orderId) {
    return simulateApi(() => shipmentStore.filter((s) => s.orderId === orderId));
  },
};
