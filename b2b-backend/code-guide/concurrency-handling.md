# Concurrency Handling

> **Distributed locks, race condition prevention, and transaction management**

---

## Table of Contents

- [Concurrency Challenges](#concurrency-challenges)
- [Distributed Locks](#distributed-locks)
- [Race Condition Prevention](#race-condition-prevention)
- [Atomic Operations](#atomic-operations)
- [Idempotency Keys](#idempotency-keys)
- [Transaction Management](#transaction-management)

---

## Concurrency Challenges

### Common Problems

**1. Race Conditions:**
```
User A reads stock: 10
User B reads stock: 10
User A buys 5 → stock = 5
User B buys 5 → stock = 5
Result: Oversold by 5 units! ❌
```

**2. Double Spending:**
```
User initiates payment → Creates order
Payment webhook arrives (slow network)
User clicks "Pay Again" → Creates duplicate order ❌
```

**3. Lost Updates:**
```
Process A reads counter: 100
Process B reads counter: 100
Process A increments → writes 101
Process B increments → writes 101 (should be 102)
Result: Lost 1 increment! ❌
```

---

## Distributed Locks

### Redis-Based Locks

**File:** `src/services/redis.service.js`

```javascript
import redisClient from '../config/redis.js';
import logger from '../config/logger.js';

/**
 * Acquire lock with timeout
 * @param {string} lockKey - Unique lock identifier
 * @param {number} ttl - Lock TTL in seconds
 * @returns {boolean} - True if lock acquired
 */
export const acquireLock = async (lockKey, ttl = 10) => {
  try {
    // SET if Not eXists (NX) with EXpiry (EX)
    const result = await redisClient.set(lockKey, 'locked', 'EX', ttl, 'NX');
    return result === 'OK';
  } catch (error) {
    logger.error(`Failed to acquire lock ${lockKey}:`, error);
    return false;
  }
};

/**
 * Release lock
 * @param {string} lockKey - Lock identifier to release
 */
export const releaseLock = async (lockKey) => {
  try {
    await redisClient.del(lockKey);
  } catch (error) {
    logger.error(`Failed to release lock ${lockKey}:`, error);
  }
};

/**
 * Execute function with lock
 * @param {string} lockKey - Unique lock identifier
 * @param {number} ttl - Lock TTL in seconds
 * @param {Function} callback - Function to execute
 * @returns {Promise<any>} - Result from callback
 */
export const withLock = async (lockKey, ttl, callback) => {
  const maxRetries = 3;
  let retries = 0;

  while (retries < maxRetries) {
    const lockAcquired = await acquireLock(lockKey, ttl);

    if (lockAcquired) {
      try {
        return await callback();
      } finally {
        await releaseLock(lockKey);
      }
    }

    // Wait before retry (exponential backoff)
    retries++;
    await new Promise(resolve => setTimeout(resolve, 100 * Math.pow(2, retries)));
  }

  throw new Error('Failed to acquire lock after retries');
};
```

### Usage Examples

**Inventory Reservation:**

```javascript
import { withLock } from '../services/redis.service.js';
import { CACHE_KEYS } from '../constants/cacheKeys.js';

export const reserveStock = async (productId, quantity) => {
  const lockKey = CACHE_KEYS.INVENTORY_LOCK(productId);

  return await withLock(lockKey, 10, async () => {
    // Critical section - only one execution at a time
    const inventory = await Inventory.findOne({ productId });

    if (!inventory) {
      throw new NotFoundError('Inventory');
    }

    if (inventory.availableStock < quantity) {
      throw new Error('Insufficient stock');
    }

    // Update stock atomically
    inventory.availableStock -= quantity;
    inventory.reservedStock += quantity;

    await inventory.save();

    logger.info('Stock reserved', {
      productId,
      quantity,
      remainingStock: inventory.availableStock
    });

    return inventory;
  });
};
```

**Payment Processing:**

```javascript
export const processPayment = async (orderId, paymentData) => {
  const lockKey = CACHE_KEYS.PAYMENT_LOCK(orderId);

  return await withLock(lockKey, 30, async () => {
    // Check if payment already processed
    const existingPayment = await Payment.findOne({
      orderId,
      paymentStatus: 'SUCCESS'
    });

    if (existingPayment) {
      logger.warn('Payment already processed', { orderId });
      return existingPayment;
    }

    // Process payment
    const payment = await razorpay.orders.create({
      amount: paymentData.amount * 100,
      currency: 'INR',
      receipt: orderId
    });

    // Save payment record
    const paymentRecord = await Payment.create({
      orderId,
      razorpayOrderId: payment.id,
      amount: paymentData.amount,
      paymentStatus: 'PENDING'
    });

    return paymentRecord;
  });
};
```

---

## Race Condition Prevention

### Optimistic Locking

**Using Mongoose Versioning:**

```javascript
const orderSchema = new mongoose.Schema({
  userId: mongoose.Schema.Types.ObjectId,
  status: String,
  items: Array,
  totalAmount: Number
}, {
  timestamps: true,
  optimisticConcurrency: true // Enable versioning
});

// Update with version check
export const updateOrderStatus = async (orderId, newStatus) => {
  const maxRetries = 3;
  let retries = 0;

  while (retries < maxRetries) {
    try {
      const order = await Order.findById(orderId);

      if (!order) {
        throw new NotFoundError('Order');
      }

      // Modify order
      order.status = newStatus;

      // Save with version check
      await order.save();

      return order;
    } catch (error) {
      if (error.name === 'VersionError') {
        // Version conflict - retry
        retries++;
        logger.warn(`Version conflict on order ${orderId}, retry ${retries}`);

        if (retries >= maxRetries) {
          throw new Error('Failed to update order due to version conflicts');
        }

        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, 100));
      } else {
        throw error;
      }
    }
  }
};
```

### Pessimistic Locking

**Using MongoDB findAndModify:**

```javascript
export const decrementStock = async (productId, quantity) => {
  // Atomic decrement with condition
  const product = await Product.findOneAndUpdate(
    {
      _id: productId,
      stock: { $gte: quantity } // Only update if sufficient stock
    },
    {
      $inc: { stock: -quantity }
    },
    {
      new: true,
      runValidators: true
    }
  );

  if (!product) {
    throw new Error('Insufficient stock or product not found');
  }

  return product;
};
```

---

## Atomic Operations

### MongoDB Atomic Updates

**Increment Counter:**

```javascript
// ✅ Atomic - Safe for concurrent updates
await Product.findByIdAndUpdate(
  productId,
  { $inc: { views: 1 } },
  { new: true }
);

// ❌ Non-atomic - Race condition possible
const product = await Product.findById(productId);
product.views += 1;
await product.save();
```

**Array Operations:**

```javascript
// Add item to array atomically
await Order.findByIdAndUpdate(
  orderId,
  { $push: { items: newItem } },
  { new: true }
);

// Remove item from array atomically
await Order.findByIdAndUpdate(
  orderId,
  { $pull: { items: { productId: productIdToRemove } } },
  { new: true }
);

// Add to set (no duplicates)
await User.findByIdAndUpdate(
  userId,
  { $addToSet: { favoriteProducts: productId } },
  { new: true }
);
```

### Complex Atomic Operations

```javascript
// Reserve stock atomically
export const reserveStockAtomic = async (productId, quantity) => {
  const result = await Inventory.findOneAndUpdate(
    {
      productId,
      availableStock: { $gte: quantity }
    },
    {
      $inc: {
        availableStock: -quantity,
        reservedStock: quantity
      }
    },
    {
      new: true,
      runValidators: true
    }
  );

  if (!result) {
    throw new Error('Insufficient stock');
  }

  return result;
};

// Fulfill order and update multiple fields
export const fulfillOrder = async (orderId) => {
  const order = await Order.findOneAndUpdate(
    {
      _id: orderId,
      status: 'PENDING'
    },
    {
      $set: {
        status: 'FULFILLED',
        fulfilledAt: Date.now()
      },
      $inc: {
        'stats.totalFulfilledOrders': 1
      }
    },
    { new: true }
  );

  if (!order) {
    throw new Error('Order not found or already fulfilled');
  }

  return order;
};
```

---

## Idempotency Keys

### Preventing Duplicate Operations

**File:** `src/middlewares/idempotency.middleware.js`

```javascript
import redisClient from '../config/redis.js';

export const checkIdempotency = async (req, res, next) => {
  const idempotencyKey = req.headers['idempotency-key'];

  if (!idempotencyKey) {
    return next();
  }

  const cacheKey = `idempotency:${idempotencyKey}`;

  // Check if request already processed
  const cachedResponse = await redisClient.get(cacheKey);

  if (cachedResponse) {
    // Return cached response
    logger.info('Idempotent request detected', { idempotencyKey });
    return res.json(JSON.parse(cachedResponse));
  }

  // Store original res.json
  const originalJson = res.json;

  // Override res.json to cache response
  res.json = function (data) {
    // Cache successful response for 24 hours
    if (res.statusCode >= 200 && res.statusCode < 300) {
      redisClient.setex(cacheKey, 24 * 60 * 60, JSON.stringify(data));
    }

    originalJson.call(this, data);
  };

  next();
};
```

**Usage:**

```javascript
// Apply to payment endpoints
router.post(
  '/payments',
  authenticate,
  checkIdempotency,
  createPayment
);

// Client sends idempotency key
const response = await fetch('/api/v1/payments', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Idempotency-Key': 'order_123_payment_1'
  },
  body: JSON.stringify(paymentData)
});
```

### Database-Level Idempotency

```javascript
// Store idempotency key in database
const paymentSchema = new mongoose.Schema({
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
  amount: Number,
  idempotencyKey: {
    type: String,
    unique: true,
    sparse: true
  },
  paymentStatus: String
});

export const createPayment = async (paymentData, idempotencyKey) => {
  try {
    // Try to create payment with idempotency key
    const payment = await Payment.create({
      ...paymentData,
      idempotencyKey
    });

    return payment;
  } catch (error) {
    if (error.code === 11000) {
      // Duplicate key - payment already exists
      logger.info('Duplicate payment request', { idempotencyKey });

      // Return existing payment
      return await Payment.findOne({ idempotencyKey });
    }

    throw error;
  }
};
```

---

## Transaction Management

### MongoDB Transactions

**File:** `src/services/transaction.service.js`

```javascript
import mongoose from 'mongoose';
import logger from '../config/logger.js';

export const withTransaction = async (callback) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const result = await callback(session);

    await session.commitTransaction();
    logger.info('Transaction committed');

    return result;
  } catch (error) {
    await session.abortTransaction();
    logger.error('Transaction aborted:', error);

    throw error;
  } finally {
    session.endSession();
  }
};
```

**Usage - Order Creation with Transaction:**

```javascript
import { withTransaction } from '../services/transaction.service.js';

export const createOrder = async (orderData) => {
  return await withTransaction(async (session) => {
    // 1. Create order
    const [order] = await Order.create([orderData], { session });

    // 2. Reserve stock for each item
    for (const item of orderData.items) {
      const inventory = await Inventory.findOneAndUpdate(
        {
          productId: item.productId,
          availableStock: { $gte: item.quantity }
        },
        {
          $inc: {
            availableStock: -item.quantity,
            reservedStock: item.quantity
          }
        },
        { session, new: true }
      );

      if (!inventory) {
        throw new Error(`Insufficient stock for product ${item.productId}`);
      }
    }

    // 3. Deduct credit (if using credit system)
    if (orderData.paymentMethod === 'CREDIT') {
      await Credit.findOneAndUpdate(
        {
          userId: orderData.userId,
          availableCredit: { $gte: order.totalAmount }
        },
        {
          $inc: { availableCredit: -order.totalAmount }
        },
        { session }
      );
    }

    // All operations succeed or all fail
    return order;
  });
};
```

**Multi-Document Update:**

```javascript
export const transferCredit = async (fromUserId, toUserId, amount) => {
  return await withTransaction(async (session) => {
    // Deduct from sender
    const sender = await Credit.findOneAndUpdate(
      {
        userId: fromUserId,
        availableCredit: { $gte: amount }
      },
      {
        $inc: { availableCredit: -amount }
      },
      { session, new: true }
    );

    if (!sender) {
      throw new Error('Insufficient credit');
    }

    // Add to receiver
    await Credit.findOneAndUpdate(
      { userId: toUserId },
      { $inc: { availableCredit: amount } },
      { session, new: true }
    );

    // Log transaction
    await CreditTransaction.create([{
      fromUserId,
      toUserId,
      amount,
      type: 'TRANSFER',
      timestamp: Date.now()
    }], { session });

    return { success: true };
  });
};
```

---

**Document Version:** 1.0  
**Last Updated:** May 2026  
**Maintained By:** Engineering Team
