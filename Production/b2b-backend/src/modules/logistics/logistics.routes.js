import express from 'express';
import * as controller from './logistics.controller.js';
import { protect } from '../../middlewares/auth.middleware.js';
import { authorize } from '../../middlewares/role.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { operationIdempotency } from '../../middlewares/idempotency.middleware.js';
import {
  assignDeliverySchema,
  collectCodPaymentSchema,
  rejectDeliverySchema,
  createDeliveryOfferSchema,
  offerActionSchema,
  increaseDeliveryOfferAmountSchema,
  completeDeliverySchema,
  updateLocationSchema,
} from './logistics.validation.js';

const router = express.Router();

router.get('/delivery-queue', protect, authorize('ADMIN', 'DELIVERY_PARTNER', 'SUPER_ADMIN'), controller.getDeliveryQueue);
router.get('/history', protect, authorize('ADMIN', 'DELIVERY_PARTNER', 'SUPER_ADMIN'), controller.getDeliveryHistory);
router.get('/analytics', protect, authorize('ADMIN', 'DELIVERY_PARTNER', 'SUPER_ADMIN'), controller.getDeliveryAnalytics);
router.get('/my-offers', protect, authorize('DELIVERY_PARTNER'), controller.getMyDeliveryOffers);
router.post('/:id/accept', protect, authorize('DELIVERY_PARTNER'), controller.acceptDelivery);
router.post(
  '/:id/reject',
  protect,
  authorize('DELIVERY_PARTNER'),
  validate(rejectDeliverySchema),
  controller.rejectAssignment
);
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
router.post('/:id/complete', protect, authorize('DELIVERY_PARTNER'), validate(completeDeliverySchema), controller.completeDelivery);
router.post('/:id/location', protect, authorize('DELIVERY_PARTNER'), validate(updateLocationSchema), controller.updateLocation);

router.post(
  '/:id/offers',
  protect,
  authorize('ADMIN', 'SUPER_ADMIN'),
  validate(createDeliveryOfferSchema),
  operationIdempotency('delivery:offer-create'),
  controller.createDeliveryOffer
);
router.get('/:id/offers', protect, authorize('ADMIN', 'SUPER_ADMIN', 'DELIVERY_PARTNER'), controller.getDeliveryOfferHistory);
router.post(
  '/:id/offers/:offerId/accept',
  protect,
  authorize('DELIVERY_PARTNER'),
  validate(offerActionSchema),
  operationIdempotency('delivery:offer-accept'),
  controller.acceptDeliveryOffer
);
router.post(
  '/:id/offers/:offerId/reject',
  protect,
  authorize('DELIVERY_PARTNER'),
  validate(offerActionSchema),
  operationIdempotency('delivery:offer-reject'),
  controller.rejectDeliveryOffer
);
router.post(
  '/:id/offers/:offerId/increase-amount',
  protect,
  authorize('ADMIN', 'SUPER_ADMIN'),
  validate(increaseDeliveryOfferAmountSchema),
  operationIdempotency('delivery:offer-amount'),
  controller.increaseDeliveryOfferAmount
);
router.post('/:id/distance', protect, authorize('ADMIN', 'SUPER_ADMIN'), controller.getDeliveryDistance);

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
