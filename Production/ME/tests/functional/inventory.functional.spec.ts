import { test, expect, type Page } from '../fixtures/product.functional.fixture';
import AdminInventoryPage from '../pages/admin/AdminInventoryPage';
import { establishSession } from '../helpers/session.functional.helper';
import { loginApi, type ApiSession } from '../helpers/auth.api.helper';
import { getVendorCredentials } from '../helpers/product.credentials';
import { addToCartApi, clearCartApi } from '../helpers/cart.api.helper';
import {
  placeCodOrderApi,
  placeOnlineOrderApi,
} from '../helpers/order.functional.helper';
import { clearValidationRateLimits } from '../helpers/cart.validation.helper';
import {
  authHeaders,
  getInventoryRaw,
  getInventoryStatsRaw,
  getInventoryStockForProduct,
  getLowStockRaw,
  getProductStockApi,
  listInventoryRows,
  patchInventoryUpdateRaw,
  postInventoryAddApi,
  seedInventoryFunctionalData,
  setInventoryStockApi,
  syncProductStockApi,
  updateInventoryTypedApi,
  type InventoryFunctionalSeed,
} from '../helpers/inventory.functional.helper';

let adminSession: ApiSession;
let vendorSession: ApiSession;
let seed: InventoryFunctionalSeed;

async function adminUi(page: Page) {
  await establishSession(page, 'admin');
}

