import * as repo from './payment.repository.js';
import * as gateway from './payment.gateway.js';
import AppError from '../../errors/AppError.js';
import mongoose from 'mongoose';
import { getTransactionSupport } from '../../config/db.js';

import Order from '../order/order.model.js';
import * as creditRepo from '../credit/credit.repository.js';
import { generateInvoice } from '../invoice/invoice.service.js';

import { sendNotification } from '../notification/notification.service.js';
import { TEMPLATES } from '../notification/notification.templates.js';
import { ORDER_STATUS } from '../../constants/orderStatus.js';
import { PAYMENT_STATUS } from '../../constants/paymentStatus.js';

export const createRazorpayOrder = async (amount, userId) => {
  // Razorpay minimum amount is 100 paise (₹1)
  if (!amount || amount < 1) {
    throw new AppError('Minimum payment amount is ₹1', 400);
  }

  try {
    const order = await gateway.createPaymentOrder({ 
      amount: amount,
      receipt: `rcpt_${userId.toString().slice(-6)}_${Date.now()}` // Shortened to fit Razorpay's 40-char limit
    });
    return order;
  } catch (error) {
    console.error('❌ Razorpay Order Creation Failed:', {
      error: error.message,
      userId,
      amount
    });
    throw new AppError(error.message || 'Razorpay order creation failed', 500);
  }
};

export const hybridPayment = async (orderId, userId, useCredit, totalAmount) => {
  // Distributed lock to prevent concurrent hybrid payment processing
  const { redisClient } = await import('../../config/redis.js');
  const lockKey = `hybrid_payment_lock:${orderId}`;
  const lockValue = Date.now().toString();
  const lockTTL = 30; // 30 seconds

  try {
    // Try to acquire lock
    const lockAcquired = await redisClient.set(lockKey, lockValue, 'EX', lockTTL, 'NX');
    
    if (!lockAcquired) {
      throw new AppError('Payment is already being processed. Please wait.', 409);
    }

    const supportsTransactions = getTransactionSupport();
    let session = null;
    let isTransactionStarted = false;

    try {
      if (supportsTransactions) {
        session = await mongoose.startSession();
        session.startTransaction();
        isTransactionStarted = true;
      }

      // 1. Validate orderId
      if (!mongoose.Types.ObjectId.isValid(orderId)) {
        throw new AppError('Invalid order ID format', 400);
      }

      const query = Order.findById(orderId);
      if (isTransactionStarted) query.session(session);
      const order = await query;

      if (!order) throw new AppError('Order not found', 404);

      if (order.paymentStatus === 'PAID') {
        throw new AppError('Order is already paid', 400);
      }

      // Verify order belongs to user (security check)
      if (order.userId.toString() !== userId.toString()) {
        throw new AppError('Unauthorized access to order', 403);
      }

      // Safety check: frontend totalAmount vs backend totalAmount
      if (totalAmount && Math.abs(order.totalAmount - totalAmount) > 0.01) {
        throw new AppError('Payment amount mismatch. Please refresh and try again.', 400);
      }

      let remainingAmount = order.totalAmount;
      let creditUsed = 0;

      // 2. Handle Credit deduction
      if (useCredit) {
        const credit = await creditRepo.findByUser(userId);
        if (credit && credit.availableCredit > 0 && credit.status !== 'BLOCKED') {
          creditUsed = Math.min(credit.availableCredit, remainingAmount);
          
          credit.availableCredit -= creditUsed;
          credit.usedCredit += creditUsed;
          await credit.save({ session: isTransactionStarted ? session : null });

          await creditRepo.addLedger({
            userId,
            amount: creditUsed,
            type: 'DEBIT',
            description: `Hybrid payment for Order #${orderId}`,
          }, { session: isTransactionStarted ? session : null });

          remainingAmount -= creditUsed;
        }
      }

      // 3. Check if fully paid
      if (remainingAmount <= 0) {
        order.paymentStatus = 'PAID';
        order.status = 'CONFIRMED';
        order.paymentMethod = 'HYBRID';
        order.metadata = { ...order.metadata, creditUsed };
        await order.save({ session: isTransactionStarted ? session : null });

        if (isTransactionStarted) {
          await session.commitTransaction();
          session.endSession();
        }

        // Release lock
        await redisClient.del(lockKey);

        // Emit socket event
        if (global.io) {
          global.io.emit('payment:success', { 
            orderId: order._id, 
            userId: order.userId,
            amount: order.totalAmount,
            method: 'HYBRID' 
          });
        }

        // Generate invoice and trigger delivery (non-blocking)
        setImmediate(async () => {
          try {
            await generateInvoice(order._id);
            const { autoAssignDelivery } = await import('../logistics/logistics.service.js');
            await autoAssignDelivery(order._id);
          } catch (err) {
            console.error('Post-payment actions failed:', err.message);
          }
        });

        return { success: true, paidFullyByCredit: true, creditUsed };
      }

      // 4. Create Razorpay order for remaining amount
      let rzpOrder;
      try {
        rzpOrder = await createRazorpayOrder(remainingAmount, userId);
      } catch (err) {
        console.error('❌ Razorpay order creation failed during hybrid payment:', err);
        // Revert credit deduction if Razorpay order fails
        if (useCredit && creditUsed > 0) {
          const credit = await creditRepo.findByUser(userId);
          if (credit) {
            credit.availableCredit += creditUsed;
            credit.usedCredit -= creditUsed;
            await credit.save({ session: isTransactionStarted ? session : null });
            
            await creditRepo.addLedger({
              userId,
              amount: creditUsed,
              type: 'CREDIT',
              description: `Reversal: Razorpay order creation failed for Order #${orderId}`,
            }, { session: isTransactionStarted ? session : null });
          }
        }
        throw err;
      }

      // Track this payment intent
      const paymentData = {
        orderId,
        userId,
        amount: remainingAmount,
        transactionId: rzpOrder.gatewayOrderId || rzpOrder.id,
        paymentMethod: 'HYBRID',
        status: 'PENDING',
        metadata: { creditUsed }
      };

      try {
        await repo.createPayment(paymentData, { session: isTransactionStarted ? session : null });
      } catch (err) {
        console.error('❌ Failed to record payment record:', err);
        throw new AppError('Failed to initialize payment tracking', 500);
      }

      // Update order with partial credit use info
      order.metadata = { ...order.metadata, creditUsed };
      await order.save({ session: isTransactionStarted ? session : null });

      if (isTransactionStarted) {
        await session.commitTransaction();
        session.endSession();
      }

      // Release lock
      await redisClient.del(lockKey);

      return { 
        success: true,
        paidFullyByCredit: false, 
        remainingAmount,
        creditUsed,
        gateway: {
          gatewayOrderId: rzpOrder.gatewayOrderId,
          amount: rzpOrder.amount
        } 
      };
    } catch (error) {
      if (isTransactionStarted) {
        await session.abortTransaction();
        session.endSession();
      }
      // Release lock on error
      await redisClient.del(lockKey);
      throw error;
    }
  } catch (error) {
    // Ensure lock is always released
    try {
      await redisClient.del(lockKey);
    } catch (lockError) {
      console.error('Failed to release hybrid payment lock:', lockError);
    }
    throw error;
  }
};

