import { simulateApi, generateId } from '../../../mocks/mockApi.js';
import { mockPromotions } from '../../../mocks/data/index.js';

let promotionStore = [...mockPromotions];

export const promotionService = {
  async getPromotions() {
    return simulateApi(() => [...promotionStore]);
  },

  async createPromotion(data) {
    return simulateApi(() => {
      if (!data.code || !data.value) throw new Error('Code and value are required');
      const promotion = { _id: generateId('promo'), ...data, isActive: data.isActive ?? true, createdAt: new Date().toISOString() };
      promotionStore.push(promotion);
      return promotion;
    });
  },

  async updatePromotion(id, data) {
    return simulateApi(() => {
      const index = promotionStore.findIndex((p) => p._id === id);
      if (index === -1) throw new Error('Promotion not found');
      promotionStore[index] = { ...promotionStore[index], ...data, updatedAt: new Date().toISOString() };
      return promotionStore[index];
    });
  },

  async deletePromotion(id) {
    return simulateApi(() => {
      promotionStore = promotionStore.filter((p) => p._id !== id);
      return { success: true };
    });
  },

  async togglePromotionStatus(id) {
    return simulateApi(() => {
      const index = promotionStore.findIndex((p) => p._id === id);
      if (index === -1) throw new Error('Promotion not found');
      promotionStore[index] = { ...promotionStore[index], isActive: !promotionStore[index].isActive };
      return promotionStore[index];
    });
  },
};
