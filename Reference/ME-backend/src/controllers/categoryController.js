import asyncHandler from '../utils/asyncHandler.js';
import ApiResponse from '../utils/ApiResponse.js';
import HttpStatus from '../constants/httpStatus.js';
import * as categoryService from '../services/categoryService.js';

/**
 * Create Category
 * POST /api/v1/categories
 */
export const createCategory = asyncHandler(async (req, res) => {
  const categoryData = req.body;
  const userId = req.user.userId;

  const category = await categoryService.createCategory(categoryData, userId);

  res.status(HttpStatus.CREATED).json(
    new ApiResponse(
      HttpStatus.CREATED,
      category,
      'Category created successfully'
    )
  );
});

/**
 * Get All Categories
 * GET /api/v1/categories
 */
export const getCategories = asyncHandler(async (req, res) => {
  const {
    search,
    status,
    sort,
    page = 1,
    limit = 10,
  } = req.query;

  const result = await categoryService.getCategories({
    search,
    status,
    sort,
    page,
    limit,
  });

  res.status(HttpStatus.OK).json(
    new ApiResponse(
      HttpStatus.OK,
      result,
      'Categories retrieved successfully'
    )
  );
});

/**
 * Get Category by ID
 * GET /api/v1/categories/:id
 */
export const getCategoryById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const category = await categoryService.getCategoryById(id);

  res.status(HttpStatus.OK).json(
    new ApiResponse(
      HttpStatus.OK,
      category,
      'Category retrieved successfully'
    )
  );
});

/**
 * Update Category
 * PUT /api/v1/categories/:id
 */
export const updateCategory = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updateData = req.body;
  const userId = req.user.userId;

  const category = await categoryService.updateCategory(id, updateData, userId);

  res.status(HttpStatus.OK).json(
    new ApiResponse(
      HttpStatus.OK,
      category,
      'Category updated successfully'
    )
  );
});

/**
 * Soft Delete Category
 * DELETE /api/v1/categories/:id
 */
export const deleteCategory = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.userId;

  const category = await categoryService.deleteCategory(id, userId);

  res.status(HttpStatus.OK).json(
    new ApiResponse(
      HttpStatus.OK,
      category,
      'Category deleted successfully'
    )
  );
});

/**
 * Update Category Status
 * PATCH /api/v1/categories/:id/status
 */
export const updateCategoryStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const userId = req.user.userId;

  const category = await categoryService.updateCategoryStatus(id, status, userId);

  res.status(HttpStatus.OK).json(
    new ApiResponse(
      HttpStatus.OK,
      category,
      'Category status updated successfully'
    )
  );
});

/**
 * Get Deleted Categories (Admin Only)
 * GET /api/v1/categories/deleted/list
 */
export const getDeletedCategories = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;

  const result = await categoryService.getDeletedCategories({
    page,
    limit,
  });

  res.status(HttpStatus.OK).json(
    new ApiResponse(
      HttpStatus.OK,
      result,
      'Deleted categories retrieved successfully'
    )
  );
});

export default {
  createCategory,
  getCategories,
  getCategoryById,
  updateCategory,
  deleteCategory,
  updateCategoryStatus,
  getDeletedCategories,
};
