import express from 'express';
import * as controller from './promotion.controller.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { applyCouponSchema, createPromotionSchema, updatePromotionSchema } from './promotion.validation.js';

import { protect } from '../../middlewares/auth.middleware.js';
import { authorize } from '../../middlewares/role.middleware.js';

const router = express.Router();

router.get('/', protect, authorize('ADMIN', 'SUPER_ADMIN'), controller.getPromotions);
router.post('/', protect, authorize('ADMIN', 'SUPER_ADMIN'), validate(createPromotionSchema), controller.createPromotion);
router.put('/:id', protect, authorize('ADMIN', 'SUPER_ADMIN'), validate(updatePromotionSchema), controller.updatePromotion);
router.delete('/:id', protect, authorize('ADMIN', 'SUPER_ADMIN'), controller.deletePromotion);
router.patch('/:id/toggle', protect, authorize('ADMIN', 'SUPER_ADMIN'), controller.togglePromotion);

router.post('/apply', validate(applyCouponSchema), controller.applyCoupon);

export default router;
