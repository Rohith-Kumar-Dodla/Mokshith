import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import supertest from 'supertest';
import app from '../../src/app.js';
import Audit from '../../src/modules/audit/audit.model.js';
import Supplier from '../../src/modules/supplier/supplier.model.js';
import { clearDatabase } from '../helpers/testUtils.js';
import { redisClient } from '../../src/config/redis.js';
import {
  seedSuperAdminUser,
  seedAdminUser,
  seedVendorUser,
  seedDeliveryPartner,
} from '../helpers/integrationFixtures.js';
import { sessionHeaders } from '../helpers/httpTestHelpers.js';
import { ROLES } from '../../src/constants/roles.js';
import { SUPPLIER_STATUS } from '../../src/constants/supplierStatus.js';
import { hasPermission, PERMISSIONS } from '../../src/constants/permissions.js';

const request = supertest(app);

const validSupplier = (overrides = {}) => ({
  supplierName: 'Sunrise Staples',
  companyName: 'Sunrise Staples Pvt Ltd',
  contactPerson: 'Asha Rao',
  phone: '9876501234',
  email: 'sunrise@example.com',
  businessAddress: '12 Market Road, Hyderabad',
  gstNumber: '27AAPFU0939F1Z5',
  notes: 'Preferred dry goods supplier',
  ...overrides,
});

