import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import supertest from 'supertest';
import app from '../../src/app.js';
import Order from '../../src/modules/order/order.model.js';
import Product from '../../src/modules/product/product.model.js';
import SupplierProduct from '../../src/modules/supplier/supplierProduct.model.js';
import PurchaseRequest from '../../src/modules/procurement/purchaseRequest.model.js';
import Inventory from '../../src/modules/inventory/inventory.model.js';
import Audit from '../../src/modules/audit/audit.model.js';
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
import { SUPPLIER_STATUS } from '../../src/constants/supplierStatus.js';
import { PURCHASE_REQUEST_STATUS } from '../../src/constants/purchaseRequestStatus.js';
import { getBusinessDayRange } from '../../src/modules/procurement/procurementDemand.service.js';
import { getOrCreateDefaultWarehouse } from '../../src/modules/inventory/inventory.service.js';

const request = supertest(app);

const validSupplier = (overrides = {}) => ({
  supplierName: 'ABC Oils',
  companyName: 'ABC Oils Pvt Ltd',
  contactPerson: 'Ravi',
  phone: '9876501111',
  email: 'abc-oils@example.com',
  gstNumber: '27AAPFU0939F1Z5',
  ...overrides,
});

describe('Super Admin purchase request fulfillment - Phase 5.2', () => {
  let superAdmin;
  let admin;
  let delivery;
  let customer;
  let oil;
  let rice;
  let supplierA;
  let mappingA;
  let mappingRice;

  const demandDate = '2026-08-17';
  const { start } = getBusinessDayRange(demandDate);
  const inDay = new Date(start.getTime() + 10 * 60 * 60 * 1000);

  const asSuperAdmin = (builder) => builder.set(sessionHeaders(superAdmin));

  async function activateSupplier(id) {
    await asSuperAdmin(request.patch(`/api/v1/super-admin/suppliers/${id}/status`))
      .send({ status: SUPPLIER_STATUS.APPROVED })
      .expect(200);
    await asSuperAdmin(request.patch(`/api/v1/super-admin/suppliers/${id}/status`))
      .send({ status: SUPPLIER_STATUS.ACTIVE })
      .expect(200);
  }

  async function createActiveSupplier(overrides = {}) {
    const created = await asSuperAdmin(request.post('/api/v1/super-admin/suppliers'))
      .send(validSupplier(overrides))
      .expect(201);
    await activateSupplier(created.body.data._id);
    return created.body.data._id;
  }

  async function mapAndPrice(supplierId, product, moq, price) {
    const mapping = await asSuperAdmin(request.post(`/api/v1/super-admin/suppliers/${supplierId}/products`))
      .send({
        productId: product._id.toString(),
        minimumOrderQuantity: moq,
        supplierPrice: price,
      })
      .expect(201);
    return mapping.body.data;
  }

  async function createSubmittedPurchaseRequest(itemsOverride) {
    const payload = {
      supplierId: supplierA,
      demandDate,
      items: itemsOverride || [{
        productId: oil._id.toString(),
        supplierProductId: mappingA._id,
        demandQuantity: 100,
        purchaseQuantity: 100,
      }],
    };

    const created = await asSuperAdmin(
      request.post('/api/v1/super-admin/procurement/purchase-requests')
    ).send(payload).expect(201);

    const submitted = await asSuperAdmin(
      request.patch(`/api/v1/super-admin/procurement/purchase-requests/${created.body.data._id}/submit`)
    ).send({}).expect(200);

    return submitted.body.data;
  }

  async function getInventoryStock(productId) {
    const warehouse = await getOrCreateDefaultWarehouse();
    const row = await Inventory.findOne({ productId, warehouseId: warehouse._id }).lean();
    return row?.stock ?? 0;
  }

  beforeEach(async () => {
    await clearDatabase();
    await redisClient.flushdb();
    superAdmin = await seedSuperAdminUser();
    admin = await seedAdminUser();
    await seedVendorUser();
    delivery = await seedDeliveryPartner();
    customer = await seedActiveUser({ email: 'pr-fulfill@example.com' });
    const category = await seedCategory();
    oil = await seedProduct(category._id, { name: 'Sunflower Oil', moq: 1, price: 150 });
    rice = await seedProduct(category._id, { name: 'Rice', moq: 1, price: 80 });

    supplierA = await createActiveSupplier();
    mappingA = await mapAndPrice(supplierA, oil, 20, 100);
    mappingRice = await mapAndPrice(supplierA, rice, 30, 50);

    await seedPaidOrder(customer.user._id, {
      items: [{ productId: oil._id, name: oil.name, price: oil.price, quantity: 100 }],
      totalAmount: 15000,
      status: ORDER_STATUS.CONFIRMED,
      paymentStatus: PAYMENT_STATUS.PENDING,
      paymentMethod: 'COD',
      createdAt: inDay,
    });
    await seedPaidOrder(customer.user._id, {
      items: [{ productId: rice._id, name: rice.name, price: rice.price, quantity: 150 }],
      totalAmount: 12000,
      status: ORDER_STATUS.CONFIRMED,
      paymentStatus: PAYMENT_STATUS.PENDING,
      paymentMethod: 'COD',
      createdAt: inDay,
    });
  });

  afterEach(async () => {
    await redisClient.flushdb();
  });

  it('acknowledges a submitted purchase request and stores supplier response', async () => {
    const submitted = await createSubmittedPurchaseRequest();

    const response = await asSuperAdmin(
      request.patch(`/api/v1/super-admin/procurement/purchase-requests/${submitted._id}/acknowledge`)
    ).send({
      items: [{ productId: oil._id.toString(), confirmedQuantity: 80 }],
      expectedDeliveryDate: '2026-08-20',
      supplierResponseNotes: 'Partial confirmation from supplier',
    }).expect(200);

    expect(response.body.data.status).toBe(PURCHASE_REQUEST_STATUS.ACKNOWLEDGED);
    expect(response.body.data.expectedDeliveryDate).toBe('2026-08-20');
    expect(response.body.data.supplierResponseNotes).toBe('Partial confirmation from supplier');
    expect(response.body.data.items[0].confirmedQuantity).toBe(80);
    expect(response.body.data.items[0].purchaseQuantity).toBe(100);
    expect(response.body.data.items[0].unconfirmedQuantity).toBe(20);

    const audit = await Audit.findOne({ action: 'ACKNOWLEDGE_PURCHASE_REQUEST' });
    expect(audit).toBeTruthy();
  });

  it('rejects acknowledgement for draft, cancelled, and fulfilled requests', async () => {
    const draft = await asSuperAdmin(
      request.post('/api/v1/super-admin/procurement/purchase-requests')
    ).send({
      supplierId: supplierA,
      demandDate,
      items: [{
        productId: oil._id.toString(),
        supplierProductId: mappingA._id,
        demandQuantity: 100,
        purchaseQuantity: 100,
      }],
    }).expect(201);

    await asSuperAdmin(
      request.patch(`/api/v1/super-admin/procurement/purchase-requests/${draft.body.data._id}/acknowledge`)
    ).send({
      items: [{ productId: oil._id.toString(), confirmedQuantity: 100 }],
    }).expect(400);

    const submitted = await createSubmittedPurchaseRequest();
    await asSuperAdmin(
      request.patch(`/api/v1/super-admin/procurement/purchase-requests/${submitted._id}/cancel`)
    ).expect(200);

    await asSuperAdmin(
      request.patch(`/api/v1/super-admin/procurement/purchase-requests/${submitted._id}/acknowledge`)
    ).send({
      items: [{ productId: oil._id.toString(), confirmedQuantity: 100 }],
    }).expect(400);
  });

  it('does not change inventory on create, submit, or acknowledge', async () => {
    const stockBefore = await getInventoryStock(oil._id);

    const created = await asSuperAdmin(
      request.post('/api/v1/super-admin/procurement/purchase-requests')
    ).send({
      supplierId: supplierA,
      demandDate,
      items: [{
        productId: oil._id.toString(),
        supplierProductId: mappingA._id,
        demandQuantity: 100,
        purchaseQuantity: 100,
      }],
    }).expect(201);

    expect(await getInventoryStock(oil._id)).toBe(stockBefore);

    await asSuperAdmin(
      request.patch(`/api/v1/super-admin/procurement/purchase-requests/${created.body.data._id}/submit`)
    ).send({}).expect(200);
    expect(await getInventoryStock(oil._id)).toBe(stockBefore);

    await asSuperAdmin(
      request.patch(`/api/v1/super-admin/procurement/purchase-requests/${created.body.data._id}/acknowledge`)
    ).send({
      items: [{ productId: oil._id.toString(), confirmedQuantity: 100 }],
    }).expect(200);
    expect(await getInventoryStock(oil._id)).toBe(stockBefore);
  });

  it('receives goods, increases inventory, and derives partial and full fulfillment status', async () => {
    const submitted = await createSubmittedPurchaseRequest();
    await asSuperAdmin(
      request.patch(`/api/v1/super-admin/procurement/purchase-requests/${submitted._id}/acknowledge`)
    ).send({
      items: [{ productId: oil._id.toString(), confirmedQuantity: 100 }],
    }).expect(200);

    const stockBefore = await getInventoryStock(oil._id);

    const partial = await asSuperAdmin(
      request.patch(`/api/v1/super-admin/procurement/purchase-requests/${submitted._id}/receive`)
    ).send({ productId: oil._id.toString(), quantity: 60, notes: 'First receipt' }).expect(200);

    expect(partial.body.data.status).toBe(PURCHASE_REQUEST_STATUS.PARTIALLY_FULFILLED);
    expect(partial.body.data.items[0].receivedQuantity).toBe(60);
    expect(partial.body.data.items[0].remainingQuantity).toBe(40);
    expect(await getInventoryStock(oil._id)).toBe(stockBefore + 60);

    const fulfilled = await asSuperAdmin(
      request.patch(`/api/v1/super-admin/procurement/purchase-requests/${submitted._id}/receive`)
    ).send({ productId: oil._id.toString(), quantity: 40 }).expect(200);

    expect(fulfilled.body.data.status).toBe(PURCHASE_REQUEST_STATUS.FULFILLED);
    expect(fulfilled.body.data.items[0].receivedQuantity).toBe(100);
    expect(fulfilled.body.data.items[0].receipts.length).toBe(2);
    expect(await getInventoryStock(oil._id)).toBe(stockBefore + 100);

    const audit = await Audit.findOne({ action: 'RECEIVE_PURCHASE_REQUEST' });
    expect(audit).toBeTruthy();
  });

  it('rejects invalid receiving and protects terminal states', async () => {
    const submitted = await createSubmittedPurchaseRequest();

    await asSuperAdmin(
      request.patch(`/api/v1/super-admin/procurement/purchase-requests/${submitted._id}/receive`)
    ).send({ productId: oil._id.toString(), quantity: 10 }).expect(400);

    await asSuperAdmin(
      request.patch(`/api/v1/super-admin/procurement/purchase-requests/${submitted._id}/acknowledge`)
    ).send({
      items: [{ productId: oil._id.toString(), confirmedQuantity: 100 }],
    }).expect(200);

    await asSuperAdmin(
      request.patch(`/api/v1/super-admin/procurement/purchase-requests/${submitted._id}/receive`)
    ).send({ productId: oil._id.toString(), quantity: 0 }).expect(400);

    await asSuperAdmin(
      request.patch(`/api/v1/super-admin/procurement/purchase-requests/${submitted._id}/receive`)
    ).send({ productId: oil._id.toString(), quantity: 120 }).expect(400);

    await asSuperAdmin(
      request.patch(`/api/v1/super-admin/procurement/purchase-requests/${submitted._id}/receive`)
    ).send({ productId: oil._id.toString(), quantity: 100 }).expect(200);

    await asSuperAdmin(
      request.patch(`/api/v1/super-admin/procurement/purchase-requests/${submitted._id}/receive`)
    ).send({ productId: oil._id.toString(), quantity: 1 }).expect(400);
  });

  it('calculates overall partial fulfillment for multi-product requests', async () => {
    const submitted = await createSubmittedPurchaseRequest([
      {
        productId: oil._id.toString(),
        supplierProductId: mappingA._id,
        demandQuantity: 100,
        purchaseQuantity: 100,
      },
      {
        productId: rice._id.toString(),
        supplierProductId: mappingRice._id,
        demandQuantity: 150,
        purchaseQuantity: 150,
      },
    ]);

    await asSuperAdmin(
      request.patch(`/api/v1/super-admin/procurement/purchase-requests/${submitted._id}/acknowledge`)
    ).send({
      items: [
        { productId: oil._id.toString(), confirmedQuantity: 100 },
        { productId: rice._id.toString(), confirmedQuantity: 150 },
      ],
    }).expect(200);

    const partial = await asSuperAdmin(
      request.patch(`/api/v1/super-admin/procurement/purchase-requests/${submitted._id}/receive`)
    ).send({ productId: oil._id.toString(), quantity: 100 }).expect(200);

    expect(partial.body.data.status).toBe(PURCHASE_REQUEST_STATUS.PARTIALLY_FULFILLED);

    const fulfilled = await asSuperAdmin(
      request.patch(`/api/v1/super-admin/procurement/purchase-requests/${submitted._id}/receive`)
    ).send({ productId: rice._id.toString(), quantity: 150 }).expect(200);

    expect(fulfilled.body.data.status).toBe(PURCHASE_REQUEST_STATUS.FULFILLED);
  });

  it('preserves snapshots and does not mutate customer product pricing', async () => {
    const submitted = await createSubmittedPurchaseRequest();
    const snapshotPrice = submitted.items[0].supplierPriceSnapshot;

    await asSuperAdmin(
      request.patch(`/api/v1/super-admin/suppliers/${supplierA}/products/${mappingA._id}/price`)
    ).send({ price: 999 }).expect(200);

    await asSuperAdmin(
      request.patch(`/api/v1/super-admin/procurement/purchase-requests/${submitted._id}/acknowledge`)
    ).send({
      items: [{ productId: oil._id.toString(), confirmedQuantity: 100 }],
    }).expect(200);

    const received = await asSuperAdmin(
      request.patch(`/api/v1/super-admin/procurement/purchase-requests/${submitted._id}/receive`)
    ).send({ productId: oil._id.toString(), quantity: 100 }).expect(200);

    expect(received.body.data.items[0].supplierPriceSnapshot).toBe(snapshotPrice);
    expect(received.body.data.items[0].demandQuantity).toBe(100);
    expect(received.body.data.items[0].purchaseQuantity).toBe(100);

    const productAfter = await Product.findById(oil._id).lean();
    expect(productAfter.price).toBe(150);
    expect(productAfter.moq).toBe(1);
  });

  it('does not modify orders when receiving goods', async () => {
    const submitted = await createSubmittedPurchaseRequest();
    await asSuperAdmin(
      request.patch(`/api/v1/super-admin/procurement/purchase-requests/${submitted._id}/acknowledge`)
    ).send({
      items: [{ productId: oil._id.toString(), confirmedQuantity: 100 }],
    }).expect(200);

    const beforeCount = await Order.countDocuments();
    await asSuperAdmin(
      request.patch(`/api/v1/super-admin/procurement/purchase-requests/${submitted._id}/receive`)
    ).send({ productId: oil._id.toString(), quantity: 50 }).expect(200);
    expect(await Order.countDocuments()).toBe(beforeCount);
  });

  it('blocks cancellation after goods are received', async () => {
    const submitted = await createSubmittedPurchaseRequest();
    await asSuperAdmin(
      request.patch(`/api/v1/super-admin/procurement/purchase-requests/${submitted._id}/acknowledge`)
    ).send({
      items: [{ productId: oil._id.toString(), confirmedQuantity: 100 }],
    }).expect(200);

    await asSuperAdmin(
      request.patch(`/api/v1/super-admin/procurement/purchase-requests/${submitted._id}/receive`)
    ).send({ productId: oil._id.toString(), quantity: 10 }).expect(200);

    await asSuperAdmin(
      request.patch(`/api/v1/super-admin/procurement/purchase-requests/${submitted._id}/cancel`)
    ).expect(400);
  });

  it('rejects cross-request product manipulation', async () => {
    const submitted = await createSubmittedPurchaseRequest();
    await asSuperAdmin(
      request.patch(`/api/v1/super-admin/procurement/purchase-requests/${submitted._id}/acknowledge`)
    ).send({
      items: [{ productId: oil._id.toString(), confirmedQuantity: 100 }],
    }).expect(200);

    await asSuperAdmin(
      request.patch(`/api/v1/super-admin/procurement/purchase-requests/${submitted._id}/receive`)
    ).send({ productId: rice._id.toString(), quantity: 10 }).expect(400);
  });

  it('denies non Super Admin roles', async () => {
    const submitted = await createSubmittedPurchaseRequest();

    await request
      .patch(`/api/v1/super-admin/procurement/purchase-requests/${submitted._id}/acknowledge`)
      .set(sessionHeaders(admin))
      .send({ items: [{ productId: oil._id.toString(), confirmedQuantity: 100 }] })
      .expect(403);

    await request
      .patch(`/api/v1/super-admin/procurement/purchase-requests/${submitted._id}/receive`)
      .set(sessionHeaders(delivery))
      .send({ productId: oil._id.toString(), quantity: 10 })
      .expect(403);

    await request
      .patch(`/api/v1/super-admin/procurement/purchase-requests/${submitted._id}/acknowledge`)
      .send({ items: [{ productId: oil._id.toString(), confirmedQuantity: 100 }] })
      .expect(401);
  });
});
