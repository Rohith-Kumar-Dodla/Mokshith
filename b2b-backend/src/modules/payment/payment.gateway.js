import { razorpay } from '../../config/razorpay.js';
import crypto from 'crypto';
import { env } from '../../config/env.js';

// 🔥 Circuit Breaker State
const circuitBreaker = {
  failures: 0,
  lastFailure: null,
  threshold: 5,
  cooldown: 60000, // 1 minute
  isOpen: false
};

const checkCircuit = () => {
  if (circuitBreaker.isOpen) {
    const now = Date.now();
    if (now - circuitBreaker.lastFailure > circuitBreaker.cooldown) {
      circuitBreaker.isOpen = false;
      circuitBreaker.failures = 0;
      return true;
    }
    return false;
  }
  return true;
};

const recordFailure = () => {
  circuitBreaker.failures++;
  circuitBreaker.lastFailure = Date.now();
  if (circuitBreaker.failures >= circuitBreaker.threshold) {
    circuitBreaker.isOpen = true;
  }
};

const recordSuccess = () => {
  circuitBreaker.failures = 0;
  circuitBreaker.isOpen = false;
};

/**
 * Creates a Razorpay order for payment processing
 * @param {Object} params - Payment parameters
 * @param {number} params.amount - Amount in INR (will be converted to paise)
 * @param {string} params.currency - Currency code (default: INR)
 * @param {string} params.receipt - Unique receipt identifier
 * @returns {Promise<Object>} Razorpay order with required fields
 */
export const createPaymentOrder = async ({ amount, currency = 'INR', receipt }) => {
  if (!checkCircuit()) {
    throw new Error('Payment gateway is temporarily unavailable (Circuit Breaker). Please try again in a minute.');
  }
  // 🔥 VALIDATION: Ensure amount is valid
  const numericAmount = Number(amount);
  if (isNaN(numericAmount) || numericAmount < 0) {
    throw new Error('Invalid amount provided for payment');
  }

  // 🔥 VALIDATION: Razorpay minimum is ₹1 (100 paise)
  if (numericAmount < 1) {
    throw new Error('Minimum payment amount is ₹1');
  }

  // 🔥 VALIDATION: Reasonable maximum (₹10,000,000)
  if (numericAmount > 10000000) {
    throw new Error('Maximum payment amount is ₹1,00,00,000');
  }

  const razorpayAmount = Math.round(Number(numericAmount) * 100);

  // 🔥 VALIDATION: Ensure amount is an integer for Razorpay
  if (!Number.isInteger(razorpayAmount)) {
    throw new Error(`Razorpay amount conversion failed: ${razorpayAmount} is not an integer`);
  }

  const options = {
    amount: razorpayAmount,
    currency,
    receipt: receipt || `rcpt_${Date.now()}`,
  };

  // 🔥 VALIDATION: Razorpay receipt limit is 40 characters
  if (options.receipt.length > 40) {
    console.warn(`⚠️ [RAZORPAY] Receipt ID too long (${options.receipt.length} chars), truncating...`);
    options.receipt = options.receipt.substring(0, 40);
  }

  try {
    console.log('🚀 [RAZORPAY] Creating order...');
    console.log('💰 Original Amount (INR):', numericAmount);
    console.log('🪙 Converted Amount (Paise):', razorpayAmount);
    console.log('📝 Receipt:', options.receipt);
    console.log('🔑 Key Check:', !!env.RAZORPAY_KEY_ID);

    const order = await razorpay.orders.create(options);
    recordSuccess();
    
    console.log('✅ [RAZORPAY] Order created successfully:', {
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
    recordFailure();
    console.error('❌ [RAZORPAY] CREATE ORDER ERROR:');
    
    // Improved error extraction for Razorpay SDK
    const rzpError = error.error || error;
    const errorMessage = rzpError.description || rzpError.message || error.message || 'Razorpay order creation failed';
    
    console.error('Error Message:', errorMessage);
    console.error('Full Error Object:', JSON.stringify(error, null, 2));

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
    // ✅ VALIDATION: Check required fields
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      console.error('❌ Missing payment verification fields', {
        orderId: razorpay_order_id,
        paymentId: razorpay_payment_id,
        hasSignature: !!razorpay_signature
      });
      return false;
    }

    const sign = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSign = crypto
      .createHmac('sha256', env.RAZORPAY_KEY_SECRET)
      .update(sign.toString())
      .digest('hex');

    const isValid = razorpay_signature === expectedSign;
    
    if (isValid) {
      console.log('✅ Payment signature verified successfully');
    } else {
      console.error('❌ Payment signature verification failed:', {
        received: razorpay_signature,
        expected: expectedSign,
        sign
      });
    }

    return isValid;
  } catch (error) {
    console.error('❌ Error during payment verification:', error.message);
    return false;
  }
};

/**
 * Verifies a Razorpay webhook signature
 * @param {string} rawBody - Raw request body as string
 * @param {string} signature - X-Razorpay-Signature header value
 * @param {string} secret - Webhook secret from environment
 * @returns {boolean} True if webhook signature is valid
 */
export const verifyWebhookSignature = (rawBody, signature, secret) => {
  try {
    if (!secret) {
      console.error('❌ Webhook secret not configured');
      return false;
    }

    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(rawBody)
      .digest('hex');

    const isValid = signature === expectedSignature;
    
    if (!isValid) {
      console.error('❌ Webhook signature mismatch');
    }

    return isValid;
  } catch (error) {
    console.error('❌ Error verifying webhook signature:', error.message);
    return false;
  }
};