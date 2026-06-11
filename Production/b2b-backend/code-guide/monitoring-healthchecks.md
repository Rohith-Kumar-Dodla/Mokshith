# Monitoring & Health Checks

> **Complete guide to logging, health checks, metrics tracking, and error monitoring**

---

## Table of Contents

- [Logging System](#logging-system)
- [Health Check Endpoints](#health-check-endpoints)
- [Metrics Tracking](#metrics-tracking)
- [Error Monitoring (Sentry)](#error-monitoring-sentry)
- [Queue Monitoring](#queue-monitoring)
- [Performance Monitoring](#performance-monitoring)

---

## Logging System

### Winston Logger

**File:** `src/config/logger.js`

```javascript
import winston from 'winston';
import path from 'path';

const { combine, timestamp, printf, colorize, errors, json } = winston.format;

// Custom log format for console
const consoleFormat = printf(({ level, message, timestamp, stack }) => {
  return `${timestamp} [${level}]: ${stack || message}`;
});

// Create logger instance
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: combine(
    errors({ stack: true }),
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' })
  ),
  transports: [
    // Console transport (development)
    new winston.transports.Console({
      format: combine(colorize(), consoleFormat)
    }),

    // File transport - Combined logs
    new winston.transports.File({
      filename: path.join('logs', 'combined.log'),
      format: json(),
      maxsize: 5242880, // 5MB
      maxFiles: 5,
      tailable: true
    }),

    // File transport - Error logs only
    new winston.transports.File({
      filename: path.join('logs', 'error.log'),
      level: 'error',
      format: json(),
      maxsize: 5242880,
      maxFiles: 5
    }),

    // File transport - HTTP logs
    new winston.transports.File({
      filename: path.join('logs', 'http.log'),
      level: 'http',
      format: json(),
      maxsize: 5242880,
      maxFiles: 3
    })
  ],
  exceptionHandlers: [
    new winston.transports.File({
      filename: path.join('logs', 'exceptions.log')
    })
  ],
  rejectionHandlers: [
    new winston.transports.File({
      filename: path.join('logs', 'rejections.log')
    })
  ]
});

// Silence logs in test environment
if (process.env.NODE_ENV === 'test') {
  logger.silent = true;
}

export default logger;
```

### HTTP Request Logging

**File:** `src/middlewares/logger.middleware.js`

```javascript
import morgan from 'morgan';
import logger from '../config/logger.js';

// Custom token for response time
morgan.token('response-time-ms', (req, res) => {
  if (!req._startTime || !res._startTime) return '0';
  const diff = process.hrtime(req._startTime);
  return (diff[0] * 1e3 + diff[1] * 1e-6).toFixed(2);
});

// Custom format
const morganFormat = ':method :url :status :response-time-ms ms - :res[content-length]';

// Stream to Winston
const stream = {
  write: (message) => logger.http(message.trim())
};

export const httpLogger = morgan(morganFormat, { stream });
```

### Logging Best Practices

```javascript
// ✅ Good - Structured logging with context
logger.info('Order created', {
  orderId: order._id,
  userId: user._id,
  amount: order.totalAmount,
  items: order.items.length
});

// ✅ Good - Error logging with stack trace
logger.error('Payment processing failed', {
  orderId: order._id,
  error: error.message,
  stack: error.stack,
  paymentGateway: 'Razorpay'
});

// ❌ Bad - No context
logger.info('Order created');

// ❌ Bad - Logging sensitive data
logger.info('User logged in', {
  email: user.email,
  password: user.password // NEVER LOG PASSWORDS!
});
```

---

## Health Check Endpoints

### Basic Health Check

**File:** `src/modules/health/health.controller.js`

```javascript
import mongoose from 'mongoose';
import redisClient from '../../config/redis.js';

export const healthCheck = async (req, res) => {
  const health = {
    uptime: process.uptime(),
    timestamp: Date.now(),
    status: 'UP'
  };

  res.json(health);
};

export const detailedHealthCheck = async (req, res) => {
  const health = {
    uptime: process.uptime(),
    timestamp: Date.now(),
    status: 'UP',
    services: {}
  };

  // Check MongoDB
  try {
    await mongoose.connection.db.admin().ping();
    health.services.mongodb = {
      status: 'UP',
      responseTime: await getMongoResponseTime()
    };
  } catch (error) {
    health.services.mongodb = {
      status: 'DOWN',
      error: error.message
    };
    health.status = 'DEGRADED';
  }

  // Check Redis
  try {
    const start = Date.now();
    await redisClient.ping();
    const responseTime = Date.now() - start;

    health.services.redis = {
      status: 'UP',
      responseTime: `${responseTime}ms`
    };
  } catch (error) {
    health.services.redis = {
      status: 'DOWN',
      error: error.message
    };
    health.status = 'DEGRADED';
  }

  // Check memory usage
  const memUsage = process.memoryUsage();
  health.memory = {
    rss: `${(memUsage.rss / 1024 / 1024).toFixed(2)} MB`,
    heapTotal: `${(memUsage.heapTotal / 1024 / 1024).toFixed(2)} MB`,
    heapUsed: `${(memUsage.heapUsed / 1024 / 1024).toFixed(2)} MB`,
    external: `${(memUsage.external / 1024 / 1024).toFixed(2)} MB`
  };

  // Check CPU usage
  health.cpu = {
    user: process.cpuUsage().user,
    system: process.cpuUsage().system
  };

  res.json(health);
};

const getMongoResponseTime = async () => {
  const start = Date.now();
  await mongoose.connection.db.admin().ping();
  return `${Date.now() - start}ms`;
};
```

**Routes:**

```javascript
router.get('/health', healthCheck);
router.get('/health/detailed', authenticate, requirePermission(PERMISSIONS.SYSTEM_READ), detailedHealthCheck);
```

### Liveness Probe

```javascript
// Simple liveness check (for Kubernetes)
export const liveness = (req, res) => {
  res.status(200).send('OK');
};
```

### Readiness Probe

```javascript
// Readiness check (for Kubernetes)
export const readiness = async (req, res) => {
  try {
    // Check if database is connected
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ status: 'NOT_READY', reason: 'Database not connected' });
    }

    // Check if Redis is connected
    if (redisClient.status !== 'ready') {
      return res.status(503).json({ status: 'NOT_READY', reason: 'Redis not connected' });
    }

    res.status(200).json({ status: 'READY' });
  } catch (error) {
    res.status(503).json({ status: 'NOT_READY', error: error.message });
  }
};
```

---

## Metrics Tracking

### Custom Metrics

**File:** `src/services/metrics.service.js`

```javascript
import redisClient from '../config/redis.js';
import logger from '../config/logger.js';

// Increment counter
export const incrementCounter = async (metric, value = 1) => {
  try {
    await redisClient.incrby(`metrics:${metric}`, value);
  } catch (error) {
    logger.error(`Failed to increment metric ${metric}:`, error);
  }
};

// Record timing
export const recordTiming = async (metric, duration) => {
  try {
    await redisClient.lpush(`metrics:timing:${metric}`, duration);
    await redisClient.ltrim(`metrics:timing:${metric}`, 0, 99); // Keep last 100
  } catch (error) {
    logger.error(`Failed to record timing ${metric}:`, error);
  }
};

// Get metrics
export const getMetrics = async () => {
  const keys = await redisClient.keys('metrics:*');
  const metrics = {};

  for (const key of keys) {
    const value = await redisClient.get(key);
    metrics[key.replace('metrics:', '')] = parseInt(value) || 0;
  }

  return metrics;
};
```

### Tracking Middleware

```javascript
export const trackMetrics = (req, res, next) => {
  const startTime = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - startTime;

    // Track request count
    incrementCounter('http.requests.total');
    incrementCounter(`http.requests.${req.method}.${res.statusCode}`);

    // Track response time
    recordTiming('http.response_time', duration);

    // Track errors
    if (res.statusCode >= 500) {
      incrementCounter('http.errors.5xx');
    } else if (res.statusCode >= 400) {
      incrementCounter('http.errors.4xx');
    }
  });

  next();
};
```

### Business Metrics

```javascript
// Track order creation
export const trackOrderCreated = async (order) => {
  await incrementCounter('business.orders.created');
  await incrementCounter(`business.orders.amount.${order.currency}`, order.totalAmount);
  logger.info('Order created', { orderId: order._id, amount: order.totalAmount });
};

// Track payment success
export const trackPaymentSuccess = async (payment) => {
  await incrementCounter('business.payments.success');
  await incrementCounter('business.revenue', payment.amount);
  logger.info('Payment successful', { paymentId: payment._id, amount: payment.amount });
};

// Track user registration
export const trackUserRegistration = async (user) => {
  await incrementCounter('business.users.registered');
  await incrementCounter(`business.users.role.${user.role}`);
  logger.info('User registered', { userId: user._id, role: user.role });
};
```

---

## Error Monitoring (Sentry)

### Sentry Setup

**File:** `src/config/sentry.js`

```javascript
import * as Sentry from '@sentry/node';
import * as Tracing from '@sentry/tracing';

export const initSentry = (app) => {
  if (process.env.NODE_ENV === 'production' && process.env.SENTRY_DSN) {
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      environment: process.env.NODE_ENV,
      release: process.env.APP_VERSION || '1.0.0',

      // Performance monitoring
      tracesSampleRate: 1.0,

      // Integrations
      integrations: [
        new Sentry.Integrations.Http({ tracing: true }),
        new Tracing.Integrations.Express({ app }),
        new Tracing.Integrations.Mongo()
      ],

      // Filter sensitive data
      beforeSend(event, hint) {
        // Remove sensitive data
        if (event.request) {
          delete event.request.cookies;
          if (event.request.headers) {
            delete event.request.headers.authorization;
          }
        }

        return event;
      }
    });

    // Request handler
    app.use(Sentry.Handlers.requestHandler());

    // Tracing handler
    app.use(Sentry.Handlers.tracingHandler());

    logger.info('Sentry initialized');
  }
};

export const sentryErrorHandler = () => {
  if (process.env.NODE_ENV === 'production' && process.env.SENTRY_DSN) {
    return Sentry.Handlers.errorHandler();
  }

  return (err, req, res, next) => next(err);
};

// Manual error capture
export const captureException = (error, context = {}) => {
  if (process.env.NODE_ENV === 'production' && process.env.SENTRY_DSN) {
    Sentry.captureException(error, { extra: context });
  }
  logger.error('Exception captured:', { error: error.message, context });
};
```

**Usage:**

```javascript
// In server.js
import { initSentry, sentryErrorHandler } from './config/sentry.js';

initSentry(app);

// Routes
app.use('/api', routes);

// Sentry error handler (before custom error handler)
app.use(sentryErrorHandler());

// Custom error handler
app.use(errorHandler);
```

---

## Queue Monitoring

### Queue Dashboard

**File:** `src/modules/admin/queue.controller.js`

```javascript
import { emailQueue, notificationQueue, paymentQueue } from '../../queues/index.js';

export const getQueueStats = async (req, res) => {
  const queues = [
    { name: 'Email Queue', queue: emailQueue },
    { name: 'Notification Queue', queue: notificationQueue },
    { name: 'Payment Queue', queue: paymentQueue }
  ];

  const stats = await Promise.all(
    queues.map(async ({ name, queue }) => {
      const counts = await queue.getJobCounts();
      const workers = await queue.getWorkers();
      const isPaused = await queue.isPaused();

      return {
        name,
        counts,
        workers: workers.length,
        isPaused,
        health: getQueueHealth(counts)
      };
    })
  );

  res.json({ success: true, queues: stats });
};

const getQueueHealth = (counts) => {
  if (counts.failed > 10) return 'CRITICAL';
  if (counts.waiting > 100) return 'WARNING';
  return 'HEALTHY';
};

export const getFailedJobs = async (req, res) => {
  const { queueName } = req.params;
  const queue = getQueueByName(queueName);

  const failedJobs = await queue.getFailed(0, 20);

  const jobs = failedJobs.map((job) => ({
    id: job.id,
    name: job.name,
    data: job.data,
    failedReason: job.failedReason,
    attemptsMade: job.attemptsMade,
    timestamp: job.timestamp
  }));

  res.json({ success: true, jobs });
};
```

---

## Performance Monitoring

### Response Time Tracking

```javascript
export const performanceMonitor = (req, res, next) => {
  const start = process.hrtime();

  res.on('finish', () => {
    const [seconds, nanoseconds] = process.hrtime(start);
    const duration = seconds * 1000 + nanoseconds / 1e6; // Convert to milliseconds

    // Log slow requests
    if (duration > 1000) {
      logger.warn('Slow request detected', {
        method: req.method,
        url: req.url,
        duration: `${duration.toFixed(2)}ms`,
        userId: req.user?._id
      });
    }

    // Track metrics
    recordTiming('http.response_time', duration);
  });

  next();
};
```

### Database Query Monitoring

```javascript
// Enable MongoDB query logging
mongoose.set('debug', (collectionName, method, query, doc) => {
  logger.debug('MongoDB Query', {
    collection: collectionName,
    method,
    query,
    doc
  });
});

// Track slow queries
mongoose.connection.on('slow', (event) => {
  logger.warn('Slow MongoDB query', {
    collection: event.collectionName,
    operation: event.commandName,
    duration: event.duration
  });
});
```

---

**Document Version:** 1.0  
**Last Updated:** May 2026  
**Maintained By:** Engineering Team
