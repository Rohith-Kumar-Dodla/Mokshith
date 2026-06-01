import express from 'express';
import * as controller from './payment.controller.js';
import { protect } from '../../middlewares/auth.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { verifyPaymentSchema } from './payment.validation.js';
import { paymentLimiter } from '../../config/rateLimiter.js';
import { csrfProtection } from '../../middlewares/csrf.middleware.js';

import Joi from 'joi';

const router = express.Router();

const hybridPaymentSchema = Joi.object({
  body: Joi.object({
    orderId: Joi.string().required(),
    totalAmount: Joi.number().optional(),
    useCredit: Joi.boolean().optional(),
  }),
}).unknown(true);

// 1. /webhook (Razorpay Webhook - MUST BE BEFORE CSRF PROTECTED ROUTES)
router.post('/webhook', paymentLimiter, controller.razorpayWebhook);

// 🔒 Apply CSRF protection to all state-changing routes below
const csrfProtected = express.Router();
csrfProtected.use(csrfProtection);

// 2. /hybrid
csrfProtected.post(
  '/hybrid',
  paymentLimiter,
  protect,
  validate(hybridPaymentSchema),
  controller.hybridPayment
);

// 3. /create-order
csrfProtected.post('/create-order', paymentLimiter, protect, controller.createRazorpayOrder);

// 4. /verify
csrfProtected.post(
  '/verify',
  paymentLimiter,
  protect,
  validate(verifyPaymentSchema),
  controller.verifyPayment
);

// 5. /fail
csrfProtected.post('/fail', paymentLimiter, protect, controller.failPayment);

// 6. /initiate/:orderId
csrfProtected.post('/initiate/:orderId', paymentLimiter, protect, controller.initiatePayment);

// Mount CSRF protected routes
router.use(csrfProtected);

export default router;