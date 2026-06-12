import mongoose from 'mongoose';
import PaymentProof from './paymentProof.model.js';
import Order from '../order/order.model.js';
import AppError from '../../errors/AppError.js';
import { PAYMENT_PROOF_STATUS } from '../../constants/paymentProofStatus.js';
import { PAYMENT_STATUS } from '../../constants/paymentStatus.js';
import { ORDER_STATUS } from '../../constants/orderStatus.js';
import { getBankTransferDetails } from '../../config/payment.config.js';
import { sendNotification } from '../notification/notification.service.js';
import { logger } from '../../config/logger.js';

function resolveScreenshotUrl(file) {
  if (!file) return null;
  if (file.url) return file.url;
  if (file.cloudinary?.url) return file.cloudinary.url;
  if (file.s3?.url) return file.s3.url;
  if (file.filename) return `/uploads/payment-proofs/${file.filename}`;
  if (file.path) {
    const normalized = file.path.replace(/\\/g, '/');
    const idx = normalized.indexOf('/uploads/');
    if (idx >= 0) return normalized.slice(idx);
  }
  return null;
}

function isAwaitingPayment(order) {
  return (
    order.status === ORDER_STATUS.PENDING_PAYMENT &&
    order.paymentStatus !== PAYMENT_STATUS.PAID
  );
}

async function ensureBankTransferOrder(order) {
  const method = String(order.paymentMethod || '').toUpperCase();
  if (method === 'BANK_TRANSFER') {
    return order;
  }

  if (!isAwaitingPayment(order)) {
    throw new AppError('This order is not a bank transfer order', 400);
  }

  order.paymentMethod = 'BANK_TRANSFER';
  await order.save();
  logger.info('Order payment method switched to BANK_TRANSFER for proof upload', {
    orderId: order._id,
    previousMethod: method,
  });
  return order;
}

function normalizeProofStatus(status) {
  return String(status || '').trim().toUpperCase();
}

function isPendingProof(proof) {
  return normalizeProofStatus(proof?.status) === PAYMENT_PROOF_STATUS.PENDING;
}

function resolveProofAmount(order, transferredAmount) {
  const parsed =
    transferredAmount != null && transferredAmount !== ''
      ? Number(transferredAmount)
      : null;

  if (parsed != null && !Number.isNaN(parsed)) {
    if (parsed <= 0) {
      throw new AppError('Transfer amount must be greater than zero', 400);
    }
    return parsed;
  }

  return order.totalAmount;
}

export function getBankDetails() {
  return getBankTransferDetails();
}

export async function uploadPaymentProof(userId, { orderId, utrNumber, file, transferredAmount }) {
  if (!mongoose.Types.ObjectId.isValid(orderId)) {
    throw new AppError('Invalid order ID', 400);
  }

  const screenshot = resolveScreenshotUrl(file);
  if (!screenshot) {
    throw new AppError('Payment screenshot is required', 400);
  }

  const order = await Order.findById(orderId);
  if (!order) throw new AppError('Order not found', 404);
  if (order.userId.toString() !== userId.toString()) {
    throw new AppError('You can only submit payment proof for your own orders', 403);
  }

  await ensureBankTransferOrder(order);

  if (order.status !== ORDER_STATUS.PENDING_PAYMENT) {
    throw new AppError('Payment proof can only be submitted for orders awaiting payment', 400);
  }
  if (order.paymentStatus === PAYMENT_STATUS.PAID) {
    throw new AppError('This order is already paid', 400);
  }

  const existingProof = await PaymentProof.findOne({ orderId }).sort({ createdAt: -1 });

  if (existingProof?.status === PAYMENT_PROOF_STATUS.APPROVED) {
    throw new AppError('Payment for this order has already been approved', 400);
  }

  if (existingProof?.status === PAYMENT_PROOF_STATUS.PENDING) {
    throw new AppError('A payment proof is already pending verification', 400);
  }

  const proofAmount = resolveProofAmount(order, transferredAmount);

  let proof;

  if (existingProof?.status === PAYMENT_PROOF_STATUS.REJECTED) {
    existingProof.utrNumber = utrNumber.trim();
    existingProof.screenshot = screenshot;
    existingProof.status = PAYMENT_PROOF_STATUS.PENDING;
    existingProof.rejectionReason = null;
    existingProof.verifiedBy = null;
    existingProof.verifiedAt = null;
    existingProof.amount = proofAmount;
    proof = await existingProof.save();
  } else {
    proof = await PaymentProof.create({
      orderId,
      userId,
      amount: proofAmount,
      paymentMethod: 'BANK_TRANSFER',
      utrNumber: utrNumber.trim(),
      screenshot,
      status: PAYMENT_PROOF_STATUS.PENDING,
    });
  }

  if (order.paymentStatus === PAYMENT_STATUS.REJECTED) {
    order.paymentStatus = PAYMENT_STATUS.PENDING;
    await order.save();
  }

  return proof;
}

export async function getPendingPaymentProofs() {
  return PaymentProof.find({ status: PAYMENT_PROOF_STATUS.PENDING })
    .populate('orderId', '_id totalAmount status paymentStatus paymentMethod')
    .populate('userId', 'name email mobile companyName')
    .sort({ createdAt: -1 })
    .lean();
}

