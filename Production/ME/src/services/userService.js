import api from './api';

const userService = {
  getAllUsers: async (params = {}) => {
    const response = await api.get('/users', { params });
    return response.data;
  },

  getUserById: async (userId) => {
    const response = await api.get(`/users/${userId}`);
    return response.data;
  },

  deleteUser: async (userId) => {
    const response = await api.delete(`/users/${userId}`);
    return response.data;
  },

  getUsersByRole: async (role, params = {}) => {
    const response = await api.get('/admin/users', { params: { ...params, role } });
    return response.data;
  },
};

export default userService;
