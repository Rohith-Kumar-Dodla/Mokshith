import * as repo from './logistics.repository.js';
import Logistics from './logistics.model.js';
import AppError from '../../errors/AppError.js';
import { optimizeRoute } from './routeOptimization.js';
import Order from '../order/order.model.js';
import { DELIVERY_STATUS } from '../../constants/deliveryStatus.js';
import { sendNotification } from '../notification/notification.service.js';
import { logger } from '../../config/logger.js';
import { syncOrderStatusFromLogistics } from '../order/orderStatusSync.js';
import { PAYMENT_STATUS } from '../../constants/paymentStatus.js';
import mongoose from 'mongoose';
import { logAction } from '../audit/audit.service.js';
import DeliveryOffer from './deliveryOffer.model.js';
import { DELIVERY_OFFER_STATUS, DELIVERY_REJECTION_REASONS } from '../../constants/deliveryOfferStatus.js';
import Warehouse from '../warehouse/warehouse.model.js';
import { calculateRouteDistance } from './deliveryDistance.service.js';
import { validateDeliveryAmount } from './deliveryAmount.service.js';
import { geocodeAddress, hasValidCoordinates } from '../../services/geocoding.service.js';
import { getDeliveryOrigin } from '../warehouse/warehouse.service.js';

const LOGISTICS_TRANSITIONS = {
  [DELIVERY_STATUS.PENDING]: [DELIVERY_STATUS.ASSIGNED],
  [DELIVERY_STATUS.ASSIGNED]: [DELIVERY_STATUS.ACCEPTED],
  [DELIVERY_STATUS.ACCEPTED]: [DELIVERY_STATUS.PICKED],
  [DELIVERY_STATUS.PICKED]: [DELIVERY_STATUS.OUT_FOR_DELIVERY],
  [DELIVERY_STATUS.OUT_FOR_DELIVERY]: [DELIVERY_STATUS.DELIVERED],
  [DELIVERY_STATUS.DELIVERED]: [DELIVERY_STATUS.COMPLETED],
};

function isCodOrder(order) {
  return String(order?.paymentMethod || '').toUpperCase() === 'COD';
}

async function assertCodPaymentCollected(order, nextStatus) {
  if (!isCodOrder(order)) return;

  const needsPayment =
    nextStatus === DELIVERY_STATUS.DELIVERED || nextStatus === DELIVERY_STATUS.COMPLETED;

  if (!needsPayment) return;

  if (order.paymentStatus !== PAYMENT_STATUS.PAID) {
    throw new AppError(
      'COD payment must be collected before marking this order as delivered.',
      400
    );
  }
}

const REASSIGNABLE_STATUSES = new Set([
  DELIVERY_STATUS.PENDING,
  DELIVERY_STATUS.REJECTED,
  DELIVERY_STATUS.ASSIGNED,
]);

const TERMINAL_ASSIGNMENT_STATUSES = new Set([
  DELIVERY_STATUS.DELIVERED,
  DELIVERY_STATUS.COMPLETED,
]);

const ACTIVE_WORKLOAD_STATUSES = [
  DELIVERY_STATUS.ASSIGNED,
  DELIVERY_STATUS.ACCEPTED,
  DELIVERY_STATUS.PICKED,
  DELIVERY_STATUS.OUT_FOR_DELIVERY,
];

const DELIVERY_NOTIFICATIONS = {
  [DELIVERY_STATUS.ASSIGNED]: {
    title: 'Delivery Assigned',
    message: (orderId) => `Order #${orderId} has been assigned for delivery.`,
  },
  [DELIVERY_STATUS.ACCEPTED]: {
    title: 'Delivery Accepted',
    message: (orderId) => `Order #${orderId} was accepted by the delivery partner.`,
  },
  [DELIVERY_STATUS.PICKED]: {
    title: 'Order Picked Up',
    message: (orderId) => `Order #${orderId} has been picked up from the warehouse.`,
  },
  [DELIVERY_STATUS.OUT_FOR_DELIVERY]: {
    title: 'Out For Delivery',
    message: (orderId) => `Order #${orderId} is out for delivery.`,
  },
  [DELIVERY_STATUS.DELIVERED]: {
    title: 'Order Delivered',
    message: (orderId) => `Order #${orderId} has been delivered to the customer.`,
  },
  [DELIVERY_STATUS.COMPLETED]: {
    title: 'Delivery Completed',
    message: (orderId) => `Order #${orderId} delivery has been confirmed and completed.`,
  },
};

function validateLogisticsTransition(currentStatus, nextStatus) {
  const allowed = LOGISTICS_TRANSITIONS[currentStatus];
  if (!allowed || !allowed.includes(nextStatus)) {
    throw new AppError(
      `Invalid delivery transition from ${currentStatus} to ${nextStatus}. Complete each step in order.`,
      400
    );
  }
}

function resolveOrderId(orderRef) {
  return orderRef?._id || orderRef;
}

async function notifyDeliveryStakeholders(shipment, logisticsStatus) {
  const template = DELIVERY_NOTIFICATIONS[logisticsStatus];
  if (!template) return;

  const orderId = resolveOrderId(shipment.orderId);
  const order = await Order.findById(orderId).select('userId').lean();
  const vendorId = order?.userId;
  const partnerId = shipment.deliveryPartnerId?._id || shipment.deliveryPartnerId;

  const payload = {
    title: template.title,
    message: template.message(String(orderId)),
    type: 'ORDER',
  };

  const recipients = new Set();
  if (vendorId) recipients.add(String(vendorId));
  if (partnerId) recipients.add(String(partnerId));

  const User = mongoose.model('User');
  const admins = await User.find({ role: { $in: ['ADMIN', 'SUPER_ADMIN'] } }).select('_id').lean();
  admins.forEach((admin) => recipients.add(String(admin._id)));

  await Promise.all(
    [...recipients].map((userId) =>
      sendNotification({ userId, ...payload }).catch((err) => {
        logger.warn('Delivery notification failed', { userId, logisticsStatus, error: err.message });
      })
    )
  );
}

