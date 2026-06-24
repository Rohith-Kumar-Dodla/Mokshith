import * as repo from './payment.repository.js';
import * as gateway from './payment.gateway.js';
import AppError from '../../errors/AppError.js';
import mongoose from 'mongoose';
import { getTransactionSupport } from '../../config/db.js';
import { logger } from '../../config/logger.js';

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
    const start = Date.now();
    logger.debug('START createRazorpayOrder', { amount, userId });
    const order = await gateway.createPaymentOrder({ 
      amount: amount,
      receipt: `rcpt_${userId.toString().slice(-6)}_${Date.now()}` // Shortened to fit Razorpay's 40-char limit
    });
    const duration = Date.now() - start;
    logger.debug('END createRazorpayOrder', { amount, userId, durationMs: duration });
    if (duration > 1000) {
      logger.warn('Slow operation: createRazorpayOrder took >1s', { amount, userId, durationMs: duration });
    }
    return order;
  } catch (error) {
    logger.error('Razorpay order creation failed', {
      error: error.message,
      userId,
      amount,
      stack: error.stack
    });
    throw new AppError(error.message || 'Razorpay order creation failed', 500);
  }
};

export const hybridPayment = async (orderId, user, useCredit, totalAmount, paymentMethod = 'HYBRID') => {
  const supportsTransactions = getTransactionSupport();
  let session = null;
  let isTransactionStarted = false;

  // 🔒 Distributed lock to prevent race conditions
  const { redisClient } = await import('../../config/redis.js');
  const { logger } = await import('../../config/logger.js');
  const userId = typeof user === 'string' ? user : (user?.id || user?._id);
  const role = user?.role || null;
  const lockKey = `payment:lock:${orderId}`;
  const lockValue = `${userId}-${Date.now()}`;
  
  // 🔒 PHASE 2 FIX: Detect and clean stale locks before acquisition
  const staleDetected = await redisClient.detectStaleLock(lockKey);
  if (staleDetected) {
    logger.warn('Removed stale payment lock before acquisition', { orderId, userId });
  }
  
  // 🔒 CRITICAL FIX: Retry lock acquisition with exponential backoff
  let lockAcquired = false;
  let attempts = 0;
  const maxAttempts = 3;
  
  while (!lockAcquired && attempts < maxAttempts) {
    lockAcquired = await redisClient.acquireLock(lockKey, lockValue, 60);
    
    if (!lockAcquired) {
      attempts++;
      if (attempts < maxAttempts) {
        // Exponential backoff: 100ms, 200ms, 400ms
        const delay = Math.pow(2, attempts - 1) * 100;
        logger.warn('Payment lock busy, retrying', { orderId, userId, attempt: attempts, delayMs: delay });
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  if (!lockAcquired) {
    logger.error('Payment lock acquisition failed after retries', { orderId, userId, attempts });
    throw new AppError('Payment already in progress for this order. Please wait.', 409);
  }

  // 🔒 PHASE 2 FIX: Ensure lock is ALWAYS released using finally block
  try {
    if (supportsTransactions) {
      session = await mongoose.startSession();
      session.startTransaction({
        readPreference: 'primary',
        readConcern: { level: 'snapshot' },
        writeConcern: { w: 'majority' }
      });
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

    // Ownership check: only owner or admin can perform payment
    if (!(role === 'ADMIN' || role === 'SUPER_ADMIN') && userId && order.userId.toString() !== userId.toString()) {
      throw new AppError('Access denied', 403);
    }

    if (order.paymentStatus === 'PAID') {
      throw new AppError('Order is already paid', 400);
    }

    // 🔥 HANDLE COD
    if (paymentMethod === 'COD') {
      order.paymentMethod = 'COD';
      order.status = 'CONFIRMED';
      order.paymentStatus = 'PENDING';
      await order.save({ session: isTransactionStarted ? session : null });
      
      if (isTransactionStarted) {
        await session.commitTransaction();
        session.endSession();
      }
      
      // Lock will be released in finally block
      return { success: true, paymentMethod: 'COD' };
    }

    // 🔒 CRITICAL: Enforce amount validation to prevent payment fraud
    if (totalAmount && Math.round(order.totalAmount) !== Math.round(totalAmount)) {
      logger.error('Payment amount mismatch detected - potential fraud', {
        orderId,
        expectedAmount: order.totalAmount,
        receivedAmount: totalAmount,
        userId
      });
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

      // Emit socket event
      if (global.io) {
        global.io.emit('payment:success', { 
          orderId: order._id, 
          userId: order.userId,
          amount: order.totalAmount,
          method: 'HYBRID' 
        });
      }

      // 🔒 PHASE 4: Queue-based post-payment processing (replaces setImmediate)
      const { queuePostPaymentJobs } = await import('../../services/queueManager.service.js');
      await queuePostPaymentJobs({
        orderId: order._id.toString(),
        userId: order.userId.toString(),
        amount: order.totalAmount,
        paymentMethod: 'HYBRID',
      });

      // Lock will be released in finally block
      return { success: true, paidFullyByCredit: true, creditUsed };
    }

    // 4. Create Razorpay order for remaining amount
    let rzpOrder;
    try {
      rzpOrder = await createRazorpayOrder(remainingAmount, userId);
    } catch (err) {
      logger.error('Razorpay order creation failed during hybrid payment', { 
        orderId, 
        userId, 
        remainingAmount, 
        error: err.message,
        stack: err.stack 
      });
      
      // 🔒 Protected credit reversal - revert credit deduction if Razorpay order fails
      if (useCredit && creditUsed > 0) {
        try {
          // 🔒 PHASE 3 FIX: Credit reversal idempotency protection
          const reversalKey = `credit:reversal:${orderId}:${userId}`;
          const alreadyReversed = await redisClient.get(reversalKey);
          
          if (alreadyReversed) {
            logger.warn('Credit reversal already processed, skipping duplicate', { 
              orderId, 
              userId, 
              creditUsed 
            });
          } else {
            // Mark reversal as in-progress to prevent concurrent attempts
            await redisClient.setex(reversalKey, 3600, Date.now().toString()); // 1 hour TTL
            
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
              
              logger.info('Credit reversal completed with idempotency', { 
                orderId, 
                creditUsed, 
                reversalKey 
              });
            }
          }
        } catch (reversalErr) {
          logger.error('Credit reversal failed', { 
            orderId, 
            userId, 
            creditUsed, 
            error: reversalErr.message,
            stack: reversalErr.stack 
          });
          // Don't throw - main error is more important
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
      logger.error('Failed to record payment record', { orderId, userId, error: err.message, stack: err.stack });
      // Even if recording fails, we have the rzpOrder, but it's better to fail here
      throw new AppError('Failed to initialize payment tracking', 500);
    }

    // Update order with partial credit use info
    order.metadata = { ...order.metadata, creditUsed };
    await order.save({ session: isTransactionStarted ? session : null });

    if (isTransactionStarted) {
      await session.commitTransaction();
      session.endSession();
    }

    // Lock will be released in finally block
    
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
    if (isTransactionStarted && session) {
      try {
        await session.abortTransaction();
        session.endSession();
      } catch (txErr) {
        logger.error('Transaction abort failed', { error: txErr.message });
      }
    }
    throw error;
  } finally {
    // 🔓 Always release lock in finally block
    try {
      const released = await redisClient.releaseLock(lockKey, lockValue);
      if (!released) {
        logger.warn('Lock release returned false', { orderId });
      }
    } catch (unlockError) {
      logger.error('Failed to release lock', { orderId, error: unlockError.message });
    }
  }
};

export const initiatePayment = async (orderId, user) => {
  const userId = typeof user === 'string' ? user : (user?.id || user?._id);
  const role = user?.role || null;
  const order = await Order.findById(orderId);

  if (!order) throw new AppError('Order not found', 404);

  // Ownership check
  if (!(role === 'ADMIN' || role === 'SUPER_ADMIN') && userId && order.userId.toString() !== userId.toString()) {
    throw new AppError('Access denied', 403);
  }

  if (order.paymentStatus === 'PAID') {
    throw new AppError('Order already paid', 400);
  }

  if (order.paymentMethod === 'CREDIT') {
    return {
      message: 'Payment handled via credit',
    };
  }

  if (order.paymentMethod === 'BANK_TRANSFER') {
    return {
      message: 'Payment handled via bank transfer',
      paymentMethod: 'BANK_TRANSFER',
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

export const verifyPayment = async (payload, user = null) => {
  const { orderId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = payload;
  const { redisClient } = await import('../../config/redis.js');
  const { logger } = await import('../../config/logger.js');
  const DISABLE_REDIS = process.env.PAYMENT_DISABLE_REDIS === 'true';

  const startVerify = Date.now();
  logger.debug('START verifyPayment', { orderId, razorpay_order_id, razorpay_payment_id });

  // 🔒 1. Replay Protection: Check if this payment_id was already processed
  const replayKey = `payment:processed:${razorpay_payment_id}`;
  let alreadyProcessed = null;
  if (!DISABLE_REDIS) {
    alreadyProcessed = await redisClient.get(replayKey);
  } else {
    logger.info('PAYMENT_DISABLE_REDIS=true - skipping redis replay protection');
  }
  if (alreadyProcessed) {
    logger.warn('Payment replay attempt detected', { razorpay_payment_id, orderId });
    const existingPayment = await repo.findByRazorpayPaymentId(razorpay_payment_id);
    if (existingPayment) return existingPayment;
  }

  // 2. Database Idempotency Check
  const existingPayment = await repo.findByRazorpayPaymentId(razorpay_payment_id);
  if (existingPayment && existingPayment.status === 'SUCCESS') {
    logger.info('Payment already verified', { razorpay_payment_id });
    return existingPayment;
  }

  // 3. Check if order is already paid
  const order = await Order.findById(orderId);
  if (!order) throw new AppError('Order not found', 404);
  // Ownership check for protected verify endpoint (webhook calls pass null user)
  if (user) {
    const userId = typeof user === 'string' ? user : (user?.id || user?._id);
    const role = user?.role || null;
    if (!(role === 'ADMIN' || role === 'SUPER_ADMIN') && userId && order.userId.toString() !== userId.toString()) {
      throw new AppError('Access denied', 403);
    }
  }
  if (order.paymentStatus === 'PAID') {
    logger.warn('Order already marked as paid', { orderId, razorpay_payment_id });
    return existingPayment || { status: 'SUCCESS', orderId, message: 'Order already paid' };
  }

  // 4. Signature verification
  const isValid = await gateway.verifyPayment({
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
  });

  if (!isValid) {
    logger.error('Payment signature verification failed', { razorpay_payment_id, orderId });
    throw new AppError('Payment verification failed', 400);
  }

  // 🔒 Acquire a payment-specific lock to prevent concurrent verification/webhook races
  const lockKey = `payment:lock:${orderId}`;
  const lockValue = `${razorpay_payment_id}-${Date.now()}-${Math.random().toString(36).slice(2,8)}`;
  let lockHeld = false;
  try {
    lockHeld = await redisClient.acquireLock(lockKey, lockValue, 60);
    logger.debug('verifyPayment - payment lock acquisition', { lockKey, lockValue, lockHeld, orderId, razorpay_payment_id });
    if (!lockHeld) {
      logger.warn('verifyPayment - could not acquire payment lock, checking payment state', { lockKey, orderId, razorpay_payment_id });
      const dbPayment = await repo.findByRazorpayPaymentId(razorpay_payment_id);
      if (dbPayment && dbPayment.status === 'SUCCESS') {
        logger.info('verifyPayment - payment already processed while lock busy', { razorpay_payment_id, orderId });
        return dbPayment;
      }
      // If not processed, proceed cautiously (could be webhook in flight); continue without lock but log
      logger.warn('verifyPayment - proceeding without lock (race condition possible)', { orderId, razorpay_payment_id });
    }
  } catch (lockErr) {
    logger.error('verifyPayment - lock acquisition error', { lockKey, error: lockErr?.message || String(lockErr) });
  }
  // 5. Mark as processed in Redis (24h TTL)
  if (!DISABLE_REDIS) {
    await redisClient.setex(replayKey, 86400, Date.now().toString());
  } else {
    logger.info('PAYMENT_DISABLE_REDIS=true - skipping setex for replayKey');
  }

  // 6. Find payment record (using transactionId which stores RZP order ID initially)
  let payment = await repo.findByTransactionId(razorpay_order_id);
  
  if (!payment) {
    // fallback to orderId if not found by transactionId
    payment = await repo.findByOrderId(orderId);
  }

  if (!payment) throw new AppError('Payment record not found', 404);

  if (payment.status === 'SUCCESS') {
    logger.info('Payment already marked as success', { razorpay_payment_id });
    // Ensure lock is released before returning
    try {
      if (lockHeld) {
        const releasedEarly = await redisClient.releaseLock(lockKey, lockValue);
        logger.debug('verifyPayment - early release of payment lock', { lockKey, lockValue, releasedEarly, orderId, razorpay_payment_id });
      }
    } catch (releaseErr) {
      logger.error('verifyPayment - failed to release payment lock (early)', { lockKey, error: releaseErr?.message || String(releaseErr), orderId, razorpay_payment_id });
    }
    return payment;
  }

  // 7. Update payment record atomically
  try {
    payment.status = 'SUCCESS';
    payment.razorpayPaymentId = razorpay_payment_id;
    await payment.save();

    logger.info('Payment verified successfully', { orderId, razorpay_payment_id });
  } finally {
    // Release payment lock if held
    try {
      if (lockHeld) {
        const released = await redisClient.releaseLock(lockKey, lockValue);
        logger.debug('verifyPayment - payment lock released (finally)', { lockKey, lockValue, released, orderId, razorpay_payment_id });
      }
    } catch (releaseErr) {
      logger.error('verifyPayment - failed to release payment lock', { lockKey, error: releaseErr?.message || String(releaseErr), orderId, razorpay_payment_id });
    }
  }
  
  // 🔒 PHASE 2 FIX: Additional amount validation if available in payload
  if (payload.amount !== undefined) {
    const receivedAmount = typeof payload.amount === 'number' ? payload.amount / 100 : payload.amount;
    const amountDifference = Math.abs(order.totalAmount - receivedAmount);
    
    if (amountDifference > 1) {
      logger.error('🚨 SECURITY ALERT: Payment verification amount mismatch', {
        orderId: order._id,
        userId: order.userId,
        expectedAmount: order.totalAmount,
        receivedAmount,
        difference: amountDifference,
        razorpay_payment_id,
        severity: 'CRITICAL'
      });
      
      // Rollback payment status
      payment.status = 'FAILED';
      payment.metadata = {
        ...payment.metadata,
        failureReason: 'Amount mismatch in verification',
        expectedAmount: order.totalAmount,
        receivedAmount
      };
      await payment.save();
      
      throw new AppError('Payment amount mismatch detected - transaction rejected', 400);
    }
  }

  // 8. Update order record
  // Prefer the orderId stored on the payment record to avoid mismatches from the frontend payload.
  const targetOrderId = (payment?.orderId && (typeof payment.orderId === 'string' ? payment.orderId : payment.orderId.toString())) || orderId;
  const orderToUpdate = await Order.findById(targetOrderId);

  if (!orderToUpdate) {
    logger.error('Order referenced by payment not found', { paymentId: payment._id, targetOrderId });
    throw new AppError('Order referenced by payment not found', 404);
  }

  if (orderToUpdate.paymentStatus !== 'PAID') {
    orderToUpdate.paymentStatus = 'PAID';
    orderToUpdate.status = 'CONFIRMED';
    await orderToUpdate.save();
    
    // Finalize inventory reservation after successful payment (best-effort)
    try {
      const { finalizeReservation } = await import('../inventory/inventory.service.js');
      await finalizeReservation(orderToUpdate._id.toString());
      logger.info('Inventory reservation finalized', { orderId: orderToUpdate._id });
    } catch (err) {
      logger.error('CRITICAL: Failed to finalize inventory reservation', {
        orderId: orderToUpdate._id,
        error: err.message,
        stack: err.stack
      });
      // Continue — do not revert DB changes
    }

    // Emit socket event (best-effort)
    try {
      if (global.io) {
        global.io.emit('payment:success', { 
          orderId: orderToUpdate._id, 
          userId: orderToUpdate.userId,
          amount: orderToUpdate.totalAmount,
          method: payment.paymentMethod 
        });
      }
    } catch (emitErr) {
      logger.warn('Socket emission failed', { error: emitErr?.message || String(emitErr) });
    }

    // Enqueue post-payment jobs but do not fail the request if the queue is down
    if (!DISABLE_REDIS) {
      try {
        const { queuePostPaymentJobs } = await import('../../services/queueManager.service.js');
        await queuePostPaymentJobs({
          orderId: orderToUpdate._id.toString(),
          userId: orderToUpdate.userId.toString(),
          amount: orderToUpdate.totalAmount,
          paymentMethod: payment.paymentMethod,
        });
      } catch (queueErr) {
        logger.error('Post-payment queue job failed', { error: queueErr?.message || String(queueErr), orderId: orderToUpdate._id });
        // Do not throw — we've already committed DB changes
      }
    } else {
      logger.info('PAYMENT_DISABLE_REDIS=true - skipping queuePostPaymentJobs (post-payment jobs)');
    }
    
    // Clear User Cart immediately (best-effort)
    try {
      const CartModel = mongoose.model('Cart');
      await CartModel.findOneAndUpdate(
        { userId: orderToUpdate.userId },
        { $set: { items: [] } }
      );
    } catch (cartErr) {
      logger.error('Failed to clear cart after payment', { orderId: orderToUpdate._id, error: cartErr.message });
      // Don't fail payment verification if cart clear fails
    }
  }

  // 7. Send notification (best-effort)
  try {
    await sendNotification({
      userId: orderToUpdate.userId,
      ...TEMPLATES.PAYMENT_SUCCESS(orderToUpdate.totalAmount),
    });
  } catch (notifyErr) {
    logger.error('Failed to send payment notification', { orderId: orderToUpdate._id, error: notifyErr?.message || String(notifyErr) });
  }

  const totalVerifyDuration = Date.now() - startVerify;
  logger.debug('END verifyPayment', { orderId, razorpay_payment_id, durationMs: totalVerifyDuration });
  if (totalVerifyDuration > 1000) {
    logger.warn('Slow operation: verifyPayment took >1s', { orderId, razorpay_payment_id, durationMs: totalVerifyDuration });
  }
  return payment;
};

export const failPayment = async (orderId, reason, user = null) => {
  const order = await Order.findById(orderId);
  if (!order) throw new AppError('Order not found', 404);
  if (user) {
    const userId = typeof user === 'string' ? user : (user?.id || user?._id);
    const role = user?.role || null;
    if (!(role === 'ADMIN' || role === 'SUPER_ADMIN') && userId && order.userId.toString() !== userId.toString()) {
      throw new AppError('Access denied', 403);
    }
  }

  order.paymentStatus = PAYMENT_STATUS.FAILED;
  order.status = ORDER_STATUS.FAILED;
  order.metadata = { ...order.metadata, failureReason: reason };
  await order.save();

  // 🔒 CRITICAL FIX: Release inventory reservation on payment failure
  try {
    const { releaseReservation } = await import('../inventory/inventory.service.js');
    await releaseReservation(orderId);
    logger.info('Inventory reservation released on payment failure', { orderId });
  } catch (err) {
    logger.error('Failed to release inventory reservation', { orderId, error: err.message });
    // Non-blocking - reservation will auto-expire via TTL
  }

  // Note: For COD orders, stock was already deducted, so we need to restore it
  // For non-COD orders that failed before payment, stock was only reserved, now released
  if (order.paymentMethod === 'COD') {
    const { restoreStock } = await import('../product/product.service.js');
    for (const item of order.items) {
      await restoreStock(item.productId, item.quantity);
    }
  }

  return { status: 'FAILED', orderId };
};

export const handleWebhook = async (rawBody, signature) => {
  const { redisClient } = await import('../../config/redis.js');
  const { logger } = await import('../../config/logger.js');
  
  // 1. Validate webhook secret configuration
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) {
    logger.error('RAZORPAY_WEBHOOK_SECRET is not configured');
    throw new AppError('Webhook configuration error', 500);
  }

  // 2. Verify signature using raw body
  const isValid = gateway.verifyWebhookSignature(rawBody, signature, secret);
  if (!isValid) {
    logger.error('Webhook signature verification failed');
    throw new AppError('Invalid webhook signature', 400);
  }

  const body = JSON.parse(rawBody);
  const event = body.event;
  const webhookId = body.id || `${event}_${Date.now()}`; // Razorpay webhook ID
  const payload = body.payload.payment.entity;

  // 3. Webhook Idempotency Check - prevent duplicate processing
  const webhookKey = `webhook:processed:${webhookId}`;
  // Try to acquire a short-lived processing lock to avoid duplicate concurrent runs
  const acquired = await redisClient.set(webhookKey, 'processing', 'NX', 'EX', 60);
  if (!acquired) {
    logger.info('Webhook already processing or recently processed, ignoring duplicate', { webhookId, event });
    return { status: 'ok', message: 'Already processed or processing' };
  }
  logger.info('Processing webhook', { webhookId, event });

  if (event === 'payment.captured') {
    const razorpay_order_id = payload.order_id;
    const razorpay_payment_id = payload.id;
    const amount = payload.amount / 100; // Convert paise to rupees
    
    logger.info('Processing payment.captured webhook', { razorpay_payment_id, razorpay_order_id });
    
    // 5. Check for duplicate payment processing
    const existingPayment = await repo.findByRazorpayPaymentId(razorpay_payment_id);
    if (existingPayment && existingPayment.status === 'SUCCESS') {
      logger.info('Payment already captured', { razorpay_payment_id });
      return { status: 'ok', message: 'Already captured' };
    }

    let payment = await repo.findByTransactionId(razorpay_order_id);
    if (!payment) return { status: 'ok' };

    // 🔒 Acquire payment lock to avoid concurrent verify vs webhook updates
    const paymentLockKey = `payment:lock:${payment.orderId}`;
    const paymentLockValue = `${razorpay_payment_id}-${Date.now()}-${Math.random().toString(36).slice(2,8)}`;
    let paymentLockHeld = false;
    try {
      paymentLockHeld = await redisClient.acquireLock(paymentLockKey, paymentLockValue, 60);
      logger.debug('handleWebhook - payment lock acquisition', { paymentLockKey, paymentLockValue, paymentLockHeld, razorpay_payment_id, orderId: payment.orderId });
      if (!paymentLockHeld) {
        logger.warn('handleWebhook - payment lock busy', { paymentLockKey, razorpay_payment_id, orderId: payment.orderId });
        // Re-check payment state and return if already processed
        const freshPayment = await repo.findByRazorpayPaymentId(razorpay_payment_id);
        if (freshPayment && freshPayment.status === 'SUCCESS') {
          logger.info('handleWebhook - payment processed while lock busy, skipping', { razorpay_payment_id });
          return { status: 'ok', message: 'Already processed' };
        }
        // Otherwise continue cautiously (race possible)
      }

      payment.status = 'SUCCESS';
      payment.razorpayPaymentId = razorpay_payment_id;
      await payment.save();

      const order = await Order.findById(payment.orderId);
      if (order && order.paymentStatus !== 'PAID') {
        const expectedAmount = payment.amount ?? order.totalAmount;
        const amountDifference = Math.abs(expectedAmount - amount);
        if (amountDifference > 1) {
        logger.error('🚨 SECURITY ALERT: Webhook amount mismatch - REJECTING payment processing', {
          orderId: order._id,
          userId: order.userId,
          expectedAmount,
          receivedAmount: amount,
          difference: amountDifference,
          razorpay_payment_id,
          razorpay_order_id,
          severity: 'CRITICAL'
        });
        
        // 🔒 Mark payment as FAILED to prevent partial updates
        payment.status = 'FAILED';
        payment.metadata = {
          ...payment.metadata,
          failureReason: 'Amount mismatch detected',
          expectedAmount: payment.amount ?? order.totalAmount,
          receivedAmount: amount
        };
        await payment.save();
        
        // 🔒 Mark order as FAILED to prevent fulfillment
        order.status = 'FAILED';
        order.metadata = {
          ...order.metadata,
          securityAlert: 'Amount mismatch in webhook',
          expectedAmount: payment.amount ?? order.totalAmount,
          receivedAmount: amount
        };
        await order.save();
        
        // 🔒 STOP entire payment processing immediately
        throw new AppError('Payment amount mismatch detected - transaction rejected for security', 400);
        }
      }
    } finally {
      // Ensure payment lock released even on exceptions for this critical section
      try {
        if (paymentLockHeld) {
          const released = await redisClient.releaseLock(paymentLockKey, paymentLockValue);
          logger.debug('handleWebhook - payment lock released (finally)', { paymentLockKey, paymentLockValue, released, razorpay_payment_id });
        }
      } catch (releaseErr) {
        logger.error('handleWebhook - failed to release payment lock (finally)', { paymentLockKey, error: releaseErr?.message || String(releaseErr), razorpay_payment_id });
      }
    }
      order.paymentStatus = 'PAID';
      order.status = 'CONFIRMED';
      await order.save();
      
      logger.info('Order marked as paid via webhook', { orderId: order._id });
      
      // 🔒 CRITICAL FIX: Finalize inventory reservation after webhook payment
      try {
        const { finalizeReservation } = await import('../inventory/inventory.service.js');
        await finalizeReservation(order._id.toString());
        logger.info('Inventory reservation finalized via webhook', { orderId: order._id });
      } catch (err) {
        logger.error('CRITICAL: Failed to finalize inventory reservation via webhook', {
          orderId: order._id,
          error: err.message,
          stack: err.stack
        });
        // Enqueue a retry job to ensure reconciliation later
        try {
          const { queuePostPaymentJobs } = await import('../../services/queueManager.service.js');
          await queuePostPaymentJobs({
            orderId: order._id.toString(),
            userId: order.userId.toString(),
            amount: order.totalAmount,
            paymentMethod: 'ONLINE',
            task: 'finalizeReservation',
          });
          logger.info('Enqueued finalizeReservation retry job', { orderId: order._id });
        } catch (queueErr) {
          logger.error('Failed to enqueue finalizeReservation retry job', { orderId: order._id, error: queueErr.message });
        }
      }

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

      // 🔒 PHASE 4: Queue-based post-payment processing (replaces setImmediate)
      const { queuePostPaymentJobs } = await import('../../services/queueManager.service.js');
      await queuePostPaymentJobs({
        orderId: order._id.toString(),
        userId: order.userId.toString(),
        amount: order.totalAmount,
        paymentMethod: 'ONLINE',
      });

      // Clear cart immediately
      try {
        const CartModel = mongoose.model('Cart');
        await CartModel.findOneAndUpdate(
          { userId: order.userId },
          { $set: { items: [] } }
        );
      } catch (cartErr) {
        logger.error('Failed to clear cart via webhook', { orderId: order._id, error: cartErr.message });
      }
    }
    // Mark webhook as fully processed (24h TTL)
    try {
      await redisClient.setex(webhookKey, 86400, Date.now().toString());
    } catch (err) {
      logger.error('Failed to mark webhook as processed in Redis', { webhookId, error: err.message });
    }
    
    // Release payment lock if we acquired it
    try {
      if (paymentLockHeld) {
        const released = await redisClient.releaseLock(paymentLockKey, paymentLockValue);
        logger.debug('handleWebhook - payment lock released', { paymentLockKey, paymentLockValue, released, razorpay_payment_id });
      }
    } catch (releaseErr) {
      logger.error('handleWebhook - failed to release payment lock', { paymentLockKey, error: releaseErr?.message || String(releaseErr), razorpay_payment_id });
    }

  return { status: 'ok' };
};

/**
 * 🔒 PHASE 4: Secure refund system with idempotency and inventory restoration
 * Creates a refund for an order with comprehensive validation and tracking
 */
export const createRefund = async (orderId, userId, refundAmount, reason, initiatedBy) => {
  const { redisClient } = await import('../../config/redis.js');
  const { logger } = await import('../../config/logger.js');
  const Refund = (await import('./refund.model.js')).default;
  const { restoreStock } = await import('../inventory/inventory.service.js');
  const { createRefund: gatewayCreateRefund } = await import('./payment.gateway.js');

  // 1. Validate order exists
  const order = await Order.findById(orderId);
  if (!order) {
    throw new AppError('Order not found', 404);
  }

  // 2. Verify user authorization (admin or order owner)
  const isAdmin = ['ADMIN', 'SUPER_ADMIN'].includes(initiatedBy.role);
  if (!isAdmin && order.userId.toString() !== userId.toString()) {
    throw new AppError('Unauthorized to refund this order', 403);
  }

  // 3. Validate order is paid
  if (order.paymentStatus !== 'PAID') {
    throw new AppError('Cannot refund unpaid order', 400);
  }

  // 4. 🔒 Idempotency check - prevent duplicate refunds
  const refundKey = `refund:${orderId}:${userId}`;
  const existingRefundCheck = await redisClient.get(refundKey);
  if (existingRefundCheck) {
    logger.warn('Duplicate refund attempt detected', { orderId, userId });
    const existingRefund = await Refund.findById(existingRefundCheck);
    if (existingRefund) {
      return existingRefund;
    }
  }

  // 5. Find payment record
  const payment = await repo.findByOrderId(orderId);
  if (!payment || !payment.razorpayPaymentId) {
    throw new AppError('Payment record not found or incomplete', 404);
  }

  // 6. Check for existing refunds
  const existingRefunds = await Refund.find({ orderId, status: { $in: ['SUCCESS', 'PROCESSING'] } });
  const totalRefunded = existingRefunds.reduce((sum, r) => sum + r.amount, 0);

  // 7. Validate refund amount
  const maxRefundable = order.totalAmount - totalRefunded;
  const finalRefundAmount = refundAmount || maxRefundable;

  if (finalRefundAmount > maxRefundable) {
    throw new AppError(`Cannot refund ${finalRefundAmount}. Maximum refundable: ${maxRefundable}`, 400);
  }

  if (finalRefundAmount <= 0) {
    throw new AppError('Refund amount must be greater than 0', 400);
  }

  // 8. Determine refund type
  const refundType = finalRefundAmount === order.totalAmount ? 'FULL' : 'PARTIAL';

  // 9. Create refund record
  const refund = await Refund.create({
    orderId,
    paymentId: payment._id,
    userId: order.userId,
    amount: finalRefundAmount,
    refundType,
    status: 'INITIATED',
    razorpayPaymentId: payment.razorpayPaymentId,
    reason: reason || 'Customer request',
    initiatedBy: initiatedBy._id,
  });

  // 10. 🔒 Mark refund as in-progress for idempotency (24h TTL)
  await redisClient.setex(refundKey, 86400, refund._id.toString());

  try {
    // 11. Update refund status to processing
    refund.status = 'PROCESSING';
    await refund.save();

    // 12. Create Razorpay refund
    const gatewayRefund = await gatewayCreateRefund({
      paymentId: payment.razorpayPaymentId,
      amount: refundType === 'PARTIAL' ? finalRefundAmount : undefined,
      notes: {
        order_id: orderId.toString(),
        reason: reason || 'Customer request',
        refund_type: refundType,
      },
      receipt: `refund_${orderId}_${Date.now()}`,
    });

    // 13. Mark refund as success
    await refund.markSuccess(gatewayRefund.refund_id, gatewayRefund);

    // 14. 🔒 Restore inventory for full refunds or cancellations
    if (refundType === 'FULL' && order.items && order.items.length > 0) {
      try {
        const restoredItems = [];

        for (const item of order.items) {
          await restoreStock(item.productId, item.quantity);
          restoredItems.push({
            productId: item.productId,
            quantity: item.quantity,
          });
        }

        await refund.markInventoryRestored(restoredItems);
        logger.info('Inventory restored after full refund', {
          orderId,
          refundId: refund._id,
          itemCount: restoredItems.length,
        });
      } catch (inventoryErr) {
        logger.error('Failed to restore inventory after refund', {
          orderId,
          refundId: refund._id,
          error: inventoryErr.message,
        });
        // Don't fail refund if inventory restoration fails
      }
    }

    // 15. Update order status for full refunds
    if (refundType === 'FULL') {
      order.paymentStatus = 'REFUNDED';
      order.status = 'CANCELLED';
      await order.save();
    }

    logger.info('Refund completed successfully', {
      orderId,
      refundId: refund._id,
      amount: finalRefundAmount,
      refundType,
      razorpayRefundId: gatewayRefund.refund_id,
    });

    return refund;
  } catch (error) {
    // Mark refund as failed
    await refund.markFailed({
      message: error.message,
      code: error.code || 'REFUND_FAILED',
    });

    logger.error('Refund processing failed', {
      orderId,
      refundId: refund._id,
      error: error.message,
      stack: error.stack,
    });

    throw new AppError(`Refund failed: ${error.message}`, 500);
  }
};

/**
 * Get refund history for an order
 */
export const getRefundHistory = async (orderId) => {
  const refunds = await Refund.find({ orderId }).sort({ createdAt: -1 }).populate('initiatedBy', 'name email');

  return refunds;
};

/**
 * Get refund by ID
 */
export const getRefundById = async (refundId) => {
  const refund = await Refund.findById(refundId)
    .populate('orderId')
    .populate('paymentId')
    .populate('initiatedBy', 'name email');

  if (!refund) {
    throw new AppError('Refund not found', 404);
  }

  return refund;
};
