import { test, expect } from '@playwright/test';
import ProductsPage from '../pages/public/ProductsPage';
import loginFlow from '../flows/authentication/login.flow';
import { clearSmokeAuthRateLimits } from '../helpers/smoke.rate-limit.helper';

test.describe('P-PROD-02 | Product Search smoke', () => {
  test.beforeAll(() => {
    clearSmokeAuthRateLimits();
  });

  test('P-PROD-02 | Vendor can search products', async ({ page }) => {
    const productsPage = new ProductsPage(page);

    const consoleErrors: string[] = [];
    const pageErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(String(msg.text()));
    });
    page.on('pageerror', (err) => pageErrors.push(String(err?.message || err)));

    // Authenticate as seeded vendor
    const seededVendorMobile = process.env.TEST_SEEDED_VENDOR_MOBILE || '9000000101';
    const seededVendorPassword = process.env.TEST_SEEDED_VENDOR_PASSWORD || 'Vendor@123';
    await loginFlow(page, seededVendorMobile, seededVendorPassword);

    // Wait for redirect to vendor dashboard
    await page.waitForFunction(() => location.pathname.startsWith('/vendor'), null, { timeout: 15000 });

    // Navigate to Products via link
    const productsLink = page.locator('a[href="/vendor/products"]').first();
    await expect(productsLink).toHaveCount(1);

    // Register products API wait then click
    const productsResponsePromise = page.waitForResponse((resp) => {
      return resp.url().includes('/api/v1/products') && resp.request().method() === 'GET';
    }, { timeout: 10000 });
    await productsLink.click();
    await productsResponsePromise;

    // Ensure page loaded
    await productsPage.waitForLoad(15000);

    // Use first product name as existing product search term
    const existingName = (await productsPage.getFirstProductName())?.trim() ?? '';
    expect(existingName.length, 'Expected at least one product to exist for search seed').toBeGreaterThan(0);

    // Search for existing product
    const searchRespPromise1 = page.waitForResponse((resp) => {
      return resp.url().includes('/api/v1/search') && resp.request().method() === 'GET';
    }, { timeout: 10000 });
    await productsPage.search(existingName);
    await searchRespPromise1;
    await productsPage.waitForLoad(10000);

    const countAfterExisting = await productsPage.getProductsCount();
    expect(countAfterExisting, 'Expected at least one product for existing-name search').toBeGreaterThan(0);

    // Search for a non-existing term
    const nonExistent = `no-such-product-${Date.now()}`;
    const searchRespPromise2 = page.waitForResponse((resp) => {
      return resp.url().includes('/api/v1/search') && resp.request().method() === 'GET';
    }, { timeout: 10000 });
    await productsPage.search(nonExistent);
    await searchRespPromise2;

    // Validate empty state shown
    const noProducts = page.locator('text=No products found');
    await expect(noProducts).toHaveCount(1);

    // No console or page errors
    expect(consoleErrors.length, `Console errors: ${consoleErrors.join(' | ')}`).toBe(0);
    expect(pageErrors.length, `Page errors: ${pageErrors.join(' | ')}`).toBe(0);
  });
});

