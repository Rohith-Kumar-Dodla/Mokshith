import { expect, type Locator, type Page } from '@playwright/test';

export default class AdminInventoryPage {
  readonly page: Page;
  readonly inventoryTable: Locator;

  constructor(page: Page) {
    this.page = page;
    this.inventoryTable = page.getByRole('table');
  }

  async goto() {
    await this.page.goto('/admin/inventory');
  }

  pageHeading(): Locator {
    return this.page.getByRole('heading', { name: 'Inventory Control' });
  }

  emptyState(): Locator {
    return this.page.getByText('No inventory items found');
  }

  statusBadgeInRow(name: string): Locator {
    return this.rowByProductName(name).locator('td').nth(4);
  }

  stockCellInRow(name: string): Locator {
    return this.rowByProductName(name).locator('td').nth(2);
  }

  async waitForTable(timeout = 15000) {
    await expect(this.inventoryTable).toBeVisible({ timeout });
    await expect(this.inventoryTable.locator('tbody tr').first()).toBeVisible({ timeout });
  }

  async filterByStatusLabel(label: string) {
    await this.page.getByRole('button', { name: /Status:/i }).click();
    await this.page.getByRole('button', { name: label, exact: true }).click();
  }

  rowByProductName(name: string): Locator {
    return this.inventoryTable.locator('tbody tr').filter({ hasText: name });
  }

  async openStockModalForProduct(name: string) {
    const row = this.rowByProductName(name);
    await expect(row).toBeVisible({ timeout: 15000 });
    await row.getByRole('button', { name: new RegExp(`Update stock for ${name}|Update Stock`, 'i') }).click();
    await expect(this.page.getByRole('dialog', { name: /update stock/i })).toBeVisible({ timeout: 10000 });
    await expect(this.stockQuantityInput()).toBeVisible({ timeout: 10000 });
  }

  stockQuantityInput(): Locator {
    return this.page.getByRole('dialog', { name: /update stock/i }).getByLabel(/current quantity/i);
  }

  async setStockQuantity(value: string | number) {
    await this.stockQuantityInput().fill(String(value));
  }

  async submitStockUpdate() {
    const dialog = this.page.getByRole('dialog', { name: /update stock/i });
    const [response] = await Promise.all([
      this.page.waitForResponse(
        (resp) => resp.url().includes('/api/v1/inventory/update') && resp.request().method() === 'PATCH',
        { timeout: 20000 }
      ),
      dialog.getByRole('button', { name: /^Update Stock$/i }).click(),
    ]);
    await expect(dialog).toHaveCount(0, { timeout: 15000 });
    return response;
  }

  async search(term: string) {
    await this.page.getByPlaceholder(/search inventory by product name or id/i).fill(term);
  }

  async expectStatsVisible() {
    await expect(this.page.getByTestId('inventory-stat-total-stock')).toBeVisible();
    await expect(this.page.getByTestId('inventory-stat-low-stock-products')).toBeVisible();
  }

  /** Alert card rows use production class `bg-orange-50` (distinct from the table). */
  lowStockAlertRow(productName: string): Locator {
    return this.page.locator('div.bg-orange-50').filter({ hasText: productName });
  }

  async openRestockModalFromAlert(productName: string) {
    const row = this.lowStockAlertRow(productName);
    await expect(row).toBeVisible({ timeout: 15000 });
    await row.getByRole('button', { name: 'Restock' }).click();
    await expect(this.page.getByRole('dialog', { name: /update stock/i })).toBeVisible({ timeout: 10000 });
  }
}
