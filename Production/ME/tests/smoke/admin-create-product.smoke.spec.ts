import { test, expect } from '@playwright/test';
import loginFlow from '../flows/authentication/login.flow';

test.describe('P-PROD-05 | Admin Create Product smoke', () => {
  test('P-PROD-05 | Admin can create a product via UI', async ({ page }) => {
    const seededAdminMobile = process.env.TEST_SEEDED_ADMIN_MOBILE || '9000000002';
    const seededAdminPassword = process.env.TEST_SEEDED_ADMIN_PASSWORD || 'Admin@123';
    await loginFlow(page, seededAdminMobile, seededAdminPassword);

    // Navigate to admin products
    await page.goto('/admin/products');
    await page.waitForSelector('button:has-text("Add Product")', { timeout: 10000 });

    // Open create modal
    await page.click('button:has-text("Add Product")');
    await page.waitForSelector('form input[placeholder="Enter product name"], form input[type="number"]', { timeout: 10000 });

    // Fill form
    const uniqueName = `smoke-product-${Date.now()}`;
    await page.fill('form input[placeholder="Enter product name"]', uniqueName);

    // Select first category (skip the empty placeholder)
    const categoryOption = await page.locator('form select').locator('option').nth(1);
    const val = await categoryOption.getAttribute('value');
    if (val) {
      await page.selectOption('form select', val);
    }

    await page.fill('form textarea', 'Smoke test product created by automation');
    await page.fill('form input[type="number"]', '100'); // price
    await page.fill('form input[placeholder="Enter product name"]', uniqueName); // ensure name still set
    // Stock input - find by label
    await page.fill('form input[type="number"]', '100');

    // Submit
    await Promise.all([
      page.waitForResponse((resp) => resp.url().includes('/api/') && (resp.request().method() === 'POST' || resp.request().method() === 'PUT'), { timeout: 15000 }),
      page.click('form button:has-text("Save Product")')
    ]);

    // Wait for success message
    const success = page.locator('text=Product created successfully');
    await expect(success).toHaveCount(1);
  });
});

