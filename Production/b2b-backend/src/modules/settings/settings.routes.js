import express from 'express';
import * as platformController from './settings.controller.js';
import * as userSettingsController from '../userSettings/userSettings.controller.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { updateSettingSchema } from './settings.validation.js';
import { updateUserSettingsSchema } from '../userSettings/userSettings.validation.js';
import { protect } from '../../middlewares/auth.middleware.js';
import { authorize } from '../../middlewares/role.middleware.js';
import { csrfProtection } from '../../middlewares/csrf.middleware.js';

const router = express.Router();

// Public config (must be before /:key)
router.get('/public/config', platformController.getPublicConfig);

// Authenticated user settings
router.get('/', protect, userSettingsController.getUserSettings);
router.put('/', protect, csrfProtection, validate(updateUserSettingsSchema), userSettingsController.updateUserSettings);

// Platform settings (admin only)
router.post(
  '/platform',
  protect,
  authorize('ADMIN', 'SUPER_ADMIN'),
  csrfProtection,
  validate(updateSettingSchema),
  platformController.updateSetting
);

router.get(
  '/platform',
  protect,
  authorize('ADMIN', 'SUPER_ADMIN'),
  platformController.getAllSettings
);

router.get('/platform/:key', protect, authorize('ADMIN', 'SUPER_ADMIN'), platformController.getSetting);

// Legacy key lookup (admin)
router.get('/:key', protect, authorize('ADMIN', 'SUPER_ADMIN'), platformController.getSetting);

export default router;
