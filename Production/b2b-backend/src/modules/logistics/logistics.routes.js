import express from 'express';
import * as controller from './logistics.controller.js';
import { protect } from '../../middlewares/auth.middleware.js';
import { authorize } from '../../middlewares/role.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { assignDeliverySchema, collectCodPaymentSchema } from './logistics.validation.js';

const router = express.Router();

router.get('/delivery-queue', protect, authorize('ADMIN', 'DELIVERY_PARTNER', 'SUPER_ADMIN'), controller.getDeliveryQueue);
router.get('/history', protect, authorize('ADMIN', 'DELIVERY_PARTNER', 'SUPER_ADMIN'), controller.getDeliveryHistory);
router.get('/analytics', protect, authorize('ADMIN', 'DELIVERY_PARTNER', 'SUPER_ADMIN'), controller.getDeliveryAnalytics);
router.post('/:id/accept', protect, authorize('DELIVERY_PARTNER'), controller.acceptDelivery);
router.post('/:id/pick', protect, authorize('DELIVERY_PARTNER'), controller.pickUpDelivery);
router.post('/:id/start', protect, authorize('DELIVERY_PARTNER'), controller.startDelivery);
router.post('/:id/delivered', protect, authorize('DELIVERY_PARTNER'), controller.markAsDelivered);
router.post(
  '/:id/collect-payment',
  protect,
  authorize('DELIVERY_PARTNER'),
  validate(collectCodPaymentSchema),
  controller.collectCodPayment
);
router.post('/:id/complete', protect, authorize('DELIVERY_PARTNER'), controller.completeDelivery);
router.post('/:id/location', protect, authorize('DELIVERY_PARTNER'), controller.updateLocation);

router.post('/:orderId', protect, authorize('ADMIN', 'SUPER_ADMIN'), controller.createShipment);
router.get('/my-assignments', protect, authorize('DELIVERY_PARTNER'), controller.getMyAssignments);
router.get('/', protect, authorize('ADMIN', 'SUPER_ADMIN'), controller.getShipments);
router.patch(
  '/:id/assign',
  protect,
  authorize('ADMIN', 'SUPER_ADMIN'),
  validate(assignDeliverySchema),
  controller.assignDeliveryPartner
);
router.patch(
  '/:id/reassign',
  protect,
  authorize('ADMIN', 'SUPER_ADMIN'),
  validate(assignDeliverySchema),
  controller.reassignDeliveryPartner
);
router.get('/:id', protect, controller.getShipmentDetails);

export default router;