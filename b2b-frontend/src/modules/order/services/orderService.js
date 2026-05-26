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

  async placeOrder(payload, retryCount = 0) {
    try {
      const config = {};
      if (payload.idempotencyKey) {
        config.headers = { 'idempotency-key': payload.idempotencyKey };
      }
      
      const response = await apiClient.post("/orders", payload, config);
      return response.data || response;
    } catch (error) {
      console.error(`API Error during placeOrder (Attempt ${retryCount + 1}):`, error);
      
      // Special handling for 409 Conflict (Idempotency Hit)
      if (error.response?.status === 409) {
        // Case 1: Order already finished and cached
        if (error.response.data?.data?._id) {
          return error.response.data.data;
        }

        // Case 2: Duplicate operation still in progress
        // We poll/retry up to 5 times (5 seconds total) to wait for the first request to finish
        if (error.response.data?.message?.includes('Duplicate operation') && retryCount < 5) {
          console.warn(`Duplicate operation in progress. Polling... (Attempt ${retryCount + 1})`);
          await new Promise(resolve => setTimeout(resolve, 1000));
          return this.placeOrder(payload, retryCount + 1);
        }
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