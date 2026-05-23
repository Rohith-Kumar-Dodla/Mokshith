import express from 'express';
import * as controller from './inventory.controller.js';
import { protect } from '../../middlewares/auth.middleware.js';
import { authorize } from '../../middlewares/role.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { addStockSchema } from './inventory.validation.js';
import { operationIdempotency } from '../../middlewares/idempotency.middleware.js';

const router = express.Router();

router.post(
  '/',
  protect,
  authorize('ADMIN'),
  operationIdempotency('inventory:add'),
  validate(addStockSchema),
  controller.addStock
);

router.get('/', protect, controller.getInventory);
router.get('/low-stock', protect, authorize('ADMIN'), controller.getLowStockItems);
router.get('/stats', protect, authorize('ADMIN'), controller.getInventoryStats);

router.patch(
  '/update',
  protect,
  authorize('ADMIN', 'VENDOR'),
  operationIdempotency('inventory:update'),
  controller.updateStock
);

export default router;