function emitDeliveryStatusUpdate(shipment, previousStatus = null) {
  if (!global.io) return;
  global.io.emit('delivery:statusUpdated', {
    shipmentId: shipment._id,
    orderId: resolveOrderId(shipment.orderId),
    previousStatus,
    logisticsStatus: shipment.status,
    deliveryPartnerId: shipment.deliveryPartnerId?._id || shipment.deliveryPartnerId || null,
    currentOfferId: shipment.currentOfferId?._id || shipment.currentOfferId || null,
    currentOfferVersion: shipment.currentOfferVersion || 0,
  });
}

export const createShipment = async (order, warehouses) => {
  if (!order) throw new AppError('Order not found', 404);

  const existing = await repo.findByOrder(order._id);
  if (existing) {
    await Order.findByIdAndUpdate(order._id, { shipmentId: existing._id });
    return existing;
  }

  let selectedWarehouse;
  try {
    selectedWarehouse = await getDeliveryOrigin();
  } catch (error) {
    if (error.code && error.code !== 'WAREHOUSE_ORIGIN_REQUIRED') throw error;
    selectedWarehouse = optimizeRoute(warehouses);
  }
  const user = order.userId;
  const defaultAddress = order.address || order.shippingAddress || user?.addresses?.[0] || {};
  const fullAddress = defaultAddress.addressLine
    ? `${defaultAddress.addressLine}, ${defaultAddress.city || ''}, ${defaultAddress.state || ''} - ${defaultAddress.pincode || ''}`
    : 'Address not provided';

  const shipment = await repo.createShipment({
    orderId: order._id,
    warehouseId: selectedWarehouse?._id,
    pickupWarehouseId: selectedWarehouse?._id || null,
    pickupWarehouseName: selectedWarehouse?.name || '',
    pickupAddress: selectedWarehouse?.location?.address || '',
    pickupLatitude: selectedWarehouse?.location?.coordinates?.latitude ?? null,
    pickupLongitude: selectedWarehouse?.location?.coordinates?.longitude ?? null,
    trackingNumber: `TRK-${Date.now()}`,
    status: DELIVERY_STATUS.PENDING,
    estimatedDelivery: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
    address: fullAddress,
    customerName: user?.name || defaultAddress.name || 'Customer',
    phone: defaultAddress.phone || user?.mobile || 'N/A',
  });

  await Order.findByIdAndUpdate(order._id, { shipmentId: shipment._id });

  return shipment;
};

export const autoAssignDelivery = async (orderId) => {
  console.log('Auto-assigning delivery for order:', orderId);
  
  const order = await Order.findById(orderId).populate('userId');
  if (!order) return;

  const User = mongoose.model('User');
  const Shipment = mongoose.model('Logistics');

  // 1. Find all active delivery partners
  const activePartners = await User.find({ 
    role: 'DELIVERY_PARTNER', 
    status: 'ACTIVE' 
  });

  if (!activePartners || activePartners.length === 0) {
    console.warn('No active delivery partners found for auto-assignment');
    return;
  }

  // 2. Count active orders for each partner
  const partnerWorkload = await Promise.all(activePartners.map(async (partner) => {
    const activeOrdersCount = await Shipment.countDocuments({
      deliveryPartnerId: partner._id,
      status: { $in: ACTIVE_WORKLOAD_STATUSES },
    });
    return { partner, activeOrdersCount };
  }));

  // 3. Choose partner with least active orders
  const chosenPartner = partnerWorkload.sort((a, b) => a.activeOrdersCount - b.activeOrdersCount)[0].partner;

  // 4. Create or update shipment
  let shipment = await repo.findByOrder(orderId);
  
  if (shipment) {
    shipment.deliveryPartnerId = chosenPartner._id;
    shipment.status = 'ASSIGNED';
    await shipment.save();
  } else {
    const user = order.userId;
    const defaultAddress = order.address || user?.addresses?.find(a => a.isDefault) || user?.addresses?.[0] || {};
    const fullAddress = order.address 
      ? `${order.address.addressLine}, ${order.address.city}, ${order.address.state} - ${order.address.pincode}`
      : `${defaultAddress.addressLine || ''}, ${defaultAddress.city || ''}, ${defaultAddress.state || ''} - ${defaultAddress.pincode || ''}`;

    shipment = await repo.createShipment({
      orderId: order._id,
      deliveryPartnerId: chosenPartner._id,
      trackingNumber: `TRK-${Date.now()}`,
      status: 'ASSIGNED',
      estimatedDelivery: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days
      address: fullAddress || 'Address not provided',
      customerName: user?.name || 'Customer',
      phone: order.address?.phone || defaultAddress.phone || user?.mobile || 'N/A'
    });
  }

  // 5. Link order and sync canonical order status
  await Order.findByIdAndUpdate(orderId, { shipmentId: shipment._id });
  await syncOrderStatusFromLogistics(
    orderId,
    DELIVERY_STATUS.ASSIGNED,
    { role: 'SYSTEM' },
    { shipmentId: shipment._id }
  );

  if (global.io) {
    global.io.emit('delivery:assigned', {
      orderId: order._id,
      deliveryPartnerId: chosenPartner._id,
      shipmentId: shipment._id,
      logisticsStatus: DELIVERY_STATUS.ASSIGNED,
    });
  }

  console.log(`Order ${orderId} auto-assigned to ${chosenPartner.name}`);
  return shipment;
};

export const getDeliveryQueue = async (user) => {
  if (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') {
    const queue = await repo.findAllActive();
    await Promise.all(queue.map((shipment) => expireOfferIfNeeded(shipment._id, shipment.currentOfferId?._id || shipment.currentOfferId)));
    return repo.findAllActive();
  }
  return repo.findByPartner(user._id, [
    DELIVERY_STATUS.PENDING,
    DELIVERY_STATUS.ASSIGNED,
    DELIVERY_STATUS.ACCEPTED,
    DELIVERY_STATUS.PICKED,
    DELIVERY_STATUS.OUT_FOR_DELIVERY,
    DELIVERY_STATUS.DELIVERED,
  ]);
};

const HISTORY_STATUSES = new Set(['DELIVERED', 'COMPLETED', 'CANCELLED', 'FAILED']);

