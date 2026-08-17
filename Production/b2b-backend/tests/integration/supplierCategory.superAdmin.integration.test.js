import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import supertest from 'supertest';
import app from '../../src/app.js';
import Audit from '../../src/modules/audit/audit.model.js';
import Category from '../../src/modules/category/category.model.js';
import SupplierCategory from '../../src/modules/supplier/supplierCategory.model.js';
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
import { SUPPLIER_CATEGORY_STATUS } from '../../src/constants/supplierCategoryStatus.js';

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

describe('Super Admin supplier category management - Phase 4.2', () => {
  let superAdmin;
  let admin;
  let vendor;
  let delivery;
  let categoryA;
  let categoryB;
  let productA;
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
  });

  afterEach(async () => {
    await redisClient.flushdb();
  });

  const asSuperAdmin = (builder) => builder.set(sessionHeaders(superAdmin));

  it('allows Super Admin to associate an existing global category with a supplier', async () => {
    const response = await asSuperAdmin(
      request.post(`/api/v1/super-admin/suppliers/${supplierId}/categories`)
    )
      .send({ categoryId: categoryA._id.toString() })
      .expect(201);

    expect(response.body.success).toBe(true);
    expect(response.body.data.categoryId).toBe(categoryA._id.toString());
    expect(response.body.data.name).toBe('Cooking Oil');
    expect(response.body.data.status).toBe(SUPPLIER_CATEGORY_STATUS.ACTIVE);

    const stored = await SupplierCategory.findOne({ supplierId, categoryId: categoryA._id });
    expect(stored).toBeTruthy();
  });

  it('prevents duplicate supplier-category associations', async () => {
    await asSuperAdmin(
      request.post(`/api/v1/super-admin/suppliers/${supplierId}/categories`)
    )
      .send({ categoryId: categoryA._id.toString() })
      .expect(201);

    const duplicate = await asSuperAdmin(
      request.post(`/api/v1/super-admin/suppliers/${supplierId}/categories`)
    )
      .send({ categoryId: categoryA._id.toString() })
      .expect(400);

    expect(duplicate.body.message).toMatch(/already associated/i);
  });

  it('lists explicit supplier categories with product counts and updates supplier summary', async () => {
    await asSuperAdmin(request.post(`/api/v1/super-admin/suppliers/${supplierId}/products`))
      .send({ productId: productA._id.toString(), minimumOrderQuantity: 50 })
      .expect(201);

    await asSuperAdmin(
      request.post(`/api/v1/super-admin/suppliers/${supplierId}/categories`)
    )
      .send({ categoryId: categoryA._id.toString() })
      .expect(201);
    await asSuperAdmin(
      request.post(`/api/v1/super-admin/suppliers/${supplierId}/categories`)
    )
      .send({ categoryId: categoryB._id.toString() })
      .expect(201);

    const list = await asSuperAdmin(
      request.get(`/api/v1/super-admin/suppliers/${supplierId}/categories`)
    ).expect(200);

    expect(list.body.data.total).toBe(2);
    const cooking = list.body.data.categories.find((row) => row.name === 'Cooking Oil');
    expect(cooking.productCount).toBe(1);

    const detail = await asSuperAdmin(
      request.get(`/api/v1/super-admin/suppliers/${supplierId}`)
    ).expect(200);
    expect(detail.body.data.catalogSummary.categoryCount).toBe(2);
  });

  it('allows the same global category to be associated with different suppliers', async () => {
    const otherSupplier = await asSuperAdmin(request.post('/api/v1/super-admin/suppliers'))
      .send(validSupplier({
        supplierName: 'XYZ Traders',
        companyName: 'XYZ Traders Pvt Ltd',
        email: 'xyz@example.com',
        phone: '9876502222',
        gstNumber: undefined,
      }))
      .expect(201);

    await asSuperAdmin(
      request.patch(`/api/v1/super-admin/suppliers/${otherSupplier.body.data._id}/status`)
    )
      .send({ status: SUPPLIER_STATUS.APPROVED })
      .expect(200);
    await asSuperAdmin(
      request.patch(`/api/v1/super-admin/suppliers/${otherSupplier.body.data._id}/status`)
    )
      .send({ status: SUPPLIER_STATUS.ACTIVE })
      .expect(200);

    await asSuperAdmin(
      request.post(`/api/v1/super-admin/suppliers/${supplierId}/categories`)
    )
      .send({ categoryId: categoryA._id.toString() })
      .expect(201);

    await asSuperAdmin(
      request.post(`/api/v1/super-admin/suppliers/${otherSupplier.body.data._id}/categories`)
    )
      .send({ categoryId: categoryA._id.toString() })
      .expect(201);

    expect(await SupplierCategory.countDocuments({ categoryId: categoryA._id })).toBe(2);
  });

  it('activates and deactivates supplier category associations', async () => {
    const created = await asSuperAdmin(
      request.post(`/api/v1/super-admin/suppliers/${supplierId}/categories`)
    )
      .send({ categoryId: categoryA._id.toString() })
      .expect(201);

    const mappingId = created.body.data._id;

    await asSuperAdmin(
      request.patch(`/api/v1/super-admin/suppliers/${supplierId}/categories/${mappingId}/status`)
    )
      .send({ status: SUPPLIER_CATEGORY_STATUS.INACTIVE })
      .expect(200);

    const inactiveList = await asSuperAdmin(
      request.get(`/api/v1/super-admin/suppliers/${supplierId}/categories?status=INACTIVE`)
    ).expect(200);
    expect(inactiveList.body.data.total).toBe(1);

    await asSuperAdmin(
      request.patch(`/api/v1/super-admin/suppliers/${supplierId}/categories/${mappingId}/status`)
    )
      .send({ status: SUPPLIER_CATEGORY_STATUS.ACTIVE })
      .expect(200);
  });

  it('blocks category association for inactive suppliers', async () => {
    const pendingSupplier = await asSuperAdmin(request.post('/api/v1/super-admin/suppliers'))
      .send(validSupplier({
        supplierName: 'Pending Supplier',
        companyName: 'Pending Supplier Pvt Ltd',
        email: 'pending@example.com',
        phone: '9876503333',
        gstNumber: undefined,
      }))
      .expect(201);

    await asSuperAdmin(
      request.post(`/api/v1/super-admin/suppliers/${pendingSupplier.body.data._id}/categories`)
    )
      .send({ categoryId: categoryA._id.toString() })
      .expect(400);
  });

  it('denies Admin, Vendor, Delivery Partner, and unauthenticated access', async () => {
    await request
      .post(`/api/v1/super-admin/suppliers/${supplierId}/categories`)
      .set(sessionHeaders(admin))
      .send({ categoryId: categoryA._id.toString() })
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

  it('does not modify global Category documents when managing supplier categories', async () => {
    const categoryBefore = await Category.findById(categoryA._id).lean();

    await asSuperAdmin(
      request.post(`/api/v1/super-admin/suppliers/${supplierId}/categories`)
    )
      .send({ categoryId: categoryA._id.toString() })
      .expect(201);

    await asSuperAdmin(
      request.get(`/api/v1/super-admin/suppliers/${supplierId}/categories`)
    ).expect(200);

    const categoryAfter = await Category.findById(categoryA._id).lean();
    expect(categoryAfter).toEqual(categoryBefore);
  });

  it('writes audit events for supplier category create and status changes', async () => {
    const created = await asSuperAdmin(
      request.post(`/api/v1/super-admin/suppliers/${supplierId}/categories`)
    )
      .send({ categoryId: categoryA._id.toString() })
      .expect(201);

    await asSuperAdmin(
      request.patch(`/api/v1/super-admin/suppliers/${supplierId}/categories/${created.body.data._id}/status`)
    )
      .send({ status: SUPPLIER_CATEGORY_STATUS.INACTIVE })
      .expect(200);

    const audits = await Audit.find({ entity: 'SUPPLIER_CATEGORY' }).sort({ createdAt: 1 });
    expect(audits.some((entry) => entry.action === 'CREATE_SUPPLIER_CATEGORY')).toBe(true);
    expect(audits.some((entry) => entry.action === 'DEACTIVATE_SUPPLIER_CATEGORY')).toBe(true);
  });
});
