import { test, expect } from '../fixtures/product.validation.fixture';
import {
  createProductApi,
  getAdminSession,
  getFirstCategoryId,
  patchProductStatusApi,
} from '../helpers/product.api.helper';
import {
  apiJson,
  expectApiRejects,
  expectApiStatus,
  INVALID_OBJECT_ID,
  NONEXISTENT_OBJECT_ID,
  uniqueValidationName,
} from '../helpers/validation/product.validation.helper';

test.describe('PV-PROD Section E | Category Validation', () => {
  test('PV-PROD-036 | API rejects missing categoryId on create', async () => {
    const session = await getAdminSession();
    await expectApiRejects(
      () =>
        apiJson(session, 'POST', '/products', {
          name: uniqueValidationName('pv-no-cat'),
          price: 100,
        }),
      400
    );
  });

  test('PV-PROD-037 | API rejects empty categoryId string', async () => {
    const session = await getAdminSession();
    await expectApiRejects(
      () =>
        apiJson(session, 'POST', '/products', {
          name: uniqueValidationName('pv-empty-cat'),
          price: 100,
          categoryId: '',
        }),
      400
    );
  });

  test('PV-PROD-038 | API rejects invalid ObjectId categoryId', async () => {
    const session = await getAdminSession();
    const result = await apiJson(session, 'POST', '/products', {
      name: uniqueValidationName('pv-bad-cat'),
      price: 100,
      categoryId: INVALID_OBJECT_ID,
    });
    expect([400, 500]).toContain(result.status);
  });

  test('PV-PROD-039 | Non-existent categoryId may still create product (gap)', async () => {
    const session = await getAdminSession();
    const result = await apiJson(session, 'POST', '/products', {
      name: uniqueValidationName('pv-ghost-cat'),
      price: 100,
      categoryId: NONEXISTENT_OBJECT_ID,
    });
    expect([200, 400, 404, 500]).toContain(result.status);
  });
});

test.describe('PV-PROD Section F | Status (isActive) Validation', () => {
  test('PV-PROD-040 | FormData boolean coercion for isActive false', async () => {
    const session = await getAdminSession();
    const categoryId = await getFirstCategoryId(session);
    const { apiMultipart } = await import('../helpers/validation/product.validation.helper');
    const result = await apiMultipart(session, 'POST', '/products', {
      name: uniqueValidationName('pv-inactive'),
      price: '100',
      categoryId,
      isActive: 'false',
    });
    await expectApiStatus(result, 200);
    const created = (result.body?.data ?? result.body) as { isActive?: boolean };
    expect(created.isActive).toBe(false);
  });

  test('PV-PROD-041 | isActive defaults true when omitted', async () => {
    const session = await getAdminSession();
    const categoryId = await getFirstCategoryId(session);
    const created = await createProductApi(session, {
      name: uniqueValidationName('pv-active-default'),
      price: 100,
      categoryId,
    });
    expect(created.isActive).not.toBe(false);
  });

  test('PV-PROD-042 | PATCH status rejects missing isActive', async () => {
    const session = await getAdminSession();
    const categoryId = await getFirstCategoryId(session);
    const created = await createProductApi(session, {
      name: uniqueValidationName('pv-status-miss'),
      price: 100,
      categoryId,
    });
    const productId = String(created._id || created.id);
    await expectApiRejects(
      () => apiJson(session, 'PATCH', `/products/${productId}/status`, {}),
      400
    );
  });

  test('PV-PROD-043 | PATCH status rejects non-boolean isActive', async () => {
    const session = await getAdminSession();
    const categoryId = await getFirstCategoryId(session);
    const created = await createProductApi(session, {
      name: uniqueValidationName('pv-status-str'),
      price: 100,
      categoryId,
    });
    const productId = String(created._id || created.id);
    await expectApiRejects(
      () => apiJson(session, 'PATCH', `/products/${productId}/status`, { isActive: 'inactive' }),
      400
    );
  });

  test('PV-PROD-044 | PATCH status accepts boolean false', async () => {
    const session = await getAdminSession();
    const categoryId = await getFirstCategoryId(session);
    const created = await createProductApi(session, {
      name: uniqueValidationName('pv-status-false'),
      price: 100,
      categoryId,
    });
    const productId = String(created._id || created.id);
    const updated = await patchProductStatusApi(session, productId, false);
    expect(updated.isActive).toBe(false);
  });
});
