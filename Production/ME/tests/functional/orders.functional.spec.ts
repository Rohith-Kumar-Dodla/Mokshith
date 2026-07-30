import { test, expect, type Page } from '../fixtures/product.functional.fixture';
import VendorOrdersPage from '../pages/vendor/VendorOrdersPage';
import VendorCheckoutPage from '../pages/vendor/VendorCheckoutPage';
import VendorOrderDetailsPage, {
  VendorOrderSuccessPage,
} from '../pages/vendor/VendorOrderDetailsPage';
import VendorCartPage from '../pages/vendor/VendorCartPage';
import {
  addToCartApi,
  clearCartApi,
  getCartApi,
} from '../helpers/cart.api.helper';
import { getAdminSession } from '../helpers/product.api.helper';
import { getVendorCredentials } from '../helpers/product.credentials';
import { loginApi, type ApiSession } from '../helpers/auth.api.helper';
import { establishSession } from '../helpers/session.functional.helper';
import {
  clearValidationRateLimits,
  downloadInvoiceApi,
  expectedOrderTotalWithGst,
  getInventoryStockForProduct,
  getOrderByIdApi,
  getOrdersApi,
  placeCodOrderApi,
  placeOnlineOrderApi,
  resolveOrderId,
  seedOrdersFunctionalData,
  type OrdersFunctionalSeed,
} from '../helpers/order.functional.helper';
import { postOrdersRaw } from '../helpers/order.api.helper';
import { buildShippingAddress } from '../helpers/cart.functional.helper';

let adminSession: ApiSession;
let vendorSession: ApiSession;
let seed: OrdersFunctionalSeed;

async function vendorUi(page: Page) {
  vendorSession = await establishSession(page, 'vendor');
  await clearCartApi(vendorSession);
}

