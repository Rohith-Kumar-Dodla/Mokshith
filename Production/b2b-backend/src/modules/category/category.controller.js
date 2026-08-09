import { asyncHandler } from '../../utils/asyncHandler.js';
import * as service from './category.service.js';
import { successResponse } from '../../utils/responseHandler.js';
import { replaceStoredImage, applyUploadedImage } from '../../utils/imageUpload.utils.js';

function normalizeCategoryBody(body = {}) {
  const data = { ...body };

  if (data.isActive === 'true') data.isActive = true;
  if (data.isActive === 'false') data.isActive = false;
  if (data.parentId === '') data.parentId = null;

  return data;
}

export const createCategory = asyncHandler(async (req, res) => {
  let data = normalizeCategoryBody(req.body);

  if (req.file) {
    data = await applyUploadedImage(data, req.file, 'mokshith/categories');
  } else if (data.imageUrl) {
    // Pre-uploaded via /upload — persist URL on the category `image` field
    data.image = data.imageUrl;
    data.imagePublicId = data.imagePublicId || null;
  }
  delete data.imageUrl;

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
  const existingCategory = await service.getCategoryById(req.params.id);
  const data = await replaceStoredImage(
    existingCategory,
    normalizeCategoryBody(req.body),
    req.file,
    'mokshith/categories'
  );
  delete data.imageUrl;

  const category = await service.updateCategory(req.params.id, data);
  successResponse(res, category, 'Category updated');
});

export const deleteCategory = asyncHandler(async (req, res) => {
  const category = await service.deleteCategory(req.params.id);
  successResponse(res, category, 'Category deleted');
});
