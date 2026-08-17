import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import mongoose from 'mongoose';
import supertest from 'supertest';
import app from '../../src/app.js';
import Audit from '../../src/modules/audit/audit.model.js';
import SupplierProduct from '../../src/modules/supplier/supplierProduct.model.js';
import SupplierProductPriceHistory from '../../src/modules/supplier/supplierProductPriceHistory.model.js';
import Product from '../../src/modules/product/product.model.js';
import { clearDatabase } from '../helpers/testUtils.js';
import { redisClient } from '../../src/config/redis.js';
import {
  seedSuperAdminUser,
  seedAdminUser,
  seedVendorUser,
  seedDeliveryPartner,
  seedCategory,
  seedProduct,
} from '../helpers/integrationFixtures.js';
import { sessionHeaders } from '../helpers/httpTestHelpers.js';
import { SUPPLIER_STATUS } from '../../src/constants/supplierStatus.js';
import { SUPPLIER_PRODUCT_STATUS } from '../../src/constants/supplierProductStatus.js';

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

describe('Super Admin supplier product pricing - Phase 2.1', () => {
  let superAdmin;
  let admin;
  let vendor;
  let delivery;
  let product;

  beforeEach(async () => {
    await clearDatabase();
    await redisClient.flushdb();
    superAdmin = await seedSuperAdminUser();
    admin = await seedAdminUser();
    vendor = await seedVendorUser();
    delivery = await seedDeliveryPartner();
    const category = await seedCategory();
    product = await seedProduct(category._id, { name: 'Sunflower Oil', moq: 1, price: 150 });
  });

  afterEach(async () => {
    await redisClient.flushdb();
  });

  const asSuperAdmin = (builder) => builder.set(sessionHeaders(superAdmin));

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

  const createMapping = async (supplierId, overrides = {}) => {
    const response = await asSuperAdmin(request.post(`/api/v1/super-admin/suppliers/${supplierId}/products`))
      .send({
        productId: product._id.toString(),
        minimumOrderQuantity: 50,
        notes: 'Available regularly',
        ...overrides,
      })
      .expect(201);
    return response.body.data;
  };

  const setPrice = (supplierId, mappingId, price) =>
    asSuperAdmin(request.patch(`/api/v1/super-admin/suppliers/${supplierId}/products/${mappingId}/price`))
      .send({ price });

  it('sets first supplier price with null previousPrice and does not change Product.price', async () => {
    const supplierId = await createActiveSupplier();
    const mapping = await createMapping(supplierId);
    expect(mapping.currentSupplierPrice).toBeNull();

    const response = await setPrice(supplierId, mapping._id, 100).expect(200);
    expect(response.body.data.currentSupplierPrice).toBe(100);

    const history = await SupplierProductPriceHistory.find({ supplierProductId: mapping._id }).sort({ changedAt: -1 });
    expect(history).toHaveLength(1);
    expect(history[0].price).toBe(100);
    expect(history[0].previousPrice).toBeNull();

    const storedProduct = await Product.findById(product._id);
    expect(storedProduct.price).toBe(150);
    expect(storedProduct.moq).toBe(1);

    const audit = await Audit.findOne({ action: 'UPDATE_SUPPLIER_PRODUCT_PRICE', entityId: mapping._id });
    expect(audit).toBeTruthy();
  });

  it('records price history on updates and rejects duplicate same-price submissions', async () => {
    const supplierId = await createActiveSupplier();
    const mapping = await createMapping(supplierId);

    await setPrice(supplierId, mapping._id, 95).expect(200);
    await setPrice(supplierId, mapping._id, 100).expect(200);
    await setPrice(supplierId, mapping._id, 98).expect(200);

    const same = await setPrice(supplierId, mapping._id, 98).expect(400);
    expect(same.body.message).toMatch(/already/i);

    const historyRes = await asSuperAdmin(
      request.get(`/api/v1/super-admin/suppliers/${supplierId}/products/${mapping._id}/price-history`)
    ).expect(200);

    expect(historyRes.body.data.history).toHaveLength(3);
    expect(historyRes.body.data.history[0].price).toBe(98);
    expect(historyRes.body.data.history[0].previousPrice).toBe(100);
    expect(historyRes.body.data.history[1].price).toBe(100);
    expect(historyRes.body.data.history[1].previousPrice).toBe(95);
    expect(historyRes.body.data.history[2].price).toBe(95);
    expect(historyRes.body.data.history[2].previousPrice).toBeNull();

    const stored = await SupplierProduct.findById(mapping._id);
    expect(stored.currentSupplierPrice).toBe(98);
  });

  it('rejects invalid prices', async () => {
    const supplierId = await createActiveSupplier();
    const mapping = await createMapping(supplierId);

    for (const price of [0, -10, 'abc', null]) {
      const response = await setPrice(supplierId, mapping._id, price).expect(400);
      expect(response.body.success).toBe(false);
    }
  });

  it('rejects price updates when supplier or mapping is inactive and preserves existing price/history', async () => {
    const supplierId = await createActiveSupplier();
    const mapping = await createMapping(supplierId);
    await setPrice(supplierId, mapping._id, 100).expect(200);

    await asSuperAdmin(request.patch(`/api/v1/super-admin/suppliers/${supplierId}/products/${mapping._id}/status`))
      .send({ status: SUPPLIER_PRODUCT_STATUS.INACTIVE })
      .expect(200);

    const inactiveMapping = await setPrice(supplierId, mapping._id, 120).expect(400);
    expect(inactiveMapping.body.message).toMatch(/inactive/i);

    await asSuperAdmin(request.patch(`/api/v1/super-admin/suppliers/${supplierId}/products/${mapping._id}/status`))
      .send({ status: SUPPLIER_PRODUCT_STATUS.ACTIVE })
      .expect(200);

    await asSuperAdmin(request.patch(`/api/v1/super-admin/suppliers/${supplierId}/status`))
      .send({ status: SUPPLIER_STATUS.INACTIVE })
      .expect(200);

    const inactiveSupplier = await setPrice(supplierId, mapping._id, 120).expect(400);
    expect(inactiveSupplier.body.message).toMatch(/inactive/i);

    const stored = await SupplierProduct.findById(mapping._id);
    expect(stored.currentSupplierPrice).toBe(100);
    const historyCount = await SupplierProductPriceHistory.countDocuments({ supplierProductId: mapping._id });
    expect(historyCount).toBe(1);

    const historyRes = await asSuperAdmin(
      request.get(`/api/v1/super-admin/suppliers/${supplierId}/products/${mapping._id}/price-history`)
    ).expect(200);
    expect(historyRes.body.data.history).toHaveLength(1);
  });

  it('denies Admin, Vendor, Delivery Partner, and unauthenticated price updates', async () => {
    const supplierId = await createActiveSupplier();
    const mapping = await createMapping(supplierId);
    const path = `/api/v1/super-admin/suppliers/${supplierId}/products/${mapping._id}/price`;

    await request.patch(path).set(sessionHeaders(admin)).send({ price: 100 }).expect(403);
    await request.patch(path).set(sessionHeaders(vendor)).send({ price: 100 }).expect(403);
    await request.patch(path).set(sessionHeaders(delivery)).send({ price: 100 }).expect(403);
    await request.patch(path).send({ price: 100 }).expect(401);
  });

  it('lists mappings with unset price as null and does not expose product selling price on mapping', async () => {
    const supplierId = await createActiveSupplier();
    await createMapping(supplierId);

    const list = await asSuperAdmin(request.get(`/api/v1/super-admin/suppliers/${supplierId}/products`))
      .expect(200);

    expect(list.body.data.mappings[0].currentSupplierPrice).toBeNull();
    expect(list.body.data.mappings[0].product).not.toHaveProperty('price');
  });

  it('handles concurrent price updates without losing accepted history integrity', async () => {
    const supplierId = await createActiveSupplier();
    const mapping = await createMapping(supplierId);
    await setPrice(supplierId, mapping._id, 100).expect(200);

    const results = await Promise.allSettled([
      setPrice(supplierId, mapping._id, 110),
      setPrice(supplierId, mapping._id, 120),
    ]);

    const fulfilled = results.filter((r) => r.status === 'fulfilled');
    expect(fulfilled.length).toBe(2);

    const statuses = fulfilled.map((r) => r.value.status);
    const successCount = statuses.filter((s) => s === 200).length;
    const conflictOrBusy = statuses.filter((s) => s === 409 || s === 400).length;
    expect(successCount + conflictOrBusy).toBe(2);
    expect(successCount).toBeGreaterThanOrEqual(1);

    const stored = await SupplierProduct.findById(mapping._id);
    expect([110, 120]).toContain(stored.currentSupplierPrice);

    const history = await SupplierProductPriceHistory.find({ supplierProductId: mapping._id }).sort({ changedAt: 1 });
    expect(history.length).toBeGreaterThanOrEqual(2);
    expect(history[0].price).toBe(100);
    expect(history[history.length - 1].price).toBe(stored.currentSupplierPrice);

    for (let i = 1; i < history.length; i += 1) {
      expect(history[i].previousPrice).toBe(history[i - 1].price);
    }
  });
});
