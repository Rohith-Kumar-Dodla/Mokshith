import Razorpay from 'razorpay';
import { env } from './env.js';
import { logger } from './logger.js';

let razorpayInstance = null;

export function isRazorpayEnabled() {
  return Boolean(env.RAZORPAY_KEY_ID && env.RAZORPAY_KEY_SECRET);
}

/**
 * Returns the Razorpay SDK client. Throws only when online payment code calls it
 * without credentials configured.
 */
export function getRazorpay() {
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

/** @deprecated Use getRazorpay() — kept for backward compatibility when configured */
export const razorpay = isRazorpayEnabled() ? getRazorpay() : null;
