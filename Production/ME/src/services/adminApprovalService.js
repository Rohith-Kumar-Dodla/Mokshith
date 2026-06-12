import api from './api';

const adminApprovalService = {
  getAll: async () => {
    const response = await api.get('/admin-approvals');
    return response.data;
  },

  getPending: async () => {
    const response = await api.get('/admin-approvals/pending');
    return response.data;
  },

  approve: async (id) => {
    const response = await api.patch(`/admin-approvals/${id}/approve`);
    return response.data;
  },

  reject: async (id) => {
    const response = await api.patch(`/admin-approvals/${id}/reject`);
    return response.data;
  },
};

export default adminApprovalService;
