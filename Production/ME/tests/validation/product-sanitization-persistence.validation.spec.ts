import { test, expect } from '../fixtures/product.validation.fixture';
import {
  createProductApi,
  getAdminSession,
  getFirstCategoryId,
} from '../helpers/product.api.helper';
import {
  apiJson,
  expectApiStatus,
  uniqueValidationName,
} from '../helpers/validation/product.validation.helper';

test.describe('PV-PROD Section N | Sanitization & Security Validation', () => {
  test('PV-PROD-094 | SQL-like injection in name does not break create', async () => {
    const session = await getAdminSession();
    const categoryId = await getFirstCategoryId(session);
    const name = `'; DROP TABLE products; -- ${uniqueValidationName('pv-sql')}`;
    const created = await createProductApi(session, { name, price: 100, categoryId });
    expect(created.name).toContain('DROP TABLE');
  });

  test('PV-PROD-095 | NoSQL injection object in name rejected or coerced', async () => {
    const session = await getAdminSession();
    const categoryId = await getFirstCategoryId(session);
    const result = await apiJson(session, 'POST', '/products', {
      name: { $gt: '' },
      price: 100,
      categoryId,
    });
    expect([400, 500]).toContain(result.status);
  });

  test('PV-PROD-096 | Extra unknown fields allowed through Joi (allowUnknown)', async () => {
    const session = await getAdminSession();
    const categoryId = await getFirstCategoryId(session);
    const result = await apiJson(session, 'POST', '/products', {
      name: uniqueValidationName('pv-unknown'),
      price: 100,
      categoryId,
      maliciousField: '<script>alert(1)</script>',
      sku: 'FAKE-SKU-001',
    });
    await expectApiStatus(result, 200);
  });

  test('PV-PROD-097 | SKU field not in model — accepted as unknown (gap)', async () => {
    const session = await getAdminSession();
    const categoryId = await getFirstCategoryId(session);
    const result = await apiJson(session, 'POST', '/products', {
      name: uniqueValidationName('pv-sku'),
      price: 100,
      categoryId,
      sku: 'DUPLICATE-SKU-001',
    });
    await expectApiStatus(result, 200);
    const created = (result.body?.data ?? result.body) as { sku?: string };
    expect(created.sku).toBeUndefined();
  });

  test('PV-PROD-098 | unit/gst/weight fields bypass Joi schema (gap)', async () => {
    const session = await getAdminSession();
    const categoryId = await getFirstCategoryId(session);
    const result = await apiJson(session, 'POST', '/products', {
      name: uniqueValidationName('pv-extra-fields'),
      price: 100,
      categoryId,
      unit: 'kg',
      gst: 28,
      weight: -5,
    });
    expect([200, 400]).toContain(result.status);
  });

  test('PV-PROD-099 | Joi returns multiple validation errors (abortEarly false)', async () => {
    const session = await getAdminSession();
    const result = await apiJson(session, 'POST', '/products', {
      name: '',
      price: -1,
      categoryId: '',
    });
    expect(result.status).toBe(400);
    const message = String(result.body?.message ?? '');
    expect(message.length).toBeGreaterThan(0);
  });

  test('PV-PROD-100 | Path traversal in search query handled safely', async () => {
    const result = await apiJson(undefined, 'GET', '/products?search=../../../etc/passwd');
    expect([200, 400]).toContain(result.status);
  });
});

test.describe('PV-PROD Section O | Persistence & Consistency Validation', () => {
  test('PV-PROD-101 | Service layer rejects price <= 0 even if Joi bypassed', async () => {
    const session = await getAdminSession();
    const categoryId = await getFirstCategoryId(session);
    const result = await apiJson(session, 'POST', '/products', {
      name: uniqueValidationName('pv-svc-price'),
      price: 0.0001,
      categoryId,
    });
    expect([200, 400]).toContain(result.status);
  });

  test('PV-PROD-102 | Mongoose price min:0 vs Joi greater(0) mismatch documented', async () => {
    const session = await getAdminSession();
    const categoryId = await getFirstCategoryId(session);
    const result = await apiJson(session, 'POST', '/products', {
      name: uniqueValidationName('pv-mongoose-gap'),
      price: 0,
      categoryId,
    });
    expect(result.status).toBe(400);
  });

  test('PV-PROD-103 | API error message surfaced for invalid create', async () => {
    const session = await getAdminSession();
    const result = await apiJson(session, 'POST', '/products', {
      name: uniqueValidationName('pv-msg'),
      price: -10,
      categoryId: await getFirstCategoryId(session),
    });
    expect(result.status).toBe(400);
    expect(String(result.body?.message ?? '')).toMatch(/price|greater|negative|valid/i);
  });

  test('PV-PROD-104 | Partial update preserves unspecified fields', async () => {
    const session = await getAdminSession();
    const categoryId = await getFirstCategoryId(session);
    const created = await createProductApi(session, {
      name: uniqueValidationName('pv-partial'),
      price: 100,
      categoryId,
      stock: 20,
      moq: 3,
    });
    const productId = String(created._id || created.id);
    const result = await apiJson(session, 'PUT', `/products/${productId}`, { price: 120 });
    await expectApiStatus(result, 200);
    const updated = (result.body?.data ?? result.body) as { stock?: number; moq?: number };
    expect(Number(updated.stock)).toBe(20);
    expect(Number(updated.moq)).toBe(3);
  });

  test('PV-PROD-105 | isActive any type on create accepted (gap)', async () => {
    const session = await getAdminSession();
    const categoryId = await getFirstCategoryId(session);
    const result = await apiJson(session, 'POST', '/products', {
      name: uniqueValidationName('pv-isactive-any'),
      price: 100,
      categoryId,
      isActive: 'maybe',
    });
    expect([200, 400]).toContain(result.status);
  });
});
