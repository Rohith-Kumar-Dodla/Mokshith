import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import supertest from 'supertest';
import app from '../../src/app.js';
import Order from '../../src/modules/order/order.model.js';
import { clearDatabase } from '../helpers/testUtils.js';
import { redisClient } from '../../src/config/redis.js';
import {
  seedSuperAdminUser,
  seedAdminUser,
  seedVendorUser,
  seedDeliveryPartner,
  seedActiveUser,
  seedCategory,
  seedProduct,
  seedPaidOrder,
} from '../helpers/integrationFixtures.js';
import { sessionHeaders } from '../helpers/httpTestHelpers.js';
import { ORDER_STATUS } from '../../src/constants/orderStatus.js';
import { PAYMENT_STATUS } from '../../src/constants/paymentStatus.js';
import { ROLES } from '../../src/constants/roles.js';
import { getBusinessDayRange } from '../../src/modules/procurement/procurementDemand.service.js';

const request = supertest(app);

describe('Super Admin procurement demand - Phase 3.1', () => {
  let superAdmin;
  let admin;
  let vendor;
  let delivery;
  let customer;
  let oil;
  let rice;
  let sugar;

  const demandDate = '2026-08-17';
  const { start, end } = getBusinessDayRange(demandDate);
  const inDay = new Date(start.getTime() + 10 * 60 * 60 * 1000);
  const beforeDay = new Date(start.getTime() - 60 * 1000);
  const afterDay = new Date(end.getTime());

  beforeEach(async () => {
    await clearDatabase();
    await redisClient.flushdb();
    superAdmin = await seedSuperAdminUser();
    admin = await seedAdminUser();
    vendor = await seedVendorUser();
    delivery = await seedDeliveryPartner();
    customer = await seedActiveUser({ email: 'vendor-buyer@example.com' });
    const category = await seedCategory();
    oil = await seedProduct(category._id, { name: 'Sunflower Oil', moq: 1, price: 150 });
    rice = await seedProduct(category._id, { name: 'Rice', moq: 1, price: 80 });
    sugar = await seedProduct(category._id, { name: 'Sugar', moq: 1, price: 60 });
  });

  afterEach(async () => {
    await redisClient.flushdb();
  });

  const asSuperAdmin = (builder) => builder.set(sessionHeaders(superAdmin));

  const item = (product, quantity) => ({
    productId: product._id,
    name: product.name,
    price: product.price,
    quantity,
  });

  const createDemandOrder = async ({
    items,
    status = ORDER_STATUS.CONFIRMED,
    createdAt = inDay,
    paymentStatus = PAYMENT_STATUS.PENDING,
  }) => seedPaidOrder(customer.user._id, {
    items,
    totalAmount: items.reduce((sum, row) => sum + row.price * row.quantity, 0),
    status,
    paymentStatus,
    paymentMethod: 'COD',
    createdAt,
  });

  const getDemand = (date = demandDate) =>
    asSuperAdmin(request.get('/api/v1/super-admin/procurement/demand').query({ date }));

  it('aggregates qualifying order quantities by product ID for the selected day', async () => {
    await createDemandOrder({ items: [item(oil, 20), item(rice, 50)] });
    await createDemandOrder({ items: [item(oil, 30), item(sugar, 20)] });
    await createDemandOrder({ items: [item(oil, 50), item(rice, 100)] });

    const response = await getDemand().expect(200);
    const data = response.body.data;

    expect(data.date).toBe(demandDate);
    expect(data.orderCount).toBe(3);
    expect(data.productCount).toBe(3);
    expect(data.products.map((row) => row.productName)).toEqual(['Rice', 'Sugar', 'Sunflower Oil']);

    const byName = Object.fromEntries(data.products.map((row) => [row.productName, row]));
    expect(byName['Sunflower Oil'].requiredQuantity).toBe(100);
    expect(byName['Sunflower Oil'].orderCount).toBe(3);
    expect(byName.Rice.requiredQuantity).toBe(150);
    expect(byName.Rice.orderCount).toBe(2);
    expect(byName.Sugar.requiredQuantity).toBe(20);
    expect(byName.Sugar.orderCount).toBe(1);

    expect(data.products.every((row) => row.currentSupplierPrice === undefined)).toBe(true);
    expect(data.products.every((row) => row.estimatedCost === undefined)).toBe(true);
    expect(data).not.toHaveProperty('selectedSupplierId');
  });

  it('sums duplicate product lines in the same order', async () => {
    await createDemandOrder({ items: [item(oil, 20), item(oil, 5)] });
    const data = (await getDemand().expect(200)).body.data;
    expect(data.orderCount).toBe(1);
    expect(data.products).toHaveLength(1);
    expect(data.products[0].requiredQuantity).toBe(25);
    expect(data.products[0].orderCount).toBe(1);
  });

  it('excludes cancelled, rejected, unpaid, and failed orders', async () => {
    await createDemandOrder({ items: [item(oil, 10)], status: ORDER_STATUS.CONFIRMED });
    await createDemandOrder({ items: [item(oil, 99)], status: ORDER_STATUS.CANCELLED });
    await createDemandOrder({ items: [item(oil, 99)], status: ORDER_STATUS.REJECTED });
    await createDemandOrder({ items: [item(oil, 99)], status: ORDER_STATUS.FAILED });
    await createDemandOrder({
      items: [item(oil, 99)],
      status: ORDER_STATUS.PENDING_PAYMENT,
      paymentStatus: PAYMENT_STATUS.PENDING,
    });
    await createDemandOrder({ items: [item(oil, 99)], status: ORDER_STATUS.CREATED });
    await createDemandOrder({ items: [item(oil, 99)], status: ORDER_STATUS.RETURNED });
    await createDemandOrder({ items: [item(oil, 99)], status: ORDER_STATUS.REFUNDED });

    const data = (await getDemand().expect(200)).body.data;
    expect(data.orderCount).toBe(1);
    expect(data.products[0].requiredQuantity).toBe(10);
  });

  it('does not include orders outside the selected business day', async () => {
    await createDemandOrder({ items: [item(oil, 10)], createdAt: inDay });
    await createDemandOrder({ items: [item(oil, 99)], createdAt: beforeDay });
    await createDemandOrder({ items: [item(oil, 99)], createdAt: afterDay });

    const data = (await getDemand().expect(200)).body.data;
    expect(data.orderCount).toBe(1);
    expect(data.products[0].requiredQuantity).toBe(10);
  });

  it('returns an empty demand payload when there are no qualifying orders', async () => {
    const data = (await getDemand().expect(200)).body.data;
    expect(data.orderCount).toBe(0);
    expect(data.productCount).toBe(0);
    expect(data.products).toEqual([]);
  });

  it('does not mutate existing orders while aggregating', async () => {
    const order = await createDemandOrder({ items: [item(oil, 20)] });
    const before = await Order.findById(order._id).lean();
    await getDemand().expect(200);
    const after = await Order.findById(order._id).lean();
    expect(after.status).toBe(before.status);
    expect(after.items[0].quantity).toBe(before.items[0].quantity);
    expect(after.totalAmount).toBe(before.totalAmount);
    expect(after.updatedAt.toISOString()).toBe(before.updatedAt.toISOString());
  });

  it('rejects an invalid date', async () => {
    const response = await getDemand('17-08-2026').expect(400);
    expect(response.body.success).toBe(false);
  });

  it('denies Admin, Vendor, Delivery Partner, Supplier role, and unauthenticated access', async () => {
    const path = '/api/v1/super-admin/procurement/demand';
    const supplierUser = await seedActiveUser({
      role: ROLES.SUPPLIER,
      email: 'supplier-role@example.com',
    });

    await request.get(path).query({ date: demandDate }).set(sessionHeaders(admin)).expect(403);
    await request.get(path).query({ date: demandDate }).set(sessionHeaders(vendor)).expect(403);
    await request.get(path).query({ date: demandDate }).set(sessionHeaders(delivery)).expect(403);
    await request.get(path).query({ date: demandDate }).set(sessionHeaders(supplierUser)).expect(403);
    await request.get(path).query({ date: demandDate }).expect(401);
  });
});
