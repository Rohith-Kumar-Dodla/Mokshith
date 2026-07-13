import { type Locator, type Page } from '@playwright/test';

export default class AdminCategoriesPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async goto() {
    await this.page.goto('/admin/categories');
  }

  async waitForTable(timeout = 15000) {
    await this.page.waitForSelector('table tbody tr', { timeout });
  }

  async openCreateModal() {
    await this.page.click('button:has-text("Add Category")');
    await this.page.waitForSelector('form input[placeholder*="category" i], form input[type="text"]', { timeout: 10000 });
  }

  nameInput(): Locator {
    return this.page.locator('form input').first();
  }

  statusSelect(): Locator {
    return this.page.locator('form select:has(option[value="inactive"])');
  }

  saveButton(): Locator {
    return this.page.locator('form button:has-text("Save Category"), form button:has-text("Update Category")');
  }

  async fillAndSave(name: string, status: 'active' | 'inactive' = 'active') {
    await this.nameInput().fill(name);
    if (await this.statusSelect().count()) {
      await this.statusSelect().selectOption(status);
    }
    await this.saveButton().click();
  }

  rowByName(name: string): Locator {
    return this.page.locator('table tbody tr').filter({ hasText: name });
  }
}
