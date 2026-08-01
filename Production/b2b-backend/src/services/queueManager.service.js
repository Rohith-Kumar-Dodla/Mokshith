import { Queue } from 'bullmq';
import { logger } from '../config/logger.js';
import { getBullConnection } from '../config/redis.js';

/**
 * 🔒 PHASE 4: Centralized queue management for durable post-payment processing
 * Replaces setImmediate with reliable BullMQ jobs that survive server crashes
 */

const isQueueEnabled = () => process.env.ENABLE_QUEUE === 'true';

let postPaymentQueue;
let postOrderQueue;

function getPostPaymentQueue() {
  if (!isQueueEnabled()) {
    return null;
  }
  if (!postPaymentQueue) {
    postPaymentQueue = new Queue('post-payment', { connection: getBullConnection() });
  }
  return postPaymentQueue;
}

function getPostOrderQueue() {
  if (!isQueueEnabled()) {
    return null;
  }
  if (!postOrderQueue) {
    postOrderQueue = new Queue('post-order', { connection: getBullConnection() });
  }
  return postOrderQueue;
}

/**
 * Queue post-payment processing jobs (invoice, delivery, notifications)
 * @param {Object} data - Job data
 * @param {string} data.orderId - Order ID
 * @param {string} data.userId - User ID
 * @param {number} data.amount - Payment amount
 * @param {string} data.paymentMethod - Payment method
 */
export const queuePostPaymentJobs = async (data) => {
  if (!isQueueEnabled()) {
    logger.debug('Queues disabled - skipping queuePostPaymentJobs', { data });
    return;
  }

  const start = Date.now();
  logger.debug('START queuePostPaymentJobs', { data });
  try {
    const { orderId, userId, amount, paymentMethod } = data;

    if (!orderId) {
      logger.error('Cannot queue post-payment jobs without orderId', { data });
      return;
    }

    const queue = getPostPaymentQueue();
    if (!queue) {
      return;
    }

    // Add job with retry configuration
    await queue.add(
      'process-payment-completion',
      {
        orderId,
        userId,
        amount,
        paymentMethod,
        timestamp: Date.now(),
      },
      {
        attempts: 3, // Retry up to 3 times
        backoff: {
          type: 'exponential',
          delay: 2000, // 2s, 4s, 8s
        },
        removeOnComplete: 100, // Keep last 100 completed jobs
        removeOnFail: 200, // Keep last 200 failed jobs for debugging
      }
    );

    const duration = Date.now() - start;
    logger.info('Post-payment jobs queued', { orderId, userId, durationMs: duration });
    if (duration > 1000) {
      logger.warn('Slow operation: queuePostPaymentJobs took >1s', { orderId, userId, durationMs: duration });
    }
  } catch (error) {
    const duration = Date.now() - start;
    logger.error('Failed to queue post-payment jobs', {
      error: error.message,
      data,
      stack: error.stack,
      durationMs: duration
    });
    // Don't throw - post-payment tasks are non-critical
  }
};

/**
 * Queue post-order processing jobs (shipment, delivery assignment)
 * @param {Object} data - Job data
 * @param {string} data.orderId - Order ID
 * @param {string} data.userId - User ID
 * @param {string} data.paymentMethod - Payment method
 */
export const queuePostOrderJobs = async (data) => {
  if (!isQueueEnabled()) {
    logger.debug('Queues disabled - skipping queuePostOrderJobs', { data });
    return;
  }

  try {
    const { orderId, userId, paymentMethod } = data;

    if (!orderId) {
      logger.error('Cannot queue post-order jobs without orderId', { data });
      return;
    }

    const queue = getPostOrderQueue();
    if (!queue) {
      return;
    }

    await queue.add(
      'process-order-logistics',
      {
        orderId,
        userId,
        paymentMethod,
        timestamp: Date.now(),
      },
      {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 3000, // 3s, 6s, 12s
        },
        removeOnComplete: 100,
        removeOnFail: 200,
      }
    );

    logger.info('Post-order jobs queued', { orderId, userId });
  } catch (error) {
    logger.error('Failed to queue post-order jobs', {
      error: error.message,
      data,
      stack: error.stack,
    });
  }
};

/**
 * Graceful shutdown
 */
export const closeQueues = async () => {
  try {
    const closePromises = [];
    if (postPaymentQueue) {
      closePromises.push(postPaymentQueue.close());
    }
    if (postOrderQueue) {
      closePromises.push(postOrderQueue.close());
    }
    if (closePromises.length > 0) {
      await Promise.all(closePromises);
      logger.info('Queues closed successfully');
    }
    postPaymentQueue = undefined;
    postOrderQueue = undefined;
  } catch (error) {
    logger.error('Error closing queues', { error: error.message });
  }
};

export { getPostPaymentQueue as postPaymentQueue, getPostOrderQueue as postOrderQueue };
