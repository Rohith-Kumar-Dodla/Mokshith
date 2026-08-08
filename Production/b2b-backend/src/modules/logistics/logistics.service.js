import * as repo from './logistics.repository.js';
import Logistics from './logistics.model.js';
import AppError from '../../errors/AppError.js';
import { optimizeRoute } from './routeOptimization.js';
import Order from '../order/order.model.js';
import { DELIVERY_STATUS } from '../../constants/deliveryStatus.js';
import { ORDER_STATUS } from '../../constants/orderStatus.js';
import { sendNotification } from '../notification/notification.service.js';
import { logger } from '../../config/logger.js';
import mongoose from 'mongoose';
import { logAction } from '../audit/audit.service.js';

const LOGISTICS_TRANSITIONS = {
  [DELIVERY_STATUS.ASSIGNED]: [DELIVERY_STATUS.ACCEPTED],
  [DELIVERY_STATUS.ACCEPTED]: [DELIVERY_STATUS.PICKED],
  [DELIVERY_STATUS.PICKED]: [DELIVERY_STATUS.OUT_FOR_DELIVERY],
  [DELIVERY_STATUS.OUT_FOR_DELIVERY]: [DELIVERY_STATUS.DELIVERED],
  [DELIVERY_STATUS.DELIVERED]: [DELIVERY_STATUS.COMPLETED],
};

const ORDER_STATUS_FROM_LOGISTICS = {
  [DELIVERY_STATUS.ASSIGNED]: ORDER_STATUS.PROCESSING,
  [DELIVERY_STATUS.ACCEPTED]: ORDER_STATUS.PROCESSING,
  [DELIVERY_STATUS.PICKED]: ORDER_STATUS.PACKED,
  [DELIVERY_STATUS.OUT_FOR_DELIVERY]: ORDER_STATUS.OUT_FOR_DELIVERY,
  [DELIVERY_STATUS.DELIVERED]: ORDER_STATUS.DELIVERED,
  [DELIVERY_STATUS.COMPLETED]: ORDER_STATUS.COMPLETED,
  // REJECTED intentionally omitted — do not mutate order commerce status
};

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

const ORDER_STATUS_RANK = {
  [ORDER_STATUS.CREATED]: 0,
  [ORDER_STATUS.PENDING_PAYMENT]: 0,
  [ORDER_STATUS.PENDING]: 0,
  [ORDER_STATUS.CONFIRMED]: 1,
  [ORDER_STATUS.PROCESSING]: 2,
  [ORDER_STATUS.PACKED]: 3,
  [ORDER_STATUS.OUT_FOR_DELIVERY]: 4,
  [ORDER_STATUS.DELIVERED]: 5,
  [ORDER_STATUS.COMPLETED]: 6,
};

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

function emitDeliveryStatusUpdate(shipment, orderStatus) {
  if (!global.io) return;

  const orderId = resolveOrderId(shipment.orderId);
  global.io.emit('delivery:statusUpdated', {
    shipmentId: shipment._id,
    orderId,
    logisticsStatus: shipment.status,
    orderStatus,
    deliveryPartnerId: shipment.deliveryPartnerId?._id || shipment.deliveryPartnerId,
    updatedAt: shipment.updatedAt,
  });
}

