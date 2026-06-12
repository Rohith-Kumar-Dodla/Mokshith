import { test, expect } from '@playwright/test';

/**
 * Legacy full-stack delivery scenarios — skipped until Playwright uses API mocks or a test backend.
 */
test.describe.skip('Delivery Partner Flow E2E', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'delivery@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/.*delivery\/dashboard/);
  });

  test('should display delivery dashboard', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Dashboard');
    await expect(page.locator('text=My Deliveries')).toBeVisible();
    await expect(page.locator('text=Earnings')).toBeVisible();
    await expect(page.locator('text=Performance')).toBeVisible();
  });

  test('should manage delivery lifecycle (accept, pickup, deliver)', async ({ page }) => {
    await page.goto('/delivery/assigned-orders');
    const acceptButton = page.locator('text=Accept').first();
    await acceptButton.click();
    await expect(page.locator('text=Delivery accepted')).toBeVisible();

    const pickupButton = page.locator('text=Mark Picked Up').first();
    await pickupButton.click();
    await expect(page.locator('text=Status updated')).toBeVisible();

    const outForDeliveryButton = page.locator('text=Mark Out for Delivery').first();
    await outForDeliveryButton.click();
    await expect(page.locator('text=Status updated')).toBeVisible();
  });

  test('should view earnings and performance', async ({ page }) => {
    await page.goto('/delivery/earnings');
    await expect(page.locator('text=Total Earnings')).toBeVisible();
    await expect(page.locator('text=This Week')).toBeVisible();

    await page.goto('/delivery/performance');
    await expect(page.locator('text=On-Time Delivery')).toBeVisible();
    await expect(page.locator('text=Customer Rating')).toBeVisible();
  });

  test('should filter and search deliveries', async ({ page }) => {
    await page.goto('/delivery/assigned-orders');
    await page.click('text=Status');
    await page.click('text=Assigned');
    await expect(page.locator('text=Assigned')).toBeVisible();
  });
});
