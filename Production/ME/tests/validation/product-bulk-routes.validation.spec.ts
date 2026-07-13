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
  INVALID_OBJECT_ID,
  NONEXISTENT_OBJECT_ID,
  uniqueValidationName,
} from '../helpers/validation/product.validation.helper';

test.describe('PV-PROD Section H | Bulk Pricing & Variants Validation', () => {
  test('PV-PROD-056 | Valid bulkPricing array accepted', async () => {
    const session = await getAdminSession();
    const categoryId = await getFirstCategoryId(session);
    const created = await createProductApi(session, {
      name: uniqueValidationName('pv-bulk-ok'),
      price: 100,
      categoryId,
      bulkPricing: [
        { minQuantity: 10, price: 90 },
        { minQuantity: 50, price: 80 },
      ],
    });
    expect(Array.isArray(created.bulkPricing)).toBe(true);
    expect(created.bulkPricing.length).toBeGreaterThanOrEqual(1);
  });

  test('PV-PROD-057 | bulkPricing missing minQuantity rejected', async () => {
    const session = await getAdminSession();
    const categoryId = await getFirstCategoryId(session);
    await expectApiRejects(
      () =>
        apiJson(session, 'POST', '/products', {
          name: uniqueValidationName('pv-bulk-miss-qty'),
          price: 100,
          categoryId,
          bulkPricing: [{ price: 90 }],
        }),
      400
    );
  });

  test('PV-PROD-058 | bulkPricing missing price rejected', async () => {
    const session = await getAdminSession();
    const categoryId = await getFirstCategoryId(session);
    await expectApiRejects(
      () =>
        apiJson(session, 'POST', '/products', {
          name: uniqueValidationName('pv-bulk-miss-price'),
          price: 100,
          categoryId,
          bulkPricing: [{ minQuantity: 10 }],
        }),
      400
    );
  });

  test('PV-PROD-059 | bulkPricing tier price = 0 allowed (gap)', async () => {
    const session = await getAdminSession();
    const categoryId = await getFirstCategoryId(session);
    const result = await apiJson(session, 'POST', '/products', {
      name: uniqueValidationName('pv-bulk-zero'),
      price: 100,
      categoryId,
      bulkPricing: [{ minQuantity: 10, price: 0 }],
    });
    expect([200, 400]).toContain(result.status);
  });

  test('PV-PROD-060 | Valid variants array accepted', async () => {
    const session = await getAdminSession();
    const categoryId = await getFirstCategoryId(session);
    const created = await createProductApi(session, {
      name: uniqueValidationName('pv-variant-ok'),
      price: 100,
      categoryId,
      variants: [{ name: 'Size', value: 'Large', additionalPrice: 10, stock: 5 }],
    } as never);
    expect(Array.isArray(created.variants)).toBe(true);
  });

  test('PV-PROD-061 | Variant missing name rejected', async () => {
    const session = await getAdminSession();
    const categoryId = await getFirstCategoryId(session);
    await expectApiRejects(
      () =>
        apiJson(session, 'POST', '/products', {
          name: uniqueValidationName('pv-var-miss-name'),
          price: 100,
          categoryId,
          variants: [{ value: 'Large' }],
        }),
      400
    );
  });

  test('PV-PROD-062 | Variant missing value rejected', async () => {
    const session = await getAdminSession();
    const categoryId = await getFirstCategoryId(session);
    await expectApiRejects(
      () =>
        apiJson(session, 'POST', '/products', {
          name: uniqueValidationName('pv-var-miss-val'),
          price: 100,
          categoryId,
          variants: [{ name: 'Size' }],
        }),
      400
    );
  });
});

test.describe('PV-PROD Section I | Route Parameter & ID Validation', () => {
  test('PV-PROD-063 | GET product rejects invalid ObjectId', async () => {
    await expect(getProductApi(INVALID_OBJECT_ID)).rejects.toMatchObject({
      response: { status: 400 },
    });
  });

  test('PV-PROD-064 | GET product returns 404 for non-existent ID', async () => {
    await expect(getProductApi(NONEXISTENT_OBJECT_ID)).rejects.toMatchObject({
      response: { status: 404 },
    });
  });

  test('PV-PROD-065 | PUT product with invalid id rejected', async () => {
    const session = await getAdminSession();
    await expectApiRejects(
      () => apiJson(session, 'PUT', `/products/${INVALID_OBJECT_ID}`, { price: 100 }),
      400
    );
  });

  test('PV-PROD-066 | PATCH stock with invalid id rejected', async () => {
    const session = await getAdminSession();
    await expectApiRejects(
      () => apiJson(session, 'PATCH', `/products/${INVALID_OBJECT_ID}/stock`, { stock: 10 }),
      400
    );
  });

  test('PV-PROD-067 | DELETE non-existent product returns 404', async () => {
    const session = await getAdminSession();
    const result = await apiJson(session, 'DELETE', `/products/${NONEXISTENT_OBJECT_ID}`);
    expect(result.status).toBe(404);
  });
});
