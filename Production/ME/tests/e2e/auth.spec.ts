import { test, expect } from '@playwright/test';

test.describe('Authentication Flow E2E', () => {
  test('should show validation errors on login', async ({ page }) => {
    await page.goto('/login');
    const mobileInput = page.locator('input[name="mobile"]');
    await expect(mobileInput).toHaveAttribute('required', '');
    await page.click('button[type="submit"]');
    await expect(mobileInput).toBeFocused();
  });

  test('should redirect to login when accessing protected route without auth', async ({ page }) => {
    await page.goto('/admin/dashboard');
    await expect(page).toHaveURL(/.*login/);
  });
});

// Full-stack login/logout flows require a running API.
// UI-level logout confirmation and navigation are covered in navigation.spec.ts.
