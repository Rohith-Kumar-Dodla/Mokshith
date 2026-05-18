import { Worker } from 'bullmq';
import { redisClient } from '../config/redis.js';
import { logger } from '../config/logger.js';

/**
 * BullMQ Worker Manager for background job processing
 * Handles all background workers with proper error handling and retry logic
 */

const workers = [];

// Redis connection config for BullMQ
const connection = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT) || 6379,
  password: process.env.REDIS_PASSWORD,
  maxRetriesPerRequest: null, // Required for BullMQ
  enableReadyCheck: false
};

/**
 * Email worker
 */
const emailWorker = new Worker(
  'email',
  async (job) => {
    const { to, subject, body, html } = job.data;
    
    logger.info('Processing email job', { to, subject, jobId: job.id });
    
    // TODO: Implement actual email sending (SendGrid, AWS SES, etc.)
    // For now, just log
    logger.info('Email sent (mock)', { to, subject });
    
    return { success: true, to, subject };
  },
  {
    connection,
    concurrency: 5, // Process 5 emails concurrently
    limiter: {
      max: 100, // Max 100 jobs
      duration: 60000 // Per 60 seconds
    },
    settings: {
      backoffStrategy: (attemptsMade) => {
        // Exponential backoff: 5s, 25s, 125s
        return Math.min(5000 * Math.pow(5, attemptsMade), 300000);
      }
    }
  }
);

/**
 * Notification worker
 */
const notificationWorker = new Worker(
  'notification',
  async (job) => {
    const { userId, type, title, message } = job.data;
    
    logger.info('Processing notification job', { userId, type, jobId: job.id });
    
    // Send notification via Socket.IO
    if (global.io) {
      global.io.to(userId).emit('notification', {
        type,
        title,
        message,
        timestamp: new Date()
      });
    }
    
    return { success: true, userId };
  },
  {
    connection,
    concurrency: 10,
    settings: {
      backoffStrategy: (attemptsMade) => {
        return 3000 * Math.pow(2, attemptsMade); // 3s, 6s, 12s
      }
    }
  }
);

/**
 * Inventory sync worker
 */
const inventoryWorker = new Worker(
  'inventory',
  async (job) => {
    const { productId, warehouseId, quantity, operation } = job.data;
    
    logger.info('Processing inventory job', { productId, operation, jobId: job.id });
    
    // Inventory operations are now handled in inventory.service.js with optimistic locking
    // This worker can be used for bulk operations or syncing with external systems
    
    return { success: true, productId };
  },
  {
    connection,
    concurrency: 3
  }
);

/**
 * Payment processing worker
 */
const paymentWorker = new Worker(
  'payment',
  async (job) => {
    const { orderId, paymentId, operation } = job.data;
    
    logger.info('Processing payment job', { orderId, operation, jobId: job.id });
    
    // Payment operations (verification, reconciliation, etc.)
    
    return { success: true, orderId };
  },
  {
    connection,
    concurrency: 5,
    settings: {
      backoffStrategy: (attemptsMade) => {
        // Critical payment jobs: longer backoff
        return 10000 * Math.pow(3, attemptsMade); // 10s, 30s, 90s
      }
    }
  }
);

/**
 * Webhook processing worker
 */
const webhookWorker = new Worker(
  'webhook',
  async (job) => {
    const { url, payload, headers, retryCount = 0 } = job.data;
    
    logger.info('Processing webhook job', { url, jobId: job.id, retryCount });
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...headers
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(10000) // 10 second timeout
      });
      
      if (!response.ok) {
        throw new Error(`Webhook failed with status ${response.status}`);
      }
      
      logger.info('Webhook delivered successfully', { url, jobId: job.id });
      return { success: true, status: response.status };
    } catch (error) {
      logger.error('Webhook delivery failed', { url, error: error.message, retryCount, attemptsMade: job.attemptsMade });
      throw error; // Let BullMQ handle retries
    }
  },
  {
    connection,
    concurrency: 3,
    limiter: {
      max: 50,
      duration: 60000
    },
    settings: {
      backoffStrategy: (attemptsMade) => {
        // Webhooks: 30s, 2m, 10m
        return [30000, 120000, 600000][attemptsMade - 1] || 600000;
      }
    }
  }
);

/**
 * Audit log worker for async audit logging
 */
const auditWorker = new Worker(
  'audit',
  async (job) => {
    const { userId, action, resource, details } = job.data;
    
    logger.info('Processing audit log', { userId, action, resource, jobId: job.id });
    
    // Audit logs are typically written directly, but this worker can handle bulk operations
    // or forward to external audit systems (Splunk, ELK, etc.)
    
    return { success: true };
  },
  {
    connection,
    concurrency: 10 // High concurrency for logging
  }
);

