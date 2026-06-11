# Error Handling & Logging

> **Comprehensive guide to centralized error handling, custom error classes, and logging strategies**

---

## Table of Contents

- [Error Handling Architecture](#error-handling-architecture)
- [Custom Error Classes](#custom-error-classes)
- [Centralized Error Handler](#centralized-error-handler)
- [Error Response Formatting](#error-response-formatting)
- [Logging Strategy](#logging-strategy)
- [Error Monitoring](#error-monitoring)

---

## Error Handling Architecture

### Error Flow

```
┌──────────────┐
│   Request    │
└──────┬───────┘
       ↓
┌──────────────┐
│  Controller  │ ← Throws custom error
└──────┬───────┘
       ↓
┌──────────────┐
│  Express     │ ← Catches error
│  Error       │
│  Middleware  │
└──────┬───────┘
       ↓
┌──────────────┐
│  Error       │ ← Formats response
│  Handler     │
└──────┬───────┘
       ↓
┌──────────────┐
│  Logger      │ ← Logs error
└──────┬───────┘
       ↓
┌──────────────┐
│  Response    │ ← Sends to client
└──────────────┘
```

---

## Custom Error Classes

### Base Error Class

**File:** `src/errors/AppError.js`

```javascript
export class AppError extends Error {
  constructor(message, statusCode = 500, isOperational = true) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    Error.captureStackTrace(this, this.constructor);
  }
}
```

### Authentication Error

**File:** `src/errors/AuthError.js`

```javascript
import { AppError } from './AppError.js';

export class AuthError extends AppError {
  constructor(message = 'Authentication failed', statusCode = 401) {
    super(message, statusCode);
  }
}

// Specific authentication errors
export class InvalidCredentialsError extends AuthError {
  constructor() {
    super('Invalid email or password', 401);
  }
}

export class TokenExpiredError extends AuthError {
  constructor() {
    super('Token has expired', 401);
  }
}

export class InvalidTokenError extends AuthError {
  constructor() {
    super('Invalid or malformed token', 401);
  }
}
```

### Permission Error

**File:** `src/errors/PermissionError.js`

```javascript
import { AppError } from './AppError.js';

export class PermissionError extends AppError {
  constructor(message = 'You do not have permission to perform this action') {
    super(message, 403);
  }
}

export class InsufficientPermissionsError extends PermissionError {
  constructor(requiredPermission) {
    super(`Insufficient permissions. Required: ${requiredPermission}`);
  }
}
```

### Not Found Error

**File:** `src/errors/NotFoundError.js`

```javascript
import { AppError } from './AppError.js';

export class NotFoundError extends AppError {
  constructor(resource = 'Resource') {
    super(`${resource} not found`, 404);
  }
}

export class UserNotFoundError extends NotFoundError {
  constructor() {
    super('User');
  }
}

export class OrderNotFoundError extends NotFoundError {
  constructor() {
    super('Order');
  }
}

export class ProductNotFoundError extends NotFoundError {
  constructor() {
    super('Product');
  }
}
```

### Validation Error

**File:** `src/errors/ValidationError.js`

```javascript
import { AppError } from './AppError.js';

export class ValidationError extends AppError {
  constructor(message = 'Validation failed', errors = []) {
    super(message, 400);
    this.errors = errors;
  }
}

export class RequiredFieldError extends ValidationError {
  constructor(field) {
    super(`${field} is required`, [{ field, message: 'Required' }]);
  }
}

export class InvalidFormatError extends ValidationError {
  constructor(field, expectedFormat) {
    super(
      `${field} has invalid format. Expected: ${expectedFormat}`,
      [{ field, message: `Invalid format. Expected: ${expectedFormat}` }]
    );
  }
}
```

### Payment Error

**File:** `src/errors/PaymentError.js`

```javascript
import { AppError } from './AppError.js';

export class PaymentError extends AppError {
  constructor(message = 'Payment processing failed', statusCode = 402) {
    super(message, statusCode);
  }
}

export class InsufficientFundsError extends PaymentError {
  constructor() {
    super('Insufficient funds', 402);
  }
}

export class PaymentGatewayError extends PaymentError {
  constructor(gatewayMessage) {
    super(`Payment gateway error: ${gatewayMessage}`, 502);
  }
}
```

### Rate Limit Error

**File:** `src/errors/RateLimitError.js`

```javascript
import { AppError } from './AppError.js';

export class RateLimitError extends AppError {
  constructor(retryAfter = 60) {
    super('Too many requests. Please try again later.', 429);
    this.retryAfter = retryAfter;
  }
}
```

---

## Centralized Error Handler

### Error Handler Middleware

**File:** `src/middlewares/errorHandler.middleware.js`

```javascript
import logger from '../config/logger.js';
import { AppError } from '../errors/AppError.js';
import { ValidationError } from '../errors/ValidationError.js';
import { RateLimitError } from '../errors/RateLimitError.js';

export const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;
  error.statusCode = err.statusCode || 500;

  // Log error
  logError(err, req);

  // Handle specific error types
  if (err.name === 'ValidationError') {
    error = handleValidationError(err);
  } else if (err.name === 'CastError') {
    error = handleCastError(err);
  } else if (err.code === 11000) {
    error = handleDuplicateKeyError(err);
  } else if (err.name === 'JsonWebTokenError') {
    error = handleJWTError();
  } else if (err.name === 'TokenExpiredError') {
    error = handleTokenExpiredError();
  }

  // Send response
  res.status(error.statusCode || 500).json({
    success: false,
    message: error.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && {
      stack: err.stack,
      error: err
    }),
    ...(error.errors && { errors: error.errors }),
    ...(error.retryAfter && { retryAfter: error.retryAfter })
  });
};

const logError = (err, req) => {
  const errorInfo = {
    message: err.message,
    statusCode: err.statusCode,
    stack: err.stack,
    path: req.path,
    method: req.method,
    ip: req.ip,
    userId: req.user?._id
  };

  if (err.isOperational) {
    logger.warn('Operational error:', errorInfo);
  } else {
    logger.error('Unexpected error:', errorInfo);
  }
};

const handleValidationError = (err) => {
  const errors = Object.values(err.errors).map((error) => ({
    field: error.path,
    message: error.message
  }));

  return new ValidationError('Validation failed', errors);
};

const handleCastError = (err) => {
  return new AppError(`Invalid ${err.path}: ${err.value}`, 400);
};

const handleDuplicateKeyError = (err) => {
  const field = Object.keys(err.keyPattern)[0];
  return new AppError(`${field} already exists`, 400);
};

const handleJWTError = () => {
  return new AppError('Invalid token', 401);
};

const handleTokenExpiredError = () => {
  return new AppError('Token expired', 401);
};
```

### Not Found Handler

**File:** `src/middlewares/notFound.middleware.js`

```javascript
import { NotFoundError } from '../errors/NotFoundError.js';

export const notFoundHandler = (req, res, next) => {
  throw new NotFoundError(`Route ${req.originalUrl}`);
};
```

### Async Handler

**File:** `src/utils/asyncHandler.js`

```javascript
// Wraps async functions to catch errors
export const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
```

**Usage:**

```javascript
import { asyncHandler } from '../../utils/asyncHandler.js';
import { NotFoundError } from '../../errors/NotFoundError.js';

export const getOrderById = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);

  if (!order) {
    throw new NotFoundError('Order');
  }

  res.json({ success: true, order });
});
```

---

## Error Response Formatting

### Success Response

```javascript
{
  "success": true,
  "data": { ... },
  "message": "Operation completed successfully"
}
```

### Error Response

```javascript
{
  "success": false,
  "message": "Order not found",
  "statusCode": 404
}
```

### Validation Error Response

```javascript
{
  "success": false,
  "message": "Validation failed",
  "statusCode": 400,
  "errors": [
    {
      "field": "email",
      "message": "Invalid email format"
    },
    {
      "field": "password",
      "message": "Password must be at least 8 characters"
    }
  ]
}
```

---

## Logging Strategy

### Winston Configuration

**File:** `src/config/logger.js`

```javascript
import winston from 'winston';
import path from 'path';

const { combine, timestamp, printf, colorize, errors } = winston.format;

// Custom log format
const logFormat = printf(({ level, message, timestamp, stack }) => {
  return `${timestamp} [${level}]: ${stack || message}`;
});

// Create logger instance
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: combine(
    errors({ stack: true }),
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    logFormat
  ),
  transports: [
    // Console transport
    new winston.transports.Console({
      format: combine(colorize(), logFormat)
    }),

    // File transport - All logs
    new winston.transports.File({
      filename: path.join('logs', 'combined.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5
    }),

    // File transport - Error logs only
    new winston.transports.File({
      filename: path.join('logs', 'error.log'),
      level: 'error',
      maxsize: 5242880,
      maxFiles: 5
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

// Don't log in test environment
if (process.env.NODE_ENV === 'test') {
  logger.silent = true;
}

export default logger;
```

### Logging Levels

```javascript
logger.error('Critical error', { error });   // 0
logger.warn('Warning message', { data });    // 1
logger.info('Info message', { userId });     // 2
logger.http('HTTP request', { method, url }); // 3
logger.debug('Debug info', { state });       // 4
```

### Usage Examples

```javascript
// Log error
logger.error('Payment processing failed:', {
  orderId: order._id,
  error: error.message,
  stack: error.stack
});

// Log warning
logger.warn('Low stock alert:', {
  productId: product._id,
  currentStock: product.stock
});

// Log info
logger.info('Order created:', {
  orderId: order._id,
  userId: user._id,
  amount: order.totalAmount
});

// Log HTTP requests
logger.http(`${req.method} ${req.url}`, {
  ip: req.ip,
  userId: req.user?._id
});
```

---

## Error Monitoring

### Sentry Integration

**File:** `src/config/sentry.js`

```javascript
import * as Sentry from '@sentry/node';

export const initSentry = (app) => {
  if (process.env.NODE_ENV === 'production') {
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      environment: process.env.NODE_ENV,
      tracesSampleRate: 1.0
    });

    // Request handler must be first middleware
    app.use(Sentry.Handlers.requestHandler());

    // Tracing handler
    app.use(Sentry.Handlers.tracingHandler());
  }
};

export const sentryErrorHandler = () => {
  if (process.env.NODE_ENV === 'production') {
    return Sentry.Handlers.errorHandler();
  }

  return (err, req, res, next) => next(err);
};
```

**Usage in server.js:**

```javascript
import { initSentry, sentryErrorHandler } from './config/sentry.js';

initSentry(app);

// Routes
app.use('/api/v1', routes);

// Sentry error handler (before custom error handler)
app.use(sentryErrorHandler());

// Custom error handler
app.use(errorHandler);
```

---

**Document Version:** 1.0  
**Last Updated:** May 2026  
**Maintained By:** Engineering Team
