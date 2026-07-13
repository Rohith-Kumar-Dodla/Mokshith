import { expect, type Locator, type Page } from '@playwright/test';

export default class VendorProductDetailsPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  private detailsCard(): Locator {
    // Scope to the main product-details card (the only card containing the product <h1>).
    return this.page.locator('div.bg-white').filter({ has: this.page.locator('h1') }).first();
  }

  async goto(productId: string) {
    await this.page.goto(`/vendor/products/${productId}`);
  }

  async waitForLoad(timeout = 15000) {
    await this.detailsCard().locator('h1').first().waitFor({ timeout });
  }

  title(): Locator {
    return this.detailsCard().locator('h1').first();
  }

  quantityInput(): Locator {
    return this.detailsCard().locator('input[type="number"]').first();
  }

  addToCartButton(): Locator {
    // Avoid duplicate "Add to Cart" from related product cards.
    return this.detailsCard().getByRole('button', { name: /^(Add to Cart|Adding\.\.\.)$/ });
  }

  outOfStockAddButton(): Locator {
    return this.detailsCard().getByRole('button', { name: /^Out of Stock$/ });
  }

  async expectOutOfStockAddBlocked() {
    const button = this.outOfStockAddButton();
    await expect(button).toBeVisible();
    await expect(button).toBeDisabled();
  }

  wishlistButton(): Locator {
    return this.detailsCard().getByRole('button', { name: /Wishlist|Save/i });
  }

  priceDisplay(): Locator {
    return this.detailsCard().getByText(/₹\d/).first();
  }

  heroImage(): Locator {
    return this.detailsCard().locator('.aspect-square img, img.img-responsive, img').first();
  }

  async setQuantity(value: number) {
    await this.quantityInput().fill(String(value));
  }

  async addToCart() {
    await this.addToCartButton().click();
  }

  async addToWishlist() {
    await this.wishlistButton().click();
  }

  async expectNotFound() {
    await expect(this.page.getByRole('heading', { name: 'Product not found' })).toBeVisible();
  }

  async switchTab(name: string) {
    const tabsNav = this.page.locator('nav').filter({
      has: this.page.locator('button', { hasText: /Description|Specifications|Reviews/i }),
    }).first();

    await tabsNav.locator('button', { hasText: new RegExp(`^${name}$`, 'i') }).click();
  }
}
