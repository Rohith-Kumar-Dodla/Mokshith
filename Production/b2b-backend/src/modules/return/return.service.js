import mongoose from 'mongoose';
import ReturnRequest, { RETURN_STATUS } from './return.model.js';
import Order from '../order/order.model.js';
import Refund from '../payment/refund.model.js';
import Payment from '../payment/payment.model.js';
import Logistics from '../logistics/logistics.model.js';
import Warehouse from '../warehouse/warehouse.model.js';
import AppError from '../../errors/AppError.js';
import { ORDER_STATUS } from '../../constants/orderStatus.js';
import { PAYMENT_STATUS } from '../../constants/paymentStatus.js';
import { ROLES } from '../../constants/roles.js';
import { restoreStock, checkStock, reduceStock } from '../inventory/inventory.service.js';
import { createShipment } from '../logistics/logistics.service.js';
import { createRefund as gatewayCreateRefund } from '../payment/payment.gateway.js';
import { logAction } from '../audit/audit.service.js';
import { sendNotification } from '../notification/notification.service.js';
import { publishSuperAdminEvent } from '../notification/businessNotification.service.js';
import { redisClient } from '../../config/redis.js';

const ADMIN_ROLES = [ROLES.ADMIN, ROLES.SUPER_ADMIN];
const ELIGIBLE_ORDER_STATUSES = [ORDER_STATUS.DELIVERED, ORDER_STATUS.COMPLETED];

const assertAdmin = user => { if (!ADMIN_ROLES.includes(user?.role)) throw new AppError('Forbidden', 403); };
const addHistory = (request, status, actor, note = '') => request.history.push({ status, actorId: actor?._id, actorRole: actor?.role, note });
const money = value => Math.round((Number(value) + Number.EPSILON) * 100) / 100;
const unitRefundValue = (order, item) => {
  const netUnit = Number(item.finalPrice ?? item.price ?? 0);
  if (item.gstAmount != null && Number(item.quantity || 0) > 0) return money(netUnit + Number(item.gstAmount) / Number(item.quantity));
  const itemSubtotal = Number(order.subtotal || 0);
  const lineBase = netUnit * Number(item.quantity || 0);
  const allocatedTax = itemSubtotal > 0 ? Number(order.taxAmount || 0) * (lineBase / itemSubtotal) : 0;
  return money(netUnit + (Number(item.quantity) ? allocatedTax / Number(item.quantity) : 0));
};

async function notifyCustomer(request, title, message) {
  await sendNotification({ force: true, userId: request.customerId, category: 'ORDER', type: 'ORDER', eventType: `RETURN_${request.status}`, title, message, entityType: 'RETURN_REQUEST', entityId: request._id, actionUrl: `/vendor/returns/${request._id}`, eventKey: `return:${request._id}:${request.status}`, severity: ['REJECTED', 'FAILED'].includes(request.status) ? 'WARNING' : 'INFO' }).catch(() => {});
}
async function audit(action, request, actor, note = '') {
  await logAction({ userId: actor?._id, role: actor?.role, action, entity: 'RETURN_REQUEST', entityId: request._id, details: note || action, data: { orderId: request.orderId, status: request.status } }).catch(() => {});
}

