import express from 'express';
import * as controller from './adminApprovals.controller.js';
import { protect } from '../../middlewares/auth.middleware.js';
import { authorize } from '../../middlewares/role.middleware.js';
import { csrfProtection } from '../../middlewares/csrf.middleware.js';

const router = express.Router();

router.use(protect, authorize('SUPER_ADMIN'));

router.get('/', controller.getAdminApprovals);
router.get('/pending', controller.getPendingAdminApprovals);
router.patch('/:id/approve', csrfProtection, controller.approveAdmin);
router.patch('/:id/reject', csrfProtection, controller.rejectAdmin);

export default router;
