import mongoose from 'mongoose';
import { logger } from '../config/logger.js';

/**
 * 🔥 CRITICAL: Payment Timeout Handler
 * Marks payments pending for >15 minutes as FAILED to prevent indefinite pending states
 * Restores inventory for failed payments
 */
export const reconcilePayments = async () => {
  try {
    const Payment = mongoose.model('Payment');
    const Order = mongoose.model('Order');
    
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
    
    // Find payments that are stuck in PENDING/INITIATED for >15 minutes
    const stuckPayments = await Payment.find({
      status: { $in: ['PENDING', 'INITIATED'] },
      createdAt: { $lt: fifteenMinutesAgo }
    }).limit(100); // Process in batches

    if (stuckPayments.length === 0) {
      logger.info('💳 Payment reconciliation: No stuck payments found');
      return { processed: 0, failed: 0 };
    }

    logger.info(`💳 Payment reconciliation: Found ${stuckPayments.length} stuck payments`);
    
    let processed = 0;
    let failed = 0;

    for (const payment of stuckPayments) {
      try {
        // Mark payment as FAILED
        payment.status = 'FAILED';
        payment.metadata = {
          ...payment.metadata,
          failureReason: 'Payment timeout - exceeded 15 minutes',
          autoFailedAt: new Date()
        };
        await payment.save();

        // Update associated order
        const order = await Order.findById(payment.orderId);
        if (order && order.paymentStatus !== 'PAID') {
          order.paymentStatus = 'FAILED';
          order.status = 'FAILED';
          order.metadata = {
            ...order.metadata,
            failureReason: 'Payment timeout',
            autoFailedAt: new Date()
          };
          await order.save();

          // Restore stock
          const { restoreStock } = await import('../modules/inventory/inventory.service.js');
          for (const item of order.items || []) {
            try {
              await restoreStock(item.productId, item.quantity);
            } catch (err) {
              logger.error(`Failed to restore stock for product ${item.productId}:`, err.message);
            }
          }
          
          logger.info(`✅ Reconciled payment ${payment._id} for order ${order._id}`);
        }

        processed++;
      } catch (err) {
        logger.error(`Failed to reconcile payment ${payment._id}:`, err.message);
        failed++;
      }
    }

    logger.info(`💳 Payment reconciliation complete: ${processed} processed, ${failed} failed`);
    return { processed, failed };
  } catch (error) {
    logger.error('❌ Payment reconciliation job failed:', error);
    throw error;
  }
};