export async function createReturn(data, user) {
  const lockKey = `lock:return:create:${data.orderId}`;
  const lockValue = `${user._id}:${Date.now()}`;
  if (!(await redisClient.acquireLock(lockKey, lockValue, 20))) throw new AppError('A return request for this order is already being processed', 409);
  try {
    const order = await Order.findOne({ _id: data.orderId, userId: user._id });
    if (!order) throw new AppError('Order not found', 404);
    if (!ELIGIBLE_ORDER_STATUSES.includes(order.status)) throw new AppError('Only delivered or completed orders are eligible for return', 409);
    if (order.paymentStatus !== PAYMENT_STATUS.PAID) throw new AppError('Only paid orders are eligible for return', 409);
    const existingKey = await ReturnRequest.findOne({ orderId: order._id, idempotencyKey: data.idempotencyKey });
    if (existingKey) return existingKey;

    const active = await ReturnRequest.find({ orderId: order._id, status: { $nin: [RETURN_STATUS.REJECTED, RETURN_STATUS.CANCELLED, RETURN_STATUS.FAILED] } }).select('items status').lean();
    const requestedIds = new Set();
    const items = data.items.map(input => {
      if (requestedIds.has(String(input.orderItemId))) throw new AppError('Duplicate return item', 400);
      requestedIds.add(String(input.orderItemId));
      const orderItem = order.items.id(input.orderItemId);
      if (!orderItem) throw new AppError('Order item not found', 400);
      const alreadyClaimed = active.reduce((sum, request) => sum + request.items.filter(item => String(item.orderItemId) === String(orderItem._id)).reduce((n, item) => n + Number(item.requestedQuantity), 0), 0);
      const remaining = Number(orderItem.quantity) - alreadyClaimed;
      if (input.requestedQuantity > remaining) throw new AppError(`Requested quantity exceeds remaining returnable quantity (${remaining})`, 409);
      return { orderItemId: orderItem._id, productId: orderItem.productId, name: orderItem.name, orderedQuantity: orderItem.quantity, requestedQuantity: input.requestedQuantity, unitRefundAmount: unitRefundValue(order, orderItem) };
    });

    const request = await ReturnRequest.create({ orderId: order._id, customerId: user._id, requestedBy: user._id, reason: data.reason, reasonDetails: data.reasonDetails, requestedResolution: data.requestedResolution, items, idempotencyKey: data.idempotencyKey, history: [{ status: RETURN_STATUS.REQUESTED, actorId: user._id, actorRole: user.role, note: 'Return requested' }] });
    await audit('RETURN_REQUESTED', request, user);
    await notifyCustomer(request, 'Return requested', `Your return request for order #${order._id} was submitted.`);
    await publishSuperAdminEvent('RETURN_REQUESTED', { entityType: 'RETURN_REQUEST', entityId: request._id, actorId: user._id, businessKey: 'requested', reference: String(order._id), message: `A return was requested for order #${order._id}.` });
    return request;
  } finally { await redisClient.releaseLock(lockKey, lockValue).catch(() => {}); }
}

export async function listReturns(query, user) {
  const page = Number(query.page || 1); const limit = Math.min(Number(query.limit || 20), 100);
  const filter = ADMIN_ROLES.includes(user.role) ? {} : { customerId: user._id };
  if (query.status && query.status !== 'all') filter.status = query.status;
  if (query.search && mongoose.isValidObjectId(query.search)) filter.$or = [{ _id: query.search }, { orderId: query.search }];
  const [items, total] = await Promise.all([
    ReturnRequest.find(filter).populate('customerId', 'name email mobile').populate('orderId', 'status totalAmount paymentMethod createdAt').sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
    ReturnRequest.countDocuments(filter),
  ]);
  return { returns: items, pagination: { page, limit, total, pages: Math.max(1, Math.ceil(total / limit)) } };
}

export async function getReturn(id, user) {
  const request = await ReturnRequest.findById(id).populate('customerId', 'name email mobile').populate('orderId').populate('pickupLogisticsId').populate('refundId').populate('replacementOrderId').lean();
  if (!request) throw new AppError('Return request not found', 404);
  if (!ADMIN_ROLES.includes(user.role) && String(request.customerId?._id || request.customerId) !== String(user._id)) throw new AppError('Forbidden', 403);
  return request;
}

async function loadForAdmin(id, user) { assertAdmin(user); const request = await ReturnRequest.findById(id); if (!request) throw new AppError('Return request not found', 404); return request; }
const requireStatus = (request, allowed) => { if (!allowed.includes(request.status)) throw new AppError(`Return cannot be processed from status ${request.status}`, 409); };

export async function cancelReturn(id, user) {
  const request = await ReturnRequest.findOne({ _id: id, customerId: user._id });
  if (!request) throw new AppError('Return request not found', 404);
  requireStatus(request, [RETURN_STATUS.REQUESTED]); request.status = RETURN_STATUS.CANCELLED; addHistory(request, request.status, user, 'Cancelled by customer'); await request.save(); await audit('RETURN_CANCELLED', request, user); return request;
}

export async function approveReturn(id, user) {
  const request = await loadForAdmin(id, user); requireStatus(request, [RETURN_STATUS.REQUESTED]);
  request.items.forEach(item => { item.approvedQuantity = item.requestedQuantity; }); request.status = RETURN_STATUS.APPROVED; request.approvedAt = new Date(); request.approvedBy = user._id;
  const [order, warehouse] = await Promise.all([Order.findById(request.orderId).populate('userId'), Warehouse.findOne({ isActive: true })]);
  if (order && warehouse) {
    const customerAddress = order.address || order.shippingAddress || {};
    const pickup = await Logistics.findOneAndUpdate(
      { returnRequestId: request._id },
      { $setOnInsert: { orderId: order._id, returnRequestId: request._id, contextType: 'RETURN_PICKUP', warehouseId: warehouse._id, pickupWarehouseId: warehouse._id, pickupWarehouseName: warehouse.name || '', pickupAddress: customerAddress.addressLine || 'Customer address', address: warehouse.location?.address || warehouse.name || 'Return warehouse', customerName: order.userId?.name || customerAddress.name || 'Customer', phone: customerAddress.phone || order.userId?.mobile || 'N/A', trackingNumber: `RET-${request._id}`, status: 'PENDING' } },
      { upsert: true, new: true }
    );
    request.pickupLogisticsId = pickup._id;
  }
  addHistory(request, request.status, user, 'Return approved'); await request.save();
  await audit('RETURN_APPROVED', request, user); await notifyCustomer(request, 'Return approved', 'Your return request was approved.'); await publishSuperAdminEvent('RETURN_APPROVED', { entityType: 'RETURN_REQUEST', entityId: request._id, actorId: user._id, businessKey: 'approved', reference: String(request.orderId), message: `Return ${request._id} was approved.` }); return request;
}

