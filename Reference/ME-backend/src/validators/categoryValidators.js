import { body, param, query } from 'express-validator';
import { commonValidations } from './validationRules.js';

/**
 * Create category validation rules
 */
export const createCategoryValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Category name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Category name must be between 2 and 100 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters'),
  body('image')
    .optional()
    .trim()
    .isURL()
    .withMessage('Image must be a valid URL'),
  body('status')
    .optional()
    .trim()
    .isIn(['active', 'inactive'])
    .withMessage('Status must be either active or inactive'),
  body('sortOrder')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Sort order must be a non-negative integer'),
];

/**
 * Update category validation rules
 */
export const updateCategoryValidation = [
  commonValidations.id('id'),
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Category name must be between 2 and 100 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters'),
  body('image')
    .optional()
    .trim()
    .isURL()
    .withMessage('Image must be a valid URL'),
  body('status')
    .optional()
    .trim()
    .isIn(['active', 'inactive'])
    .withMessage('Status must be either active or inactive'),
  body('sortOrder')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Sort order must be a non-negative integer'),
];

/**
 * Update category status validation rules
 */
export const updateCategoryStatusValidation = [
  commonValidations.id('id'),
  body('status')
    .trim()
    .notEmpty()
    .withMessage('Status is required')
    .isIn(['active', 'inactive'])
    .withMessage('Status must be either active or inactive'),
];

/**
 * Get categories validation rules (with search, filter, sort, pagination)
 */
export const getCategoriesValidation = [
  query('search')
    .optional()
    .trim(),
  query('status')
    .optional()
    .trim()
    .isIn(['active', 'inactive'])
    .withMessage('Status must be either active or inactive'),
  query('sort')
    .optional()
    .trim()
    .isIn(['name', 'createdAt', 'sortOrder', '-name', '-createdAt', '-sortOrder'])
    .withMessage('Sort must be one of: name, createdAt, sortOrder (with optional - for descending)'),
  ...commonValidations.pagination,
];

export default {
  createCategoryValidation,
  updateCategoryValidation,
  updateCategoryStatusValidation,
  getCategoriesValidation,
};
