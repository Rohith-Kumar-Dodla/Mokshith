import { Page, Locator } from '@playwright/test';

export default class ProductsPage {
  readonly page: Page;
  readonly productNameLocator: Locator;
  readonly productCardLocator: Locator;
  readonly searchInput: Locator;

  constructor(page: Page) {
    this.page = page;
    // Product name headings are rendered as h3 in the app
    this.productNameLocator = page.locator('h3');
    // Generic product card wrapper fallback selector
    this.productCardLocator = page.locator('div').filter({ has: this.productNameLocator });
    this.searchInput = page.locator('input[placeholder*="Search"]');
  }

  async goto() {
    await this.page.goto('/products');
  }

  async waitForLoad(timeout = 10000) {
    // Wait for at least one product name to appear
    await this.productNameLocator.first().waitFor({ timeout });
  }

  async getProductsCount() {
    return await this.productNameLocator.count();
  }

  async getFirstProductName() {
    return await this.productNameLocator.first().textContent();
  }

  async firstProductImageHandle() {
    const card = this.productCardLocator.first();
    return await card.locator('img').first();
  }

  async search(term: string) {
    await this.searchInput.fill(term);
    await this.searchInput.press('Enter');
  }
}