export async function rejectReturn(id, note, user) {
  const request = await loadForAdmin(id, user); requireStatus(request, [RETURN_STATUS.REQUESTED]); request.status = RETURN_STATUS.REJECTED; request.rejectedAt = new Date(); request.rejectedBy = user._id; addHistory(request, request.status, user, note); await request.save(); await audit('RETURN_REJECTED', request, user, note); await notifyCustomer(request, 'Return rejected', note); return request;
}

export async function receiveReturn(id, data, user) {
  const request = await loadForAdmin(id, user); requireStatus(request, [RETURN_STATUS.APPROVED, RETURN_STATUS.PICKUP_ASSIGNED, RETURN_STATUS.PICKED_UP]);
  for (const input of data.items) { const item = request.items.id(input.itemId); if (!item) throw new AppError('Return item not found', 400); if (input.receivedQuantity > item.approvedQuantity) throw new AppError('Received quantity exceeds approved quantity', 400); item.receivedQuantity = input.receivedQuantity; }
  request.status = RETURN_STATUS.RECEIVED; addHistory(request, request.status, user, data.note || 'Return received'); await request.save(); await audit('RETURN_RECEIVED', request, user); await notifyCustomer(request, 'Return received', 'Your returned items were received for inspection.'); return request;
}

export async function inspectReturn(id, data, user) {
  const request = await loadForAdmin(id, user); requireStatus(request, [RETURN_STATUS.RECEIVED]);
  for (const input of data.items) { const item = request.items.id(input.itemId); if (!item) throw new AppError('Return item not found', 400); if (input.acceptedQuantity > item.receivedQuantity) throw new AppError('Accepted quantity exceeds received quantity', 400); item.acceptedQuantity = input.acceptedQuantity; item.rejectedQuantity = item.receivedQuantity - input.acceptedQuantity; item.condition = input.condition; item.inspectionNotes = input.notes || ''; }
  if (!request.items.some(item => item.acceptedQuantity > 0)) throw new AppError('At least one received item must be accepted before resolution', 409);
  if (!request.inventoryRestored) { for (const item of request.items) if (item.acceptedQuantity > 0 && item.condition === 'SELLABLE') await restoreStock(item.productId, item.acceptedQuantity); request.inventoryRestored = true; }
  request.finalResolution = data.resolution; request.status = RETURN_STATUS.RESOLUTION_PENDING; request.inspectedAt = new Date(); request.inspectedBy = user._id; addHistory(request, request.status, user, data.note || 'Inspection completed'); await request.save(); await audit('RETURN_INSPECTED', request, user); await notifyCustomer(request, 'Return inspected', `Inspection completed. Resolution: ${data.resolution}.`); await publishSuperAdminEvent('RETURN_INSPECTION_REQUIRED', { entityType: 'RETURN_REQUEST', entityId: request._id, actorId: user._id, businessKey: 'inspected', reference: String(request.orderId), message: `Return ${request._id} was inspected and awaits resolution.` }); return request;
}

