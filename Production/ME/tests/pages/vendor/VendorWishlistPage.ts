import { expect, type Locator, type Page } from '@playwright/test';

export default class VendorWishlistPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async goto() {
    await this.page.goto('/vendor/wishlist');
  }

  async waitForLoad(timeout = 15000) {
    await expect(this.pageHeading()).toBeVisible({ timeout });
    await this.page.getByText('Loading wishlist...').waitFor({ state: 'hidden', timeout }).catch(() => {});
  }

  pageHeading(): Locator {
    return this.page.getByRole('heading', { name: 'Wishlist' });
  }

  emptyState(): Locator {
    return this.page.getByText('Your wishlist is empty');
  }

  browseProductsLink(): Locator {
    return this.page.getByRole('link', { name: 'Browse Products' });
  }

  productTitle(name: string): Locator {
    return this.page.locator('h3', { hasText: name }).first();
  }

  cardByProductName(name: string): Locator {
    return this.page
      .locator('div.bg-white.rounded-lg.border')
      .filter({ has: this.page.locator('h3', { hasText: name }) })
      .first();
  }

  removeButtonForProduct(name: string): Locator {
    return this.cardByProductName(name).locator('button[title="Remove from Wishlist"]');
  }

  wishlistBadge(): Locator {
    return this.page.locator('a[aria-label="Wishlist"] span').first();
  }

  addToCartButton(productName: string): Locator {
    return this.cardByProductName(productName).getByRole('button', { name: /^Add to Cart$/ });
  }

  outOfStockAddButton(productName: string): Locator {
    return this.cardByProductName(productName).getByRole('button', { name: /^Out of Stock$/ });
  }

  async removeProductByName(name: string) {
    await this.removeButtonForProduct(name).click();
    await expect(this.page.locator('text=/Removed from wishlist/i')).toBeVisible({ timeout: 10000 });
  }

  async expectEmptyWishlist() {
    await expect(this.emptyState()).toBeVisible({ timeout: 10000 });
    await expect(this.browseProductsLink()).toBeVisible();
  }

  async expectOutOfStockAddBlocked(productName: string) {
    const button = this.outOfStockAddButton(productName);
    await expect(button).toBeVisible();
    await expect(button).toBeDisabled();
  }
}
