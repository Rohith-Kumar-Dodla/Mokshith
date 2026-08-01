import { expect, type Locator, type Page } from '@playwright/test';

export type AdminProductFormData = {
  name: string;
  description?: string;
  price: string | number;
  stock?: string | number;
  moq?: string | number;
  status?: 'active' | 'inactive';
  categoryValue?: string;
};

export default class AdminProductsPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  private formFieldContainerByLabel(labelText: string | RegExp): Locator {
    // Admin product modal uses plain <label> without htmlFor; scope via DOM adjacency.
    return this.page.locator('form').locator('label', { hasText: labelText }).locator('..');
  }

  private inputByLabel(labelText: string | RegExp): Locator {
    return this.formFieldContainerByLabel(labelText).locator('input').first();
  }

  private selectByLabel(labelText: string | RegExp): Locator {
    return this.formFieldContainerByLabel(labelText).locator('select').first();
  }

  async goto() {
    await this.page.goto('/admin/products');
  }

  async waitForTable(timeout = 15000) {
    await this.page.waitForSelector('table tbody tr', { timeout });
  }

  async openCreateModal() {
    await this.page.click('button:has-text("Add Product")');
    await this.page.waitForSelector('form input[placeholder="Enter product name"]', { timeout: 10000 });
  }

  async waitForCategoryOptions(timeout = 15000) {
    // Native <select> options are attached but not visible until the menu opens.
    await this.categorySelect().locator('option').nth(1).waitFor({ state: 'attached', timeout });
  }

  nameInput(): Locator {
    return this.page.locator('form input[placeholder="Enter product name"]');
  }

  categorySelect(): Locator {
    return this.selectByLabel('Category');
  }

  statusSelect(): Locator {
    return this.selectByLabel('Status');
  }

  descriptionInput(): Locator {
    return this.page.locator('form textarea');
  }

  priceInput(): Locator {
    return this.inputByLabel('Price (₹)');
  }

  stockInput(): Locator {
    return this.inputByLabel('Stock Quantity');
  }

  moqInput(): Locator {
    return this.inputByLabel('Minimum Order Quantity');
  }

  imageInput(): Locator {
    return this.page.locator('form input[type="file"]');
  }

  saveButton(): Locator {
    return this.page.locator('form button:has-text("Save Product"), form button:has-text("Update Product")');
  }

  cancelButton(): Locator {
    return this.page.locator('form button:has-text("Cancel")');
  }

  async selectFirstCategory() {
    await this.waitForCategoryOptions();
    const option = this.categorySelect().locator('option').nth(1);
    const value = await option.getAttribute('value');
    if (!value) throw new Error('No category option available in admin product form');
    await this.categorySelect().selectOption(value);
    return value;
  }

  async fillForm(data: AdminProductFormData) {
    await this.nameInput().fill(data.name);
    if (data.categoryValue) {
      await this.categorySelect().selectOption(data.categoryValue);
    } else {
      await this.selectFirstCategory();
    }
    if (data.description !== undefined) {
      await this.descriptionInput().fill(data.description);
    }
    await this.priceInput().fill(String(data.price));
    if (data.stock !== undefined) {
      await this.stockInput().fill(String(data.stock));
    }
    if (data.moq !== undefined) {
      await this.moqInput().fill(String(data.moq));
    }
    if (data.status) {
      await this.statusSelect().selectOption(data.status);
    }
  }

  async submitCreate() {
    const [response] = await Promise.all([
      this.page.waitForResponse(
        (resp) => resp.url().includes('/api/v1/products') && resp.request().method() === 'POST',
        { timeout: 20000 }
      ),
      this.saveButton().click(),
    ]);
    return response;
  }

  async submitUpdate() {
    const [response] = await Promise.all([
      this.page.waitForResponse(
        (resp) => resp.url().includes('/api/v1/products/') && resp.request().method() === 'PUT',
        { timeout: 20000 }
      ),
      this.saveButton().click(),
    ]);
    await expect(this.saveButton()).toHaveCount(0, { timeout: 15000 });
    return response;
  }

  rowByName(name: string): Locator {
    return this.page.locator('table tbody tr').filter({ hasText: name });
  }

  async openEditForName(name: string) {
    const row = this.rowByName(name);
    await row.locator('button[title="Edit"]').click();
    await this.page.waitForSelector('form input[placeholder="Enter product name"]', { timeout: 10000 });
  }

  viewModal(): Locator {
    return this.page.locator('div.fixed.inset-0.z-50').filter({
      has: this.page.getByRole('heading', { name: 'Product Details', exact: true }),
    });
  }

  async openViewForName(name: string) {
    const row = this.rowByName(name);
    await row.locator('button[title="View"]').click();
    await this.viewModal().waitFor({ timeout: 10000 });
  }

  async deleteByName(name: string, confirm = true) {
    // Ensure the row is present before interacting (avoids timeout when table loads slowly).
    await this.page.waitForSelector('table tbody tr', { timeout: 15000 });
    const row = this.rowByName(name);
    await expect(row).toBeVisible({ timeout: 15000 });
    this.page.once('dialog', async (dialog) => {
      if (confirm) await dialog.accept();
      else await dialog.dismiss();
    });
    const responsePromise = confirm
      ? this.page.waitForResponse(
          (resp) => resp.url().includes('/api/v1/products/') && resp.request().method() === 'DELETE',
          { timeout: 20000 }
        )
      : Promise.resolve(null);
    await row.locator('button[title="Delete"]').click();
    return responsePromise;
  }

  async search(term: string) {
    await this.page.fill('input[placeholder*="Search products by name or ID"]', term);
  }

  async selectStockFilter(label: string) {
    // Admin uses custom FilterDropdown (button + menu of buttons), not a <select>.
    const stockDropdown = this.page
      .locator('button')
      .filter({ hasText: /All Stock Levels|In Stock|Low Stock|Out of Stock/ })
      .first();

    await stockDropdown.click();
    await this.page.locator('button', { hasText: label }).first().click();
  }

  async expectSuccessMessage(text: string) {
    await expect(this.page.locator(`text=${text}`)).toBeVisible({ timeout: 10000 });
  }

  async expectFormError(text: string | RegExp) {
    await expect(
      this.page
        .locator('form')
        .locator('div')
        .filter({ hasText: text })
        .first()
    ).toBeVisible({ timeout: 5000 });
  }
}
