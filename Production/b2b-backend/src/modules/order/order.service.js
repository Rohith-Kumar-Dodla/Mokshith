import * as cartRepo from '../cart/cart.repository.js';
import * as orderRepo from './order.repository.js';
import * as creditRepo from '../credit/credit.repository.js';
import Product from '../product/product.model.js';
import Order from './order.model.js';
import User from '../user/user.model.js';
import Logistics from '../logistics/logistics.model.js';

import AppError from '../../errors/AppError.js';
import { validateTransition } from './order.workflow.js';

import { generateInvoice, getInvoiceByOrderId } from '../invoice/invoice.service.js';
import { sendNotification } from '../notification/notification.service.js';

import { onOrderCreated } from './order.events.js';
import { trackOrder } from '../analytics/analytics.events.js';

import { checkStock, reduceStock, reserveInventory } from '../inventory/inventory.service.js';
import { deductCredit } from '../credit/credit.service.js';
import { createShipment } from '../logistics/logistics.service.js';
import { assignDelivery } from '../../services/deliveryAssignment.service.js';
import Warehouse from '../warehouse/warehouse.model.js';
import { fetchSetting } from '../settings/settings.service.js';

import { ORDER_STATUS } from '../../constants/orderStatus.js';
import { PAYMENT_STATUS } from '../../constants/paymentStatus.js';
import { logger } from '../../config/logger.js';

