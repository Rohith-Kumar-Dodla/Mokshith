import express from 'express';
import * as controller from './auth.controller.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { requireRegistrationsEnabled } from '../../middlewares/featureGuard.middleware.js';
import { authLimiter } from '../../config/rateLimiter.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { csrfProtection } from '../../middlewares/csrf.middleware.js';
import { requireDatabase } from '../../middlewares/database.middleware.js';

import {
  registerSchema,
  loginSchema,
  verify2FASchema,
  changePasswordSchema,
  enable2FAVerifySchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from './auth.validation.js';

const router = express.Router();

router.use(requireDatabase);

// Public routes (with rate limiting)
router.post('/register', authLimiter, requireRegistrationsEnabled(), validate(registerSchema), controller.register);
router.post('/login', authLimiter, validate(loginSchema), controller.login);
router.post('/forgot-password', authLimiter, validate(forgotPasswordSchema), controller.forgotPassword);
router.post('/reset-password', authLimiter, validate(resetPasswordSchema), controller.resetPassword);
router.post('/refresh-token', controller.refreshToken);
router.get('/csrf-token', controller.getCsrfTokenHandler);

// Allow logout by refresh token without requiring authentication so clients can revoke tokens.
// This route accepts refreshToken in the body (or cookie) and should be callable without access token.
router.post('/logout', controller.logout);

// 2FA routes
router.post('/2fa/verify', authLimiter, validate(verify2FASchema), controller.verify2FA);

// Protected routes (require authentication)
router.use(authenticate);

// 🔒 CSRF Protection for state-changing authenticated routes
router.post('/2fa/enable', csrfProtection, controller.enable2FA);
router.post('/2fa/verify-setup', csrfProtection, validate(enable2FAVerifySchema), controller.verify2FASetup);
router.post('/2fa/disable', csrfProtection, controller.disable2FA);
router.post('/change-password', csrfProtection, validate(changePasswordSchema), controller.changePassword);

// Session management (protected endpoints)
router.post('/logout-all', csrfProtection, controller.logoutAll);
router.get('/sessions', controller.getActiveSessions);
router.delete('/sessions/:tokenId', csrfProtection, controller.revokeSession);

export default router;