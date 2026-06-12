import api from './api';

const superAdminService = {
  getStats: async () => {
    const response = await api.get('/super-admin/stats');
    return response.data;
  },

  getMetrics: async () => {
    const response = await api.get('/super-admin/metrics');
    return response.data;
  },

  getAuditLogs: async (params = {}) => {
    const response = await api.get('/super-admin/audit-logs', { params });
    return response.data;
  },

  getUsers: async () => {
    const response = await api.get('/super-admin/users');
    return response.data;
  },
};

export default superAdminService;
