import { expect, type Locator, type Page } from '@playwright/test';
import { parseDiscountRupee, parseRupee } from '../../helpers/cart.functional.helper';

export default class VendorCartPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async goto() {
    await this.page.goto('/vendor/cart');
  }

  async waitForLoad(timeout = 15000) {
    await expect(this.pageHeading()).toBeVisible({ timeout });
    await this.page.getByText('Loading cart...').waitFor({ state: 'hidden', timeout }).catch(() => {});
  }

  pageHeading(): Locator {
    return this.page.getByRole('heading', { name: 'Shopping Cart' });
  }

  emptyState(): Locator {
    return this.page.getByText('Your cart is empty');
  }

  browseProductsLink(): Locator {
    return this.page.getByRole('link', { name: 'Browse Products' });
  }

  productTitle(name: string): Locator {
    return this.page.locator('h3', { hasText: name }).first();
  }

  productCard(name: string): Locator {
    return this.page
      .locator('div.bg-white.rounded-lg.border')
      .filter({ has: this.page.locator('h3', { hasText: name }) })
      .first();
  }

  removeButtonForProduct(name: string): Locator {
    return this.productCard(name).locator('button[title="Remove from Cart"]');
  }

  proceedToCheckoutLink(): Locator {
    return this.page.getByRole('link', { name: /Proceed to Checkout/i });
  }

  continueShoppingLink(): Locator {
    return this.page.getByRole('link', { name: 'Continue Shopping' });
  }

  orderSummaryHeading(): Locator {
    return this.page.getByRole('heading', { name: 'Order Summary' });
  }

  cartBadge(): Locator {
    return this.page.locator('a[aria-label="Cart"] span').first();
  }

  quantityLockedMessage(): Locator {
    return this.page.getByText('Quantity changes not yet supported');
  }

  bulkSavingsBanner(): Locator {
    return this.page.getByText(/You're saving ₹/i);
  }

  bulkUnitPrice(productName: string): Locator {
    return this.productCard(productName).locator('span.font-bold.text-gray-900').first();
  }

  unitPriceStrikethrough(productName: string): Locator {
    return this.productCard(productName).locator('span.line-through');
  }

  lineSavingsText(productName: string): Locator {
    return this.productCard(productName).getByText(/^Save ₹/);
  }

  summaryRow(label: string | RegExp): Locator {
    return this.page.locator('div.flex.justify-between').filter({ hasText: label }).first();
  }

  async expectEmptyCart() {
    await expect(this.emptyState()).toBeVisible({ timeout: 10000 });
    await expect(this.browseProductsLink()).toBeVisible();
  }

  async removeProductByName(name: string) {
    await this.removeButtonForProduct(name).click();
  }

  async readSummaryAmount(label: string | RegExp): Promise<number> {
    const row = this.summaryRow(label);
    await expect(row).toBeVisible();
    const text = await row.locator('span').last().textContent();
    const raw = text ?? '0';
    if (typeof label === 'string' && /discount/i.test(label)) {
      return parseDiscountRupee(raw);
    }
    return parseRupee(raw);
  }

  async readGrandTotal(): Promise<number> {
    const block = this.page.locator('div.flex.justify-between').filter({ hasText: 'Grand Total' }).last();
    const text = await block.locator('span').last().textContent();
    return parseRupee(text ?? '0');
  }
}
