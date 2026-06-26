import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import supertest from 'supertest';
import mongoose from 'mongoose';
import app from '../../src/app.js';
import Order from '../../src/modules/order/order.model.js';
import Cart from '../../src/modules/cart/cart.model.js';
import Product from '../../src/modules/product/product.model.js';
import Inventory from '../../src/modules/inventory/inventory.model.js';
import {
  clearDatabase,
} from '../helpers/testUtils.js';
import {
  seedCheckoutFixture,
  seedProduct,
  seedInventory,
  seedActiveUser,
  computeExpectedOrderTotal,
} from '../helpers/integrationFixtures.js';
import { withCsrf, bearerHeaders } from '../helpers/httpTestHelpers.js';
import { ORDER_STATUS } from '../../src/constants/orderStatus.js';
import { PAYMENT_STATUS } from '../../src/constants/paymentStatus.js';
import { redisClient } from '../../src/config/redis.js';

const request = supertest(app);

/**
 * 🔥 PHASE 4: Checkout Workflow - End-to-End Integration Tests
 * Tests complete checkout flow: cart → validation → order → inventory sync
 */

describe('Checkout Workflow - End-to-End Tests', () => {
  let customerSession;
  let testUser;
  let testCategory;
  let testProduct1;
  let testProduct2;
  let lowStockProduct;
  let testWarehouse;
  let validShippingAddress;

  beforeEach(async () => {
    await clearDatabase();
    await redisClient.flushdb();

    const fixture = await seedCheckoutFixture({
      email: 'checkout@test.com',
      mobile: '9876543213',
    });
    customerSession = fixture;
    testUser = fixture.user;
    testCategory = fixture.category;
    testProduct1 = fixture.product1;
    testProduct2 = fixture.product2;
    testWarehouse = fixture.warehouse;
    validShippingAddress = fixture.validShippingAddress;

    lowStockProduct = await seedProduct(testCategory._id, {
      name: 'Low Stock Product',
      price: 1500,
      stock: 5,
      moq: 5,
      minOrderQty: 5,
    });
    await seedInventory({
      productId: lowStockProduct._id,
      warehouseId: testWarehouse._id,
      stock: 5,
    });
  });

  afterEach(async () => {
    await redisClient.flushdb();
  });

  describe('Complete Checkout Flow - COD', () => {
    it('should complete full checkout: add to cart → checkout → order created → inventory updated', async () => {
      // Step 1: Add products to cart
      await request
        .post('/api/v1/cart')
        .set('Authorization', `Bearer ${customerSession.accessToken}`)
        .send({
          productId: testProduct1._id.toString(),
          quantity: 10,
        })
        .expect(200);

      await request
        .post('/api/v1/cart')
        .set('Authorization', `Bearer ${customerSession.accessToken}`)
        .send({
          productId: testProduct2._id.toString(),
          quantity: 5,
        })
        .expect(200);

      // Step 2: Verify cart contents
      const cartResponse = await request
        .get('/api/v1/cart')
        .set('Authorization', `Bearer ${customerSession.accessToken}`)
        .expect(200);

      expect(cartResponse.body.data.items).toHaveLength(2);

      // Step 3: Checkout (create order)
      const orderResponse = await request
        .post('/api/v1/orders')
        .set('Authorization', `Bearer ${customerSession.accessToken}`)
        .set('x-csrf-token', customerSession.csrfToken)
        .set('Cookie', `csrf-token=${customerSession.csrfToken}`)
        .send({
          paymentMethod: 'COD',
          shippingAddress: validShippingAddress,
        })
        .expect(200);

      const orderId = orderResponse.body.data._id;
      expect(orderResponse.body.data.status).toBe(ORDER_STATUS.CONFIRMED);

      // Step 4: Verify cart is cleared
      const clearedCartResponse = await request
        .get('/api/v1/cart')
        .set('Authorization', `Bearer ${customerSession.accessToken}`)
        .expect(200);

      expect(clearedCartResponse.body.data.items).toHaveLength(0);

      // Step 5: Verify inventory is updated (stock tracked on Inventory model)
      const inventory1 = await Inventory.findOne({ productId: testProduct1._id });
      const inventory2 = await Inventory.findOne({ productId: testProduct2._id });

      expect(inventory1.stock).toBe(90); // 100 - 10
      expect(inventory2.stock).toBe(45); // 50 - 5

      // Step 6: Verify order is retrievable
      const fetchedOrderResponse = await request
        .get(`/api/v1/orders/${orderId}`)
        .set('Authorization', `Bearer ${customerSession.accessToken}`)
        .expect(200);

      expect(fetchedOrderResponse.body.data._id).toBe(orderId);
    });

    it('should handle checkout with partial stock availability', async () => {
      // Add product with low stock to cart
      await request
        .post('/api/v1/cart')
        .set('Authorization', `Bearer ${customerSession.accessToken}`)
        .send({
          productId: lowStockProduct._id.toString(),
          quantity: 5, // Exactly available stock
        })
        .expect(200);

      // First checkout should succeed
      const response1 = await request
        .post('/api/v1/orders')
        .set('Authorization', `Bearer ${customerSession.accessToken}`)
        .set('x-csrf-token', customerSession.csrfToken)
        .set('Cookie', `csrf-token=${customerSession.csrfToken}`)
        .send({
          paymentMethod: 'COD',
          shippingAddress: validShippingAddress,
        })
        .expect(200);

      expect(response1.body.success).toBe(true);

      // Verify inventory stock is depleted (stock lives on Inventory model)
      const inventoryUpdated = await Inventory.findOne({
        productId: lowStockProduct._id,
        warehouseId: testWarehouse._id,
      });
      expect(inventoryUpdated.stock).toBe(0);

      // Try to add same product to cart again
      const addToCartResponse = await request
        .post('/api/v1/cart')
        .set('Authorization', `Bearer ${customerSession.accessToken}`)
        .send({
          productId: lowStockProduct._id.toString(),
          quantity: 5,
        })
        .expect(400); // Should fail due to insufficient stock

      expect(addToCartResponse.body.message).toMatch(/insufficient stock/i);
    });

    it('should rollback inventory on order creation failure', async () => {
      // Mock a scenario where order creation fails after stock check
      // (e.g., by providing invalid address after items are validated)
      
      await request
        .post('/api/v1/cart')
        .set('Authorization', `Bearer ${customerSession.accessToken}`)
        .send({
          productId: testProduct1._id.toString(),
          quantity: 10,
        });

      const initialInventory = await Inventory.findOne({
        productId: testProduct1._id,
        warehouseId: testWarehouse._id,
      });
      const initialStock = initialInventory.stock;

      // Try to create order with invalid data (should fail)
      const response = await request
        .post('/api/v1/orders')
        .set('Authorization', `Bearer ${customerSession.accessToken}`)
        .set('x-csrf-token', customerSession.csrfToken)
        .set('Cookie', `csrf-token=${customerSession.csrfToken}`)
        .send({
          paymentMethod: 'COD',
          shippingAddress: {}, // Invalid address
        })
        .expect(400);

      expect(response.body.success).toBe(false);

      // Verify inventory stock is unchanged
      const inventoryAfterFailure = await Inventory.findOne({
        productId: testProduct1._id,
        warehouseId: testWarehouse._id,
      });
      expect(inventoryAfterFailure.stock).toBe(initialStock);

      // Verify cart is not cleared
      const cartAfterFailure = await request
        .get('/api/v1/cart')
        .set('Authorization', `Bearer ${customerSession.accessToken}`)
        .expect(200);

      expect(cartAfterFailure.body.data.items).toHaveLength(1);

      // Verify no order was created
      const orderCount = await Order.countDocuments({ userId: testUser._id });
      expect(orderCount).toBe(0);
    });
  });

  describe('Complete Checkout Flow - ONLINE Payment', () => {
    it('should complete checkout with payment pending: cart → order → inventory reserved', async () => {
      // Step 1: Add products to cart
      await request
        .post('/api/v1/cart')
        .set('Authorization', `Bearer ${customerSession.accessToken}`)
        .send({
          productId: testProduct1._id.toString(),
          quantity: 10,
        });

      // Step 2: Checkout with ONLINE payment
      const orderResponse = await request
        .post('/api/v1/orders')
        .set('Authorization', `Bearer ${customerSession.accessToken}`)
        .set('x-csrf-token', customerSession.csrfToken)
        .set('Cookie', `csrf-token=${customerSession.csrfToken}`)
        .send({
          paymentMethod: 'ONLINE',
          shippingAddress: validShippingAddress,
        })
        .expect(200);

      expect(orderResponse.body.data.status).toBe(ORDER_STATUS.PENDING_PAYMENT);
      expect(orderResponse.body.data.paymentStatus).toBe(PAYMENT_STATUS.PENDING);

      // Step 3: Verify cart is NOT cleared (pending payment)
      const cartResponse = await request
        .get('/api/v1/cart')
        .set('Authorization', `Bearer ${customerSession.accessToken}`)
        .expect(200);

      expect(cartResponse.body.data.items.length).toBeGreaterThan(0);

      // Step 4: Verify inventory is RESERVED, not deducted
      const inventoryAfterCheckout = await Inventory.findOne({
        productId: testProduct1._id,
        warehouseId: testWarehouse._id,
      });
      expect(inventoryAfterCheckout.stock).toBe(100);

      // Step 5: Verify reservation exists in Redis
      const reservationKey = `inventory:reservation:${orderResponse.body.data._id}`;
      const reservation = await redisClient.get(reservationKey);
      expect(reservation).toBeTruthy();
    });

    it('should expire reservation after timeout', async () => {
      await request
        .post('/api/v1/cart')
        .set('Authorization', `Bearer ${customerSession.accessToken}`)
        .send({
          productId: testProduct1._id.toString(),
          quantity: 10,
        });

      const orderResponse = await request
        .post('/api/v1/orders')
        .set('Authorization', `Bearer ${customerSession.accessToken}`)
        .send({
          paymentMethod: 'ONLINE',
          shippingAddress: validShippingAddress,
        })
        .expect(200);

      const orderId = orderResponse.body.data._id;

      // Simulate TTL expiry by manually deleting reservation
      const reservationKey = `inventory:reservation:${orderId}`;
      await redisClient.del(reservationKey);

      // After expiry, stock should be available again
      const addToCartResponse = await request
        .post('/api/v1/cart')
        .set('Authorization', `Bearer ${customerSession.accessToken}`)
        .send({
          productId: testProduct1._id.toString(),
          quantity: 10,
        })
        .expect(200); // Should succeed as reservation expired

      expect(addToCartResponse.body.success).toBe(true);
    });
  });

  describe('Concurrent Checkout Scenarios', () => {
    it('should handle concurrent checkouts for same product safely', async () => {
      await Inventory.findOneAndUpdate(
        { productId: testProduct1._id, warehouseId: testWarehouse._id },
        { stock: 15 }
      );

      const user2Session = await seedActiveUser({
        email: 'user2@test.com',
        mobile: '9876543214',
      });
      const token2 = user2Session.accessToken;

      // Both users add same product to cart
      await request
        .post('/api/v1/cart')
        .set('Authorization', `Bearer ${customerSession.accessToken}`)
        .send({
          productId: testProduct1._id.toString(),
          quantity: 10,
        });

      await request
        .post('/api/v1/cart')
        .set('Authorization', `Bearer ${token2}`)
        .send({
          productId: testProduct1._id.toString(),
          quantity: 10,
        });

      // Try concurrent checkouts
      const checkout1 = request
        .post('/api/v1/orders')
        .set('Authorization', `Bearer ${customerSession.accessToken}`)
        .send({
          paymentMethod: 'COD',
          shippingAddress: validShippingAddress,
        });

      const checkout2 = request
        .post('/api/v1/orders')
        .set('Authorization', `Bearer ${token2}`)
        .send({
          paymentMethod: 'COD',
          shippingAddress: validShippingAddress,
        });

      const results = await Promise.allSettled([checkout1, checkout2]);

      const successes = results.filter(
        (r) => r.status === 'fulfilled' && r.value.status === 200 && r.value.body?.success
      );
      const failures = results.filter(
        (r) => r.status === 'fulfilled' && (r.value.status !== 200 || !r.value.body?.success)
      );

      expect(successes.length).toBe(1);
      expect(failures.length).toBe(1);

      const finalInventory = await Inventory.findOne({
        productId: testProduct1._id,
        warehouseId: testWarehouse._id,
      });
      expect(finalInventory.stock).toBe(5);
    });

    it('should prevent overselling during concurrent checkouts', async () => {
      await Inventory.findOneAndUpdate(
        { productId: testProduct1._id, warehouseId: testWarehouse._id },
        { stock: 12 }
      );

      const tokens = [];
      for (let i = 0; i < 3; i++) {
        const session = await seedActiveUser({
          email: `checkout-user-${i}@test.com`,
          mobile: `98765432${10 + i}`,
        });
        const token = session.accessToken;
        tokens.push(token);

        await request
          .post('/api/v1/cart')
          .set('Authorization', `Bearer ${token}`)
          .send({
            productId: testProduct1._id.toString(),
            quantity: 10,
          });
      }

      // Try concurrent checkouts
      const checkoutPromises = tokens.map(token =>
        request
          .post('/api/v1/orders')
          .set('Authorization', `Bearer ${token}`)
          .send({
            paymentMethod: 'COD',
            shippingAddress: validShippingAddress,
          })
      );

      const results = await Promise.allSettled(checkoutPromises);

      const successes = results.filter(
        (r) => r.status === 'fulfilled' && r.value.status === 200 && r.value.body?.success
      );
      expect(successes.length).toBe(1);

      const finalInventory = await Inventory.findOne({
        productId: testProduct1._id,
        warehouseId: testWarehouse._id,
      });
      expect(finalInventory.stock).toBeGreaterThanOrEqual(0);
      expect(finalInventory.stock).toBe(2);
    });
  });

  describe('Checkout Validation & Edge Cases', () => {
    it('should prevent checkout with inactive product in cart', async () => {
      // Add active product to cart
      await request
        .post('/api/v1/cart')
        .set('Authorization', `Bearer ${customerSession.accessToken}`)
        .send({
          productId: testProduct1._id.toString(),
          quantity: 10,
        });

      // Deactivate product
      testProduct1.isActive = false;
      await testProduct1.save();

      // Try checkout
      const response = await request
        .post('/api/v1/orders')
        .set('Authorization', `Bearer ${customerSession.accessToken}`)
        .send({
          paymentMethod: 'COD',
          shippingAddress: validShippingAddress,
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toMatch(/not available/i);
    });

    it('should prevent checkout when product is deleted', async () => {
      await request
        .post('/api/v1/cart')
        .set('Authorization', `Bearer ${customerSession.accessToken}`)
        .send({
          productId: testProduct1._id.toString(),
          quantity: 10,
        });

      // Delete product
      await Product.findByIdAndDelete(testProduct1._id);

      // Try checkout
      const response = await request
        .post('/api/v1/orders')
        .set('Authorization', `Bearer ${customerSession.accessToken}`)
        .send({
          paymentMethod: 'COD',
          shippingAddress: validShippingAddress,
        })
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    it('should prevent checkout when cart quantity exceeds available stock', async () => {
      await request
        .post('/api/v1/cart')
        .set('Authorization', `Bearer ${customerSession.accessToken}`)
        .send({
          productId: testProduct1._id.toString(),
          quantity: 10,
        });

      await Inventory.findOneAndUpdate(
        { productId: testProduct1._id, warehouseId: testWarehouse._id },
        { stock: 5 }
      );

      // Try checkout
      const response = await request
        .post('/api/v1/orders')
        .set('Authorization', `Bearer ${customerSession.accessToken}`)
        .send({
          paymentMethod: 'COD',
          shippingAddress: validShippingAddress,
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toMatch(/insufficient stock/i);
    });

    it('should handle price changes between cart and checkout', async () => {
      await request
        .post('/api/v1/cart')
        .set('Authorization', `Bearer ${customerSession.accessToken}`)
        .send({
          productId: testProduct1._id.toString(),
          quantity: 10,
        });

      // Change product price
      testProduct1.price = 1500; // Was 1000
      await testProduct1.save();

      // Checkout should use current price
      const response = await request
        .post('/api/v1/orders')
        .set('Authorization', `Bearer ${customerSession.accessToken}`)
        .send({
          paymentMethod: 'COD',
          shippingAddress: validShippingAddress,
        })
        .expect(200);

      // Should use new price with bulk discount: 1500 * 10, 10% off, +18% GST
      expect(response.body.data.totalAmount).toBe(computeExpectedOrderTotal(1500, 10));
    });

    it('should prevent checkout without authentication', async () => {
      const response = await request
        .post('/api/v1/orders')
        .send({
          paymentMethod: 'COD',
          shippingAddress: validShippingAddress,
        })
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should handle very large cart (stress test)', async () => {
      // Add many different products
      const products = [];
      for (let i = 0; i < 10; i++) {
        const product = await seedProduct(testCategory._id, {
          name: `Bulk Product ${i}`,
          price: 1000,
          stock: 100,
          moq: 5,
          minOrderQty: 5,
        });
        products.push(product);

        await seedInventory({
          productId: product._id,
          warehouseId: testWarehouse._id,
          stock: 100,
        });

        await request
          .post('/api/v1/cart')
          .set('Authorization', `Bearer ${customerSession.accessToken}`)
          .send({
            productId: product._id.toString(),
            quantity: 5,
          });
      }

      // Checkout large cart
      const response = await request
        .post('/api/v1/orders')
        .set('Authorization', `Bearer ${customerSession.accessToken}`)
        .send({
          paymentMethod: 'COD',
          shippingAddress: validShippingAddress,
        })
        .expect(200);

      expect(response.body.data.items).toHaveLength(10);

      // Verify all products had inventory stock deducted
      for (const product of products) {
        const updated = await Inventory.findOne({
          productId: product._id,
          warehouseId: testWarehouse._id,
        });
        expect(updated.stock).toBe(95);
      }
    });
  });

  describe('Checkout Failure Recovery', () => {
    it('should maintain cart state on checkout failure', async () => {
      await request
        .post('/api/v1/cart')
        .set('Authorization', `Bearer ${customerSession.accessToken}`)
        .send({
          productId: testProduct1._id.toString(),
          quantity: 10,
        });

      await request
        .post('/api/v1/cart')
        .set('Authorization', `Bearer ${customerSession.accessToken}`)
        .send({
          productId: testProduct2._id.toString(),
          quantity: 5,
        });

      // Try checkout with invalid data
      const response = await request
        .post('/api/v1/orders')
        .set('Authorization', `Bearer ${customerSession.accessToken}`)
        .send({
          paymentMethod: 'COD',
          // Missing shipping address
        })
        .expect(400);

      expect(response.body.success).toBe(false);

      // Verify cart is unchanged
      const cartAfterFailure = await request
        .get('/api/v1/cart')
        .set('Authorization', `Bearer ${customerSession.accessToken}`)
        .expect(200);

      expect(cartAfterFailure.body.data.items).toHaveLength(2);

      // User can retry checkout
      const retryResponse = await request
        .post('/api/v1/orders')
        .set('Authorization', `Bearer ${customerSession.accessToken}`)
        .send({
          paymentMethod: 'COD',
          shippingAddress: validShippingAddress,
        })
        .expect(200);

      expect(retryResponse.body.success).toBe(true);
    });

    it('should handle database transaction failure gracefully', async () => {
      await request
        .post('/api/v1/cart')
        .set('Authorization', `Bearer ${customerSession.accessToken}`)
        .send({
          productId: testProduct1._id.toString(),
          quantity: 10,
        });

      // Store initial state
      const initialInventory = await Inventory.findOne({
        productId: testProduct1._id,
        warehouseId: testWarehouse._id,
      });
      const initialStock = initialInventory.stock;
      const initialCartCount = (await Cart.findOne({ userId: testUser._id })).items.length;
      const initialOrderCount = await Order.countDocuments({ userId: testUser._id });

      await Inventory.findOneAndUpdate(
        { productId: testProduct1._id, warehouseId: testWarehouse._id },
        { stock: 5 }
      );

      const response = await request
        .post('/api/v1/orders')
        .set('Authorization', `Bearer ${customerSession.accessToken}`)
        .send({
          paymentMethod: 'COD',
          shippingAddress: validShippingAddress,
        })
        .expect(400);

      expect(response.body.success).toBe(false);

      // Verify no partial writes occurred
      const finalOrderCount = await Order.countDocuments({ userId: testUser._id });
      expect(finalOrderCount).toBe(initialOrderCount);

      const finalCart = await Cart.findOne({ userId: testUser._id });
      expect(finalCart.items.length).toBe(initialCartCount);

      const finalInventory = await Inventory.findOne({
        productId: testProduct1._id,
        warehouseId: testWarehouse._id,
      });
      expect(finalInventory.stock).toBe(5);
    });
  });

  describe('Checkout Order Lifecycle', () => {
    it('should transition through complete order lifecycle', async () => {
      // Add to cart
      await request
        .post('/api/v1/cart')
        .set('Authorization', `Bearer ${customerSession.accessToken}`)
        .send({
          productId: testProduct1._id.toString(),
          quantity: 10,
        });

      // Checkout (COD)
      const orderResponse = await request
        .post('/api/v1/orders')
        .set('Authorization', `Bearer ${customerSession.accessToken}`)
        .send({
          paymentMethod: 'COD',
          shippingAddress: validShippingAddress,
        })
        .expect(200);

      const orderId = orderResponse.body.data._id;

      // Verify initial status
      expect(orderResponse.body.data.status).toBe(ORDER_STATUS.CONFIRMED);

      // Fetch orders list
      const ordersListResponse = await request
        .get('/api/v1/orders')
        .set('Authorization', `Bearer ${customerSession.accessToken}`)
        .expect(200);

      expect(Array.isArray(ordersListResponse.body.data)).toBe(true);
      expect(ordersListResponse.body.data).toHaveLength(1);
      expect(ordersListResponse.body.data[0]._id).toBe(orderId);

      // Fetch single order
      const singleOrderResponse = await request
        .get(`/api/v1/orders/${orderId}`)
        .set('Authorization', `Bearer ${customerSession.accessToken}`)
        .expect(200);

      expect(singleOrderResponse.body.data._id).toBe(orderId);
      expect(singleOrderResponse.body.data.status).toBe(ORDER_STATUS.CONFIRMED);
    });
  });
});
