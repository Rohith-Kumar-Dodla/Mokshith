import { asyncHandler } from '../../utils/asyncHandler.js';
import * as service from './category.service.js';
import { successResponse } from '../../utils/responseHandler.js';
import { uploadFile } from '../../services/fileUpload.service.js';

function normalizeCategoryBody(body = {}) {
  const data = { ...body };

  if (data.isActive === 'true') data.isActive = true;
  if (data.isActive === 'false') data.isActive = false;
  if (data.parentId === '') data.parentId = null;

  return data;
}

export const createCategory = asyncHandler(async (req, res) => {
  const data = normalizeCategoryBody(req.body);

  if (req.file) {
    const uploadResult = await uploadFile(req.file, 'categories');
    data.image = uploadResult.url;
    data.imagePublicId = uploadResult.publicId;
  }

  const category = await service.createCategory(data);
  successResponse(res, category, 'Category created');
});

export const getCategories = asyncHandler(async (req, res) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate');
  const categories = await service.getCategories();
  successResponse(res, categories);
});

export const getCategoryById = asyncHandler(async (req, res) => {
  const category = await service.getCategoryById(req.params.id);
  successResponse(res, category);
});

export const updateCategory = asyncHandler(async (req, res) => {
  const data = normalizeCategoryBody(req.body);

  if (req.file) {
    const uploadResult = await uploadFile(req.file, 'categories');
    data.image = uploadResult.url;
    data.imagePublicId = uploadResult.publicId;
  } else {
    delete data.image;
    delete data.imageUrl;
  }

  const category = await service.updateCategory(req.params.id, data);
  successResponse(res, category, 'Category updated');
});

export const deleteCategory = asyncHandler(async (req, res) => {
  const category = await service.deleteCategory(req.params.id);
  successResponse(res, category, 'Category deleted');
});