import express from 'express';
import * as deliveryPartnerController from '../controllers/deliveryPartnerController.js';
import { validate } from '../validators/index.js';
import { authenticate } from '../middlewares/authenticate.js';
import { authorize } from '../middlewares/authorize.js';
import { commonValidations } from '../validators/validationRules.js';
import { createDeliveryPartnerProfileValidation, updateDeliveryPartnerProfileValidation } from '../validators/deliveryPartnerValidators.js';

const router = express.Router();

/**
 * @route   POST /api/v1/delivery-partners/profile
 * @desc    Create delivery partner profile
 * @access  Private (Delivery Partner only)
 */
router.post(
  '/profile',
  authenticate,
  authorize('delivery'),
  createDeliveryPartnerProfileValidation,
  validate,
  deliveryPartnerController.createProfile
);

/**
 * @route   GET /api/v1/delivery-partners/profile
 * @desc    Get delivery partner profile (own profile)
 * @access  Private (Delivery Partner only)
 */
router.get(
  '/profile',
  authenticate,
  authorize('delivery'),
  deliveryPartnerController.getProfile
);

/**
 * @route   PUT /api/v1/delivery-partners/profile
 * @desc    Update delivery partner profile (own profile)
 * @access  Private (Delivery Partner only)
 */
router.put(
  '/profile',
  authenticate,
  authorize('delivery'),
  updateDeliveryPartnerProfileValidation,
  validate,
  deliveryPartnerController.updateProfile
);

/**
 * @route   GET /api/v1/delivery-partners/:id
 * @desc    Get delivery partner by ID
 * @access  Private (Admin, Superadmin)
 */
router.get(
  '/:id',
  authenticate,
  authorize('admin', 'superadmin'),
  commonValidations.id('id'),
  validate,
  deliveryPartnerController.getDeliveryPartner
);

/**
 * @route   GET /api/v1/delivery-partners
 * @desc    Get all delivery partners with search, filter, and pagination
 * @access  Private (Admin, Superadmin)
 */
router.get(
  '/',
  authenticate,
  authorize('admin', 'superadmin'),
  commonValidations.pagination,
  validate,
  deliveryPartnerController.getAllDeliveryPartners
);

export default router;
