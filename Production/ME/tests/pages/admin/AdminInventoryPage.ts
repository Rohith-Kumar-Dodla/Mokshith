import { expect, type Locator, type Page } from '@playwright/test';

export default class AdminInventoryPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async goto() {
    await this.page.goto('/admin/inventory');
  }

  async waitForTable(timeout = 15000) {
    await this.page.waitForSelector('table tbody tr', { timeout });
  }

  rowByProductName(name: string): Locator {
    return this.page.locator('table tbody tr').filter({ hasText: name });
  }

  async openStockModalForProduct(name: string) {
    const row = this.rowByProductName(name);
    await row.locator('button:has-text("Update Stock"), button:has-text("Update")').first().click();
    await this.page.waitForSelector('form input[type="number"]', { timeout: 10000 });
  }

  async setStockQuantity(value: string | number) {
    await this.page.locator('form input[type="number"]').first().fill(String(value));
  }

  async submitStockUpdate() {
    const [response] = await Promise.all([
      this.page.waitForResponse(
        (resp) => resp.url().includes('/api/v1/inventory/update') && resp.request().method() === 'PATCH',
        { timeout: 20000 }
      ),
      this.page.locator('form button:has-text("Update"), form button:has-text("Save")').first().click(),
    ]);
    return response;
  }

  async search(term: string) {
    await this.page.fill('input[placeholder*="Search"]', term);
  }

  async expectStatsVisible() {
    await expect(this.page.locator('text=Total Stock')).toBeVisible();
    await expect(this.page.locator('text=Low Stock Products')).toBeVisible();
  }
}