function parseHistoryQuery(query = {}) {
  const page = Math.max(1, Number.parseInt(query.page || '1', 10) || 1);
  const limit = Math.min(100, Math.max(1, Number.parseInt(query.limit || '50', 10) || 50));
  const filter = { status: { $in: [...HISTORY_STATUSES] } };

  if (query.status && HISTORY_STATUSES.has(String(query.status).toUpperCase())) {
    filter.status = String(query.status).toUpperCase();
  }

  const dateFilter = {};
  if (query.from && !Number.isNaN(Date.parse(query.from))) dateFilter.$gte = new Date(query.from);
  if (query.to && !Number.isNaN(Date.parse(query.to))) dateFilter.$lte = new Date(query.to);
  if (Object.keys(dateFilter).length) filter.updatedAt = dateFilter;

  const search = String(query.search || '').trim();
  if (search) {
    const terms = [
      { address: { $regex: search, $options: 'i' } },
      { customerName: { $regex: search, $options: 'i' } },
      { trackingNumber: { $regex: search, $options: 'i' } },
    ];
    if (mongoose.isValidObjectId(search)) terms.push({ orderId: search });
    filter.$or = terms;
  }

  return { filter, page, limit };
}

export const getDeliveryHistory = async (user, query = {}) => {
  const isAdmin = user.role === 'ADMIN' || user.role === 'SUPER_ADMIN';
  const hasQuery = Object.keys(query).some((key) => ['page', 'limit', 'from', 'to', 'status', 'search'].includes(key));
  const { filter, page, limit } = parseHistoryQuery(query);
  if (!isAdmin) filter.deliveryPartnerId = user._id;

  if (!hasQuery) {
    return isAdmin
      ? repo.findAllDelivered()
      : repo.findByPartner(user._id, [...HISTORY_STATUSES]);
  }

  const result = await repo.findHistoryPage(filter, { skip: (page - 1) * limit, limit });
  return {
    items: result.items,
    pagination: {
      page,
      limit,
      total: result.total,
      totalPages: Math.ceil(result.total / limit),
    },
  };
};

export const updateStatus = async (id, status, userId, extra = {}) => {
  const shipment = await repo.findById(id);
  if (!shipment) throw new AppError('Shipment not found', 404);

  if (userId) {
    const partnerId = shipment.deliveryPartnerId?._id || shipment.deliveryPartnerId;
    if (partnerId && String(partnerId) !== String(userId)) {
      throw new AppError('You are not assigned to this delivery', 403);
    }
  }

  validateLogisticsTransition(shipment.status, status);

  const linkedOrderId = resolveOrderId(shipment.orderId);
  const orderDoc = await Order.findById(linkedOrderId);
  if (!orderDoc) throw new AppError('Linked order not found', 404);
  await assertCodPaymentCollected(orderDoc, status);

  const update = { status, ...extra };
  if (status === DELIVERY_STATUS.ACCEPTED && userId) {
    update.deliveryPartnerId = userId;
  }
  if (status === DELIVERY_STATUS.DELIVERED) {
    update.deliveredAt = new Date();
  }
  if (status === DELIVERY_STATUS.COMPLETED) {
    update.completedAt = new Date();
  }

  const updated = await repo.updateShipment(id, update);
  const populated = await repo.findById(updated._id);

  const actor = userId
    ? { _id: userId, role: 'DELIVERY_PARTNER' }
    : { role: 'SYSTEM' };

  await syncOrderStatusFromLogistics(linkedOrderId, status, actor, {
    shipmentId: populated._id,
  });
  await notifyDeliveryStakeholders(populated, status);

  return populated;
};

export const collectCodPayment = async (id, userId, payload = {}) => {
  const shipment = await repo.findById(id);
  if (!shipment) throw new AppError('Shipment not found', 404);

  const partnerId = shipment.deliveryPartnerId?._id || shipment.deliveryPartnerId;
  if (!partnerId || String(partnerId) !== String(userId)) {
    throw new AppError('You are not assigned to this delivery', 403);
  }

  if (shipment.status !== DELIVERY_STATUS.OUT_FOR_DELIVERY) {
    throw new AppError('COD collection is only available when the order is out for delivery', 400);
  }

  const orderId = resolveOrderId(shipment.orderId);
  const order = await Order.findById(orderId);
  if (!order) throw new AppError('Order not found', 404);

  if (!isCodOrder(order)) {
    throw new AppError('Payment collection applies only to COD orders', 400);
  }

  if (order.paymentStatus === PAYMENT_STATUS.PAID) {
    throw new AppError('Payment has already been collected for this order', 400);
  }

  const collectionMode = String(payload.collectionMode || '').toUpperCase();
  if (!['QR', 'CASH'].includes(collectionMode)) {
    throw new AppError('collectionMode must be QR or CASH', 400);
  }

  if (collectionMode === 'CASH' && !payload.cashCollectionProof) {
    throw new AppError('Cash collection proof image is required', 400);
  }

  order.paymentStatus = PAYMENT_STATUS.PAID;
  order.collectionMode = collectionMode;
  order.paymentCollectedBy = userId;
  order.paymentCollectedAt = new Date();
  order.collectionNotes = payload.notes || '';

  if (collectionMode === 'CASH') {
    order.cashCollectionProof = payload.cashCollectionProof;
    order.cashProofUploadedAt = new Date();
  }

  order.statusHistory = order.statusHistory || [];
  order.statusHistory.push({
    status: order.status,
    changedBy: userId,
    changedAt: new Date(),
    note: `COD payment collected via ${collectionMode}`,
  });

  await order.save();

  if (global.io) {
    global.io.emit('order:paymentCollected', {
      orderId: order._id,
      shipmentId: shipment._id,
      paymentStatus: order.paymentStatus,
      collectionMode: order.collectionMode,
      paymentCollectedAt: order.paymentCollectedAt,
    });
    global.io.emit('order:statusUpdated', {
      orderId: order._id,
      status: order.status,
      paymentStatus: order.paymentStatus,
      collectionMode: order.collectionMode,
      statusHistory: order.statusHistory,
    });
  }

  await notifyDeliveryStakeholders(shipment, 'PAYMENT_COLLECTED').catch(() => {});

  const vendorId = order.userId;
  if (vendorId) {
    await sendNotification({
      userId: vendorId,
      title: 'COD Payment Collected',
      message: `Payment for order #${order._id} was collected via ${collectionMode}.`,
      type: 'PAYMENT',
    }).catch((err) => logger.warn('COD vendor notification failed', { error: err.message }));
  }

  return repo.findById(shipment._id);
};

export const completeDelivery = async (id, userId, { notes, proofImage } = {}) => {
  return updateStatus(id, DELIVERY_STATUS.COMPLETED, userId, {
    deliveryNotes: notes || undefined,
    deliveryProofImage: proofImage || undefined,
  });
};