describe('Super Admin Supplier onboarding - Phase 1.1', () => {
  let superAdmin;
  let admin;
  let vendor;
  let delivery;

  beforeEach(async () => {
    await clearDatabase();
    await redisClient.flushdb();
    superAdmin = await seedSuperAdminUser();
    admin = await seedAdminUser();
    vendor = await seedVendorUser();
    delivery = await seedDeliveryPartner();
  });

  afterEach(async () => {
    await redisClient.flushdb();
  });

  const asSuperAdmin = (builder) => builder.set(sessionHeaders(superAdmin));

  it('allows Super Admin to create a supplier', async () => {
    const response = await asSuperAdmin(request.post('/api/v1/super-admin/suppliers'))
      .send(validSupplier())
      .expect(201);

    expect(response.body.success).toBe(true);
    expect(response.body.data.supplierName).toBe('Sunrise Staples');
    expect(response.body.data.companyName).toBe('Sunrise Staples Pvt Ltd');
    expect(response.body.data.status).toBe(SUPPLIER_STATUS.PENDING);
    expect(response.body.data.role).toBe(ROLES.SUPPLIER);
    expect(response.body.data.userId).toBeNull();

    const stored = await Supplier.findById(response.body.data._id);
    expect(stored).toBeTruthy();
    expect(stored.phone).toBe('9876501234');
  });

  it('denies Admin, Vendor, Delivery Partner, and unauthenticated create', async () => {
    const payload = validSupplier({ email: 'denied@example.com', gstNumber: '29AAPFU0939F1Z5' });

    await request
      .post('/api/v1/super-admin/suppliers')
      .set(sessionHeaders(admin))
      .send(payload)
      .expect(403);

    await request
      .post('/api/v1/super-admin/suppliers')
      .set(sessionHeaders(vendor))
      .send({ ...payload, email: 'vendor-denied@example.com' })
      .expect(403);

    await request
      .post('/api/v1/super-admin/suppliers')
      .set(sessionHeaders(delivery))
      .send({ ...payload, email: 'delivery-denied@example.com' })
      .expect(403);

    await request.post('/api/v1/super-admin/suppliers').send(payload).expect(401);
  });

  it('allows Super Admin to retrieve suppliers and supplier details', async () => {
    const created = await asSuperAdmin(request.post('/api/v1/super-admin/suppliers'))
      .send(validSupplier())
      .expect(201);

    const list = await asSuperAdmin(request.get('/api/v1/super-admin/suppliers')).expect(200);
    expect(list.body.data.suppliers).toHaveLength(1);
    expect(list.body.data.suppliers[0].supplierName).toBe('Sunrise Staples');

    const detail = await asSuperAdmin(
      request.get(`/api/v1/super-admin/suppliers/${created.body.data._id}`)
    ).expect(200);
    expect(detail.body.data.companyName).toBe('Sunrise Staples Pvt Ltd');
    expect(detail.body.data.gstNumber).toBe('27AAPFU0939F1Z5');
  });

  it('denies non-Super Admin retrieve', async () => {
    const created = await asSuperAdmin(request.post('/api/v1/super-admin/suppliers'))
      .send(validSupplier())
      .expect(201);

    await request.get('/api/v1/super-admin/suppliers').set(sessionHeaders(admin)).expect(403);
    await request
      .get(`/api/v1/super-admin/suppliers/${created.body.data._id}`)
      .set(sessionHeaders(vendor))
      .expect(403);
    await request.get('/api/v1/super-admin/suppliers').expect(401);
  });

  it('allows Super Admin to edit supplier without changing status or id', async () => {
    const created = await asSuperAdmin(request.post('/api/v1/super-admin/suppliers'))
      .send(validSupplier())
      .expect(201);

    const originalId = created.body.data._id;
    const originalCreatedAt = created.body.data.createdAt;

    const updated = await asSuperAdmin(
      request.patch(`/api/v1/super-admin/suppliers/${originalId}`)
    )
      .send({
        contactPerson: 'Ravi Kumar',
        notes: 'Updated notes',
        status: SUPPLIER_STATUS.ACTIVE,
      })
      .expect(200);

    expect(updated.body.data._id).toBe(originalId);
    expect(updated.body.data.contactPerson).toBe('Ravi Kumar');
    expect(updated.body.data.notes).toBe('Updated notes');
    expect(updated.body.data.status).toBe(SUPPLIER_STATUS.PENDING);
    expect(new Date(updated.body.data.createdAt).getTime()).toBe(new Date(originalCreatedAt).getTime());
  });

  it('approves, activates, and deactivates suppliers with valid transitions', async () => {
    const created = await asSuperAdmin(request.post('/api/v1/super-admin/suppliers'))
      .send(validSupplier())
      .expect(201);
    const id = created.body.data._id;

    const approved = await asSuperAdmin(request.patch(`/api/v1/super-admin/suppliers/${id}/status`))
      .send({ status: SUPPLIER_STATUS.APPROVED })
      .expect(200);
    expect(approved.body.data.status).toBe(SUPPLIER_STATUS.APPROVED);

    const activated = await asSuperAdmin(request.patch(`/api/v1/super-admin/suppliers/${id}/status`))
      .send({ status: SUPPLIER_STATUS.ACTIVE })
      .expect(200);
    expect(activated.body.data.status).toBe(SUPPLIER_STATUS.ACTIVE);

    const deactivated = await asSuperAdmin(request.patch(`/api/v1/super-admin/suppliers/${id}/status`))
      .send({ status: SUPPLIER_STATUS.INACTIVE })
      .expect(200);
    expect(deactivated.body.data.status).toBe(SUPPLIER_STATUS.INACTIVE);

    const reactivated = await asSuperAdmin(request.patch(`/api/v1/super-admin/suppliers/${id}/status`))
      .send({ status: SUPPLIER_STATUS.ACTIVE })
      .expect(200);
    expect(reactivated.body.data.status).toBe(SUPPLIER_STATUS.ACTIVE);
  });

  it('rejects invalid status transitions', async () => {
    const created = await asSuperAdmin(request.post('/api/v1/super-admin/suppliers'))
      .send(validSupplier())
      .expect(201);
    const id = created.body.data._id;

    const response = await asSuperAdmin(request.patch(`/api/v1/super-admin/suppliers/${id}/status`))
      .send({ status: SUPPLIER_STATUS.ACTIVE })
      .expect(400);

    expect(response.body.success).toBe(false);
    expect(response.body.message).toMatch(/invalid supplier status transition/i);
  });

  it('rejects invalid supplier data', async () => {
    await asSuperAdmin(request.post('/api/v1/super-admin/suppliers'))
      .send(validSupplier({ supplierName: '' }))
      .expect(400);

    await asSuperAdmin(request.post('/api/v1/super-admin/suppliers'))
      .send(validSupplier({ companyName: '' }))
      .expect(400);

    await asSuperAdmin(request.post('/api/v1/super-admin/suppliers'))
      .send(validSupplier({ phone: '12345' }))
      .expect(400);

    await asSuperAdmin(request.post('/api/v1/super-admin/suppliers'))
      .send(validSupplier({ email: 'not-an-email' }))
      .expect(400);

    await asSuperAdmin(request.post('/api/v1/super-admin/suppliers'))
      .send(validSupplier({ gstNumber: 'INVALIDGST' }))
      .expect(400);

    await asSuperAdmin(request.get('/api/v1/super-admin/suppliers/not-a-valid-id')).expect(400);

    await asSuperAdmin(request.patch('/api/v1/super-admin/suppliers/not-a-valid-id/status'))
      .send({ status: 'UNKNOWN' })
      .expect(400);
  });

  it('rejects duplicate supplier name, company, email, and GST', async () => {
    await asSuperAdmin(request.post('/api/v1/super-admin/suppliers'))
      .send(validSupplier())
      .expect(201);

    const duplicateName = await asSuperAdmin(request.post('/api/v1/super-admin/suppliers'))
      .send(validSupplier({
        companyName: 'Other Co',
        email: 'other@example.com',
        gstNumber: '29AAPFU0939F1Z5',
      }))
      .expect(400);
    expect(duplicateName.body.message).toMatch(/name already exists/i);

    const duplicateCompany = await asSuperAdmin(request.post('/api/v1/super-admin/suppliers'))
      .send(validSupplier({
        supplierName: 'Other Supplier',
        email: 'other2@example.com',
        gstNumber: '29AAPFU0939F1Z5',
      }))
      .expect(400);
    expect(duplicateCompany.body.message).toMatch(/company name already exists/i);

    const duplicateEmail = await asSuperAdmin(request.post('/api/v1/super-admin/suppliers'))
      .send(validSupplier({
        supplierName: 'Other Supplier',
        companyName: 'Other Co',
        gstNumber: '29AAPFU0939F1Z5',
      }))
      .expect(400);
    expect(duplicateEmail.body.message).toMatch(/email already exists/i);

    const duplicateGst = await asSuperAdmin(request.post('/api/v1/super-admin/suppliers'))
      .send(validSupplier({
        supplierName: 'Other Supplier',
        companyName: 'Other Co',
        email: 'other3@example.com',
      }))
      .expect(400);
    expect(duplicateGst.body.message).toMatch(/gst number already exists/i);
  });

  it('allows two suppliers to share a phone number', async () => {
    await asSuperAdmin(request.post('/api/v1/super-admin/suppliers'))
      .send(validSupplier())
      .expect(201);

    await asSuperAdmin(request.post('/api/v1/super-admin/suppliers'))
      .send(validSupplier({
        supplierName: 'Second Supplier',
        companyName: 'Second Co',
        email: 'second@example.com',
        gstNumber: '29AAPFU0939F1Z5',
        phone: '9876501234',
      }))
      .expect(201);
  });

  it('writes audit events for create, edit, approve, activate, and deactivate', async () => {
    const created = await asSuperAdmin(request.post('/api/v1/super-admin/suppliers'))
      .send(validSupplier())
      .expect(201);
    const id = created.body.data._id;

    await asSuperAdmin(request.patch(`/api/v1/super-admin/suppliers/${id}`))
      .send({ notes: 'Audit edit' })
      .expect(200);
    await asSuperAdmin(request.patch(`/api/v1/super-admin/suppliers/${id}/status`))
      .send({ status: SUPPLIER_STATUS.APPROVED })
      .expect(200);
    await asSuperAdmin(request.patch(`/api/v1/super-admin/suppliers/${id}/status`))
      .send({ status: SUPPLIER_STATUS.ACTIVE })
      .expect(200);
    await asSuperAdmin(request.patch(`/api/v1/super-admin/suppliers/${id}/status`))
      .send({ status: SUPPLIER_STATUS.INACTIVE })
      .expect(200);

    const actions = (await Audit.find({ entity: 'SUPPLIER' })).map((log) => log.action);
    expect(actions).toEqual(expect.arrayContaining([
      'CREATE_SUPPLIER',
      'UPDATE_SUPPLIER',
      'APPROVE_SUPPLIER',
      'ACTIVATE_SUPPLIER',
      'DEACTIVATE_SUPPLIER',
    ]));
  });

  it('does not grant Supplier any existing Admin/Vendor/Delivery permissions', () => {
    expect(hasPermission(ROLES.SUPPLIER, PERMISSIONS.USERS_UPDATE)).toBe(false);
    expect(hasPermission(ROLES.SUPPLIER, PERMISSIONS.PRODUCTS_CREATE)).toBe(false);
    expect(hasPermission(ROLES.SUPPLIER, PERMISSIONS.ORDERS_APPROVE)).toBe(false);
    expect(hasPermission(ROLES.SUPPLIER, PERMISSIONS.DELIVERIES_UPDATE)).toBe(false);
    expect(hasPermission(ROLES.ADMIN, PERMISSIONS.PRODUCTS_CREATE)).toBe(true);
    expect(hasPermission(ROLES.VENDOR, PERMISSIONS.PRODUCTS_CREATE)).toBe(true);
    expect(hasPermission(ROLES.DELIVERY_PARTNER, PERMISSIONS.DELIVERIES_UPDATE)).toBe(true);
  });
});
