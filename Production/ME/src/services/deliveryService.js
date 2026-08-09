import api from './api';

const deliveryService = {
  getMyAssignments: async () => {
    const response = await api.get('/logistics/my-assignments');
    return response.data;
  },

  getDeliveryQueue: async () => {
    const response = await api.get('/logistics/delivery-queue');
    return response.data;
  },

  getDeliveryHistory: async () => {
    const response = await api.get('/logistics/history');
    return response.data;
  },

  getDeliveryAnalytics: async () => {
    const response = await api.get('/logistics/analytics');
    return response.data;
  },

  createShipment: async (orderId) => {
    const response = await api.post(`/logistics/${orderId}`);
    return response.data;
  },

  assignDeliveryPartner: async (shipmentId, deliveryPartnerId) => {
    const response = await api.patch(`/logistics/${shipmentId}/assign`, { deliveryPartnerId });
    return response.data;
  },

  reassignDeliveryPartner: async (shipmentId, deliveryPartnerId) => {
    const response = await api.patch(`/logistics/${shipmentId}/reassign`, { deliveryPartnerId });
    return response.data;
  },

  getShipmentDetails: async (shipmentId) => {
    const response = await api.get(`/logistics/${shipmentId}`);
    return response.data;
  },

  acceptDelivery: async (shipmentId) => {
    const response = await api.post(`/logistics/${shipmentId}/accept`);
    return response.data;
  },

  rejectAssignment: async (shipmentId, payload = {}) => {
    const response = await api.post(`/logistics/${shipmentId}/reject`, payload);
    return response.data;
  },

  pickUpDelivery: async (shipmentId) => {
    const response = await api.post(`/logistics/${shipmentId}/pick`);
    return response.data;
  },

  startDelivery: async (shipmentId) => {
    const response = await api.post(`/logistics/${shipmentId}/start`);
    return response.data;
  },

  markAsDelivered: async (shipmentId) => {
    const response = await api.post(`/logistics/${shipmentId}/delivered`);
    return response.data;
  },

  collectCodPayment: async (shipmentId, payload) => {
    const response = await api.post(`/logistics/${shipmentId}/collect-payment`, payload);
    return response.data;
  },

  completeDelivery: async (shipmentId, payload = {}) => {
    const response = await api.post(`/logistics/${shipmentId}/complete`, payload);
    return response.data;
  },

  updateLocation: async (shipmentId, locationData) => {
    const response = await api.post(`/logistics/${shipmentId}/location`, locationData);
    return response.data;
  },

  getNotifications: async () => {
    const response = await api.get('/notifications');
    return response.data;
  },

  markNotificationRead: async (notificationId) => {
    const response = await api.patch(`/notifications/${notificationId}/read`);
    return response.data;
  },

  getProfile: async () => {
    const response = await api.get('/users/me');
    return response.data;
  },

  updateProfile: async (profileData) => {
    const response = await api.put('/users/me', profileData);
    return response.data;
  },
};

export default deliveryService;
