import express from 'express';
import * as vendorController from '../controllers/vendorController.js';
import { validate } from '../validators/index.js';
import { authenticate } from '../middlewares/authenticate.js';
import { authorize } from '../middlewares/authorize.js';
import { commonValidations } from '../validators/validationRules.js';
import { createVendorProfileValidation, updateVendorProfileValidation } from '../validators/vendorValidators.js';

const router = express.Router();

/**
 * @route   POST /api/v1/vendors/profile
 * @desc    Create vendor profile
 * @access  Private (Vendor only)
 */
router.post(
  '/profile',
  authenticate,
  authorize('vendor'),
  createVendorProfileValidation,
  validate,
  vendorController.createProfile
);

/**
 * @route   GET /api/v1/vendors/profile
 * @desc    Get vendor profile (own profile)
 * @access  Private (Vendor only)
 */
router.get(
  '/profile',
  authenticate,
  authorize('vendor'),
  vendorController.getProfile
);

/**
 * @route   PUT /api/v1/vendors/profile
 * @desc    Update vendor profile (own profile)
 * @access  Private (Vendor only)
 */
router.put(
  '/profile',
  authenticate,
  authorize('vendor'),
  updateVendorProfileValidation,
  validate,
  vendorController.updateProfile
);

/**
 * @route   GET /api/v1/vendors/:id
 * @desc    Get vendor by ID
 * @access  Private (Admin, Superadmin)
 */
router.get(
  '/:id',
  authenticate,
  authorize('admin', 'superadmin'),
  commonValidations.id('id'),
  validate,
  vendorController.getVendor
);

/**
 * @route   GET /api/v1/vendors
 * @desc    Get all vendors with search, filter, and pagination
 * @access  Private (Admin, Superadmin)
 */
router.get(
  '/',
  authenticate,
  authorize('admin', 'superadmin'),
  commonValidations.pagination,
  validate,
  vendorController.getAllVendors
);

export default router;
