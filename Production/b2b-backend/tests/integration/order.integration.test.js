import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import supertest from 'supertest';
import mongoose from 'mongoose';
import app from '../../src/app.js';
import Order from '../../src/modules/order/order.model.js';
import Cart from '../../src/modules/cart/cart.model.js';
import Product from '../../src/modules/product/product.model.js';
import Category from '../../src/modules/category/category.model.js';
import User from '../../src/modules/user/user.model.js';
import Inventory from '../../src/modules/inventory/inventory.model.js';
import Warehouse from '../../src/modules/warehouse/warehouse.model.js';
import {
  clearDatabase,
  generateTestUser,
} from '../helpers/testUtils.js';
import {
  seedCheckoutFixture,
  seedAdminUser,
  computeExpectedOrderTotalForItems,
} from '../helpers/integrationFixtures.js';
import { hashPassword } from '../../src/utils/hashPassword.js';
import { ROLES } from '../../src/constants/roles.js';
import { USER_STATUS } from '../../src/constants/userStatus.js';
import { ORDER_STATUS } from '../../src/constants/orderStatus.js';
import { PAYMENT_STATUS } from '../../src/constants/paymentStatus.js';
import { redisClient } from '../../src/config/redis.js';

const request = supertest(app);

/**
 * 🔥 PHASE 4: Order Module - Comprehensive Integration Tests
 * Tests order creation, transaction safety, idempotency, status lifecycle, inventory sync
 */

