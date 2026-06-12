import api from './api';

const invoiceService = {
  getInvoices: async () => {
    const response = await api.get('/invoices');
    return response.data;
  },

  getInvoiceByOrderId: async (orderId) => {
    const response = await api.get(`/invoices/${orderId}`);
    return response.data;
  },

  generateInvoice: async (orderId) => {
    const response = await api.post(`/invoices/${orderId}`);
    return response.data;
  },
};

export default invoiceService;
