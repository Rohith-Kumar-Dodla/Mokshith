export const uploadFile = async (file) => {
  console.log('Processing uploaded file metadata:', file.filename);

  // Return the path relative to the static 'uploads' folder
  // Since files are now saved in root 'uploads/' via multer,
  // and root 'uploads' is served as '/uploads',
  // the URL should be '/uploads/filename'
  return {
    url: `/uploads/${file.filename}`,
  };
};