import mongoose from 'mongoose';
import { getTransactionSupport } from '../../config/db.js';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const createOrder = async (userId, data) => {
  const { paymentMethod = 'COD', shippingAddress, items: requestItems, idempotencyKey } = data;

  // 🔥 0. Idempotency Check
  if (idempotencyKey) {
    const existingOrder = await Order.findOne({ idempotencyKey, userId }).lean();
    if (existingOrder) return existingOrder;
  }

  // 🔥 0. Validation
  if (!shippingAddress) throw new AppError('Shipping address is required', 400);
  if (!mongoose.Types.ObjectId.isValid(userId)) throw new AppError('Invalid user ID', 400);
  
  // 🔥 Check Maintenance Mode
  const maintenance = await fetchSetting('maintenanceMode');
  const maintenanceOld = await fetchSetting('MAINTENANCE_MODE');
  if (maintenance?.value === true || maintenanceOld?.value === true) {
    throw new AppError('System under maintenance. Order placement is blocked.', 503);
  }

  // 🔥 Check Order Cutoff Time
  const cutoffSetting = await fetchSetting('orderCutoffTime');
  if (cutoffSetting && cutoffSetting.value && cutoffSetting.value !== '00:00') {
    const [hours, minutes] = cutoffSetting.value.split(':').map(Number);
    const now = new Date();
    const cutoffDate = new Date();
    cutoffDate.setHours(hours, minutes, 0, 0);

    if (now > cutoffDate) {
      throw new AppError('Orders are closed for today after cutoff time.', 403);
    }
  }

  // 🔥 Check COD availability
  if (paymentMethod.toUpperCase() === 'COD') {
    const codSetting = await fetchSetting('enableCOD');
    const codFlag = await fetchSetting('cod');
    if (codSetting?.value === false || codFlag?.value === false) {
      throw new AppError('Cash on Delivery is currently unavailable.', 403);
    }
  }

  // 🔥 Check Credit System availability
  if (paymentMethod.toUpperCase() === 'CREDIT') {
    const creditFlag = await fetchSetting('creditSystem');
    if (creditFlag?.value === false) {
      throw new AppError('Credit system is currently disabled.', 403);
    }
  }

  let finalItems = [];
  if (requestItems && requestItems.length > 0) {
    finalItems = requestItems;
  } else {
    const cart = await cartRepo.findCartByUser(userId);
    if (!cart || cart.items.length === 0) throw new AppError('Cart is empty', 400);
    finalItems = cart.items;
  }

  if (finalItems.length === 0) {
    throw new AppError('No items to order', 400);
  }

  // 🔥 1. Bulk fetch all products at once (Performance optimization)
  const productIds = finalItems.map(item => item.productId || item.id || item.productId?._id);
  const products = await Product.find({ _id: { $in: productIds } })
    .select('_id name price basePrice weight minOrderQty moq')
    .lean();
  
  if (products.length !== productIds.length) {
    throw new AppError('Some products in your order no longer exist', 404);
  }

  // Create a map for quick lookup
  const productMap = new Map(products.map(p => [p._id.toString(), p]));

  let totalAmount = 0;
  let totalWeight = 0;
  const items = [];

  // 🔥 2. Validate + Prepare Items + Check Stock
  for (const item of finalItems) {
    const productId = (item.productId?._id || item.productId || item.id).toString();
    const product = productMap.get(productId);
    
    if (!product) throw new AppError(`Product not found`, 404);

    // Input validation
    if (!item.quantity || item.quantity < 1) {
      throw new AppError(`Invalid quantity for ${product.name}`, 400);
    }

    // 🔥 Wholesale MOQ validation
    const minQty = product.minOrderQty || product.moq || 1;
    if (item.quantity < minQty) {
      throw new AppError(`Minimum order quantity for ${product.name} is ${minQty}`, 400);
    }

    await checkStock(product._id, item.quantity);

    const productPrice = product.price || product.basePrice || 0;
    
    // 🔥 Feature 3: Bulk Quantity Discount Logic
    let discountPercent = 0;
    if (item.quantity >= 20) discountPercent = 20;
    else if (item.quantity >= 15) discountPercent = 15;
    else if (item.quantity >= 10) discountPercent = 10;
    else if (item.quantity >= 5) discountPercent = 5;

    const discountAmount = (productPrice * item.quantity) * (discountPercent / 100);
    const itemTotal = (productPrice * item.quantity) - discountAmount;

    totalAmount += itemTotal;
    totalWeight += (product.weight || 0) * item.quantity;

    items.push({
      productId: product._id,
      name: product.name,
      price: productPrice,
      quantity: item.quantity,
      discountPercent,
      discountAmount,
      finalPrice: itemTotal / item.quantity
    });
  }

  // Add 18% GST
  const tax = totalAmount * 0.18;
  const finalTotal = totalAmount + tax;

  // 🔥 Calculate Commission
  const commissionSetting = await fetchSetting('commissionRate');
  const commissionRate = commissionSetting?.value || 0;
  const commissionAmount = totalAmount * (commissionRate / 100);

  // 🔥 3. Prepare Order Data
  const orderData = {
    userId,
    items,
    totalAmount: finalTotal,
    totalWeight,
    commissionRate,
    commissionAmount,
    paymentMethod: paymentMethod.toUpperCase(),
    address: shippingAddress,
    shippingAddress,
    status: ORDER_STATUS.CREATED,
    paymentStatus: PAYMENT_STATUS.PENDING,
    requiresHeavyVehicle: totalWeight > 100,
    idempotencyKey
  };

  // 🔥 4. Status Mapping based on Payment Method
  if (paymentMethod.toUpperCase() === 'COD' || paymentMethod.toUpperCase() === 'CREDIT') {
    orderData.status = ORDER_STATUS.CONFIRMED;
    if (paymentMethod.toUpperCase() === 'CREDIT') {
      orderData.paymentStatus = PAYMENT_STATUS.PAID;
    }
  } else {
    orderData.paymentStatus = PAYMENT_STATUS.PENDING;
    orderData.status = ORDER_STATUS.PENDING_PAYMENT;
  }

  // 🔥 5. Atomic Order Creation + Stock Deduction using Transactions
  const supportsTransactions = getTransactionSupport();
  let session = null;
  let order;

  try {
    if (supportsTransactions) {
      session = await mongoose.startSession();
      session.startTransaction();
    }

    // 🔥 Feature 4: Handle Credit Payment
    if (paymentMethod.toUpperCase() === 'CREDIT') {
      await deductCredit(userId, finalTotal, { session });
    }

    // Create order
    order = await orderRepo.createOrder(orderData, { session });
    
    // 🔒 CRITICAL FIX: Use different stock handling based on payment method
    // COD & CREDIT: Immediate deduction
    // NON-COD: Reserve only
    if (paymentMethod.toUpperCase() === 'COD' || paymentMethod.toUpperCase() === 'CREDIT') {
      // Immediate stock deduction
      for (const item of items) {
        await reduceStock(item.productId, item.quantity, { session });
      }
    } else {
      // Reserve inventory for pending payment (15 min TTL)
      // Actual deduction happens in payment verification
      const reservationItems = items.map(item => ({
        productId: item.productId,
        quantity: item.quantity
      }));
      await reserveInventory(order._id.toString(), reservationItems, 900);
    }

    if (supportsTransactions) {
      await session.commitTransaction();
      session.endSession();
    }
  } catch (err) {
    if (supportsTransactions && session) {
      await session.abortTransaction();
      session.endSession();
    } else {
      // Manual rollback if transactions not supported
      if (order) await Order.findByIdAndDelete(order._id);
    }
    
    throw new AppError(err.message || 'Order placement failed', err.statusCode || 500);
  }

  // 🔥 6. Post-Order Processing
  try {
    // Clear Cart ONLY for COD/CREDIT immediately, others after payment
    const isAutoConfirmed = ['COD', 'CREDIT'].includes(paymentMethod.toUpperCase());
    
    if (isAutoConfirmed) {
      if (!requestItems || requestItems.length === 0) {
        const cart = await cartRepo.findCartByUser(userId);
        if (cart) {
          cart.items = [];
          await cart.save();
        }
      }
      
      // Generate Invoice & Notification
      await generateInvoice(order._id);
      await sendNotification({
        userId,
        title: 'Order Confirmed',
        message: `Your order #${order._id} for ₹${finalTotal.toLocaleString()} has been placed successfully via ${paymentMethod}.`,
      });
      
      await onOrderCreated(order);
      trackOrder(order);

      // 🔒 PHASE 4: Queue-based post-order processing
      const { queuePostOrderJobs } = await import('../../services/queueManager.service.js');
      await queuePostOrderJobs({
        orderId: order._id.toString(),
        userId,
        paymentMethod: paymentMethod.toUpperCase(),
      });
    } else {
      // For non-COD, just notify about pending order
      await sendNotification({
        userId,
        title: 'Order Initiated',
        message: `Your order #${order._id} has been initiated. Please complete the payment to finalize it.`,
      });
    }
  } catch (err) {
    logger.error('Non-critical post-order error', { orderId: order?._id, userId, error: err.message, stack: err.stack });
  }

  return order;
};

