import { afterEach, beforeEach, describe, expect, it } from '@jest/globals';
import supertest from 'supertest';
import app from '../../src/app.js';
import { clearDatabase } from '../helpers/testUtils.js';
import { seedActiveUser } from '../helpers/integrationFixtures.js';
import { withAuth } from '../helpers/httpTestHelpers.js';
import { redisClient } from '../../src/config/redis.js';
import { ROLES } from '../../src/constants/roles.js';
import Order from '../../src/modules/order/order.model.js';
import Product from '../../src/modules/product/product.model.js';
import Category from '../../src/modules/category/category.model.js';
import Warehouse from '../../src/modules/warehouse/warehouse.model.js';
import Inventory from '../../src/modules/inventory/inventory.model.js';
import ReturnRequest from '../../src/modules/return/return.model.js';
import Refund from '../../src/modules/payment/refund.model.js';

const request = supertest(app);
const address = { name: 'Buyer', phone: '9876543210', addressLine: '1 Test Road', city: 'Bengaluru', state: 'KA', pincode: '560001' };

describe('Return workflow', () => {
  let customer; let other; let admin; let superAdmin; let supplier; let delivery; let order; let product; let inventory;
  beforeEach(async () => {
    await clearDatabase(); await redisClient.flushdb();
    [customer, other, admin, superAdmin, supplier, delivery] = await Promise.all([
      seedActiveUser({ role: ROLES.B2B_CUSTOMER }), seedActiveUser({ role: ROLES.VENDOR }), seedActiveUser({ role: ROLES.ADMIN }), seedActiveUser({ role: ROLES.SUPER_ADMIN }), seedActiveUser({ role: ROLES.SUPPLIER }), seedActiveUser({ role: ROLES.DELIVERY_PARTNER }),
    ]);
    const category = await Category.create({ name: 'Return Test', slug: 'return-test' });
    product = await Product.create({ name: 'Historical Price Product', price: 9999, stock: 10, categoryId: category._id });
    const warehouse = await Warehouse.create({ name: 'Returns Warehouse', capacity: 1000, isActive: true, isDeliveryOrigin: true, location: { address: 'Warehouse Road', coordinates: { latitude: 12.9716, longitude: 77.5946 } } });
    inventory = await Inventory.create({ productId: product._id, warehouseId: warehouse._id, stock: 10 });
    order = await Order.create({ userId: customer.user._id, items: [{ productId: product._id, name: product.name, price: 100, finalPrice: 80, quantity: 5 }], subtotal: 400, taxAmount: 72, totalAmount: 472, paymentMethod: 'COD', paymentStatus: 'PAID', status: 'DELIVERED', address });
  });
  afterEach(async () => { await redisClient.flushdb(); });

  const create = (session = customer, overrides = {}) => withAuth(request.post('/api/v1/returns'), session).set('Idempotency-Key', overrides.idempotencyKey || 'return-key-1234').send({ orderId: order._id, reason: 'DAMAGED', requestedResolution: 'REFUND', idempotencyKey: 'return-key-1234', items: [{ orderItemId: order.items[0]._id, requestedQuantity: 2 }], ...overrides });

  it('creates an item-level return for the owner without restoring stock', async () => {
    const response = await create().expect(200);
    expect(response.body.data.status).toBe('REQUESTED');
    expect(response.body.data.items[0].requestedQuantity).toBe(2);
    expect((await Inventory.findById(inventory._id)).stock).toBe(10);
  });

  it('rejects ineligible orders, excessive quantities and OTHER without details', async () => {
    order.status = 'PENDING'; await order.save(); await create(customer, { idempotencyKey: 'pending-1234' }).expect(409);
    order.status = 'DELIVERED'; await order.save();
    await create(customer, { idempotencyKey: 'excess-1234', items: [{ orderItemId: order.items[0]._id, requestedQuantity: 6 }] }).expect(409);
    await create(customer, { idempotencyKey: 'other-1234', reason: 'OTHER', reasonDetails: '' }).expect(400);
  });

  it('enforces ownership and role isolation', async () => {
    await create(other, { idempotencyKey: 'other-user-1234' }).expect(404);
    await create(supplier, { idempotencyKey: 'supplier-1234' }).expect(403);
    await create(delivery, { idempotencyKey: 'delivery-1234' }).expect(403);
    const created = (await create().expect(200)).body.data;
    await request.get(`/api/v1/returns/${created._id}`).set('Authorization', `Bearer ${other.accessToken}`).expect(403);
    await withAuth(request.post(`/api/v1/returns/${created._id}/approve`), customer).expect(403);
  });

  it('prevents quantities claimed by an existing active return and is idempotent', async () => {
    const first = (await create().expect(200)).body.data;
    const duplicate = (await create().expect(200)).body.data;
    expect(duplicate._id).toBe(first._id);
    await create(customer, { idempotencyKey: 'second-key-1234', items: [{ orderItemId: order.items[0]._id, requestedQuantity: 4 }] }).expect(409);
    expect(await ReturnRequest.countDocuments({ orderId: order._id })).toBe(1);
  });

  it('allows an owner to cancel only while a request is pending', async () => {
    const id = (await create().expect(200)).body.data._id;
    await withAuth(request.post(`/api/v1/returns/${id}/cancel`), customer).expect(200);
    expect((await ReturnRequest.findById(id)).status).toBe('CANCELLED');
    await withAuth(request.post(`/api/v1/returns/${id}/cancel`), customer).expect(409);
  });

  it('runs approval, receiving and inspection with one-time sellable restock', async () => {
    const id = (await create().expect(200)).body.data._id;
    await withAuth(request.post(`/api/v1/returns/${id}/approve`), admin).expect(200);
    expect((await Inventory.findById(inventory._id)).stock).toBe(10);
    let doc = await ReturnRequest.findById(id); expect(doc.pickupLogisticsId).toBeTruthy();
    await withAuth(request.post(`/api/v1/returns/${id}/receive`), admin).send({ items: [{ itemId: doc.items[0]._id, receivedQuantity: 2 }], note: 'Received' }).expect(200);
    doc = await ReturnRequest.findById(id);
    await withAuth(request.post(`/api/v1/returns/${id}/inspect`), superAdmin).send({ resolution: 'REFUND', items: [{ itemId: doc.items[0]._id, acceptedQuantity: 2, condition: 'SELLABLE', notes: 'Good' }] }).expect(200);
    expect((await Inventory.findById(inventory._id)).stock).toBe(12);
    await withAuth(request.post(`/api/v1/returns/${id}/inspect`), superAdmin).send({ resolution: 'REFUND', items: [{ itemId: doc.items[0]._id, acceptedQuantity: 2, condition: 'SELLABLE' }] }).expect(409);
    expect((await Inventory.findById(inventory._id)).stock).toBe(12);
  });

  it('server-calculates a partial COD refund from historical line value', async () => {
    const id = (await create().expect(200)).body.data._id;
    await withAuth(request.post(`/api/v1/returns/${id}/approve`), admin).expect(200); let doc = await ReturnRequest.findById(id);
    await withAuth(request.post(`/api/v1/returns/${id}/receive`), admin).send({ items: [{ itemId: doc.items[0]._id, receivedQuantity: 2 }] }).expect(200); doc = await ReturnRequest.findById(id);
    await withAuth(request.post(`/api/v1/returns/${id}/inspect`), admin).send({ resolution: 'REFUND', items: [{ itemId: doc.items[0]._id, acceptedQuantity: 2, condition: 'DAMAGED' }] }).expect(200);
    await withAuth(request.post(`/api/v1/returns/${id}/refund`), superAdmin).send({ amount: 999999 }).expect(200);
    const refund = await Refund.findOne({ returnRequestId: id });
    expect(refund.amount).toBe(188.8);
    expect(refund.status).toBe('MANUAL_REFUND_REQUIRED');
    expect(await Refund.countDocuments({ returnRequestId: id })).toBe(1);
  });

  it('creates one stock-backed replacement order idempotently', async () => {
    const id = (await create(customer, { requestedResolution: 'REPLACEMENT' }).expect(200)).body.data._id;
    await withAuth(request.post(`/api/v1/returns/${id}/approve`), admin).expect(200); let doc = await ReturnRequest.findById(id);
    await withAuth(request.post(`/api/v1/returns/${id}/receive`), admin).send({ items: [{ itemId: doc.items[0]._id, receivedQuantity: 2 }] }).expect(200); doc = await ReturnRequest.findById(id);
    await withAuth(request.post(`/api/v1/returns/${id}/inspect`), admin).send({ resolution: 'REPLACEMENT', items: [{ itemId: doc.items[0]._id, acceptedQuantity: 2, condition: 'DAMAGED' }] }).expect(200);
    await withAuth(request.post(`/api/v1/returns/${id}/replacement`), superAdmin).expect(200);
    doc = await ReturnRequest.findById(id); const replacementId = doc.replacementOrderId;
    expect(replacementId).toBeTruthy(); expect((await Inventory.findById(inventory._id)).stock).toBe(8);
    await withAuth(request.post(`/api/v1/returns/${id}/replacement`), superAdmin).expect(200);
    expect(await Order.countDocuments({ returnRequestId: id })).toBe(1);
  });
});
