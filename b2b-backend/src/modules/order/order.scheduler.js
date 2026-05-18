import Order from './order.model.js';
import { sendNotification } from '../notification/notification.service.js';
import { logger } from '../../config/logger.js';

export const cancelPendingOrders = async () => {
  try {
    const expiryTime = new Date(Date.now() - 30 * 60 * 1000);

    const orders = await Order.find({
      status: 'PENDING',
      createdAt: { $lt: expiryTime },
    });

    for (const order of orders) {
      order.status = 'CANCELLED';
      await order.save();

      // 🔥 Optional: notify user
      await sendNotification({
        userId: order.userId,
        title: 'Order Cancelled',
        message: `Your order ${order._id} was cancelled due to timeout.`,
      });
    }

    logger.info('Cancelled expired orders', { count: orders.length });
  } catch (error) {
    logger.error('Order cleanup job failed', { error: error.message, stack: error.stack });
  }
};