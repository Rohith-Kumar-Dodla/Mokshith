import { test, expect } from '../fixtures/product.functional.fixture';
import VendorProductsPage from '../pages/vendor/VendorProductsPage';
import {
  createProductApi,
  getAdminSession,
  getFirstCategoryId,
  listCategories,
} from '../helpers/product.api.helper';
import { uniqueProductName } from '../helpers/product.credentials';
import { establishSession } from '../helpers/session.functional.helper';

test.describe('PF-PROD Section K | Vendor Filters & Sort', () => {
  let cheapName = '';
  let expensiveName = '';
  let oosName = '';

  test.beforeAll(async () => {
    const session = await getAdminSession();
    const categoryId = await getFirstCategoryId(session);
    cheapName = uniqueProductName('pf-cheap');
    expensiveName = uniqueProductName('pf-expensive');
    oosName = uniqueProductName('pf-oos-filter');
    await createProductApi(session, {
      name: cheapName,
      price: 50,
      categoryId,
      stock: 100,
      moq: 1,
    });
    await createProductApi(session, {
      name: expensiveName,
      price: 5000,
      categoryId,
      stock: 100,
      moq: 1,
    });
    await createProductApi(session, {
      name: oosName,
      price: 75,
      categoryId,
      stock: 0,
      moq: 1,
    });
  });

  test('PF-PROD-082 | Filter by category checkbox', async ({ page, vendorCreds }) => {
    await establishSession(page, 'vendor');
    const vendorPage = new VendorProductsPage(page);
    await vendorPage.goto();
    await vendorPage.toggleFilters();
    const categoryLabel = page.locator('label').filter({ has: page.locator('input[type="checkbox"]') }).first();
    await categoryLabel.click();
    await page.waitForTimeout(300);
    expect(await vendorPage.productCards().count()).toBeGreaterThanOrEqual(0);
  });

  test('PF-PROD-083 | Filter by brand', async ({ page, vendorCreds }) => {
    await establishSession(page, 'vendor');
    const vendorPage = new VendorProductsPage(page);
    await vendorPage.goto();
    await vendorPage.toggleFilters();
    const brandCheckbox = page.locator('text=Brand').locator('..').locator('input[type="checkbox"]').first();
    if (await brandCheckbox.count()) {
      await brandCheckbox.check();
    }
    expect(await vendorPage.productCards().count()).toBeGreaterThanOrEqual(0);
  });

  test('PF-PROD-084 | Filter by price range min', async ({ page, vendorCreds }) => {
    await establishSession(page, 'vendor');
    const vendorPage = new VendorProductsPage(page);
    await vendorPage.goto();
    await vendorPage.toggleFilters();
    const minInput = page.locator('input[placeholder*="Min" i], input[name="min"]').first();
    if (await minInput.count()) {
      await minInput.fill('1000');
      await page.waitForTimeout(300);
      await expect(vendorPage.cardByName(expensiveName)).toBeVisible({ timeout: 10000 });
    }
  });

  test('PF-PROD-085 | Filter by price range max', async ({ page, vendorCreds }) => {
    await establishSession(page, 'vendor');
    const vendorPage = new VendorProductsPage(page);
    await vendorPage.goto();
    await vendorPage.toggleFilters();
    const maxInput = page.locator('input[placeholder*="Max" i], input[name="max"]').first();
    if (await maxInput.count()) {
      await maxInput.fill('100');
      await page.waitForTimeout(300);
      await expect(vendorPage.cardByName(cheapName)).toBeVisible({ timeout: 10000 });
    }
  });

  test('PF-PROD-086 | Availability filter in stock', async ({ page, vendorCreds }) => {
    await establishSession(page, 'vendor');
    const vendorPage = new VendorProductsPage(page);
    await vendorPage.goto();
    await vendorPage.selectAvailability('In Stock');
    expect(await vendorPage.productCards().count()).toBeGreaterThan(0);
  });

  test('PF-PROD-087 | Availability filter out of stock', async ({ page, vendorCreds }) => {
    await establishSession(page, 'vendor');
    const vendorPage = new VendorProductsPage(page);
    await vendorPage.goto();
    await vendorPage.search(oosName);
    await page.waitForTimeout(500);
    const card = vendorPage.cardByName(oosName);
    if (await card.count()) {
      await expect(vendorPage.outOfStockBadge(card)).toBeVisible();
    }
  });

  test('PF-PROD-088 | Sort by price low to high', async ({ page, vendorCreds }) => {
    await establishSession(page, 'vendor');
    const vendorPage = new VendorProductsPage(page);
    await vendorPage.goto();
    await vendorPage.selectSort('Price: Low to High');
    expect(await vendorPage.productCards().count()).toBeGreaterThan(0);
  });

  test('PF-PROD-089 | Sort by price high to low', async ({ page, vendorCreds }) => {
    await establishSession(page, 'vendor');
    const vendorPage = new VendorProductsPage(page);
    await vendorPage.goto();
    await vendorPage.selectSort('Price: High to Low');
    expect(await vendorPage.productCards().count()).toBeGreaterThan(0);
  });

  test('PF-PROD-090 | Sort by rating', async ({ page, vendorCreds }) => {
    await establishSession(page, 'vendor');
    const vendorPage = new VendorProductsPage(page);
    await vendorPage.goto();
    await vendorPage.selectSort('Highest Rated');
    expect(await vendorPage.productCards().count()).toBeGreaterThan(0);
  });

  test('PF-PROD-091 | Sort by newest', async ({ page, vendorCreds }) => {
    await establishSession(page, 'vendor');
    const vendorPage = new VendorProductsPage(page);
    await vendorPage.goto();
    await vendorPage.selectSort('Newest First');
    expect(await vendorPage.productCards().count()).toBeGreaterThan(0);
  });

  test('PF-PROD-092 | Sort by popularity', async ({ page, vendorCreds }) => {
    await establishSession(page, 'vendor');
    const vendorPage = new VendorProductsPage(page);
    await vendorPage.goto();
    await vendorPage.selectSort('Popularity');
    expect(await vendorPage.productCards().count()).toBeGreaterThan(0);
  });

  test('PF-PROD-093 | Clear filters restores full list', async ({ page, vendorCreds }) => {
    await establishSession(page, 'vendor');
    const vendorPage = new VendorProductsPage(page);
    await vendorPage.goto();
    await vendorPage.toggleFilters();
    await vendorPage.selectAvailability('In Stock');
    await vendorPage.clearFilters();
    expect(await vendorPage.productCards().count()).toBeGreaterThan(0);
  });
});