async function enrichOrdersWithDeliveryPartner(orders) {
  if (!orders?.length) return orders;

  const orderIds = orders.map((order) => order._id);
  const shipments = await Logistics.find({ orderId: { $in: orderIds } })
    .populate('deliveryPartnerId', 'name email mobile')
    .lean();

  const shipmentByOrderId = new Map(
    shipments.map((shipment) => [String(shipment.orderId), shipment])
  );

  return orders.map((order) => {
    const shipment =
      shipmentByOrderId.get(String(order._id)) ||
      (typeof order.shipmentId === 'object' ? order.shipmentId : null);

    const partner =
      (typeof shipment?.deliveryPartnerId === 'object' && shipment.deliveryPartnerId) ||
      (typeof order.shipmentId === 'object' &&
      typeof order.shipmentId.deliveryPartnerId === 'object'
        ? order.shipmentId.deliveryPartnerId
        : null);

    return {
      ...order,
      deliveryPartner: partner || null,
      logisticsStatus: shipment?.status || order.shipmentId?.status || null,
    };
  });
}

export const getOrders = async (user, query = {}) => {
  const {
    page = 1,
    limit = 20,
    search = '',
    status,
    startDate,
    endDate,
  } = query;

  const filter = {};

  if (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') {
    filter.userId = user.id;
    filter.status = {
      $nin: [ORDER_STATUS.FAILED, ORDER_STATUS.CREATED, ORDER_STATUS.PENDING_PAYMENT],
    };
  }

  if (status && status !== 'all') {
    filter.status = status.toUpperCase();
  }

  if (search) {
    // Sanitize search input to prevent ReDoS / regex injection
    const sanitized = String(search).trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const searchRegex = { $regex: sanitized, $options: 'i' };
    filter.$or = [{ _id: search.match(/^[0-9a-fA-F]{24}$/) ? search : undefined }].filter(Boolean);
    if (!filter.$or.length) {
      delete filter.$or;
    }
  }

  if (startDate || endDate) {
    filter.createdAt = {};
    if (startDate) filter.createdAt.$gte = new Date(startDate);
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      filter.createdAt.$lte = end;
    }
  }

  const isAdmin = user.role === 'ADMIN' || user.role === 'SUPER_ADMIN';
  const pageNum = Math.max(1, Number(page) || 1);
  const limitNum = Math.min(100, Math.max(1, Number(limit) || 20));
  const skip = (pageNum - 1) * limitNum;

  if (isAdmin && search && !filter.$or) {
    const User = (await import('../user/user.model.js')).default;
    const sanitizedSearch = String(search).trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const matchingUsers = await User.find({
      $or: [
        { name: { $regex: sanitizedSearch, $options: 'i' } },
        { email: { $regex: sanitizedSearch, $options: 'i' } },
        { mobile: { $regex: sanitizedSearch, $options: 'i' } },
        { companyName: { $regex: sanitizedSearch, $options: 'i' } },
      ],
    })
      .select('_id')
      .lean();
    const userIds = matchingUsers.map((u) => u._id);
    filter.$or = [{ userId: { $in: userIds } }];
    if (search.match(/^[0-9a-fA-F]{24}$/)) {
      filter.$or.push({ _id: search });
    }
  }

  const [orders, total] = await Promise.all([
    orderRepo.findOrders(filter, { skip, limit: limitNum }),
    orderRepo.countOrders(filter),
  ]);

  const enriched = await enrichOrdersWithDeliveryPartner(orders);

  if (isAdmin) {
    return {
      orders: enriched,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum) || 1,
      },
    };
  }

  return enriched;
};