export async function getPaymentProofByOrderId(orderId, userId, userRole) {
  if (!mongoose.Types.ObjectId.isValid(orderId)) {
    throw new AppError('Invalid order ID', 400);
  }

  const order = await Order.findById(orderId);
  if (!order) throw new AppError('Order not found', 404);

  const isAdmin = userRole === 'ADMIN' || userRole === 'SUPER_ADMIN';
  if (!isAdmin && order.userId.toString() !== userId.toString()) {
    throw new AppError('Forbidden', 403);
  }

  const proof = await PaymentProof.findOne({ orderId })
    .populate('verifiedBy', 'name email')
    .sort({ updatedAt: -1 })
    .lean();

  return {
    proof,
    bankDetails: getBankTransferDetails(),
    order: {
      id: order._id,
      amount: order.totalAmount,
      paymentStatus: order.paymentStatus,
      status: order.status,
      paymentMethod: order.paymentMethod,
    },
  };
}

export async function approvePaymentProof(proofId, adminUserId) {
  if (!mongoose.Types.ObjectId.isValid(proofId)) {
    throw new AppError('Invalid payment proof ID', 400);
  }

  const proof = await PaymentProof.findById(proofId);
  if (!proof) throw new AppError('Payment proof not found', 404);

  const currentStatus = normalizeProofStatus(proof.status);
  if (currentStatus === PAYMENT_PROOF_STATUS.APPROVED) {
    return proof;
  }
  if (currentStatus !== PAYMENT_PROOF_STATUS.PENDING) {
    throw new AppError(
      `Only pending payment proofs can be approved (current status: ${proof.status || 'unknown'})`,
      400
    );
  }

  const order = await Order.findById(proof.orderId);
  if (!order) throw new AppError('Associated order not found', 404);
  await ensureBankTransferOrder(order);

  // Bank transfer: admin verifies UTR/screenshot manually — no amount validation.

  proof.status = PAYMENT_PROOF_STATUS.APPROVED;
  proof.verifiedBy = adminUserId;
  proof.verifiedAt = new Date();
  proof.rejectionReason = null;
  await proof.save();

  order.paymentStatus = PAYMENT_STATUS.PAID;
  order.status = ORDER_STATUS.PROCESSING;
  await order.save();

  try {
    const { finalizeReservation } = await import('../inventory/inventory.service.js');
    await finalizeReservation(order._id.toString());
  } catch (err) {
    logger.error('Failed to finalize inventory after bank transfer approval', {
      orderId: order._id,
      error: err.message,
    });
  }

  try {
    const { queuePostPaymentJobs } = await import('../../services/queueManager.service.js');
    await queuePostPaymentJobs({
      orderId: order._id.toString(),
      userId: order.userId.toString(),
      amount: order.totalAmount,
      paymentMethod: 'BANK_TRANSFER',
    });
  } catch (err) {
    logger.error('Failed to queue post-payment jobs after bank transfer approval', {
      orderId: order._id,
      error: err.message,
    });
  }

  try {
    const CartModel = mongoose.model('Cart');
    await CartModel.findOneAndUpdate({ userId: order.userId }, { $set: { items: [] } });
  } catch (err) {
    logger.error('Failed to clear cart after bank transfer approval', {
      orderId: order._id,
      error: err.message,
    });
  }

  try {
    await sendNotification({
      userId: order.userId,
      title: 'Payment Approved',
      message: `Your bank transfer payment for order #${order._id} has been verified. Your order is now being processed.`,
    });
  } catch (err) {
    logger.error('Failed to send payment approval notification', {
      orderId: order._id,
      proofId: proof._id,
      error: err.message,
    });
  }

  try {
    if (global.io) {
      global.io.emit('payment:bank-transfer:approved', {
        orderId: order._id,
        userId: order.userId,
        proofId: proof._id,
      });
    }
  } catch (err) {
    logger.error('Failed to emit payment approval socket event', {
      orderId: order._id,
      proofId: proof._id,
      error: err.message,
    });
  }

  return proof;
}

export async function rejectPaymentProof(proofId, adminUserId, reason) {
  if (!mongoose.Types.ObjectId.isValid(proofId)) {
    throw new AppError('Invalid payment proof ID', 400);
  }

  const proof = await PaymentProof.findById(proofId);
  if (!proof) throw new AppError('Payment proof not found', 404);
  if (!isPendingProof(proof)) {
    throw new AppError(
      `Only pending payment proofs can be rejected (current status: ${proof.status || 'unknown'})`,
      400
    );
  }

  const order = await Order.findById(proof.orderId);
  if (!order) throw new AppError('Associated order not found', 404);

  proof.status = PAYMENT_PROOF_STATUS.REJECTED;
  proof.rejectionReason = reason.trim();
  proof.verifiedBy = adminUserId;
  proof.verifiedAt = new Date();
  await proof.save();

  order.paymentStatus = PAYMENT_STATUS.REJECTED;
  await order.save();

  try {
    await sendNotification({
      userId: order.userId,
      title: 'Payment Rejected',
      message: `Your bank transfer payment for order #${order._id} was rejected. Reason: ${reason.trim()}. Please resubmit payment proof.`,
    });
  } catch (err) {
    logger.error('Failed to send payment rejection notification', {
      orderId: order._id,
      proofId: proof._id,
      error: err.message,
    });
  }

  try {
    if (global.io) {
      global.io.emit('payment:bank-transfer:rejected', {
        orderId: order._id,
        userId: order.userId,
        proofId: proof._id,
        reason: reason.trim(),
      });
    }
  } catch (err) {
    logger.error('Failed to emit payment rejection socket event', {
      orderId: order._id,
      proofId: proof._id,
      error: err.message,
    });
  }

  return proof;
}
