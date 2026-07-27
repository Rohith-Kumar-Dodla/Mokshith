import api from './api';

const unwrap = (response) => response?.data ?? response;

const superAdminService = {
  getStats: async () => {
    const response = await api.get('/super-admin/stats');
    return unwrap(response);
  },

  getMetrics: async () => {
    const response = await api.get('/super-admin/metrics');
    return unwrap(response);
  },

  getAuditLogs: async (params = {}) => {
    const response = await api.get('/super-admin/audit-logs', { params });
    return unwrap(response);
  },

  getUsers: async () => {
    const response = await api.get('/super-admin/users');
    return unwrap(response);
  },

  getAdmins: async (params = {}) => {
    const response = await api.get('/super-admin/admins', { params });
    return unwrap(response);
  },

  createAdmin: async (payload) => {
    const response = await api.post('/super-admin/admins', payload);
    return unwrap(response);
  },

  updateAdmin: async (id, payload) => {
    const response = await api.patch(`/super-admin/admins/${id}`, payload);
    return unwrap(response);
  },

  deleteAdmin: async (id) => {
    const response = await api.delete(`/super-admin/admins/${id}`);
    return unwrap(response);
  },

  getDeliveryAgents: async (params = {}) => {
    const response = await api.get('/super-admin/delivery-agents', { params });
    return unwrap(response);
  },

  createDeliveryAgent: async (payload) => {
    const response = await api.post('/super-admin/delivery-agents', payload);
    return unwrap(response);
  },

  updateDeliveryAgent: async (id, payload) => {
    const response = await api.patch(`/super-admin/delivery-agents/${id}`, payload);
    return unwrap(response);
  },

  deleteDeliveryAgent: async (id) => {
    const response = await api.delete(`/super-admin/delivery-agents/${id}`);
    return unwrap(response);
  },

  getConfig: async () => {
    const response = await api.get('/super-admin/config');
    return unwrap(response);
  },

  updateConfig: async (payload) => {
    const response = await api.post('/super-admin/config', payload);
    return unwrap(response);
  },
};

export default superAdminService;