export const getShipments = async (user) => {
  const filter = {};
  if (user.role === 'DELIVERY_PARTNER') {
    filter.deliveryPartnerId = user._id;
  } else if (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') {
    // Admin sees everything
  } else {
    // Other roles see nothing for now to prevent data leakage
    return [];
  }
  return repo.findAll(filter);
};

export const getShipmentById = async (id, user = null) => {
  const shipment = await repo.findById(id);
  if (!shipment) throw new AppError('Shipment not found', 404);
  if (user?.role === 'DELIVERY_PARTNER') {
    const partnerId = shipment.deliveryPartnerId?._id || shipment.deliveryPartnerId;
    if (!partnerId || String(partnerId) !== String(user._id)) {
      throw new AppError('You are not authorized to view this delivery', 403);
    }
  }
  return shipment;
};

export const getMyAssignments = async (deliveryBoyId) => {
  const filter = {
    deliveryPartnerId: deliveryBoyId,
    status: {
      $nin: [
        DELIVERY_STATUS.COMPLETED,
        DELIVERY_STATUS.CANCELLED,
        DELIVERY_STATUS.FAILED,
        DELIVERY_STATUS.REJECTED,
      ],
    },
  };
  return await repo.findAll(filter);
};

export const updateLocation = async (id, location, userId) => {
  const existing = await repo.findById(id);
  if (!existing) throw new AppError('Shipment not found', 404);
  const partnerId = existing.deliveryPartnerId?._id || existing.deliveryPartnerId;
  if (!partnerId || String(partnerId) !== String(userId)) {
    throw new AppError('You are not assigned to this delivery', 403);
  }
  const shipment = await repo.updateShipment(id, { currentLocation: location });
  return shipment;
};

/**
 * Delivery partner rejects an ASSIGNED assignment.
 * Clears active deliveryPartnerId and sets status REJECTED.
 * Does NOT cancel/fail the customer order or touch payment/inventory.
 */
export const rejectAssignment = async (shipmentId, userId, { reason } = {}) => {
  if (!userId) throw new AppError('Unauthorized', 401);

  const updated = await repo.updateShipmentIf(
    {
      _id: shipmentId,
      deliveryPartnerId: userId,
      status: DELIVERY_STATUS.ASSIGNED,
    },
    {
      $set: {
        status: DELIVERY_STATUS.REJECTED,
        lastRejectedPartnerId: userId,
        rejectedAt: new Date(),
        rejectionReason: reason ? String(reason).trim().slice(0, 500) : null,
      },
      $unset: { deliveryPartnerId: 1 },
      $inc: { rejectionCount: 1 },
    }
  );

  if (!updated) {
    const existing = await repo.findById(shipmentId);
    if (!existing) throw new AppError('Shipment not found', 404);

    // Prefer status conflict when assignment already moved (incl. concurrent reject)
    if (existing.status !== DELIVERY_STATUS.ASSIGNED) {
      throw new AppError(
        `Cannot reject assignment in status ${existing.status}. Only ASSIGNED assignments can be rejected.`,
        409
      );
    }

    const partnerId = existing.deliveryPartnerId?._id || existing.deliveryPartnerId;
    if (!partnerId || String(partnerId) !== String(userId)) {
      throw new AppError('You are not assigned to this delivery', 403);
    }
    throw new AppError('Assignment could not be rejected due to a concurrent update. Please retry.', 409);
  }

  const populated = await repo.findById(updated._id);

  try {
    await logAction({
      userId,
      action: 'DELIVERY_ASSIGNMENT_REJECTED',
      entity: 'Logistics',
      entityId: populated._id,
      details: 'Delivery partner rejected assignment; order remains valid and unassigned',
      data: {
        orderId: resolveOrderId(populated.orderId),
        previousStatus: DELIVERY_STATUS.ASSIGNED,
        status: DELIVERY_STATUS.REJECTED,
        reason: populated.rejectionReason || null,
      },
      severity: 'INFO',
    });
  } catch (auditError) {
    logger.warn('Failed to audit delivery assignment rejection', {
      shipmentId,
      error: auditError.message,
    });
  }

  if (global.io) {
    global.io.emit('delivery:assignmentRejected', {
      shipmentId: populated._id,
      orderId: resolveOrderId(populated.orderId),
      logisticsStatus: DELIVERY_STATUS.REJECTED,
      rejectedBy: userId,
    });
    emitDeliveryStatusUpdate(populated, null);
  }

  const User = mongoose.model('User');
  const admins = await User.find({ role: { $in: ['ADMIN', 'SUPER_ADMIN'] } }).select('_id').lean();
  await Promise.all(
    admins.map((admin) =>
      sendNotification({
        userId: admin._id,
        title: 'Delivery Assignment Rejected',
        message: `A delivery partner rejected assignment for order #${resolveOrderId(populated.orderId)}. Reassignment is required.`,
        type: 'ORDER',
      }).catch((err) => {
        logger.warn('Admin rejection notification failed', { error: err.message });
      })
    )
  );

  return populated;
};

