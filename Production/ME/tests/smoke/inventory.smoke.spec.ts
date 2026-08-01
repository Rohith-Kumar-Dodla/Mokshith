import { test, expect } from '../fixtures/product.functional.fixture';
import AdminInventoryPage from '../pages/admin/AdminInventoryPage';
import { establishSession } from '../helpers/session.functional.helper';
import { loginApi, type ApiSession } from '../helpers/auth.api.helper';
import { getVendorCredentials } from '../helpers/product.credentials';
import { addToCartApi, clearCartApi } from '../helpers/cart.api.helper';
import { placeCodOrderApi } from '../helpers/order.api.helper';
import { clearValidationRateLimits } from '../helpers/cart.validation.helper';
import {
  authHeaders,
  getInventoryRaw,
  getInventoryStatsRaw,
  getInventoryStockForProduct,
  patchInventoryUpdateRaw,
  seedInventorySmokeData,
  setInventoryStockApi,
  type InventorySmokeSeed,
} from '../helpers/inventory.smoke.helper';

let adminSession: ApiSession;
let vendorSession: ApiSession;
let seed: InventorySmokeSeed;

test.describe('Inventory Smoke Suite', () => {
  test.beforeAll(async () => {
    clearValidationRateLimits();
    const seeded = await seedInventorySmokeData();
    adminSession = seeded.adminSession;
    seed = seeded.seed;
    const vendorCreds = getVendorCredentials(1);
    vendorSession = await loginApi(vendorCreds.mobile, vendorCreds.password);
  });

  test('IS-INV-001 | Unauthenticated blocked from Inventory page', async ({ page }) => {
    await page.goto('/admin/inventory');
    await expect(page).toHaveURL(/\/login/);
  });

  test('IS-INV-002 | Vendor redirected from Inventory page', async ({ page }) => {
    await establishSession(page, 'vendor');
    await page.goto('/admin/inventory');
    await expect(page).toHaveURL(/\/vendor\/dashboard/);
  });

  test('IS-INV-003 | Admin Inventory page loads', async ({ page }) => {
    await establishSession(page, 'admin');
    const inventoryPage = new AdminInventoryPage(page);
    await inventoryPage.goto();
    await expect(inventoryPage.pageHeading()).toBeVisible({ timeout: 15000 });
    await expect(
      page.getByText('Monitor and manage inventory levels within your assigned area')
    ).toBeVisible();
  });

  test('IS-INV-004 | Inventory table and stats render', async ({ page }) => {
    await establishSession(page, 'admin');
    const inventoryPage = new AdminInventoryPage(page);
    await inventoryPage.goto();
    await inventoryPage.waitForTable();
    await inventoryPage.expectStatsVisible();
    await expect(page.getByTestId('inventory-stat-total-stock')).toBeVisible();
    await expect(page.getByTestId('inventory-stat-out-of-stock')).toBeVisible();
    await expect(page.getByTestId('inventory-stat-inventory-value')).toBeVisible();
  });

  test('IS-INV-005 | Sidebar navigates to Inventory', async ({ page }) => {
    await establishSession(page, 'admin');
    await page.goto('/admin/dashboard');
    await page.getByLabel('Main navigation').getByRole('link', { name: /^Inventory$/ }).click();
    await expect(page).toHaveURL(/\/admin\/inventory/);
    await expect(page.getByRole('heading', { name: 'Inventory Control' })).toBeVisible();
  });

  test('IS-INV-006 | Search finds seeded inventory product', async ({ page }) => {
    await establishSession(page, 'admin');
    const inventoryPage = new AdminInventoryPage(page);
    await inventoryPage.goto();
    await inventoryPage.waitForTable();
    await inventoryPage.search(seed.standard.name);
    await expect(inventoryPage.rowByProductName(seed.standard.name)).toBeVisible({ timeout: 15000 });
  });

  test('IS-INV-007 | Search with no matches shows empty state', async ({ page }) => {
    await establishSession(page, 'admin');
    const inventoryPage = new AdminInventoryPage(page);
    await inventoryPage.goto();
    await inventoryPage.waitForTable();
    await inventoryPage.search('zzz-no-such-inventory-product-999999');
    await expect(inventoryPage.emptyState()).toBeVisible({ timeout: 10000 });
  });

  test('IS-INV-008 | Update Stock modal opens with current quantity', async ({ page }) => {
    await establishSession(page, 'admin');
    const inventoryPage = new AdminInventoryPage(page);
    await inventoryPage.goto();
    await inventoryPage.waitForTable();
    await inventoryPage.search(seed.standard.name);
    await inventoryPage.openStockModalForProduct(seed.standard.name);
    await expect(page.getByText(new RegExp(`Current Stock:\\s*${seed.standard.stock}`))).toBeVisible();
    const value = await inventoryPage.stockQuantityInput().inputValue();
    expect(Number(value)).toBe(seed.standard.stock);
  });

  test('IS-INV-009 | Negative stock input rejected client-side', async ({ page }) => {
    await establishSession(page, 'admin');
    const inventoryPage = new AdminInventoryPage(page);
    await inventoryPage.goto();
    await inventoryPage.waitForTable();
    await inventoryPage.search(seed.standard.name);
    await inventoryPage.openStockModalForProduct(seed.standard.name);
    await inventoryPage.setStockQuantity(-3);
    await page.getByRole('dialog', { name: /update stock/i }).getByRole('button', { name: /^Update Stock$/i }).click();
    await expect(page.getByText('Enter a valid stock quantity')).toBeVisible();
    await expect(page.getByRole('dialog', { name: /update stock/i })).toBeVisible();
  });

  test('IS-INV-010 | Admin SET stock via modal succeeds', async ({ page }) => {
    await establishSession(page, 'admin');
    const inventoryPage = new AdminInventoryPage(page);
    await inventoryPage.goto();
    await inventoryPage.waitForTable();
    await inventoryPage.search(seed.standard.name);
    await inventoryPage.openStockModalForProduct(seed.standard.name);
    const nextStock = seed.standard.stock + 7;
    await inventoryPage.setStockQuantity(nextStock);
    const response = await inventoryPage.submitStockUpdate();
    expect(response.status()).toBe(200);
    await inventoryPage.search(seed.standard.name);
    await expect(inventoryPage.stockCellInRow(seed.standard.name)).toContainText(String(nextStock), {
      timeout: 15000,
    });
    seed.standard.stock = nextStock;
  });

  test('IS-INV-011 | Out of stock badge renders for zero stock', async ({ page }) => {
    await setInventoryStockApi(adminSession, seed.statusProbe, 0);
    await establishSession(page, 'admin');
    const inventoryPage = new AdminInventoryPage(page);
    await inventoryPage.goto();
    await inventoryPage.waitForTable();
    await inventoryPage.search(seed.statusProbe.name);
    await expect(inventoryPage.rowByProductName(seed.statusProbe.name)).toBeVisible();
    await expect(inventoryPage.statusBadgeInRow(seed.statusProbe.name)).toContainText(/Out of stock/i);
  });

  test('IS-INV-012 | Low stock badge renders at threshold', async ({ page }) => {
    await setInventoryStockApi(adminSession, seed.statusProbe, 5);
    await establishSession(page, 'admin');
    const inventoryPage = new AdminInventoryPage(page);
    await inventoryPage.goto();
    await inventoryPage.waitForTable();
    await inventoryPage.search(seed.statusProbe.name);
    await expect(inventoryPage.statusBadgeInRow(seed.statusProbe.name)).toContainText(/Low stock/i);
    await expect(page.getByText('Low Stock Alert')).toBeVisible();
  });

  test('IS-INV-013 | Healthy badge renders above threshold', async ({ page }) => {
    await setInventoryStockApi(adminSession, seed.statusProbe, 25);
    await establishSession(page, 'admin');
    const inventoryPage = new AdminInventoryPage(page);
    await inventoryPage.goto();
    await inventoryPage.waitForTable();
    await inventoryPage.search(seed.statusProbe.name);
    await expect(inventoryPage.statusBadgeInRow(seed.statusProbe.name)).toContainText(/^Healthy$/i);
  });

  test('IS-INV-014 | Authenticated GET /inventory succeeds', async () => {
    const response = await getInventoryRaw(authHeaders(adminSession));
    expect(response.status).toBe(200);
    const body = response.data as { success?: boolean; data?: unknown };
    expect(body.success).toBe(true);
    const rows = Array.isArray(body.data) ? body.data : [];
    expect(rows.length).toBeGreaterThan(0);
  });

  test('IS-INV-015 | Unauthenticated GET /inventory returns 401', async () => {
    const response = await getInventoryRaw();
    expect(response.status).toBe(401);
  });

  test('IS-INV-016 | Unauthenticated PATCH /inventory/update returns 401', async () => {
    const response = await patchInventoryUpdateRaw({
      productId: seed.standard.id,
      warehouseId: seed.standard.warehouseId,
      stock: 10,
      type: 'SET',
    });
    expect(response.status).toBe(401);
  });

  test('IS-INV-017 | Admin GET /inventory/stats succeeds', async () => {
    const response = await getInventoryStatsRaw(authHeaders(adminSession));
    expect(response.status).toBe(200);
    const body = response.data as { success?: boolean; data?: Record<string, unknown> };
    expect(body.success).toBe(true);
    expect(body.data).toBeTruthy();
  });

  test('IS-INV-018 | COD order reduces inventory stock', async () => {
    clearValidationRateLimits();
    const before = await getInventoryStockForProduct(adminSession, seed.orderProbe.id);
    expect(before).toBeGreaterThanOrEqual(1);
    await clearCartApi(vendorSession);
    await addToCartApi(vendorSession, seed.orderProbe.id, 1);
    await placeCodOrderApi(vendorSession);
    await expect
      .poll(() => getInventoryStockForProduct(adminSession, seed.orderProbe.id), { timeout: 15000 })
      .toBe(before - 1);
  });
});
