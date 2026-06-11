import express from 'express';
import * as adminUserController from '../controllers/adminUserController.js';
import { validate } from '../validators/index.js';
import { authenticate } from '../middlewares/authenticate.js';
import { authorize } from '../middlewares/authorize.js';
import { commonValidations } from '../validators/validationRules.js';

const router = express.Router();

/**
 * @route   GET /api/v1/admin/users/vendors
 * @desc    Get all vendors for admin
 * @access  Private (Admin, Superadmin)
 */
router.get(
  '/vendors',
  authenticate,
  authorize('admin', 'superadmin'),
  commonValidations.pagination,
  validate,
  adminUserController.getVendors
);

/**
 * @route   GET /api/v1/admin/users/delivery-partners
 * @desc    Get all delivery partners for admin
 * @access  Private (Admin, Superadmin)
 */
router.get(
  '/delivery-partners',
  authenticate,
  authorize('admin', 'superadmin'),
  commonValidations.pagination,
  validate,
  adminUserController.getDeliveryPartners
);

/**
 * @route   GET /api/v1/admin/users/pending-vendors
 * @desc    Get pending vendors for admin approval
 * @access  Private (Admin)
 */
router.get(
  '/pending-vendors',
  authenticate,
  authorize('admin'),
  commonValidations.pagination,
  validate,
  adminUserController.getPendingVendors
);

/**
 * @route   GET /api/v1/admin/users/pending-deliveries
 * @desc    Get pending delivery partners for admin approval
 * @access  Private (Admin)
 */
router.get(
  '/pending-deliveries',
  authenticate,
  authorize('admin'),
  commonValidations.pagination,
  validate,
  adminUserController.getPendingDeliveryPartners
);

/**
 * @route   PUT /api/v1/admin/users/vendors/:id/approve
 * @desc    Approve vendor
 * @access  Private (Admin)
 */
router.put(
  '/vendors/:id/approve',
  authenticate,
  authorize('admin'),
  commonValidations.id('id'),
  validate,
  adminUserController.approveVendor
);

/**
 * @route   PUT /api/v1/admin/users/vendors/:id/reject
 * @desc    Reject vendor
 * @access  Private (Admin)
 */
router.put(
  '/vendors/:id/reject',
  authenticate,
  authorize('admin'),
  commonValidations.id('id'),
  validate,
  adminUserController.rejectVendor
);

/**
 * @route   PUT /api/v1/admin/users/vendors/:id/suspend
 * @desc    Suspend vendor
 * @access  Private (Admin)
 */
router.put(
  '/vendors/:id/suspend',
  authenticate,
  authorize('admin'),
  commonValidations.id('id'),
  validate,
  adminUserController.suspendVendor
);

/**
 * @route   PUT /api/v1/admin/users/delivery/:id/approve
 * @desc    Approve delivery partner
 * @access  Private (Admin)
 */
router.put(
  '/delivery/:id/approve',
  authenticate,
  authorize('admin'),
  commonValidations.id('id'),
  validate,
  adminUserController.approveDeliveryPartner
);

/**
 * @route   PUT /api/v1/admin/users/delivery/:id/reject
 * @desc    Reject delivery partner
 * @access  Private (Admin)
 */
router.put(
  '/delivery/:id/reject',
  authenticate,
  authorize('admin'),
  commonValidations.id('id'),
  validate,
  adminUserController.rejectDeliveryPartner
);

/**
 * @route   PUT /api/v1/admin/users/delivery/:id/suspend
 * @desc    Suspend delivery partner
 * @access  Private (Admin)
 */
router.put(
  '/delivery/:id/suspend',
  authenticate,
  authorize('admin'),
  commonValidations.id('id'),
  validate,
  adminUserController.suspendDeliveryPartner
);

/**
 * @route   GET /api/v1/admin/users/statistics
 * @desc    Get user statistics
 * @access  Private (Admin, Superadmin)
 */
router.get(
  '/statistics',
  authenticate,
  authorize('admin', 'superadmin'),
  adminUserController.getStatistics
);

export default router;
