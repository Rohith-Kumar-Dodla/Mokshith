import api from './api';

// Product service for product management API calls
const productService = {
  // Get all products
  getAllProducts: async (params = {}) => {
    const response = await api.get('/products', { params });
    return response.data;
  },

  // Get product by ID
  getProductById: async (productId) => {
    const response = await api.get(`/products/${productId}`);
    return response.data;
  },

  // Create new product
  createProduct: async (productData) => {
    const response = await api.post('/products', productData);
    return response.data;
  },

  // Update product
  updateProduct: async (productId, productData) => {
    const response = await api.put(`/products/${productId}`, productData);
    return response.data;
  },

  // Delete product
  deleteProduct: async (productId) => {
    const response = await api.delete(`/products/${productId}`);
    return response.data;
  },

  // Get products by area
  getProductsByArea: async (areaId) => {
    const response = await api.get(`/products/area/${areaId}`);
    return response.data;
  },

  // Update product stock
  updateProductStock: async (productId, stockData) => {
    const response = await api.patch(`/products/${productId}/stock`, stockData);
    return response.data;
  },
};

export default productService;
