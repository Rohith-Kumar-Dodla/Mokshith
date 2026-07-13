import { test, expect } from '@playwright/test';
import loginFlow from '../flows/authentication/login.flow';
import { clearSmokeAuthRateLimits } from '../helpers/smoke.rate-limit.helper';

test.describe('P-PROD-08 | Vendor Ownership smoke', () => {
  test.beforeAll(() => {
    clearSmokeAuthRateLimits();
  });

  test('P-PROD-08 | Vendor cannot access admin routes and is redirected to vendor dashboard', async ({ page }) => {
    const seededVendorMobile = process.env.TEST_SEEDED_VENDOR_MOBILE || '9000000101';
    const seededVendorPassword = process.env.TEST_SEEDED_VENDOR_PASSWORD || 'Vendor@123';
    await loginFlow(page, seededVendorMobile, seededVendorPassword);

    // Attempt to navigate to admin products
    await page.goto('/admin/products');
    // Expect redirect to vendor dashboard
    await expect(page).toHaveURL(/\/vendor\/dashboard/);
  });
});