export const initiatePayment = async (orderId, userId) => {
  const order = await Order.findById(orderId);

  if (!order) throw new AppError('Order not found', 404);

  if (order.paymentStatus === 'PAID') {
    throw new AppError('Order already paid', 400);
  }

  if (order.paymentMethod === 'CREDIT') {
    return {
      message: 'Payment handled via credit',
    };
  }

  const paymentOrder = await gateway.createPaymentOrder({
    amount: order.totalAmount,
  });

  const payment = await repo.createPayment({
    orderId,
    userId,
    amount: order.totalAmount,
    transactionId: paymentOrder.gatewayOrderId,
    paymentMethod: order.paymentMethod || 'ONLINE',
  });

  return {
    payment,
    gateway: paymentOrder,
  };
};

export const verifyPayment = async (payload) => {
  const { orderId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = payload;

  // 0. Input validation
  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    throw new AppError('Missing payment verification parameters', 400);
  }

  // 1. Distributed Lock: Prevent concurrent verification of same payment
  const { redisClient } = await import('../../config/redis.js');
  const lockKey = `payment_verify_lock:${razorpay_payment_id}`;
  const lockValue = Date.now().toString();
  const lockTTL = 30; // 30 seconds

  try {
    // Try to acquire lock with SET NX EX (atomic operation)
    const lockAcquired = await redisClient.set(lockKey, lockValue, 'EX', lockTTL, 'NX');
    
    if (!lockAcquired) {
      // Another process is already verifying this payment
      console.log(`⚠️ Payment verification already in progress: ${razorpay_payment_id}`);
      // Wait a bit and check if payment was processed
      await new Promise(resolve => setTimeout(resolve, 2000));
      const payment = await repo.findByRazorpayPaymentId(razorpay_payment_id);
      if (payment && payment.status === 'SUCCESS') {
        return payment;
      }
      throw new AppError('Payment verification in progress, please try again', 409);
    }

    // 2. Idempotency Check: verify payment not already processed
    const existingPayment = await repo.findByRazorpayPaymentId(razorpay_payment_id);
    if (existingPayment && existingPayment.status === 'SUCCESS') {
      await redisClient.del(lockKey); // Release lock
      return existingPayment;
    }

    // 3. Signature verification
    const isValid = await gateway.verifyPayment({
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    });

    if (!isValid) {
      await redisClient.del(lockKey);
      throw new AppError('Payment verification failed - invalid signature', 400);
    }

    // 4. Find payment record
    let payment = await repo.findByTransactionId(razorpay_order_id);
    
    if (!payment && orderId) {
      payment = await repo.findByOrderId(orderId);
    }

    if (!payment) {
      await redisClient.del(lockKey);
      throw new AppError('Payment record not found', 404);
    }

    if (payment.status === 'SUCCESS') {
      await redisClient.del(lockKey);
      return payment;
    }

    // 5. Use transaction for atomic updates
    const supportsTransactions = getTransactionSupport();
    let session = null;
    
    try {
      if (supportsTransactions) {
        session = await mongoose.startSession();
        session.startTransaction();
      }

      // Update payment record atomically
      payment.status = 'SUCCESS';
      payment.razorpayPaymentId = razorpay_payment_id;
      await payment.save({ session });

      // Update order record
      const order = await Order.findById(payment.orderId);
      if (!order) {
        if (supportsTransactions) {
          await session.abortTransaction();
          session.endSession();
        }
        await redisClient.del(lockKey);
        throw new AppError('Order not found', 404);
      }

      if (order.paymentStatus !== 'PAID') {
        order.paymentStatus = 'PAID';
        order.status = 'CONFIRMED';
        await order.save({ session });

        if (supportsTransactions) {
          await session.commitTransaction();
          session.endSession();
        }

        // Emit socket event
        if (global.io) {
          global.io.emit('payment:success', { 
            orderId: order._id, 
            userId: order.userId,
            amount: order.totalAmount,
            method: payment.paymentMethod 
          });
        }

        // 6. Post-payment triggers (non-blocking)
        setImmediate(async () => {
          try {
            const CartModel = mongoose.model('Cart');
            await CartModel.findOneAndUpdate(
              { userId: order.userId },
              { $set: { items: [] } }
            );

            await generateInvoice(order._id);
            const { autoAssignDelivery } = await import('../logistics/logistics.service.js');
            await autoAssignDelivery(order._id);
          } catch (err) {
            console.error('Post-payment triggers failed:', err.message);
          }
        });
      } else if (supportsTransactions) {
        await session.commitTransaction();
        session.endSession();
      }

      // 7. Send notification
      await sendNotification({
        userId: order.userId,
        ...TEMPLATES.PAYMENT_SUCCESS(order.totalAmount),
      });

      // Release lock
      await redisClient.del(lockKey);
      
      return payment;
    } catch (error) {
      if (supportsTransactions && session) {
        await session.abortTransaction();
        session.endSession();
      }
      await redisClient.del(lockKey);
      throw error;
    }
  } catch (error) {
    // Ensure lock is always released
    try {
      await redisClient.del(lockKey);
    } catch (lockError) {
      console.error('Failed to release payment lock:', lockError);
    }
    throw error;
  }
};

