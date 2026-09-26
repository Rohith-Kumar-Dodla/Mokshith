import express from 'express';
import * as controller from './cart.controller.js';
import { protect } from '../../middlewares/auth.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { addToCartSchema, updateCartItemSchema } from './cart.validation.js';

const router = express.Router();

router.post('/', protect, validate(addToCartSchema), controller.addToCart);
router.get('/', protect, controller.getCart);
router.patch('/:productId', protect, validate(updateCartItemSchema), controller.updateQuantity);
router.delete('/:productId', protect, controller.removeFromCart);

export default router;
