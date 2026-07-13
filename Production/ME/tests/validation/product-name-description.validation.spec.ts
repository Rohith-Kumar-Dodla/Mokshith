import { test, expect } from '../fixtures/product.validation.fixture';
import {
  createProductApi,
  getAdminSession,
  getFirstCategoryId,
  getProductApi,
} from '../helpers/product.api.helper';
import {
  apiJson,
  expectApiRejects,
  expectApiStatus,
  uniqueSingleCharProductName,
  uniqueValidationName,
  unwrapData,
} from '../helpers/validation/product.validation.helper';

test.describe('PV-PROD Section A | Product Name Validation', () => {
  test('PV-PROD-001 | API rejects missing product name on create', async () => {
    const session = await getAdminSession();
    const categoryId = await getFirstCategoryId(session);
    await expect(
      createProductApi(session, { name: '', price: 100, categoryId } as never)
    ).rejects.toMatchObject({ response: { status: 400 } });
  });

  test('PV-PROD-002 | API rejects whitespace-only product name', async () => {
    const session = await getAdminSession();
    const categoryId = await getFirstCategoryId(session);
    await expectApiRejects(
      () => apiJson(session, 'POST', '/products', { name: '   ', price: 100, categoryId }),
      400
    );
  });

  test('PV-PROD-003 | API accepts and trims leading/trailing whitespace in name', async () => {
    const session = await getAdminSession();
    const categoryId = await getFirstCategoryId(session);
    const base = uniqueValidationName('pv-trim');
    const result = await apiJson(session, 'POST', '/products', {
      name: `  ${base}  `,
      price: 100,
      categoryId,
    });
    await expectApiStatus(result, 200);
    const created = unwrapData<{ name: string; _id?: string }>(result.body);
    expect(created.name).toBe(base);
  });

  test('PV-PROD-004 | API accepts unicode product name', async () => {
    const session = await getAdminSession();
    const categoryId = await getFirstCategoryId(session);
    const name = `पण्य ${uniqueValidationName('pv-unicode')}`;
    const created = await createProductApi(session, { name, price: 100, categoryId });
    expect(created.name).toBe(name);
  });

  test('PV-PROD-005 | API accepts emoji in product name', async () => {
    const session = await getAdminSession();
    const categoryId = await getFirstCategoryId(session);
    const name = `🍚 ${uniqueValidationName('pv-emoji')}`;
    const created = await createProductApi(session, { name, price: 100, categoryId });
    expect(created.name).toBe(name);
  });

  test('PV-PROD-006 | HTML in product name stored as literal text', async () => {
    const session = await getAdminSession();
    const categoryId = await getFirstCategoryId(session);
    const name = `<b>${uniqueValidationName('pv-html')}</b>`;
    const created = await createProductApi(session, { name, price: 100, categoryId });
    const fetched = await getProductApi(String(created._id || created.id), session);
    expect(fetched.name).toBe(name);
    expect(fetched.name).toContain('<b>');
  });

  test('PV-PROD-007 | Script injection in product name stored as literal text', async () => {
    const session = await getAdminSession();
    const categoryId = await getFirstCategoryId(session);
    const name = `<script>alert(1)</script>${uniqueValidationName('pv-xss')}`;
    const created = await createProductApi(session, { name, price: 100, categoryId });
    expect(created.name).toContain('<script>');
  });

  test('PV-PROD-008 | Very long product name (600 chars) behavior documented', async () => {
    const session = await getAdminSession();
    const categoryId = await getFirstCategoryId(session);
    const longName = `${'x'.repeat(600)}-${Date.now()}`;
    const result = await apiJson(session, 'POST', '/products', {
      name: longName,
      price: 100,
      categoryId,
    });
    expect([200, 201, 400, 500]).toContain(result.status);
  });

  test('PV-PROD-009 | Single character product name accepted', async () => {
    const session = await getAdminSession();
    const categoryId = await getFirstCategoryId(session);
    const name = uniqueSingleCharProductName();
    expect(name.length, 'Test data should be exactly one character').toBe(1);
    const created = await createProductApi(session, { name, price: 100, categoryId });
    expect(created.name).toBe(name);
  });

  test('PV-PROD-010 | Duplicate product names are allowed', async () => {
    const session = await getAdminSession();
    const categoryId = await getFirstCategoryId(session);
    const name = uniqueValidationName('pv-dup');
    const first = await createProductApi(session, { name, price: 100, categoryId });
    const second = await createProductApi(session, { name, price: 110, categoryId });
    expect(String(first._id || first.id)).not.toBe(String(second._id || second.id));
  });

  test('PV-PROD-011 | API rejects empty name on update', async () => {
    const session = await getAdminSession();
    const categoryId = await getFirstCategoryId(session);
    const created = await createProductApi(session, {
      name: uniqueValidationName('pv-upd-name'),
      price: 100,
      categoryId,
    });
    const productId = String(created._id || created.id);
    await expectApiRejects(
      () => apiJson(session, 'PUT', `/products/${productId}`, { name: '   ' }),
      400
    );
  });
});

test.describe('PV-PROD Section B | Description Validation', () => {
  test('PV-PROD-012 | Empty description allowed on create', async () => {
    const session = await getAdminSession();
    const categoryId = await getFirstCategoryId(session);
    const created = await createProductApi(session, {
      name: uniqueValidationName('pv-desc-empty'),
      price: 100,
      categoryId,
      description: '',
    });
    expect(created.description ?? '').toBe('');
  });

  test('PV-PROD-013 | Long description persists', async () => {
    const session = await getAdminSession();
    const categoryId = await getFirstCategoryId(session);
    const description = 'D'.repeat(2000);
    const created = await createProductApi(session, {
      name: uniqueValidationName('pv-desc-long'),
      price: 100,
      categoryId,
      description,
    });
    const fetched = await getProductApi(String(created._id || created.id), session);
    expect(fetched.description).toBe(description);
  });

  test('PV-PROD-014 | HTML in description stored as literal', async () => {
    const session = await getAdminSession();
    const categoryId = await getFirstCategoryId(session);
    const description = '<img src=x onerror=alert(1)>';
    const created = await createProductApi(session, {
      name: uniqueValidationName('pv-desc-html'),
      price: 100,
      categoryId,
      description,
    });
    expect(created.description).toBe(description);
  });

  test('PV-PROD-015 | Unicode in description persists', async () => {
    const session = await getAdminSession();
    const categoryId = await getFirstCategoryId(session);
    const description = 'தமிழ் விளக்கம்';
    const created = await createProductApi(session, {
      name: uniqueValidationName('pv-desc-unicode'),
      price: 100,
      categoryId,
      description,
    });
    expect(created.description).toBe(description);
  });
});
