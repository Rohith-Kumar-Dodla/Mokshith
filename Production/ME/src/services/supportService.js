import api from './api';

const unwrap = (response) => response?.data?.data ?? response?.data ?? response;

const supportService = {
  getContactInfo: async () => {
    const response = await api.get('/support/contact');
    return unwrap(response);
  },

  createTicket: async (payload) => {
    const response = await api.post('/support', payload);
    return unwrap(response);
  },

  getMyTickets: async () => {
    const response = await api.get('/support/my-tickets');
    return unwrap(response);
  },

  getAllTickets: async (params = {}) => {
    const response = await api.get('/support/all', { params });
    return unwrap(response);
  },

  getTicketById: async (id) => {
    const response = await api.get(`/support/${id}`);
    return unwrap(response);
  },

  replyToTicket: async (id, payload) => {
    const response = await api.post(`/support/${id}/reply`, payload);
    return unwrap(response);
  },

  updateTicketStatus: async (id, payload) => {
    const response = await api.patch(`/support/${id}/status`, payload);
    return unwrap(response);
  },
};

export default supportService;
