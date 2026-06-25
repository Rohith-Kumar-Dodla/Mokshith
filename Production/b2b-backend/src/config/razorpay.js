import Razorpay from 'razorpay';
import { env } from './env.js';
import { logger } from './logger.js';

let razorpayInstance = null;

export function isRazorpayEnabled() {
  const keyId = process.env.RAZORPAY_KEY_ID || env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET || env.RAZORPAY_KEY_SECRET;
  return Boolean(keyId && keySecret);
}

/**
 * Returns the Razorpay SDK client. Throws only when online payment code calls it
 * without credentials configured.
 */
export function getRazorpay() {
  // Allow tests to inject a mock Razorpay instance via global.__RAZORPAY_MOCK__
  if (process.env.NODE_ENV === 'test' && global.__RAZORPAY_MOCK__) {
    return global.__RAZORPAY_MOCK__;
  }

  if (!isRazorpayEnabled()) {
    throw new Error(
      'Razorpay is not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in .env to enable online payments.'
    );
  }

  if (!razorpayInstance) {
    razorpayInstance = new Razorpay({
      key_id: env.RAZORPAY_KEY_ID,
      key_secret: env.RAZORPAY_KEY_SECRET,
    });

    logger.info('Razorpay initialized', {
      keyId: `${env.RAZORPAY_KEY_ID.substring(0, 10)}***`,
      env: process.env.NODE_ENV,
    });
  }

  return razorpayInstance;
}

if (!isRazorpayEnabled()) {
  logger.warn(
    'Razorpay credentials not configured — COD, credit, and bank transfer flows remain available; online/UPI payments are disabled until configured.'
  );
}

/** Note: do NOT instantiate the Razorpay client at module load.
 *  Tests mock the 'razorpay' module; importing/creating the client here
 *  would force an early require of the real SDK and prevent mocks from applying.
 *  Use getRazorpay() to obtain a client at call time.
 */