test.describe('Inventory Functional Suite', () => {
  test.beforeAll(async () => {
    clearValidationRateLimits();
    const seeded = await seedInventoryFunctionalData();
    adminSession = seeded.adminSession;
    seed = seeded.seed;
    const vendorCreds = getVendorCredentials(1);
    vendorSession = await loginApi(vendorCreds.mobile, vendorCreds.password);
  });

  test.describe('Section A — Page, Stats & Alert', () => {
    test('IF-INV-001 | Admin Inventory page loads with table', async ({ page }) => {
      await adminUi(page);
      const inventoryPage = new AdminInventoryPage(page);
      await inventoryPage.goto();
      await expect(inventoryPage.pageHeading()).toBeVisible({ timeout: 15000 });
      await inventoryPage.waitForTable();
    });

    test('IF-INV-002 | Stats cards visible', async ({ page }) => {
      await adminUi(page);
      const inventoryPage = new AdminInventoryPage(page);
      await inventoryPage.goto();
      await inventoryPage.waitForTable();
      await inventoryPage.expectStatsVisible();
      await expect(page.getByTestId('inventory-stat-out-of-stock')).toBeVisible();
      await expect(page.getByTestId('inventory-stat-inventory-value')).toBeVisible();
    });

    test('IF-INV-003 | Low Stock Alert includes low and out-of-stock rows', async ({ page }) => {
      await adminUi(page);
      const inventoryPage = new AdminInventoryPage(page);
      await inventoryPage.goto();
      await inventoryPage.waitForTable();
      await expect(page.getByText('Low Stock Alert')).toBeVisible();
      // Names also appear in the table — scope to Low Stock Alert rows only.
      await expect(inventoryPage.lowStockAlertRow(seed.low.name)).toBeVisible();
      await expect(inventoryPage.lowStockAlertRow(seed.oos.name)).toBeVisible();
    });

    test('IF-INV-004 | Restock opens Update Stock modal', async ({ page }) => {
      await adminUi(page);
      const inventoryPage = new AdminInventoryPage(page);
      await inventoryPage.goto();
      await inventoryPage.waitForTable();
      await inventoryPage.openRestockModalFromAlert(seed.low.name);
      await expect(page.getByText(new RegExp(`Current Stock:\\s*${seed.low.stock}`))).toBeVisible();
    });
  });

  test.describe('Section B — Search & Filters', () => {
    test('IF-INV-005 | Search by product name', async ({ page }) => {
      await adminUi(page);
      const inventoryPage = new AdminInventoryPage(page);
      await inventoryPage.goto();
      await inventoryPage.waitForTable();
      await inventoryPage.search(seed.healthy.name);
      await expect(inventoryPage.rowByProductName(seed.healthy.name)).toBeVisible();
    });

    test('IF-INV-006 | Search by product id', async ({ page }) => {
      await adminUi(page);
      const inventoryPage = new AdminInventoryPage(page);
      await inventoryPage.goto();
      await inventoryPage.waitForTable();
      await inventoryPage.search(seed.healthy.id);
      await expect(inventoryPage.rowByProductName(seed.healthy.name)).toBeVisible();
    });

    test('IF-INV-007 | Search empty state', async ({ page }) => {
      await adminUi(page);
      const inventoryPage = new AdminInventoryPage(page);
      await inventoryPage.goto();
      await inventoryPage.waitForTable();
      await inventoryPage.search('zzz-no-inventory-match-999999');
      await expect(inventoryPage.emptyState()).toBeVisible();
    });

    test('IF-INV-008 | Filter Healthy Stock', async ({ page }) => {
      await adminUi(page);
      const inventoryPage = new AdminInventoryPage(page);
      await inventoryPage.goto();
      await inventoryPage.waitForTable();
      await inventoryPage.filterByStatusLabel('Healthy Stock');
      await inventoryPage.search(seed.healthy.name);
      await expect(inventoryPage.rowByProductName(seed.healthy.name)).toBeVisible();
      await inventoryPage.search(seed.oos.name);
      await expect(inventoryPage.emptyState()).toBeVisible();
    });

    test('IF-INV-009 | Filter Low Stock', async ({ page }) => {
      await adminUi(page);
      const inventoryPage = new AdminInventoryPage(page);
      await inventoryPage.goto();
      await inventoryPage.waitForTable();
      await inventoryPage.filterByStatusLabel('Low Stock');
      await inventoryPage.search(seed.low.name);
      await expect(inventoryPage.rowByProductName(seed.low.name)).toBeVisible();
      await expect(inventoryPage.statusBadgeInRow(seed.low.name)).toContainText(/Low stock/i);
    });

    test('IF-INV-010 | Filter Out of Stock', async ({ page }) => {
      await adminUi(page);
      const inventoryPage = new AdminInventoryPage(page);
      await inventoryPage.goto();
      await inventoryPage.waitForTable();
      await inventoryPage.filterByStatusLabel('Out of Stock');
      await inventoryPage.search(seed.oos.name);
      await expect(inventoryPage.rowByProductName(seed.oos.name)).toBeVisible();
      await expect(inventoryPage.statusBadgeInRow(seed.oos.name)).toContainText(/Out of stock/i);
    });
  });

  test.describe('Section C — UI Stock Mutations & Status Transitions', () => {
    test('IF-INV-011 | SET stock via modal updates row', async ({ page }) => {
      await adminUi(page);
      const inventoryPage = new AdminInventoryPage(page);
      await inventoryPage.goto();
      await inventoryPage.waitForTable();
      await inventoryPage.search(seed.mutate.name);
      await inventoryPage.openStockModalForProduct(seed.mutate.name);
      const next = 33;
      await inventoryPage.setStockQuantity(next);
      const response = await inventoryPage.submitStockUpdate();
      expect(response.status()).toBe(200);
      await inventoryPage.search(seed.mutate.name);
      await expect(inventoryPage.stockCellInRow(seed.mutate.name)).toContainText(String(next));
      seed.mutate.stock = next;
    });

    test('IF-INV-012 | Healthy → Low Stock transition', async ({ page }) => {
      await setInventoryStockApi(adminSession, seed.mutate, 5);
      seed.mutate.stock = 5;
      await adminUi(page);
      const inventoryPage = new AdminInventoryPage(page);
      await inventoryPage.goto();
      await inventoryPage.waitForTable();
      await inventoryPage.search(seed.mutate.name);
      await expect(inventoryPage.statusBadgeInRow(seed.mutate.name)).toContainText(/Low stock/i);
    });

    test('IF-INV-013 | Low Stock → Out of Stock transition', async ({ page }) => {
      await setInventoryStockApi(adminSession, seed.mutate, 0);
      seed.mutate.stock = 0;
      await adminUi(page);
      const inventoryPage = new AdminInventoryPage(page);
      await inventoryPage.goto();
      await inventoryPage.waitForTable();
      await inventoryPage.search(seed.mutate.name);
      await expect(inventoryPage.statusBadgeInRow(seed.mutate.name)).toContainText(/Out of stock/i);
    });

    test('IF-INV-014 | Out of Stock → Healthy transition', async ({ page }) => {
      await setInventoryStockApi(adminSession, seed.mutate, 25);
      seed.mutate.stock = 25;
      await adminUi(page);
      const inventoryPage = new AdminInventoryPage(page);
      await inventoryPage.goto();
      await inventoryPage.waitForTable();
      await inventoryPage.search(seed.mutate.name);
      await expect(inventoryPage.statusBadgeInRow(seed.mutate.name)).toContainText(/^Healthy$/i);
    });

    test('IF-INV-015 | Negative stock rejected client-side', async ({ page }) => {
      await adminUi(page);
      const inventoryPage = new AdminInventoryPage(page);
      await inventoryPage.goto();
      await inventoryPage.waitForTable();
      await inventoryPage.search(seed.mutate.name);
      await inventoryPage.openStockModalForProduct(seed.mutate.name);
      await inventoryPage.setStockQuantity(-1);
      await page
        .getByRole('dialog', { name: /update stock/i })
        .getByRole('button', { name: /^Update Stock$/i })
        .click();
      await expect(page.getByText('Enter a valid stock quantity')).toBeVisible();
    });

    test('IF-INV-016 | Stock persists after page refresh', async ({ page }) => {
      await setInventoryStockApi(adminSession, seed.mutate, 44);
      seed.mutate.stock = 44;
      await adminUi(page);
      const inventoryPage = new AdminInventoryPage(page);
      await inventoryPage.goto();
      await inventoryPage.waitForTable();
      await page.reload();
      await inventoryPage.waitForTable();
      await inventoryPage.search(seed.mutate.name);
      await expect(inventoryPage.stockCellInRow(seed.mutate.name)).toContainText('44');
    });

    test('IF-INV-017 | Stock persists across new admin session', async ({ page }) => {
      await establishSession(page, 'admin');
      const inventoryPage = new AdminInventoryPage(page);
      await inventoryPage.goto();
      await inventoryPage.waitForTable();
      await inventoryPage.search(seed.mutate.name);
      await expect(inventoryPage.stockCellInRow(seed.mutate.name)).toContainText('44');
    });
  });

  test.describe('Section D — API Mutations', () => {
    test('IF-INV-018 | PATCH ADD increases inventory stock', async () => {
      const before = await getInventoryStockForProduct(adminSession, seed.mutate.id);
      await updateInventoryTypedApi(adminSession, seed.mutate, 3, 'ADD');
      const after = await getInventoryStockForProduct(adminSession, seed.mutate.id);
      expect(after).toBe(before + 3);
      seed.mutate.stock = after;
    });

    test('IF-INV-019 | PATCH SUBTRACT decreases inventory stock', async () => {
      const before = await getInventoryStockForProduct(adminSession, seed.mutate.id);
      expect(before).toBeGreaterThanOrEqual(2);
      await updateInventoryTypedApi(adminSession, seed.mutate, 2, 'SUBTRACT');
      const after = await getInventoryStockForProduct(adminSession, seed.mutate.id);
      expect(after).toBe(before - 2);
      seed.mutate.stock = after;
    });

    test('IF-INV-020 | PATCH SUBTRACT insufficient stock rejected', async () => {
      const response = await patchInventoryUpdateRaw(
        {
          productId: seed.mutate.id,
          warehouseId: seed.mutate.warehouseId,
          stock: 999999,
          type: 'SUBTRACT',
        },
        authHeaders(adminSession)
      );
      expect(response.status).toBe(400);
      const message = String((response.data as { message?: string })?.message || '');
      expect(message).toMatch(/insufficient stock/i);
    });

    test('IF-INV-021 | PATCH SET updates absolute stock', async () => {
      await updateInventoryTypedApi(adminSession, seed.mutate, 18, 'SET');
      const after = await getInventoryStockForProduct(adminSession, seed.mutate.id);
      expect(after).toBe(18);
      seed.mutate.stock = 18;
    });

    test('IF-INV-022 | POST /inventory increments existing row', async () => {
      const before = await getInventoryStockForProduct(adminSession, seed.mutate.id);
      const response = await postInventoryAddApi(adminSession, {
        productId: seed.mutate.id,
        warehouseId: seed.mutate.warehouseId,
        stock: 2,
      });
      expect(response.status).toBe(200);
      expect(String((response.data as { message?: string })?.message || '')).toMatch(/stock updated/i);
      const after = await getInventoryStockForProduct(adminSession, seed.mutate.id);
      expect(after).toBe(before + 2);
      seed.mutate.stock = after;
    });

    test('IF-INV-023 | POST /inventory rejects stock below 1', async () => {
      const response = await postInventoryAddApi(adminSession, {
        productId: seed.mutate.id,
        warehouseId: seed.mutate.warehouseId,
        stock: 0,
      });
      expect(response.status).toBe(400);
    });
  });

  test.describe('Section E — API Reads & Low Stock', () => {
    test('IF-INV-024 | GET /inventory returns seeded products', async () => {
      const rows = await listInventoryRows(adminSession);
      const names = rows.map((row) => {
        const product = row.productId as { name?: string } | string;
        return typeof product === 'object' ? String(product?.name || '') : '';
      });
      expect(names).toEqual(expect.arrayContaining([seed.healthy.name, seed.low.name, seed.oos.name]));
    });

    test('IF-INV-025 | GET /inventory/low-stock includes low and zero', async () => {
      const response = await getLowStockRaw(authHeaders(adminSession));
      expect(response.status).toBe(200);
      const rows = Array.isArray((response.data as { data?: unknown })?.data)
        ? ((response.data as { data: Array<Record<string, unknown>> }).data)
        : Array.isArray(response.data)
          ? (response.data as Array<Record<string, unknown>>)
          : [];
      const ids = rows.map((row) =>
        String(
          (row.productId as { _id?: string; id?: string })?._id ||
            (row.productId as { id?: string })?.id ||
            row.productId ||
            ''
        )
      );
      expect(ids).toEqual(expect.arrayContaining([seed.low.id, seed.oos.id]));
      expect(ids).not.toContain(seed.healthy.id);
    });

    test('IF-INV-026 | GET /inventory/stats succeeds with totals', async () => {
      const response = await getInventoryStatsRaw(authHeaders(adminSession));
      expect(response.status).toBe(200);
      const data = ((response.data as { data?: Record<string, unknown> })?.data ??
        response.data) as Record<string, unknown>;
      expect(Number(data.totalStock ?? 0)).toBeGreaterThanOrEqual(0);
      expect(data).toHaveProperty('lowStockCount');
      expect(data).toHaveProperty('outOfStock');
    });

    test('IF-INV-027 | Vendor GET /inventory allowed', async () => {
      const response = await getInventoryRaw(authHeaders(vendorSession));
      expect(response.status).toBe(200);
    });

    test('IF-INV-028 | Vendor GET /inventory/stats forbidden', async () => {
      const response = await getInventoryStatsRaw(authHeaders(vendorSession));
      expect(response.status).toBe(403);
    });

    test('IF-INV-029 | Multiple inventory records coexist', async () => {
      const rows = await listInventoryRows(adminSession);
      const seededIds = new Set([
        seed.healthy.id,
        seed.low.id,
        seed.oos.id,
        seed.mutate.id,
        seed.orderCod.id,
        seed.orderOnline.id,
        seed.syncProbe.id,
      ]);
      const matched = rows.filter((row) => {
        const pid = String(
          (row.productId as { _id?: string })?._id ||
            (row.productId as { id?: string })?.id ||
            row.productId ||
            ''
        );
        return seededIds.has(pid);
      });
      expect(matched.length).toBeGreaterThanOrEqual(7);
    });
  });

  test.describe('Section F — Product Sync & Order Bridges', () => {
    test('IF-INV-030 | Inventory PATCH does not sync Product.stock', async () => {
      const productBefore = await getProductStockApi(seed.syncProbe.id, adminSession);
      await setInventoryStockApi(adminSession, seed.syncProbe, productBefore + 15);
      const productAfter = await getProductStockApi(seed.syncProbe.id, adminSession);
      expect(productAfter).toBe(productBefore);
      const inventoryAfter = await getInventoryStockForProduct(adminSession, seed.syncProbe.id);
      expect(inventoryAfter).toBe(productBefore + 15);
    });

    test('IF-INV-031 | Product stock PATCH syncs default warehouse inventory', async () => {
      await syncProductStockApi(adminSession, seed.syncProbe.id, 55);
      await expect
        .poll(() => getInventoryStockForProduct(adminSession, seed.syncProbe.id), { timeout: 10000 })
        .toBe(55);
      const productStock = await getProductStockApi(seed.syncProbe.id, adminSession);
      expect(productStock).toBe(55);
    });

    test('IF-INV-032 | COD order deducts inventory stock', async () => {
      clearValidationRateLimits();
      const before = await getInventoryStockForProduct(adminSession, seed.orderCod.id);
      expect(before).toBeGreaterThanOrEqual(1);
      await clearCartApi(vendorSession);
      await addToCartApi(vendorSession, seed.orderCod.id, 1);
      await placeCodOrderApi(vendorSession);
      await expect
        .poll(() => getInventoryStockForProduct(adminSession, seed.orderCod.id), { timeout: 15000 })
        .toBe(before - 1);
    });

    test('IF-INV-033 | ONLINE order retains inventory until payment', async () => {
      clearValidationRateLimits();
      const before = await getInventoryStockForProduct(adminSession, seed.orderOnline.id);
      expect(before).toBeGreaterThanOrEqual(1);
      await clearCartApi(vendorSession);
      await addToCartApi(vendorSession, seed.orderOnline.id, 1);
      await placeOnlineOrderApi(vendorSession);
      const after = await getInventoryStockForProduct(adminSession, seed.orderOnline.id);
      expect(after).toBe(before);
    });
  });
});
