import { expect, type Locator, type Page } from '@playwright/test';
import { fillCheckoutAddress } from '../../helpers/cart.validation.helper';

export default class VendorCheckoutPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async goto() {
    await this.page.goto('/vendor/checkout');
  }

  async waitForLoad(timeout = 15000) {
    await expect(this.pageHeading()).toBeVisible({ timeout });
    await this.page
      .getByText(/Loading checkout|Loading cart/i)
      .waitFor({ state: 'hidden', timeout })
      .catch(() => {});
  }

  pageHeading(): Locator {
    return this.page.getByRole('heading', { name: 'Order Checkout' });
  }

  placeOrderButton(): Locator {
    return this.page.getByRole('button', { name: /^Place Order$/ });
  }

  emptyCartState(): Locator {
    return this.page.getByText('Your cart is empty');
  }

  taxRow(): Locator {
    return this.page.getByText('Tax (18%)');
  }

  deliveryFreeLabel(): Locator {
    return this.page.locator('span', { hasText: 'FREE' }).first();
  }

  grandTotalLabel(): Locator {
    return this.page.getByText('Grand Total');
  }

  async fillAddress() {
    await fillCheckoutAddress(this.page);
  }

  async selectCod() {
    await this.page.getByText('Cash On Delivery').click();
  }

  async selectRazorpay() {
    await this.page.getByText('Razorpay (Online Payment)').click();
  }

  async placeCodOrder() {
    await this.fillAddress();
    await this.selectCod();
    await this.placeOrderButton().click();
  }
}
