import { expect, type Locator, type Page } from '@playwright/test';

export default class VendorWishlistPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async goto() {
    await this.page.goto('/vendor/wishlist');
    await this.page.waitForSelector('text=/Wishlist|Saved products/i', { timeout: 15000 });
  }

  cardByProductName(name: string): Locator {
    return this.page
      .locator('div.bg-white.rounded-lg.border')
      .filter({ has: this.page.locator('h3', { hasText: name }) })
      .first();
  }

  addToCartButton(productName: string): Locator {
    return this.cardByProductName(productName).getByRole('button', { name: /^Add to Cart$/ });
  }

  outOfStockAddButton(productName: string): Locator {
    return this.cardByProductName(productName).getByRole('button', { name: /^Out of Stock$/ });
  }

  async expectOutOfStockAddBlocked(productName: string) {
    const button = this.outOfStockAddButton(productName);
    await expect(button).toBeVisible();
    await expect(button).toBeDisabled();
  }
}
