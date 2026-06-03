import apiClient from "../../../services/apiClient";

export const deliveryService = {
  async getDeliveries() {
    try {
      const res = await apiClient.get("/logistics/my-assignments");
      if (!res.success) {
        console.error("API Error:", res);
        throw new Error("Failed to fetch deliveries");
      }
      return res.data || [];
    } catch (err) {
      console.error("getDeliveries error:", err);
      throw err;
    }
  },

  async getDeliveryById(id) {
    try {
      const res = await apiClient.get(`/logistics/${id}`);
      return res.data || res;
    } catch (err) {
      console.error("getDeliveryById error:", err);
      throw new Error("Delivery fetch failed");
    }
  },

  async getDeliveryQueue() {
    try {
      const res = await apiClient.get("/logistics/delivery-queue");
      return res.data || [];
    } catch (err) {
      console.error("getDeliveryQueue error:", err);
      throw err;
    }
  },

  async getDeliveryHistory() {
    try {
      const res = await apiClient.get("/logistics/history");
      return res.data || [];
    } catch (err) {
      console.error("getDeliveryHistory error:", err);
      throw err;
    }
  },

  async acceptDelivery(id) {
    try {
      const res = await apiClient.post(`/logistics/${id}/accept`);
      return res.data || res;
    } catch (err) {
      console.error("acceptDelivery error:", err);
      throw err;
    }
  },

  async startDelivery(id) {
    try {
      const res = await apiClient.post(`/logistics/${id}/start`);
      return res.data || res;
    } catch (err) {
      console.error("startDelivery error:", err);
      throw err;
    }
  },

  async markAsDelivered(id) {
    try {
      const res = await apiClient.post(`/logistics/${id}/delivered`);
      return res.data || res;
    } catch (err) {
      console.error("markAsDelivered error:", err);
      throw err;
    }
  },

  async updateStatus(id, status) {
    try {
      const res = await apiClient.patch(`/logistics/${id}/status`, { status });
      return res.data || res;
    } catch (err) {
      console.error("updateStatus error:", err);
      throw new Error("Failed to update delivery status");
    }
  },
};