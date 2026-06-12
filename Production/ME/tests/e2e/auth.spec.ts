import { test, expect } from '@playwright/test';

test.describe('Authentication Flow E2E', () => {
  test('should handle successful login and logout', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="mobile"]', '9876543210');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/.*dashboard/);

    await page.click('[aria-label="Profile"]');
    await page.click('text=Logout');
    await expect(page).toHaveURL(/.*login/);
  });

  test('should handle successful registration', async ({ page }) => {
    await page.goto('/register');
    await page.fill('input[name="name"]', 'John Doe');
    await page.fill('input[name="email"]', 'newuser@example.com');
    await page.fill('input[name="phone"]', '9876543211');
    await page.fill('input[name="password"]', 'password123');
    await page.fill('input[name="confirmPassword"]', 'password123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/.*login/);
  });

  test('should show validation errors on login', async ({ page }) => {
    await page.goto('/login');
    const mobileInput = page.locator('input[name="mobile"]');
    await expect(mobileInput).toHaveAttribute('required', '');
    await page.click('button[type="submit"]');
    await expect(mobileInput).toBeFocused();
  });

  test('should handle successful login', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="mobile"]', '9876543210');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/.*dashboard/);
  });

  test('should redirect to login when accessing protected route without auth', async ({ page }) => {
    await page.goto('/admin/dashboard');
    await expect(page).toHaveURL(/.*login/);
  });

  test('should persist session after page refresh', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="mobile"]', '9876543210');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');

    await page.reload();
    await expect(page).toHaveURL(/.*dashboard/);
  });
});
