import express from 'express';
import * as controller from './auth.controller.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { requireRegistrationsEnabled } from '../../middlewares/featureGuard.middleware.js';
import { authLimiter } from '../../config/rateLimiter.js';

import {
  registerSchema,
  loginSchema,
  otpSchema,
  verifyOtpSchema,
} from './auth.validation.js';

const router = express.Router();

router.post('/register', authLimiter, requireRegistrationsEnabled(), validate(registerSchema), controller.register);
router.post('/login', authLimiter, validate(loginSchema), controller.login);
router.post('/send-otp', authLimiter, validate(otpSchema), controller.sendOTP);
router.post('/verify-otp', authLimiter, validate(verifyOtpSchema), controller.verifyOTP);
router.post('/refresh-token', controller.refreshToken);
router.post('/logout', (req, res) => res.json({ success: true, message: 'Logged out' }));

export default router;