import api from './api';

const authService = {
  login: async (credentials) => {
    const response = await api.post('/auth/login', credentials);
    return response.data;
  },

  logout: async (refreshToken) => {
    const response = await api.post('/auth/logout', { refreshToken });
    return response.data;
  },

  getCurrentUser: async () => {
    const response = await api.get('/users/me');
    return response.data;
  },

  refreshToken: async (refreshToken) => {
    const response = await api.post('/auth/refresh-token', { refreshToken });
    return response.data;
  },

  getCsrfToken: async () => {
    const response = await api.get('/auth/csrf-token');
    return response.data;
  },

  register: async (userData) => {
    const response = await api.post('/auth/register', userData);
    return response.data;
  },

  updateProfile: async (profileData) => {
    const response = await api.put('/users/me', profileData);
    return response.data;
  },

  uploadProfileImage: async (file) => {
    const formData = new FormData();
    formData.append('image', file);
    const response = await api.post('/users/profile-image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  changePassword: async ({ oldPassword, newPassword }) => {
    const response = await api.post('/auth/change-password', { oldPassword, newPassword });
    return response.data;
  },

  forgotPassword: async (identifier) => {
    const response = await api.post('/auth/forgot-password', { identifier });
    return response.data;
  },

  resetPassword: async (token, newPassword) => {
    const response = await api.post('/auth/reset-password', { token, newPassword });
    return response.data;
  },

  getSessions: async () => {
    const response = await api.get('/auth/sessions');
    return response.data;
  },

  revokeSession: async (tokenId) => {
    const response = await api.delete(`/auth/sessions/${tokenId}`);
    return response.data;
  },

  logoutAllDevices: async () => {
    const response = await api.post('/auth/logout-all');
    return response.data;
  },

  enable2FA: async () => {
    const response = await api.post('/auth/2fa/enable');
    return response.data;
  },

  verify2FASetup: async (code) => {
    const response = await api.post('/auth/2fa/verify-setup', { code });
    return response.data;
  },

  disable2FA: async (password) => {
    const response = await api.post('/auth/2fa/disable', { password });
    return response.data;
  },

  verify2FALogin: async ({ userId, code }) => {
    const response = await api.post('/auth/2fa/verify', { userId, code });
    return response.data;
  },
};

export default authService;
