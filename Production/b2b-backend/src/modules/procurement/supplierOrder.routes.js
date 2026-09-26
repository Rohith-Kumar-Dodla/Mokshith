import express from 'express';
import { protect } from '../../middlewares/auth.middleware.js';
import { authorize } from '../../middlewares/role.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import * as controller from './supplierOrder.controller.js';
import { orderIdSchema, supplierOrderIdSchema, createSupplierOrdersSchema } from './supplierOrder.validation.js';

const router = express.Router();
const staff = ['ADMIN', 'SUPER_ADMIN'];
router.get('/eligible-for-order/:orderId', protect, authorize(...staff), validate(orderIdSchema), controller.eligible);
router.get('/order/:orderId', protect, authorize(...staff), validate(orderIdSchema), controller.listForOrder);
router.post('/', protect, authorize(...staff), validate(createSupplierOrdersSchema), controller.create);
router.post('/:id/send-whatsapp', protect, authorize(...staff), validate(supplierOrderIdSchema), controller.whatsapp);
router.post('/:id/whatsapp-opened', protect, authorize(...staff), validate(supplierOrderIdSchema), controller.whatsappOpened);
router.post('/:id/status', protect, authorize(...staff), validate(supplierOrderIdSchema), controller.transition);
export default router;
