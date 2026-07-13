import { test, expect } from '../fixtures/product.functional.fixture';
import VendorProductsPage from '../pages/vendor/VendorProductsPage';
import {
  createProductApi,
  getAdminSession,
  getFirstCategoryId,
  searchProductsApi,
} from '../helpers/product.api.helper';
import { uniqueProductName } from '../helpers/product.credentials';
import { establishSession } from '../helpers/session.functional.helper';

test.describe('PF-PROD Section J | Vendor Search', () => {
  let searchName = '';

  test.beforeAll(async () => {
    const session = await getAdminSession();
    const categoryId = await getFirstCategoryId(session);
    searchName = uniqueProductName('pf-searchable');
    await createProductApi(session, {
      name: searchName,
      price: 250,
      categoryId,
      stock: 20,
    });
  });

  test('PF-PROD-077 | Search returns matching products', async ({ page, vendorCreds }) => {
    await establishSession(page, 'vendor');
    const vendorPage = new VendorProductsPage(page);
    await vendorPage.goto();
    await vendorPage.search(searchName);
    await page.waitForTimeout(500);
    await expect(vendorPage.cardByName(searchName)).toBeVisible({ timeout: 10000 });
  });

  test('PF-PROD-078 | Search with no matches', async ({ page, vendorCreds }) => {
    await establishSession(page, 'vendor');
    const vendorPage = new VendorProductsPage(page);
    await vendorPage.goto();
    await vendorPage.search('zzzzno-match-xyz-99999');
    await page.waitForTimeout(500);
    await vendorPage.expectEmptyState();
  });

  test('PF-PROD-079 | Search is case-insensitive', async () => {
    const results = await searchProductsApi(searchName.toUpperCase());
    const arr = Array.isArray(results) ? results : [];
    const found = arr.some((p: { name?: string }) =>
      p.name?.toLowerCase().includes(searchName.toLowerCase())
    );
    expect(found).toBe(true);
  });

  test('PF-PROD-080 | Search bypasses client-side filters', async ({ page, vendorCreds }) => {
    await establishSession(page, 'vendor');
    const vendorPage = new VendorProductsPage(page);
    await vendorPage.goto();
    await vendorPage.toggleFilters();
    await vendorPage.search(searchName);
    await page.waitForTimeout(500);
    await expect(vendorPage.cardByName(searchName)).toBeVisible({ timeout: 10000 });
  });

  test('PF-PROD-081 | Search limit backend max 20', async () => {
    const results = await searchProductsApi('product');
    const arr = Array.isArray(results) ? results : [];
    expect(arr.length).toBeLessThanOrEqual(20);
  });
});
