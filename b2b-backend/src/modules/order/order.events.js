import { sendNotification } from '../notification/notification.service.js';
import { TEMPLATES } from '../notification/notification.templates.js';
import { logger } from '../../config/logger.js';

export const onOrderCreated = async (order) => {
  try {
    await sendNotification({
      userId: order.userId,
      ...TEMPLATES.ORDER_PLACED(order._id), // 🔥 standardized template
    });
  } catch (error) {
    // 🔥 Do not break main flow
    logger.error('Order notification failed', { orderId: order._id, userId: order.userId, error: error.message });
  }
};