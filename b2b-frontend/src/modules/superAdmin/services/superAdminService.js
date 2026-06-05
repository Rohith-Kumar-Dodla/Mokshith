import apiClient from "../../../services/apiClient";

export const superAdminService = {
  async getAuditLogs() {
    try {
      return await apiClient.get("/superadmin/audit-logs");
    } catch {
      throw new Error("Failed to fetch audit logs");
    }
  },

  async exportAuditLogs() {
    try {
      const response = await apiClient.get("/superadmin/audit-logs/export", {
        responseType: 'blob'
      });
      return response;
    } catch {
      throw new Error("Failed to export audit logs");
    }
  },

  async getMetrics() {
    try {
      return await apiClient.get("/superadmin/metrics");
    } catch {
      throw new Error("Failed to fetch metrics");
    }
  },

  async getAdmins() {
    try {
      return await apiClient.get("/superadmin/admins");
    } catch {
      throw new Error("Failed to fetch admins");
    }
  },

  async createAdmin(payload) {
    try {
      return await apiClient.post("/superadmin/admins", payload);
    } catch (error) {
      throw new Error(error);
    }
  },

  async deleteAdmin(id) {
    try {
      return await apiClient.delete(`/superadmin/admins/${id}`);
    } catch (error) {
      throw new Error(error);
    }
  },

  async updateAdmin(id, payload) {
    try {
      return await apiClient.patch(`/superadmin/admins/${id}`, payload);
    } catch (error) {
      throw new Error(error);
    }
  },

  async getCategories() {
    try {
      return await apiClient.get("/superadmin/categories");
    } catch (error) {
      throw new Error(error);
    }
  },

  async createCategory(payload) {
    try {
      return await apiClient.post("/superadmin/categories", payload);
    } catch (error) {
      throw new Error(error);
    }
  },

  async deleteCategory(id) {
    try {
      return await apiClient.delete(`/superadmin/categories/${id}`);
    } catch (error) {
      throw new Error(error);
    }
  },

  async updateCategory(id, payload) {
    try {
      return await apiClient.patch(`/superadmin/categories/${id}`, payload);
    } catch (error) {
      throw new Error(error);
    }
  },

  async getDbCollection(name) {
    try {
      return await apiClient.get(`/superadmin/db/${name}`);
    } catch (error) {
      throw new Error(error);
    }
  },

  async getConfig() {
    try {
      return await apiClient.get("/superadmin/config");
    } catch (error) {
      throw new Error(error);
    }
  },

  async updateConfig(payload) {
    try {
      return await apiClient.post("/superadmin/config", payload);
    } catch (error) {
      throw new Error(error);
    }
  },

  async createB2BCustomer(payload) {
    try {
      return await apiClient.post("/admin/b2b-customers", payload);
    } catch (error) {
      throw new Error(error.response?.data?.message || "Failed to create B2B Customer");
    }
  },

  async createDeliveryPartner(payload) {
    try {
      return await apiClient.post("/admin/delivery-partners", payload);
    } catch (error) {
      throw new Error(error.response?.data?.message || "Failed to create Delivery Partner");
    }
  },

  async getB2BCustomers() {
    try {
      return await apiClient.get("/admin/users?role=B2B_CUSTOMER");
    } catch (error) {
      throw new Error(error.response?.data?.message || "Failed to fetch B2B Customers");
    }
  },

  async deleteB2BCustomer(id) {
    try {
      return await apiClient.delete(`/users/${id}`);
    } catch (error) {
      throw new Error(error.response?.data?.message || "Failed to delete B2B Customer");
    }
  },

  async getDeliveryPartners() {
    try {
      return await apiClient.get("/admin/users?role=DELIVERY_PARTNER");
    } catch (error) {
      throw new Error(error.response?.data?.message || "Failed to fetch Delivery Partners");
    }
  },

  async deleteDeliveryPartner(id) {
    try {
      return await apiClient.delete(`/users/${id}`);
    } catch (error) {
      throw new Error(error.response?.data?.message || "Failed to delete Delivery Partner");
    }
  },
};