export const getOrderById = async (id) => {
  throw new AppError('Use getOrderByIdWithUser for ownership-checked lookup', 400);
};

export const getOrderByIdWithUser = async (id, user) => {
  if (!mongoose.Types.ObjectId.isValid(id)) throw new AppError('Invalid order ID', 400);

  const order = await orderRepo.findById(id);
  if (!order) throw new AppError('Order not found', 404);

  const userId = typeof user === 'string' ? user : (user?.id || user?._id);
  const role = user?.role || null;
  if (!(role === 'ADMIN' || role === 'SUPER_ADMIN') && userId && order.userId.toString() !== userId.toString()) {
    throw new AppError('Access denied', 403);
  }

  const [enriched] = await enrichOrdersWithDeliveryPartner([order]);
  return enriched;
};

export const downloadInvoice = async (orderId, user) => {
  logger.info('Searching for invoice', { orderId });
  // Ownership check: ensure the requester owns the order or has admin privileges
  if (!mongoose.Types.ObjectId.isValid(orderId)) throw new AppError('Invalid order ID', 400);
  const order = await orderRepo.findById(orderId);
  if (!order) throw new AppError('Order not found', 404);
  const userId = typeof user === 'string' ? user : (user?.id || user?._id);
  const role = user?.role || null;
  if (!(role === 'ADMIN' || role === 'SUPER_ADMIN') && userId && order.userId.toString() !== userId.toString()) {
    throw new AppError('Access denied', 403);
  }

  let invoice = await getInvoiceByOrderId(orderId);
  
  // If invoice doesn't exist OR fileUrl is missing, generate/regenerate it
  if (!invoice || !invoice.fileUrl) {
    logger.info('Invoice missing or fileUrl null - generating', { orderId });
    invoice = await generateInvoice(orderId);
    
    if (!invoice || !invoice.fileUrl) {
      logger.error('Invoice generation failed', { orderId });
      throw new AppError('Invoice could not be generated', 404);
    }
  }

  // Robust path construction
  const rawUrl = invoice.fileUrl;
  const relativeUrl = rawUrl.startsWith('/') ? rawUrl.substring(1) : rawUrl;
  
  // Try multiple potential base directories for the uploads
  const potentialBases = [
    path.resolve(process.cwd(), 'src'), // src/ from root (Most likely)
    path.resolve(process.cwd()), // root/
    path.join(__dirname, '../../') // src/ relative to this file
  ];

  let filePath = null;
  for (const base of potentialBases) {
    const testPath = path.join(base, relativeUrl);
    logger.debug('Checking invoice path', { testPath, orderId });
    if (fs.existsSync(testPath)) {
      filePath = testPath;
      break;
    }
  }

  if (!filePath) {
    logger.error('Invoice file not found on disk', { orderId, fileUrl: rawUrl });
    // Try one last thing: re-generate if file is missing from disk
    logger.info('Attempting invoice re-generation', { orderId });
    const newInvoice = await generateInvoice(orderId, true); // Force re-generation
    if (newInvoice && newInvoice.fileUrl) {
      const newRelative = newInvoice.fileUrl.startsWith('/') ? newInvoice.fileUrl.substring(1) : newInvoice.fileUrl;
      // Re-check paths for the new file
      for (const base of potentialBases) {
        const testPath = path.join(base, newRelative);
        if (fs.existsSync(testPath)) {
          filePath = testPath;
          break;
        }
      }
    }
  }

  if (!filePath) {
    logger.error('Invoice file not found after all attempts', { orderId });
    throw new AppError('Invoice file could not be found or generated on the server. Please contact support.', 404);
  }

  logger.info('Invoice ready for download', { orderId, filePath });
  return {
    filePath,
    fileName: `invoice-${invoice.invoiceNumber || orderId}.pdf`
  };
};

