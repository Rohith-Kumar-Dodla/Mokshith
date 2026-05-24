import apiClient from "../../../services/apiClient";

export const orderService = {
  async getOrders() {
    try {
      return await apiClient.get("/orders");
    } catch {
      throw new Error("Failed to fetch orders");
    }
  },

  async getOrderById(id) {
    try {
      const response = await apiClient.get(`/orders/${id}`);
      return response.data || response;
    } catch {
      throw new Error("Failed to fetch order details");
    }
  },

  async placeOrder(payload) {
    try {
      const config = {};
      if (payload.idempotencyKey) {
        config.headers = { 'idempotency-key': payload.idempotencyKey };
      }
      
      const response = await apiClient.post("/orders", payload, config);
      return response.data || response;
    } catch (error) {
      console.error("API Error during placeOrder:", error);
      
      // Special handling for 409 Conflict (Idempotency Hit)
      // If the backend returned the existing order, we return it to the caller
      if (error.response?.status === 409 && error.response?.data?.data?._id) {
        return error.response.data.data;
      }
      
      throw new Error(error.response?.data?.message || error.message || "Order placement failed");
    }
  },

  async markOrderAsFailed(id) {
    try {
      const response = await apiClient.post(`/orders/${id}/fail`);
      return response.data || response;
    } catch (error) {
      console.error("API Error during markOrderAsFailed:", error);
      throw error;
    }
  },

  async updateOrderStatus(id, status) {
    try {
      const response = await apiClient.patch(`/orders/${id}/status`, { status });
      return response.data || response;
    } catch (error) {
      console.error("API Error during updateOrderStatus:", error);
      throw error;
    }
  },

  async downloadInvoice(id) {
    try {
      const data = await apiClient.get(`/orders/${id}/invoice`, {
        responseType: 'blob'
      });
      const blob = new Blob([data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `invoice-${id}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("API Error during downloadInvoice:", error);
      throw new Error("Failed to download invoice");
    }
  },
};