import api from './api';

const supplierOrderService = {
  getEligibleForOrder: async (orderId) => (await api.get(`/supplier-orders/eligible-for-order/${orderId}`)).data,
  listForOrder: async (orderId) => (await api.get(`/supplier-orders/order/${orderId}`)).data,
  create: async (payload) => (await api.post('/supplier-orders', payload)).data,
  generateWhatsApp: async (id) => (await api.post(`/supplier-orders/${id}/send-whatsapp`)).data,
  markWhatsAppOpened: async (id) => (await api.post(`/supplier-orders/${id}/whatsapp-opened`)).data,
  transition: async (id, status, reason) => (await api.post(`/supplier-orders/${id}/status`, { status, reason })).data,
};

export default supplierOrderService;
