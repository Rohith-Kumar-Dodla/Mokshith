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

  getSuppliers: async (params = {}) => {
    const response = await api.get('/super-admin/suppliers', { params });
    return unwrap(response);
  },

  getSupplier: async (id) => {
    const response = await api.get(`/super-admin/suppliers/${id}`);
    return unwrap(response);
  },

  createSupplier: async (payload) => {
    const response = await api.post('/super-admin/suppliers', payload);
    return unwrap(response);
  },

  updateSupplier: async (id, payload) => {
    const response = await api.patch(`/super-admin/suppliers/${id}`, payload);
    return unwrap(response);
  },

  updateSupplierStatus: async (id, status) => {
    const response = await api.patch(`/super-admin/suppliers/${id}/status`, { status });
    return unwrap(response);
  },

  getSupplierProducts: async (supplierId, params = {}) => {
    const response = await api.get(`/super-admin/suppliers/${supplierId}/products`, { params });
    return unwrap(response);
  },

  getSupplierProduct: async (supplierId, mappingId) => {
    const response = await api.get(`/super-admin/suppliers/${supplierId}/products/${mappingId}`);
    return unwrap(response);
  },

  createSupplierProduct: async (supplierId, payload) => {
    const response = await api.post(`/super-admin/suppliers/${supplierId}/products`, payload);
    return unwrap(response);
  },

  updateSupplierProduct: async (supplierId, mappingId, payload) => {
    const response = await api.patch(`/super-admin/suppliers/${supplierId}/products/${mappingId}`, payload);
    return unwrap(response);
  },

  updateSupplierProductStatus: async (supplierId, mappingId, status) => {
    const response = await api.patch(
      `/super-admin/suppliers/${supplierId}/products/${mappingId}/status`,
      { status }
    );
    return unwrap(response);
  },

  updateSupplierProductPrice: async (supplierId, mappingId, price) => {
    const response = await api.patch(
      `/super-admin/suppliers/${supplierId}/products/${mappingId}/price`,
      { price }
    );
    return unwrap(response);
  },

  getSupplierProductPriceHistory: async (supplierId, mappingId, params = {}) => {
    const response = await api.get(
      `/super-admin/suppliers/${supplierId}/products/${mappingId}/price-history`,
      { params }
    );
    return unwrap(response);
  },

  getSupplierComparison: async (productId) => {
    const response = await api.get(`/super-admin/products/${productId}/supplier-comparison`);
    return unwrap(response);
  },

  getProcurementDemand: async (params = {}) => {
    const response = await api.get('/super-admin/procurement/demand', { params });
    return unwrap(response);
  },

  getProcurementPlanByDate: async (date) => {
    const response = await api.get('/super-admin/procurement/plans', { params: { date } });
    return unwrap(response);
  },

  createProcurementPlan: async (date) => {
    const response = await api.post('/super-admin/procurement/plans', { date });
    return unwrap(response);
  },

  getProcurementPlan: async (id) => {
    const response = await api.get(`/super-admin/procurement/plans/${id}`);
    return unwrap(response);
  },

  updateProcurementPlan: async (id, payload) => {
    const response = await api.patch(`/super-admin/procurement/plans/${id}`, payload);
    return unwrap(response);
  },

  confirmProcurementPlan: async (id) => {
    const response = await api.post(`/super-admin/procurement/plans/${id}/confirm`);
    return unwrap(response);
  },

  cancelProcurementPlan: async (id) => {
    const response = await api.post(`/super-admin/procurement/plans/${id}/cancel`);
    return unwrap(response);
  },

  getProcurementPlanSupplierOptions: async (planId, productId) => {
    const response = await api.get(
      `/super-admin/procurement/plans/${planId}/products/${productId}/suppliers`
    );
    return unwrap(response);
  },
};

export default superAdminService;
