import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import supertest from 'supertest';
import app from '../../src/app.js';
import Product from '../../src/modules/product/product.model.js';
import Inventory from '../../src/modules/inventory/inventory.model.js';
import SupplierProduct from '../../src/modules/supplier/supplierProduct.model.js';
import { clearDatabase } from '../helpers/testUtils.js';
import { redisClient } from '../../src/config/redis.js';
import {
  seedSuperAdminUser,
  seedAdminUser,
  seedVendorUser,
  seedCategory,
  seedProduct,
} from '../helpers/integrationFixtures.js';
import { sessionHeaders } from '../helpers/httpTestHelpers.js';
import { SUPPLIER_STATUS } from '../../src/constants/supplierStatus.js';
import { CATALOG_SCOPE } from '../../src/constants/catalogScope.js';

const request = supertest(app);

const validSupplier = () => ({
  supplierName: 'ABC Oils',
  companyName: 'ABC Oils Pvt Ltd',
  contactPerson: 'Ravi',
  phone: '9876501111',
  email: 'abc-oils@example.com',
  gstNumber: '27AAPFU0939F1Z5',
});

describe('Product catalog visibility isolation - pre-lock fix', () => {
  let superAdmin;
  let admin;
  let vendor;
  let category;
  let existingProduct;
  let supplierId;
  let supplierCategoryId;

  const asSuperAdmin = (builder) => builder.set(sessionHeaders(superAdmin));
  const asAdmin = (builder) => builder.set(sessionHeaders(admin));
  const asVendor = (builder) => builder.set(sessionHeaders(vendor));

  async function activateSupplier(id) {
    await asSuperAdmin(request.patch(`/api/v1/super-admin/suppliers/${id}/status`))
      .send({ status: SUPPLIER_STATUS.APPROVED })
      .expect(200);
    await asSuperAdmin(request.patch(`/api/v1/super-admin/suppliers/${id}/status`))
      .send({ status: SUPPLIER_STATUS.ACTIVE })
      .expect(200);
  }

  async function createSupplierOnlyProduct(name = 'Groundnut Oil') {
    const response = await asSuperAdmin(
      request.post(`/api/v1/super-admin/suppliers/${supplierId}/products`)
    ).send({
      product: {
        name,
        price: 1800,
        description: 'Premium groundnut oil',
        moq: 1,
      },
      supplierCategoryId,
      minimumOrderQuantity: 40,
      supplierPrice: 120,
    }).expect(201);

    const product = await Product.findOne({ name });
    return { response: response.body.data, product };
  }

  beforeEach(async () => {
    await clearDatabase();
    await redisClient.flushdb();
    superAdmin = await seedSuperAdminUser();
    admin = await seedAdminUser();
    vendor = await seedVendorUser();
    category = await seedCategory({ name: 'Cooking Oil' });
    existingProduct = await seedProduct(category._id, {
      name: 'Sunflower Oil',
      moq: 1,
      price: 1500,
    });

    const created = await asSuperAdmin(request.post('/api/v1/super-admin/suppliers'))
      .send(validSupplier())
      .expect(201);
    supplierId = created.body.data._id;
    await activateSupplier(supplierId);

    const supplierCategory = await asSuperAdmin(
      request.post(`/api/v1/super-admin/suppliers/${supplierId}/categories`)
    ).send({ categoryId: category._id.toString() }).expect(201);
    supplierCategoryId = supplierCategory.body.data._id;
  });

  afterEach(async () => {
    await redisClient.flushdb();
  });

  it('creates admin products as CUSTOMER catalog scope', async () => {
    const response = await asAdmin(request.post('/api/v1/products'))
      .send({
        name: 'Admin Product',
        price: 500,
        stock: 10,
        categoryId: category._id.toString(),
        moq: 1,
      })
      .expect(200);

    expect(response.body.data.catalogScope || CATALOG_SCOPE.CUSTOMER).toBe(CATALOG_SCOPE.CUSTOMER);
  });

  it('treats legacy products without catalogScope as CUSTOMER', async () => {
    const legacy = await Product.create({
      name: 'Legacy Product',
      price: 400,
      stock: 5,
      categoryId: category._id,
      moq: 1,
      isActive: true,
    });
    await Product.updateOne({ _id: legacy._id }, { $unset: { catalogScope: 1 } });

    const list = await request.get('/api/v1/products').expect(200);
    const ids = (list.body.data.products || []).map((row) => String(row._id));
    expect(ids).toContain(String(legacy._id));
  });

  it('marks Phase 4.3 new supplier products as SUPPLIER_ONLY', async () => {
    const { product } = await createSupplierOnlyProduct();
    expect(product.catalogScope).toBe(CATALOG_SCOPE.SUPPLIER_ONLY);
  });

  it('does not change catalogScope when attaching an existing product', async () => {
    await asSuperAdmin(
      request.post(`/api/v1/super-admin/suppliers/${supplierId}/products`)
    ).send({
      productId: existingProduct._id.toString(),
      supplierCategoryId,
      minimumOrderQuantity: 50,
      supplierPrice: 100,
    }).expect(201);

    const after = await Product.findById(existingProduct._id).lean();
    expect(after.catalogScope == null || after.catalogScope === CATALOG_SCOPE.CUSTOMER).toBe(true);
  });

  it('excludes supplier-only products from GET /products', async () => {
    const { product } = await createSupplierOnlyProduct();

    const list = await request.get('/api/v1/products').expect(200);
    const ids = (list.body.data.products || []).map((row) => String(row._id));
    expect(ids).toContain(String(existingProduct._id));
    expect(ids).not.toContain(String(product._id));
  });

  it('excludes supplier-only products from search', async () => {
    const { product } = await createSupplierOnlyProduct('Searchable Supplier Oil');

    const search = await request.get('/api/v1/search?q=Searchable').expect(200);
    const ids = (search.body.data || []).map((row) => String(row._id));
    expect(ids).not.toContain(String(product._id));
  });

  it('blocks vendor access to supplier-only product detail', async () => {
    const { product } = await createSupplierOnlyProduct();

    await request.get(`/api/v1/products/${product._id}`).expect(404);
    await asVendor(request.get(`/api/v1/products/${product._id}`)).expect(404);
  });

  it('blocks adding supplier-only products to cart', async () => {
    const { product } = await createSupplierOnlyProduct();

    await asVendor(
      request.post('/api/v1/cart')
    ).send({ productId: product._id.toString(), quantity: 1 }).expect(400);
  });

  it('blocks adding supplier-only products to wishlist', async () => {
    const { product } = await createSupplierOnlyProduct();

    await asVendor(
      request.post('/api/v1/wishlist/add')
    ).send({ productId: product._id.toString() }).expect(400);
  });

  it('keeps supplier-only products visible in Super Admin supplier product API', async () => {
    const { response } = await createSupplierOnlyProduct('Visible Supplier Oil');

    const list = await asSuperAdmin(
      request.get(`/api/v1/super-admin/suppliers/${supplierId}/products`)
    ).expect(200);

    const names = (list.body.data.mappings || []).map((row) => row.product?.name);
    expect(names).toContain('Visible Supplier Oil');
    expect(response.product.catalogScope).toBe(CATALOG_SCOPE.SUPPLIER_ONLY);
  });

  it('keeps existing mapped products visible to vendor catalog', async () => {
    await asSuperAdmin(
      request.post(`/api/v1/super-admin/suppliers/${supplierId}/products`)
    ).send({
      productId: existingProduct._id.toString(),
      supplierCategoryId,
      minimumOrderQuantity: 50,
      supplierPrice: 100,
    }).expect(201);

    const list = await request.get('/api/v1/products').expect(200);
    const ids = (list.body.data.products || []).map((row) => String(row._id));
    expect(ids).toContain(String(existingProduct._id));

    await request.get(`/api/v1/products/${existingProduct._id}`).expect(200);
  });

  it('still provisions inventory for supplier-only products', async () => {
    const { product } = await createSupplierOnlyProduct();
    const inventory = await Inventory.findOne({ productId: product._id });
    expect(inventory).toBeTruthy();
  });

  it('allows supplier-only products to participate in supplier product search', async () => {
    await createSupplierOnlyProduct('Procurement Oil');

    const search = await asSuperAdmin(
      request.get(`/api/v1/super-admin/suppliers/${supplierId}/products/search?q=Procurement`)
    ).expect(200);

    const names = (search.body.data.products || []).map((row) => row.name);
    expect(names).toContain('Procurement Oil');
  });

  it('excludes supplier-only products from category-filtered product list', async () => {
    await createSupplierOnlyProduct('Category Hidden Oil');

    const list = await request
      .get(`/api/v1/products?categoryId=${category._id}`)
      .expect(200);
    const names = (list.body.data.products || []).map((row) => row.name);
    expect(names).toContain('Sunflower Oil');
    expect(names).not.toContain('Category Hidden Oil');
  });

  it('denies non Super Admin access to supplier product creation', async () => {
    await asAdmin(
      request.post(`/api/v1/super-admin/suppliers/${supplierId}/products`)
    ).send({
      product: { name: 'Blocked Oil', price: 1000, moq: 1 },
      supplierCategoryId,
      minimumOrderQuantity: 10,
      supplierPrice: 50,
    }).expect(403);
  });
});
