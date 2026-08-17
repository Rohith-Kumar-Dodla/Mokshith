import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import supertest from 'supertest';
import app from '../../src/app.js';
import Order from '../../src/modules/order/order.model.js';
import Product from '../../src/modules/product/product.model.js';
import SupplierProduct from '../../src/modules/supplier/supplierProduct.model.js';
import PurchaseRequest from '../../src/modules/procurement/purchaseRequest.model.js';
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

describe('Super Admin purchase requests - Phase 5.1', () => {
  let superAdmin;
  let admin;
  let customer;
  let oil;
  let rice;
  let supplierA;
  let supplierB;
  let mappingA;
  let mappingB;

  const demandDate = '2026-08-17';
  const { start } = getBusinessDayRange(demandDate);
  const inDay = new Date(start.getTime() + 10 * 60 * 60 * 1000);

  const asSuperAdmin = (builder) => builder.set(sessionHeaders(superAdmin));

  const createOrder = (items) => seedPaidOrder(customer.user._id, {
    items,
    totalAmount: items.reduce((sum, row) => sum + row.price * row.quantity, 0),
    status: ORDER_STATUS.CONFIRMED,
    paymentStatus: PAYMENT_STATUS.PENDING,
    paymentMethod: 'COD',
    createdAt: inDay,
  });

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

  beforeEach(async () => {
    await clearDatabase();
    await redisClient.flushdb();
    superAdmin = await seedSuperAdminUser();
    admin = await seedAdminUser();
    await seedVendorUser();
    await seedDeliveryPartner();
    customer = await seedActiveUser({ email: 'pr-buyer@example.com' });
    const category = await seedCategory();
    oil = await seedProduct(category._id, { name: 'Sunflower Oil', moq: 1, price: 150 });
    rice = await seedProduct(category._id, { name: 'Rice', moq: 1, price: 80 });

    supplierA = await createActiveSupplier({ supplierName: 'ABC Oils', email: 'abc@example.com', phone: '9876501111' });
    supplierB = await createActiveSupplier({
      supplierName: 'XYZ Traders',
      companyName: 'XYZ Traders Pvt Ltd',
      email: 'xyz@example.com',
      phone: '9876502222',
      gstNumber: undefined,
    });

    mappingA = await mapAndPrice(supplierA, oil, 20, 100);
    mappingB = await mapAndPrice(supplierB, oil, 10, 120);
    await mapAndPrice(supplierA, rice, 30, 50);

    await createOrder([{ productId: oil._id, name: oil.name, price: oil.price, quantity: 100 }]);
    await createOrder([{ productId: rice._id, name: rice.name, price: rice.price, quantity: 150 }]);
  });

  afterEach(async () => {
    await redisClient.flushdb();
  });

  const basePayload = () => ({
    supplierId: supplierA,
    demandDate,
    items: [{
      productId: oil._id.toString(),
      supplierProductId: mappingA._id,
      demandQuantity: 100,
      purchaseQuantity: 100,
    }],
  });

  it('returns supplier allocation for a demanded product without auto-selecting cheapest', async () => {
    const response = await asSuperAdmin(
      request.get(`/api/v1/super-admin/procurement/demand/${demandDate}/products/${oil._id}/suppliers`)
    ).expect(200);

    expect(response.body.data.demandQuantity).toBe(100);
    expect(response.body.data.suppliers.length).toBe(2);
    const cheapest = response.body.data.suppliers.find((row) => row.isLowestPrice);
    expect(cheapest.supplierName).toBe('ABC Oils');
  });

  it('creates a draft purchase request with price and MOQ snapshots', async () => {
    const response = await asSuperAdmin(
      request.post('/api/v1/super-admin/procurement/purchase-requests')
    )
      .send(basePayload())
      .expect(201);

    expect(response.body.data.status).toBe(PURCHASE_REQUEST_STATUS.DRAFT);
    expect(response.body.data.purchaseRequestNumber).toMatch(/^PR-\d{4}-\d{4}$/);
    expect(response.body.data.items[0].supplierPriceSnapshot).toBe(100);
    expect(response.body.data.items[0].supplierMOQSnapshot).toBe(20);
    expect(response.body.data.items[0].demandQuantity).toBe(100);
    expect(response.body.data.totalEstimatedCost).toBe(10000);

    const productAfter = await Product.findById(oil._id).lean();
    expect(productAfter.price).toBe(150);
    expect(productAfter.moq).toBe(1);
  });

  it('submits a purchase request and preserves snapshots when supplier price changes', async () => {
    const created = await asSuperAdmin(
      request.post('/api/v1/super-admin/procurement/purchase-requests')
    )
      .send(basePayload())
      .expect(201);

    await asSuperAdmin(
      request.patch(`/api/v1/super-admin/suppliers/${supplierA}/products/${mappingA._id}/price`)
    )
      .send({ price: 110 })
      .expect(200);

    const blocked = await asSuperAdmin(
      request.patch(`/api/v1/super-admin/procurement/purchase-requests/${created.body.data._id}/submit`)
    )
      .send({})
      .expect(400);
    expect(blocked.body.message).toMatch(/price changed/i);

    const submitted = await asSuperAdmin(
      request.patch(`/api/v1/super-admin/procurement/purchase-requests/${created.body.data._id}/submit`)
    )
      .send({ confirmPriceRefresh: true })
      .expect(200);

    expect(submitted.body.data.status).toBe(PURCHASE_REQUEST_STATUS.SUBMITTED);
    expect(submitted.body.data.items[0].supplierPriceSnapshot).toBe(110);
    expect(submitted.body.data.totalEstimatedCost).toBe(11000);
  });

  it('rejects purchase quantity below supplier MOQ and below demand', async () => {
    const belowMoq = await asSuperAdmin(
      request.post('/api/v1/super-admin/procurement/purchase-requests')
    )
      .send({
        ...basePayload(),
        items: [{
          productId: oil._id.toString(),
          supplierProductId: mappingA._id,
          demandQuantity: 100,
          purchaseQuantity: 15,
        }],
      })
      .expect(400);
    expect(belowMoq.body.message).toMatch(/MOQ/i);

    const belowDemand = await asSuperAdmin(
      request.post('/api/v1/super-admin/procurement/purchase-requests')
    )
      .send({
        ...basePayload(),
        items: [{
          productId: oil._id.toString(),
          supplierProductId: mappingA._id,
          demandQuantity: 100,
          purchaseQuantity: 80,
        }],
      })
      .expect(400);
    expect(belowDemand.body.message).toMatch(/demand/i);
  });

  it('allows multiple items for one supplier and rejects cross-supplier mapping', async () => {
    const riceMapping = await SupplierProduct.findOne({ supplierId: supplierA, productId: rice._id });

    const response = await asSuperAdmin(
      request.post('/api/v1/super-admin/procurement/purchase-requests')
    )
      .send({
        supplierId: supplierA,
        demandDate,
        items: [
          {
            productId: oil._id.toString(),
            supplierProductId: mappingA._id,
            demandQuantity: 100,
            purchaseQuantity: 100,
          },
          {
            productId: rice._id.toString(),
            supplierProductId: riceMapping._id.toString(),
            demandQuantity: 150,
            purchaseQuantity: 150,
          },
        ],
      })
      .expect(201);

    expect(response.body.data.items.length).toBe(2);
    expect(response.body.data.totalEstimatedCost).toBe(17500);

    const crossSupplier = await asSuperAdmin(
      request.post('/api/v1/super-admin/procurement/purchase-requests')
    )
      .send({
        supplierId: supplierA,
        demandDate,
        items: [{
          productId: oil._id.toString(),
          supplierProductId: mappingB._id,
          demandQuantity: 100,
          purchaseQuantity: 100,
        }],
      })
      .expect(400);
    expect(crossSupplier.body.message).toMatch(/does not belong to this supplier/i);
  });

  it('does not modify orders when creating purchase requests', async () => {
    const beforeCount = await Order.countDocuments();
    await asSuperAdmin(request.post('/api/v1/super-admin/procurement/purchase-requests'))
      .send(basePayload())
      .expect(201);
    expect(await Order.countDocuments()).toBe(beforeCount);
  });

  it('cancels draft requests and records audit', async () => {
    const created = await asSuperAdmin(
      request.post('/api/v1/super-admin/procurement/purchase-requests')
    )
      .send(basePayload())
      .expect(201);

    await asSuperAdmin(
      request.patch(`/api/v1/super-admin/procurement/purchase-requests/${created.body.data._id}/cancel`)
    ).expect(200);

    const audit = await Audit.findOne({
      entity: 'PURCHASE_REQUEST',
      action: 'CANCEL_PURCHASE_REQUEST',
    });
    expect(audit).toBeTruthy();
  });

  it('denies non Super Admin access', async () => {
    await request
      .post('/api/v1/super-admin/procurement/purchase-requests')
      .set(sessionHeaders(admin))
      .send(basePayload())
      .expect(403);
  });
});
