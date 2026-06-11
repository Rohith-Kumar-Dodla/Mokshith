import Category from '../models/Category.js';
import ApiError from '../utils/ApiError.js';
import HttpStatus from '../constants/httpStatus.js';

/**
 * Create a new category
 * @param {object} categoryData - Category data
 * @param {string} userId - User ID creating the category
 * @returns {object} Created category
 */
export const createCategory = async (categoryData, userId) => {
  // Check if category name already exists
  const existingCategory = await Category.findOne({ name: categoryData.name });
  if (existingCategory) {
    throw new ApiError(HttpStatus.CONFLICT, 'Category with this name already exists');
  }

  // Create category with audit fields
  const category = await Category.create({
    ...categoryData,
    createdBy: userId,
    updatedBy: userId,
  });

  return category;
};

/**
 * Get all categories with filters, search, sorting, and pagination
 * @param {object} filters - Filter options
 * @returns {object} Categories and pagination info
 */
export const getCategories = async (filters = {}) => {
  const {
    search,
    status,
    sort = 'sortOrder',
    page = 1,
    limit = 10,
  } = filters;

  // Build query - exclude deleted categories
  const query = { isDeleted: false };

  // Search by name or description
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
    ];
  }

  // Filter by status
  if (status) {
    query.status = status;
  }

  // Determine sort order
  let sortObj = {};
  if (sort.startsWith('-')) {
    sortObj[sort.substring(1)] = -1;
  } else {
    sortObj[sort] = 1;
  }

  // Pagination
  const skip = (page - 1) * limit;
  const totalRecords = await Category.countDocuments(query);
  const totalPages = Math.ceil(totalRecords / limit);

  const categories = await Category.find(query)
    .populate('createdBy', 'name email')
    .populate('updatedBy', 'name email')
    .sort(sortObj)
    .skip(skip)
    .limit(limit);

  return {
    categories,
    pagination: {
      totalRecords,
      currentPage: parseInt(page),
      totalPages,
      currentLimit: parseInt(limit),
    },
  };
};

/**
 * Get category by ID
 * @param {string} categoryId - Category ID
 * @returns {object} Category
 */
export const getCategoryById = async (categoryId) => {
  const category = await Category.findOne({ _id: categoryId, isDeleted: false })
    .populate('createdBy', 'name email')
    .populate('updatedBy', 'name email');

  if (!category) {
    throw new ApiError(HttpStatus.NOT_FOUND, 'Category not found');
  }

  return category;
};

/**
 * Update category
 * @param {string} categoryId - Category ID
 * @param {object} updateData - Data to update
 * @param {string} userId - User ID updating the category
 * @returns {object} Updated category
 */
export const updateCategory = async (categoryId, updateData, userId) => {
  const category = await Category.findOne({ _id: categoryId, isDeleted: false });

  if (!category) {
    throw new ApiError(HttpStatus.NOT_FOUND, 'Category not found');
  }

  // Check if name is being updated and if it already exists
  if (updateData.name && updateData.name !== category.name) {
    const existingCategory = await Category.findOne({ 
      name: updateData.name, 
      _id: { $ne: categoryId } 
    });
    if (existingCategory) {
      throw new ApiError(HttpStatus.CONFLICT, 'Category with this name already exists');
    }
  }

  // Update category
  Object.assign(category, updateData);
  category.updatedBy = userId;
  await category.save();

  return category;
};

/**
 * Soft delete category
 * @param {string} categoryId - Category ID
 * @param {string} userId - User ID deleting the category
 * @returns {object} Deleted category
 */
export const deleteCategory = async (categoryId, userId) => {
  const category = await Category.findOne({ _id: categoryId, isDeleted: false });

  if (!category) {
    throw new ApiError(HttpStatus.NOT_FOUND, 'Category not found');
  }

  // Soft delete
  category.isDeleted = true;
  category.deletedAt = new Date();
  category.updatedBy = userId;
  await category.save();

  return category;
};

/**
 * Update category status
 * @param {string} categoryId - Category ID
 * @param {string} status - New status (active/inactive)
 * @param {string} userId - User ID updating the status
 * @returns {object} Updated category
 */
export const updateCategoryStatus = async (categoryId, status, userId) => {
  const category = await Category.findOne({ _id: categoryId, isDeleted: false });

  if (!category) {
    throw new ApiError(HttpStatus.NOT_FOUND, 'Category not found');
  }

  category.status = status;
  category.updatedBy = userId;
  await category.save();

  return category;
};

/**
 * Get deleted categories (admin only)
 * @param {object} filters - Filter options
 * @returns {object} Deleted categories and pagination info
 */
export const getDeletedCategories = async (filters = {}) => {
  const { page = 1, limit = 10 } = filters;

  const query = { isDeleted: true };

  const skip = (page - 1) * limit;
  const totalRecords = await Category.countDocuments(query);
  const totalPages = Math.ceil(totalRecords / limit);

  const categories = await Category.find(query)
    .populate('createdBy', 'name email')
    .populate('updatedBy', 'name email')
    .sort({ deletedAt: -1 })
    .skip(skip)
    .limit(limit);

  return {
    categories,
    pagination: {
      totalRecords,
      currentPage: parseInt(page),
      totalPages,
      currentLimit: parseInt(limit),
    },
  };
};

export default {
  createCategory,
  getCategories,
  getCategoryById,
  updateCategory,
  deleteCategory,
  updateCategoryStatus,
  getDeletedCategories,
};
