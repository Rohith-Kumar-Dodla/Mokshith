import AppError from '../../errors/AppError.js';
import { ORDER_STATUS } from '../../constants/orderStatus.js';
import { DELIVERY_STATUS } from '../../constants/deliveryStatus.js';
import { validateTransition } from './order.workflow.js';
import { logger } from '../../config/logger.js';
import Order from './order.model.js';

export const LOGISTICS_TO_ORDER_STATUS = {
  [DELIVERY_STATUS.PENDING]: ORDER_STATUS.ASSIGNED,
  [DELIVERY_STATUS.ASSIGNED]: ORDER_STATUS.ASSIGNED,
  [DELIVERY_STATUS.ACCEPTED]: ORDER_STATUS.ACCEPTED,
  [DELIVERY_STATUS.PICKED]: ORDER_STATUS.PICKED_UP,
  [DELIVERY_STATUS.OUT_FOR_DELIVERY]: ORDER_STATUS.OUT_FOR_DELIVERY,
  [DELIVERY_STATUS.DELIVERED]: ORDER_STATUS.DELIVERED,
  [DELIVERY_STATUS.COMPLETED]: ORDER_STATUS.COMPLETED,
  [DELIVERY_STATUS.FAILED]: ORDER_STATUS.DELIVERY_FAILED,
  [DELIVERY_STATUS.CANCELLED]: ORDER_STATUS.CANCELLED,
};

const DELIVERY_PHASE_STATUSES = new Set([
  ORDER_STATUS.ASSIGNED,
  ORDER_STATUS.ACCEPTED,
  ORDER_STATUS.OUT_FOR_PICKUP,
  ORDER_STATUS.PICKED_UP,
  ORDER_STATUS.OUT_FOR_DELIVERY,
  ORDER_STATUS.DELIVERED,
  ORDER_STATUS.COMPLETED,
  ORDER_STATUS.DELIVERY_FAILED,
  ORDER_STATUS.CUSTOMER_UNAVAILABLE,
]);

const ORDER_PROGRESS_RANK = {
  [ORDER_STATUS.CREATED]: 0,
  [ORDER_STATUS.PENDING_PAYMENT]: 0,
  [ORDER_STATUS.PENDING]: 0,
  [ORDER_STATUS.FAILED]: -1,
  [ORDER_STATUS.CANCELLED]: -1,
  [ORDER_STATUS.CONFIRMED]: 10,
  [ORDER_STATUS.PROCESSING]: 20,
  [ORDER_STATUS.PACKED]: 30,
  [ORDER_STATUS.READY_TO_DISPATCH]: 40,
  [ORDER_STATUS.SHIPPED]: 50,
  [ORDER_STATUS.ASSIGNED]: 60,
  [ORDER_STATUS.ACCEPTED]: 70,
  [ORDER_STATUS.OUT_FOR_PICKUP]: 75,
  [ORDER_STATUS.PICKED_UP]: 80,
  [ORDER_STATUS.OUT_FOR_DELIVERY]: 90,
  [ORDER_STATUS.DELIVERED]: 100,
  [ORDER_STATUS.COMPLETED]: 110,
  [ORDER_STATUS.RETURNED]: 120,
  [ORDER_STATUS.REFUNDED]: 130,
  [ORDER_STATUS.DELIVERY_FAILED]: -2,
  [ORDER_STATUS.CUSTOMER_UNAVAILABLE]: -2,
  [ORDER_STATUS.REJECTED]: -2,
};

export function mapLogisticsStatusToOrderStatus(logisticsStatus) {
  return LOGISTICS_TO_ORDER_STATUS[logisticsStatus] || null;
}

export function shouldApplyDeliveryOrderStatus(currentStatus, nextStatus) {
  if (!nextStatus || currentStatus === nextStatus) {
    return false;
  }

  const currentRank = ORDER_PROGRESS_RANK[currentStatus] ?? 0;
  const nextRank = ORDER_PROGRESS_RANK[nextStatus] ?? 0;

  if (nextRank < 0) {
    return true;
  }

  if (DELIVERY_PHASE_STATUSES.has(nextStatus) && !DELIVERY_PHASE_STATUSES.has(currentStatus)) {
    return true;
  }

  return nextRank > currentRank;
}

export function emitOrderStatusUpdate(order, previousStatus, meta = {}) {
  if (!global.io) return;

  const payload = {
    orderId: order._id,
    status: order.status,
    previousStatus,
    statusHistory: order.statusHistory,
    updatedAt: order.updatedAt,
    logisticsStatus: meta.logisticsStatus || null,
    deliveryPartnerId: meta.deliveryPartnerId || null,
  };

  global.io.emit('order:statusUpdated', payload);
  global.io.emit('delivery:statusUpdated', {
    ...payload,
    shipmentId: meta.shipmentId || null,
    orderStatus: order.status,
    logisticsStatus: meta.logisticsStatus || null,
  });
}

export async function applyOrderStatusUpdate(
  orderId,
  newStatus,
  actor = {},
  { note = '', source = 'admin', logisticsStatus = null, shipmentId = null } = {}
) {
  const order = await Order.findById(orderId);
  if (!order) {
    throw new AppError('Order not found', 404);
  }

  const previousStatus = order.status;
  if (previousStatus === newStatus) {
    return order;
  }

  if (source === 'delivery') {
    if (!shouldApplyDeliveryOrderStatus(previousStatus, newStatus)) {
      return order;
    }
  } else {
    validateTransition(previousStatus, newStatus);
  }

  const historyNote =
    note ||
    (source === 'delivery' && logisticsStatus
      ? `Delivery status ${logisticsStatus} → ${newStatus}`
      : `Status changed from ${previousStatus} to ${newStatus}`);

  order.status = newStatus;
  order.statusHistory = order.statusHistory || [];
  order.statusHistory.push({
    status: newStatus,
    changedBy: actor.id || actor._id || null,
    changedAt: new Date(),
    note: historyNote,
  });

  await order.save();

  try {
    const Audit = (await import('../audit/audit.model.js')).default;
    await Audit.create({
      userId: actor.id || actor._id,
      userEmail: actor.email,
      role: actor.role,
      action: source === 'delivery' ? 'ORDER_STATUS_SYNCED_FROM_DELIVERY' : 'ORDER_STATUS_UPDATED',
      entity: 'ORDER',
      entityId: order._id,
      details: `Order ${order._id} status: ${previousStatus} → ${newStatus}`,
      severity: 'INFO',
    });
  } catch (auditError) {
    logger.warn('Failed to create order status audit log', { error: auditError.message });
  }

  emitOrderStatusUpdate(order, previousStatus, {
    logisticsStatus,
    shipmentId,
    deliveryPartnerId: actor.id || actor._id,
  });

  return order;
}

export async function syncOrderStatusFromLogistics(orderId, logisticsStatus, actor = {}, options = {}) {
  const mappedStatus = mapLogisticsStatusToOrderStatus(logisticsStatus);
  if (!mappedStatus) {
    return null;
  }

  return applyOrderStatusUpdate(orderId, mappedStatus, actor, {
    source: 'delivery',
    logisticsStatus,
    note: options.note,
    shipmentId: options.shipmentId,
  });
}
