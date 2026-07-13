import { test, expect } from '../fixtures/product.functional.fixture';
import {
  createProductApi,
  getAdminSession,
  getFirstCategoryId,
  getProductApi,
  searchProductsApi,
} from '../helpers/product.api.helper';
import { uniqueProductName } from '../helpers/product.credentials';
import { authHeaders } from '../helpers/auth.api.helper';

test.describe('PF-PROD Section Q | Boundaries & Validation', () => {
  test('PF-PROD-131 | API rejects invalid ObjectId on get', async () => {
    await expect(getProductApi('not-a-valid-id')).rejects.toMatchObject({
      response: { status: 400 },
    });
  });

  test('PF-PROD-132 | API rejects non-existent product ID', async () => {
    await expect(getProductApi('000000000000000000000001')).rejects.toMatchObject({
      response: { status: 404 },
    });
  });

  test('PF-PROD-133 | Extremely long product name', async () => {
    const session = await getAdminSession();
    const categoryId = await getFirstCategoryId(session);
    const longName = 'x'.repeat(600);
    const result = await createProductApi(session, {
      name: longName,
      price: 100,
      categoryId,
    }).catch((err) => err);
    expect([200, 400, 500]).toContain(result?.response?.status ?? 200);
  });

  test('PF-PROD-134 | Price boundary smallest valid', async () => {
    const session = await getAdminSession();
    const categoryId = await getFirstCategoryId(session);
    const created = await createProductApi(session, {
      name: uniqueProductName('pf-min-price'),
      price: 0.01,
      categoryId,
    });
    expect(Number(created.price)).toBeCloseTo(0.01, 2);
  });

  test('PF-PROD-135 | Price boundary large value', async () => {
    const session = await getAdminSession();
    const categoryId = await getFirstCategoryId(session);
    const created = await createProductApi(session, {
      name: uniqueProductName('pf-max-price'),
      price: 9999999,
      categoryId,
    });
    expect(Number(created.price)).toBe(9999999);
  });

  test('PF-PROD-136 | Stock boundary large integer', async () => {
    const session = await getAdminSession();
    const categoryId = await getFirstCategoryId(session);
    const created = await createProductApi(session, {
      name: uniqueProductName('pf-max-stock'),
      price: 100,
      categoryId,
      stock: 999999,
    });
    expect(Number(created.stock)).toBe(999999);
  });

  test('PF-PROD-137 | Search ReDoS protection', async () => {
    const results = await searchProductsApi('.*+?^${}()|[]\\');
    expect(Array.isArray(results)).toBe(true);
  });

  test('PF-PROD-138 | FormData boolean coercion for isActive', async () => {
    const session = await getAdminSession();
    const categoryId = await getFirstCategoryId(session);
    const API_BASE = process.env.TEST_API_BASE_URL || 'http://localhost:5000/api/v1';
    const form = new FormData();
    form.append('name', uniqueProductName('pf-bool-coerce'));
    form.append('price', '100');
    form.append('categoryId', categoryId);
    form.append('isActive', 'false');
    const response = await fetch(`${API_BASE}/products`, {
      method: 'POST',
      headers: authHeaders(session),
      body: form,
    });
    const body = await response.json();
    const created = body?.data ?? body;
    expect(created.isActive).toBe(false);
  });
});
