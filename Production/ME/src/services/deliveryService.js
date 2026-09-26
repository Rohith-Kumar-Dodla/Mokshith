import api from './api';

const deliveryService = {
  getMyOffers: async () => {
    const response = await api.get('/logistics/my-offers');
    return response.data;
  },

  getOfferHistory: async (logisticsId) => {
    const response = await api.get(`/logistics/${logisticsId}/offers`);
    return response.data;
  },

  getDeliveryDistance: async (logisticsId) => {
    const response = await api.post(`/logistics/${logisticsId}/distance`);
    return response.data;
  },

  createDeliveryOffer: async (logisticsId, payload, requestId) => {
    const response = await api.post(`/logistics/${logisticsId}/offers`, payload, {
      headers: requestId ? { 'Idempotency-Key': requestId } : undefined,
    });
    return response.data;
  },

  acceptDeliveryOffer: async (logisticsId, offerId, requestId) => {
    const response = await api.post(`/logistics/${logisticsId}/offers/${offerId}/accept`, { requestId }, {
      headers: requestId ? { 'Idempotency-Key': requestId } : undefined,
    });
    return response.data;
  },

  rejectDeliveryOffer: async (logisticsId, offerId, payload, requestId) => {
    const response = await api.post(`/logistics/${logisticsId}/offers/${offerId}/reject`, { ...payload, requestId }, {
      headers: requestId ? { 'Idempotency-Key': requestId } : undefined,
    });
    return response.data;
  },

  increaseDeliveryOfferAmount: async (logisticsId, offerId, payload, requestId) => {
    const response = await api.post(`/logistics/${logisticsId}/offers/${offerId}/increase-amount`, payload, {
      headers: requestId ? { 'Idempotency-Key': requestId } : undefined,
    });
    return response.data;
  },

  getMyAssignments: async () => {
    const response = await api.get('/logistics/my-assignments');
    return response.data;
  },

  getDeliveryQueue: async () => {
    const response = await api.get('/logistics/delivery-queue');
    return response.data;
  },

  getDeliveryHistory: async (params) => {
    const response = await api.get('/logistics/history', params ? { params } : undefined);
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

  markAllNotificationsRead: async () => {
    const response = await api.patch('/notifications/read-all');
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
