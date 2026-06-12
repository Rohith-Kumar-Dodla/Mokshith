/**
 * Shared payment service — extension point for multiple payment gateways.
 *
 * Bank transfer logic lives in modules/payment-proof/.
 * Razorpay integration is deferred; placeholders below document future wiring.
 */

// TODO: Future Razorpay integration will use:
// - POST /payments/create-order
// - POST /payments/verify
// - POST /payments/webhook
//
// Wire these methods to payment.gateway.js and payment.service.js when enabling Razorpay.

/**
 * @param {number} amount - Amount in INR (rupees)
 * @returns {Promise<object>} Razorpay order payload
 */
export async function createRazorpayOrder(/* amount */) {
  // const gateway = await import('../modules/payment/payment.gateway.js');
  // return gateway.createOrder(amount);
  throw new Error('Razorpay integration is not enabled');
}

/**
 * @param {object} payload - { orderId, razorpay_order_id, razorpay_payment_id, razorpay_signature }
 * @returns {Promise<object>} Verified payment record
 */
export async function verifyRazorpayPayment(/* payload */) {
  // const { verifyPayment } = await import('../modules/payment/payment.service.js');
  // return verifyPayment(payload);
  throw new Error('Razorpay integration is not enabled');
}

export { getBankTransferDetails } from '../config/payment.config.js';
