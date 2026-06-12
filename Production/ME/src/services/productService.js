import api from './api';

function buildProductFormData(data, imageFile) {
  const formData = new FormData();
  Object.entries(data).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      formData.append(key, value);
    }
  });
  if (imageFile) {
    formData.append('image', imageFile);
  }
  return formData;
}

const productService = {
  getAllProducts: async (params = {}, { bustCache = false } = {}) => {
    const response = await api.get('/products', {
      params: {
        ...params,
        ...(bustCache ? { _refresh: Date.now() } : {}),
      },
    });
    return response.data;
  },

  getProductById: async (productId) => {
    const response = await api.get(`/products/${productId}`);
    return response.data;
  },

  createProduct: async (productData, imageFile = null) => {
    if (imageFile) {
      const formData = buildProductFormData(productData, imageFile);
      const response = await api.post('/products', formData);
      return response.data;
    }

    const response = await api.post('/products', productData);
    return response.data;
  },

  updateProduct: async (productId, productData, imageFile = null) => {
    if (imageFile) {
      const formData = buildProductFormData(productData, imageFile);
      const response = await api.put(`/products/${productId}`, formData);
      return response.data;
    }

    const response = await api.put(`/products/${productId}`, productData);
    return response.data;
  },

  deleteProduct: async (productId) => {
    const response = await api.delete(`/products/${productId}`);
    return response.data;
  },

  updateProductStock: async (productId, stock) => {
    const response = await api.patch(`/products/${productId}/stock`, { stock });
    return response.data;
  },
};

export default productService;