test.describe('Orders Functional Suite', () => {
  test.beforeAll(async () => {
    clearValidationRateLimits();
    adminSession = await getAdminSession();
    const vendorCreds = getVendorCredentials(1);
    vendorSession = await loginApi(vendorCreds.mobile, vendorCreds.password);
    seed = await seedOrdersFunctionalData(adminSession, vendorSession);
  });

  test.describe('Section A — Place Order Entry Points', () => {
    test('OF-ORD-001 | Place COD order via checkout UI', async ({ page }) => {
      await vendorUi(page);
      await addToCartApi(vendorSession, seed.standard.id, 1);
      const checkout = new VendorCheckoutPage(page);
      await checkout.goto();
      await checkout.waitForLoad();
      await checkout.placeCodOrder();
      const success = new VendorOrderSuccessPage(page);
      await success.waitForLoad();
      await expect(success.confirmationHeading()).toBeVisible();
    });

    test('OF-ORD-002 | Place ONLINE order via API creates pending payment', async () => {
      clearValidationRateLimits();
      await clearCartApi(vendorSession);
      await addToCartApi(vendorSession, seed.standard.id, 1);
      const order = await placeOnlineOrderApi(vendorSession);
      expect(resolveOrderId(order)).toBeTruthy();
      expect(String(order.status || '').toUpperCase()).toBe('PENDING_PAYMENT');
      expect(String(order.paymentStatus || '').toUpperCase()).toBe('PENDING');
    });

    test('OF-ORD-003 | Order Success page shows order number and links', async ({ page }) => {
      await vendorUi(page);
      await addToCartApi(vendorSession, seed.standard.id, 1);
      const checkout = new VendorCheckoutPage(page);
      await checkout.goto();
      await checkout.waitForLoad();
      await checkout.placeCodOrder();
      const success = new VendorOrderSuccessPage(page);
      await success.waitForLoad();
      await expect(success.orderNumberLabel()).toBeVisible();
      await expect(success.viewAllOrdersLink()).toBeVisible();
      await expect(success.viewOrderDetailsLink()).toBeVisible();
    });

    test('OF-ORD-004 | Empty cart checkout shows empty state', async ({ page }) => {
      await vendorUi(page);
      const checkout = new VendorCheckoutPage(page);
      await checkout.goto();
      await checkout.waitForLoad();
      await expect(checkout.emptyCartState()).toBeVisible();
    });
  });

  test.describe('Section B — Persistence & History', () => {
    test('OF-ORD-005 | Seeded COD order appears in history', async ({ page }) => {
      await vendorUi(page);
      const ordersPage = new VendorOrdersPage(page);
      await ordersPage.goto();
      await ordersPage.waitForLoad();
      await expect(ordersPage.orderCardById(seed.codOrderId)).toBeVisible({ timeout: 15000 });
    });

    test('OF-ORD-006 | Order history survives page refresh', async ({ page }) => {
      await vendorUi(page);
      const ordersPage = new VendorOrdersPage(page);
      await ordersPage.goto();
      await ordersPage.waitForLoad();
      await page.reload();
      await ordersPage.waitForLoad();
      await expect(ordersPage.orderCardById(seed.codOrderId)).toBeVisible({ timeout: 15000 });
    });

    test('OF-ORD-007 | Orders persist across new browser session', async ({ page }) => {
      await establishSession(page, 'vendor');
      const ordersPage = new VendorOrdersPage(page);
      await ordersPage.goto();
      await ordersPage.waitForLoad();
      await expect(ordersPage.orderCardById(seed.codOrderId)).toBeVisible();
      await expect(ordersPage.orderCardById(seed.secondOrderId)).toBeVisible();
    });

    test('OF-ORD-008 | Multiple orders render as cards', async ({ page }) => {
      await vendorUi(page);
      const ordersPage = new VendorOrdersPage(page);
      await ordersPage.goto();
      await ordersPage.waitForLoad();
      const count = await ordersPage.orderCards().count();
      expect(count).toBeGreaterThanOrEqual(2);
    });
  });

  test.describe('Section C — Details & Timeline', () => {
    test('OF-ORD-009 | Order Details page loads for COD order', async ({ page }) => {
      await vendorUi(page);
      const details = new VendorOrderDetailsPage(page);
      await details.goto(seed.codOrderId);
      await details.waitForLoad();
      await expect(details.pageHeading()).toBeVisible();
      await expect(details.orderStatusHeading()).toBeVisible();
    });

    test('OF-ORD-010 | Timeline shows Order Placed and Order Confirmed for COD', async ({
      page,
    }) => {
      await vendorUi(page);
      const details = new VendorOrderDetailsPage(page);
      await details.goto(seed.codOrderId);
      await details.waitForLoad();
      await expect(details.timelineHeading()).toBeVisible();
      await expect(details.timelineStep('Order Placed')).toBeVisible();
      await expect(details.timelineStep('Order Confirmed')).toBeVisible();
    });

    test('OF-ORD-011 | COD order status badge shows Confirmed', async ({ page }) => {
      await vendorUi(page);
      const details = new VendorOrderDetailsPage(page);
      await details.goto(seed.codOrderId);
      await details.waitForLoad();
      await expect(page.getByText(/^Confirmed$/i).first()).toBeVisible();
    });

    test('OF-ORD-012 | Back to Orders navigates to history', async ({ page }) => {
      await vendorUi(page);
      const details = new VendorOrderDetailsPage(page);
      await details.goto(seed.codOrderId);
      await details.waitForLoad();
      await details.backToOrdersLink().click();
      await expect(page).toHaveURL(/\/vendor\/orders$/);
      await expect(page.getByRole('heading', { name: 'My Orders' })).toBeVisible();
    });

    test('OF-ORD-013 | Deep-link to order details works', async ({ page }) => {
      await vendorUi(page);
      await page.goto(`/vendor/orders/${seed.secondOrderId}`);
      const details = new VendorOrderDetailsPage(page);
      await details.waitForLoad();
      await expect(details.pageHeading()).toContainText(seed.secondOrderId);
    });
  });

  test.describe('Section D — Cart & Inventory Bridge', () => {
    test('OF-ORD-014 | Cart cleared after successful COD order', async ({ page }) => {
      clearValidationRateLimits();
      await vendorUi(page);
      await addToCartApi(vendorSession, seed.standard.id, 1);
      const checkout = new VendorCheckoutPage(page);
      await checkout.goto();
      await checkout.waitForLoad();
      await checkout.placeCodOrder();
      const success = new VendorOrderSuccessPage(page);
      await success.waitForLoad();
      expect((await getCartApi(vendorSession))?.items?.length ?? 0).toBe(0);
      const cartPage = new VendorCartPage(page);
      await cartPage.goto();
      await cartPage.waitForLoad();
      await cartPage.expectEmptyCart();
    });

    test('OF-ORD-015 | Cart retained after ONLINE pending payment order', async () => {
      clearValidationRateLimits();
      await clearCartApi(vendorSession);
      await addToCartApi(vendorSession, seed.standard.id, 1);
      await placeOnlineOrderApi(vendorSession);
      const cart = await getCartApi(vendorSession);
      expect((cart?.items?.length ?? 0)).toBeGreaterThan(0);
    });

    test('OF-ORD-016 | Inventory stock decreases after COD', async () => {
      clearValidationRateLimits();
      const before = await getInventoryStockForProduct(adminSession, seed.inventory.id);
      expect(before).toBeGreaterThanOrEqual(1);
      await clearCartApi(vendorSession);
      await addToCartApi(vendorSession, seed.inventory.id, 1);
      await placeCodOrderApi(vendorSession);
      await expect
        .poll(() => getInventoryStockForProduct(adminSession, seed.inventory.id), {
          timeout: 15000,
        })
        .toBe(before - 1);
    });
  });

  test.describe('Section E — Totals & Checkout Display', () => {
    test('OF-ORD-017 | Checkout shows Tax (18%)', async ({ page }) => {
      await vendorUi(page);
      await addToCartApi(vendorSession, seed.standard.id, 1);
      const checkout = new VendorCheckoutPage(page);
      await checkout.goto();
      await checkout.waitForLoad();
      await expect(checkout.taxRow()).toBeVisible();
      await expect(page.getByText(/₹18\.00|₹\d+\.\d{2}/).first()).toBeVisible();
    });

    test('OF-ORD-018 | Checkout shows FREE delivery', async ({ page }) => {
      await vendorUi(page);
      await addToCartApi(vendorSession, seed.standard.id, 1);
      const checkout = new VendorCheckoutPage(page);
      await checkout.goto();
      await checkout.waitForLoad();
      await expect(page.getByText('Delivery', { exact: true })).toBeVisible();
      await expect(checkout.deliveryFreeLabel()).toBeVisible();
    });

    test('OF-ORD-019 | API order totalAmount includes 18% GST', async () => {
      clearValidationRateLimits();
      await clearCartApi(vendorSession);
      await addToCartApi(vendorSession, seed.standard.id, 1);
      const order = await placeCodOrderApi(vendorSession);
      const expected = expectedOrderTotalWithGst(seed.standard.price, 1);
      expect(Number(order.totalAmount)).toBeCloseTo(expected, 1);
    });

    test('OF-ORD-020 | Missing delivery address blocked client-side', async ({ page }) => {
      await vendorUi(page);
      await addToCartApi(vendorSession, seed.standard.id, 1);
      const checkout = new VendorCheckoutPage(page);
      await checkout.goto();
      await checkout.waitForLoad();
      await checkout.selectCod();
      await checkout.placeOrderButton().click();
      await expect(page.getByText('Delivery address is required')).toBeVisible();
    });
  });

  test.describe('Section F — Search & Filter', () => {
    test('OF-ORD-021 | Filter by Confirmed status shows COD order', async ({ page }) => {
      await vendorUi(page);
      const ordersPage = new VendorOrdersPage(page);
      await ordersPage.goto();
      await ordersPage.waitForLoad();
      await ordersPage.filterByStatus('confirmed');
      await expect(ordersPage.orderCardById(seed.codOrderId)).toBeVisible({ timeout: 10000 });
    });

    test('OF-ORD-022 | Search by order id finds order', async ({ page }) => {
      await vendorUi(page);
      const ordersPage = new VendorOrdersPage(page);
      await ordersPage.goto();
      await ordersPage.waitForLoad();
      await ordersPage.search(seed.codOrderId);
      await expect(ordersPage.orderCardById(seed.codOrderId)).toBeVisible({ timeout: 10000 });
    });

    test('OF-ORD-023 | Search with no matches shows empty state', async ({ page }) => {
      await vendorUi(page);
      const ordersPage = new VendorOrdersPage(page);
      await ordersPage.goto();
      await ordersPage.waitForLoad();
      await ordersPage.search('zzz-no-such-order-id-999999');
      await expect(ordersPage.emptyState()).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe('Section G — Invoice', () => {
    test('OF-ORD-024 | Invoice download API returns PDF for COD order', async () => {
      const response = await downloadInvoiceApi(vendorSession, seed.codOrderId);
      expect(response.status).toBe(200);
      const contentType = String(response.headers['content-type'] || '');
      expect(contentType).toMatch(/pdf|octet-stream/i);
      const bytes = Buffer.from(response.data as ArrayBuffer);
      expect(bytes.length).toBeGreaterThan(100);
      expect(bytes.subarray(0, 4).toString()).toBe('%PDF');
    });

    test('OF-ORD-025 | Download Invoice button visible on details', async ({ page }) => {
      await vendorUi(page);
      const details = new VendorOrderDetailsPage(page);
      await details.goto(seed.codOrderId);
      await details.waitForLoad();
      await expect(details.downloadInvoiceButton()).toBeVisible();
    });
  });

  test.describe('Section H — Navigation & Dashboard', () => {
    test('OF-ORD-026 | Sidebar navigation to Orders', async ({ page }) => {
      await vendorUi(page);
      await page.goto('/vendor/dashboard');
      await page.getByLabel('Main navigation').getByRole('link', { name: 'Orders' }).click();
      await expect(page).toHaveURL(/\/vendor\/orders/);
      await expect(page.getByRole('heading', { name: 'My Orders' })).toBeVisible();
    });

    test('OF-ORD-027 | Orders page stats cards visible', async ({ page }) => {
      await vendorUi(page);
      const ordersPage = new VendorOrdersPage(page);
      await ordersPage.goto();
      await ordersPage.waitForLoad();
      await expect(page.locator('p.text-xs.text-gray-500', { hasText: 'Total Orders' })).toBeVisible();
      await expect(page.locator('p.text-xs.text-gray-500', { hasText: 'Confirmed' })).toBeVisible();
      await expect(page.locator('p.text-xs.text-gray-500', { hasText: 'Pending' })).toBeVisible();
    });

    test('OF-ORD-028 | Dashboard Total Orders widget visible', async ({ page }) => {
      await vendorUi(page);
      await page.goto('/vendor/dashboard');
      await expect(page.getByText('Total Orders')).toBeVisible({ timeout: 20000 });
    });
  });

  test.describe('Section I — Idempotency & Double Submit', () => {
    test('OF-ORD-029 | Same Idempotency-Key returns same order', async () => {
      clearValidationRateLimits();
      await clearCartApi(vendorSession);
      await addToCartApi(vendorSession, seed.standard.id, 1);
      const key = `pf-ord-idem-${Date.now()}`;
      const first = await placeCodOrderApi(vendorSession, { idempotencyKey: key });
      await clearCartApi(vendorSession);
      await addToCartApi(vendorSession, seed.standard.id, 1);
      const second = await placeCodOrderApi(vendorSession, { idempotencyKey: key });
      expect(resolveOrderId(second)).toBe(resolveOrderId(first));
    });

    test('OF-ORD-030 | Rapid double Place Order click creates a single navigation', async ({
      page,
    }) => {
      clearValidationRateLimits();
      await vendorUi(page);
      await addToCartApi(vendorSession, seed.standard.id, 1);
      const beforeCount = (await getOrdersApi(vendorSession)).length;
      const checkout = new VendorCheckoutPage(page);
      await checkout.goto();
      await checkout.waitForLoad();
      await checkout.fillAddress();
      await checkout.selectCod();
      await checkout.placeOrderButton().click({ clickCount: 2, delay: 50 });
      const success = new VendorOrderSuccessPage(page);
      await success.waitForLoad();
      await expect
        .poll(async () => (await getOrdersApi(vendorSession)).length, { timeout: 15000 })
        .toBeLessThanOrEqual(beforeCount + 1);
    });
  });

  test.describe('Section J — Payment Status Semantics', () => {
    test('OF-ORD-031 | COD order has PENDING payment status', async () => {
      const order = await getOrderByIdApi(vendorSession, seed.codOrderId);
      expect(String(order?.paymentMethod || '').toUpperCase()).toBe('COD');
      expect(String(order?.paymentStatus || '').toUpperCase()).toBe('PENDING');
      expect(String(order?.status || '').toUpperCase()).toBe('CONFIRMED');
    });

    test('OF-ORD-032 | ONLINE order remains PENDING_PAYMENT until paid', async () => {
      const order = await getOrderByIdApi(vendorSession, seed.onlineOrderId);
      expect(String(order?.status || '').toUpperCase()).toBe('PENDING_PAYMENT');
      expect(String(order?.paymentStatus || '').toUpperCase()).toBe('PENDING');
    });

    test('OF-ORD-033 | POST /orders without token rejected', async () => {
      const response = await postOrdersRaw({
        paymentMethod: 'COD',
        shippingAddress: buildShippingAddress(),
      });
      expect(response.status).toBe(401);
    });

    test('OF-ORD-034 | Success page View Order Details navigates to details', async ({ page }) => {
      clearValidationRateLimits();
      await vendorUi(page);
      await addToCartApi(vendorSession, seed.standard.id, 1);
      const checkout = new VendorCheckoutPage(page);
      await checkout.goto();
      await checkout.waitForLoad();
      await checkout.placeCodOrder();
      const success = new VendorOrderSuccessPage(page);
      await success.waitForLoad();
      await success.viewOrderDetailsLink().click();
      await expect(page).toHaveURL(/\/vendor\/orders\/[a-f0-9]{24}/i, { timeout: 15000 });
      const details = new VendorOrderDetailsPage(page);
      await details.waitForLoad();
      await expect(details.orderStatusHeading()).toBeVisible();
    });
  });
});
