import { simulateApi } from '../../../mocks/mockApi.js';
import { mockHealthData, mockMetricsData, mockAlerts, mockBusinessMetrics } from '../../../mocks/data/index.js';

export const monitoringService = {
  async getHealth() {
    return simulateApi(() => ({ ...mockHealthData }));
  },

  async getMetrics() {
    return simulateApi(() => ({
      success: true,
      metrics: { ...mockMetricsData },
      alerts: [...mockAlerts],
      alertCount: mockAlerts.length,
    }));
  },

  async getBusinessMetrics() {
    return simulateApi(() => ({ ...mockBusinessMetrics }));
  },
};
