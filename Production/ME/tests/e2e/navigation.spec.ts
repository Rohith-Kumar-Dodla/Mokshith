import { test, expect } from '@playwright/test';
import { mockNotifications, seedAuthenticatedSession } from './helpers/auth';

const MOBILE_VIEWPORTS = [
  { width: 320, height: 568 },
  { width: 360, height: 800 },
  { width: 390, height: 844 },
  { width: 768, height: 1024 },
];

const DESKTOP_VIEWPORTS = [
  { width: 1024, height: 1366 },
  { width: 1280, height: 720 },
  { width: 1440, height: 900 },
  { width: 1920, height: 1080 },
];

test.describe('Logout Confirmation Dialog', () => {
  test.beforeEach(async ({ page }) => {
    await mockNotifications(page);
    const { dashboardRoute } = await seedAuthenticatedSession(page, 'admin');
    await page.goto(dashboardRoute);
    await expect(page.getByLabelText('Main navigation')).toBeVisible({ timeout: 10000 });
  });

  test('opens dialog and cancels without leaving dashboard', async ({ page }) => {
    await page.getByRole('button', { name: /^Logout$/i }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByText('Confirm Logout')).toBeVisible();
    await expect(page.getByText('Are you sure you want to logout from your account?')).toBeVisible();

    await page.getByRole('button', { name: 'Cancel' }).click();
    await expect(page.getByRole('dialog')).not.toBeVisible();
    await expect(page).toHaveURL(/admin\/dashboard/);
  });

  test('confirms logout and navigates to login', async ({ page }) => {
    await page.getByRole('button', { name: /^Logout$/i }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Logout' }).click();
    await expect(page).toHaveURL(/login/, { timeout: 10000 });
  });

  test('closes dialog with Escape key', async ({ page }) => {
    await page.getByRole('button', { name: /^Logout$/i }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).not.toBeVisible();
  });
});

test.describe('Mobile Hamburger Navigation', () => {
  for (const viewport of MOBILE_VIEWPORTS) {
    test(`opens and closes at ${viewport.width}x${viewport.height}`, async ({ page }) => {
      await page.setViewportSize(viewport);
      await mockNotifications(page);
      const { dashboardRoute } = await seedAuthenticatedSession(page, 'admin');
      await page.goto(dashboardRoute);

      const openButton = page.getByRole('button', { name: 'Open menu' });
      await expect(openButton).toBeVisible();
      await openButton.click();
      await expect(page.getByRole('button', { name: 'Close menu' })).toBeVisible();
      await expect(page.getByLabelText('Main navigation')).toBeVisible();

      await page.getByRole('button', { name: 'Close menu' }).click();
      await expect(page.getByRole('button', { name: 'Open menu' })).toBeVisible();
    });
  }

  test('closes menu when backdrop is clicked', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await mockNotifications(page);
    const { dashboardRoute } = await seedAuthenticatedSession(page, 'vendor');
    await page.goto(dashboardRoute);

    await page.getByRole('button', { name: 'Open menu' }).click();
    await page.locator('.fixed.inset-0.bg-black\\/50').click({ force: true });
    await expect(page.getByRole('button', { name: 'Open menu' })).toBeVisible();
  });

  test('closes menu on route change', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await mockNotifications(page);
    const { dashboardRoute } = await seedAuthenticatedSession(page, 'admin');
    await page.goto(dashboardRoute);

    await page.getByRole('button', { name: 'Open menu' }).click();
    await page.getByRole('link', { name: /Orders/i }).click();
    await expect(page).toHaveURL(/admin\/orders/);
    await expect(page.getByRole('button', { name: 'Open menu' })).toBeVisible();
  });

  test('locks body scroll while menu is open', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await mockNotifications(page);
    const { dashboardRoute } = await seedAuthenticatedSession(page, 'admin');
    await page.goto(dashboardRoute);

    await page.getByRole('button', { name: 'Open menu' }).click();
    const overflow = await page.evaluate(() => document.body.style.overflow);
    expect(overflow).toBe('hidden');
  });
});

test.describe('Desktop Sidebar Navigation', () => {
  for (const viewport of DESKTOP_VIEWPORTS) {
    test(`shows persistent sidebar at ${viewport.width}x${viewport.height}`, async ({ page }) => {
      await page.setViewportSize(viewport);
      await mockNotifications(page);
      const { dashboardRoute } = await seedAuthenticatedSession(page, 'admin');
      await page.goto(dashboardRoute);

      await expect(page.getByLabelText('Main navigation')).toBeVisible();
      await expect(page.getByRole('button', { name: 'Open menu' })).not.toBeVisible();
      await page.getByRole('link', { name: /Products/i }).click();
      await expect(page).toHaveURL(/admin\/products/);
    });
  }
});