export const failPayment = async (orderId, reason) => {
  if (!mongoose.Types.ObjectId.isValid(orderId)) {
    throw new AppError('Invalid order ID', 400);
  }

  const order = await Order.findById(orderId);
  if (!order) throw new AppError('Order not found', 404);

  // Prevent duplicate failure processing
  if (order.paymentStatus === PAYMENT_STATUS.FAILED) {
    return { status: 'FAILED', orderId, message: 'Order already marked as failed' };
  }

  const supportsTransactions = getTransactionSupport();
  let session = null;

  try {
    if (supportsTransactions) {
      session = await mongoose.startSession();
      session.startTransaction();
    }

    order.paymentStatus = PAYMENT_STATUS.FAILED;
    order.status = ORDER_STATUS.FAILED;
    order.metadata = { ...order.metadata, failureReason: reason, failedAt: new Date() };
    await order.save({ session });

    // Restore stock for all items
    const { restoreStock } = await import('../inventory/inventory.service.js');
    for (const item of order.items) {
      try {
        await restoreStock(item.productId, item.quantity, { session });
      } catch (err) {
        console.error(`Failed to restore stock for product ${item.productId}:`, err.message);
        // Continue with other items even if one fails
      }
    }

    if (supportsTransactions) {
      await session.commitTransaction();
      session.endSession();
    }

    // Notify user
    await sendNotification({
      userId: order.userId,
      title: 'Payment Failed',
      message: `Your payment for order #${orderId} has failed. Your items have been returned to stock.`,
    });

    return { status: 'FAILED', orderId };
  } catch (error) {
    if (supportsTransactions && session) {
      await session.abortTransaction();
      session.endSession();
    }
    throw error;
  }
};

