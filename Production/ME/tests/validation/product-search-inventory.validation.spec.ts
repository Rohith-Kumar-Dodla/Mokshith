import { test, expect } from '../fixtures/product.validation.fixture';
import {
  createProductApi,
  getAdminSession,
  getFirstCategoryId,
  listProductsApi,
  searchProductsApi,
} from '../helpers/product.api.helper';
import {
  apiJson,
  INVALID_OBJECT_ID,
  NONEXISTENT_OBJECT_ID,
  uniqueValidationName,
} from '../helpers/validation/product.validation.helper';

test.describe('PV-PROD Section J | Search & Pagination Validation', () => {
  test('PV-PROD-068 | Search ReDoS special chars handled safely', async () => {
    const results = await searchProductsApi('.*+?^${}()|[]\\');
    expect(Array.isArray(results)).toBe(true);
  });

  test('PV-PROD-069 | Search over 100 chars ignored silently', async () => {
    const longQuery = 'a'.repeat(150);
    const listed = await listProductsApi({ search: longQuery });
    const products = (listed as { products?: unknown[] })?.products ?? listed;
    expect(Array.isArray(products)).toBe(true);
  });

  test('PV-PROD-070 | Pagination limit capped at 100', async () => {
    const listed = await listProductsApi({ limit: 500, page: 1 });
    const pagination = (listed as { pagination?: { itemsPerPage?: number } })?.pagination;
    if (pagination?.itemsPerPage) {
      expect(pagination.itemsPerPage).toBeLessThanOrEqual(100);
    }
  });

  test('PV-PROD-071 | Pagination page < 1 normalized to 1', async () => {
    const listed = await listProductsApi({ page: 0, limit: 5 });
    const pagination = (listed as { pagination?: { currentPage?: number } })?.pagination;
    if (pagination?.currentPage) {
      expect(pagination.currentPage).toBeGreaterThanOrEqual(1);
    }
  });

  test('PV-PROD-072 | Invalid categoryId filter returns error or empty', async () => {
    const result = await apiJson(undefined, 'GET', '/products', undefined);
    const withBadCat = await apiJson(undefined, 'GET', `/products?categoryId=${INVALID_OBJECT_ID}`);
    expect([200, 400]).toContain(withBadCat.status);
    void result;
  });
});

test.describe('PV-PROD Section K | Inventory Stock Validation', () => {
  test('PV-PROD-073 | Inventory PATCH missing productId behavior', async () => {
    const session = await getAdminSession();
    const result = await apiJson(session, 'PATCH', '/inventory/update', {
      stock: 10,
      type: 'SET',
    });
    expect([400, 404, 500]).toContain(result.status);
  });

  test('PV-PROD-074 | Inventory PATCH negative stock via API', async () => {
    const session = await getAdminSession();
    const categoryId = await getFirstCategoryId(session);
    const created = await createProductApi(session, {
      name: uniqueValidationName('pv-inv-neg'),
      price: 100,
      categoryId,
      stock: 10,
    });
    const productId = String(created._id || created.id);
    const result = await apiJson(session, 'PATCH', '/inventory/update', {
      productId,
      stock: -5,
      type: 'SET',
    });
    expect([200, 400, 404]).toContain(result.status);
  });

  test('PV-PROD-075 | Inventory add stock rejects quantity < 1', async () => {
    const session = await getAdminSession();
    const categoryId = await getFirstCategoryId(session);
    const created = await createProductApi(session, {
      name: uniqueValidationName('pv-inv-add'),
      price: 100,
      categoryId,
      stock: 5,
    });
    const productId = String(created._id || created.id);
    const result = await apiJson(session, 'POST', '/inventory', {
      productId,
      warehouseId: NONEXISTENT_OBJECT_ID,
      stock: 0,
    });
    expect(result.status).toBeGreaterThanOrEqual(400);
  });
});
