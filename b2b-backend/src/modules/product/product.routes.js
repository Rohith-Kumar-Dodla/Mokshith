import express from 'express';
import * as controller from './product.controller.js';
import { protect } from '../../middlewares/auth.middleware.js';
import { authorize } from '../../middlewares/role.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { createProductSchema, updateProductSchema } from './product.validation.js';
import { uploadImage } from '../../middlewares/upload.middleware.js';

const router = express.Router();

// PUBLIC: Get products
router.get('/', controller.getProducts);
router.get('/:id', controller.getProductById);

// ADMIN/VENDOR: Create product
router.post(
  '/',
  protect,
  authorize('ADMIN', 'SUPER_ADMIN', 'VENDOR'),
  uploadImage.single('image'),
  validate(createProductSchema),
  controller.createProduct
);

// ADMIN/SUPER_ADMIN: Update product
router.put(
  '/:id',
  protect,
  authorize('ADMIN', 'SUPER_ADMIN'),
  uploadImage.single('image'),
  validate(updateProductSchema),
  controller.updateProduct
);

// ADMIN/SUPER_ADMIN: Delete product
router.delete(
  '/:id',
  protect,
  authorize('ADMIN', 'SUPER_ADMIN'),
  controller.deleteProduct
);

// ADMIN/SUPER_ADMIN: Update stock
router.patch(
  '/:id/stock',
  protect,
  authorize('ADMIN', 'SUPER_ADMIN'),
  controller.updateStock
);

// ADMIN/SUPER_ADMIN: Update status
router.patch(
  '/:id/status',
  protect,
  authorize('ADMIN', 'SUPER_ADMIN'),
  controller.updateStatus
);

export default router;