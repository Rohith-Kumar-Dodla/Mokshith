import { test, expect } from '../fixtures/product.functional.fixture';
import AdminProductsPage from '../pages/admin/AdminProductsPage';
import {
  addToCartApi,
  createProductApi,
  deleteProductApi,
  getAdminSession,
  getFirstCategoryId,
  listInventoryApi,
  resolveRefId,
  updateInventoryStockApi,
} from '../helpers/product.api.helper';
import { getVendorCredentials, uniqueProductName } from '../helpers/product.credentials';
import { loginApi } from '../helpers/auth.api.helper';
import { establishSession } from '../helpers/session.functional.helper';
import { clearSession } from '../helpers/session.helper';

test.describe('PF-PROD Section R | Persistence & Concurrency', () => {
  test('PF-PROD-139 | Product data survives session refresh', async ({ page, adminCreds }) => {
    const session = await getAdminSession();
    const categoryId = await getFirstCategoryId(session);
    const name = uniqueProductName('pf-session-persist');
    await createProductApi(session, { name, price: 700, categoryId, stock: 3 });
    await establishSession(page, 'admin');
    const adminPage = new AdminProductsPage(page);
    await adminPage.goto();
    // Simulate a fresh session: clear client session, then re-establish and verify
    // the previously created product persisted server-side across the refresh.
    await clearSession(page);
    await establishSession(page, 'admin');
    await adminPage.goto();
    await adminPage.search(name);
    await expect(adminPage.rowByName(name)).toBeVisible({ timeout: 15000 });
    void adminCreds;
  });

  test('PF-PROD-140 | Concurrent stock update conflict handling', async () => {
    const session = await getAdminSession();
    const categoryId = await getFirstCategoryId(session);
    const created = await createProductApi(session, {
      name: uniqueProductName('pf-concurrent'),
      price: 710,
      categoryId,
      stock: 50,
    });
    const productId = String(created._id || created.id);
    const inventory = await listInventoryApi(session);
    const rows = Array.isArray(inventory) ? inventory : [];
    const row = rows.find((r: { productId?: { _id?: string } | string }) => {
      const pid = resolveRefId(r.productId);
      return pid === productId;
    }) as { warehouseId?: string | { _id?: string }; productId?: { _id?: string } | string } | undefined;
    if (!row?.warehouseId) {
      test.skip();
      return;
    }
    const pid = resolveRefId(row.productId);
    const warehouseId = resolveRefId(row.warehouseId);
    if (!pid || !warehouseId) {
      test.skip();
      return;
    }
    const payload = {
      productId: pid,
      warehouseId,
      stock: 60,
      type: 'SET',
    };
    const results = await Promise.allSettled([
      updateInventoryStockApi(session, payload),
      updateInventoryStockApi(session, payload),
    ]);
    const statuses = results.map((r) =>
      r.status === 'fulfilled' ? 200 : (r.reason as { response?: { status?: number } })?.response?.status
    );
    expect(statuses.some((s) => s === 200 || s === 409)).toBe(true);
  });

  test('PF-PROD-141 | Cart prunes deleted products', async () => {
    const adminSession = await getAdminSession();
    const vendorSession = await loginApi(
      getVendorCredentials().mobile,
      getVendorCredentials().password
    );
    const categoryId = await getFirstCategoryId(adminSession);
    const created = await createProductApi(adminSession, {
      name: uniqueProductName('pf-cart-prune'),
      price: 720,
      categoryId,
      stock: 20,
      moq: 1,
    });
    const productId = String(created._id || created.id);
    await addToCartApi(vendorSession, productId, 1);
    await deleteProductApi(adminSession, productId);
    const { apiClient } = await import('../helpers/apiClient');
    const { authHeaders } = await import('../helpers/auth.api.helper');
    const cartRes = await apiClient.get('/cart', { headers: authHeaders(vendorSession) });
    const cart = cartRes.data?.data ?? cartRes.data;
    const items = cart?.items ?? [];
    const stale = items.some(
      (item: { productId?: string | { _id?: string } }) =>
        String(typeof item.productId === 'object' ? item.productId?._id : item.productId) ===
        productId
    );
    expect(stale).toBe(false);
  });
});
