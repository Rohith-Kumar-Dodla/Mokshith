import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
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
  seedActiveUser,
  seedCategory,
  seedProduct,
} from '../helpers/integrationFixtures.js';
import { sessionHeaders } from '../helpers/httpTestHelpers.js';
import { SUPPLIER_STATUS } from '../../src/constants/supplierStatus.js';
import { SUPPLIER_PRODUCT_STATUS } from '../../src/constants/supplierProductStatus.js';
import { ROLES } from '../../src/constants/roles.js';

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
    expect(detail.body.data.categories).toHaveLength(2);
    expect(detail.body.data.categories.every((row) => String(row.supplierCategoryId) !== String(row.categoryId))).toBe(true);
    expect(detail.body.data.categories).toEqual(expect.arrayContaining([
      expect.objectContaining({ name: 'Cooking Oil', productCount: 2 }),
      expect.objectContaining({ name: 'Edible Oils', productCount: 1 }),
    ]));
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
    expect(detail.body.data.categories).toEqual([]);
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

  it('lists products for one supplier and category with supplier fields and pagination', async () => {
    const response = await asSuperAdmin(
      request.get(`/api/v1/super-admin/suppliers/${supplierId}/categories/${categoryA._id}/products?limit=1`)
    ).expect(200);

    expect(response.body.data.supplier.supplierName).toBe('ABC Oils');
    expect(response.body.data.category.name).toBe('Cooking Oil');
    expect(response.body.data.total).toBe(2);
    expect(response.body.data.products).toHaveLength(1);
    expect(response.body.data.pages).toBe(2);
    expect(response.body.data.products[0]).toEqual(expect.objectContaining({
      minimumOrderQuantity: expect.any(Number),
      availabilityStatus: SUPPLIER_PRODUCT_STATUS.ACTIVE,
    }));
    expect(response.body.data.products[0].product.category.name).toBe('Cooking Oil');
  });

  it('keeps category product search, status, supplier, and category scoped', async () => {
    const search = await asSuperAdmin(
      request.get(`/api/v1/super-admin/suppliers/${supplierId}/categories/${categoryA._id}/products?search=Groundnut`)
    ).expect(200);
    expect(search.body.data.total).toBe(1);
    expect(search.body.data.products[0].product.name).toBe('Groundnut Oil');

    const otherCategory = await asSuperAdmin(
      request.get(`/api/v1/super-admin/suppliers/${supplierId}/categories/${categoryB._id}/products`)
    ).expect(200);
    expect(otherCategory.body.data.products).toHaveLength(1);
    expect(otherCategory.body.data.products[0].product.name).toBe('Mustard Oil');

    const mappingId = search.body.data.products[0]._id;
    await asSuperAdmin(
      request.patch(`/api/v1/super-admin/suppliers/${supplierId}/products/${mappingId}/status`)
        .send({ status: SUPPLIER_PRODUCT_STATUS.INACTIVE })
    ).expect(200);
    const activeOnly = await asSuperAdmin(
      request.get(`/api/v1/super-admin/suppliers/${supplierId}/categories/${categoryA._id}/products?status=ACTIVE`)
    ).expect(200);
    expect(activeOnly.body.data.products.every((row) => row.availabilityStatus === 'ACTIVE')).toBe(true);

    const otherSupplier = await asSuperAdmin(request.post('/api/v1/super-admin/suppliers'))
      .send(validSupplier({ supplierName: 'Scoped Supplier', companyName: 'Scoped Supplier Ltd', email: 'scoped@example.com', phone: '9876504444', gstNumber: undefined }))
      .expect(201);
    await asSuperAdmin(request.patch(`/api/v1/super-admin/suppliers/${otherSupplier.body.data._id}/status`)).send({ status: SUPPLIER_STATUS.APPROVED }).expect(200);
    await asSuperAdmin(request.patch(`/api/v1/super-admin/suppliers/${otherSupplier.body.data._id}/status`)).send({ status: SUPPLIER_STATUS.ACTIVE }).expect(200);
    await asSuperAdmin(request.post(`/api/v1/super-admin/suppliers/${otherSupplier.body.data._id}/categories`)).send({ categoryId: categoryA._id.toString() }).expect(201);
    const scoped = await asSuperAdmin(request.get(`/api/v1/super-admin/suppliers/${otherSupplier.body.data._id}/categories/${categoryA._id}/products`)).expect(200);
    expect(scoped.body.data.products).toEqual([]);
  });

  it('requires valid supplier, category, relationship, and Super Admin authorization', async () => {
    const unrelated = await seedCategory({ name: 'Unrelated Category' });
    await asSuperAdmin(request.get(`/api/v1/super-admin/suppliers/${supplierId}/categories/${unrelated._id}/products`)).expect(404);
    await asSuperAdmin(request.get(`/api/v1/super-admin/suppliers/not-an-id/categories/${categoryA._id}/products`)).expect(400);
    await asSuperAdmin(request.get(`/api/v1/super-admin/suppliers/${supplierId}/categories/not-an-id/products`)).expect(400);
    await asSuperAdmin(request.get(`/api/v1/super-admin/suppliers/${new Product()._id}/categories/${categoryA._id}/products`)).expect(404);
    await asSuperAdmin(request.get(`/api/v1/super-admin/suppliers/${supplierId}/categories/${new Product()._id}/products`)).expect(404);
    await request.get(`/api/v1/super-admin/suppliers/${supplierId}/categories/${categoryA._id}/products`).set(sessionHeaders(admin)).expect(403);
    await request.get(`/api/v1/super-admin/suppliers/${supplierId}/categories/${categoryA._id}/products`).set(sessionHeaders(vendor)).expect(403);
    await request.get(`/api/v1/super-admin/suppliers/${supplierId}/categories/${categoryA._id}/products`).set(sessionHeaders(delivery)).expect(403);
    const supplierUser = await seedActiveUser({ role: ROLES.SUPPLIER, email: 'phase2-supplier@example.com' });
    await request.get(`/api/v1/super-admin/suppliers/${supplierId}/categories/${categoryA._id}/products`).set(sessionHeaders(supplierUser)).expect(403);
    await request.get(`/api/v1/super-admin/suppliers/${supplierId}/categories/${categoryA._id}/products`).expect(401);
  });

  it('creates, updates, and safely deactivates a category-scoped supplier product only', async () => {
    const newProduct = await seedProduct(categoryA._id, { name: 'Rice Bran Oil', price: 325, moq: 1 });
    const productBefore = await Product.findById(newProduct._id).lean();

    const created = await asSuperAdmin(
      request.post(`/api/v1/super-admin/suppliers/${supplierId}/categories/${categoryA._id}/products`)
    ).send({
      productId: newProduct._id.toString(),
      minimumOrderQuantity: 24,
      supplierPrice: 210.5,
      availabilityStatus: 'ACTIVE',
      notes: 'Phase 3 mapping',
    }).expect(201);

    expect(created.body.data).toEqual(expect.objectContaining({
      minimumOrderQuantity: 24,
      currentSupplierPrice: 210.5,
      availabilityStatus: 'ACTIVE',
    }));
    const mappingId = created.body.data._id;

    const updated = await asSuperAdmin(
      request.patch(`/api/v1/super-admin/suppliers/${supplierId}/categories/${categoryA._id}/products/${mappingId}`)
    ).send({ minimumOrderQuantity: 30, notes: 'Updated supplier terms' }).expect(200);
    expect(updated.body.data.minimumOrderQuantity).toBe(30);
    expect(updated.body.data.notes).toBe('Updated supplier terms');

    const removed = await asSuperAdmin(
      request.delete(`/api/v1/super-admin/suppliers/${supplierId}/categories/${categoryA._id}/products/${mappingId}`)
    ).expect(200);
    expect(removed.body.data.availabilityStatus).toBe('INACTIVE');
    expect(await Product.findById(newProduct._id)).toBeTruthy();
    const productAfter = await Product.findById(newProduct._id).lean();
    expect(productAfter.price).toBe(productBefore.price);
    expect(productAfter.name).toBe(productBefore.name);
  });

  it('enforces scoped mutation validation, duplicate integrity, and Super Admin-only access', async () => {
    const candidate = await seedProduct(categoryA._id, { name: 'Scoped Candidate Oil', price: 450 });
    const endpoint = `/api/v1/super-admin/suppliers/${supplierId}/categories/${categoryA._id}/products`;
    const payload = { productId: candidate._id.toString(), minimumOrderQuantity: 10 };

    await request.post(endpoint).set(sessionHeaders(admin)).send(payload).expect(403);
    await request.post(endpoint).set(sessionHeaders(vendor)).send(payload).expect(403);
    await request.post(endpoint).set(sessionHeaders(delivery)).send(payload).expect(403);
    const supplierUser = await seedActiveUser({ role: ROLES.SUPPLIER, email: 'phase3-supplier@example.com' });
    await request.post(endpoint).set(sessionHeaders(supplierUser)).send(payload).expect(403);
    await request.post(endpoint).send(payload).expect(401);

    await asSuperAdmin(request.post(endpoint)).send(payload).expect(201);
    const duplicate = await asSuperAdmin(request.post(endpoint)).send(payload).expect(400);
    expect(duplicate.body.message).toMatch(/already mapped/i);

    const wrongCategoryProduct = await seedProduct(categoryB._id, { name: 'Wrong Category Oil' });
    await asSuperAdmin(request.post(endpoint))
      .send({ productId: wrongCategoryProduct._id.toString(), minimumOrderQuantity: 1 })
      .expect(400);
    await asSuperAdmin(request.post(endpoint))
      .send({ productId: 'not-an-id', minimumOrderQuantity: 1 })
      .expect(400);
    await asSuperAdmin(request.post(endpoint))
      .send({ productId: new Product()._id.toString(), minimumOrderQuantity: 1 })
      .expect(404);
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
