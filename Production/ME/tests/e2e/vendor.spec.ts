import { test, expect } from '@playwright/test';

test.describe('Vendor Flow E2E', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'vendor@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/.*vendor\/dashboard/);
  });

  test('should display vendor dashboard', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Dashboard');
    await expect(page.locator('text=Products')).toBeVisible();
    await expect(page.locator('text=Orders')).toBeVisible();
    await expect(page.locator('text=Cart')).toBeVisible();
  });

  test('should browse and search products', async ({ page }) => {
    await page.goto('/vendor/products');
    await page.fill('input[placeholder*="Search"]', 'rice');
    await page.press('input[placeholder*="Search"]', 'Enter');
    await expect(page.locator('text=Sona Masoori Rice')).toBeVisible();

    const productLink = page.locator('text=Sona Masoori Rice').first();
    await productLink.click();
    await expect(page.locator('h1')).toContainText('Sona Masoori Rice');
    await page.click('text=Add to Cart');
    await expect(page.locator('text=Added to cart')).toBeVisible();
  });

  test('should manage cart and checkout', async ({ page }) => {
    await page.goto('/vendor/cart');
    await page.click('text=Proceed to Checkout');
    await expect(page).toHaveURL(/.*vendor\/checkout/);

    await page.fill('input[name="address"]', '123 Main Street');
    await page.fill('input[name="city"]', 'Hyderabad');
    await page.fill('input[name="pincode"]', '500001');
    await page.click('text=Place Order');
    await expect(page).toHaveURL(/.*vendor\/order-success/);
  });

  test('should view and filter orders', async ({ page }) => {
    await page.goto('/vendor/orders');
    await page.click('text=Status');
    await page.click('text=Delivered');
    await expect(page.locator('text=Delivered')).toBeVisible();
  });

  test('should handle MOQ enforcement', async ({ page }) => {
    await page.goto('/vendor/products');
    const productLink = page.locator('text=Sona Masoori Rice').first();
    await productLink.click();
    await page.fill('input[type="number"]', '5');
    await page.click('text=Add to Cart');
    await expect(page.locator('text=Minimum order quantity is 10')).toBeVisible();
  });
});
