import { asyncHandler } from '../../utils/asyncHandler.js';
import * as service from './logistics.service.js';
import Order from '../order/order.model.js';
import Warehouse from '../warehouse/warehouse.model.js';
import { successResponse } from '../../utils/responseHandler.js';

export const createShipment = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.orderId).populate('userId');
  const warehouses = await Warehouse.find();

  const shipment = await service.createShipment(order, warehouses);

  successResponse(res, shipment, 'Shipment created');
});

export const getShipments = asyncHandler(async (req, res) => {
  const shipments = await service.getShipments(req.user);
  successResponse(res, shipments || []);
});

export const getMyAssignments = asyncHandler(async (req, res) => {
  const shipments = await service.getMyAssignments(req.user._id);
  successResponse(res, shipments || []);
});

export const updateDeliveryStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const shipment = await service.updateStatus(req.params.id, status, req.user._id);
  successResponse(res, shipment, 'Status updated');
});

export const getDeliveryQueue = asyncHandler(async (req, res) => {
  const shipments = await service.getDeliveryQueue(req.user);
  successResponse(res, shipments || []);
});

export const getDeliveryHistory = asyncHandler(async (req, res) => {
  const history = await service.getDeliveryHistory(req.user, req.query);
  successResponse(res, history || []);
});

export const acceptDelivery = asyncHandler(async (req, res) => {
  if (req.body?.offerId) {
    const result = await service.acceptDeliveryOffer({
      logisticsId: req.params.id,
      offerId: req.body.offerId,
      partnerId: req.user._id,
      requestId: req.headers['idempotency-key'] || req.body.requestId,
    });
    return successResponse(res, result, 'Delivery offer accepted');
  }
  const shipment = await service.updateStatus(req.params.id, 'ACCEPTED', req.user._id);
  successResponse(res, shipment, 'Delivery accepted');
});

export const rejectAssignment = asyncHandler(async (req, res) => {
  if (req.body?.offerId) {
    const result = await service.rejectDeliveryOffer({
      logisticsId: req.params.id,
      offerId: req.body.offerId,
      partnerId: req.user._id,
      rejectionCode: req.body.rejectionCode,
      reason: req.body.reason,
      requestId: req.headers['idempotency-key'] || req.body.requestId,
    });
    return successResponse(res, result, 'Delivery offer rejected');
  }
  const shipment = await service.rejectAssignment(req.params.id, req.user._id, {
    reason: req.body?.reason,
  });
  successResponse(res, shipment, 'Delivery assignment rejected. The order is now available for reassignment.');
});

export const pickUpDelivery = asyncHandler(async (req, res) => {
  const shipment = await service.updateStatus(req.params.id, 'PICKED', req.user._id);
  successResponse(res, shipment, 'Order picked up');
});

export const startDelivery = asyncHandler(async (req, res) => {
  const shipment = await service.updateStatus(req.params.id, 'OUT_FOR_DELIVERY', req.user._id);
  successResponse(res, shipment, 'Out for delivery');
});

export const markAsDelivered = asyncHandler(async (req, res) => {
  const shipment = await service.updateStatus(req.params.id, 'DELIVERED', req.user._id);
  successResponse(res, shipment, 'Order delivered successfully');
});

export const collectCodPayment = asyncHandler(async (req, res) => {
  const shipment = await service.collectCodPayment(req.params.id, req.user._id, req.body);
  successResponse(res, shipment, 'COD payment collected successfully');
});

export const completeDelivery = asyncHandler(async (req, res) => {
  const { notes, proofImage } = req.body || {};
  const shipment = await service.completeDelivery(req.params.id, req.user._id, {
    notes,
    proofImage,
  });
  successResponse(res, shipment, 'Delivery confirmed and completed');
});

export const updateLocation = asyncHandler(async (req, res) => {
  const { lat, lng } = req.body;
  const shipment = await service.updateLocation(req.params.id, { lat, lng }, req.user._id);

  // Emit real-time location update
  const io = global.io || req.app.get('io');
  if (io) {
    io.emit('locationUpdate', {
      deliveryId: req.params.id,
      location: { lat, lng }
    });
  }

  successResponse(res, shipment, 'Location updated');
});

export const getShipmentDetails = asyncHandler(async (req, res) => {
  const shipment = await service.getShipmentById(req.params.id, req.user);
  successResponse(res, shipment);
});

export const assignDeliveryPartner = asyncHandler(async (req, res) => {
  const shipment = await service.assignDeliveryPartner(
    req.params.id,
    req.body.deliveryPartnerId,
    req.user._id
  );
  successResponse(res, shipment, 'Delivery partner assigned');
});

export const reassignDeliveryPartner = asyncHandler(async (req, res) => {
  const shipment = await service.reassignDeliveryPartner(
    req.params.id,
    req.body.deliveryPartnerId,
    req.user._id
  );
  successResponse(res, shipment, 'Delivery partner reassigned');
});

export const getDeliveryAnalytics = asyncHandler(async (req, res) => {
  const analytics = await service.getDeliveryAnalytics(req.user);
  successResponse(res, analytics);
});

export const createDeliveryOffer = asyncHandler(async (req, res) => {
  const offer = await service.createDeliveryOffer({
    logisticsId: req.params.id,
    deliveryPartnerId: req.body.deliveryPartnerId,
    deliveryAmount: req.body.deliveryAmount,
    actorId: req.user._id,
    idempotencyKey: req.headers['idempotency-key'] || req.body.idempotencyKey,
    forceReassign: req.body.forceReassign === true,
  });
  successResponse(res, offer, 'Delivery offer created', 201);
});

export const getDeliveryOfferHistory = asyncHandler(async (req, res) => {
  const offers = await service.getDeliveryOfferHistory(req.params.id, req.user);
  successResponse(res, offers || []);
});

export const getMyDeliveryOffers = asyncHandler(async (req, res) => {
  const offers = await service.getMyDeliveryOffers(req.user);
  successResponse(res, offers || []);
});

export const acceptDeliveryOffer = asyncHandler(async (req, res) => {
  const result = await service.acceptDeliveryOffer({
    logisticsId: req.params.id,
    offerId: req.params.offerId,
    partnerId: req.user._id,
    requestId: req.headers['idempotency-key'] || req.body?.requestId,
  });
  successResponse(res, result, 'Delivery offer accepted');
});

export const rejectDeliveryOffer = asyncHandler(async (req, res) => {
  const result = await service.rejectDeliveryOffer({
    logisticsId: req.params.id,
    offerId: req.params.offerId,
    partnerId: req.user._id,
    rejectionCode: req.body?.rejectionCode,
    reason: req.body?.reason,
    requestId: req.headers['idempotency-key'] || req.body?.requestId,
  });
  successResponse(res, result, 'Delivery offer rejected');
});

export const increaseDeliveryOfferAmount = asyncHandler(async (req, res) => {
  const result = await service.increaseDeliveryOfferAmount({
    logisticsId: req.params.id,
    offerId: req.params.offerId,
    deliveryPartnerId: req.body.deliveryPartnerId,
    deliveryAmount: req.body.deliveryAmount,
    actorId: req.user._id,
    idempotencyKey: req.headers['idempotency-key'] || req.body.idempotencyKey,
  });
  successResponse(res, result, 'Delivery amount increased and offer recreated');
});

export const getDeliveryDistance = asyncHandler(async (req, res) => {
  const route = await service.getDeliveryDistance(req.params.id);
  successResponse(res, route);
});
