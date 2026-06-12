import express from 'express';
import * as controller from './category.controller.js';
import { protect } from '../../middlewares/auth.middleware.js';
import { authorize } from '../../middlewares/role.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { createCategorySchema, updateCategorySchema } from './category.validation.js';
import { uploadImageToCloud } from '../../middlewares/upload.middleware.js';
import { cacheMiddleware, clearCacheMiddleware } from '../../middlewares/cache.middleware.js';
import { csrfProtection } from '../../middlewares/csrf.middleware.js';

const router = express.Router();

router.post(
  '/',
  protect,
  csrfProtection,
  authorize('ADMIN', 'SUPER_ADMIN'),
  uploadImageToCloud('image'),
  validate(createCategorySchema),
  controller.createCategory,
  clearCacheMiddleware(['cache:*categories*', 'cache:*products*'])
);

// Admin catalog — do not cache; list changes on create/update/delete
router.get('/', protect, controller.getCategories);

router.get('/:id', protect, controller.getCategoryById);

router.put(
  '/:id',
  protect,
  csrfProtection,
  authorize('ADMIN', 'SUPER_ADMIN'),
  uploadImageToCloud('image'),
  validate(updateCategorySchema),
  controller.updateCategory,
  clearCacheMiddleware(['cache:*categories*', 'cache:*products*'])
);

router.delete(
  '/:id',
  protect,
  csrfProtection,
  authorize('ADMIN', 'SUPER_ADMIN'),
  controller.deleteCategory,
  clearCacheMiddleware(['cache:*categories*', 'cache:*products*'])
);

export default router;
