import api from './api';

const unwrap = (response) => response?.data?.data ?? response?.data ?? response;
const cleanParams = (params = {}) => Object.fromEntries(
  Object.entries(params).filter(([, value]) => value !== undefined && value !== null && value !== ''),
);
export default {
  listQueue: async (params = {}) => unwrap(await api.get('/supplier-allocations', { params: cleanParams(params) })),
  getMetrics: async () => unwrap(await api.get('/supplier-allocations/metrics')),
  getForOrder: async (orderId) => unwrap(await api.get(`/supplier-allocations/order/${orderId}`)),
  allocate: async (payload) => unwrap(await api.post('/supplier-allocations', payload)),
  createRequests: async (customerOrderId) => unwrap(await api.post('/supplier-allocations/requests', { customerOrderId })),
  sendWhatsApp: async (id) => unwrap(await api.post(`/supplier-orders/${id}/send-whatsapp`)),
  markWhatsAppOpened: async (id) => unwrap(await api.post(`/supplier-orders/${id}/whatsapp-opened`)),
};
