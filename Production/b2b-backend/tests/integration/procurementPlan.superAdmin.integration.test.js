import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import supertest from 'supertest';
import app from '../../src/app.js';
import Order from '../../src/modules/order/order.model.js';
import Product from '../../src/modules/product/product.model.js';
import SupplierProduct from '../../src/modules/supplier/supplierProduct.model.js';
import SupplierProductPriceHistory from '../../src/modules/supplier/supplierProductPriceHistory.model.js';
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
import { SUPPLIER_PRODUCT_STATUS } from '../../src/constants/supplierProductStatus.js';
import { PROCUREMENT_PLAN_STATUS } from '../../src/constants/procurementPlanStatus.js';
import { ROLES } from '../../src/constants/roles.js';
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

describe('Super Admin procurement plans - Phase 3.2', () => {
  let superAdmin;
  let admin;
  let vendor;
  let delivery;
  let customer;
  let oil;
  let rice;

  const demandDate = '2026-08-17';
  const { start } = getBusinessDayRange(demandDate);
  const inDay = new Date(start.getTime() + 10 * 60 * 60 * 1000);

  beforeEach(async () => {
    await clearDatabase();
    await redisClient.flushdb();
    superAdmin = await seedSuperAdminUser();
    admin = await seedAdminUser();
    vendor = await seedVendorUser();
    delivery = await seedDeliveryPartner();
    customer = await seedActiveUser({ email: 'plan-buyer@example.com' });
    const category = await seedCategory();
    oil = await seedProduct(category._id, { name: 'Sunflower Oil', moq: 1, price: 150 });
    rice = await seedProduct(category._id, { name: 'Rice', moq: 1, price: 80 });
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

  const createOrder = (items) => seedPaidOrder(customer.user._id, {
    items,
    totalAmount: items.reduce((sum, row) => sum + row.price * row.quantity, 0),
    status: ORDER_STATUS.CONFIRMED,
    paymentStatus: PAYMENT_STATUS.PENDING,
    paymentMethod: 'COD',
    createdAt: inDay,
  });

  const activateSupplier = async (id) => {
    await asSuperAdmin(request.patch(`/api/v1/super-admin/suppliers/${id}/status`))
      .send({ status: SUPPLIER_STATUS.APPROVED })
      .expect(200);
    await asSuperAdmin(request.patch(`/api/v1/super-admin/suppliers/${id}/status`))
      .send({ status: SUPPLIER_STATUS.ACTIVE })
      .expect(200);
  };

  const createActiveSupplier = async (overrides = {}) => {
    const created = await asSuperAdmin(request.post('/api/v1/super-admin/suppliers'))
      .send(validSupplier(overrides))
      .expect(201);
    const id = created.body.data._id;
    await activateSupplier(id);
    return id;
  };

  const mapAndPrice = async (supplierId, product, moq, price) => {
    const mapping = await asSuperAdmin(request.post(`/api/v1/super-admin/suppliers/${supplierId}/products`))
      .send({ productId: product._id.toString(), minimumOrderQuantity: moq })
      .expect(201);
    await asSuperAdmin(
      request.patch(`/api/v1/super-admin/suppliers/${supplierId}/products/${mapping.body.data._id}/price`)
    )
      .send({ price })
      .expect(200);
    return mapping.body.data;
  };

  const createDraft = async () => {
    const response = await asSuperAdmin(request.post('/api/v1/super-admin/procurement/plans'))
      .send({ date: demandDate })
      .expect(201);
    return response.body.data;
  };

  it('creates a draft from Phase 3.1 demand and prevents a second active plan for the same date', async () => {
    await createOrder([item(oil, 100)]);
    const abc = await createActiveSupplier();
    const mapping = await mapAndPrice(abc, oil, 50, 100);

    const first = await createDraft();
    expect(first.plan.status).toBe(PROCUREMENT_PLAN_STATUS.DRAFT);
    expect(first.plan.procurementDate).toBe(demandDate);
    expect(first.plan.items[0].requiredQuantity).toBe(100);
    expect(first.plan.items[0].supplierId).toBeNull();
    expect(first.readiness.canConfirm).toBe(false);

    const second = await asSuperAdmin(request.post('/api/v1/super-admin/procurement/plans'))
      .send({ date: demandDate })
      .expect(201);
    expect(second.body.data.plan._id).toBe(first.plan._id);

    const audit = await Audit.findOne({ action: 'CREATE_PROCUREMENT_PLAN', entityId: first.plan._id });
    expect(audit).toBeTruthy();

    const selected = await asSuperAdmin(request.patch(`/api/v1/super-admin/procurement/plans/${first.plan._id}`))
      .send({
        items: [{
          productId: oil._id.toString(),
          supplierId: abc,
          supplierProductId: mapping._id,
        }],
      })
      .expect(200);

    const oilItem = selected.body.data.plan.items[0];
    expect(String(oilItem.supplierId)).toBe(String(abc));
    expect(String(oilItem.supplierProductId)).toBe(String(mapping._id));
    expect(oilItem.supplierPriceSnapshot).toBe(100);
    expect(oilItem.supplierMoqSnapshot).toBe(50);
    expect(oilItem.plannedQuantity).toBe(100);
    expect(oilItem.estimatedCost).toBe(10000);
    expect(selected.body.data.plan.totalEstimatedCost).toBe(10000);
    expect(selected.body.data.readiness.canConfirm).toBe(true);
  });

  it('rejects ineligible suppliers and invalid quantities', async () => {
    await createOrder([item(oil, 100)]);
    const abc = await createActiveSupplier();
    const xyz = await createActiveSupplier({
      supplierName: 'XYZ Distributors',
      companyName: 'XYZ Dist Co',
      email: 'xyz@example.com',
      gstNumber: '24AAPFU0939F1Z5',
      phone: '9876503333',
    });
    const mapping = await mapAndPrice(abc, oil, 50, 100);
    const otherMapping = await mapAndPrice(xyz, oil, 20, 120);
    const draft = await createDraft();

    const inactiveSupplier = await asSuperAdmin(request.patch(`/api/v1/super-admin/procurement/plans/${draft.plan._id}`))
      .send({
        items: [{
          productId: oil._id.toString(),
          supplierId: xyz,
          supplierProductId: otherMapping._id,
        }],
      })
      .expect(200);
    await asSuperAdmin(request.patch(`/api/v1/super-admin/suppliers/${xyz}/status`))
      .send({ status: SUPPLIER_STATUS.INACTIVE })
      .expect(200);
    const inactiveRes = await asSuperAdmin(request.patch(`/api/v1/super-admin/procurement/plans/${draft.plan._id}`))
      .send({
        items: [{
          productId: oil._id.toString(),
          supplierId: xyz,
          supplierProductId: otherMapping._id,
        }],
      })
      .expect(400);
    expect(inactiveRes.body.message).toMatch(/not active/i);
    expect(inactiveSupplier.body.data.plan.status).toBe(PROCUREMENT_PLAN_STATUS.DRAFT);

    const mismatch = await asSuperAdmin(request.patch(`/api/v1/super-admin/procurement/plans/${draft.plan._id}`))
      .send({
        items: [{
          productId: oil._id.toString(),
          supplierId: abc,
          supplierProductId: otherMapping._id,
        }],
      })
      .expect(400);
    expect(mismatch.body.message).toMatch(/does not belong/i);

    await asSuperAdmin(request.patch(`/api/v1/super-admin/procurement/plans/${draft.plan._id}`))
      .send({
        items: [{
          productId: oil._id.toString(),
          supplierId: abc,
          supplierProductId: mapping._id,
        }],
      })
      .expect(200);

    const belowRequired = await asSuperAdmin(request.patch(`/api/v1/super-admin/procurement/plans/${draft.plan._id}`))
      .send({ items: [{ productId: oil._id.toString(), plannedQuantity: 80 }] })
      .expect(400);
    expect(belowRequired.body.message).toMatch(/required quantity/i);

    const decimal = await asSuperAdmin(request.patch(`/api/v1/super-admin/procurement/plans/${draft.plan._id}`))
      .send({ items: [{ productId: oil._id.toString(), plannedQuantity: 100.5 }] })
      .expect(400);
    expect(decimal.body.success).toBe(false);
  });

  it('requires planned quantity to meet supplier MOQ and allows explicit over-purchase', async () => {
    await createOrder([item(oil, 40)]);
    const abc = await createActiveSupplier();
    const mapping = await mapAndPrice(abc, oil, 50, 100);
    const draft = await createDraft();

    await asSuperAdmin(request.patch(`/api/v1/super-admin/procurement/plans/${draft.plan._id}`))
      .send({
        items: [{
          productId: oil._id.toString(),
          supplierId: abc,
          supplierProductId: mapping._id,
        }],
      })
      .expect(200);

    const belowMoq = await asSuperAdmin(request.patch(`/api/v1/super-admin/procurement/plans/${draft.plan._id}`))
      .send({ items: [{ productId: oil._id.toString(), plannedQuantity: 40 }] })
      .expect(400);
    expect(belowMoq.body.message).toMatch(/MOQ of 50/i);

    const over = await asSuperAdmin(request.patch(`/api/v1/super-admin/procurement/plans/${draft.plan._id}`))
      .send({ items: [{ productId: oil._id.toString(), plannedQuantity: 150 }] })
      .expect(200);
    expect(over.body.data.plan.items[0].plannedQuantity).toBe(150);
    expect(over.body.data.plan.items[0].additionalQuantity).toBe(110);
    expect(over.body.data.plan.items[0].estimatedCost).toBe(15000);
  });

  it('blocks confirmation on stale price or increased demand, then confirms after review', async () => {
    await createOrder([item(oil, 100)]);
    const abc = await createActiveSupplier();
    const mapping = await mapAndPrice(abc, oil, 50, 100);
    const draft = await createDraft();
    await asSuperAdmin(request.patch(`/api/v1/super-admin/procurement/plans/${draft.plan._id}`))
      .send({
        items: [{
          productId: oil._id.toString(),
          supplierId: abc,
          supplierProductId: mapping._id,
        }],
      })
      .expect(200);

    await asSuperAdmin(
      request.patch(`/api/v1/super-admin/suppliers/${abc}/products/${mapping._id}/price`)
    )
      .send({ price: 110 })
      .expect(200);

    const stalePrice = await asSuperAdmin(request.post(`/api/v1/super-admin/procurement/plans/${draft.plan._id}/confirm`))
      .expect(400);
    expect(stalePrice.body.message).toMatch(/changed from/i);

    await asSuperAdmin(request.patch(`/api/v1/super-admin/procurement/plans/${draft.plan._id}`))
      .send({ items: [{ productId: oil._id.toString(), refreshPrice: true }] })
      .expect(200);

    await createOrder([item(oil, 20)]);
    const staleDemand = await asSuperAdmin(request.post(`/api/v1/super-admin/procurement/plans/${draft.plan._id}/confirm`))
      .expect(400);
    expect(staleDemand.body.message).toMatch(/demand has increased/i);

    await asSuperAdmin(request.patch(`/api/v1/super-admin/procurement/plans/${draft.plan._id}`))
      .send({
        syncDemand: true,
        items: [{ productId: oil._id.toString(), plannedQuantity: 120 }],
      })
      .expect(200);

    const historyBefore = await SupplierProductPriceHistory.countDocuments({ supplierProductId: mapping._id });
    const productBefore = await Product.findById(oil._id).lean();
    const mappingBefore = await SupplierProduct.findById(mapping._id).lean();
    const ordersBefore = await Order.find().lean();

    const confirmed = await asSuperAdmin(request.post(`/api/v1/super-admin/procurement/plans/${draft.plan._id}/confirm`))
      .expect(200);
    expect(confirmed.body.data.plan.status).toBe(PROCUREMENT_PLAN_STATUS.CONFIRMED);
    expect(confirmed.body.data.plan.confirmedBy).toBeTruthy();
    expect(confirmed.body.data.plan.confirmedAt).toBeTruthy();
    expect(confirmed.body.data.plan.items[0].supplierPriceSnapshot).toBe(110);
    expect(confirmed.body.message).not.toMatch(/supplier notified/i);

    const editConfirmed = await asSuperAdmin(request.patch(`/api/v1/super-admin/procurement/plans/${draft.plan._id}`))
      .send({ items: [{ productId: oil._id.toString(), plannedQuantity: 200 }] })
      .expect(400);
    expect(editConfirmed.body.message).toMatch(/draft/i);

    const historyAfter = await SupplierProductPriceHistory.countDocuments({ supplierProductId: mapping._id });
    expect(historyAfter).toBe(historyBefore);
    const productAfter = await Product.findById(oil._id).lean();
    expect(productAfter.price).toBe(productBefore.price);
    expect(productAfter.moq).toBe(productBefore.moq);
    const mappingAfter = await SupplierProduct.findById(mapping._id).lean();
    expect(mappingAfter.currentSupplierPrice).toBe(mappingBefore.currentSupplierPrice);
    const ordersAfter = await Order.find().lean();
    expect(ordersAfter.map((row) => row.status)).toEqual(ordersBefore.map((row) => row.status));

    const confirmAudit = await Audit.findOne({ action: 'CONFIRM_PROCUREMENT_PLAN', entityId: draft.plan._id });
    expect(confirmAudit).toBeTruthy();
  });

  it('cancels a draft, keeps history, and denies non Super Admin access', async () => {
    await createOrder([item(oil, 100), item(rice, 50)]);
    const draft = await createDraft();
    expect(draft.plan.items).toHaveLength(2);

    const cancelled = await asSuperAdmin(request.post(`/api/v1/super-admin/procurement/plans/${draft.plan._id}/cancel`))
      .expect(200);
    expect(cancelled.body.data.plan.status).toBe(PROCUREMENT_PLAN_STATUS.CANCELLED);
    const cancelAudit = await Audit.findOne({ action: 'CANCEL_PROCUREMENT_PLAN', entityId: draft.plan._id });
    expect(cancelAudit).toBeTruthy();

    const path = `/api/v1/super-admin/procurement/plans`;
    const supplierUser = await seedActiveUser({ role: ROLES.SUPPLIER, email: 'supplier-role@example.com' });
    await request.post(path).set(sessionHeaders(admin)).send({ date: demandDate }).expect(403);
    await request.post(path).set(sessionHeaders(vendor)).send({ date: demandDate }).expect(403);
    await request.post(path).set(sessionHeaders(delivery)).send({ date: demandDate }).expect(403);
    await request.post(path).set(sessionHeaders(supplierUser)).send({ date: demandDate }).expect(403);
    await request.post(path).send({ date: demandDate }).expect(401);
  });
});
