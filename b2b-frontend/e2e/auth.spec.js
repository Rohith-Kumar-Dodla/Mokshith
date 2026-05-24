import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display landing page with login button', async ({ page }) => {
    await expect(page).toHaveTitle(/B2B/);
    const loginButton = page.locator('text=/login|sign in/i').first();
    await expect(loginButton).toBeVisible();
  });

  test('should navigate to login page', async ({ page }) => {
    await page.click('text=/login|sign in/i');
    await expect(page).toHaveURL(/.*login/);
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });

  test('should show validation errors for empty login form', async ({ page }) => {
    await page.goto('/login');
    const submitButton = page.locator('button[type="submit"]');
    await submitButton.click();
    
    // Check for validation messages
    await expect(page.locator('text=/required|invalid/i').first()).toBeVisible({ timeout: 5000 });
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto('/login');
    
    await page.fill('input[type="email"]', 'invalid@example.com');
    await page.fill('input[type="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');
    
    // Wait for error message
    await expect(page.locator('text=/invalid|incorrect|failed/i').first()).toBeVisible({ timeout: 10000 });
  });

  test('should navigate to register page', async ({ page }) => {
    await page.goto('/login');
    const registerLink = page.locator('text=/register|sign up|create account/i').first();
    await registerLink.click();
    
    await expect(page).toHaveURL(/.*register/);
    await expect(page.locator('input[type="email"]')).toBeVisible();
  });

  test('should show validation errors on register page', async ({ page }) => {
    await page.goto('/register');
    
    const submitButton = page.locator('button[type="submit"]');
    await submitButton.click();
    
    // Should show validation errors
    await expect(page.locator('text=/required|invalid/i').first()).toBeVisible({ timeout: 5000 });
  });

  test('should handle password mismatch on register', async ({ page }) => {
    await page.goto('/register');
    
    await page.fill('input[name="password"], input[type="password"]', 'Password123!');
    const confirmFields = await page.locator('input[type="password"]').count();
    if (confirmFields > 1) {
      await page.fill('input[type="password"]:nth-of-type(2)', 'DifferentPass123!');
      await page.click('button[type="submit"]');
      
      // Should show password mismatch error
      await expect(page.locator('text=/match|same/i').first()).toBeVisible({ timeout: 5000 });
    }
  });
});

test.describe('Protected Routes', () => {
  test('should redirect to login when accessing protected route without auth', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Should redirect to login
    await expect(page).toHaveURL(/.*login/, { timeout: 10000 });
  });

  test('should redirect to login when accessing admin route without auth', async ({ page }) => {
    await page.goto('/admin');
    
    // Should redirect to login
    await expect(page).toHaveURL(/.*login/, { timeout: 10000 });
  });

  test('should redirect to login when accessing profile without auth', async ({ page }) => {
    await page.goto('/profile');
    
    // Should redirect to login
    await expect(page).toHaveURL(/.*login/, { timeout: 10000 });
  });
});

test.describe('Session Management', () => {
  test('should persist session on page reload', async ({ page, context }) => {
    // This test would need valid credentials or mocked auth
    // Skipping actual login, demonstrating pattern
    test.skip(true, 'Requires valid test credentials');
    
    await page.goto('/login');
    // Login with valid credentials
    // Verify dashboard access
    // Reload page
    await page.reload();
    // Should still be on dashboard
    await expect(page).toHaveURL(/.*dashboard/);
  });

  test('should handle logout correctly', async ({ page }) => {
    test.skip(true, 'Requires valid test credentials');
    
    // Login first
    // Click logout
    // Should redirect to landing/login
    // Should not be able to access protected routes
  });
});
