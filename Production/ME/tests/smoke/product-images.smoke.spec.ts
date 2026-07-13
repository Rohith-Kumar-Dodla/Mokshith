import { test, expect } from '@playwright/test';
import loginFlow from '../flows/authentication/login.flow';
import VendorProductsPage from '../pages/vendor/VendorProductsPage';
import VendorProductDetailsPage from '../pages/vendor/VendorProductDetailsPage';

const SEEDED_PRODUCT_WITH_IMAGE = 'Category 1 Product 1';

test.describe('P-PROD-10 | Product Images smoke', () => {
  test('P-PROD-10 | Product images load on details page', async ({ page }) => {
    const seededVendorMobile = process.env.TEST_SEEDED_VENDOR_MOBILE || '9000000101';
    const seededVendorPassword = process.env.TEST_SEEDED_VENDOR_PASSWORD || 'Vendor@123';
    await loginFlow(page, seededVendorMobile, seededVendorPassword);

    await page.waitForFunction(() => location.pathname.startsWith('/vendor'), null, { timeout: 15000 });

    const vendorProductsPage = new VendorProductsPage(page);
    const productsResponsePromise = page.waitForResponse(
      (resp) => resp.url().includes('/api/v1/products') && resp.request().method() === 'GET',
      { timeout: 15000 }
    );
    await vendorProductsPage.goto();
    await productsResponsePromise;
    await vendorProductsPage.waitForProducts();
    await vendorProductsPage.search(SEEDED_PRODUCT_WITH_IMAGE);
    const productCard = vendorProductsPage.cardByName(SEEDED_PRODUCT_WITH_IMAGE);
    await expect(productCard).toBeVisible({ timeout: 15000 });
    await productCard.locator('a[href^="/vendor/products/"]').click();

    const detailsPage = new VendorProductDetailsPage(page);
    await detailsPage.waitForLoad();

    const img = detailsPage.heroImage();
    await expect(img).toBeVisible();
    const src = await img.getAttribute('src');
    expect(src && src.length > 0, 'Image src should be present').toBeTruthy();

    const natural = await img.evaluate((imgEl: HTMLImageElement) => ({
      complete: imgEl.complete,
      naturalWidth: imgEl.naturalWidth,
    }));
    expect(natural.complete || natural.naturalWidth > 0, 'Product image should have loaded').toBeTruthy();
  });
});

