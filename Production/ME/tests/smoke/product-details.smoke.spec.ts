import { test, expect } from '@playwright/test';
import ProductsPage from '../pages/public/ProductsPage';
import loginFlow from '../flows/authentication/login.flow';

test.describe('P-PROD-04 | Product Details smoke', () => {
  test('P-PROD-04 | Product details page loads for first product', async ({ page }) => {
    const productsPage = new ProductsPage(page);

    // Login as vendor
    const seededVendorMobile = process.env.TEST_SEEDED_VENDOR_MOBILE || '9000000101';
    const seededVendorPassword = process.env.TEST_SEEDED_VENDOR_PASSWORD || 'Vendor@123';
    await loginFlow(page, seededVendorMobile, seededVendorPassword);

    // Wait for redirect to vendor dashboard
    await page.waitForFunction(() => location.pathname.startsWith('/vendor'), null, { timeout: 15000 });

    // Navigate to vendor products
    const productsLink = page.locator('a[href="/vendor/products"]').first();
    await expect(productsLink).toHaveCount(1);
    const productsResponsePromise = page.waitForResponse((resp) => resp.url().includes('/api/v1/products') && resp.request().method() === 'GET', { timeout: 10000 });
    await productsLink.click();
    await productsResponsePromise;
    await productsPage.waitForLoad(15000);

    // Click the first product's details link
    const detailsLink = page.locator('a[href^="/vendor/products/"]').first();
    await expect(detailsLink).toHaveCount(1);
    const navPromise = page.waitForNavigation({ url: /\/vendor\/products\/[^/]+/ , timeout: 10000 });
    await detailsLink.click();
    await navPromise;

    // Assert product details heading present
    const heading = page.locator('h1');
    await expect(heading.first()).toHaveCount(1);
    const nameText = await heading.first().textContent();
    expect(nameText && nameText.trim().length > 0, 'Product name should be visible on details page').toBeTruthy();
  });
});

