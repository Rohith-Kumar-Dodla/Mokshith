import api from './api';

const uploadService = {
  uploadImage: async (file, folder = 'uploads', onProgress) => {
    const formData = new FormData();
    formData.append('image', file);
    formData.append('folder', folder);

    const response = await api.post('/upload/image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (event) => {
        if (onProgress && event.total) {
          onProgress(Math.round((event.loaded * 100) / event.total));
        }
      },
    });

    return response.data?.data ?? response.data;
  },
};

export default uploadService;
