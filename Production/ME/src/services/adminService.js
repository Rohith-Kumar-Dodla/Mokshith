import api from './api';

const adminService = {
  getStats: async () => {
    const response = await api.get('/admin/stats');
    return response.data;
  },

  getUsers: async (params = {}) => {
    const response = await api.get('/admin/users', { params });
    return response.data;
  },

  updateUserStatus: async (userId, status) => {
    const response = await api.patch(`/admin/users/${userId}`, { status });
    return response.data;
  },

  approveUser: async (userId) => {
    const response = await api.post(`/admin/approve/${userId}`);
    return response.data;
  },

  rejectUser: async (userId) => {
    const response = await api.post(`/admin/reject/${userId}`);
    return response.data;
  },
};

export default adminService;
