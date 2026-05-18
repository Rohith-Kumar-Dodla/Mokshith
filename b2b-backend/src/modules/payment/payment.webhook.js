import { handleWebhook } from './payment.service.js';
import { logger } from '../../config/logger.js';

/**
 * DEPRECATED: This webhook handler is not used.
 * The actual webhook handler is in payment.controller.js (razorpayWebhook)
 * which properly validates signatures. This file is kept for backwards compatibility.
 */
export const paymentWebhook = async (req, res) => {
  try {
    // 🔒 CRITICAL: Validate webhook signature
    const signature = req.headers['x-razorpay-signature'];
    const rawBody = req.rawBody;
    
    if (!signature) {
      logger.error('Webhook rejected: Missing signature');
      return res.status(400).json({ success: false, error: 'Missing signature' });
    }
    
    // 🔒 CRITICAL: Enforce raw body requirement for signature verification
    if (!rawBody) {
      logger.error('Webhook rejected: rawBody missing', {
        path: req.path,
        contentType: req.headers['content-type']
      });
      return res.status(400).json({ success: false, error: 'Invalid request format' });
    }

    const result = await handleWebhook(rawBody, signature);
    res.status(200).json({ success: true, result });
  } catch (err) {
    logger.error('Webhook processing failed', { error: err.message, stack: err.stack });
    res.status(400).json({ success: false, error: err.message });
  }
};