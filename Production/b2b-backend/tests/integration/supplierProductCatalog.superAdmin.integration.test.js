import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import supertest from 'supertest';
import app from '../../src/app.js';
import Audit from '../../src/modules/audit/audit.model.js';
import Product from '../../src/modules/product/product.model.js';
import SupplierProduct from '../../src/modules/supplier/supplierProduct.model.js';
import SupplierProductPriceHistory from '../../src/modules/supplier/supplierProductPriceHistory.model.js';
import Inventory from '../../src/modules/inventory/inventory.model.js';
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

describe('Super Admin supplier product creation - Phase 4.3', () => {
  let superAdmin;
  let admin;
  let vendor;
  let delivery;
  let category;
  let existingProduct;
  let supplierId;
  let supplierCategoryId;

  beforeEach(async () => {
    await clearDatabase();
    await redisClient.flushdb();
    superAdmin = await seedSuperAdminUser();
    admin = await seedAdminUser();
    vendor = await seedVendorUser();
    delivery = await seedDeliveryPartner();
    category = await seedCategory({ name: 'Cooking Oil' });
    existingProduct = await seedProduct(category._id, {
      name: 'Sunflower Oil',
      moq: 1,
      price: 1500,
    });

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

    const supplierCategory = await request
      .post(`/api/v1/super-admin/suppliers/${supplierId}/categories`)
      .set(sessionHeaders(superAdmin))
      .send({ categoryId: category._id.toString() })
      .expect(201);
    supplierCategoryId = supplierCategory.body.data._id;
  });

  afterEach(async () => {
    await redisClient.flushdb();
  });

  const asSuperAdmin = (builder) => builder.set(sessionHeaders(superAdmin));

  it('searches existing products with identifying information', async () => {
    const response = await asSuperAdmin(
      request.get(`/api/v1/super-admin/suppliers/${supplierId}/products/search?search=Sunflower`)
    ).expect(200);

    expect(response.body.data.products.length).toBeGreaterThan(0);
    const row = response.body.data.products[0];
    expect(row.name).toBe('Sunflower Oil');
    expect(row.category.name).toBe('Cooking Oil');
    expect(row.alreadyMapped).toBe(false);
  });

  it('attaches an existing product without modifying the canonical Product', async () => {
    const before = await Product.findById(existingProduct._id).lean();

    const response = await asSuperAdmin(
      request.post(`/api/v1/super-admin/suppliers/${supplierId}/products`)
    )
      .send({
        productId: existingProduct._id.toString(),
        supplierCategoryId,
        minimumOrderQuantity: 50,
        supplierPrice: 100,
      })
      .expect(201);

    expect(response.body.data.minimumOrderQuantity).toBe(50);
    expect(response.body.data.currentSupplierPrice).toBe(100);
    expect(response.body.data.product.name).toBe('Sunflower Oil');

    const after = await Product.findById(existingProduct._id).lean();
    expect(after.name).toBe(before.name);
    expect(after.price).toBe(before.price);
    expect(after.moq).toBe(before.moq);
    expect(after.categoryId.toString()).toBe(before.categoryId.toString());

    const history = await SupplierProductPriceHistory.findOne({
      supplierProductId: response.body.data._id,
    });
    expect(history).toBeTruthy();
    expect(history.previousPrice).toBeNull();
    expect(Number(history.price)).toBe(100);
  });

  it('creates a new canonical Product and SupplierProduct mapping', async () => {
    const response = await asSuperAdmin(
      request.post(`/api/v1/super-admin/suppliers/${supplierId}/products`)
    )
      .send({
        product: {
          name: 'Groundnut Oil',
          price: 1800,
          description: 'Premium groundnut oil',
          moq: 1,
        },
        supplierCategoryId,
        minimumOrderQuantity: 40,
        supplierPrice: 120,
      })
      .expect(201);

    expect(response.body.data.product.name).toBe('Groundnut Oil');
    expect(response.body.data.minimumOrderQuantity).toBe(40);
    expect(response.body.data.currentSupplierPrice).toBe(120);

    const product = await Product.findOne({ name: 'Groundnut Oil' });
    expect(product).toBeTruthy();
    expect(product.price).toBe(1800);
    expect(product.moq).toBe(1);

    const inventory = await Inventory.findOne({ productId: product._id });
    expect(inventory).toBeTruthy();
  });

  it('rejects duplicate supplier-product mappings', async () => {
    const payload = {
      productId: existingProduct._id.toString(),
      supplierCategoryId,
      minimumOrderQuantity: 50,
    };

    await asSuperAdmin(request.post(`/api/v1/super-admin/suppliers/${supplierId}/products`))
      .send(payload)
      .expect(201);

    const duplicate = await asSuperAdmin(request.post(`/api/v1/super-admin/suppliers/${supplierId}/products`))
      .send(payload)
      .expect(400);

    expect(duplicate.body.message).toMatch(/already mapped/i);
  });

  it('allows multiple suppliers to map the same canonical Product', async () => {
    const otherSupplier = await asSuperAdmin(request.post('/api/v1/super-admin/suppliers'))
      .send(validSupplier({
        supplierName: 'XYZ Traders',
        companyName: 'XYZ Traders Pvt Ltd',
        email: 'xyz@example.com',
        phone: '9876502222',
        gstNumber: undefined,
      }))
      .expect(201);

    const otherSupplierId = otherSupplier.body.data._id;
    await asSuperAdmin(request.patch(`/api/v1/super-admin/suppliers/${otherSupplierId}/status`))
      .send({ status: SUPPLIER_STATUS.APPROVED })
      .expect(200);
    await asSuperAdmin(request.patch(`/api/v1/super-admin/suppliers/${otherSupplierId}/status`))
      .send({ status: SUPPLIER_STATUS.ACTIVE })
      .expect(200);

    const otherCategory = await asSuperAdmin(
      request.post(`/api/v1/super-admin/suppliers/${otherSupplierId}/categories`)
    )
      .send({ categoryId: category._id.toString() })
      .expect(201);

    await asSuperAdmin(request.post(`/api/v1/super-admin/suppliers/${supplierId}/products`))
      .send({
        productId: existingProduct._id.toString(),
        supplierCategoryId,
        minimumOrderQuantity: 30,
      })
      .expect(201);

    await asSuperAdmin(request.post(`/api/v1/super-admin/suppliers/${otherSupplierId}/products`))
      .send({
        productId: existingProduct._id.toString(),
        supplierCategoryId: otherCategory.body.data._id,
        minimumOrderQuantity: 20,
      })
      .expect(201);

    expect(await SupplierProduct.countDocuments({ productId: existingProduct._id })).toBe(2);
  });

  it('rejects invalid supplier category and inactive supplier creation', async () => {
    await asSuperAdmin(request.post(`/api/v1/super-admin/suppliers/${supplierId}/products`))
      .send({
        productId: existingProduct._id.toString(),
        supplierCategoryId: '64b000000000000000000099',
        minimumOrderQuantity: 50,
      })
      .expect(400);

    const pending = await asSuperAdmin(request.post('/api/v1/super-admin/suppliers'))
      .send(validSupplier({
        supplierName: 'Pending Supplier',
        companyName: 'Pending Supplier Pvt Ltd',
        email: 'pending@example.com',
        phone: '9876503333',
        gstNumber: undefined,
      }))
      .expect(201);

    await asSuperAdmin(request.post(`/api/v1/super-admin/suppliers/${pending.body.data._id}/products`))
      .send({
        productId: existingProduct._id.toString(),
        supplierCategoryId,
        minimumOrderQuantity: 50,
      })
      .expect(400);
  });

  it('denies non Super Admin access and records create audit', async () => {
    const payload = {
      productId: existingProduct._id.toString(),
      supplierCategoryId,
      minimumOrderQuantity: 50,
    };

    await request
      .post(`/api/v1/super-admin/suppliers/${supplierId}/products`)
      .set(sessionHeaders(admin))
      .send(payload)
      .expect(403);

    const response = await asSuperAdmin(request.post(`/api/v1/super-admin/suppliers/${supplierId}/products`))
      .send(payload)
      .expect(201);

    const audits = await Audit.find({
      entity: 'SUPPLIER_PRODUCT',
      entityId: response.body.data._id,
    });
    expect(audits.some((entry) => entry.action === 'CREATE_SUPPLIER_PRODUCT')).toBe(true);
  });
});
