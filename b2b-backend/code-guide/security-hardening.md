# Security Hardening

> **Comprehensive security measures, best practices, and compliance considerations**

---

## Table of Contents

- [Security Overview](#security-overview)
- [Authentication Security](#authentication-security)
- [Authorization & Access Control](#authorization--access-control)
- [Input Validation](#input-validation)
- [Security Headers (Helmet)](#security-headers-helmet)
- [Rate Limiting](#rate-limiting)
- [Audit Logging](#audit-logging)
- [PCI Compliance](#pci-compliance)

---

## Security Overview

### Security Layers

```
┌─────────────────────────────────────┐
│  1. Network Security (Firewall)     │ ← Port restrictions
├─────────────────────────────────────┤
│  2. Transport Security (HTTPS)      │ ← SSL/TLS encryption
├─────────────────────────────────────┤
│  3. Application Security (Helmet)   │ ← Security headers
├─────────────────────────────────────┤
│  4. Rate Limiting                   │ ← Prevent brute force
├─────────────────────────────────────┤
│  5. Authentication (JWT)            │ ← Verify identity
├─────────────────────────────────────┤
│  6. Authorization (RBAC)            │ ← Check permissions
├─────────────────────────────────────┤
│  7. Input Validation                │ ← Sanitize data
├─────────────────────────────────────┤
│  8. Database Security               │ ← Query sanitization
├─────────────────────────────────────┤
│  9. Audit Logging                   │ ← Track all actions
└─────────────────────────────────────┘
```

---

## Authentication Security

### Password Policy

**File:** `src/utils/passwordPolicy.js`

```javascript
export const validatePassword = (password) => {
  const errors = [];

  // Length check
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters');
  }

  // Uppercase check
  if (!/[A-Z]/.test(password)) {
    errors.push('Must contain uppercase letter');
  }

  // Lowercase check
  if (!/[a-z]/.test(password)) {
    errors.push('Must contain lowercase letter');
  }

  // Number check
  if (!/[0-9]/.test(password)) {
    errors.push('Must contain number');
  }

  // Special character check
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Must contain special character');
  }

  // Common passwords check
  const commonPasswords = ['password', '12345678', 'admin123'];
  if (commonPasswords.includes(password.toLowerCase())) {
    errors.push('Password is too common');
  }

  return {
    valid: errors.length === 0,
    errors
  };
};
```

### Password Hashing

```javascript
import bcrypt from 'bcryptjs';

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  // Use 12 rounds (secure but performant)
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Compare password for login
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};
```

### Account Lockout

**File:** `src/middlewares/auth.middleware.js`

```javascript
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes

export const checkAccountLockout = async (req, res, next) => {
  const { email } = req.body;

  const lockoutKey = `auth:attempts:${email}`;
  const attempts = await redisClient.get(lockoutKey);

  if (attempts && parseInt(attempts) >= MAX_LOGIN_ATTEMPTS) {
    const ttl = await redisClient.ttl(lockoutKey);
    return res.status(429).json({
      success: false,
      message: `Account locked due to too many failed attempts. Try again in ${Math.ceil(ttl / 60)} minutes.`
    });
  }

  next();
};

export const trackLoginAttempt = async (email, success) => {
  const lockoutKey = `auth:attempts:${email}`;

  if (success) {
    // Clear failed attempts on successful login
    await redisClient.del(lockoutKey);
  } else {
    // Increment failed attempts
    const attempts = await redisClient.incr(lockoutKey);

    if (attempts === 1) {
      // Set expiry on first failed attempt
      await redisClient.expire(lockoutKey, LOCKOUT_DURATION / 1000);
    }
  }
};
```

### JWT Security

```javascript
// Use strong secrets (32+ characters)
JWT_SECRET=your_very_long_and_random_jwt_secret_key_min_32_chars

// Short expiry for access tokens
JWT_EXPIRE=7d

// Separate secret for refresh tokens
REFRESH_TOKEN_SECRET=different_strong_refresh_token_secret
REFRESH_TOKEN_EXPIRE=30d
```

**Token Rotation:**

```javascript
export const refreshToken = async (req, res) => {
  const { refreshToken } = req.body;

  // Verify refresh token
  const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);

  // Check if token exists in Redis
  const storedToken = await redisClient.get(`refresh_token:${decoded.userId}`);

  if (!storedToken || storedToken !== refreshToken) {
    throw new AuthError('Invalid refresh token');
  }

  // Generate new tokens
  const user = await User.findById(decoded.userId);
  const { accessToken, refreshToken: newRefreshToken } = generateToken(user);

  // Store new refresh token
  await redisClient.setex(
    `refresh_token:${user._id}`,
    30 * 24 * 60 * 60,
    newRefreshToken
  );

  // Invalidate old refresh token
  await redisClient.del(`refresh_token:${decoded.userId}`);

  res.json({ accessToken, refreshToken: newRefreshToken });
};
```

---

## Authorization & Access Control

### Role-Based Access Control (RBAC)

**File:** `src/constants/roles.js`

```javascript
export const ROLES = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  ADMIN: 'ADMIN',
  VENDOR: 'VENDOR',
  CUSTOMER: 'CUSTOMER'
};

export const PERMISSIONS = {
  // User management
  USER_CREATE: 'user:create',
  USER_READ: 'user:read',
  USER_UPDATE: 'user:update',
  USER_DELETE: 'user:delete',

  // Product management
  PRODUCT_CREATE: 'product:create',
  PRODUCT_READ: 'product:read',
  PRODUCT_UPDATE: 'product:update',
  PRODUCT_DELETE: 'product:delete',

  // Order management
  ORDER_CREATE: 'order:create',
  ORDER_READ: 'order:read',
  ORDER_UPDATE: 'order:update',
  ORDER_CANCEL: 'order:cancel',

  // Payment management
  PAYMENT_PROCESS: 'payment:process',
  PAYMENT_REFUND: 'payment:refund'
};

export const ROLE_PERMISSIONS = {
  [ROLES.SUPER_ADMIN]: Object.values(PERMISSIONS),

  [ROLES.ADMIN]: [
    PERMISSIONS.USER_READ,
    PERMISSIONS.PRODUCT_CREATE,
    PERMISSIONS.PRODUCT_READ,
    PERMISSIONS.PRODUCT_UPDATE,
    PERMISSIONS.ORDER_READ,
    PERMISSIONS.ORDER_UPDATE,
    PERMISSIONS.PAYMENT_PROCESS
  ],

  [ROLES.VENDOR]: [
    PERMISSIONS.PRODUCT_READ,
    PERMISSIONS.ORDER_READ,
    PERMISSIONS.ORDER_UPDATE
  ],

  [ROLES.CUSTOMER]: [
    PERMISSIONS.PRODUCT_READ,
    PERMISSIONS.ORDER_CREATE,
    PERMISSIONS.ORDER_READ
  ]
};
```

### Permission Middleware

```javascript
export const requirePermission = (...requiredPermissions) => {
  return async (req, res, next) => {
    const user = req.user;

    if (!user) {
      throw new AuthError('Not authenticated');
    }

    const userPermissions = ROLE_PERMISSIONS[user.role] || [];

    const hasPermission = requiredPermissions.every((permission) =>
      userPermissions.includes(permission)
    );

    if (!hasPermission) {
      throw new PermissionError(
        `Missing required permissions: ${requiredPermissions.join(', ')}`
      );
    }

    next();
  };
};
```

**Usage:**

```javascript
router.post(
  '/products',
  authenticate,
  requirePermission(PERMISSIONS.PRODUCT_CREATE),
  createProduct
);

router.delete(
  '/users/:id',
  authenticate,
  requirePermission(PERMISSIONS.USER_DELETE),
  deleteUser
);
```

---

## Input Validation

### Joi Validation

**File:** `src/validations/auth.validation.js`

```javascript
import Joi from 'joi';

export const registerSchema = Joi.object({
  name: Joi.string().min(2).max(50).required(),

  email: Joi.string()
    .email()
    .lowercase()
    .trim()
    .required(),

  password: Joi.string()
    .min(8)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .required()
    .messages({
      'string.pattern.base': 'Password must contain uppercase, lowercase, number, and special character'
    }),

  phoneNumber: Joi.string()
    .pattern(/^[0-9]{10}$/)
    .optional(),

  role: Joi.string()
    .valid('VENDOR', 'CUSTOMER')
    .default('CUSTOMER')
});
```

### Validation Middleware

**File:** `src/middlewares/validation.middleware.js`

```javascript
import { ValidationError } from '../errors/ValidationError.js';

export const validate = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const errors = error.details.map((detail) => ({
        field: detail.path.join('.'),
        message: detail.message
      }));

      throw new ValidationError('Validation failed', errors);
    }

    req.validatedBody = value;
    next();
  };
};
```

### Sanitization

```javascript
import mongoSanitize from 'express-mongo-sanitize';
import { xss } from 'express-xss-sanitizer';

// Prevent NoSQL injection
app.use(mongoSanitize());

// Prevent XSS attacks
app.use(xss());
```

---

## Security Headers (Helmet)

**File:** `src/config/security.js`

```javascript
import helmet from 'helmet';

export const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"]
    }
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  },
  frameguard: {
    action: 'deny'
  },
  noSniff: true,
  xssFilter: true
});
```

**Headers Applied:**

```
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Content-Security-Policy: default-src 'self'
```

---

## Rate Limiting

### Global Rate Limiter

**File:** `src/config/rateLimiter.js`

```javascript
import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import redisClient from './redis.js';

// General API rate limiter
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per 15 minutes
  message: 'Too many requests, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  store: new RedisStore({
    client: redisClient,
    prefix: 'rate_limit:general:'
  })
});

// Auth rate limiter (stricter)
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5, // 5 login attempts per 15 minutes
  skipSuccessfulRequests: true,
  message: 'Too many login attempts, please try again later.',
  store: new RedisStore({
    client: redisClient,
    prefix: 'rate_limit:auth:'
  })
});

// Payment rate limiter
export const paymentLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 3, // 3 payment requests per minute
  message: 'Too many payment attempts, please try again later.',
  store: new RedisStore({
    client: redisClient,
    prefix: 'rate_limit:payment:'
  })
});
```

**Usage:**

```javascript
// Apply globally
app.use('/api/', generalLimiter);

// Apply to specific routes
router.post('/auth/login', authLimiter, login);
router.post('/payments/create', paymentLimiter, createPayment);
```

---

## Audit Logging

### Audit Middleware

**File:** `src/middlewares/audit.middleware.js`

```javascript
import AuditLog from '../modules/audit/audit.model.js';
import { auditQueue } from '../queues/audit.queue.js';

export const auditLog = (action) => {
  return async (req, res, next) => {
    const originalJson = res.json;

    res.json = function (data) {
      // Queue audit log
      auditQueue.add('log', {
        userId: req.user?._id,
        action,
        resource: req.originalUrl,
        method: req.method,
        ip: req.ip,
        userAgent: req.headers['user-agent'],
        requestBody: sanitizeData(req.body),
        responseStatus: res.statusCode,
        timestamp: Date.now()
      });

      originalJson.call(this, data);
    };

    next();
  };
};

const sanitizeData = (data) => {
  const sanitized = { ...data };
  const sensitiveFields = ['password', 'token', 'secret', 'apiKey'];

  sensitiveFields.forEach((field) => {
    if (sanitized[field]) {
      sanitized[field] = '[REDACTED]';
    }
  });

  return sanitized;
};
```

**Usage:**

```javascript
router.post(
  '/users',
  authenticate,
  auditLog('USER_CREATED'),
  createUser
);

router.delete(
  '/products/:id',
  authenticate,
  auditLog('PRODUCT_DELETED'),
  deleteProduct
);
```

### Audit Log Model

```javascript
const auditLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  action: {
    type: String,
    required: true
  },
  resource: String,
  method: String,
  ip: String,
  userAgent: String,
  requestBody: mongoose.Schema.Types.Mixed,
  responseStatus: Number,
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  }
});

// Auto-delete logs older than 90 days
auditLogSchema.index({ timestamp: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });
```

---

## PCI Compliance

### Payment Data Security

**Never store:**
- Full credit card numbers
- CVV/CVC codes
- Card PINs

**Always:**
- Use PCI-compliant payment gateway (Razorpay)
- Use HTTPS for all payment transactions
- Store only payment gateway reference IDs
- Implement strong access controls
- Log all payment transactions

### Secure Payment Flow

```javascript
// ✅ Correct - Use payment gateway SDK
const order = await razorpay.orders.create({
  amount: amount * 100,
  currency: 'INR',
  receipt: orderId
});

// Store only reference ID
await Payment.create({
  orderId,
  razorpayOrderId: order.id,
  amount,
  status: 'PENDING'
});

// ❌ Never do this - Don't store card details
await Payment.create({
  cardNumber: '4111111111111111', // NEVER!
  cvv: '123', // NEVER!
  expiryDate: '12/25' // NEVER!
});
```

---

**Document Version:** 1.0  
**Last Updated:** May 2026  
**Maintained By:** Engineering Team
