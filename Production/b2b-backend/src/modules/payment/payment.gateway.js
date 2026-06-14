import { getRazorpay, isRazorpayEnabled } from '../../config/razorpay.js';
import crypto from 'crypto';
import { env } from '../../config/env.js';
import { logger } from '../../config/logger.js';

/**
 * Creates a Razorpay order for payment processing
 * @param {Object} params - Payment parameters
 * @param {number} params.amount - Amount in INR (will be converted to paise)
 * @param {string} params.currency - Currency code (default: INR)
 * @param {string} params.receipt - Unique receipt identifier
 * @returns {Promise<Object>} Razorpay order with required fields
 */
export const createPaymentOrder = async ({ amount, currency = 'INR', receipt }) => {
  if (!isRazorpayEnabled()) {
    throw new Error('Razorpay is not configured. Online payments are currently unavailable.');
  }

  const razorpay = getRazorpay();

  // Validate amount
  const numericAmount = Number(amount);
  if (isNaN(numericAmount) || numericAmount < 0) {
    throw new Error('Invalid amount provided for payment');
  }

  // Razorpay minimum is ₹1 (100 paise)
  if (numericAmount < 1) {
    throw new Error('Minimum payment amount is ₹1');
  }

  const razorpayAmount = Math.round(Number(numericAmount) * 100);

  const options = {
    amount: razorpayAmount,
    currency,
    receipt: receipt || `rcpt_${Date.now()}`,
  };

  // Razorpay receipt limit is 40 characters
  if (options.receipt.length > 40) {
    logger.warn('Receipt ID too long, truncating', { originalLength: options.receipt.length, receipt: options.receipt.substring(0, 40) });
    options.receipt = options.receipt.substring(0, 40);
  }

  try {
    // 🔒 Timeout protection: 10 second timeout for Razorpay API
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Razorpay API timeout after 10 seconds')), 10000);
    });
    
    const order = await Promise.race([
      razorpay.orders.create(options),
      timeoutPromise
    ]);
    
    logger.info('Razorpay order created successfully', {
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      status: order.status
    });

    return {
      id: order.id,
      order_id: order.id,
      gatewayOrderId: order.id,
      amount: order.amount,
      currency: order.currency,
      receipt: order.receipt,
      status: order.status
    };
  } catch (error) {
    logger.error('Razorpay order creation failed', { error: error.message, amount, currency });
    const errorMessage = error.error?.description || error.message || 'Razorpay order creation failed';
    throw new Error(`Razorpay Error: ${errorMessage}`);
  }
};

/**
 * Verifies a Razorpay payment signature using HMAC-SHA256
 * @param {Object} params - Verification parameters
 * @param {string} params.razorpay_order_id - Razorpay order ID
 * @param {string} params.razorpay_payment_id - Razorpay payment ID
 * @param {string} params.razorpay_signature - Signature from Razorpay
 * @returns {boolean} True if signature is valid
 */
export const verifyPayment = async ({ razorpay_order_id, razorpay_payment_id, razorpay_signature }) => {
  try {
    if (!isRazorpayEnabled()) {
      logger.error('Payment verification attempted but Razorpay is not configured');
      return false;
    }

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      logger.error('Payment verification missing required fields', { 
        hasOrderId: !!razorpay_order_id, 
        hasPaymentId: !!razorpay_payment_id, 
        hasSignature: !!razorpay_signature 
      });
      return false;
    }
    
    // Note: Signature verification is synchronous, no timeout needed

    const sign = razorpay_order_id + '|' + razorpay_payment_id;
    const keySecret = process.env.RAZORPAY_KEY_SECRET || env.razorpay?.keySecret || env.RAZORPAY_KEY_SECRET;
    const expectedSign = crypto
      .createHmac('sha256', keySecret)
      .update(sign.toString())
      .digest('hex');

    const isValid = expectedSign === razorpay_signature;

    if (!isValid) {
      logger.error('Payment signature verification failed', { 
        orderId: razorpay_order_id, 
        paymentId: razorpay_payment_id 
      });
    }

    return isValid;
  } catch (error) {
    logger.error('Payment verification error', { error: error.message, stack: error.stack });
    return false;
  }
};

