import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import mongoose from 'mongoose';
import supertest from 'supertest';
import app from '../../src/app.js';
import Audit from '../../src/modules/audit/audit.model.js';
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

describe('Super Admin supplier-product mapping - Phase 1.2', () => {
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
    product = await seedProduct(category._id, { name: 'Sunflower Oil', moq: 1 });
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

  const mappingPayload = (overrides = {}) => ({
    productId: product._id.toString(),
    minimumOrderQuantity: 50,
    notes: 'Available regularly',
    ...overrides,
  });

  it('allows Super Admin to create a supplier-product mapping', async () => {
    const supplierId = await createActiveSupplier();
    const response = await asSuperAdmin(request.post(`/api/v1/super-admin/suppliers/${supplierId}/products`))
      .send(mappingPayload())
      .expect(201);

    expect(response.body.success).toBe(true);
    expect(response.body.data.minimumOrderQuantity).toBe(50);
    expect(response.body.data.availabilityStatus).toBe(SUPPLIER_PRODUCT_STATUS.ACTIVE);
    expect(response.body.data.product.name).toBe('Sunflower Oil');
    expect(response.body.data.product).not.toHaveProperty('price');

    const Product = (await import('../../src/modules/product/product.model.js')).default;
    const storedProduct = await Product.findById(product._id);
    expect(storedProduct.moq).toBe(1);
    expect(storedProduct.price).toBe(1000);
  });

  it('denies Admin, Vendor, Delivery Partner, and unauthenticated mapping create', async () => {
    const supplierId = await createActiveSupplier();
    const payload = mappingPayload();

    await request
      .post(`/api/v1/super-admin/suppliers/${supplierId}/products`)
      .set(sessionHeaders(admin))
      .send(payload)
      .expect(403);
    await request
      .post(`/api/v1/super-admin/suppliers/${supplierId}/products`)
      .set(sessionHeaders(vendor))
      .send(payload)
      .expect(403);
    await request
      .post(`/api/v1/super-admin/suppliers/${supplierId}/products`)
      .set(sessionHeaders(delivery))
      .send(payload)
      .expect(403);
    await request
      .post(`/api/v1/super-admin/suppliers/${supplierId}/products`)
      .send(payload)
      .expect(401);
  });

  it('rejects mapping when supplier does not exist', async () => {
    const missingId = new mongoose.Types.ObjectId().toString();
    const response = await asSuperAdmin(request.post(`/api/v1/super-admin/suppliers/${missingId}/products`))
      .send(mappingPayload())
      .expect(404);
    expect(response.body.message).toMatch(/supplier not found/i);
  });

  it('rejects mapping when supplier is not ACTIVE', async () => {
    const pending = await asSuperAdmin(request.post('/api/v1/super-admin/suppliers'))
      .send(validSupplier({ email: 'pending-map@example.com', gstNumber: '29AAPFU0939F1Z5', supplierName: 'Pending Oils', companyName: 'Pending Oils Co' }))
      .expect(201);
    const pendingId = pending.body.data._id;

    const pendingRes = await asSuperAdmin(request.post(`/api/v1/super-admin/suppliers/${pendingId}/products`))
      .send(mappingPayload())
      .expect(400);
    expect(pendingRes.body.message).toBe('This supplier is not active.');

    await asSuperAdmin(request.patch(`/api/v1/super-admin/suppliers/${pendingId}/status`))
      .send({ status: SUPPLIER_STATUS.APPROVED })
      .expect(200);
    const approvedRes = await asSuperAdmin(request.post(`/api/v1/super-admin/suppliers/${pendingId}/products`))
      .send(mappingPayload())
      .expect(400);
    expect(approvedRes.body.message).toBe('This supplier is not active.');
  });

  it('rejects mapping when product does not exist', async () => {
    const supplierId = await createActiveSupplier();
    const response = await asSuperAdmin(request.post(`/api/v1/super-admin/suppliers/${supplierId}/products`))
      .send(mappingPayload({ productId: new mongoose.Types.ObjectId().toString() }))
      .expect(404);
    expect(response.body.message).toBe('Product not found');
  });

  it('rejects non-positive MOQ values', async () => {
    const supplierId = await createActiveSupplier();
    await asSuperAdmin(request.post(`/api/v1/super-admin/suppliers/${supplierId}/products`))
      .send(mappingPayload({ minimumOrderQuantity: 0 }))
      .expect(400);
    await asSuperAdmin(request.post(`/api/v1/super-admin/suppliers/${supplierId}/products`))
      .send(mappingPayload({ minimumOrderQuantity: -5 }))
      .expect(400);
    await asSuperAdmin(request.post(`/api/v1/super-admin/suppliers/${supplierId}/products`))
      .send(mappingPayload({ minimumOrderQuantity: 1.5 }))
      .expect(400);
  });

  it('rejects duplicate supplier-product mappings', async () => {
    const supplierId = await createActiveSupplier();
    await asSuperAdmin(request.post(`/api/v1/super-admin/suppliers/${supplierId}/products`))
      .send(mappingPayload())
      .expect(201);
    const duplicate = await asSuperAdmin(request.post(`/api/v1/super-admin/suppliers/${supplierId}/products`))
      .send(mappingPayload())
      .expect(400);
    expect(duplicate.body.message).toBe('This product is already mapped to this supplier.');
  });

  it('lists, views, and edits mappings without changing identity fields', async () => {
    const supplierId = await createActiveSupplier();
    const created = await asSuperAdmin(request.post(`/api/v1/super-admin/suppliers/${supplierId}/products`))
      .send(mappingPayload())
      .expect(201);
    const mappingId = created.body.data._id;

    const list = await asSuperAdmin(request.get(`/api/v1/super-admin/suppliers/${supplierId}/products`)).expect(200);
    expect(list.body.data.mappings).toHaveLength(1);

    const detail = await asSuperAdmin(
      request.get(`/api/v1/super-admin/suppliers/${supplierId}/products/${mappingId}`)
    ).expect(200);
    expect(detail.body.data.productId).toBe(product._id.toString());

    const updated = await asSuperAdmin(
      request.patch(`/api/v1/super-admin/suppliers/${supplierId}/products/${mappingId}`)
    )
      .send({
        minimumOrderQuantity: 20,
        notes: 'Updated note',
        productId: new mongoose.Types.ObjectId().toString(),
        supplierId: new mongoose.Types.ObjectId().toString(),
      })
      .expect(200);

    expect(updated.body.data.minimumOrderQuantity).toBe(20);
    expect(updated.body.data.notes).toBe('Updated note');
    expect(String(updated.body.data.productId)).toBe(String(product._id));
    expect(String(updated.body.data.supplierId)).toBe(String(supplierId));
  });

  it('activates and deactivates a mapping', async () => {
    const supplierId = await createActiveSupplier();
    const created = await asSuperAdmin(request.post(`/api/v1/super-admin/suppliers/${supplierId}/products`))
      .send(mappingPayload())
      .expect(201);
    const mappingId = created.body.data._id;

    const deactivated = await asSuperAdmin(
      request.patch(`/api/v1/super-admin/suppliers/${supplierId}/products/${mappingId}/status`)
    )
      .send({ status: SUPPLIER_PRODUCT_STATUS.INACTIVE })
      .expect(200);
    expect(deactivated.body.data.availabilityStatus).toBe(SUPPLIER_PRODUCT_STATUS.INACTIVE);

    const activated = await asSuperAdmin(
      request.patch(`/api/v1/super-admin/suppliers/${supplierId}/products/${mappingId}/status`)
    )
      .send({ status: SUPPLIER_PRODUCT_STATUS.ACTIVE })
      .expect(200);
    expect(activated.body.data.availabilityStatus).toBe(SUPPLIER_PRODUCT_STATUS.ACTIVE);
  });

  it('keeps existing mappings after the supplier becomes inactive and blocks new ones', async () => {
    const supplierId = await createActiveSupplier();
    const created = await asSuperAdmin(request.post(`/api/v1/super-admin/suppliers/${supplierId}/products`))
      .send(mappingPayload())
      .expect(201);

    await asSuperAdmin(request.patch(`/api/v1/super-admin/suppliers/${supplierId}/status`))
      .send({ status: SUPPLIER_STATUS.INACTIVE })
      .expect(200);

    const list = await asSuperAdmin(request.get(`/api/v1/super-admin/suppliers/${supplierId}/products`)).expect(200);
    expect(list.body.data.mappings).toHaveLength(1);
    expect(list.body.data.mappings[0]._id).toBe(created.body.data._id);

    const blocked = await asSuperAdmin(request.post(`/api/v1/super-admin/suppliers/${supplierId}/products`))
      .send(mappingPayload())
      .expect(400);
    expect(blocked.body.message).toBe('This supplier is not active.');
  });

  it('writes audit events for mapping create, update, activate, and deactivate', async () => {
    const supplierId = await createActiveSupplier();
    const created = await asSuperAdmin(request.post(`/api/v1/super-admin/suppliers/${supplierId}/products`))
      .send(mappingPayload())
      .expect(201);
    const mappingId = created.body.data._id;

    await asSuperAdmin(request.patch(`/api/v1/super-admin/suppliers/${supplierId}/products/${mappingId}`))
      .send({ notes: 'Audit note' })
      .expect(200);
    await asSuperAdmin(request.patch(`/api/v1/super-admin/suppliers/${supplierId}/products/${mappingId}/status`))
      .send({ status: SUPPLIER_PRODUCT_STATUS.INACTIVE })
      .expect(200);
    await asSuperAdmin(request.patch(`/api/v1/super-admin/suppliers/${supplierId}/products/${mappingId}/status`))
      .send({ status: SUPPLIER_PRODUCT_STATUS.ACTIVE })
      .expect(200);

    const actions = (await Audit.find({ entity: 'SUPPLIER_PRODUCT' })).map((log) => log.action);
    expect(actions).toEqual(expect.arrayContaining([
      'CREATE_SUPPLIER_PRODUCT',
      'UPDATE_SUPPLIER_PRODUCT',
      'DEACTIVATE_SUPPLIER_PRODUCT',
      'ACTIVATE_SUPPLIER_PRODUCT',
    ]));
  });

  it('rejects invalid IDs and invalid availability status', async () => {
    const supplierId = await createActiveSupplier();
    await asSuperAdmin(request.post(`/api/v1/super-admin/suppliers/${supplierId}/products`))
      .send(mappingPayload({ productId: 'not-a-valid-id' }))
      .expect(400);
    await asSuperAdmin(request.get(`/api/v1/super-admin/suppliers/${supplierId}/products/not-a-valid-id`))
      .expect(400);
    await asSuperAdmin(request.patch(`/api/v1/super-admin/suppliers/${supplierId}/products/not-a-valid-id/status`))
      .send({ status: 'UNKNOWN' })
      .expect(400);
  });

  it('does not delete mappings when listed after supplier deactivation', async () => {
    const supplierId = await createActiveSupplier();
    await asSuperAdmin(request.post(`/api/v1/super-admin/suppliers/${supplierId}/products`))
      .send(mappingPayload())
      .expect(201);
    await asSuperAdmin(request.patch(`/api/v1/super-admin/suppliers/${supplierId}/status`))
      .send({ status: SUPPLIER_STATUS.INACTIVE })
      .expect(200);

    const stored = await SupplierProduct.countDocuments({ supplierId });
    expect(stored).toBe(1);
  });
});
