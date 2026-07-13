import { test, expect } from '@playwright/test';
import loginFlow from '../flows/authentication/login.flow';
import AdminInventoryPage from '../pages/admin/AdminInventoryPage';

const SEEDED_INVENTORY_PRODUCT = 'Category 1 Product 1';

test.describe('P-PROD-07 | Inventory Update Stock smoke', () => {
  test('P-PROD-07 | Admin can update stock from Inventory UI', async ({ page }) => {
    const seededAdminMobile = process.env.TEST_SEEDED_ADMIN_MOBILE || '9000000002';
    const seededAdminPassword = process.env.TEST_SEEDED_ADMIN_PASSWORD || 'Admin@123';
    await loginFlow(page, seededAdminMobile, seededAdminPassword);

    const inventoryPage = new AdminInventoryPage(page);
    await inventoryPage.goto();
    await inventoryPage.waitForTable();
    await inventoryPage.search(SEEDED_INVENTORY_PRODUCT);

    const targetRow = inventoryPage.rowByProductName(SEEDED_INVENTORY_PRODUCT);
    await expect(targetRow).toBeVisible({ timeout: 15000 });

    await inventoryPage.openStockModalForProduct(SEEDED_INVENTORY_PRODUCT);
    const stockInput = page.locator('form input[type="number"]');
    const currentStock = parseInt((await stockInput.inputValue()) || '0', 10) || 0;
    const newStock = currentStock + 1;
    await inventoryPage.setStockQuantity(newStock);

    const response = await inventoryPage.submitStockUpdate();
    expect(response.status(), 'Inventory stock update API should succeed').toBe(200);
    const responseBody = await response.json().catch(() => null);
    const updatedInventory = responseBody?.data ?? responseBody;
    expect(Number(updatedInventory?.stock), 'API should persist incremented stock').toBe(newStock);

    await expect(targetRow.locator('td').nth(2)).toContainText(String(newStock), { timeout: 15000 });
  });
});