export const handleWebhook = async (rawBody, signature) => {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) {
    console.error('RAZORPAY_WEBHOOK_SECRET is not set');
    throw new AppError('Webhook configuration error', 500);
  }

  // Verify signature using raw body
  const isValid = gateway.verifyWebhookSignature(rawBody, signature, secret);
  if (!isValid) throw new AppError('Invalid webhook signature', 400);

  let body;
  try {
    body = JSON.parse(rawBody);
  } catch (error) {
    throw new AppError('Invalid webhook payload', 400);
  }

  const event = body.event;
  const payload = body.payload?.payment?.entity;

  if (!event || !payload) {
    throw new AppError('Invalid webhook structure', 400);
  }

  // Use distributed lock to prevent duplicate webhook processing
  const { redisClient } = await import('../../config/redis.js');
  const eventId = body.payload?.payment?.entity?.id || `webhook_${Date.now()}`;
  const lockKey = `webhook_lock:${eventId}`;
  const lockValue = Date.now().toString();
  const lockTTL = 60; // 60 seconds

  try {
    const lockAcquired = await redisClient.set(lockKey, lockValue, 'EX', lockTTL, 'NX');
    
    if (!lockAcquired) {
      console.log(`⚠️ Webhook already being processed: ${eventId}`);
      return { status: 'ok', message: 'Webhook already processed' };
    }

    if (event === 'payment.captured') {
      const razorpay_order_id = payload.order_id;
      const razorpay_payment_id = payload.id;
      
      if (!razorpay_order_id || !razorpay_payment_id) {
        await redisClient.del(lockKey);
        throw new AppError('Missing payment identifiers in webhook', 400);
      }
      
      // Process payment (idempotency handled within)
      const existingPayment = await repo.findByRazorpayPaymentId(razorpay_payment_id);
      if (existingPayment && existingPayment.status === 'SUCCESS') {
        await redisClient.del(lockKey);
        return { status: 'ok', message: 'Payment already processed' };
      }

      let payment = await repo.findByTransactionId(razorpay_order_id);
      if (!payment) {
        await redisClient.del(lockKey);
        console.warn(`Webhook: Payment record not found for order ${razorpay_order_id}`);
        return { status: 'ok', message: 'Payment record not found' };
      }

      payment.status = 'SUCCESS';
      payment.razorpayPaymentId = razorpay_payment_id;
      await payment.save();

      const order = await Order.findById(payment.orderId);
      if (order && order.paymentStatus !== 'PAID') {
        order.paymentStatus = 'PAID';
        order.status = 'CONFIRMED';
        await order.save();

        // Clear Cart on successful webhook capture
        const CartModel = mongoose.model('Cart');
        await CartModel.findOneAndUpdate(
          { userId: order.userId },
          { $set: { items: [] } }
        );

        // Emit socket event
        if (global.io) {
          global.io.emit('payment:success', { 
            orderId: order._id, 
            userId: order.userId,
            amount: order.totalAmount,
            method: 'ONLINE' 
          });
        }

        // Generate invoice and trigger delivery (non-blocking)
        setImmediate(async () => {
          try {
            await generateInvoice(order._id);
            const { autoAssignDelivery } = await import('../logistics/logistics.service.js');
            await autoAssignDelivery(order._id);
          } catch (err) {
            console.error('Webhook post-payment actions failed:', err.message);
          }
        });
      }

      // Release lock
      await redisClient.del(lockKey);
    } else {
      // Release lock for unsupported events
      await redisClient.del(lockKey);
    }

    return { status: 'ok' };
  } catch (error) {
    // Ensure lock is released on error
    try {
      await redisClient.del(lockKey);
    } catch (lockError) {
      console.error('Failed to release webhook lock:', lockError);
    }
    throw error;
  }
};