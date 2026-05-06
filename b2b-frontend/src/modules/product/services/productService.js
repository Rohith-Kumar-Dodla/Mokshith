import apiClient from "../../../services/apiClient";

export const updateProduct = async (id, formData) => {
  console.log("📡 PUT REQUEST START");
  try {
    const res = await apiClient.put(
      `/products/${id}`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );
    console.log("📡 PUT REQUEST DONE");
    return res.data || res;
  } catch (error) {
    const serverError = error.response?.data;
    console.error("❌ PUT REQUEST FAILED:", serverError || error.message);
    
    const message = serverError?.message || error.message || "Failed to update product";
    throw new Error(message);
  }
};

export const productService = {
  getProducts: async (params = {}) => {
    try {
      const query = new URLSearchParams(params).toString();
      return await apiClient.get(`/products${query ? `?${query}` : ''}`);
    } catch (error) {
      throw new Error(error.response?.data?.message || "Failed to fetch products");
    }
  },

  getProductById: async (id) => {
    try {
      return await apiClient.get(`/products/${id}`);
    } catch (error) {
      throw new Error(error.response?.data?.message || "Failed to fetch product");
    }
  },

  async createProduct(payload) {
    try {
      console.log("📡 Calling POST /products");
      // 🔥 Fix: Do NOT manually set Content-Type for FormData. 
      // Axios will set it automatically with the correct boundary.
      const response = await apiClient.post("/products", payload);
      console.log("📡 POST completed", response);
      return response;
    } catch (error) {
      const serverError = error.response?.data;
      console.error("❌ POST failed details:", {
        status: error.response?.status,
        data: serverError,
        message: error.message
      });
      
      const message = serverError?.message || error.message || "Failed to create product";
      throw new Error(message);
    }
  },

  updateProduct: async (id, formData) => {
    console.log("📡 PUT REQUEST START");
    try {
      // 🔥 Fix: Do NOT manually set Content-Type for FormData.
      const res = await apiClient.put(`/products/${id}`, formData);
      console.log("📡 PUT REQUEST DONE");
      return res.data || res;
    } catch (error) {
      const serverError = error.response?.data;
      console.error("❌ PUT REQUEST FAILED:", serverError || error.message);
      
      const message = serverError?.message || error.message || "Failed to update product";
      throw new Error(message);
    }
  },

  deleteProduct: async (id) => {
    try {
      return await apiClient.delete(`/products/${id}`);
    } catch (error) {
      throw new Error(error.response?.data?.message || "Failed to delete product");
    }
  },

  updateStock: async (id, stock) => {
    try {
      return await apiClient.patch(`/products/${id}/stock`, { stock });
    } catch (error) {
      throw new Error(error.response?.data?.message || "Failed to update stock");
    }
  },

  updateStatus: async (id, isActive) => {
    try {
      return await apiClient.patch(`/products/${id}/status`, { isActive });
    } catch (error) {
      throw new Error(error.response?.data?.message || "Failed to update status");
    }
  },

  getCategories: async () => {
    try {
      return await apiClient.get("/categories");
    } catch (error) {
      throw new Error(error.response?.data?.message || "Failed to fetch categories");
    }
  },

  getVendors: async () => {
    try {
      return await apiClient.get("/vendors");
    } catch (error) {
      throw new Error(error.response?.data?.message || "Failed to fetch vendors");
    }
  }
};