/**
 * Verifies webhook signature from Razorpay
 * @param {string} body - Raw request body
 * @param {string} signature - X-Razorpay-Signature header value
 * @param {string} secret - Webhook secret
 * @returns {boolean} True if signature is valid
 */
export const verifyWebhookSignature = (body, signature, secret) => {
  try {
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(body)
      .digest('hex');

    return expectedSignature === signature;
  } catch (error) {
    logger.error('Webhook signature verification error', { error: error.message });
    return false;
  }
};

/**
 * 🔒 PHASE 4: Razorpay refund functionality
 * Creates a refund for a payment
 * @param {Object} params - Refund parameters
 * @param {string} params.paymentId - Razorpay payment ID to refund
 * @param {number} [params.amount] - Amount to refund in INR (optional, defaults to full refund)
 * @param {string} [params.notes] - Additional notes for the refund
 * @param {string} [params.receipt] - Unique receipt identifier for refund
 * @returns {Promise<Object>} Razorpay refund object
 */
export const createRefund = async ({ paymentId, amount, notes, receipt }) => {
  try {
    if (!isRazorpayEnabled()) {
      throw new Error('Razorpay is not configured. Refunds are currently unavailable.');
    }

    const razorpay = getRazorpay();

    if (!paymentId) {
      throw new Error('Payment ID is required for refund');
    }

    const refundOptions = {
      payment_id: paymentId,
    };

    // If amount is specified, validate and convert to paise
    if (amount !== undefined && amount !== null) {
      const numericAmount = Number(amount);
      if (isNaN(numericAmount) || numericAmount <= 0) {
        throw new Error('Invalid refund amount provided');
      }
      refundOptions.amount = Math.round(numericAmount * 100); // Convert to paise
    }

    // Add optional parameters
    if (notes) {
      refundOptions.notes = typeof notes === 'object' ? notes : { reason: notes };
    }
    if (receipt) {
      refundOptions.receipt = receipt.substring(0, 40); // Razorpay limit
    }

    logger.info('Initiating Razorpay refund', {
      paymentId,
      amount: refundOptions.amount,
      isPartial: !!refundOptions.amount,
    });

    // 🔒 Timeout protection: 15 second timeout for refund API
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Razorpay refund API timeout after 15 seconds')), 15000);
    });

    const refund = await Promise.race([
      razorpay.payments.refund(paymentId, refundOptions),
      timeoutPromise,
    ]);

    logger.info('Razorpay refund created successfully', {
      refundId: refund.id,
      paymentId: refund.payment_id,
      amount: refund.amount,
      status: refund.status,
      isPartial: refund.amount !== undefined,
    });

    return {
      id: refund.id,
      refund_id: refund.id,
      payment_id: refund.payment_id,
      amount: refund.amount / 100, // Convert back to INR
      currency: refund.currency,
      status: refund.status,
      created_at: refund.created_at,
      notes: refund.notes,
    };
  } catch (error) {
    logger.error('Razorpay refund failed', {
      error: error.message,
      paymentId,
      amount,
      stack: error.stack,
    });
    const errorMessage = error.error?.description || error.message || 'Razorpay refund failed';
    throw new Error(`Razorpay Refund Error: ${errorMessage}`);
  }
};

/**
 * Fetches refund details from Razorpay
 * @param {string} refundId - Razorpay refund ID
 * @returns {Promise<Object>} Refund details
 */
export const fetchRefund = async (refundId) => {
  try {
    if (!isRazorpayEnabled()) {
      throw new Error('Razorpay is not configured. Refunds are currently unavailable.');
    }

    const razorpay = getRazorpay();

    if (!refundId) {
      throw new Error('Refund ID is required');
    }

    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Razorpay fetch refund timeout')), 10000);
    });

    const refund = await Promise.race([razorpay.refunds.fetch(refundId), timeoutPromise]);

    return {
      id: refund.id,
      payment_id: refund.payment_id,
      amount: refund.amount / 100,
      currency: refund.currency,
      status: refund.status,
      created_at: refund.created_at,
    };
  } catch (error) {
    logger.error('Razorpay fetch refund failed', { error: error.message, refundId });
    throw new Error(`Failed to fetch refund: ${error.message}`);
  }
};
