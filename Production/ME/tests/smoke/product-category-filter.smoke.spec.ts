import { test, expect } from '@playwright/test';
import ProductsPage from '../pages/public/ProductsPage';
import loginFlow from '../flows/authentication/login.flow';

test.describe('P-PROD-03 | Category Filter smoke', () => {
  test('P-PROD-03 | Vendor can filter products by category', async ({ page }) => {
    const productsPage = new ProductsPage(page);

    const consoleErrors: string[] = [];
    const pageErrors: string[] = [];
    const requestsLog = [];
    const responsesLog = [];
    const requestFailedLog = [];

    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(String(msg.text()));
    });
    page.on('pageerror', (err) => pageErrors.push(String(err?.message || err)));
    page.on('request', (req) => {
      requestsLog.push({ url: req.url(), method: req.method(), timestamp: Date.now() });
    });
    page.on('response', async (res) => {
      let body = '';
      try { body = await res.text(); } catch (e) { body = '[body read error]'; }
      responsesLog.push({ url: res.url(), status: res.status(), body: body.slice(0,2000), timestamp: Date.now() });
    });
    page.on('requestfailed', (req) => {
      const f = req.failure ? req.failure() : null;
      requestFailedLog.push({ url: req.url(), method: req.method(), errorText: f?.errorText ?? null, timestamp: Date.now() });
    });

    // Login
    const seededVendorMobile = process.env.TEST_SEEDED_VENDOR_MOBILE || '9000000101';
    const seededVendorPassword = process.env.TEST_SEEDED_VENDOR_PASSWORD || 'Vendor@123';
    await loginFlow(page, seededVendorMobile, seededVendorPassword);

    // Instrumentation output: capture auth/login lifecycle
    const authRequests = requestsLog.filter((r) => r.url.includes('/auth/login'));
    const authResponses = responsesLog.filter((r) => r.url.includes('/auth/login'));
    const authFailures = requestFailedLog.filter((r) => r.url.includes('/auth/login'));
    console.log(JSON.stringify({ authRequests, authResponses, authFailures, consoleErrors, pageErrors }, null, 2));

    await page.waitForFunction(() => location.pathname.startsWith('/vendor'), null, { timeout: 15000 });

    // Navigate to Products
    const productsLink = page.locator('a[href="/vendor/products"]').first();
    await expect(productsLink).toHaveCount(1);
    const productsResponsePromise = page.waitForResponse((resp) => {
      return resp.url().includes('/api/v1/products') && resp.request().method() === 'GET';
    }, { timeout: 10000 });
    await productsLink.click();
    await productsResponsePromise;
    await productsPage.waitForLoad(15000);

    // Initial product count
    const initialCount = await productsPage.getProductsCount();
    expect(initialCount, 'Expected at least one product initially').toBeGreaterThan(0);

    // Read first product's category (use ProductCard category selector)
    const firstCategoryName = (await page.locator('p.text-xs.text-blue-600').first().textContent())?.trim() ?? '';
    expect(firstCategoryName.length, 'Expected product to have a category text').toBeGreaterThan(0);

    // Open filters panel
    await page.click('button:has-text("Filters")');
    const categoryCheckbox = page.locator('label', { hasText: firstCategoryName }).locator('input[type="checkbox"]');
    await expect(categoryCheckbox).toHaveCount(1);

    // Select category
    await categoryCheckbox.click();

    // Wait for UI update: at least one product displayed and all belong to selected category
    await productsPage.waitForLoad(10000);
    const cards = page.locator('div.bg-white.rounded-xl.shadow-sm.border.border-gray-100').filter({ has: page.locator('h3') });
    const countAfterFilter = await cards.count();
    expect(countAfterFilter, 'Expected at least one product after filtering').toBeGreaterThan(0);

    for (let i = 0; i < countAfterFilter; i++) {
      const cat = (await cards.nth(i).locator('p.text-xs.text-blue-600').first().textContent())?.trim() ?? '';
      expect(cat, `Product at index ${i} should belong to category ${firstCategoryName}`).toBe(firstCategoryName);
    }

    // Clear filters
    const clearBtn = page.locator('button:has-text("Clear All")').first();
    await expect(clearBtn).toHaveCount(1);
    await clearBtn.click();

    // Wait for list to restore
    await productsPage.waitForLoad(10000);
    const countAfterClear = await productsPage.getProductsCount();
    expect(countAfterClear, 'Expected product list to return after clearing filters').toBeGreaterThan(0);
    expect(countAfterClear, 'Expected cleared product count to be >= initial').toBeGreaterThanOrEqual(initialCount);

    // No console or page errors
    expect(consoleErrors.length, `Console errors: ${consoleErrors.join(' | ')}`).toBe(0);
    expect(pageErrors.length, `Page errors: ${pageErrors.join(' | ')}`).toBe(0);
  });
});

