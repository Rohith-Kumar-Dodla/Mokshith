import { razorpay } from '../../config/razorpay.js';
import crypto from 'crypto';
import { env } from '../../config/env.js';

/**
 * Creates a Razorpay order for payment processing
 * @param {Object} params - Payment parameters
 * @param {number} params.amount - Amount in INR (will be converted to paise)
 * @param {string} params.currency - Currency code (default: INR)
 * @param {string} params.receipt - Unique receipt identifier
 * @returns {Promise<Object>} Razorpay order with required fields
 */
export const createPaymentOrder = async ({ amount, currency = 'INR', receipt }) => {
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
    console.warn(`⚠️ Receipt ID too long (${options.receipt.length} chars), truncating...`);
    options.receipt = options.receipt.substring(0, 40);
  }

  try {
    const order = await razorpay.orders.create(options);
    
    console.log('✅ Razorpay order created:', {
      orderId: order.id,
      amount: order.amount,
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
    console.error('❌ Razorpay order creation error:', error.message);
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
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      console.error('❌ Missing payment verification fields');
      return false;
    }

    const sign = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSign = crypto
      .createHmac('sha256', env.razorpay.keySecret)
      .update(sign.toString())
      .digest('hex');

    const isValid = expectedSign === razorpay_signature;

    if (!isValid) {
      console.error('❌ Payment signature verification failed');
    }

    return isValid;
  } catch (error) {
    console.error('❌ Payment verification error:', error.message);
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
    console.error('❌ Webhook signature verification error:', error.message);
    return false;
  }
};
