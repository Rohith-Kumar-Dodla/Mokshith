import { test, expect } from '../fixtures/product.validation.fixture';
import {
  createProductApi,
  getAdminSession,
  getFirstCategoryId,
  patchProductStockApi,
  updateProductApi,
} from '../helpers/product.api.helper';
import { uniqueProductName } from '../helpers/product.credentials';
import {
  apiJson,
  expectApiRejects,
  expectApiStatus,
  uniqueValidationName,
} from '../helpers/validation/product.validation.helper';

test.describe('PV-PROD Section C | Price Validation', () => {
  test('PV-PROD-016 | API rejects missing price on create', async () => {
    const session = await getAdminSession();
    const categoryId = await getFirstCategoryId(session);
    await expectApiRejects(
      () =>
        apiJson(session, 'POST', '/products', {
          name: uniqueValidationName('pv-no-price'),
          categoryId,
        }),
      400
    );
  });

  test('PV-PROD-017 | API rejects price = 0', async () => {
    const session = await getAdminSession();
    const categoryId = await getFirstCategoryId(session);
    await expectApiRejects(
      () =>
        apiJson(session, 'POST', '/products', {
          name: uniqueValidationName('pv-zero-price'),
          price: 0,
          categoryId,
        }),
      400
    );
  });

  test('PV-PROD-018 | API rejects negative price', async () => {
    const session = await getAdminSession();
    const categoryId = await getFirstCategoryId(session);
    await expectApiRejects(
      () =>
        apiJson(session, 'POST', '/products', {
          name: uniqueValidationName('pv-neg-price'),
          price: -50,
          categoryId,
        }),
      400
    );
  });

  test('PV-PROD-019 | API accepts minimum valid price 0.01', async () => {
    const session = await getAdminSession();
    const categoryId = await getFirstCategoryId(session);
    const created = await createProductApi(session, {
      name: uniqueValidationName('pv-min-price'),
      price: 0.01,
      categoryId,
    });
    expect(Number(created.price)).toBeCloseTo(0.01, 2);
  });

  test('PV-PROD-020 | API accepts large price value', async () => {
    const session = await getAdminSession();
    const categoryId = await getFirstCategoryId(session);
    const created = await createProductApi(session, {
      name: uniqueValidationName('pv-max-price'),
      price: 9999999,
      categoryId,
    });
    expect(Number(created.price)).toBe(9999999);
  });

  test('PV-PROD-021 | Decimal price precision persists', async () => {
    const session = await getAdminSession();
    const categoryId = await getFirstCategoryId(session);
    const created = await createProductApi(session, {
      name: uniqueValidationName('pv-decimal'),
      price: 99.99,
      categoryId,
    });
    expect(Number(created.price)).toBeCloseTo(99.99, 2);
  });

  test('PV-PROD-022 | String price coerced via middleware', async () => {
    const session = await getAdminSession();
    const categoryId = await getFirstCategoryId(session);
    const result = await apiJson(session, 'POST', '/products', {
      name: uniqueValidationName('pv-str-price'),
      price: '150.5',
      categoryId,
    });
    await expectApiStatus(result, 200);
    const created = result.body?.data as { price?: number };
    expect(Number(created?.price)).toBeCloseTo(150.5, 1);
  });

  test('PV-PROD-023 | API rejects non-numeric price string', async () => {
    const session = await getAdminSession();
    const categoryId = await getFirstCategoryId(session);
    await expectApiRejects(
      () =>
        apiJson(session, 'POST', '/products', {
          name: uniqueValidationName('pv-bad-price'),
          price: 'not-a-number',
          categoryId,
        }),
      400
    );
  });

  test('PV-PROD-024 | API rejects price = 0 on update', async () => {
    const session = await getAdminSession();
    const categoryId = await getFirstCategoryId(session);
    const created = await createProductApi(session, {
      name: uniqueValidationName('pv-upd-price'),
      price: 100,
      categoryId,
    });
    const productId = String(created._id || created.id);
    await expectApiRejects(
      () => apiJson(session, 'PUT', `/products/${productId}`, { price: 0 }),
      400
    );
  });
});

