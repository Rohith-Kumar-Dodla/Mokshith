import express from 'express';
import * as controller from './product.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { requirePermission, requireRole, requireOwnershipOr } from '../../middlewares/permission.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { createProductSchema, updateProductSchema, updateStockSchema, updateStatusSchema } from './product.validation.js';
import { uploadImageToCloud } from '../../middlewares/upload.middleware.js';
import { cacheMiddleware, clearCacheMiddleware } from '../../middlewares/cache.middleware.js';
import { csrfProtection } from '../../middlewares/csrf.middleware.js';
import { PERMISSIONS } from '../../constants/permissions.js';
import { ROLES } from '../../constants/roles.js';

const router = express.Router();

// List/detail — no Redis cache (admin catalog changes frequently)
router.get('/', controller.getProducts);
router.get('/:id', controller.getProductById);

// ADMIN/VENDOR: Create product (CSRF protected)
router.post(
  '/',
  authenticate,
  csrfProtection,
  requireRole(ROLES.ADMIN, ROLES.SUPER_ADMIN, ROLES.VENDOR),
  requirePermission(PERMISSIONS.PRODUCTS_CREATE),
  uploadImageToCloud('image'),
  validate(createProductSchema),
  controller.createProduct,
  clearCacheMiddleware(['cache:*products*', 'cache:*categories*'])
);

// VENDOR (own products) or ADMIN: Update product (CSRF protected)
router.put(
  '/:id',
  authenticate,
  csrfProtection,
  controller.loadProduct, // Loads product into req.product
  requireOwnershipOr('product', 'vendorId', PERMISSIONS.PRODUCTS_UPDATE),
  uploadImageToCloud('image'),
  validate(updateProductSchema),
  controller.updateProduct,
  clearCacheMiddleware(['cache:*products*', 'cache:*categories*'])
);

// VENDOR (own products) or ADMIN: Delete product (CSRF protected)
router.delete(
  '/:id',
  authenticate,
  csrfProtection,
  controller.loadProduct,
  requireOwnershipOr('product', 'vendorId', PERMISSIONS.PRODUCTS_DELETE),
  controller.deleteProduct,
  clearCacheMiddleware(['cache:*products*', 'cache:*categories*'])
);

// VENDOR (own products) or ADMIN: Update stock (CSRF protected)
router.patch(
  '/:id/stock',
  authenticate,
  csrfProtection,
  controller.loadProduct,
  requireOwnershipOr('product', 'vendorId', PERMISSIONS.INVENTORY_UPDATE),
  validate(updateStockSchema),
  controller.updateStock,
  clearCacheMiddleware(['cache:*products*', 'cache:product:*'])
);

// ADMIN/SUPER_ADMIN: Update status
router.patch(
  '/:id/status',
  authenticate,
  requireRole(ROLES.ADMIN, ROLES.SUPER_ADMIN),
  validate(updateStatusSchema),
  controller.updateStatus
);

export default router;