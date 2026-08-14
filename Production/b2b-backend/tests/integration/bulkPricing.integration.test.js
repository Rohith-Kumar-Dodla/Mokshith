import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import supertest from 'supertest';
import app from '../../src/app.js';
import Product from '../../src/modules/product/product.model.js';
import Inventory from '../../src/modules/inventory/inventory.model.js';
import {
  clearDatabase,
} from '../helpers/testUtils.js';
import {
  seedCheckoutFixture,
} from '../helpers/integrationFixtures.js';
import { calculateLinePricing } from '../../src/utils/bulkPricing.utils.js';
import { redisClient } from '../../src/config/redis.js';

const request = supertest(app);

describe('Bulk Pricing - Order Integration', () => {
  let userToken;
  let testCategory;
  let testWarehouse;
  let validShippingAddress;

  beforeEach(async () => {
    await clearDatabase();
    await redisClient.flushdb();

    const checkout = await seedCheckoutFixture({
      email: 'bulkorder@test.com',
      mobile: '9876543299',
    });
    userToken = checkout.accessToken;
    testCategory = checkout.category;
    testWarehouse = checkout.warehouse;
    validShippingAddress = checkout.validShippingAddress;
  });

  afterEach(async () => {
    await redisClient.flushdb();
  });

  async function createBulkProduct(overrides = {}) {
    const product = await Product.create({
      name: 'Bulk Discount Product',
      price: 100,
      stock: 500,
      moq: 1,
      categoryId: testCategory._id,
      bulkPricing: [
        { minQuantity: 5, price: 90 },
        { minQuantity: 10, price: 80 },
        { minQuantity: 20, price: 70 },
      ],
      ...overrides,
    });

    await Inventory.create({
      productId: product._id,
      warehouseId: testWarehouse._id,
      stock: 500,
    });

    return product;
  }

  it('should apply product bulk pricing at order creation (qty 7)', async () => {
    const product = await createBulkProduct();

    const response = await request
      .post('/api/v1/orders')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        paymentMethod: 'COD',
        shippingAddress: validShippingAddress,
        items: [{ productId: product._id.toString(), quantity: 7 }],
      })
      .expect(200);

    const expected = calculateLinePricing(product.toObject(), 7);

    expect(response.body.data.items[0].finalPrice).toBe(90);
    expect(response.body.data.items[0].discountAmount).toBe(70);
    expect(response.body.data.totalAmount).toBeCloseTo(expected.itemTotal * 1.18, 2);
  });

  it('should use highest applicable tier (qty 15)', async () => {
    const product = await createBulkProduct();

    const response = await request
      .post('/api/v1/orders')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        paymentMethod: 'COD',
        shippingAddress: validShippingAddress,
        items: [{ productId: product._id.toString(), quantity: 15 }],
      })
      .expect(200);

    expect(response.body.data.items[0].finalPrice).toBe(80);
  });

  it('should not allow client price manipulation with bulk pricing', async () => {
    const product = await createBulkProduct();

    const response = await request
      .post('/api/v1/orders')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        paymentMethod: 'COD',
        shippingAddress: validShippingAddress,
        items: [
          {
            productId: product._id.toString(),
            quantity: 10,
            price: 1,
          },
        ],
      })
      .expect(200);

    expect(response.body.data.items[0].price).toBe(100);
    expect(response.body.data.items[0].finalPrice).toBe(80);
  });

  it('should charge full price when quantity below bulk threshold', async () => {
    const product = await createBulkProduct();

    const response = await request
      .post('/api/v1/orders')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        paymentMethod: 'COD',
        shippingAddress: validShippingAddress,
        items: [{ productId: product._id.toString(), quantity: 3 }],
      })
      .expect(200);

    expect(response.body.data.items[0].finalPrice).toBe(100);
    expect(response.body.data.items[0].discountAmount).toBe(0);
  });

  it('should use legacy pricing for products without bulk tiers', async () => {
    const product = await Product.create({
      name: 'Legacy Pricing Product',
      price: 1000,
      stock: 100,
      moq: 1,
      categoryId: testCategory._id,
    });

    await Inventory.create({
      productId: product._id,
      warehouseId: testWarehouse._id,
      stock: 100,
    });

    const response = await request
      .post('/api/v1/orders')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        paymentMethod: 'COD',
        shippingAddress: validShippingAddress,
        items: [{ productId: product._id.toString(), quantity: 10 }],
      })
      .expect(200);

    expect(response.body.data.items[0].discountPercent).toBe(10);
    expect(response.body.data.totalAmount).toBe(10620);
  });
});
