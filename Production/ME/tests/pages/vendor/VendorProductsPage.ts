import { expect, type Locator, type Page } from '@playwright/test';

export default class VendorProductsPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  private viewToggleButtons(): Locator {
    // The grid/list toggle is a 2-button group inside the header actions.
    return this.page.locator('div.border.border-gray-300.rounded-lg.overflow-hidden').locator('button');
  }

  private filterPanel(): Locator {
    // Vendor filter panel header includes a "Filters" heading and optional "Clear All".
    return this.page.locator('div.bg-white').filter({ has: this.page.locator('h3', { hasText: 'Filters' }) }).first();
  }

  private async ensureFiltersOpen() {
    // Filter panel only exists when toggled on.
    if (await this.filterPanel().count()) return;
    await this.toggleFilters();
    await expect(this.filterPanel()).toBeVisible({ timeout: 10000 });
  }

  async goto(categoryId?: string) {
    const path = categoryId ? `/vendor/products?categoryId=${categoryId}` : '/vendor/products';
    await this.page.goto(path);
  }

  async waitForProducts(timeout = 15000) {
    await this.page.locator('h3').first().waitFor({ timeout });
  }

  productCards(): Locator {
    return this.page.locator('h3');
  }

  searchInput(): Locator {
    return this.page.locator('input[placeholder*="Search products"]');
  }

  async search(term: string) {
    await this.searchInput().fill(term);
    // Some builds only apply search after an input event/commit.
    await this.searchInput().press('Enter').catch(() => {});
    await this.page.waitForTimeout(800);
  }

  async toggleFilters() {
    await this.page.locator('button', { hasText: /Filters|Filter/ }).first().click();
  }

  async setGridView() {
    await this.viewToggleButtons().first().click();
  }

  async setListView() {
    await this.viewToggleButtons().nth(1).click();
  }

  cardByName(name: string): Locator {
    // Works for both grid cards and list rows; scope to the nearest white "card" container.
    const title = this.page.locator('h3', { hasText: name }).first();
    return title.locator('xpath=ancestor::div[contains(@class,"bg-white")]').first();
  }

  async openProductDetails(name: string) {
    await this.cardByName(name).locator('h3').click();
  }

  async addToCartByName(name: string) {
    const card = this.cardByName(name);
    await card.locator('button:has-text("Add to Cart")').click();
  }

  async addToWishlistByName(name: string) {
    const card = this.cardByName(name);
    await card.locator('button[title="Add to Wishlist"]').click();
  }

  async expectEmptyState() {
    await expect(this.page.locator('text=No products found')).toBeVisible({ timeout: 10000 });
  }

  outOfStockBadge(card: Locator): Locator {
    return card.locator('span', { hasText: 'Out of Stock' }).first();
  }

  async clearFilters() {
    // "Clear All" lives inside the filter panel and only appears when filters are active.
    await this.ensureFiltersOpen();
    await this.filterPanel().locator('button', { hasText: 'Clear All' }).first().click();
  }

  async selectSort(optionLabel: string) {
    // Sort By lives inside the FilterPanel, not the page header.
    await this.ensureFiltersOpen();
    await this.filterPanel()
      .locator('label', { hasText: 'Sort By' })
      .locator('..')
      .locator('select')
      .selectOption({ label: optionLabel });
  }

  async selectAvailability(optionLabel: string) {
    await this.ensureFiltersOpen();
    await this.filterPanel()
      .locator('label', { hasText: 'Availability' })
      .locator('..')
      .locator('select')
      .selectOption({ label: optionLabel });
  }
}
