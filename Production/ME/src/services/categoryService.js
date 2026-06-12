import api from './api';

function buildCategoryFormData(data, imageFile) {
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

const categoryService = {
  getCategories: async ({ bustCache = false } = {}) => {
    const response = await api.get('/categories', {
      params: bustCache ? { _refresh: Date.now() } : undefined,
    });
    return response.data;
  },

  getCategoryById: async (categoryId) => {
    const response = await api.get(`/categories/${categoryId}`);
    return response.data;
  },

  createCategory: async (categoryData, imageFile = null) => {
    if (imageFile) {
      const formData = buildCategoryFormData(categoryData, imageFile);
      const response = await api.post('/categories', formData);
      return response.data;
    }

    const response = await api.post('/categories', categoryData);
    return response.data;
  },

  updateCategory: async (categoryId, categoryData, imageFile = null) => {
    if (imageFile) {
      const formData = buildCategoryFormData(categoryData, imageFile);
      const response = await api.put(`/categories/${categoryId}`, formData);
      return response.data;
    }

    const response = await api.put(`/categories/${categoryId}`, categoryData);
    return response.data;
  },

  deleteCategory: async (categoryId) => {
    const response = await api.delete(`/categories/${categoryId}`);
    return response.data;
  },
};

export default categoryService;
