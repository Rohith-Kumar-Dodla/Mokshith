import express from 'express';
import * as controller from './product.controller.js';
import { protect } from '../../middlewares/auth.middleware.js';
import { authorize } from '../../middlewares/role.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { createProductSchema, updateProductSchema } from './product.validation.js';
import { upload } from '../../middlewares/upload.middleware.js';

const router = express.Router();

// 🔥 Debug middleware to log request details before multer
const debugLog = (req, res, next) => {
  console.log('--- PRODUCT ROUTE DEBUG ---');
  console.log('Method:', req.method);
  console.log('Path:', req.originalUrl);
  console.log('Content-Type:', req.headers['content-type']);
  next();
};

router.post(
  '/',
  protect,
  authorize('ADMIN', 'SUPER_ADMIN', 'VENDOR'),
  debugLog,
  upload.single('image'),
  validate(createProductSchema),
  controller.createProduct
);

router.get('/', protect, controller.getProducts);

router.get('/:id', protect, controller.getProductById);

router.put(
  '/:id',
  protect,
  authorize('ADMIN', 'SUPER_ADMIN'),
  debugLog,
  upload.single('image'),
  validate(updateProductSchema),
  controller.updateProduct
);

router.delete(
  '/:id',
  protect,
  authorize('ADMIN', 'SUPER_ADMIN'),
  controller.deleteProduct
);

router.patch(
  '/:id/stock',
  protect,
  authorize('ADMIN', 'SUPER_ADMIN'),
  controller.updateStock
);

router.patch(
  '/:id/status',
  protect,
  authorize('ADMIN', 'SUPER_ADMIN'),
  controller.updateStatus
);

export default router;