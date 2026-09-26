import express from 'express';
import { protect } from '../../middlewares/auth.middleware.js';
import { authorize } from '../../middlewares/role.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import * as controller from './supplierAllocation.controller.js';
import { orderIdSchema, allocationSchema, requestSchema, queueSchema } from './supplierAllocation.validation.js';

const router = express.Router();
router.use(protect, authorize('ADMIN', 'SUPER_ADMIN'));
router.get('/metrics', controller.metrics);
router.get('/', validate(queueSchema), controller.queue);
router.get('/order/:orderId', validate(orderIdSchema), controller.getForOrder);
router.post('/', validate(allocationSchema), controller.allocate);
router.post('/requests', validate(requestSchema), controller.createRequests);
export default router;
