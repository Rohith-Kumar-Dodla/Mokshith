import { expect, type Locator, type Page } from '@playwright/test';

export default class VendorOrdersPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async goto() {
    await this.page.goto('/vendor/orders');
  }

  async waitForLoad(timeout = 15000) {
    await expect(this.pageHeading()).toBeVisible({ timeout });
    await this.page.getByText('Loading orders...').waitFor({ state: 'hidden', timeout }).catch(() => {});
  }

  pageHeading(): Locator {
    return this.page.getByRole('heading', { name: 'My Orders' });
  }

  emptyState(): Locator {
    return this.page.getByText('No orders found for the selected filter.');
  }

  searchInput(): Locator {
    return this.page.locator('input[placeholder*="Search orders"]');
  }

  statusFilter(): Locator {
    return this.page.locator('#order-status-filter');
  }

  totalOrdersStat(): Locator {
    return this.page.getByText('Total Orders').locator('..');
  }

  orderCardById(orderId: string): Locator {
    return this.page
      .locator('div.bg-white.rounded-lg.border')
      .filter({ has: this.page.locator('h3', { hasText: orderId }) })
      .first();
  }

  orderCards(): Locator {
    return this.page.locator('div.bg-white.rounded-lg.border').filter({
      has: this.page.locator('h3'),
    });
  }

  async search(term: string) {
    await this.searchInput().fill(term);
    await this.searchInput().press('Enter').catch(() => {});
  }

  async filterByStatus(status: string) {
    await this.statusFilter().selectOption(status);
  }

  async openOrderDetails(orderId: string) {
    const card = this.orderCardById(orderId);
    await card.getByRole('button', { name: 'View order' }).click();
  }
}