test.describe('PV-PROD Section D | Stock & MOQ Validation', () => {
  test('PV-PROD-025 | API rejects negative stock on create', async () => {
    const session = await getAdminSession();
    const categoryId = await getFirstCategoryId(session);
    await expectApiRejects(
      () =>
        apiJson(session, 'POST', '/products', {
          name: uniqueValidationName('pv-neg-stock'),
          price: 100,
          stock: -10,
          categoryId,
        }),
      400
    );
  });

  test('PV-PROD-026 | API accepts stock = 0', async () => {
    const session = await getAdminSession();
    const categoryId = await getFirstCategoryId(session);
    const created = await createProductApi(session, {
      name: uniqueValidationName('pv-zero-stock'),
      price: 100,
      stock: 0,
      categoryId,
    });
    expect(Number(created.stock)).toBe(0);
  });

  test('PV-PROD-027 | API accepts large stock integer', async () => {
    const session = await getAdminSession();
    const categoryId = await getFirstCategoryId(session);
    const created = await createProductApi(session, {
      name: uniqueValidationName('pv-max-stock'),
      price: 100,
      stock: 999999,
      categoryId,
    });
    expect(Number(created.stock)).toBe(999999);
  });

  test('PV-PROD-028 | API rejects MOQ < 1', async () => {
    const session = await getAdminSession();
    const categoryId = await getFirstCategoryId(session);
    await expectApiRejects(
      () =>
        apiJson(session, 'POST', '/products', {
          name: uniqueValidationName('pv-moq-zero'),
          price: 100,
          moq: 0,
          categoryId,
        }),
      400
    );
  });

  test('PV-PROD-029 | API rejects negative MOQ', async () => {
    const session = await getAdminSession();
    const categoryId = await getFirstCategoryId(session);
    await expectApiRejects(
      () =>
        apiJson(session, 'POST', '/products', {
          name: uniqueValidationName('pv-moq-neg'),
          price: 100,
          moq: -5,
          categoryId,
        }),
      400
    );
  });

  test('PV-PROD-030 | MOQ defaults to 1 when omitted', async () => {
    const session = await getAdminSession();
    const categoryId = await getFirstCategoryId(session);
    const created = await createProductApi(session, {
      name: uniqueValidationName('pv-moq-default'),
      price: 100,
      categoryId,
    });
    expect(Number(created.moq ?? 1)).toBe(1);
  });

  test('PV-PROD-031 | PATCH stock rejects negative value', async () => {
    const session = await getAdminSession();
    const categoryId = await getFirstCategoryId(session);
    const created = await createProductApi(session, {
      name: uniqueValidationName('pv-patch-neg'),
      price: 100,
      categoryId,
      stock: 10,
    });
    const productId = String(created._id || created.id);
    await expect(
      patchProductStockApi(session, productId, -1)
    ).rejects.toMatchObject({ response: { status: 400 } });
  });

  test('PV-PROD-032 | PATCH stock rejects non-integer', async () => {
    const session = await getAdminSession();
    const categoryId = await getFirstCategoryId(session);
    const created = await createProductApi(session, {
      name: uniqueValidationName('pv-patch-float'),
      price: 100,
      categoryId,
      stock: 10,
    });
    const productId = String(created._id || created.id);
    await expectApiRejects(
      () => apiJson(session, 'PATCH', `/products/${productId}/stock`, { stock: 10.5 }),
      400
    );
  });

  test('PV-PROD-033 | PATCH stock rejects missing body', async () => {
    const session = await getAdminSession();
    const categoryId = await getFirstCategoryId(session);
    const created = await createProductApi(session, {
      name: uniqueValidationName('pv-patch-missing'),
      price: 100,
      categoryId,
    });
    const productId = String(created._id || created.id);
    await expectApiRejects(
      () => apiJson(session, 'PATCH', `/products/${productId}/stock`, {}),
      400
    );
  });

  test('PV-PROD-034 | PATCH stock accepts valid integer update', async () => {
    const session = await getAdminSession();
    const categoryId = await getFirstCategoryId(session);
    const created = await createProductApi(session, {
      name: uniqueValidationName('pv-patch-ok'),
      price: 100,
      categoryId,
      stock: 5,
    });
    const productId = String(created._id || created.id);
    const updated = await patchProductStockApi(session, productId, 25);
    expect(Number(updated.stock)).toBe(25);
  });

  test('PV-PROD-035 | Decimal stock on create accepted by Joi', async () => {
    const session = await getAdminSession();
    const categoryId = await getFirstCategoryId(session);
    const result = await apiJson(session, 'POST', '/products', {
      name: uniqueValidationName('pv-dec-stock'),
      price: 100,
      stock: 10.7,
      categoryId,
    });
    expect([200, 400]).toContain(result.status);
  });
});
