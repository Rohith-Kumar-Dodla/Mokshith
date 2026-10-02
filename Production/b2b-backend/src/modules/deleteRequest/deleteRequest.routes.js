import express from 'express';
import { protect } from '../../middlewares/auth.middleware.js';
import { authorize } from '../../middlewares/role.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { csrfProtection } from '../../middlewares/csrf.middleware.js';
import * as controller from './deleteRequest.controller.js';
import { createDeleteRequestSchema, listDeleteRequestsSchema, rejectDeleteRequestSchema } from './deleteRequest.validation.js';

const router = express.Router();
router.use(protect, csrfProtection);
router.post('/', authorize('ADMIN', 'VENDOR', 'DELIVERY_PARTNER', 'SUPPLIER'), validate(createDeleteRequestSchema), controller.create);
router.get('/', authorize('SUPER_ADMIN'), validate(listDeleteRequestsSchema), controller.list);
router.patch('/:id/approve', authorize('SUPER_ADMIN'), controller.approve);
router.patch('/:id/reject', authorize('SUPER_ADMIN'), validate(rejectDeleteRequestSchema), controller.reject);
export default router;
