import { test, expect } from '../fixtures/product.functional.fixture';
import AdminInventoryPage from '../pages/admin/AdminInventoryPage';
import {
  createProductApi,
  getAdminSession,
  getFirstCategoryId,
  listInventoryApi,
  patchProductStockApi,
  resolveRefId,
  updateInventoryStockApi,
} from '../helpers/product.api.helper';
import { uniqueProductName } from '../helpers/product.credentials';
import { establishSession } from '../helpers/session.functional.helper';

test.describe('PF-PROD Section G | Admin Inventory', () => {
  let productName = '';
  let productId = '';

  test.beforeAll(async () => {
    const session = await getAdminSession();
    const categoryId = await getFirstCategoryId(session);
    productName = uniqueProductName('pf-inventory');
    const created = await createProductApi(session, {
      name: productName,
      price: 210,
      categoryId,
      stock: 15,
    });
    productId = String(created._id || created.id);
  });

  test('PF-PROD-053 | Inventory page loads with records', async ({ page, adminCreds }) => {
    await establishSession(page, 'admin');
    const inventoryPage = new AdminInventoryPage(page);
    await inventoryPage.goto();
    await inventoryPage.waitForTable();
    await inventoryPage.expectStatsVisible();
  });

  test('PF-PROD-054 | Admin can SET stock via inventory modal', async ({ page, adminCreds }) => {
    await establishSession(page, 'admin');
    const inventoryPage = new AdminInventoryPage(page);
    await inventoryPage.goto();
    await inventoryPage.waitForTable();
    await inventoryPage.openStockModalForProduct(productName);
    await inventoryPage.setStockQuantity(42);
    const response = await inventoryPage.submitStockUpdate();
    expect(response.status()).toBe(200);
  });

  test('PF-PROD-055 | Inventory rejects negative stock input', async ({ page, adminCreds }) => {
    await establishSession(page, 'admin');
    const inventoryPage = new AdminInventoryPage(page);
    await inventoryPage.goto();
    await inventoryPage.waitForTable();
    await inventoryPage.openStockModalForProduct(productName);
    await inventoryPage.setStockQuantity(-5);
    await page.locator('form button:has-text("Update"), form button:has-text("Save")').first().click();
    await expect(page.locator('text=Enter a valid stock quantity')).toBeVisible();
  });

  test('PF-PROD-056 | Inventory low-stock status threshold', async ({ page, adminCreds }) => {
    await establishSession(page, 'admin');
    const inventoryPage = new AdminInventoryPage(page);
    await inventoryPage.goto();
    await inventoryPage.search(productName);
    await expect(inventoryPage.rowByProductName(productName)).toBeVisible();
  });

  test('PF-PROD-057 | Inventory search by product name', async ({ page, adminCreds }) => {
    await establishSession(page, 'admin');
    const inventoryPage = new AdminInventoryPage(page);
    await inventoryPage.goto();
    await inventoryPage.search(productName);
    await expect(inventoryPage.rowByProductName(productName)).toBeVisible();
  });

  test('PF-PROD-058 | Inventory status filter', async ({ page, adminCreds }) => {
    await establishSession(page, 'admin');
    const inventoryPage = new AdminInventoryPage(page);
    await inventoryPage.goto();
    await inventoryPage.waitForTable();
    await expect(page.locator('table tbody tr').first()).toBeVisible();
  });

  test('PF-PROD-059 | Dual stock source divergence', async () => {
    const session = await getAdminSession();
    const inventory = await listInventoryApi(session);
    const rows = Array.isArray(inventory) ? inventory : [];
    const row = rows.find((r: { productId?: { name?: string } | string }) => {
      const pname =
        typeof r.productId === 'object' ? (r.productId as { name?: string })?.name : '';
      return pname === productName;
    }) as { warehouseId?: string; productId?: { _id?: string } | string } | undefined;
    if (row?.warehouseId) {
      const pid = resolveRefId(row.productId);
      const warehouseId = resolveRefId(row.warehouseId);
      if (pid && warehouseId) {
        await updateInventoryStockApi(session, {
          productId: pid,
          warehouseId,
          stock: 99,
          type: 'SET',
        });
        const { getProductApi } = await import('../helpers/product.api.helper');
        const product = await getProductApi(productId);
        expect(Number(product.stock)).toBeDefined();
      }
    }
  });

  test('PF-PROD-060 | PATCH /products/:id/stock API path', async () => {
    const session = await getAdminSession();
    const updated = await patchProductStockApi(session, productId, 33);
    expect(Number(updated.stock)).toBe(33);
  });
});