async function syncOrderStatusFromLogistics(orderId, logisticsStatus) {
  const nextOrderStatus = ORDER_STATUS_FROM_LOGISTICS[logisticsStatus];
  if (!nextOrderStatus) return null;

  const order = await Order.findById(orderId);
  if (!order) return null;

  const currentRank = ORDER_STATUS_RANK[order.status] ?? 0;
  const nextRank = ORDER_STATUS_RANK[nextOrderStatus] ?? 0;

  if (nextRank > currentRank) {
    order.status = nextOrderStatus;
    await order.save();
    return nextOrderStatus;
  }

  return order.status;
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

export const createShipment = async (order, warehouses) => {
  if (!order) throw new AppError('Order not found', 404);

  const existing = await repo.findByOrder(order._id);
  if (existing) {
    await Order.findByIdAndUpdate(order._id, { shipmentId: existing._id });
    return existing;
  }

  const selectedWarehouse = optimizeRoute(warehouses);
  const user = order.userId;
  const defaultAddress = order.address || order.shippingAddress || user?.addresses?.[0] || {};
  const fullAddress = defaultAddress.addressLine
    ? `${defaultAddress.addressLine}, ${defaultAddress.city || ''}, ${defaultAddress.state || ''} - ${defaultAddress.pincode || ''}`
    : 'Address not provided';

  const shipment = await repo.createShipment({
    orderId: order._id,
    warehouseId: selectedWarehouse?._id,
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

  // 5. Emit socket event
  if (global.io) {
    global.io.emit('delivery:assigned', {
      orderId: order._id,
      deliveryPartnerId: chosenPartner._id,
      shipmentId: shipment._id
    });
  }

  console.log(`Order ${orderId} auto-assigned to ${chosenPartner.name}`);
  return shipment;
};

export const getDeliveryQueue = async (user) => {
  if (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') {
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

export const getDeliveryHistory = async (user) => {
  if (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') {
    return repo.findAllDelivered();
  }
  return repo.findByPartner(user._id, ['DELIVERED', 'COMPLETED', 'CANCELLED', 'FAILED']);
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

  const orderStatus = await syncOrderStatusFromLogistics(resolveOrderId(populated.orderId), status);
  emitDeliveryStatusUpdate(populated, orderStatus);
  await notifyDeliveryStakeholders(populated, status);

  return populated;
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

export const getShipmentById = async (id) => {
  const shipment = await repo.findById(id);
  if (!shipment) throw new AppError('Shipment not found', 404);
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

export const updateLocation = async (id, location) => {
  const shipment = await repo.updateShipment(id, { currentLocation: location });
  if (!shipment) throw new AppError('Shipment not found', 404);
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

export const assignDeliveryPartner = async (shipmentId, deliveryPartnerId) => {
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
  const orderStatus = await syncOrderStatusFromLogistics(
    linkedOrderId,
    DELIVERY_STATUS.ASSIGNED
  );

  if (global.io) {
    global.io.emit('delivery:assigned', {
      orderId: populated.orderId?._id || populated.orderId,
      deliveryPartnerId,
      shipmentId: populated._id,
      logisticsStatus: DELIVERY_STATUS.ASSIGNED,
      orderStatus,
    });
    emitDeliveryStatusUpdate(populated, orderStatus);
  }

  await notifyDeliveryStakeholders(populated, DELIVERY_STATUS.ASSIGNED);

  return populated;
};

export const reassignDeliveryPartner = async (shipmentId, deliveryPartnerId) => {
  const shipment = await repo.findById(shipmentId);
  if (!shipment) throw new AppError('Shipment not found', 404);

  if (TERMINAL_ASSIGNMENT_STATUSES.has(shipment.status)) {
    throw new AppError('Cannot reassign a completed delivery', 400);
  }

  if ([DELIVERY_STATUS.PICKED, DELIVERY_STATUS.OUT_FOR_DELIVERY].includes(shipment.status)) {
    throw new AppError('Cannot reassign a delivery that is already in transit', 400);
  }

  return assignDeliveryPartner(shipmentId, deliveryPartnerId);
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
    ? await repo.findByPartner(user._id, ['DELIVERED', 'CANCELLED', 'FAILED'])
    : await repo.findAllDelivered();

  const earnings = history.reduce((sum, shipment) => {
    const order = shipment.orderId;
    const amount = typeof order === 'object' ? Number(order?.totalAmount || 0) : 0;
    return sum + Math.round(amount * 0.05);
  }, 0);

  return {
    totalDeliveries: activeCount + completedCount + failedCount,
    activeDeliveries: activeCount,
    completedDeliveries: completedCount,
    failedDeliveries: failedCount,
    completionRate,
    acceptanceRate,
    earnings,
    averageRating: completedCount > 0 ? 4.8 : 0,
    statusBreakdown: statusCounts,
  };
};