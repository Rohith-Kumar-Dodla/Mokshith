import { test, expect } from '../fixtures/product.functional.fixture';
import VendorProductsPage from '../pages/vendor/VendorProductsPage';
import AdminProductsPage from '../pages/admin/AdminProductsPage';
import {
  createProductApi,
  getAdminSession,
  getFirstCategoryId,
  listProductsApi,
} from '../helpers/product.api.helper';
import { uniqueProductName } from '../helpers/product.credentials';
import { establishSession } from '../helpers/session.functional.helper';

test.describe('PF-PROD Section P | Pagination & Data Loading', () => {
  test('PF-PROD-127 | Vendor fetches up to 100 products', async ({ page, vendorCreds }) => {
    await establishSession(page, 'vendor');
    const vendorPage = new VendorProductsPage(page);
    const responsePromise = page.waitForResponse(
      (resp) => resp.url().includes('/api/v1/products') && resp.request().method() === 'GET'
    );
    await vendorPage.goto();
    const response = await responsePromise;
    const url = new URL(response.url());
    expect(url.searchParams.get('limit') || '100').toBe('100');
  });

  test('PF-PROD-128 | Backend pagination metadata', async () => {
    const result = await listProductsApi({ page: 1, limit: 20, _refresh: Date.now() });
    expect(result.pagination).toBeTruthy();
    expect(result.pagination?.currentPage ?? result.pagination?.page).toBeDefined();
    expect(result.pagination?.totalItems ?? result.pagination?.total).toBeDefined();
  });

  test('PF-PROD-129 | Cache bust on admin mutation', async ({ page, vendorCreds, adminCreds }) => {
    const session = await getAdminSession();
    const categoryId = await getFirstCategoryId(session);
    const name = uniqueProductName('pf-cache-bust');
    await createProductApi(session, { name, price: 600, categoryId, stock: 5 });
    await establishSession(page, 'vendor');
    const vendorPage = new VendorProductsPage(page);
    await vendorPage.goto();
    await vendorPage.search(name);
    await page.waitForTimeout(500);
    await expect(vendorPage.cardByName(name)).toBeVisible({ timeout: 15000 });
    void adminCreds;
  });

  test('PF-PROD-130 | Admin loading and error states', async ({ page, adminCreds }) => {
    await establishSession(page, 'admin');
    await page.route('**/api/v1/products**', (route) =>
      route.fulfill({ status: 500, body: JSON.stringify({ success: false, message: 'Server error' }) })
    );
    const adminPage = new AdminProductsPage(page);
    await adminPage.goto();
    await expect(page.locator('text=/Failed to load products/i')).toBeVisible({ timeout: 15000 });
  });
});
