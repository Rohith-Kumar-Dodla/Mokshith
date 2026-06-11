import { test, expect } from '@playwright/test';

test.describe('SuperAdmin Flow E2E', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'superadmin@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/.*super-admin\/dashboard/);
  });

  test('should display superadmin dashboard', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Dashboard');
    await expect(page.locator('text=Users')).toBeVisible();
    await expect(page.locator('text=Admins')).toBeVisible();
    await expect(page.locator('text=Vendors')).toBeVisible();
    await expect(page.locator('text=Delivery Partners')).toBeVisible();
  });

  test('should manage users (suspend, activate, delete)', async ({ page }) => {
    await page.goto('/super-admin/users');
    const suspendButton = page.locator('text=Suspend').first();
    await suspendButton.click();
    await expect(page.locator('text=User suspended')).toBeVisible();

    const activateButton = page.locator('text=Activate').first();
    await activateButton.click();
    await expect(page.locator('text=User activated')).toBeVisible();
  });

  test('should create and manage admins', async ({ page }) => {
    await page.goto('/super-admin/admins');
    await page.click('text=Add Admin');
    await page.fill('input[name="name"]', 'New Admin');
    await page.fill('input[name="email"]', 'newadmin@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('text=Create');
    await expect(page.locator('text=Admin created')).toBeVisible();
  });

  test('should view platform analytics', async ({ page }) => {
    await page.goto('/super-admin/analytics');
    await expect(page.locator('text=Total Users')).toBeVisible();
    await expect(page.locator('text=Total Orders')).toBeVisible();
    await expect(page.locator('text=Revenue')).toBeVisible();
  });

  test('should approve and reject vendors', async ({ page }) => {
    await page.goto('/super-admin/vendors');
    const approveButton = page.locator('text=Approve').first();
    await approveButton.click();
    await expect(page.locator('text=Vendor approved')).toBeVisible();
  });
});