export const markOrderAsFailed = async (id) => {
  throw new AppError('markOrderAsFailed requires user context - use markOrderAsFailedWithUser', 400);
};

export const markOrderAsFailedWithUser = async (id, user) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError('Invalid order ID', 400);
  }

  const order = await Order.findById(id);
  if (!order) throw new AppError('Order not found', 404);
  
  const userId = typeof user === 'string' ? user : (user?.id || user?._id);
  const role = user?.role || null;
  // Only owner or admin can mark as failed
  if (!(role === 'ADMIN' || role === 'SUPER_ADMIN') && userId && order.userId.toString() !== userId.toString()) {
    throw new AppError('Access denied', 403);
  }

  // Only process if not already failed
  if (order.status === ORDER_STATUS.FAILED) return order;

  const supportsTransactions = getTransactionSupport();
  let session = null;

  try {
    if (supportsTransactions) {
      session = await mongoose.startSession();
      session.startTransaction({
        readPreference: 'primary',
        readConcern: { level: 'snapshot' },
        writeConcern: { w: 'majority' }
      });
    }

    order.status = ORDER_STATUS.FAILED;
    order.paymentStatus = PAYMENT_STATUS.FAILED;
    order.metadata = { ...order.metadata, markedFailedAt: new Date() };
    await order.save({ session });

    // Restore stock
    const { restoreStock } = await import('../inventory/inventory.service.js');
    for (const item of order.items) {
      try {
        await restoreStock(item.productId, item.quantity, { session });
      } catch (err) {
        logger.error('Failed to restore stock for order', { orderId: id, productId: item.productId, error: err.message });
      }
    }

    if (supportsTransactions) {
      await session.commitTransaction();
      session.endSession();
    }

    return order;
  } catch (error) {
    if (supportsTransactions && session) {
      await session.abortTransaction();
      session.endSession();
    }
    throw error;
  }
};

export const updateOrderStatus = async (orderId, newStatus, actor = {}, note = '') => {
  const order = await Order.findById(orderId);

  if (!order) throw new AppError('Order not found', 404);

  validateTransition(order.status, newStatus);

  const previousStatus = order.status;
  order.status = newStatus;
  order.statusHistory = order.statusHistory || [];
  order.statusHistory.push({
    status: newStatus,
    changedBy: actor.id || actor._id,
    changedAt: new Date(),
    note: note || `Status changed from ${previousStatus} to ${newStatus}`,
  });

  await order.save();

  try {
    const Audit = (await import('../audit/audit.model.js')).default;
    await Audit.create({
      userId: actor.id || actor._id,
      userEmail: actor.email,
      role: actor.role,
      action: 'ORDER_STATUS_UPDATED',
      entity: 'ORDER',
      entityId: order._id,
      details: `Order ${order._id} status: ${previousStatus} → ${newStatus}`,
      severity: 'INFO',
    });
  } catch (auditError) {
    logger.warn('Failed to create order status audit log', { error: auditError.message });
  }

  const [enriched] = await enrichOrdersWithDeliveryPartner([order.toObject()]);
  return enriched || order;
};