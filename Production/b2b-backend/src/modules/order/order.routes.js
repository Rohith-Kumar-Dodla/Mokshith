import express from 'express';
import * as controller from './order.controller.js';
import { protect } from '../../middlewares/auth.middleware.js';
import { authorize } from '../../middlewares/role.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { csrfProtection } from '../../middlewares/csrf.middleware.js';
import { operationIdempotency } from '../../middlewares/idempotency.middleware.js';
import { orderLimiter } from '../../config/rateLimiter.js';

import {
  createOrderSchema,
  updateOrderStatusSchema,
} from './order.validation.js';

const router = express.Router();

// 🔒 State-changing routes with CSRF protection and rate limiting
router.post('/', protect, orderLimiter, operationIdempotency('order:create'), csrfProtection, validate(createOrderSchema), controller.createOrder);
router.post('/:id/fail', protect, csrfProtection, controller.markOrderAsFailed);
router.patch(
  '/:id/status',
  protect,
  csrfProtection,
  authorize('ADMIN', 'SUPER_ADMIN'),
  validate(updateOrderStatusSchema),
  controller.updateOrderStatus
);

// Read-only routes (no CSRF needed)
router.get('/', protect, controller.getOrders);
router.get('/:id/invoice', protect, controller.downloadInvoice);
router.get('/:id', protect, controller.getOrderById);

export default router;