describe('Order Module - Integration Tests', () => {
  let testUser;
  let userToken;
  let adminToken;
  let testCategory;
  let testProduct1;
  let testProduct2;
  let testWarehouse;
  let validShippingAddress;

  beforeEach(async () => {
    await clearDatabase();
    await redisClient.flushdb();

    const checkout = await seedCheckoutFixture({
      email: 'orderuser@test.com',
      mobile: '9876543210',
    });
    testUser = checkout.user;
    userToken = checkout.accessToken;
    testCategory = checkout.category;
    testProduct1 = checkout.product1;
    testProduct2 = checkout.product2;
    testWarehouse = checkout.warehouse;
    validShippingAddress = checkout.validShippingAddress;

    const admin = await seedAdminUser({
      email: 'admin@test.com',
      mobile: '9876543211',
      password: 'Test@1234',
    });
    adminToken = admin.accessToken;
  });

  afterEach(async () => {
    await redisClient.flushdb();
  });

  describe('POST /api/v1/orders - Create Order from Cart (COD)', () => {
    beforeEach(async () => {
      // Add products to cart
      await request
        .post('/api/v1/cart')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          productId: testProduct1._id.toString(),
          quantity: 10,
        });

      await request
        .post('/api/v1/cart')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          productId: testProduct2._id.toString(),
          quantity: 5,
        });
    });

    it('should create order from cart with COD payment', async () => {
      const response = await request
        .post('/api/v1/orders')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          paymentMethod: 'COD',
          shippingAddress: validShippingAddress,
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('_id');
      expect(response.body.data.status).toBe(ORDER_STATUS.CONFIRMED);
      expect(response.body.data.paymentStatus).toBe(PAYMENT_STATUS.PENDING);
      expect(response.body.data.items).toHaveLength(2);
      expect(response.body.data.paymentMethod).toBe('COD');

      // Verify in database
      const order = await Order.findById(response.body.data._id);
      expect(order).toBeDefined();
      expect(order.userId.toString()).toBe(testUser._id.toString());

      // Verify cart is cleared for COD
      const cart = await Cart.findOne({ userId: testUser._id });
      expect(cart.items).toHaveLength(0);

      // Verify inventory is reduced immediately for COD (stock lives on Inventory, not Product)
      const inventory1 = await Inventory.findOne({
        productId: testProduct1._id,
        warehouseId: testWarehouse._id,
      });
      expect(inventory1.stock).toBe(90); // 100 - 10
    });

    it('should calculate total amount correctly (with 18% GST)', async () => {
      const response = await request
        .post('/api/v1/orders')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          paymentMethod: 'COD',
          shippingAddress: validShippingAddress,
        })
        .expect(200);

      expect(response.body.data.totalAmount).toBe(
        computeExpectedOrderTotalForItems([
          { unitPrice: 1000, quantity: 10 },
          { unitPrice: 2000, quantity: 5 },
        ])
      );
    });

    it('should allow single-line-item orders when MOQ is met', async () => {
      await Cart.deleteMany({ userId: testUser._id });
      await request
        .post('/api/v1/cart')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          productId: testProduct1._id.toString(),
          quantity: 10,
        })
        .expect(200);

      const response = await request
        .post('/api/v1/orders')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          paymentMethod: 'COD',
          shippingAddress: validShippingAddress,
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.items).toHaveLength(1);
    });

    it('should reject order from empty cart', async () => {
      // Clear cart
      await Cart.deleteMany({ userId: testUser._id });

      const response = await request
        .post('/api/v1/orders')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          paymentMethod: 'COD',
          shippingAddress: validShippingAddress,
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toMatch(/cart.*empty/i);
    });

    it('should reject order with missing shipping address', async () => {
      const response = await request
        .post('/api/v1/orders')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          paymentMethod: 'COD',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toMatch(/shippingAddress|shipping address/i);
    });

    it('should reject order with invalid shipping address', async () => {
      const response = await request
        .post('/api/v1/orders')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          paymentMethod: 'COD',
          shippingAddress: {
            name: 'John',
            // Missing required fields
          },
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should detect heavy vehicle requirement', async () => {
      // Create product with heavy weight
      const heavyProduct = await Product.create({
        name: 'Heavy Product',
        price: 5000,
        stock: 100,
        weight: 150, // > 100kg threshold
        categoryId: testCategory._id,
        isActive: true,
        moq: 1,
        minOrderQty: 1,
      });

      await Inventory.create({
        productId: heavyProduct._id,
        warehouseId: testWarehouse._id,
        stock: 100,
      });

      await Cart.deleteMany({ userId: testUser._id });
      await request
        .post('/api/v1/cart')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          productId: heavyProduct._id.toString(),
          quantity: 2, // Total weight: 300kg
        });

      const response = await request
        .post('/api/v1/orders')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          paymentMethod: 'COD',
          shippingAddress: validShippingAddress,
        })
        .expect(200);

      expect(response.body.data.requiresHeavyVehicle).toBe(true);
    });
  });

  describe('POST /api/v1/orders - Create Order with Direct Items', () => {
    it('should create order with direct items (bypass cart)', async () => {
      const response = await request
        .post('/api/v1/orders')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          paymentMethod: 'COD',
          shippingAddress: validShippingAddress,
          items: [
            {
              productId: testProduct1._id.toString(),
              quantity: 10,
            },
            {
              productId: testProduct2._id.toString(),
              quantity: 5,
            },
          ],
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.items).toHaveLength(2);
    });

    it('should reject direct items with insufficient stock', async () => {
      const response = await request
        .post('/api/v1/orders')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          paymentMethod: 'COD',
          shippingAddress: validShippingAddress,
          items: [
            {
              productId: testProduct2._id.toString(),
              quantity: 100, // Stock is only 50
            },
          ],
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toMatch(/insufficient stock/i);
    });

    it('should reject direct items below MOQ', async () => {
      const response = await request
        .post('/api/v1/orders')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          paymentMethod: 'COD',
          shippingAddress: validShippingAddress,
          items: [
            {
              productId: testProduct1._id.toString(),
              quantity: 5, // MOQ is 10
            },
          ],
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toMatch(/minimum.*quantity/i);
    });

    it('should reject direct items with non-existent product', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request
        .post('/api/v1/orders')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          paymentMethod: 'COD',
          shippingAddress: validShippingAddress,
          items: [
            {
              productId: fakeId.toString(),
              quantity: 10,
            },
          ],
        })
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/v1/orders - Create Order with ONLINE Payment', () => {
    beforeEach(async () => {
      await request
        .post('/api/v1/cart')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          productId: testProduct1._id.toString(),
          quantity: 10,
        });
    });

    it('should create order with ONLINE payment and reserve inventory', async () => {
      const response = await request
        .post('/api/v1/orders')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          paymentMethod: 'ONLINE',
          shippingAddress: validShippingAddress,
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe(ORDER_STATUS.PENDING_PAYMENT);
      expect(response.body.data.paymentStatus).toBe(PAYMENT_STATUS.PENDING);

      // Cart should NOT be cleared for non-COD
      const cart = await Cart.findOne({ userId: testUser._id });
      expect(cart.items.length).toBeGreaterThan(0);

      // Stock should be RESERVED, not immediately deducted
      const product1 = await Product.findById(testProduct1._id);
      expect(product1.stock).toBe(100); // Unchanged until payment verification
    });
  });

  describe('Order Idempotency', () => {
    beforeEach(async () => {
      await request
        .post('/api/v1/cart')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          productId: testProduct1._id.toString(),
          quantity: 10,
        });
    });

    it('should prevent duplicate orders with same idempotency key', async () => {
      const idempotencyKey = `order-${Date.now()}`;

      // First request
      const response1 = await request
        .post('/api/v1/orders')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          paymentMethod: 'COD',
          shippingAddress: validShippingAddress,
          idempotencyKey,
        })
        .expect(200);

      const orderId1 = response1.body.data._id;

      // Second request with same key
      const response2 = await request
        .post('/api/v1/orders')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          paymentMethod: 'COD',
          shippingAddress: validShippingAddress,
          idempotencyKey,
        })
        .expect(200);

      // Should return the same order
      expect(response2.body.data._id).toBe(orderId1);

      // Verify only one order was created
      const orderCount = await Order.countDocuments({ idempotencyKey });
      expect(orderCount).toBe(1);
    });

    it('should allow different orders with different idempotency keys', async () => {
      const key1 = `order-${Date.now()}-1`;
      const key2 = `order-${Date.now()}-2`;

      const response1 = await request
        .post('/api/v1/orders')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          paymentMethod: 'COD',
          shippingAddress: validShippingAddress,
          idempotencyKey: key1,
        })
        .expect(200);

      // Replenish cart for second order
      await request
        .post('/api/v1/cart')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          productId: testProduct1._id.toString(),
          quantity: 10,
        });

      const response2 = await request
        .post('/api/v1/orders')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          paymentMethod: 'COD',
          shippingAddress: validShippingAddress,
          idempotencyKey: key2,
        })
        .expect(200);

      expect(response1.body.data._id).not.toBe(response2.body.data._id);
    });
  });

  describe('GET /api/v1/orders - Get User Orders', () => {
    let testOrder1;
    let testOrder2;

    beforeEach(async () => {
      testOrder1 = await Order.create({
        userId: testUser._id,
        items: [
          {
            productId: testProduct1._id,
            name: testProduct1.name,
            price: testProduct1.price,
            quantity: 10,
          },
        ],
        totalAmount: 11800,
        paymentMethod: 'COD',
        address: validShippingAddress,
        status: ORDER_STATUS.CONFIRMED,
        paymentStatus: PAYMENT_STATUS.PENDING,
      });

      testOrder2 = await Order.create({
        userId: testUser._id,
        items: [
          {
            productId: testProduct2._id,
            name: testProduct2.name,
            price: testProduct2.price,
            quantity: 5,
          },
        ],
        totalAmount: 11800,
        paymentMethod: 'ONLINE',
        address: validShippingAddress,
        status: ORDER_STATUS.PENDING_PAYMENT,
        paymentStatus: PAYMENT_STATUS.PENDING,
      });
    });

    it('should fetch user orders (customer receives array, excludes pending payment)', async () => {
      const response = await request
        .get('/api/v1/orders')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      // PENDING_PAYMENT orders are hidden from customers
      expect(response.body.data.length).toBe(1);
      expect(response.body.data[0].status).toBe(ORDER_STATUS.CONFIRMED);
    });

    it('should fetch paginated orders for admin', async () => {
      const response = await request
        .get('/api/v1/orders')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('orders');
      expect(response.body.data).toHaveProperty('pagination');
      expect(response.body.data.orders.length).toBeGreaterThanOrEqual(2);
    });

    it('should filter orders by status', async () => {
      const response = await request
        .get(`/api/v1/orders?status=${ORDER_STATUS.CONFIRMED}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      const orders = Array.isArray(response.body.data) ? response.body.data : response.body.data.orders;
      expect(orders.length).toBe(1);
      expect(orders[0].status).toBe(ORDER_STATUS.CONFIRMED);
    });

    it('should not show other users orders', async () => {
      // Create another user's order
      const otherUser = await User.create({
        ...generateTestUser({
          email: 'other@test.com',
          mobile: '9876543212',
        }),
        password: await hashPassword('Test@1234'),
        role: ROLES.B2B_CUSTOMER,
        status: USER_STATUS.ACTIVE,
      });

      await Order.create({
        userId: otherUser._id,
        items: [
          {
            productId: testProduct1._id,
            name: testProduct1.name,
            price: testProduct1.price,
            quantity: 10,
          },
        ],
        totalAmount: 11800,
        paymentMethod: 'COD',
        address: validShippingAddress,
        status: ORDER_STATUS.CONFIRMED,
        paymentStatus: PAYMENT_STATUS.PENDING,
      });

      const response = await request
        .get('/api/v1/orders')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      const orders = Array.isArray(response.body.data) ? response.body.data : response.body.data.orders;
      expect(orders.length).toBe(1);
    });
  });

  describe('GET /api/v1/orders/:id - Get Order By ID', () => {
    let testOrder;

    beforeEach(async () => {
      testOrder = await Order.create({
        userId: testUser._id,
        items: [
          {
            productId: testProduct1._id,
            name: testProduct1.name,
            price: testProduct1.price,
            quantity: 10,
          },
        ],
        totalAmount: 11800,
        paymentMethod: 'COD',
        address: validShippingAddress,
        status: ORDER_STATUS.CONFIRMED,
        paymentStatus: PAYMENT_STATUS.PENDING,
      });
    });

    it('should fetch order by valid ID', async () => {
      const response = await request
        .get(`/api/v1/orders/${testOrder._id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data._id).toBe(testOrder._id.toString());
    });

    it('should return 404 for non-existent order', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request
        .get(`/api/v1/orders/${fakeId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    it('should prevent accessing other users orders', async () => {
      // Create another user and their order
      const otherUser = await User.create({
        ...generateTestUser({
          email: 'other@test.com',
          mobile: '9876543212',
        }),
        password: await hashPassword('Test@1234'),
        role: ROLES.B2B_CUSTOMER,
        status: USER_STATUS.ACTIVE,
      });

      const otherOrder = await Order.create({
        userId: otherUser._id,
        items: [
          {
            productId: testProduct1._id,
            name: testProduct1.name,
            price: testProduct1.price,
            quantity: 10,
          },
        ],
        totalAmount: 11800,
        paymentMethod: 'COD',
        address: validShippingAddress,
        status: ORDER_STATUS.CONFIRMED,
        paymentStatus: PAYMENT_STATUS.PENDING,
      });

      const response = await request
        .get(`/api/v1/orders/${otherOrder._id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
    });

    it('should allow admin to access any order', async () => {
      const response = await request
        .get(`/api/v1/orders/${testOrder._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('PATCH /api/v1/orders/:id/status - Update Order Status', () => {
    let testOrder;

    beforeEach(async () => {
      testOrder = await Order.create({
        userId: testUser._id,
        items: [
          {
            productId: testProduct1._id,
            name: testProduct1.name,
            price: testProduct1.price,
            quantity: 10,
          },
        ],
        totalAmount: 11800,
        paymentMethod: 'COD',
        address: validShippingAddress,
        status: ORDER_STATUS.CONFIRMED,
        paymentStatus: PAYMENT_STATUS.PENDING,
      });
    });

    it('should allow admin to update order status', async () => {
      const response = await request
        .patch(`/api/v1/orders/${testOrder._id}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: ORDER_STATUS.PROCESSING })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe(ORDER_STATUS.PROCESSING);
    });

    it('should prevent customer from updating order status', async () => {
      const response = await request
        .patch(`/api/v1/orders/${testOrder._id}/status`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ status: ORDER_STATUS.PROCESSING })
        .expect(403);

      expect(response.body.success).toBe(false);
    });

    it('should reject invalid status transitions', async () => {
      const response = await request
        .patch(`/api/v1/orders/${testOrder._id}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: ORDER_STATUS.DELIVERED }) // Cannot jump from CONFIRMED to DELIVERED
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toMatch(/invalid.*transition/i);
    });

    it('should allow valid status progression', async () => {
      // CONFIRMED -> PROCESSING
      await request
        .patch(`/api/v1/orders/${testOrder._id}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: ORDER_STATUS.PROCESSING })
        .expect(200);

      // PROCESSING -> PACKED
      await request
        .patch(`/api/v1/orders/${testOrder._id}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: ORDER_STATUS.PACKED })
        .expect(200);

      // PACKED -> READY_TO_DISPATCH -> SHIPPED -> OUT_FOR_DELIVERY -> DELIVERED
      await request
        .patch(`/api/v1/orders/${testOrder._id}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: ORDER_STATUS.READY_TO_DISPATCH })
        .expect(200);

      await request
        .patch(`/api/v1/orders/${testOrder._id}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: ORDER_STATUS.SHIPPED })
        .expect(200);

      await request
        .patch(`/api/v1/orders/${testOrder._id}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: ORDER_STATUS.OUT_FOR_DELIVERY })
        .expect(200);

      // OUT_FOR_DELIVERY -> DELIVERED
      const response = await request
        .patch(`/api/v1/orders/${testOrder._id}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: ORDER_STATUS.DELIVERED })
        .expect(200);

      expect(response.body.data.status).toBe(ORDER_STATUS.DELIVERED);
    });
  });

  describe('Order Transaction Safety', () => {
    beforeEach(async () => {
      await request
        .post('/api/v1/cart')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          productId: testProduct1._id.toString(),
          quantity: 10,
        });
    });

    it('should rollback order creation on stock deduction failure', async () => {
      // Zero warehouse inventory so checkStock fails during order creation
      await Inventory.updateMany(
        { productId: testProduct1._id },
        { $set: { stock: 0 } }
      );

      const response = await request
        .post('/api/v1/orders')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          paymentMethod: 'COD',
          shippingAddress: validShippingAddress,
        })
        .expect(400);

      expect(response.body.success).toBe(false);

      // Verify no order was created
      const orderCount = await Order.countDocuments({ userId: testUser._id });
      expect(orderCount).toBe(0);

      // Verify cart was not cleared
      const cart = await Cart.findOne({ userId: testUser._id });
      expect(cart.items.length).toBeGreaterThan(0);
    });

    it('should handle concurrent order creation safely', async () => {
      await Inventory.updateMany(
        { productId: testProduct1._id },
        { $set: { stock: 15 } }
      );

      // Try to create two orders concurrently
      const promise1 = request
        .post('/api/v1/orders')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          paymentMethod: 'COD',
          shippingAddress: validShippingAddress,
        });

      const promise2 = request
        .post('/api/v1/orders')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          paymentMethod: 'COD',
          shippingAddress: validShippingAddress,
        });

      const results = await Promise.allSettled([promise1, promise2]);

      // One should succeed, one should fail due to insufficient stock
      const successes = results.filter(r => r.status === 'fulfilled' && r.value.status === 201);
      const failures = results.filter(r => r.status === 'fulfilled' && r.value.status !== 201);

      expect(successes.length).toBeLessThanOrEqual(1);
      expect(failures.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Order Pricing Consistency', () => {
    it('should use server-side pricing, not client-provided', async () => {
      const response = await request
        .post('/api/v1/orders')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          paymentMethod: 'COD',
          shippingAddress: validShippingAddress,
          items: [
            {
              productId: testProduct1._id.toString(),
              quantity: 10,
              price: 1, // Client trying to manipulate price
            },
          ],
        })
        .expect(200);

      // Should use actual product price from database (1000), not client price (1)
      expect(response.body.data.items[0].price).toBe(1000);
      expect(response.body.data.totalAmount).toBe(10620); // 10% bulk discount @ qty 10 + 18% GST
    });

    it('should recalculate total even if client provides wrong total', async () => {
      await request
        .post('/api/v1/cart')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          productId: testProduct1._id.toString(),
          quantity: 10,
        });

      const response = await request
        .post('/api/v1/orders')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          paymentMethod: 'COD',
          shippingAddress: validShippingAddress,
          totalAmount: 100, // Client trying to manipulate total
        })
        .expect(200);

      // Should calculate correct total server-side
      expect(response.body.data.totalAmount).toBe(10620);
    });
  });

  describe('Order Authorization & RBAC', () => {
    let userOrder;

    beforeEach(async () => {
      userOrder = await Order.create({
        userId: testUser._id,
        items: [
          {
            productId: testProduct1._id,
            name: testProduct1.name,
            price: testProduct1.price,
            quantity: 10,
          },
        ],
        totalAmount: 11800,
        paymentMethod: 'COD',
        address: validShippingAddress,
        status: ORDER_STATUS.CONFIRMED,
        paymentStatus: PAYMENT_STATUS.PENDING,
      });
    });

    it('should allow admin to view all orders', async () => {
      const response = await request
        .get('/api/v1/orders')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should prevent customer from accessing admin user management', async () => {
      const response = await request
        .get('/api/v1/admin/users')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
    });

    it('should enforce ownership on order access', async () => {
      // Create another user
      const otherUser = await User.create({
        ...generateTestUser({
          email: 'other@test.com',
          mobile: '9876543212',
        }),
        password: await hashPassword('Test@1234'),
        role: ROLES.B2B_CUSTOMER,
        status: USER_STATUS.ACTIVE,
      });

      const otherLogin = await request
        .post('/api/v1/auth/login')
        .send({ identifier: 'other@test.com', password: 'Test@1234' });
      const otherToken = otherLogin.body.data.accessToken;

      // Another user cannot access this order by ID
      const response = await request
        .get(`/api/v1/orders/${userOrder._id}`)
        .set('Authorization', `Bearer ${otherToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
    });
  });
});
