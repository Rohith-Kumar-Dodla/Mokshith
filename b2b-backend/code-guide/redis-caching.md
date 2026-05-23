# Redis Caching & Distributed Systems

> **Complete guide to Redis usage for caching, locking, and session management**

---

## Table of Contents

- [Redis Overview](#redis-overview)
- [Caching Strategy](#caching-strategy)
- [Cache Key Patterns](#cache-key-patterns)
- [Cache Invalidation](#cache-invalidation)
- [Distributed Locks](#distributed-locks)
- [Session Management](#session-management)
- [Rate Limiting](#rate-limiting)
- [Redis Best Practices](#redis-best-practices)

---

## Redis Overview

### Multiple Use Cases

```
┌─────────────────────────────────────────┐
│             REDIS (Port 6379)           │
├─────────────────────────────────────────┤
│                                         │
│  1. Caching (TTL-based)                │
│     - Product catalog                   │
│     - User sessions                     │
│     - API responses                     │
│                                         │
│  2. Distributed Locks                   │
│     - Inventory operations              │
│     - Payment processing                │
│                                         │
│  3. Session Store                       │
│     - JWT refresh tokens                │
│     - Active user sessions              │
│                                         │
│  4. Rate Limiting                       │
│     - API request counters              │
│     - Login attempt tracking            │
│                                         │
│  5. Queue Backend (BullMQ)             │
│     - Job storage                       │
│     - Worker coordination               │
│                                         │
│  6. Pub/Sub (Socket.io Adapter)        │
│     - Real-time messaging               │
│     - Multi-instance coordination       │
│                                         │
└─────────────────────────────────────────┘
```

### Connection Setup

**File:** `src/config/redis.js`

```javascript
import Redis from 'ioredis';
import logger from './logger.js';

const redisClient = new Redis({
  host: process.env.REDIS_HOST || '127.0.0.1',
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD || null,
  db: process.env.REDIS_DB || 0,
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
  enableOfflineQueue: true
});

redisClient.on('connect', () => {
  logger.info('Redis connected');
});

redisClient.on('error', (err) => {
  logger.error('Redis error:', err);
});

redisClient.on('reconnecting', () => {
  logger.warn('Redis reconnecting...');
});

export default redisClient;
```

---

## Caching Strategy

### Cache-Aside Pattern

**Read Flow:**
```
1. Check cache
   ├─→ Cache hit → Return cached data
   └─→ Cache miss → Fetch from DB → Store in cache → Return data
```

**Write Flow:**
```
1. Update database
2. Invalidate cache (or update cache)
```

### Implementation

**File:** `src/services/cache.service.js`

```javascript
import redisClient from '../config/redis.js';
import logger from '../config/logger.js';

export const get = async (key) => {
  try {
    const data = await redisClient.get(key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    logger.error(`Cache get error for key ${key}:`, error);
    return null; // Graceful degradation
  }
};

export const set = async (key, value, ttl = 300) => {
  try {
    await redisClient.setex(key, ttl, JSON.stringify(value));
  } catch (error) {
    logger.error(`Cache set error for key ${key}:`, error);
  }
};

export const del = async (key) => {
  try {
    await redisClient.del(key);
  } catch (error) {
    logger.error(`Cache delete error for key ${key}:`, error);
  }
};

export const delPattern = async (pattern) => {
  try {
    const keys = await redisClient.keys(pattern);
    if (keys.length > 0) {
      await redisClient.del(...keys);
    }
  } catch (error) {
    logger.error(`Cache delete pattern error for ${pattern}:`, error);
  }
};
```

### Cache Middleware

**File:** `src/middlewares/cache.middleware.js`

```javascript
import * as cacheService from '../services/cache.service.js';

export const cacheResponse = (ttl = 300) => {
  return async (req, res, next) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }

    // Generate cache key from URL + query params
    const cacheKey = `cache:${req.originalUrl}`;

    try {
      // Check cache
      const cachedData = await cacheService.get(cacheKey);

      if (cachedData) {
        // Cache hit
        return res.json(cachedData);
      }

      // Cache miss - intercept response
      const originalJson = res.json;

      res.json = function (data) {
        // Store in cache
        cacheService.set(cacheKey, data, ttl);

        // Call original json method
        originalJson.call(this, data);
      };

      next();
    } catch (error) {
      // If cache fails, continue without caching
      next();
    }
  };
};
```

**Usage:**

```javascript
import { cacheResponse } from '../middlewares/cache.middleware.js';

// Cache product list for 5 minutes
router.get('/products', cacheResponse(300), productController.getProducts);

// Cache product details for 10 minutes
router.get('/products/:id', cacheResponse(600), productController.getProductById);
```

---

## Cache Key Patterns

**File:** `src/constants/cacheKeys.js`

```javascript
export const CACHE_KEYS = {
  // Products
  PRODUCT_LIST: 'cache:products:list',
  PRODUCT_BY_ID: (id) => `cache:product:${id}`,
  PRODUCT_BY_CATEGORY: (category) => `cache:products:category:${category}`,

  // Users
  USER_BY_ID: (id) => `cache:user:${id}`,
  USER_PROFILE: (id) => `cache:user:${id}:profile`,

  // Orders
  ORDER_BY_ID: (id) => `cache:order:${id}`,
  USER_ORDERS: (userId) => `cache:user:${userId}:orders`,

  // Inventory
  INVENTORY: (productId) => `cache:inventory:${productId}`,
  LOW_STOCK: 'cache:inventory:low-stock',

  // Analytics
  ANALYTICS_DASHBOARD: 'cache:analytics:dashboard',
  SALES_STATS: (period) => `cache:analytics:sales:${period}`,

  // Session
  SESSION: (userId, sessionId) => `session:${userId}:${sessionId}`,
  REFRESH_TOKEN: (userId) => `refresh_token:${userId}`,

  // Rate Limiting
  RATE_LIMIT: (identifier) => `rate_limit:${identifier}`,
  AUTH_ATTEMPTS: (email) => `auth:attempts:${email}`,

  // Locks
  INVENTORY_LOCK: (productId) => `lock:inventory:${productId}`,
  PAYMENT_LOCK: (orderId) => `lock:payment:${orderId}`,
  ORDER_LOCK: (orderId) => `lock:order:${orderId}`
};
```

### TTL Guidelines

| Data Type | TTL | Reason |
|-----------|-----|--------|
| Product catalog | 5-10 min | Changes infrequently |
| Product details | 10-15 min | Rarely changes |
| Inventory | 1-2 min | Updates frequently |
| User profile | 15 min | Changes rarely |
| Analytics | 30-60 min | Expensive queries |
| Search results | 5 min | Frequently searched |
| Session data | 7 days | Match JWT expiry |

---

## Cache Invalidation

### Strategies

**1. TTL-Based (Passive):**
```javascript
// Cache expires automatically
await cacheService.set('cache:products', products, 300); // 5 minutes
```

**2. Manual Invalidation (Active):**
```javascript
// After updating product
await Product.findByIdAndUpdate(productId, updates);
await cacheService.del(`cache:product:${productId}`);
```

**3. Pattern-Based Invalidation:**
```javascript
// Invalidate all product caches
await cacheService.delPattern('cache:product:*');
```

### Invalidation Service

**File:** `src/utils/cacheInvalidation.js`

```javascript
import * as cacheService from '../services/cache.service.js';
import { CACHE_KEYS } from '../constants/cacheKeys.js';

export const invalidateProduct = async (productId) => {
  await Promise.all([
    cacheService.del(CACHE_KEYS.PRODUCT_BY_ID(productId)),
    cacheService.del(CACHE_KEYS.PRODUCT_LIST),
    cacheService.delPattern('cache:products:category:*')
  ]);
};

export const invalidateUserCache = async (userId) => {
  await Promise.all([
    cacheService.del(CACHE_KEYS.USER_BY_ID(userId)),
    cacheService.del(CACHE_KEYS.USER_PROFILE(userId)),
    cacheService.del(CACHE_KEYS.USER_ORDERS(userId))
  ]);
};

export const invalidateInventory = async (productId) => {
  await Promise.all([
    cacheService.del(CACHE_KEYS.INVENTORY(productId)),
    cacheService.del(CACHE_KEYS.LOW_STOCK)
  ]);
};
```

### Automatic Invalidation

```javascript
// src/modules/product/product.service.js
import { invalidateProduct } from '../../utils/cacheInvalidation.js';

export const updateProduct = async (productId, updates) => {
  // Update database
  const product = await Product.findByIdAndUpdate(productId, updates, { new: true });

  // Invalidate cache
  await invalidateProduct(productId);

  return product;
};
```

---

## Distributed Locks

### Why Distributed Locks?

**Problem:** Prevent race conditions in concurrent operations

**Use Cases:**
- Inventory reservation (multiple users ordering same product)
- Payment processing (prevent duplicate charges)
- Order creation (ensure atomicity)

### Lock Implementation

**File:** `src/services/redis.service.js`

```javascript
export const acquireLock = async (lockKey, ttl = 10) => {
  // SET if Not eXists (NX) with EXpiry (EX)
  const result = await redisClient.set(lockKey, 'locked', 'EX', ttl, 'NX');
  return result === 'OK';
};

export const releaseLock = async (lockKey) => {
  return await redisClient.del(lockKey);
};

export const withLock = async (lockKey, ttl, callback) => {
  const lockAcquired = await acquireLock(lockKey, ttl);

  if (!lockAcquired) {
    throw new Error('Failed to acquire lock');
  }

  try {
    return await callback();
  } finally {
    await releaseLock(lockKey);
  }
};
```

### Usage Example

```javascript
import { withLock } from '../services/redis.service.js';
import { CACHE_KEYS } from '../constants/cacheKeys.js';

export const reserveStock = async (productId, quantity) => {
  const lockKey = CACHE_KEYS.INVENTORY_LOCK(productId);

  return await withLock(lockKey, 10, async () => {
    // Critical section - only one execution at a time
    const inventory = await Inventory.findOne({ productId });

    if (inventory.availableStock < quantity) {
      throw new Error('Insufficient stock');
    }

    inventory.reservedStock += quantity;
    await inventory.save();

    return inventory;
  });
};
```

---

## Session Management

### Store Refresh Tokens

```javascript
// Store refresh token (30 days)
await redisClient.setex(
  `refresh_token:${userId}`,
  30 * 24 * 60 * 60,
  refreshToken
);

// Retrieve refresh token
const storedToken = await redisClient.get(`refresh_token:${userId}`);

// Delete refresh token (logout)
await redisClient.del(`refresh_token:${userId}`);
```

### Track Active Sessions

```javascript
// Store session
await redisClient.setex(
  `session:${userId}:${sessionId}`,
  7 * 24 * 60 * 60, // 7 days
  JSON.stringify({
    userId,
    deviceInfo: req.headers['user-agent'],
    ip: req.ip,
    loginAt: Date.now()
  })
);

// Get all user sessions
const sessionKeys = await redisClient.keys(`session:${userId}:*`);
const sessions = await Promise.all(
  sessionKeys.map(key => redisClient.get(key))
);

// Invalidate all sessions (force logout everywhere)
const keys = await redisClient.keys(`session:${userId}:*`);
if (keys.length > 0) {
  await redisClient.del(...keys);
}
```

---

## Rate Limiting

### IP-Based Rate Limiting

```javascript
export const checkRateLimit = async (identifier, limit, windowMs) => {
  const key = `rate_limit:${identifier}`;

  // Increment counter
  const count = await redisClient.incr(key);

  if (count === 1) {
    // First request, set expiry
    await redisClient.pexpire(key, windowMs);
  }

  return {
    allowed: count <= limit,
    current: count,
    limit,
    remaining: Math.max(0, limit - count)
  };
};
```

### Usage

```javascript
// src/config/rateLimiter.js
import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import redisClient from './redis.js';

export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  store: new RedisStore({
    client: redisClient,
    prefix: 'rate_limit:'
  })
});
```

---

## Redis Best Practices

### 1. **Connection Pooling**

```javascript
// Use single Redis client instance across app
import redisClient from './config/redis.js';

// ❌ Don't create multiple instances
const redis1 = new Redis();
const redis2 = new Redis();

// ✅ Use shared instance
export default redisClient;
```

### 2. **Error Handling**

```javascript
// Always handle Redis errors gracefully
try {
  const data = await redisClient.get(key);
  return JSON.parse(data);
} catch (error) {
  logger.error('Redis error:', error);
  // Fallback to database or return null
  return await fetchFromDatabase(key);
}
```

### 3. **Set TTL on All Keys**

```javascript
// ❌ Never store without TTL (memory leak)
await redisClient.set('cache:products', products);

// ✅ Always set TTL
await redisClient.setex('cache:products', 300, products);
```

### 4. **Use Namespaced Keys**

```javascript
// ✅ Good - clear namespacing
cache:product:123
session:user:456
lock:inventory:789

// ❌ Bad - ambiguous
product123
user456
inv789
```

### 5. **Batch Operations**

```javascript
// ❌ Slow - multiple round trips
for (const key of keys) {
  await redisClient.get(key);
}

// ✅ Fast - single round trip
const values = await redisClient.mget(...keys);
```

### 6. **Monitor Memory Usage**

```javascript
// Check Redis memory
const info = await redisClient.info('memory');
console.log(info);

// Set max memory policy
// redis.conf: maxmemory 256mb
// maxmemory-policy allkeys-lru
```

### 7. **Graceful Degradation**

```javascript
// If Redis fails, app should still work
export const getCachedData = async (key) => {
  try {
    return await cacheService.get(key);
  } catch (error) {
    logger.warn('Cache unavailable, fetching from DB');
    return null; // Fall back to database
  }
};
```

---

**Document Version:** 1.0  
**Last Updated:** May 2026  
**Maintained By:** Engineering Team