/**
 * Image optimization worker
 */
const imageWorker = new Worker(
  'image-processing',
  async (job) => {
    const { imageUrl, operations } = job.data;
    
    logger.info('Processing image optimization', { imageUrl, jobId: job.id });
    
    // TODO: Implement image processing (resize, compress, format conversion)
    // Using Sharp, Jimp, or external service like Cloudinary
    
    return { success: true, imageUrl };
  },
  {
    connection,
    concurrency: 2 // CPU intensive, keep low
  }
);

/**
 * Data archival worker
 */
const archivalWorker = new Worker(
  'data-archival',
  async (job) => {
    const { collection, filter, archiveDate } = job.data;
    
    logger.info('Processing data archival', { collection, jobId: job.id });
    
    // Archive old data to cold storage or separate database
    // Move orders/payments older than X days to archive collection
    
    return { success: true, collection };
  },
  {
    connection,
    concurrency: 1, // Run sequentially to avoid DB load
    limiter: {
      max: 1,
      duration: 300000 // Max 1 archival job per 5 minutes
    }
  }
);

// Store all workers
workers.push(
  emailWorker,
  notificationWorker,
  inventoryWorker,
  paymentWorker,
  webhookWorker,
  auditWorker,
  imageWorker,
  archivalWorker
);

// 🔒 Production-grade error handlers for all workers
workers.forEach((worker) => {
  // ✅ Job completed successfully
  worker.on('completed', (job, result) => {
    logger.info(`Worker ${worker.name} completed job`, { 
      jobId: job.id, 
      jobName: job.name,
      attemptsMade: job.attemptsMade,
      duration: Date.now() - job.timestamp
    });
  });

  // ❌ Job failed after all retries
  worker.on('failed', (job, err) => {
    logger.error(`Worker ${worker.name} job failed permanently`, { 
      jobId: job?.id,
      jobName: job?.name,
      attemptsMade: job?.attemptsMade,
      error: err.message,
      stack: err.stack,
      data: job?.data
    });
    
    // TODO: Send alert for critical failed jobs (payment, webhook)
    if (['payment', 'webhook'].includes(worker.name)) {
      logger.error(`CRITICAL: ${worker.name} job failed - manual intervention required`, {
        jobId: job?.id,
        data: job?.data
      });
    }
  });

  // ⚠️ Worker-level error (not job-specific)
  worker.on('error', (err) => {
    logger.error(`Worker ${worker.name} encountered error`, { 
      error: err.message,
      stack: err.stack
    });
  });
  
  // 🕐 Job is taking too long (stalled)
  worker.on('stalled', (jobId) => {
    logger.warn(`Worker ${worker.name} job stalled`, { 
      jobId,
      message: 'Job exceeded processing time, may be stuck'
    });
  });
  
  // 🔄 Job is being retried
  worker.on('progress', (job, progress) => {
    if (job.attemptsMade > 1) {
      logger.info(`Worker ${worker.name} retrying job`, {
        jobId: job.id,
        attemptsMade: job.attemptsMade,
        progress
      });
    }
  });
});

/**
 * Graceful shutdown for all workers
 * Closes workers, drains pending jobs, and closes Redis connections
 */
export const shutdownWorkers = async () => {
  if (workers.length === 0) {
    logger.info('No workers to shut down');
    return;
  }
  
  logger.info('Starting graceful shutdown of BullMQ workers...', { workerCount: workers.length });
  
  const shutdownPromises = workers.map(async (worker) => {
    try {
      logger.info(`Closing worker: ${worker.name}`);
      
      // Close worker gracefully:
      // - Stops accepting new jobs
      // - Waits for active jobs to complete (or timeout)
      // - Closes Redis connection
      await worker.close();
      
      logger.info(`Worker ${worker.name} closed successfully`);
    } catch (error) {
      logger.error(`Failed to close worker ${worker.name}`, { 
        error: error.message,
        stack: error.stack 
      });
      // Continue closing other workers even if one fails
    }
  });
  
  await Promise.allSettled(shutdownPromises);
  
  logger.info('✅ All workers shut down gracefully');
};

/**
 * Start all workers
 */
export const startWorkers = () => {
  if (process.env.ENABLE_QUEUE !== 'true') {
    logger.info('BullMQ workers disabled');
    return;
  }

  logger.info(`✅ Started ${workers.length} BullMQ workers`);
};

// Auto-start if queues are enabled
if (process.env.ENABLE_QUEUE === 'true') {
  startWorkers();
}

export { workers };
