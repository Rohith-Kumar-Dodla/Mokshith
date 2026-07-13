import { test, expect } from '@playwright/test';
import loginFlow from '../flows/authentication/login.flow';

test.describe('P-PROD-06 | Admin Edit Product smoke', () => {
  test('P-PROD-06 | Admin can edit an existing product', async ({ page }) => {
    const seededAdminMobile = process.env.TEST_SEEDED_ADMIN_MOBILE || '9000000002';
    const seededAdminPassword = process.env.TEST_SEEDED_ADMIN_PASSWORD || 'Admin@123';
    await loginFlow(page, seededAdminMobile, seededAdminPassword);

    await page.goto('/admin/products');
    // Wait for table rows
    await page.waitForSelector('table tbody tr', { timeout: 15000 });

    // Click first Edit button
    await page.click('button[title="Edit"]');
    await page.waitForSelector('form input[placeholder="Enter product name"]', { timeout: 10000 });

    // Append suffix to product name
    const nameInput = page.locator('form input[placeholder="Enter product name"]');
    const current = (await nameInput.inputValue()) || '';
    const edited = `${current}-edited`;
    await nameInput.fill(edited);

    // Submit changes
    await Promise.all([
      page.waitForResponse((resp) => resp.url().includes('/api/') && (resp.request().method() === 'PUT' || resp.request().method() === 'POST'), { timeout: 15000 }),
      page.click('form button:has-text("Update Product"), form button:has-text("Save Product")')
    ]);

    // Wait for success
    const success = page.locator('text=Product updated successfully');
    await expect(success).toHaveCount(1);
  });
});

