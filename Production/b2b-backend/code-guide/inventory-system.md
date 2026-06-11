# Inventory Management System

> **Complete guide to inventory tracking, reservation, and concurrency handling**

---

## Table of Contents

- [Inventory Overview](#inventory-overview)
- [Inventory Model](#inventory-model)
- [Stock Reservation Flow](#stock-reservation-flow)
- [Distributed Locking](#distributed-locking)
- [Inventory Update Flow](#inventory-update-flow)
- [Low Stock Alerts](#low-stock-alerts)
- [Inventory Sync Jobs](#inventory-sync-jobs)
- [Multi-Warehouse Support](#multi-warehouse-support)
- [Concurrency Handling](#concurrency-handling)

---

## Inventory Overview

### Purpose

The inventory system tracks product stock across warehouses and ensures:
- Real-time stock availability
- No overselling (race condition prevention)
- Atomic reservation on order placement
- Multi-warehouse support
- Low stock alerts
- Inventory movement history

### Key Challenges

**1. Concurrency:**
Multiple users ordering the same product simultaneously → Need distributed locks

**2. Consistency:**
Stock updates must be atomic → Use MongoDB atomic operations

**3. Reservation:**
Stock must be reserved during order placement → Prevent race conditions

**4. Release:**
Reserved stock must be released if payment fails or order is cancelled

---

## Inventory Model

**File:** `src/modules/inventory/inventory.model.js`

```javascript
const InventorySchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
    unique: true // One inventory record per product
  },
  
  warehouseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Warehouse',
    default: null // Null for main warehouse
  },

  totalStock: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },

  reservedStock: {
    type: Number,
    default: 0,
    min: 0 // Stock reserved for pending orders
  },

  availableStock: {
    type: Number,
    default: 0, // totalStock - reservedStock
    min: 0
  },

  lowStockThreshold: {
    type: Number,
    default: 10 // Alert when stock falls below this
  },

  reorderLevel: {
    type: Number,
    default: 5 // Auto-reorder trigger
  },

  lastUpdated: {
    type: Date,
    default: Date.now
  },

  movements: [{
    type: {
      type: String,
      enum: ['ADDITION', 'RESERVATION', 'RELEASE', 'FULFILLMENT', 'RETURN', 'ADJUSTMENT']
    },
    quantity: Number,
    reason: String,
    orderId: mongoose.Schema.Types.ObjectId,
    userId: mongoose.Schema.Types.ObjectId,
    timestamp: { type: Date, default: Date.now }
  }]
}, {
  timestamps: true
});

// Virtual: Calculate available stock
InventorySchema.virtual('available').get(function() {
  return this.totalStock - this.reservedStock;
});

// Pre-save hook: Update availableStock
InventorySchema.pre('save', function(next) {
  this.availableStock = this.totalStock - this.reservedStock;
  next();
});

export default mongoose.model('Inventory', InventorySchema);
```

---

## Stock Reservation Flow

### Complete Flow (Order Placement)

```
1. USER PLACES ORDER
   POST /api/v1/orders
   Body: {
     items: [
       { productId: "prod1", quantity: 5 },
       { productId: "prod2", quantity: 3 }
     ]
   }
   ↓
2. ORDER SERVICE: Check Inventory Availability
   FOR EACH item IN order.items:
     ↓
   3. ACQUIRE DISTRIBUTED LOCK
      Key: "lock:inventory:prod1"
      TTL: 10 seconds
      ↓
   4. FETCH CURRENT INVENTORY
      inventory = await Inventory.findOne({ productId: "prod1" })
      ↓
   5. CHECK AVAILABILITY
      IF inventory.availableStock < item.quantity:
        → Release lock
        → Return error: "Insufficient stock"
      ↓
   6. RESERVE STOCK (Atomic Operation)
      await Inventory.findOneAndUpdate(
        { productId: "prod1", availableStock: { $gte: quantity } },
        {
          $inc: { reservedStock: quantity },
          $push: {
            movements: {
              type: 'RESERVATION',
              quantity: quantity,
              orderId: order._id,
              reason: 'Order placement'
            }
          }
        },
        { new: true }
      )
      ↓
   7. RELEASE LOCK
      await redisClient.del("lock:inventory:prod1")
      ↓
   8. REPEAT FOR ALL ITEMS
   ↓
9. CREATE ORDER RECORD
   order.status = 'PENDING'
   ↓
10. RETURN SUCCESS RESPONSE
```

### Reservation Implementation

**File:** `src/modules/inventory/inventory.service.js`

```javascript
import redisClient from '../../config/redis.js';
import Inventory from './inventory.model.js';
import { AppError } from '../../errors/AppError.js';

export const reserveStock = async (productId, quantity, orderId) => {
  const lockKey = `lock:inventory:${productId}`;
  let lockAcquired = false;

  try {
    // 1. Acquire lock (max 10 seconds)
    lockAcquired = await redisClient.set(lockKey, 'locked', 'EX', 10, 'NX');

    if (!lockAcquired) {
      throw new AppError('Inventory locked by another operation', 409);
    }

    // 2. Atomic stock reservation
    const inventory = await Inventory.findOneAndUpdate(
      {
        productId,
        availableStock: { $gte: quantity } // Ensure sufficient stock
      },
      {
        $inc: { reservedStock: quantity },
        $push: {
          movements: {
            type: 'RESERVATION',
            quantity,
            orderId,
            reason: 'Order placement'
          }
        },
        $set: { lastUpdated: Date.now() }
      },
      { new: true, runValidators: true }
    );

    if (!inventory) {
      throw new AppError('Insufficient stock available', 400);
    }

    // 3. Check low stock threshold
    if (inventory.availableStock <= inventory.lowStockThreshold) {
      // Queue low stock alert
      await notificationQueue.add('inventory.lowStock', {
        productId,
        currentStock: inventory.availableStock,
        threshold: inventory.lowStockThreshold
      });
    }

    return inventory;

  } finally {
    // 4. Always release lock
    if (lockAcquired) {
      await redisClient.del(lockKey);
    }
  }
};
```

---

## Distributed Locking

### Why Distributed Locks?

**Problem:** Multiple users ordering the same product simultaneously

```
User A: Check stock (100 available) → Reserve 50 →  Update DB
User B:        Check stock (100 available) → Reserve 60 → Update DB

Result: Total reserved = 110, but only 100 in stock! (Overselling)
```

**Solution:** Distributed lock ensures only one operation at a time per product.

### Lock Implementation

**File:** `src/services/redis.service.js`

```javascript
export const acquireLock = async (lockKey, ttl = 10) => {
  // SET if Not eXists (NX) with EXpiry (EX)
  const result = await redisClient.set(lockKey, 'locked', 'EX', ttl, 'NX');
  return result === 'OK'; // Returns true if lock acquired
};

export const releaseLock = async (lockKey) => {
  return await redisClient.del(lockKey);
};

export const withLock = async (lockKey, ttl, callback) => {
  const lockAcquired = await acquireLock(lockKey, ttl);

  if (!lockAcquired) {
    throw new AppError('Resource locked', 409);
  }

  try {
    return await callback();
  } finally {
    await releaseLock(lockKey);
  }
};
```

**Usage with Helper:**
```javascript
await withLock(`lock:inventory:${productId}`, 10, async () => {
  // Critical section - only one execution at a time
  await reserveStock(productId, quantity);
});
```

---

## Inventory Update Flow

### Stock Addition (Vendor/Admin)

```
1. ADMIN ADDS STOCK
   POST /api/v1/inventory/add
   Body: { productId: "prod1", quantity: 100 }
   ↓
2. VALIDATE REQUEST
   - Check permissions (ADMIN or VENDOR)
   - Validate quantity > 0
   ↓
3. UPDATE INVENTORY
   await Inventory.findOneAndUpdate(
     { productId },
     {
       $inc: { totalStock: quantity },
       $push: {
         movements: {
           type: 'ADDITION',
           quantity,
           userId: req.user.id,
           reason: 'Stock replenishment'
         }
       }
     }
   )
   ↓
4. INVALIDATE CACHE
   await redisClient.del(`cache:inventory:${productId}`)
   ↓
5. RETURN SUCCESS
```

### Stock Fulfillment (Order Shipped)

```
1. ORDER SHIPPED
   ↓
2. CONVERT RESERVED → FULFILLED
   await Inventory.findOneAndUpdate(
     { productId },
     {
       $inc: {
         reservedStock: -quantity,  // Release reservation
         totalStock: -quantity       // Deduct from total
       },
       $push: {
         movements: {
           type: 'FULFILLMENT',
           quantity: -quantity,
           orderId,
           reason: 'Order fulfilled'
         }
       }
     }
   )
```

### Stock Release (Order Cancelled/Failed)

```
1. ORDER CANCELLED OR PAYMENT FAILED
   ↓
2. RELEASE RESERVED STOCK
   await Inventory.findOneAndUpdate(
     { productId },
     {
       $inc: { reservedStock: -quantity }, // Make available again
       $push: {
         movements: {
           type: 'RELEASE',
           quantity,
           orderId,
           reason: 'Order cancelled'
         }
       }
     }
   )
```

---

## Low Stock Alerts

### Alert Trigger

**When:** `availableStock <= lowStockThreshold`

**File:** `src/modules/inventory/inventory.service.js`

```javascript
const checkLowStock = async (inventory) => {
  if (inventory.availableStock <= inventory.lowStockThreshold) {
    // 1. Queue notification job
    await notificationQueue.add('inventory.lowStock', {
      productId: inventory.productId,
      currentStock: inventory.availableStock,
      threshold: inventory.lowStockThreshold,
      reorderLevel: inventory.reorderLevel
    });

    // 2. Check if auto-reorder enabled
    if (inventory.availableStock <= inventory.reorderLevel) {
      await inventoryQueue.add('inventory.autoReorder', {
        productId: inventory.productId,
        suggestedQuantity: inventory.reorderLevel * 5 // Reorder 5x reorder level
      });
    }
  }
};
```

### Notification Worker

**File:** `src/workers/inventory.worker.js`

```javascript
import { Worker } from 'bullmq';
import redisClient from '../config/redis.js';
import { sendEmail } from '../services/email.service.js';

const inventoryWorker = new Worker('inventoryQueue', async (job) => {
  const { productId, currentStock, threshold } = job.data;

  // 1. Fetch product details
  const product = await Product.findById(productId);

  // 2. Send email to admin
  await sendEmail({
    to: process.env.ADMIN_EMAIL,
    subject: `Low Stock Alert: ${product.name}`,
    template: 'low-stock',
    data: {
      productName: product.name,
      currentStock,
      threshold
    }
  });

  // 3. Create in-app notification for admins
  await Notification.create({
    type: 'LOW_STOCK',
    title: `Low Stock: ${product.name}`,
    message: `Only ${currentStock} units remaining`,
    recipients: ['ADMIN', 'VENDOR'],
    priority: 'HIGH'
  });

}, { connection: redisClient });

export default inventoryWorker;
```

---

## Inventory Sync Jobs

### Periodic Sync Job

**File:** `src/jobs/inventorySync.job.js`

```javascript
import cron from 'node-cron';
import Inventory from '../modules/inventory/inventory.model.js';
import logger from '../config/logger.js';

// Run every 15 minutes
cron.schedule('*/15 * * * *', async () => {
  logger.info('Running inventory sync job...');

  try {
    // 1. Find all products with pending stock updates
    const inventories = await Inventory.find({
      lastUpdated: { $lt: Date.now() - 15 * 60 * 1000 } // Not updated in 15 min
    });

    // 2. Sync with external systems (if any)
    for (const inventory of inventories) {
      // Example: Sync with warehouse management system
      // const externalStock = await warehouseAPI.getStock(inventory.productId);
      // if (externalStock !== inventory.totalStock) {
      //   await reconcileStock(inventory, externalStock);
      // }
    }

    // 3. Recalculate available stock
    await Inventory.updateMany(
      {},
      [
        {
          $set: {
            availableStock: { $subtract: ['$totalStock', '$reservedStock'] }
          }
        }
      ]
    );

    logger.info('Inventory sync completed');

  } catch (error) {
    logger.error('Inventory sync failed:', error);
  }
});
```

---

## Multi-Warehouse Support

### Warehouse Model

```javascript
{
  _id: ObjectId,
  name: "Main Warehouse",
  location: {
    address: "...",
    city: "Mumbai",
    state: "Maharashtra",
    pincode: "400001"
  },
  isActive: true,
  capacity: 10000,
  currentOccupancy: 5000
}
```

### Warehouse-Specific Inventory

```javascript
// Each warehouse has separate inventory records
{
  productId: "prod1",
  warehouseId: "warehouse1",
  totalStock: 50,
  reservedStock: 10,
  availableStock: 40
}

{
  productId: "prod1",
  warehouseId: "warehouse2",
  totalStock: 100,
  reservedStock: 20,
  availableStock: 80
}
```

### Stock Allocation Strategy

**1. Nearest Warehouse:**
```javascript
const allocateFromNearestWarehouse = async (productId, quantity, userLocation) => {
  // 1. Find warehouses with sufficient stock
  const warehouses = await Inventory.find({
    productId,
    availableStock: { $gte: quantity }
  }).populate('warehouseId');

  // 2. Calculate distance to each warehouse
  const warehousesWithDistance = warehouses.map(w => ({
    ...w,
    distance: calculateDistance(userLocation, w.warehouseId.location)
  }));

  // 3. Sort by distance
  warehousesWithDistance.sort((a, b) => a.distance - b.distance);

  // 4. Reserve from nearest warehouse
  return await reserveStock(productId, quantity, orderId, warehouses[0].warehouseId);
};
```

**2. Split Fulfillment:**
```javascript
// If no single warehouse has enough stock, split order
const splitFulfillment = async (productId, quantity, orderId) => {
  const warehouses = await Inventory.find({ productId, availableStock: { $gt: 0 } });

  const allocations = [];
  let remaining = quantity;

  for (const warehouse of warehouses) {
    if (remaining <= 0) break;

    const allocate = Math.min(warehouse.availableStock, remaining);
    await reserveStock(productId, allocate, orderId, warehouse.warehouseId);

    allocations.push({
      warehouseId: warehouse.warehouseId,
      quantity: allocate
    });

    remaining -= allocate;
  }

  if (remaining > 0) {
    throw new AppError('Insufficient total stock across warehouses', 400);
  }

  return allocations;
};
```

---

## Concurrency Handling

### Race Condition Prevention

**Scenario:** 100 items in stock, 3 users order 50 each simultaneously

```
Without Lock:
User A reads stock: 100 → Reserve 50 → Write
User B reads stock: 100 → Reserve 50 → Write
User C reads stock: 100 → Reserve 50 → Write
Result: 150 reserved, 100 total → OVERSELLING ❌

With Lock:
User A acquires lock → Read 100 → Reserve 50 → Write → Release lock
User B acquires lock → Read 50 → Reserve 50 → Write → Release lock
User C tries to acquire lock → Read 0 → Error: Insufficient stock ✅
```

### Atomic Operations

**Use MongoDB's `$inc` operator:**
```javascript
// ✅ Atomic - Safe for concurrent updates
await Inventory.findOneAndUpdate(
  { productId, availableStock: { $gte: quantity } },
  { $inc: { reservedStock: quantity } }
);

// ❌ Not Atomic - Race condition possible
const inventory = await Inventory.findOne({ productId });
inventory.reservedStock += quantity;
await inventory.save();
```

### Testing Concurrency

**File:** `tests/integration/inventory.concurrency.test.js`

```javascript
import { describe, it, expect } from '@jest/globals';
import request from 'supertest';
import app from '../../src/app.js';

describe('Inventory Concurrency', () => {
  it('should prevent overselling with concurrent orders', async () => {
    // Setup: Product with 100 stock
    const productId = await createTestProduct({ stock: 100 });

    // Simulate 3 concurrent orders of 50 each
    const orders = await Promise.allSettled([
      createOrder(productId, 50),
      createOrder(productId, 50),
      createOrder(productId, 50)
    ]);

    // Verify: Only 2 orders succeed
    const successful = orders.filter(o => o.status === 'fulfilled');
    const failed = orders.filter(o => o.status === 'rejected');

    expect(successful).toHaveLength(2);
    expect(failed).toHaveLength(1);

    // Verify final stock
    const inventory = await Inventory.findOne({ productId });
    expect(inventory.reservedStock).toBe(100);
    expect(inventory.availableStock).toBe(0);
  });
});
```

---

## Inventory API Endpoints

### Get Inventory

```http
GET /api/v1/inventory/:productId
Authorization: Bearer <token>

Response:
{
  "productId": "prod1",
  "totalStock": 100,
  "reservedStock": 20,
  "availableStock": 80,
  "lowStockThreshold": 10,
  "lastUpdated": "2026-05-18T10:30:00.000Z"
}
```

### Add Stock

```http
POST /api/v1/inventory/add
Authorization: Bearer <token>
Role: ADMIN | VENDOR

Body:
{
  "productId": "prod1",
  "quantity": 50,
  "warehouseId": "warehouse1" (optional)
}

Response:
{
  "success": true,
  "inventory": { ... }
}
```

### Get Low Stock Items

```http
GET /api/v1/inventory/low-stock
Authorization: Bearer <token>
Role: ADMIN

Response:
{
  "items": [
    {
      "productId": "prod1",
      "productName": "Product 1",
      "availableStock": 5,
      "threshold": 10
    }
  ]
}
```

---

**Document Version:** 1.0  
**Last Updated:** May 2026  
**Maintained By:** Engineering Team