export async function refundReturn(id, user) {
  const request = await loadForAdmin(id, user); requireStatus(request, [RETURN_STATUS.RESOLUTION_PENDING, RETURN_STATUS.REFUND_PENDING]);
  if (request.finalResolution !== 'REFUND') throw new AppError('Return is not approved for refund', 409);
  if (request.refundId) return ReturnRequest.findById(id);
  const order = await Order.findById(request.orderId); const amount = money(request.items.reduce((sum, item) => sum + item.unitRefundAmount * item.acceptedQuantity, 0)); if (amount <= 0) throw new AppError('No refundable quantity', 409);
  const payment = await Payment.findOne({ orderId: order._id, status: 'SUCCESS' }).sort({ createdAt: -1 }); const online = ['ONLINE', 'RAZORPAY', 'UPI', 'CARD', 'HYBRID'].includes(order.paymentMethod) && payment?.razorpayPaymentId;
  const refund = await Refund.create({ orderId: order._id, paymentId: payment?._id, userId: order.userId, amount, refundType: amount >= order.totalAmount ? 'FULL' : 'PARTIAL', status: online ? 'PROCESSING' : 'MANUAL_REFUND_REQUIRED', razorpayPaymentId: payment?.razorpayPaymentId, reason: `Return ${request._id}`, initiatedBy: user._id, returnRequestId: request._id, refundMethod: online ? 'GATEWAY' : order.paymentMethod === 'CREDIT' ? 'CREDIT' : 'MANUAL', inventoryRestored: request.inventoryRestored });
  request.refundId = refund._id; request.refundAmount = amount; request.status = RETURN_STATUS.REFUND_PENDING; addHistory(request, request.status, user, online ? 'Gateway refund initiated' : 'Manual refund required'); await request.save(); await audit('RETURN_REFUND_INITIATED', request, user); await publishSuperAdminEvent('RETURN_REFUND_ACTION', { entityType: 'RETURN_REQUEST', entityId: request._id, actorId: user._id, businessKey: String(refund._id), reference: String(order._id), message: `Refund action for return ${request._id}: ${refund.status}.` });
  if (!online) { await notifyCustomer(request, 'Refund pending', `A manual refund of ₹${amount.toFixed(2)} requires processing.`); return request; }
  try { const result = await gatewayCreateRefund({ paymentId: payment.razorpayPaymentId, amount, notes: { order_id: String(order._id), return_request_id: String(request._id) }, receipt: `return_${request._id}` }); await refund.markSuccess(result.refund_id, result); request.status = RETURN_STATUS.REFUNDED; addHistory(request, request.status, user, 'Refund completed'); await request.save(); await audit('RETURN_REFUNDED', request, user); await notifyCustomer(request, 'Refund completed', `Your refund of ₹${amount.toFixed(2)} was completed.`); return request; } catch (error) { await refund.markFailed(error); request.status = RETURN_STATUS.FAILED; addHistory(request, request.status, user, 'Refund failed'); await request.save(); await audit('RETURN_REFUND_FAILED', request, user, error.message); throw new AppError(`Refund failed: ${error.message}`, 500); }
}

export async function replaceReturn(id, user) {
  const request = await loadForAdmin(id, user); if (request.replacementOrderId) return request; requireStatus(request, [RETURN_STATUS.RESOLUTION_PENDING, RETURN_STATUS.REPLACEMENT_PENDING]); if (request.finalResolution !== 'REPLACEMENT') throw new AppError('Return is not approved for replacement', 409);
  const original = await Order.findById(request.orderId).populate('userId'); const items = request.items.filter(item => item.acceptedQuantity > 0).map(item => ({ productId: item.productId, name: item.name, price: 0, finalPrice: 0, quantity: item.acceptedQuantity }));
  for (const item of items) await checkStock(item.productId, item.quantity);
  const reduced = [];
  try { for (const item of items) { await reduceStock(item.productId, item.quantity); reduced.push(item); }
    const replacement = await Order.create({ userId: original.userId._id, items, totalAmount: 0, subtotal: 0, taxAmount: 0, paymentMethod: original.paymentMethod, paymentStatus: PAYMENT_STATUS.PAID, status: ORDER_STATUS.CONFIRMED, address: original.address, shippingAddress: original.shippingAddress, returnRequestId: request._id, replacementForOrderId: original._id, metadata: { replacement: true } });
    const warehouses = await Warehouse.find({ isActive: true }); await createShipment(replacement, warehouses);
    request.replacementOrderId = replacement._id; request.items.forEach(item => { item.replacementQuantity = item.acceptedQuantity; }); request.status = RETURN_STATUS.REPLACEMENT_CREATED; addHistory(request, request.status, user, 'Replacement order created'); await request.save(); await audit('RETURN_REPLACEMENT_CREATED', request, user); await notifyCustomer(request, 'Replacement created', `Replacement order #${replacement._id} was created.`); await publishSuperAdminEvent('RETURN_REPLACEMENT_CREATED', { entityType: 'RETURN_REQUEST', entityId: request._id, actorId: user._id, businessKey: String(replacement._id), reference: String(original._id), message: `Replacement order #${replacement._id} was created.` }); return request;
  } catch (error) { for (const item of reduced) await restoreStock(item.productId, item.quantity).catch(() => {}); throw error; }
}