export const assignDeliveryPartner = async (shipmentId, deliveryPartnerId, actorId = null) => {
  const shipment = await repo.findById(shipmentId);
  if (!shipment) throw new AppError('Shipment not found', 404);

  if (TERMINAL_ASSIGNMENT_STATUSES.has(shipment.status)) {
    throw new AppError('Cannot assign partner to a completed delivery', 400);
  }

  if (
    [DELIVERY_STATUS.PICKED, DELIVERY_STATUS.OUT_FOR_DELIVERY].includes(shipment.status)
  ) {
    throw new AppError('Cannot reassign a delivery that is already in transit', 400);
  }

  if (![...REASSIGNABLE_STATUSES, DELIVERY_STATUS.ACCEPTED].includes(shipment.status)) {
    throw new AppError(`Cannot assign partner when delivery status is ${shipment.status}`, 400);
  }

  const User = mongoose.model('User');
  const partner = await User.findOne({
    _id: deliveryPartnerId,
    role: 'DELIVERY_PARTNER',
    status: { $in: ['ACTIVE', 'active'] },
  });

  if (!partner) throw new AppError('Delivery partner not found or inactive', 404);

  // Atomic: do not overwrite in-transit / concurrent reject→reassign races incorrectly
  const updated = await repo.updateShipmentIf(
    {
      _id: shipmentId,
      status: {
        $in: [
          DELIVERY_STATUS.PENDING,
          DELIVERY_STATUS.REJECTED,
          DELIVERY_STATUS.ASSIGNED,
          DELIVERY_STATUS.ACCEPTED,
        ],
      },
    },
    {
      $set: {
        deliveryPartnerId,
        status: DELIVERY_STATUS.ASSIGNED,
        rejectionReason: null,
        rejectedAt: null,
      },
    }
  );

  if (!updated) {
    throw new AppError(
      'Assignment could not be updated due to a concurrent status change. Please refresh and retry.',
      409
    );
  }

  const populated = await repo.findById(updated._id);
  const linkedOrderId = resolveOrderId(populated.orderId);
  await Order.findByIdAndUpdate(linkedOrderId, { shipmentId: populated._id });

  await syncOrderStatusFromLogistics(
    linkedOrderId,
    DELIVERY_STATUS.ASSIGNED,
    { role: 'ADMIN' },
    { shipmentId: populated._id }
  );

  await notifyDeliveryStakeholders(populated, DELIVERY_STATUS.ASSIGNED);

  try {
    await logAction({
      userId: actorId,
      action: 'DELIVERY_ASSIGNMENT_UPDATED',
      entity: 'Logistics',
      entityId: populated._id,
      details: 'Admin assigned delivery partner',
      data: {
        orderId: linkedOrderId,
        deliveryPartnerId,
        status: DELIVERY_STATUS.ASSIGNED,
      },
      severity: 'INFO',
    });
  } catch (auditError) {
    logger.warn('Failed to audit delivery assignment', { shipmentId, error: auditError.message });
  }

  return populated;
};

export const reassignDeliveryPartner = async (shipmentId, deliveryPartnerId, actorId = null) => {
  const shipment = await repo.findById(shipmentId);
  if (!shipment) throw new AppError('Shipment not found', 404);

  if (TERMINAL_ASSIGNMENT_STATUSES.has(shipment.status)) {
    throw new AppError('Cannot reassign a completed delivery', 400);
  }

  if ([DELIVERY_STATUS.PICKED, DELIVERY_STATUS.OUT_FOR_DELIVERY].includes(shipment.status)) {
    throw new AppError('Cannot reassign a delivery that is already in transit', 400);
  }

  return assignDeliveryPartner(shipmentId, deliveryPartnerId, actorId);
};

export const getDeliveryAnalytics = async (user) => {
  const isPartner = user.role === 'DELIVERY_PARTNER';
  const partnerFilter = isPartner ? { deliveryPartnerId: user._id } : {};

  const [statusCounts, activeCount, completedCount, failedCount] = await Promise.all([
    repo.countByStatus(partnerFilter),
    Logistics.countDocuments({
      ...partnerFilter,
      status: {
        $nin: [
          DELIVERY_STATUS.DELIVERED,
          DELIVERY_STATUS.COMPLETED,
          DELIVERY_STATUS.CANCELLED,
          DELIVERY_STATUS.FAILED,
          DELIVERY_STATUS.REJECTED,
        ],
      },
    }),
    Logistics.countDocuments({ ...partnerFilter, status: { $in: ['DELIVERED', 'COMPLETED'] } }),
    Logistics.countDocuments({ ...partnerFilter, status: { $in: ['CANCELLED', 'FAILED'] } }),
  ]);

  const totalAttempts = completedCount + failedCount;
  const completionRate = totalAttempts > 0 ? Math.round((completedCount / totalAttempts) * 100) : 100;
  const acceptanceRate = activeCount + completedCount > 0
    ? Math.round((completedCount / (activeCount + completedCount)) * 100)
    : 100;

  const history = isPartner
    ? await repo.findByPartner(user._id, ['DELIVERED', 'COMPLETED', 'CANCELLED', 'FAILED'])
    : await repo.findAllDelivered();

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfWeek = new Date(startOfToday);
  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const completedAt = (shipment) => shipment.completedAt || shipment.deliveredAt || shipment.updatedAt;
  const amountFor = (shipment) => Number.isFinite(Number(shipment.deliveryAmount))
    ? Number(shipment.deliveryAmount)
    : null;
  const sumSince = (start) => history.reduce((sum, shipment) => {
    const amount = amountFor(shipment);
    const date = new Date(completedAt(shipment));
    return amount !== null && date >= start ? sum + amount : sum;
  }, 0);
  const todayEarnings = sumSince(startOfToday);
  const weekEarnings = sumSince(startOfWeek);
  const monthEarnings = sumSince(startOfMonth);
  const earningsUnavailableCount = history.filter((shipment) => amountFor(shipment) === null).length;

  return {
    totalDeliveries: activeCount + completedCount + failedCount,
    activeDeliveries: activeCount,
    completedDeliveries: completedCount,
    failedDeliveries: failedCount,
    completionRate,
    acceptanceRate,
    earnings: monthEarnings,
    todayEarnings,
    weekEarnings,
    monthEarnings,
    earningsUnavailableCount,
    averageRating: null,
    statusBreakdown: statusCounts,
  };
};

const OFFER_EXPIRY_MINUTES = Math.max(1, Number(process.env.DELIVERY_OFFER_EXPIRY_MINUTES || 30));

function offerConflict(message, code = 'DELIVERY_OFFER_CONFLICT') {
  return new AppError(message, 409, code);
}

async function notifyOfferRecipient(userId, title, message, event, data = {}) {
  if (!userId) return;
  await sendNotification({ userId, title, message, type: 'ORDER' }).catch((error) => {
    logger.warn('Delivery offer notification failed', { userId, event, error: error.message });
  });
  if (global.io) {
    if (typeof global.io.to === 'function') global.io.to(`user:${String(userId)}`).emit(event, data);
    global.io.emit(event, { userId, ...data });
  }
}

