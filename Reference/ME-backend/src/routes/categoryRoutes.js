import express from 'express';
import * as categoryController from '../controllers/categoryController.js';
import { validate } from '../validators/index.js';
import { authenticate } from '../middlewares/authenticate.js';
import { authorize } from '../middlewares/authorize.js';
import { commonValidations } from '../validators/validationRules.js';
import * as categoryValidators from '../validators/categoryValidators.js';

const router = express.Router();

/**
 * @route   POST /api/v1/categories
 * @desc    Create a new category
 * @access  Private (Admin only)
 */
router.post(
  '/',
  authenticate,
  authorize('admin'),
  categoryValidators.createCategoryValidation,
  validate,
  categoryController.createCategory
);

/**
 * @route   GET /api/v1/categories
 * @desc    Get all categories with search, filter, sort, and pagination
 * @access  Private (Admin, Superadmin, Vendor)
 */
router.get(
  '/',
  authenticate,
  authorize('admin', 'superadmin', 'vendor'),
  categoryValidators.getCategoriesValidation,
  validate,
  categoryController.getCategories
);

/**
 * @route   GET /api/v1/categories/:id
 * @desc    Get category by ID
 * @access  Private (Admin, Superadmin, Vendor)
 */
router.get(
  '/:id',
  authenticate,
  authorize('admin', 'superadmin', 'vendor'),
  commonValidations.id('id'),
  validate,
  categoryController.getCategoryById
);

/**
 * @route   PUT /api/v1/categories/:id
 * @desc    Update category
 * @access  Private (Admin only)
 */
router.put(
  '/:id',
  authenticate,
  authorize('admin'),
  categoryValidators.updateCategoryValidation,
  validate,
  categoryController.updateCategory
);

/**
 * @route   DELETE /api/v1/categories/:id
 * @desc    Soft delete category
 * @access  Private (Admin only)
 */
router.delete(
  '/:id',
  authenticate,
  authorize('admin'),
  commonValidations.id('id'),
  validate,
  categoryController.deleteCategory
);

/**
 * @route   PATCH /api/v1/categories/:id/status
 * @desc    Update category status
 * @access  Private (Admin only)
 */
router.patch(
  '/:id/status',
  authenticate,
  authorize('admin'),
  categoryValidators.updateCategoryStatusValidation,
  validate,
  categoryController.updateCategoryStatus
);

/**
 * @route   GET /api/v1/categories/deleted/list
 * @desc    Get deleted categories (admin only)
 * @access  Private (Admin only)
 */
router.get(
  '/deleted/list',
  authenticate,
  authorize('admin'),
  commonValidations.pagination,
  validate,
  categoryController.getDeletedCategories
);

export default router;
