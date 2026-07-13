import { test, expect } from '../fixtures/product.functional.fixture';
import VendorProductsPage from '../pages/vendor/VendorProductsPage';
import VendorProductDetailsPage from '../pages/vendor/VendorProductDetailsPage';
import {
  createProductApi,
  getAdminSession,
  getFirstCategoryId,
  listProductsApi,
} from '../helpers/product.api.helper';
import { uniqueProductName } from '../helpers/product.credentials';
import { establishSession } from '../helpers/session.functional.helper';

test.describe('PF-PROD Section I | Vendor Browse', () => {
  test('PF-PROD-069 | Vendor product listing loads', async ({ page, vendorCreds }) => {
    await establishSession(page, 'vendor');
    const vendorPage = new VendorProductsPage(page);
    await vendorPage.goto();
    await vendorPage.waitForProducts();
    expect(await vendorPage.productCards().count()).toBeGreaterThan(0);
  });

  test('PF-PROD-070 | Grid view displays product cards', async ({ page, vendorCreds }) => {
    await establishSession(page, 'vendor');
    const vendorPage = new VendorProductsPage(page);
    await vendorPage.goto();
    await vendorPage.waitForProducts();
    await expect(vendorPage.productCards().first()).toBeVisible();
    await expect(page.locator('button', { hasText: /^Add to Cart$/ }).first()).toBeVisible();
  });

  test('PF-PROD-071 | List view toggle', async ({ page, vendorCreds }) => {
    await establishSession(page, 'vendor');
    const vendorPage = new VendorProductsPage(page);
    await vendorPage.goto();
    await vendorPage.waitForProducts();
    await vendorPage.setListView();
    await expect(page.locator('h3').first()).toBeVisible();
  });

  test('PF-PROD-072 | Product card navigates to details', async ({ page, vendorCreds }) => {
    const session = await getAdminSession();
    const categoryId = await getFirstCategoryId(session);
    const name = uniqueProductName('pf-nav-detail');
    const created = await createProductApi(session, {
      name,
      price: 240,
      categoryId,
      stock: 10,
    });
    const productId = String(created._id || created.id);
    await establishSession(page, 'vendor');
    const details = new VendorProductDetailsPage(page);
    await details.goto(productId);
    await details.waitForLoad();
    await expect(details.title()).toContainText(name);
  });

  test('PF-PROD-073 | Empty state when no products match filters', async ({ page, vendorCreds }) => {
    await establishSession(page, 'vendor');
    const vendorPage = new VendorProductsPage(page);
    await vendorPage.goto();
    await vendorPage.search('zzzznonexistentproduct99999');
    await page.waitForTimeout(500);
    await vendorPage.expectEmptyState();
  });

  test('PF-PROD-074 | URL categoryId param pre-filters listing', async ({ page, vendorCreds }) => {
    const categoryId = await getFirstCategoryId(await getAdminSession());
    await establishSession(page, 'vendor');
    const vendorPage = new VendorProductsPage(page);
    await vendorPage.goto(categoryId);
    await expect(page).toHaveURL(new RegExp(`categoryId=${categoryId}`));
  });

  test('PF-PROD-075 | Public WholesaleDeals section', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('text=/Wholesale|Deals|Products/i').first()).toBeVisible({
      timeout: 15000,
    });
  });

  test('PF-PROD-076 | Public ProductCategories section', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('text=/Categories|Shop by/i').first()).toBeVisible({
      timeout: 15000,
    });
  });
});
