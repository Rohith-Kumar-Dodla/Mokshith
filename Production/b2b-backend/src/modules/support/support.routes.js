import express from 'express';
import * as controller from './support.controller.js';
import { protect } from '../../middlewares/auth.middleware.js';
import { authorize } from '../../middlewares/role.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import {
  createTicketSchema,
  replyTicketSchema,
  updateTicketStatusSchema,
  listTicketsSchema,
  assignTicketSchema,
} from './support.validation.js';

const router = express.Router();

router.get('/contact', protect, controller.getContactInfo);

router.post('/', protect, authorize('VENDOR', 'B2B_CUSTOMER', 'B2C_CUSTOMER'), validate(createTicketSchema), controller.createTicket);
router.get('/my-tickets', protect, authorize('VENDOR', 'B2B_CUSTOMER', 'B2C_CUSTOMER'), controller.getMyTickets);

router.get(
  '/all',
  protect,
  authorize('ADMIN', 'SUPER_ADMIN'),
  validate(listTicketsSchema),
  controller.getAllTickets
);

router.get('/:id', protect, controller.getTicketById);
router.post('/:id/reply', protect, validate(replyTicketSchema), controller.replyToTicket);
router.patch(
  '/:id/status',
  protect,
  authorize('ADMIN', 'SUPER_ADMIN'),
  validate(updateTicketStatusSchema),
  controller.updateTicketStatus
);
router.get('/assignees', protect, authorize('ADMIN', 'SUPER_ADMIN'), controller.getAssignableAdmins);
router.patch('/:id/assign', protect, authorize('ADMIN', 'SUPER_ADMIN'), validate(assignTicketSchema), controller.assignTicket);

export default router;