async function loadOfferContext(logisticsId, { resolveCustomerCoordinates = true } = {}) {
  const shipment = await repo.findById(logisticsId);
  if (!shipment) throw new AppError('Shipment not found', 404);
  let order = resolveOrderId(shipment.orderId) === shipment.orderId ? await Order.findById(shipment.orderId).lean() : shipment.orderId;
  let warehouse = shipment.warehouseId?._id
    ? shipment.warehouseId
    : await Warehouse.findById(shipment.warehouseId).lean();
  if (shipment.pickupLatitude != null && shipment.pickupLongitude != null) {
    warehouse = {
      ...(warehouse || {}),
      _id: shipment.pickupWarehouseId || shipment.warehouseId,
      name: shipment.pickupWarehouseName || warehouse?.name,
      location: { ...(warehouse?.location || {}), address: shipment.pickupAddress || warehouse?.location?.address, coordinates: { latitude: shipment.pickupLatitude, longitude: shipment.pickupLongitude } },
    };
  }
  if (!order) throw new AppError('Linked order not found', 404);
  if (resolveCustomerCoordinates && !hasValidCoordinates(order.address?.location || order.shippingAddress?.location) && process.env.NODE_ENV !== 'test') {
    const geocodingAddress = {
      ...(order.shippingAddress || {}),
      ...(order.address || {}),
      addressLine: order.address?.addressLine || order.shippingAddress?.addressLine || shipment.address,
    };
    const geocoded = await geocodeAddress(geocodingAddress);
    const location = { latitude: geocoded.latitude, longitude: geocoded.longitude };
    await Order.findByIdAndUpdate(order._id, {
      $set: {
        'address.location': location,
        'shippingAddress.location': location,
      },
    });
    order = { ...order, address: { ...(order.address || {}), location }, shippingAddress: { ...(order.shippingAddress || {}), location } };
  }
  return { shipment, order, warehouse };
}

async function expireOfferIfNeeded(logisticsId, offerId) {
  if (!offerId) return null;
  const now = new Date();
  const offer = await DeliveryOffer.findOneAndUpdate(
    {
      _id: offerId,
      logisticsId,
      status: DELIVERY_OFFER_STATUS.OFFERED,
      expiresAt: { $lte: now },
    },
    {
      $set: { status: DELIVERY_OFFER_STATUS.EXPIRED, respondedAt: now },
    },
    { new: true }
  );
  if (!offer) return null;

  const updated = await Logistics.findOneAndUpdate(
    {
      _id: logisticsId,
      currentOfferId: offer._id,
      currentOfferVersion: offer.version,
      status: DELIVERY_STATUS.ASSIGNED,
    },
    {
      $set: { status: DELIVERY_STATUS.REJECTED },
      $unset: { deliveryPartnerId: 1 },
    },
    { new: true }
  );
  if (updated) {
    await notifyOfferRecipient(
      offer.deliveryPartnerId,
      'Delivery offer expired',
      `The delivery offer for order #${offer.orderId} is no longer available.`,
      'delivery:offerExpired',
      { offerId: offer._id, logisticsId, orderId: offer.orderId }
    );
    await logAction({
      action: 'DELIVERY_OFFER_EXPIRED',
      entity: 'DeliveryOffer',
      entityId: offer._id,
      details: 'Delivery offer expired without a partner response',
      data: { logisticsId, orderId: offer.orderId, version: offer.version },
      severity: 'INFO',
    }).catch((error) => logger.warn('Delivery offer expiry audit failed', { error: error.message }));
    emitDeliveryStatusUpdate(updated, DELIVERY_STATUS.ASSIGNED);
  }
  return offer;
}

export const createDeliveryOffer = async ({ logisticsId, deliveryPartnerId, deliveryAmount, actorId, idempotencyKey, forceReassign = false }) => {
  if (idempotencyKey) {
    const existing = await DeliveryOffer.findOne({ idempotencyKey }).populate('deliveryPartnerId', 'name email mobile');
    if (existing) return existing;
  }

  const { shipment, order, warehouse } = await loadOfferContext(logisticsId);
  if (![DELIVERY_STATUS.PENDING, DELIVERY_STATUS.REJECTED, DELIVERY_STATUS.ASSIGNED].includes(shipment.status)) {
    throw new AppError(`Cannot create an offer when delivery status is ${shipment.status}`, 400);
  }
  const currentOfferId = shipment.currentOfferId?._id || shipment.currentOfferId;
  const currentOffer = currentOfferId ? await DeliveryOffer.findById(currentOfferId) : null;
  if (currentOffer?.status === DELIVERY_OFFER_STATUS.OFFERED && !forceReassign && new Date(currentOffer.expiresAt) > new Date()) {
    throw offerConflict('A delivery offer is already active for this shipment.');
  }

  const User = mongoose.model('User');
  const partner = await User.findOne({
    _id: deliveryPartnerId,
    role: 'DELIVERY_PARTNER',
    status: { $in: ['ACTIVE', 'active'] },
  }).lean();
  if (!partner) throw new AppError('Delivery partner not found or inactive', 404);

  const route = calculateRouteDistance({ warehouse, order });
  const amount = validateDeliveryAmount(deliveryAmount);
  const previousVersion = Number(shipment.currentOfferVersion || 0);
  const version = previousVersion + 1;
  const expiresAt = new Date(Date.now() + OFFER_EXPIRY_MINUTES * 60 * 1000);

  let offer;
  try {
    offer = await DeliveryOffer.create({
      logisticsId,
      orderId: resolveOrderId(shipment.orderId),
      deliveryPartnerId,
      attemptNumber: version,
      version,
      status: DELIVERY_OFFER_STATUS.OFFERED,
      deliveryAmount: amount,
      distance: route.distance,
      distanceUnit: route.distanceUnit,
      origin: { ...route.origin, label: warehouse?.name || warehouse?.location?.address || 'Warehouse' },
      destination: { ...route.destination, label: order.address?.city || order.shippingAddress?.city || 'Customer' },
      pickupWarehouseId: shipment.pickupWarehouseId || shipment.warehouseId || null,
      pickupWarehouseName: shipment.pickupWarehouseName || warehouse?.name || '',
      pickupAddress: shipment.pickupAddress || warehouse?.location?.address || '',
      createdBy: actorId,
      expiresAt,
      idempotencyKey,
    });
  } catch (error) {
    if (error?.code === 11000) throw offerConflict('A delivery offer with this version or request already exists.');
    throw error;
  }

  const updated = await Logistics.findOneAndUpdate(
    {
      _id: logisticsId,
      currentOfferVersion: previousVersion,
      status: { $in: [DELIVERY_STATUS.PENDING, DELIVERY_STATUS.REJECTED, DELIVERY_STATUS.ASSIGNED] },
    },
    {
      $set: {
        currentOfferId: offer._id,
        currentOfferVersion: version,
        deliveryPartnerId,
        status: DELIVERY_STATUS.ASSIGNED,
        rejectionReason: null,
        rejectedAt: null,
        distanceKm: route.distance,
        distanceUnit: route.distanceUnit,
        deliveryAmount: amount,
      },
    },
    { new: true }
  );
  if (!updated) {
    await DeliveryOffer.findByIdAndUpdate(offer._id, { status: DELIVERY_OFFER_STATUS.CANCELLED, respondedAt: new Date() });
    throw offerConflict('Offer could not be created because the delivery changed concurrently. Please refresh.');
  }

  if (currentOffer && currentOffer.status !== DELIVERY_OFFER_STATUS.ACCEPTED) {
    await DeliveryOffer.findOneAndUpdate(
      { _id: currentOffer._id, status: { $in: [DELIVERY_OFFER_STATUS.OFFERED, DELIVERY_OFFER_STATUS.REJECTED] } },
      { $set: { status: DELIVERY_OFFER_STATUS.SUPERSEDED, respondedAt: currentOffer.respondedAt || new Date() } }
    );
  }

  const populated = await repo.findById(updated._id);
  await notifyOfferRecipient(
    deliveryPartnerId,
    'New delivery offer',
    `A new delivery offer is available for order #${offer.orderId}. Earnings: ₹${amount}.`,
    'delivery:offerCreated',
    { offerId: offer._id, logisticsId, orderId: offer.orderId, deliveryAmount: amount, distance: route.distance, expiresAt }
  );
  await logAction({
    userId: actorId,
    action: currentOffer ? 'DELIVERY_OFFER_REASSIGNED' : 'DELIVERY_OFFER_CREATED',
    entity: 'DeliveryOffer',
    entityId: offer._id,
    details: currentOffer ? 'Delivery offer reassigned' : 'Delivery offer created',
    data: { logisticsId, orderId: offer.orderId, deliveryPartnerId, amount, distance: route.distance, version },
    severity: 'INFO',
  }).catch((error) => logger.warn('Delivery offer audit failed', { error: error.message }));
  if (currentOffer && amount > Number(currentOffer.deliveryAmount || 0)) {
    await logAction({
      userId: actorId,
      action: 'DELIVERY_OFFER_AMOUNT_UPDATED',
      entity: 'DeliveryOffer',
      entityId: offer._id,
      details: 'Admin increased the delivery amount while replacing an offer',
      data: { logisticsId, previousOfferId: currentOffer._id, previousAmount: currentOffer.deliveryAmount, deliveryAmount: amount },
      severity: 'INFO',
    }).catch((error) => logger.warn('Delivery offer amount audit failed', { error: error.message }));
  }

  emitDeliveryStatusUpdate(populated, shipment.status);
  return { offer, logistics: populated, suggestedAmount: null };
};

