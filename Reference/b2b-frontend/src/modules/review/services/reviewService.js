import { simulateApi } from '../../../mocks/mockApi.js';
import { mockReviews } from '../../../mocks/data/index.js';

let reviewStore = [...mockReviews];

export const reviewService = {
  async getReviews(productId) {
    return simulateApi(() => {
      if (productId) return reviewStore.filter((r) => r.productId === productId);
      return [...reviewStore];
    });
  },

  async getVendorReviews() {
    return simulateApi(() => [...reviewStore]);
  },

  async getRatingSummary(productId) {
    const reviews = productId
      ? reviewStore.filter((r) => r.productId === productId)
      : reviewStore;
    const total = reviews.length;
    const avg = total ? reviews.reduce((s, r) => s + r.rating, 0) / total : 0;
    const distribution = [5, 4, 3, 2, 1].map((star) => ({
      star,
      count: reviews.filter((r) => r.rating === star).length,
      percent: total ? Math.round((reviews.filter((r) => r.rating === star).length / total) * 100) : 0,
    }));
    return simulateApi(() => ({ average: Math.round(avg * 10) / 10, total, distribution }));
  },

  async addReview(payload) {
    return simulateApi(() => {
      if (!payload.rating || payload.rating < 1 || payload.rating > 5) {
        throw new Error('Rating must be between 1 and 5');
      }
      const review = {
        _id: `rev-${Date.now()}`,
        userId: { _id: 'current-user', name: 'Current User' },
        ...payload,
        createdAt: new Date().toISOString(),
      };
      reviewStore.unshift(review);
      return review;
    });
  },
};
