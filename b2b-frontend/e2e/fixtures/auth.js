import { test as base } from '@playwright/test';

/**
 * Custom fixture for authenticated user testing
 * Provides pre-authenticated context for protected route tests
 */
export const test = base.extend({
  // Authenticated user context fixture
  authenticatedPage: async ({ page }, use) => {
    // Navigate to login page
    await page.goto('/login');
    
    // Fill credentials (use test credentials or env vars)
    await page.fill('[data-testid="email-input"]', process.env.TEST_USER_EMAIL || 'test@example.com');
    await page.fill('[data-testid="password-input"]', process.env.TEST_USER_PASSWORD || 'test123');
    
    // Submit login
    await page.click('[data-testid="login-button"]');
    
    // Wait for successful navigation
    await page.waitForURL('**/dashboard', { timeout: 10000 });
    
    // Provide authenticated page to test
    await use(page);
    
    // Cleanup: logout after test
    await page.click('[data-testid="logout-button"]').catch(() => {});
  },
});

export { expect } from '@playwright/test';
