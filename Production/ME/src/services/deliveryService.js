import api from './api';

// Delivery service for delivery partner API calls
const deliveryService = {
  // Get assigned orders for delivery partner
  getAssignedOrders: async (partnerId, params = {}) => {
    const response = await api.get(`/delivery-partners/${partnerId}/assigned-orders`, { params });
    return response.data;
  },

  // Get order details
  getOrderDetails: async (orderId) => {
    const response = await api.get(`/orders/${orderId}`);
    return response.data;
  },

  // Accept order
  acceptOrder: async (orderId) => {
    const response = await api.post(`/orders/${orderId}/accept`);
    return response.data;
  },

  // Reject order
  rejectOrder: async (orderId, reason) => {
    const response = await api.post(`/orders/${orderId}/reject`, { reason });
    return response.data;
  },

  // Update delivery status
  updateDeliveryStatus: async (orderId, status, data = {}) => {
    const response = await api.patch(`/orders/${orderId}/status`, { status, ...data });
    return response.data;
  },

  // Upload delivery proof
  uploadDeliveryProof: async (orderId, proofData) => {
    const response = await api.post(`/orders/${orderId}/delivery-proof`, proofData);
    return response.data;
  },

  // Get delivery history
  getDeliveryHistory: async (partnerId, params = {}) => {
    const response = await api.get(`/delivery-partners/${partnerId}/history`, { params });
    return response.data;
  },

  // Get earnings
  getEarnings: async (partnerId, params = {}) => {
    const response = await api.get(`/delivery-partners/${partnerId}/earnings`, { params });
    return response.data;
  },

  // Get performance metrics
  getPerformanceMetrics: async (partnerId) => {
    const response = await api.get(`/delivery-partners/${partnerId}/performance`);
    return response.data;
  },

  // Get performance trends
  getPerformanceTrends: async (partnerId, params = {}) => {
    const response = await api.get(`/delivery-partners/${partnerId}/performance/trends`, { params });
    return response.data;
  },

  // Get achievements
  getAchievements: async (partnerId) => {
    const response = await api.get(`/delivery-partners/${partnerId}/achievements`);
    return response.data;
  },

  // Get delivery partner profile
  getProfile: async (partnerId) => {
    const response = await api.get(`/delivery-partners/${partnerId}/profile`);
    return response.data;
  },

  // Update delivery partner profile
  updateProfile: async (partnerId, profileData) => {
    const response = await api.put(`/delivery-partners/${partnerId}/profile`, profileData);
    return response.data;
  },

  // Update delivery partner settings
  updateSettings: async (partnerId, settingsData) => {
    const response = await api.put(`/delivery-partners/${partnerId}/settings`, settingsData);
    return response.data;
  },

  // Get notifications
  getNotifications: async (partnerId, params = {}) => {
    const response = await api.get(`/delivery-partners/${partnerId}/notifications`, { params });
    return response.data;
  },

  // Mark notification as read
  markNotificationRead: async (notificationId) => {
    const response = await api.patch(`/notifications/${notificationId}/read`);
    return response.data;
  },

  // Mark all notifications as read
  markAllNotificationsRead: async (partnerId) => {
    const response = await api.post(`/delivery-partners/${partnerId}/notifications/mark-all-read`);
    return response.data;
  },

  // Get optimized route
  getOptimizedRoute: async (orderIds) => {
    const response = await api.post('/delivery/route-optimize', { orderIds });
    return response.data;
  },

  // Update location
  updateLocation: async (partnerId, locationData) => {
    const response = await api.post(`/delivery-partners/${partnerId}/location`, locationData);
    return response.data;
  },

  // Go online/offline
  updateAvailability: async (partnerId, isOnline) => {
    const response = await api.patch(`/delivery-partners/${partnerId}/availability`, { isOnline });
    return response.data;
  },
};

export default deliveryService;
