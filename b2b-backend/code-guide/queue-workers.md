# Queue Workers & Job Processing

> **Complete guide to asynchronous job processing with BullMQ and Redis**

---

## Table of Contents

- [Queue System Overview](#queue-system-overview)
- [BullMQ Architecture](#bullmq-architecture)
- [Available Queues](#available-queues)
- [Queue Configuration](#queue-configuration)
- [Worker Implementation](#worker-implementation)
- [Job Retry Strategy](#job-retry-strategy)
- [Background Cron Jobs](#background-cron-jobs)
- [Queue Monitoring](#queue-monitoring)
- [Error Handling](#error-handling)

---

## Queue System Overview

### Why Async Job Processing?

**Problem:** Some operations are slow and shouldn't block HTTP responses
- Sending emails (3-5 seconds)
- Generating PDFs (2-10 seconds)
- Processing webhooks (variable)
- Syncing with external APIs
- Heavy computations

**Solution:** Queue jobs for background processing

```
HTTP Request → Create Order → Queue Email Job → Return Response (200ms)
                                     ↓
                              Worker processes job (3 seconds)
```

### Benefits

1. **Fast Response Times:** Users don't wait for slow operations
2. **Reliability:** Jobs are persisted in Redis (survive crashes)
3. **Retry Logic:** Failed jobs automatically retried
4. **Scalability:** Add more workers to handle load
5. **Monitoring:** Track job status, failures, and performance

---

## BullMQ Architecture

```
┌──────────────┐
│  Express App │ ← HTTP Requests
└──────┬───────┘
       ↓ Add Jobs
┌──────────────┐
│  BullMQ      │ ← Queue Manager
│  Queues      │
└──────┬───────┘
       ↓ Store in Redis
┌──────────────┐
│    Redis     │ ← Job Storage
└──────┬───────┘
       ↑ Poll for Jobs
┌──────────────┐
│   Workers    │ ← Process Jobs
│ (Separate    │
│  Processes)  │
└──────────────┘
```

### Components

**1. Queue:** Job storage and management
**2. Worker:** Job processor (separate process)
**3. Redis:** Persistent storage for jobs
**4. Job:** Unit of work with data and metadata

---

## Available Queues

| Queue Name | Purpose | Priority | Max Attempts |
|------------|---------|----------|--------------|
| `emailQueue` | Send emails | Normal | 3 |
| `notificationQueue` | Push notifications | High | 5 |
| `inventoryQueue` | Stock sync | Normal | 2 |
| `paymentQueue` | Payment processing | Critical | 5 |
| `webhookQueue` | Third-party webhooks | Normal | 3 |
| `auditQueue` | Audit log processing | Low | 1 |
| `imageQueue` | Image processing | Low | 2 |
| `archivalQueue` | Data archival | Low | 1 |

---

## Queue Configuration

### Queue Factory

**File:** `src/config/queue.js`

```javascript
import { Queue } from 'bullmq';
import redisClient from './redis.js';

export const createQueue = (name, options = {}) => {
  return new Queue(name, {
    connection: redisClient,
    defaultJobOptions: {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000 // Start with 2 seconds, then 4, 8, 16...
      },
      removeOnComplete: {
        age: 24 * 3600, // Keep completed jobs for 24 hours
        count: 1000 // Keep max 1000 completed jobs
      },
      removeOnFail: {
        age: 7 * 24 * 3600 // Keep failed jobs for 7 days
      },
      ...options
    }
  });
};
```

### Queue Instances

**File:** `src/queues/email.queue.js`

```javascript
import { createQueue } from '../config/queue.js';
import { QUEUE_NAMES } from '../constants/queueNames.js';

export const emailQueue = createQueue(QUEUE_NAMES.EMAIL, {
  attempts: 3,
  priority: 5 // Higher number = higher priority
});
```

**File:** `src/queues/notification.queue.js`

```javascript
export const notificationQueue = createQueue(QUEUE_NAMES.NOTIFICATION, {
  attempts: 5,
  priority: 10, // High priority
  backoff: {
    type: 'exponential',
    delay: 1000 // Faster retry for notifications
  }
});
```

### Adding Jobs to Queue

**From Service Layer:**

```javascript
// src/modules/order/order.service.js
import { emailQueue } from '../../queues/email.queue.js';
import { notificationQueue } from '../../queues/notification.queue.js';

export const createOrder = async (orderData) => {
  // 1. Create order
  const order = await Order.create(orderData);

  // 2. Queue async jobs (don't wait)
  await Promise.all([
    emailQueue.add('order.confirmation', {
      userId: order.userId,
      orderId: order._id,
      email: order.email
    }),

    notificationQueue.add('order.created', {
      userId: order.userId,
      orderId: order._id,
      message: `Order ${order._id} created successfully`
    }),

    auditQueue.add('order.created', {
      userId: order.userId,
      action: 'ORDER_CREATED',
      orderId: order._id
    })
  ]);

  // 3. Return immediately (jobs processing in background)
  return order;
};
```

---

## Worker Implementation

### Email Worker

**File:** `src/workers/email.worker.js`

```javascript
import { Worker } from 'bullmq';
import redisClient from '../config/redis.js';
import { sendEmail } from '../services/email.service.js';
import { QUEUE_NAMES } from '../constants/queueNames.js';
import logger from '../config/logger.js';

const emailWorker = new Worker(
  QUEUE_NAMES.EMAIL,
  async (job) => {
    const { name, data } = job;

    logger.info(`Processing email job: ${name}`, { jobId: job.id });

    try {
      switch (name) {
        case 'order.confirmation':
          await sendOrderConfirmationEmail(data);
          break;

        case 'payment.success':
          await sendPaymentConfirmationEmail(data);
          break;

        case 'password.reset':
          await sendPasswordResetEmail(data);
          break;

        default:
          logger.warn(`Unknown email job type: ${name}`);
      }

      logger.info(`Email job completed: ${name}`, { jobId: job.id });
    } catch (error) {
      logger.error(`Email job failed: ${name}`, {
        jobId: job.id,
        error: error.message
      });
      throw error; // Rethrow to trigger retry
    }
  },
  {
    connection: redisClient,
    concurrency: 5, // Process 5 jobs in parallel
    limiter: {
      max: 100, // Max 100 jobs per minute
      duration: 60000
    }
  }
);

// Event listeners
emailWorker.on('completed', (job) => {
  logger.info(`Job ${job.id} completed`);
});

emailWorker.on('failed', (job, err) => {
  logger.error(`Job ${job.id} failed:`, err);
});

emailWorker.on('error', (err) => {
  logger.error('Worker error:', err);
});

export default emailWorker;
```

### Notification Worker

**File:** `src/workers/notification.worker.js`

```javascript
import { Worker } from 'bullmq';
import redisClient from '../config/redis.js';
import { sendPushNotification } from '../services/notification.service.js';
import { io } from '../config/socketAdapter.js'; // Socket.io
import logger from '../config/logger.js';

const notificationWorker = new Worker(
  'notificationQueue',
  async (job) => {
    const { userId, message, type, data } = job.data;

    // 1. Create notification record
    const notification = await Notification.create({
      userId,
      message,
      type,
      data,
      read: false
    });

    // 2. Send real-time notification via Socket.io
    io.to(`user:${userId}`).emit('notification', {
      id: notification._id,
      message,
      type,
      createdAt: notification.createdAt
    });

    // 3. Send push notification (if enabled)
    const user = await User.findById(userId);
    if (user.pushNotificationsEnabled && user.deviceToken) {
      await sendPushNotification(user.deviceToken, message, data);
    }

    // 4. Send SMS (if critical)
    if (type === 'CRITICAL' && user.phoneNumber) {
      await smsQueue.add('send.sms', {
        to: user.phoneNumber,
        message
      });
    }

    return { notificationId: notification._id };
  },
  {
    connection: redisClient,
    concurrency: 10 // High concurrency for fast notifications
  }
);

export default notificationWorker;
```

### Payment Worker

**File:** `src/workers/payment.worker.js`

```javascript
import { Worker } from 'bullmq';
import redisClient from '../config/redis.js';
import { processPaymentWebhook } from '../modules/payment/payment.service.js';
import logger from '../config/logger.js';

const paymentWorker = new Worker(
  'paymentQueue',
  async (job) => {
    const { type, payload } = job.data;

    // Process payment webhook
    await processPaymentWebhook(type, payload);

    return { success: true };
  },
  {
    connection: redisClient,
    concurrency: 3, // Limited concurrency for payment processing
    limiter: {
      max: 50,
      duration: 60000
    }
  }
);

// Enhanced error handling for critical payment jobs
paymentWorker.on('failed', async (job, err) => {
  logger.error(`Payment job ${job.id} failed:`, {
    error: err.message,
    attempts: job.attemptsMade,
    data: job.data
  });

  // Alert ops team if payment processing fails
  if (job.attemptsMade >= job.opts.attempts) {
    await notificationQueue.add('ops.alert', {
      subject: 'CRITICAL: Payment Processing Failed',
      message: `Payment job ${job.id} failed after ${job.attemptsMade} attempts`,
      data: job.data,
      error: err.message
    });
  }
});

export default paymentWorker;
```

---

## Job Retry Strategy

### Exponential Backoff

**Strategy:** Retry with increasing delays

```
Attempt 1: Immediate
Attempt 2: After 2 seconds
Attempt 3: After 4 seconds
Attempt 4: After 8 seconds
Attempt 5: After 16 seconds
```

**Configuration:**

```javascript
{
  attempts: 5,
  backoff: {
    type: 'exponential',
    delay: 2000 // Initial delay in ms
  }
}
```

### Fixed Delay

**Strategy:** Retry with fixed delay

```
Attempt 1: Immediate
Attempt 2: After 5 seconds
Attempt 3: After 5 seconds
```

**Configuration:**

```javascript
{
  attempts: 3,
  backoff: {
    type: 'fixed',
    delay: 5000
  }
}
```

### Custom Backoff

```javascript
{
  attempts: 5,
  backoff: {
    type: 'custom'
  }
}

// In worker:
Worker.on('failed', (job, err) => {
  if (job.attemptsMade < job.opts.attempts) {
    const delay = job.attemptsMade * 10000; // 10s, 20s, 30s, 40s, 50s
    setTimeout(() => job.retry(), delay);
  }
});
```

### Dead Letter Queue

**When:** Job fails after max attempts

**Action:** Move to Dead Letter Queue for manual review

```javascript
paymentWorker.on('failed', async (job, err) => {
  if (job.attemptsMade >= job.opts.attempts) {
    // Move to dead letter queue
    await deadLetterQueue.add('payment.failed', {
      originalJob: job.data,
      error: err.message,
      attempts: job.attemptsMade,
      timestamp: Date.now()
    });
  }
});
```

---

## Background Cron Jobs

### Cron Scheduler

**File:** `src/jobs/cron.js`

```javascript
import cron from 'node-cron';
import { reconcilePayments } from './paymentReconcile.job.js';
import { syncInventory } from './inventorySync.job.js';
import { sendCreditReminders } from './creditReminder.job.js';
import { cleanupOldOrders } from './orderCleanup.job.js';
import { updateAnalytics } from './analytics.job.js';
import { cleanupExpiredData } from './cleanup.job.js';
import logger from '../config/logger.js';

// Payment reconciliation (daily at 2:00 AM)
cron.schedule('0 2 * * *', async () => {
  logger.info('Running payment reconciliation job');
  await reconcilePayments();
});

// Inventory sync (every 15 minutes)
cron.schedule('*/15 * * * *', async () => {
  logger.info('Running inventory sync job');
  await syncInventory();
});

// Credit reminders (daily at 9:00 AM)
cron.schedule('0 9 * * *', async () => {
  logger.info('Running credit reminder job');
  await sendCreditReminders();
});

// Order cleanup (daily at 1:00 AM)
cron.schedule('0 1 * * *', async () => {
  logger.info('Running order cleanup job');
  await cleanupOldOrders();
});

// Analytics update (every hour)
cron.schedule('0 * * * *', async () => {
  logger.info('Running analytics update job');
  await updateAnalytics();
});

// Cleanup expired data (daily at 3:00 AM)
cron.schedule('0 3 * * *', async () => {
  logger.info('Running cleanup job');
  await cleanupExpiredData();
});

logger.info('Cron jobs initialized');
```

### Payment Reconciliation Job

**File:** `src/jobs/paymentReconcile.job.js`

```javascript
import { razorpayInstance } from '../config/razorpay.js';
import Payment from '../modules/payment/payment.model.js';
import logger from '../config/logger.js';

export const reconcilePayments = async () => {
  try {
    // 1. Fetch payments from last 24 hours
    const startTime = Date.now() - 24 * 60 * 60 * 1000;
    const payments = await Payment.find({
      createdAt: { $gte: startTime },
      paymentStatus: { $in: ['PENDING', 'SUCCESS'] }
    });

    logger.info(`Reconciling ${payments.length} payments`);

    let mismatches = 0;

    // 2. Verify each payment with Razorpay
    for (const payment of payments) {
      try {
        const razorpayPayment = await razorpayInstance.payments.fetch(
          payment.razorpayPaymentId
        );

        const razorpayStatus = razorpayPayment.status === 'captured' ? 'SUCCESS' : 'FAILED';

        // 3. Check for mismatch
        if (payment.paymentStatus !== razorpayStatus) {
          logger.warn(`Payment mismatch detected:`, {
            paymentId: payment._id,
            localStatus: payment.paymentStatus,
            razorpayStatus
          });

          // Update local record
          payment.paymentStatus = razorpayStatus;
          await payment.save();

          mismatches++;
        }
      } catch (error) {
        logger.error(`Error reconciling payment ${payment._id}:`, error);
      }
    }

    logger.info(`Payment reconciliation complete. Mismatches: ${mismatches}`);
  } catch (error) {
    logger.error('Payment reconciliation job failed:', error);
  }
};
```

---

## Queue Monitoring

### Get Queue Stats

```javascript
// Get queue metrics
const emailQueueStats = await emailQueue.getJobCounts();
/*
{
  waiting: 15,
  active: 5,
  completed: 1523,
  failed: 12,
  delayed: 3
}
*/

// Get failed jobs
const failedJobs = await emailQueue.getFailed(0, 10); // Get first 10

// Get active jobs
const activeJobs = await emailQueue.getActive(0, 10);
```

### Queue Dashboard Endpoint

**File:** `src/modules/admin/admin.controller.js`

```javascript
export const getQueueStats = async (req, res) => {
  const queues = [
    emailQueue,
    notificationQueue,
    paymentQueue,
    inventoryQueue,
    webhookQueue
  ];

  const stats = await Promise.all(
    queues.map(async (queue) => ({
      name: queue.name,
      counts: await queue.getJobCounts(),
      workers: await queue.getWorkers(),
      isPaused: await queue.isPaused()
    }))
  );

  res.json({ success: true, queues: stats });
};
```

### Queue Health Check

```javascript
export const checkQueueHealth = async () => {
  const health = {
    status: 'healthy',
    issues: []
  };

  // Check if workers are running
  const workers = await emailQueue.getWorkers();
  if (workers.length === 0) {
    health.status = 'unhealthy';
    health.issues.push('No email workers running');
  }

  // Check for stuck jobs
  const activeJobs = await emailQueue.getActive();
  const stuckJobs = activeJobs.filter(job => {
    const startedAt = job.processedOn || job.timestamp;
    return Date.now() - startedAt > 5 * 60 * 1000; // Stuck for > 5 min
  });

  if (stuckJobs.length > 0) {
    health.status = 'degraded';
    health.issues.push(`${stuckJobs.length} jobs stuck`);
  }

  return health;
};
```

---

## Error Handling

### Job-Level Error Handling

```javascript
const worker = new Worker('myQueue', async (job) => {
  try {
    await processJob(job.data);
  } catch (error) {
    // Log error
    logger.error(`Job ${job.id} failed:`, error);

    // Check if retryable
    if (error.code === 'NETWORK_ERROR' && job.attemptsMade < 3) {
      // Will retry automatically
      throw error;
    }

    if (error.code === 'INVALID_DATA') {
      // Don't retry invalid data
      logger.error(`Job ${job.id} has invalid data, not retrying`);
      return; // Mark as completed (don't retry)
    }

    // Rethrow for retry
    throw error;
  }
});
```

### Global Error Handlers

```javascript
worker.on('error', (err) => {
  logger.error('Worker error:', err);
  // Alert ops team
});

worker.on('failed', (job, err) => {
  logger.error(`Job ${job.id} failed after ${job.attemptsMade} attempts:`, err);

  // Send alert for critical jobs
  if (job.name.startsWith('payment.')) {
    alertOpsTeam('Critical payment job failed', { job, error: err });
  }
});

worker.on('stalled', (jobId) => {
  logger.warn(`Job ${jobId} stalled`);
});
```

---

## Starting Workers

### Production Setup

**File:** `workers/index.js` (separate process)

```javascript
import emailWorker from './email.worker.js';
import notificationWorker from './notification.worker.js';
import paymentWorker from './payment.worker.js';
import inventoryWorker from './inventory.worker.js';
import webhookWorker from './webhook.worker.js';
import auditWorker from './audit.worker.js';
import logger from '../src/config/logger.js';

const workers = [
  emailWorker,
  notificationWorker,
  paymentWorker,
  inventoryWorker,
  webhookWorker,
  auditWorker
];

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, closing workers...');
  await Promise.all(workers.map(w => w.close()));
  process.exit(0);
});

logger.info('All workers started');
```

**Start workers separately from main app:**

```bash
# Terminal 1: Start main app
npm start

# Terminal 2: Start workers
node workers/index.js
```

**Production (PM2):**

```bash
# Start app
pm2 start server.js --name "api"

# Start workers
pm2 start workers/index.js --name "workers" --instances 2
```

---

**Document Version:** 1.0  
**Last Updated:** May 2026  
**Maintained By:** Engineering Team
