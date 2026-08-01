import { expect, type Locator, type Page } from '@playwright/test';

export class AdminDeliveryAssignmentPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async goto() {
    await this.page.goto('/admin/delivery-assignment');
  }

  pageHeading(): Locator {
    return this.page.getByRole('heading', { name: /delivery assignment/i });
  }

  async waitForLoad(timeout = 15000) {
    await expect(this.pageHeading()).toBeVisible({ timeout });
    await expect(this.page.getByText(/loading delivery data/i)).toHaveCount(0, { timeout });
  }

  tabButton(label: RegExp | string): Locator {
    return this.page.getByRole('button', { name: label });
  }

  refreshButton(): Locator {
    return this.page.getByRole('button', { name: /^refresh$/i });
  }

  searchInput(): Locator {
    return this.page.getByPlaceholder(/search orders/i);
  }

  async search(term: string) {
    await this.searchInput().fill(term);
  }

  listHeading(): Locator {
    return this.page.getByRole('heading', {
      name: /unassigned orders|active deliveries|completed deliveries/i,
    });
  }
}

export class DeliveryDashboardPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async goto() {
    await this.page.goto('/delivery/dashboard');
  }

  pageHeading(): Locator {
    return this.page.getByRole('heading', { name: /delivery operations dashboard/i });
  }

  async waitForLoad(timeout = 15000) {
    await expect(this.pageHeading()).toBeVisible({ timeout });
  }
}

export class DeliveryAssignedOrdersPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async goto() {
    await this.page.goto('/delivery/assigned-orders');
  }

  pageHeading(): Locator {
    return this.page.getByRole('heading', { name: /assigned deliveries/i });
  }

  async waitForLoad(timeout = 15000) {
    await expect(this.pageHeading()).toBeVisible({ timeout });
    await expect(this.page.getByText(/loading assigned orders/i)).toHaveCount(0, { timeout });
  }

  searchInput(): Locator {
    return this.page.getByPlaceholder(/search by order id, vendor, or location/i);
  }

  async search(term: string) {
    await this.searchInput().fill(term);
  }

  shipmentCard(shipmentId: string): Locator {
    return this.page.getByRole('heading', { name: shipmentId, exact: true }).locator('..').locator('..');
  }

  emptyState(): Locator {
    return this.page.getByText(/no orders found/i);
  }
}

export class DeliveryOrderDetailsPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async goto(shipmentId: string) {
    await this.page.goto(`/delivery/order-details/${shipmentId}`);
  }

  pageHeading(): Locator {
    return this.page.getByRole('heading', { name: /order details/i });
  }

  async waitForLoad(timeout = 15000) {
    await expect(this.pageHeading()).toBeVisible({ timeout });
    await expect(this.page.getByText(/loading order details/i)).toHaveCount(0, { timeout });
  }

  timelineHeading(): Locator {
    return this.page.getByRole('heading', { name: /delivery timeline/i });
  }

  nextActionButton(label: RegExp | string): Locator {
    return this.page.getByRole('button', { name: label });
  }

  confirmDeliveryButton(): Locator {
    return this.page.getByRole('button', { name: /confirm delivery/i });
  }

  notesInput(): Locator {
    return this.page.getByPlaceholder(/notes|instructions|delivery/i).or(
      this.page.locator('textarea')
    );
  }
}

export class DeliveryHistoryPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async goto() {
    await this.page.goto('/delivery/history');
  }

  pageHeading(): Locator {
    return this.page.getByRole('heading', { name: /completed deliveries/i });
  }

  async waitForLoad(timeout = 15000) {
    await expect(this.pageHeading()).toBeVisible({ timeout });
    await expect(this.page.getByText(/loading delivery history/i)).toHaveCount(0, { timeout });
  }
}