export const getDeliveryDistance = async (logisticsId) => {
  const { shipment, order, warehouse } = await loadOfferContext(logisticsId);
  const route = calculateRouteDistance({ warehouse, order });
  await Logistics.findByIdAndUpdate(logisticsId, {
    distanceKm: route.distance,
    distanceUnit: route.distanceUnit,
  });
  return route;
};

export const getDeliveryOfferHistory = async (logisticsId, user) => {
  const { shipment } = await loadOfferContext(logisticsId, { resolveCustomerCoordinates: false });
  if (user.role === 'DELIVERY_PARTNER' && String(shipment.deliveryPartnerId?._id || shipment.deliveryPartnerId) !== String(user._id)) {
    const ownsOffer = await DeliveryOffer.exists({ logisticsId, deliveryPartnerId: user._id });
    if (!ownsOffer) throw new AppError('You are not authorized to view these offers', 403);
  }
  await expireOfferIfNeeded(logisticsId, shipment.currentOfferId?._id || shipment.currentOfferId);
  return DeliveryOffer.find({ logisticsId }).sort({ version: 1 }).populate('deliveryPartnerId', 'name email mobile').lean();
};

export const getMyDeliveryOffers = async (user) => {
  const staleOffers = await DeliveryOffer.find({
    deliveryPartnerId: user._id,
    status: DELIVERY_OFFER_STATUS.OFFERED,
    expiresAt: { $lte: new Date() },
  }).select('_id logisticsId');
  await Promise.all(staleOffers.map((offer) => expireOfferIfNeeded(offer.logisticsId, offer._id)));
  return DeliveryOffer.find({ deliveryPartnerId: user._id, status: { $in: [DELIVERY_OFFER_STATUS.OFFERED, DELIVERY_OFFER_STATUS.ACCEPTED] } })
    .sort({ createdAt: -1 })
    .populate({ path: 'orderId', populate: { path: 'userId', select: 'name businessName mobile email' } })
    .populate('logisticsId', 'status address warehouseId rejectionCount currentOfferVersion')
    .lean();
};

export const acceptDeliveryOffer = async ({ logisticsId, offerId, partnerId, requestId }) => {
  await expireOfferIfNeeded(logisticsId, offerId);
  const offer = await DeliveryOffer.findById(offerId);
  if (!offer) throw new AppError('Delivery offer not found', 404);
  if (String(offer.deliveryPartnerId) !== String(partnerId)) throw new AppError('You are not authorized to accept this offer', 403);
  if (offer.status === DELIVERY_OFFER_STATUS.ACCEPTED && requestId && offer.lastActionRequestId === requestId) return offer;
  if (offer.status !== DELIVERY_OFFER_STATUS.OFFERED) throw offerConflict(`Offer is no longer available (${offer.status}).`, 'DELIVERY_OFFER_NOT_CURRENT');
  if (new Date(offer.expiresAt) <= new Date()) throw offerConflict('This delivery offer has expired.', 'DELIVERY_OFFER_EXPIRED');

  const updated = await Logistics.findOneAndUpdate(
    {
      _id: logisticsId,
      currentOfferId: offer._id,
      currentOfferVersion: offer.version,
      status: DELIVERY_STATUS.ASSIGNED,
      deliveryPartnerId: partnerId,
    },
    { $set: { status: DELIVERY_STATUS.ACCEPTED, deliveryAmount: offer.deliveryAmount } },
    { new: true }
  );
  if (!updated) throw offerConflict('This offer is stale or the delivery was already accepted.', 'DELIVERY_OFFER_STALE');
  const accepted = await DeliveryOffer.findOneAndUpdate(
    { _id: offer._id, status: DELIVERY_OFFER_STATUS.OFFERED },
    { $set: { status: DELIVERY_OFFER_STATUS.ACCEPTED, acceptedAt: new Date(), respondedAt: new Date(), lastActionRequestId: requestId || null } },
    { new: true }
  );
  await syncOrderStatusFromLogistics(resolveOrderId(updated.orderId), DELIVERY_STATUS.ACCEPTED, { _id: partnerId, role: 'DELIVERY_PARTNER' }, { shipmentId: updated._id });
  await notifyDeliveryStakeholders(updated, DELIVERY_STATUS.ACCEPTED);
  await logAction({ userId: partnerId, action: 'DELIVERY_OFFER_ACCEPTED', entity: 'DeliveryOffer', entityId: offer._id, details: 'Delivery partner accepted offer', data: { logisticsId, orderId: offer.orderId, version: offer.version }, severity: 'INFO' }).catch((error) => logger.warn('Offer acceptance audit failed', { error: error.message }));
  emitDeliveryStatusUpdate(updated, DELIVERY_STATUS.ASSIGNED);
  return { offer: accepted, logistics: await repo.findById(updated._id) };
};

