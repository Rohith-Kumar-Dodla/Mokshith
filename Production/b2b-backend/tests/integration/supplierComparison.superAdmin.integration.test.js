import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import mongoose from 'mongoose';
import supertest from 'supertest';
import app from '../../src/app.js';
import Product from '../../src/modules/product/product.model.js';
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

describe('Super Admin supplier comparison - Phase 2.2', () => {
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
    product = await seedProduct(category._id, { name: 'Sunflower Oil', moq: 12, price: 150 });
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

  const compare = (productId) =>
    asSuperAdmin(request.get(`/api/v1/super-admin/products/${productId}/supplier-comparison`));

  it('allows Super Admin to compare active priced suppliers and identifies the lowest price', async () => {
    const abc = await createActiveSupplier();
    const pqr = await createActiveSupplier({
      supplierName: 'PQR Traders',
      companyName: 'PQR Traders Pvt Ltd',
      email: 'pqr@example.com',
      gstNumber: '29AAPFU0939F1Z5',
      phone: '9876502222',
    });
    const xyz = await createActiveSupplier({
      supplierName: 'XYZ Distributors',
      companyName: 'XYZ Dist Co',
      email: 'xyz@example.com',
      gstNumber: '24AAPFU0939F1Z5',
      phone: '9876503333',
    });

    const abcMap = await createMapping(abc, { minimumOrderQuantity: 50 });
    const pqrMap = await createMapping(pqr, { minimumOrderQuantity: 30 });
    const xyzMap = await createMapping(xyz, { minimumOrderQuantity: 20 });
    await setPrice(abc, abcMap._id, 100).expect(200);
    await setPrice(pqr, pqrMap._id, 105).expect(200);
    await setPrice(xyz, xyzMap._id, 120).expect(200);

    const response = await compare(product._id).expect(200);
    const data = response.body.data;

    expect(data.product.name).toBe('Sunflower Oil');
    expect(data.product).not.toHaveProperty('price');
    expect(data.product).not.toHaveProperty('moq');
    expect(data.lowestPrice).toBe(100);
    expect(data.emptyReason).toBeNull();
    expect(data.suppliers).toHaveLength(3);
    expect(data.suppliers.map((row) => row.supplierName)).toEqual([
      'ABC Oils',
      'PQR Traders',
      'XYZ Distributors',
    ]);
    expect(data.suppliers[0].isLowestPrice).toBe(true);
    expect(data.suppliers[1].isLowestPrice).toBe(false);
    expect(data.suppliers[0].minimumOrderQuantity).toBe(50);
    expect(data.suppliers[2].minimumOrderQuantity).toBe(20);
    expect(data.suppliers.every((row) => row.isSelected === undefined)).toBe(true);
    expect(data.suppliers.every((row) => row.currentSupplierPrice !== 150)).toBe(true);

    const storedProduct = await Product.findById(product._id);
    expect(storedProduct.price).toBe(150);
    expect(storedProduct.moq).toBe(12);
  });

  it('marks equal lowest prices without choosing a winner', async () => {
    const abc = await createActiveSupplier();
    const pqr = await createActiveSupplier({
      supplierName: 'PQR Traders',
      companyName: 'PQR Traders Pvt Ltd',
      email: 'pqr@example.com',
      gstNumber: '29AAPFU0939F1Z5',
      phone: '9876502222',
    });
    const xyz = await createActiveSupplier({
      supplierName: 'XYZ Distributors',
      companyName: 'XYZ Dist Co',
      email: 'xyz@example.com',
      gstNumber: '24AAPFU0939F1Z5',
      phone: '9876503333',
    });

    const abcMap = await createMapping(abc, { minimumOrderQuantity: 50 });
    const pqrMap = await createMapping(pqr, { minimumOrderQuantity: 30 });
    const xyzMap = await createMapping(xyz, { minimumOrderQuantity: 20 });
    await setPrice(abc, abcMap._id, 100).expect(200);
    await setPrice(pqr, pqrMap._id, 100).expect(200);
    await setPrice(xyz, xyzMap._id, 120).expect(200);

    const data = (await compare(product._id).expect(200)).body.data;
    expect(data.lowestPrice).toBe(100);
    const lowest = data.suppliers.filter((row) => row.isLowestPrice).map((row) => row.supplierName);
    expect(lowest).toEqual(['ABC Oils', 'PQR Traders']);
    expect(data.suppliers.find((row) => row.supplierName === 'XYZ Distributors').isLowestPrice).toBe(false);
  });

  it('excludes inactive suppliers, inactive mappings, and does not rank missing prices as zero', async () => {
    const active = await createActiveSupplier();
    const inactiveSupplier = await createActiveSupplier({
      supplierName: 'Inactive Oils',
      companyName: 'Inactive Oils Co',
      email: 'inactive@example.com',
      gstNumber: '29AAPFU0939F1Z5',
      phone: '9876502222',
    });
    const inactiveMappingSupplier = await createActiveSupplier({
      supplierName: 'Paused Oils',
      companyName: 'Paused Oils Co',
      email: 'paused@example.com',
      gstNumber: '24AAPFU0939F1Z5',
      phone: '9876503333',
    });
    const unpriced = await createActiveSupplier({
      supplierName: 'No Price Oils',
      companyName: 'No Price Co',
      email: 'noprice@example.com',
      gstNumber: '22AAPFU0939F1Z5',
      phone: '9876504444',
    });

    const activeMap = await createMapping(active, { minimumOrderQuantity: 50 });
    const inactiveSupplierMap = await createMapping(inactiveSupplier, { minimumOrderQuantity: 10 });
    const inactiveMapping = await createMapping(inactiveMappingSupplier, { minimumOrderQuantity: 10 });
    await createMapping(unpriced, { minimumOrderQuantity: 30 });

    await setPrice(active, activeMap._id, 100).expect(200);
    await setPrice(inactiveSupplier, inactiveSupplierMap._id, 90).expect(200);
    await setPrice(inactiveMappingSupplier, inactiveMapping._id, 80).expect(200);

    await asSuperAdmin(request.patch(`/api/v1/super-admin/suppliers/${inactiveSupplier}/status`))
      .send({ status: SUPPLIER_STATUS.INACTIVE })
      .expect(200);
    await asSuperAdmin(
      request.patch(`/api/v1/super-admin/suppliers/${inactiveMappingSupplier}/products/${inactiveMapping._id}/status`)
    )
      .send({ status: SUPPLIER_PRODUCT_STATUS.INACTIVE })
      .expect(200);

    const data = (await compare(product._id).expect(200)).body.data;
    expect(data.suppliers.map((row) => row.supplierName).sort()).toEqual(['ABC Oils', 'No Price Oils']);
    expect(data.lowestPrice).toBe(100);
    const unpricedRow = data.suppliers.find((row) => row.supplierName === 'No Price Oils');
    expect(unpricedRow.currentSupplierPrice).toBeNull();
    expect(unpricedRow.isLowestPrice).toBe(false);
    expect(data.suppliers.every((row) => row.currentSupplierPrice !== 0)).toBe(true);
  });

  it('returns a no-mappings empty reason', async () => {
    const data = (await compare(product._id).expect(200)).body.data;
    expect(data.suppliers).toEqual([]);
    expect(data.lowestPrice).toBeNull();
    expect(data.emptyReason).toBe('NO_MAPPINGS');
  });

  it('returns a no-active-suppliers empty reason', async () => {
    const supplierId = await createActiveSupplier();
    const mapping = await createMapping(supplierId);
    await setPrice(supplierId, mapping._id, 100).expect(200);
    await asSuperAdmin(request.patch(`/api/v1/super-admin/suppliers/${supplierId}/status`))
      .send({ status: SUPPLIER_STATUS.INACTIVE })
      .expect(200);

    const data = (await compare(product._id).expect(200)).body.data;
    expect(data.suppliers).toEqual([]);
    expect(data.lowestPrice).toBeNull();
    expect(data.emptyReason).toBe('NO_ACTIVE_SUPPLIERS');
  });

  it('returns a no-prices empty reason while listing unpriced active suppliers', async () => {
    const supplierId = await createActiveSupplier();
    await createMapping(supplierId, { minimumOrderQuantity: 40 });

    const data = (await compare(product._id).expect(200)).body.data;
    expect(data.emptyReason).toBe('NO_PRICES');
    expect(data.lowestPrice).toBeNull();
    expect(data.suppliers).toHaveLength(1);
    expect(data.suppliers[0].currentSupplierPrice).toBeNull();
    expect(data.suppliers[0].minimumOrderQuantity).toBe(40);
    expect(data.suppliers[0].isLowestPrice).toBe(false);
  });

  it('returns 404 for a missing product', async () => {
    const missingId = new mongoose.Types.ObjectId().toString();
    const response = await compare(missingId).expect(404);
    expect(response.body.message).toMatch(/product not found/i);
  });

  it('denies Admin, Vendor, Delivery Partner, Supplier role, and unauthenticated access', async () => {
    const path = `/api/v1/super-admin/products/${product._id}/supplier-comparison`;
    const supplierUser = await seedActiveUser({
      role: ROLES.SUPPLIER,
      email: 'supplier-role@example.com',
    });

    await request.get(path).set(sessionHeaders(admin)).expect(403);
    await request.get(path).set(sessionHeaders(vendor)).expect(403);
    await request.get(path).set(sessionHeaders(delivery)).expect(403);
    await request.get(path).set(sessionHeaders(supplierUser)).expect(403);
    await request.get(path).expect(401);
  });

  it('does not expose supplier comparison data on the public Product API', async () => {
    const supplierId = await createActiveSupplier();
    const mapping = await createMapping(supplierId);
    await setPrice(supplierId, mapping._id, 100).expect(200);

    const publicProduct = await request.get(`/api/v1/products/${product._id}`).expect(200);
    const payload = publicProduct.body.data;
    expect(payload.price).toBe(150);
    expect(payload).not.toHaveProperty('suppliers');
    expect(payload).not.toHaveProperty('lowestPrice');
    expect(payload).not.toHaveProperty('currentSupplierPrice');
    expect(payload).not.toHaveProperty('emptyReason');
  });
});
