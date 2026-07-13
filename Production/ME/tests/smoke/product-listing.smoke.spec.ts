import { test, expect, Page, APIResponse } from '@playwright/test';
import ProductsPage from '../pages/public/ProductsPage';
import loginFlow from '../flows/authentication/login.flow';
import { clearSmokeAuthRateLimits } from '../helpers/smoke.rate-limit.helper';

test.describe('P-PROD-01 | Product Listing smoke', () => {
  test.beforeAll(() => {
    clearSmokeAuthRateLimits();
  });

  test('P-PROD-01 | Product Listing loads successfully', async ({ page }) => {
    const productsPage = new ProductsPage(page);

    const consoleErrors: string[] = [];
    const pageErrors: string[] = [];
    const failedRequests: string[] = [];

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(String(msg.text()));
      }
    });
    page.on('pageerror', (err) => {
      pageErrors.push(String(err?.message || err));
    });
    page.on('requestfailed', (req) => {
      failedRequests.push(`${req.method()} ${req.url()} -> ${req.failure()?.errorText || 'failed'}`);
    });

    // Authenticate as a seeded vendor then navigate to vendor products listing
    const seededVendorMobile = process.env.TEST_SEEDED_VENDOR_MOBILE || '9000000101';
    const seededVendorPassword = process.env.TEST_SEEDED_VENDOR_PASSWORD || 'Vendor@123';
    await loginFlow(page, seededVendorMobile, seededVendorPassword);

    // Wait for client to redirect to vendor dashboard as part of login flow
    await page.waitForFunction(() => location.pathname.startsWith('/vendor'), null, { timeout: 15000 });

    // Follow business flow: navigate to Vendor Dashboard -> click link to Vendor Products
    // Use href-based selector to avoid relying on visible text which may change
    const productsLink = page.locator('a[href="/vendor/products"]').first();
    await expect(productsLink).toHaveCount(1);

    // Register response wait BEFORE clicking to avoid missing a fast network response
    const productsResponsePromise = page.waitForResponse((resp) => {
      return resp.url().includes('/api/v1/products') && resp.request().method() === 'GET';
    }, { timeout: 10000 });

    await productsLink.click();

    // Wait for the products API response and assert OK
    const productsResponse = await productsResponsePromise;

    // Wait for products to render
    await productsPage.waitForLoad(15000);

    // Assert URL is correct
    await expect(page).toHaveURL(/\/products/);

    // Validate API response status
    expect(productsResponse.status(), 'Products API should return 200').toBe(200);

    // Validate UI list not empty
    const count = await productsPage.getProductsCount();
    expect(count, 'Expected at least one product on listing').toBeGreaterThan(0);

    // Validate first product has a non-empty name
    const firstName = (await productsPage.getFirstProductName())?.trim() ?? '';
    expect(firstName.length, 'First product name should be non-empty').toBeGreaterThan(0);

    // Image loading validation moved to P-PROD-10 (Product Images Load).
    // Keep this code as a TODO for the dedicated image smoke:
    /*
    // TODO: P-PROD-10 - Product Images Load
    const imgHandle = await productsPage.firstProductImageHandle();
    if (await imgHandle.count() > 0) {
      const natural = await imgHandle.evaluate((img: HTMLImageElement) => {
        return { complete: img.complete, naturalWidth: img.naturalWidth };
      });
      // Validate image rendering and naturalWidth in P-PROD-10
      expect(natural.complete, 'Product image should be marked complete').toBeTruthy();
      expect(natural.naturalWidth, 'Product image naturalWidth should be > 0').toBeGreaterThan(0);
    }
    */

    // Assert no console errors or page errors
    expect(consoleErrors.length, `Console errors: ${consoleErrors.join(' | ')}`).toBe(0);
    expect(pageErrors.length, `Page errors: ${pageErrors.join(' | ')}`).toBe(0);

    // Assert no failed network requests (allow third-party assets? conservative: fail if API fails)
    const nonApiFailures = failedRequests.filter((r) => r.includes('/api/'));
    expect(nonApiFailures.length, `Failed network requests: ${failedRequests.join(' | ')}`).toBe(0);
  });
});

