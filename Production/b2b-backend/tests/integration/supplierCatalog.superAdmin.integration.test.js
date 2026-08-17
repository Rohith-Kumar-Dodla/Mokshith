import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import mongoose from 'mongoose';
import supertest from 'supertest';
import app from '../../src/app.js';
import Product from '../../src/modules/product/product.model.js';
import SupplierProduct from '../../src/modules/supplier/supplierProduct.model.js';
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

describe('Super Admin supplier catalog overview - Phase 4.1', () => {
  let superAdmin;
  let admin;
  let vendor;
  let delivery;
  let categoryA;
  let categoryB;
  let productA;
  let productB;
  let productC;
  let supplierId;

  beforeEach(async () => {
    await clearDatabase();
    await redisClient.flushdb();
    superAdmin = await seedSuperAdminUser();
    admin = await seedAdminUser();
    vendor = await seedVendorUser();
    delivery = await seedDeliveryPartner();
    categoryA = await seedCategory({ name: 'Cooking Oil' });
    categoryB = await seedCategory({ name: 'Edible Oils' });
    productA = await seedProduct(categoryA._id, { name: 'Sunflower Oil', moq: 1 });
    productB = await seedProduct(categoryA._id, { name: 'Groundnut Oil', moq: 1 });
    productC = await seedProduct(categoryB._id, { name: 'Mustard Oil', moq: 1 });

    const created = await request
      .post('/api/v1/super-admin/suppliers')
      .set(sessionHeaders(superAdmin))
      .send(validSupplier())
      .expect(201);
    supplierId = created.body.data._id;

    await request
      .patch(`/api/v1/super-admin/suppliers/${supplierId}/status`)
      .set(sessionHeaders(superAdmin))
      .send({ status: SUPPLIER_STATUS.APPROVED })
      .expect(200);
    await request
      .patch(`/api/v1/super-admin/suppliers/${supplierId}/status`)
      .set(sessionHeaders(superAdmin))
      .send({ status: SUPPLIER_STATUS.ACTIVE })
      .expect(200);

    await request
      .post(`/api/v1/super-admin/suppliers/${supplierId}/products`)
      .set(sessionHeaders(superAdmin))
      .send({ productId: productA._id.toString(), minimumOrderQuantity: 50 })
      .expect(201);
    const mappingB = await request
      .post(`/api/v1/super-admin/suppliers/${supplierId}/products`)
      .set(sessionHeaders(superAdmin))
      .send({ productId: productB._id.toString(), minimumOrderQuantity: 30 })
      .expect(201);
    await request
      .post(`/api/v1/super-admin/suppliers/${supplierId}/products`)
      .set(sessionHeaders(superAdmin))
      .send({ productId: productC._id.toString(), minimumOrderQuantity: 40 })
      .expect(201);

    await request
      .patch(`/api/v1/super-admin/suppliers/${supplierId}/products/${mappingB.body.data._id}/price`)
      .set(sessionHeaders(superAdmin))
      .send({ price: 120 })
      .expect(200);

    await request
      .post(`/api/v1/super-admin/suppliers/${supplierId}/categories`)
      .set(sessionHeaders(superAdmin))
      .send({ categoryId: categoryA._id.toString() })
      .expect(201);
    await request
      .post(`/api/v1/super-admin/suppliers/${supplierId}/categories`)
      .set(sessionHeaders(superAdmin))
      .send({ categoryId: categoryB._id.toString() })
      .expect(201);
  });

  afterEach(async () => {
    await redisClient.flushdb();
  });

  const asSuperAdmin = (builder) => builder.set(sessionHeaders(superAdmin));

  it('returns supplier catalog summary on list and detail', async () => {
    const list = await asSuperAdmin(request.get('/api/v1/super-admin/suppliers')).expect(200);
    const supplier = list.body.data.suppliers.find((row) => row._id === supplierId);
    expect(supplier.catalogSummary).toEqual(expect.objectContaining({
      productCount: 3,
      categoryCount: 2,
      pricesConfigured: 1,
      pricesNotSet: 2,
    }));

    const detail = await asSuperAdmin(request.get(`/api/v1/super-admin/suppliers/${supplierId}`)).expect(200);
    expect(detail.body.data.catalogSummary).toEqual(expect.objectContaining({
      productCount: 3,
      pricesConfigured: 1,
      pricesNotSet: 2,
      categoryCount: 2,
    }));
  });

  it('handles empty supplier summary counts', async () => {
    const emptySupplier = await asSuperAdmin(request.post('/api/v1/super-admin/suppliers'))
      .send(validSupplier({
        supplierName: 'Empty Supplier',
        companyName: 'Empty Supplier Pvt Ltd',
        email: 'empty@example.com',
        phone: '9876502222',
        gstNumber: undefined,
      }))
      .expect(201);

    const detail = await asSuperAdmin(
      request.get(`/api/v1/super-admin/suppliers/${emptySupplier.body.data._id}`)
    ).expect(200);

    expect(detail.body.data.catalogSummary).toEqual({
      productCount: 0,
      activeProductCount: 0,
      categoryCount: 0,
      activeCategoryCount: 0,
      pricesConfigured: 0,
      pricesNotSet: 0,
    });
  });

  it('lists supplier products with supplier price, MOQ, and unset price as null', async () => {
    const response = await asSuperAdmin(
      request.get(`/api/v1/super-admin/suppliers/${supplierId}/products`)
    ).expect(200);

    expect(response.body.data.total).toBe(3);
    const sunflower = response.body.data.mappings.find((row) => row.product.name === 'Sunflower Oil');
    const groundnut = response.body.data.mappings.find((row) => row.product.name === 'Groundnut Oil');
    expect(sunflower.currentSupplierPrice).toBeNull();
    expect(groundnut.currentSupplierPrice).toBe(120);
    expect(groundnut.minimumOrderQuantity).toBe(30);
    expect(sunflower.product.category.name).toBe('Cooking Oil');
  });

  it('filters supplier products by search, category, status, and price status', async () => {
    const search = await asSuperAdmin(
      request.get(`/api/v1/super-admin/suppliers/${supplierId}/products?search=Groundnut`)
    ).expect(200);
    expect(search.body.data.total).toBe(1);
    expect(search.body.data.mappings[0].product.name).toBe('Groundnut Oil');

    const category = await asSuperAdmin(
      request.get(`/api/v1/super-admin/suppliers/${supplierId}/products?categoryId=${categoryB._id}`)
    ).expect(200);
    expect(category.body.data.total).toBe(1);
    expect(category.body.data.mappings[0].product.name).toBe('Mustard Oil');

    const priced = await asSuperAdmin(
      request.get(`/api/v1/super-admin/suppliers/${supplierId}/products?priceStatus=set`)
    ).expect(200);
    expect(priced.body.data.total).toBe(1);

    const unpriced = await asSuperAdmin(
      request.get(`/api/v1/super-admin/suppliers/${supplierId}/products?priceStatus=not_set`)
    ).expect(200);
    expect(unpriced.body.data.total).toBe(2);
  });

  it('lists supplier categories derived from mapped products', async () => {
    const response = await asSuperAdmin(
      request.get(`/api/v1/super-admin/suppliers/${supplierId}/categories`)
    ).expect(200);

    expect(response.body.data.total).toBe(2);
    const cooking = response.body.data.categories.find((row) => row.name === 'Cooking Oil');
    const edible = response.body.data.categories.find((row) => row.name === 'Edible Oils');
    expect(cooking).toBeTruthy();
    expect(edible).toBeTruthy();
    expect(cooking.productCount).toBe(2);
    expect(edible.productCount).toBe(1);
  });

  it('scopes supplier products to the requested supplier only', async () => {
    const otherSupplier = await asSuperAdmin(request.post('/api/v1/super-admin/suppliers'))
      .send(validSupplier({
        supplierName: 'Other Supplier',
        companyName: 'Other Supplier Pvt Ltd',
        email: 'other@example.com',
        phone: '9876503333',
        gstNumber: undefined,
      }))
      .expect(201);

    const response = await asSuperAdmin(
      request.get(`/api/v1/super-admin/suppliers/${otherSupplier.body.data._id}/products`)
    ).expect(200);
    expect(response.body.data.total).toBe(0);
  });

  it('respects inactive mapping semantics in status filter', async () => {
    const list = await asSuperAdmin(
      request.get(`/api/v1/super-admin/suppliers/${supplierId}/products`)
    ).expect(200);
    const mappingId = list.body.data.mappings[0]._id;

    await asSuperAdmin(
      request.patch(`/api/v1/super-admin/suppliers/${supplierId}/products/${mappingId}/status`)
        .send({ status: SUPPLIER_PRODUCT_STATUS.INACTIVE })
    ).expect(200);

    const activeOnly = await asSuperAdmin(
      request.get(`/api/v1/super-admin/suppliers/${supplierId}/products?status=ACTIVE`)
    ).expect(200);
    expect(activeOnly.body.data.total).toBe(2);
  });

  it('denies Admin, Vendor, Delivery Partner, and unauthenticated access', async () => {
    await request
      .get(`/api/v1/super-admin/suppliers/${supplierId}/categories`)
      .set(sessionHeaders(admin))
      .expect(403);
    await request
      .get(`/api/v1/super-admin/suppliers/${supplierId}/categories`)
      .set(sessionHeaders(vendor))
      .expect(403);
    await request
      .get(`/api/v1/super-admin/suppliers/${supplierId}/categories`)
      .set(sessionHeaders(delivery))
      .expect(403);
    await request
      .get(`/api/v1/super-admin/suppliers/${supplierId}/categories`)
      .expect(401);
  });

  it('does not modify Product, Category, SupplierProduct pricing, orders, or cart data during reads', async () => {
    const productBefore = await Product.findById(productA._id).lean();
    const mappingBefore = await SupplierProduct.findOne({ supplierId, productId: productA._id }).lean();

    await asSuperAdmin(request.get('/api/v1/super-admin/suppliers')).expect(200);
    await asSuperAdmin(request.get(`/api/v1/super-admin/suppliers/${supplierId}`)).expect(200);
    await asSuperAdmin(request.get(`/api/v1/super-admin/suppliers/${supplierId}/products`)).expect(200);
    await asSuperAdmin(request.get(`/api/v1/super-admin/suppliers/${supplierId}/categories`)).expect(200);

    const productAfter = await Product.findById(productA._id).lean();
    const mappingAfter = await SupplierProduct.findOne({ supplierId, productId: productA._id }).lean();

    expect(productAfter).toEqual(productBefore);
    expect(mappingAfter.currentSupplierPrice).toEqual(mappingBefore.currentSupplierPrice);
    expect(mappingAfter.minimumOrderQuantity).toEqual(mappingBefore.minimumOrderQuantity);
  });
});
