import { test, expect } from '@playwright/test';

test.describe('Admin Flow E2E', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'admin@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/.*admin\/dashboard/);
  });

  test('should display admin dashboard', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Dashboard');
    await expect(page.locator('text=Products')).toBeVisible();
    await expect(page.locator('text=Orders')).toBeVisible();
    await expect(page.locator('text=Vendors')).toBeVisible();
  });

  test('should manage products (add, edit, delete)', async ({ page }) => {
    await page.goto('/admin/products');
    await page.click('text=Add Product');
    await page.fill('input[name="name"]', 'New Product');
    await page.fill('input[name="price"]', '100');
    await page.fill('input[name="stock"]', '50');
    await page.click('text=Save');
    await expect(page.locator('text=Product added')).toBeVisible();

    const editButton = page.locator('text=Edit').first();
    await editButton.click();
    await page.fill('input[name="name"]', 'Updated Product');
    await page.click('text=Save');
    await expect(page.locator('text=Product updated')).toBeVisible();
  });

  test('should approve and reject vendors', async ({ page }) => {
    await page.goto('/admin/vendors');
    const approveButton = page.locator('text=Approve').first();
    await approveButton.click();
    await expect(page.locator('text=Vendor approved')).toBeVisible();
  });

  test('should assign delivery partner', async ({ page }) => {
    await page.goto('/admin/delivery-assignment');
    const assignButton = page.locator('text=Assign').first();
    await assignButton.click();
    await page.click('text=Select Partner');
    await page.click('text=John Doe');
    await page.click('text=Confirm');
    await expect(page.locator('text=Delivery assigned')).toBeVisible();
  });

  test('should search and filter orders', async ({ page }) => {
    await page.goto('/admin/orders');
    await page.click('text=Status');
    await page.click('text=Pending');
    await expect(page.locator('text=Pending')).toBeVisible();
  });

  test('should view analytics', async ({ page }) => {
    await page.goto('/admin/analytics');
    await expect(page.locator('text=Total Orders')).toBeVisible();
    await expect(page.locator('text=Revenue')).toBeVisible();
    await expect(page.locator('text=Active Vendors')).toBeVisible();
  });
});
