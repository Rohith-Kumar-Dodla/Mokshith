import { expect, type Locator, type Page } from '@playwright/test';

export default class VendorOrderDetailsPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async goto(orderId: string) {
    await this.page.goto(`/vendor/orders/${orderId}`);
  }

  async waitForLoad(timeout = 15000) {
    await this.page
      .getByText('Loading order details...')
      .waitFor({ state: 'hidden', timeout })
      .catch(() => {});
    await expect(this.page.getByRole('heading', { name: /Order /i }).first()).toBeVisible({
      timeout,
    });
  }

  pageHeading(): Locator {
    return this.page.getByRole('heading', { name: /Order /i }).first();
  }

  orderStatusHeading(): Locator {
    return this.page.getByRole('heading', { name: 'Order Status' });
  }

  timelineHeading(): Locator {
    return this.page.getByRole('heading', { name: 'Order Timeline' });
  }

  timelineStep(name: string): Locator {
    return this.page.getByText(name, { exact: true });
  }

  downloadInvoiceButton(): Locator {
    return this.page.getByRole('button', { name: /Download Invoice|Invoice/i });
  }

  backToOrdersLink(): Locator {
    return this.page.getByRole('link', { name: /Back to Orders/i });
  }
}

export class VendorOrderSuccessPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async waitForLoad(timeout = 30000) {
    await expect(this.page).toHaveURL(/\/vendor\/order-success/, { timeout });
    await this.page
      .getByText('Loading order details...')
      .waitFor({ state: 'hidden', timeout })
      .catch(() => {});
  }

  confirmationHeading(): Locator {
    // Prefer page hero (h1). Notification drawer items also use heading role with
    // title "Order Confirmed" and must not collide with success-page assertions.
    return this.page.getByRole('heading', { level: 1, name: /Order Confirmed|Order Created/i });
  }

  orderNumberLabel(): Locator {
    return this.page.getByText('Order Number');
  }

  viewOrderDetailsLink(): Locator {
    return this.page.getByRole('link', { name: 'View Order Details' });
  }

  viewAllOrdersLink(): Locator {
    return this.page.getByRole('link', { name: 'View All Orders' });
  }
}