export const rejectDeliveryOffer = async ({ logisticsId, offerId, partnerId, rejectionCode, reason, requestId }) => {
  await expireOfferIfNeeded(logisticsId, offerId);
  if (!DELIVERY_REJECTION_REASONS.includes(rejectionCode)) throw new AppError('A valid rejection reason is required.', 400);
  if (rejectionCode === 'OTHER' && !String(reason || '').trim()) throw new AppError('Please provide a rejection explanation.', 400);
  const offer = await DeliveryOffer.findById(offerId);
  if (!offer) throw new AppError('Delivery offer not found', 404);
  if (String(offer.deliveryPartnerId) !== String(partnerId)) throw new AppError('You are not authorized to reject this offer', 403);
  if (offer.status === DELIVERY_OFFER_STATUS.REJECTED && requestId && offer.lastActionRequestId === requestId) return offer;
  if (offer.status !== DELIVERY_OFFER_STATUS.OFFERED) throw offerConflict(`Offer is no longer available (${offer.status}).`, 'DELIVERY_OFFER_NOT_CURRENT');

  const updated = await Logistics.findOneAndUpdate(
    {
      _id: logisticsId,
      currentOfferId: offer._id,
      currentOfferVersion: offer.version,
      status: DELIVERY_STATUS.ASSIGNED,
      deliveryPartnerId: partnerId,
    },
    {
      $set: { status: DELIVERY_STATUS.REJECTED, lastRejectedPartnerId: partnerId, rejectedAt: new Date(), rejectionReason: reason ? String(reason).trim().slice(0, 500) : rejectionCode },
      $unset: { deliveryPartnerId: 1 },
      $inc: { rejectionCount: 1 },
    },
    { new: true }
  );
  if (!updated) throw offerConflict('This offer is stale or was already answered.', 'DELIVERY_OFFER_STALE');
  const rejected = await DeliveryOffer.findOneAndUpdate(
    { _id: offer._id, status: DELIVERY_OFFER_STATUS.OFFERED },
    { $set: { status: DELIVERY_OFFER_STATUS.REJECTED, rejectedAt: new Date(), respondedAt: new Date(), rejectionCode, rejectionReason: reason ? String(reason).trim().slice(0, 500) : rejectionCode, lastActionRequestId: requestId || null } },
    { new: true }
  );
  const admins = await mongoose.model('User').find({ role: { $in: ['ADMIN', 'SUPER_ADMIN'] } }).select('_id').lean();
  await Promise.all(admins.map((admin) => notifyOfferRecipient(admin._id, 'Delivery offer rejected', `Order #${offer.orderId} requires reassignment. Rejections: ${updated.rejectionCount}.`, 'delivery:offerRejected', { offerId, logisticsId, orderId: offer.orderId, rejectionCount: updated.rejectionCount })));
  if (updated.rejectionCount >= 3) {
    await Promise.all(admins.map((admin) => notifyOfferRecipient(admin._id, 'Delivery escalation required', `Three or more partners rejected order #${offer.orderId}. Increase the amount and reassign.`, 'delivery:escalationRequired', { logisticsId, orderId: offer.orderId, rejectionCount: updated.rejectionCount })));
  }
  await logAction({ userId: partnerId, action: 'DELIVERY_OFFER_REJECTED', entity: 'DeliveryOffer', entityId: offer._id, details: 'Delivery partner rejected offer', data: { logisticsId, orderId: offer.orderId, rejectionCode, reason, rejectionCount: updated.rejectionCount }, severity: updated.rejectionCount >= 3 ? 'WARNING' : 'INFO' }).catch((error) => logger.warn('Offer rejection audit failed', { error: error.message }));
  emitDeliveryStatusUpdate(updated, DELIVERY_STATUS.ASSIGNED);
  return { offer: rejected, logistics: await repo.findById(updated._id) };
};

export const increaseDeliveryOfferAmount = async ({ logisticsId, offerId, deliveryPartnerId, deliveryAmount, actorId, idempotencyKey }) => {
  const current = await DeliveryOffer.findOne({ _id: offerId, logisticsId });
  if (!current) throw new AppError('Delivery offer not found', 404);
  const amount = validateDeliveryAmount(deliveryAmount);
  if (amount <= current.deliveryAmount) throw new AppError('New delivery amount must be higher than the current amount.', 400);
  const result = await createDeliveryOffer({ logisticsId, deliveryPartnerId: deliveryPartnerId || current.deliveryPartnerId, deliveryAmount: amount, actorId, idempotencyKey, forceReassign: true });
  await logAction({ userId: actorId, action: 'DELIVERY_OFFER_AMOUNT_UPDATED', entity: 'DeliveryOffer', entityId: result.offer._id, details: 'Admin increased delivery offer amount and created a replacement offer', data: { logisticsId, previousOfferId: offerId, previousAmount: current.deliveryAmount, deliveryAmount: amount }, severity: 'INFO' }).catch((error) => logger.warn('Offer amount audit failed', { error: error.message }));
  return result;
};
