import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import supertest from 'supertest';
import app from '../../src/app.js';
import User from '../../src/modules/user/user.model.js';
import Product from '../../src/modules/product/product.model.js';
import Order from '../../src/modules/order/order.model.js';
import Payment from '../../src/modules/payment/payment.model.js';
import Inventory from '../../src/modules/inventory/inventory.model.js';
import {
  clearDatabase,
  generateTestUser,
  generateTestProduct,
} from '../helpers/testUtils.js';
import { hashPassword } from '../../src/utils/hashPassword.js';
import { USER_STATUS } from '../../src/constants/userStatus.js';
import { ORDER_STATUS } from '../../src/constants/orderStatus.js';
import { PAYMENT_STATUS } from '../../src/constants/paymentStatus.js';
import { ROLES } from '../../src/constants/roles.js';

const request = supertest(app);

describe('Order Flow - End-to-End Tests', () => {
  let customer;
  let vendor;
  let admin;
  let customerToken;
  let vendorToken;
  let adminToken;
  let testProducts = [];

  beforeEach(async () => {
    await clearDatabase();

    // Create test users
    const hashedPassword = await hashPassword('Test@1234');

    customer = await User.create({
      ...generateTestUser({
        email: 'customer@test.com',
        role: ROLES.B2B_CUSTOMER,
      }),
      password: hashedPassword,
      status: USER_STATUS.ACTIVE,
    });

    vendor = await User.create({
      ...generateTestUser({
        email: 'vendor@test.com',
        role: ROLES.VENDOR,
      }),
      password: hashedPassword,
      status: USER_STATUS.ACTIVE,
    });

    admin = await User.create({
      ...generateTestUser({
        email: 'admin@test.com',
        role: ROLES.ADMIN,
      }),
      password: hashedPassword,
      status: USER_STATUS.ACTIVE,
    });

    // Login all users
    const customerLogin = await request.post('/api/auth/login').send({
      identifier: customer.email,
      password: 'Test@1234',
    });
    customerToken = customerLogin.body.data.accessToken;

    const vendorLogin = await request.post('/api/auth/login').send({
      identifier: vendor.email,
      password: 'Test@1234',
    });
    vendorToken = vendorLogin.body.data.accessToken;

    const adminLogin = await request.post('/api/auth/login').send({
      identifier: admin.email,
      password: 'Test@1234',
    });
    adminToken = adminLogin.body.data.accessToken;

    // Create test products
    for (let i = 0; i < 3; i++) {
      const product = await Product.create({
        ...generateTestProduct({
          name: `Test Product ${i + 1}`,
          sku: `TEST-SKU-${i + 1}`,
          price: 1000 + i * 100,
          stock: 100,
          moq: 10,
          vendorId: vendor._id,
        }),
      });

      await Inventory.create({
        productId: product._id,
        vendorId: vendor._id,
        stock: 100,
        reservedStock: 0,
      });

      testProducts.push(product);
    }
  });

  describe('Complete Order Journey', () => {
    it('should complete full order flow: create -> pay -> fulfill -> deliver', async () => {
      // Step 1: Customer creates an order
      const orderData = {
        items: [
          {
            productId: testProducts[0]._id.toString(),
            quantity: 20,
            price: testProducts[0].price,
          },
          {
            productId: testProducts[1]._id.toString(),
            quantity: 15,
            price: testProducts[1].price,
          },
        ],
        shippingAddress: {
          street: '123 Test St',
          city: 'Test City',
          state: 'TS',
          pincode: '123456',
        },
      };

      const createOrderResponse = await request
        .post('/api/orders')
        .set('Authorization', `Bearer ${customerToken}`)
        .send(orderData)
        .expect(201);

      expect(createOrderResponse.body.success).toBe(true);
      const orderId = createOrderResponse.body.data._id;
      expect(orderId).toBeDefined();

      // Verify order created with correct status
      let order = await Order.findById(orderId);
      expect(order.status).toBe(ORDER_STATUS.PENDING);
      expect(order.items).toHaveLength(2);

      // Step 2: Create payment order
      const paymentOrderResponse = await request
        .post('/api/payments/create-order')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          orderId: orderId,
          amount: order.totalAmount,
        })
        .expect(200);

      expect(paymentOrderResponse.body.data).toHaveProperty('razorpayOrderId');
      const razorpayOrderId = paymentOrderResponse.body.data.razorpayOrderId;

      // Step 3: Verify payment (simulate successful payment)
      const verifyPaymentResponse = await request
        .post('/api/payments/verify')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          razorpay_order_id: razorpayOrderId,
          razorpay_payment_id: 'pay_test_success',
          razorpay_signature: 'valid_signature',
        })
        .expect(200);

      expect(verifyPaymentResponse.body.data.status).toBe(PAYMENT_STATUS.SUCCESS);

      // Verify order status updated to PAID
      order = await Order.findById(orderId);
      expect(order.status).toBe(ORDER_STATUS.PAID);
      expect(order.paymentStatus).toBe(PAYMENT_STATUS.SUCCESS);

      // Step 4: Vendor confirms order
      const confirmOrderResponse = await request
        .patch(`/api/orders/${orderId}/confirm`)
        .set('Authorization', `Bearer ${vendorToken}`)
        .expect(200);

      expect(confirmOrderResponse.body.success).toBe(true);

      order = await Order.findById(orderId);
      expect(order.status).toBe(ORDER_STATUS.CONFIRMED);

      // Step 5: Vendor marks as processing
      await request
        .patch(`/api/orders/${orderId}/process`)
        .set('Authorization', `Bearer ${vendorToken}`)
        .expect(200);

      order = await Order.findById(orderId);
      expect(order.status).toBe(ORDER_STATUS.PROCESSING);

      // Step 6: Vendor ships the order
      const shipOrderResponse = await request
        .patch(`/api/orders/${orderId}/ship`)
        .set('Authorization', `Bearer ${vendorToken}`)
        .send({
          trackingNumber: 'TRACK123456',
          carrier: 'Test Courier',
        })
        .expect(200);

      expect(shipOrderResponse.body.success).toBe(true);

      order = await Order.findById(orderId);
      expect(order.status).toBe(ORDER_STATUS.SHIPPED);
      expect(order.trackingNumber).toBe('TRACK123456');

      // Step 7: Order delivered
      await request
        .patch(`/api/orders/${orderId}/deliver`)
        .set('Authorization', `Bearer ${vendorToken}`)
        .expect(200);

      order = await Order.findById(orderId);
      expect(order.status).toBe(ORDER_STATUS.DELIVERED);
      expect(order.deliveredAt).toBeDefined();

      // Verify inventory was updated
      for (const item of order.items) {
        const inventory = await Inventory.findOne({ productId: item.productId });
        expect(inventory.stock).toBeLessThan(100);
      }
    });

    it('should handle order cancellation before payment', async () => {
      // Create order
      const orderResponse = await request
        .post('/api/orders')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          items: [
            {
              productId: testProducts[0]._id.toString(),
              quantity: 10,
              price: testProducts[0].price,
            },
          ],
          shippingAddress: {
            street: '123 Test St',
            city: 'Test City',
            state: 'TS',
            pincode: '123456',
          },
        })
        .expect(201);

      const orderId = orderResponse.body.data._id;

      // Cancel order
      const cancelResponse = await request
        .patch(`/api/orders/${orderId}/cancel`)
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ reason: 'Changed mind' })
        .expect(200);

      expect(cancelResponse.body.success).toBe(true);

      const order = await Order.findById(orderId);
      expect(order.status).toBe(ORDER_STATUS.CANCELLED);
      expect(order.cancellationReason).toBe('Changed mind');
    });

    it('should handle order cancellation with refund after payment', async () => {
      // Create and pay for order
      const orderResponse = await request
        .post('/api/orders')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          items: [
            {
              productId: testProducts[0]._id.toString(),
              quantity: 10,
              price: testProducts[0].price,
            },
          ],
          shippingAddress: {
            street: '123 Test St',
            city: 'Test City',
            state: 'TS',
            pincode: '123456',
          },
        })
        .expect(201);

      const orderId = orderResponse.body.data._id;
      const order = await Order.findById(orderId);

      // Create and verify payment
      const paymentOrderResponse = await request
        .post('/api/payments/create-order')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          orderId: orderId,
          amount: order.totalAmount,
        })
        .expect(200);

      await request
        .post('/api/payments/verify')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          razorpay_order_id: paymentOrderResponse.body.data.razorpayOrderId,
          razorpay_payment_id: 'pay_cancel_test',
          razorpay_signature: 'valid_signature',
        })
        .expect(200);

      // Cancel order (should trigger refund)
      const cancelResponse = await request
        .patch(`/api/orders/${orderId}/cancel`)
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ reason: 'Need refund' })
        .expect(200);

      expect(cancelResponse.body.success).toBe(true);

      const updatedOrder = await Order.findById(orderId);
      expect(updatedOrder.status).toBe(ORDER_STATUS.CANCELLED);

      // Verify refund initiated
      const payment = await Payment.findOne({ orderId: orderId });
      expect(payment.refundAmount).toBeGreaterThan(0);
    });

    it('should reserve inventory when order is created', async () => {
      const product = testProducts[0];
      const initialInventory = await Inventory.findOne({ productId: product._id });
      const initialStock = initialInventory.stock;
      const orderQuantity = 20;

      await request
        .post('/api/orders')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          items: [
            {
              productId: product._id.toString(),
              quantity: orderQuantity,
              price: product.price,
            },
          ],
          shippingAddress: {
            street: '123 Test St',
            city: 'Test City',
            state: 'TS',
            pincode: '123456',
          },
        })
        .expect(201);

      const updatedInventory = await Inventory.findOne({ productId: product._id });
      expect(updatedInventory.reservedStock).toBe(orderQuantity);
      expect(updatedInventory.stock).toBe(initialStock);
    });

    it('should release inventory when order is cancelled', async () => {
      const product = testProducts[0];
      const orderQuantity = 20;

      const orderResponse = await request
        .post('/api/orders')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          items: [
            {
              productId: product._id.toString(),
              quantity: orderQuantity,
              price: product.price,
            },
          ],
          shippingAddress: {
            street: '123 Test St',
            city: 'Test City',
            state: 'TS',
            pincode: '123456',
          },
        })
        .expect(201);

      const orderId = orderResponse.body.data._id;

      // Cancel order
      await request
        .patch(`/api/orders/${orderId}/cancel`)
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ reason: 'Cancel test' })
        .expect(200);

      const inventory = await Inventory.findOne({ productId: product._id });
      expect(inventory.reservedStock).toBe(0);
    });

    it('should deduct inventory when order is confirmed', async () => {
      const product = testProducts[0];
      const initialInventory = await Inventory.findOne({ productId: product._id });
      const initialStock = initialInventory.stock;
      const orderQuantity = 20;

      // Create order
      const orderResponse = await request
        .post('/api/orders')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          items: [
            {
              productId: product._id.toString(),
              quantity: orderQuantity,
              price: product.price,
            },
          ],
          shippingAddress: {
            street: '123 Test St',
            city: 'Test City',
            state: 'TS',
            pincode: '123456',
          },
        })
        .expect(201);

      const orderId = orderResponse.body.data._id;

      // Pay for order
      const order = await Order.findById(orderId);
      const paymentResponse = await request
        .post('/api/payments/create-order')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          orderId: orderId,
          amount: order.totalAmount,
        })
        .expect(200);

      await request
        .post('/api/payments/verify')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          razorpay_order_id: paymentResponse.body.data.razorpayOrderId,
          razorpay_payment_id: 'pay_confirm_test',
          razorpay_signature: 'valid_signature',
        })
        .expect(200);

      // Confirm order
      await request
        .patch(`/api/orders/${orderId}/confirm`)
        .set('Authorization', `Bearer ${vendorToken}`)
        .expect(200);

      const updatedInventory = await Inventory.findOne({ productId: product._id });
      expect(updatedInventory.stock).toBe(initialStock - orderQuantity);
      expect(updatedInventory.reservedStock).toBe(0);
    });
  });

  describe('Order Validation & Edge Cases', () => {
    it('should reject order with insufficient stock', async () => {
      const response = await request
        .post('/api/orders')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          items: [
            {
              productId: testProducts[0]._id.toString(),
              quantity: 1000, // More than available stock
              price: testProducts[0].price,
            },
          ],
          shippingAddress: {
            street: '123 Test St',
            city: 'Test City',
            state: 'TS',
            pincode: '123456',
          },
        })
        .expect(400);

      expect(response.body.message).toContain('Insufficient stock');
    });

    it('should reject order below minimum order quantity (MOQ)', async () => {
      const response = await request
        .post('/api/orders')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          items: [
            {
              productId: testProducts[0]._id.toString(),
              quantity: 5, // Below MOQ of 10
              price: testProducts[0].price,
            },
          ],
          shippingAddress: {
            street: '123 Test St',
            city: 'Test City',
            state: 'TS',
            pincode: '123456',
          },
        })
        .expect(400);

      expect(response.body.message).toContain('MOQ');
    });

    it('should reject order with invalid product', async () => {
      const fakeProductId = '507f1f77bcf86cd799439011';

      const response = await request
        .post('/api/orders')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          items: [
            {
              productId: fakeProductId,
              quantity: 10,
              price: 1000,
            },
          ],
          shippingAddress: {
            street: '123 Test St',
            city: 'Test City',
            state: 'TS',
            pincode: '123456',
          },
        })
        .expect(404);

      expect(response.body.message).toContain('Product not found');
    });

    it('should reject order with price mismatch', async () => {
      const response = await request
        .post('/api/orders')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          items: [
            {
              productId: testProducts[0]._id.toString(),
              quantity: 10,
              price: 1, // Incorrect price
            },
          ],
          shippingAddress: {
            street: '123 Test St',
            city: 'Test City',
            state: 'TS',
            pincode: '123456',
          },
        })
        .expect(400);

      expect(response.body.message).toContain('price');
    });

    it('should calculate total amount correctly', async () => {
      const orderResponse = await request
        .post('/api/orders')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          items: [
            {
              productId: testProducts[0]._id.toString(),
              quantity: 20,
              price: testProducts[0].price,
            },
            {
              productId: testProducts[1]._id.toString(),
              quantity: 15,
              price: testProducts[1].price,
            },
          ],
          shippingAddress: {
            street: '123 Test St',
            city: 'Test City',
            state: 'TS',
            pincode: '123456',
          },
        })
        .expect(201);

      const order = await Order.findById(orderResponse.body.data._id);
      const expectedTotal =
        testProducts[0].price * 20 + testProducts[1].price * 15;

      expect(order.totalAmount).toBe(expectedTotal);
    });

    it('should handle concurrent order creation for same product', async () => {
      const orderData = {
        items: [
          {
            productId: testProducts[0]._id.toString(),
            quantity: 60, // Each order takes 60 out of 100 stock
            price: testProducts[0].price,
          },
        ],
        shippingAddress: {
          street: '123 Test St',
          city: 'Test City',
          state: 'TS',
          pincode: '123456',
        },
      };

      // Attempt two concurrent orders
      const [response1, response2] = await Promise.allSettled([
        request
          .post('/api/orders')
          .set('Authorization', `Bearer ${customerToken}`)
          .send(orderData),
        request
          .post('/api/orders')
          .set('Authorization', `Bearer ${customerToken}`)
          .send(orderData),
      ]);

      // Only one should succeed due to insufficient stock
      const successCount = [response1, response2].filter(
        (r) => r.value?.status === 201
      ).length;

      expect(successCount).toBe(1);
    });

    it('should reject empty order', async () => {
      const response = await request
        .post('/api/orders')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          items: [],
          shippingAddress: {
            street: '123 Test St',
            city: 'Test City',
            state: 'TS',
            pincode: '123456',
          },
        })
        .expect(400);

      expect(response.body.message).toContain('items');
    });

    it('should reject order without shipping address', async () => {
      const response = await request
        .post('/api/orders')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          items: [
            {
              productId: testProducts[0]._id.toString(),
              quantity: 10,
              price: testProducts[0].price,
            },
          ],
        })
        .expect(400);

      expect(response.body.message).toContain('address');
    });
  });

  describe('Order Access Control', () => {
    let customerOrder;

    beforeEach(async () => {
      const orderResponse = await request
        .post('/api/orders')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          items: [
            {
              productId: testProducts[0]._id.toString(),
              quantity: 10,
              price: testProducts[0].price,
            },
          ],
          shippingAddress: {
            street: '123 Test St',
            city: 'Test City',
            state: 'TS',
            pincode: '123456',
          },
        });

      customerOrder = orderResponse.body.data;
    });

    it('should allow customer to view own orders', async () => {
      const response = await request
        .get(`/api/orders/${customerOrder._id}`)
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(200);

      expect(response.body.data._id).toBe(customerOrder._id);
    });

    it('should allow vendor to view orders for their products', async () => {
      const response = await request
        .get(`/api/orders/${customerOrder._id}`)
        .set('Authorization', `Bearer ${vendorToken}`)
        .expect(200);

      expect(response.body.data._id).toBe(customerOrder._id);
    });

    it('should allow admin to view all orders', async () => {
      const response = await request
        .get(`/api/orders/${customerOrder._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.data._id).toBe(customerOrder._id);
    });

    it('should reject other customers from viewing orders', async () => {
      // Create another customer
      const otherCustomer = await User.create({
        ...generateTestUser({
          email: 'other@test.com',
          role: ROLES.B2B_CUSTOMER,
        }),
        password: await hashPassword('Test@1234'),
        status: USER_STATUS.ACTIVE,
      });

      const otherLogin = await request.post('/api/auth/login').send({
        identifier: otherCustomer.email,
        password: 'Test@1234',
      });
      const otherToken = otherLogin.body.data.accessToken;

      const response = await request
        .get(`/api/orders/${customerOrder._id}`)
        .set('Authorization', `Bearer ${otherToken}`)
        .expect(403);

      expect(response.body.message).toContain('access');
    });

    it('should allow only customer to cancel their own order', async () => {
      const response = await request
        .patch(`/api/orders/${customerOrder._id}/cancel`)
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ reason: 'Test cancellation' })
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should allow only vendor to ship orders', async () => {
      // Pay for order first
      const order = await Order.findById(customerOrder._id);
      const paymentResponse = await request
        .post('/api/payments/create-order')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          orderId: customerOrder._id,
          amount: order.totalAmount,
        });

      await request
        .post('/api/payments/verify')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          razorpay_order_id: paymentResponse.body.data.razorpayOrderId,
          razorpay_payment_id: 'pay_ship_test',
          razorpay_signature: 'valid_signature',
        });

      await request
        .patch(`/api/orders/${customerOrder._id}/confirm`)
        .set('Authorization', `Bearer ${vendorToken}`);

      // Vendor can ship
      const response = await request
        .patch(`/api/orders/${customerOrder._id}/ship`)
        .set('Authorization', `Bearer ${vendorToken}`)
        .send({
          trackingNumber: 'TRACK123',
          carrier: 'Test Courier',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('Order Status Transitions', () => {
    let testOrder;

    beforeEach(async () => {
      const orderResponse = await request
        .post('/api/orders')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          items: [
            {
              productId: testProducts[0]._id.toString(),
              quantity: 10,
              price: testProducts[0].price,
            },
          ],
          shippingAddress: {
            street: '123 Test St',
            city: 'Test City',
            state: 'TS',
            pincode: '123456',
          },
        });

      testOrder = orderResponse.body.data;
    });

    it('should reject invalid status transition', async () => {
      // Try to ship without payment
      const response = await request
        .patch(`/api/orders/${testOrder._id}/ship`)
        .set('Authorization', `Bearer ${vendorToken}`)
        .send({
          trackingNumber: 'TRACK123',
          carrier: 'Test Courier',
        })
        .expect(400);

      expect(response.body.message).toContain('cannot be shipped');
    });

    it('should reject cancellation after shipping', async () => {
      // Complete payment and ship
      const order = await Order.findById(testOrder._id);
      const paymentResponse = await request
        .post('/api/payments/create-order')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          orderId: testOrder._id,
          amount: order.totalAmount,
        });

      await request.post('/api/payments/verify').set('Authorization', `Bearer ${customerToken}`).send({
        razorpay_order_id: paymentResponse.body.data.razorpayOrderId,
        razorpay_payment_id: 'pay_test',
        razorpay_signature: 'valid_signature',
      });

      await request
        .patch(`/api/orders/${testOrder._id}/confirm`)
        .set('Authorization', `Bearer ${vendorToken}`);

      await request
        .patch(`/api/orders/${testOrder._id}/ship`)
        .set('Authorization', `Bearer ${vendorToken}`)
        .send({
          trackingNumber: 'TRACK123',
          carrier: 'Test Courier',
        });

      // Try to cancel shipped order
      const response = await request
        .patch(`/api/orders/${testOrder._id}/cancel`)
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ reason: 'Cancel after ship' })
        .expect(400);

      expect(response.body.message).toContain('cannot be cancelled');
    });
  });
});
