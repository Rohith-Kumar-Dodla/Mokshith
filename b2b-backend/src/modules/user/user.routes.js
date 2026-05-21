import express from 'express';
import * as controller from './user.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { requirePermission, requireRole } from '../../middlewares/permission.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { updateProfileSchema } from './user.validation.js';
import { uploadImageToCloud } from '../../middlewares/upload.middleware.js';
import { csrfProtection } from '../../middlewares/csrf.middleware.js';
import { PERMISSIONS } from '../../constants/permissions.js';
import { ROLES } from '../../constants/roles.js';

const router = express.Router();

// USER - Read operations (no CSRF)
router.get('/me', authenticate, controller.getProfile);
router.get('/sessions', authenticate, controller.getActiveSessions);

// USER - State-changing operations (CSRF protected)
router.put(
  '/me',
  authenticate,
  csrfProtection,
  validate(updateProfileSchema),
  controller.updateProfile
);

router.post(
  '/profile-image',
  authenticate,
  csrfProtection,
  uploadImageToCloud('image'),
  controller.updateProfileImage
);

router.put('/change-password', authenticate, csrfProtection, controller.changePassword);
router.post('/logout-all', authenticate, csrfProtection, controller.logoutFromAllDevices);

// ADMIN
router.get(
  '/',
  authenticate,
  requireRole(ROLES.ADMIN, ROLES.SUPER_ADMIN),
  requirePermission(PERMISSIONS.USERS_LIST),
  controller.getAllUsers
);

router.get(
  '/:id',
  authenticate,
  requireRole(ROLES.ADMIN, ROLES.SUPER_ADMIN),
  requirePermission(PERMISSIONS.USERS_READ),
  controller.getUserById
);

router.delete(
  '/:id',
  authenticate,
  requireRole(ROLES.SUPER_ADMIN),
  requirePermission(PERMISSIONS.USERS_DELETE),
  controller.deleteUser
);

export default router;