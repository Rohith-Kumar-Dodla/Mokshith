import cron from 'node-cron';
import { logger } from '../config/logger.js';
import { reconcilePayments } from './paymentReconcile.job.js';

/**
 * 🔥 CRITICAL: Payment Timeout Reconciliation
 * Runs every 5 minutes to mark stuck payments as FAILED
 */
export const startCronJobs = () => {
  // Only run cron jobs if enabled via environment variable
  if (process.env.ENABLE_CRON !== 'true' && process.env.NODE_ENV !== 'production') {
    logger.info('⏰ Cron jobs disabled (set ENABLE_CRON=true to enable)');
    return;
  }

  logger.info('⏰ Starting cron jobs...');

  // Payment reconciliation - Every 5 minutes
  cron.schedule('*/5 * * * *', async () => {
    logger.info('⏰ Running payment reconciliation job');
    try {
      await reconcilePayments();
    } catch (error) {
      logger.error('❌ Payment reconciliation job failed:', error);
    }
  });
  
  // 🔒 Database lock cleanup - Every 10 minutes (when Redis is down)
  cron.schedule('*/10 * * * *', async () => {
    logger.debug('⏰ Running database lock cleanup job');
    try {
      const { redisClient } = await import('../config/redis.js');
      const result = await redisClient.cleanupExpiredLocks();
      if (result.deleted > 0) {
        logger.info('🔒 Cleaned up expired database locks', result);
      }
    } catch (error) {
      logger.error('❌ Database lock cleanup job failed:', error);
    }
  });

  logger.info('✅ Cron jobs started successfully');
};

// Graceful shutdown
export const stopCronJobs = () => {
  logger.info('⏰ Stopping cron jobs...');
  // node-cron doesn't have a global stop, but individual tasks can be stopped
  // Tasks are stopped when the process exits
};