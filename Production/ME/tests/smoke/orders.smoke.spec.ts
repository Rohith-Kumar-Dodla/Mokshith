import { test, expect } from '../fixtures/product.functional.fixture';
import VendorOrdersPage from '../pages/vendor/VendorOrdersPage';
import VendorCheckoutPage from '../pages/vendor/VendorCheckoutPage';
import VendorOrderDetailsPage, {
  VendorOrderSuccessPage,
} from '../pages/vendor/VendorOrderDetailsPage';
import VendorCartPage from '../pages/vendor/VendorCartPage';
import {
  getInventoryStockForProduct,
  getOrderByIdApi,
  getOrdersApi,
  getOrdersRaw,
  placeCodOrderApi,
  resolveOrderId,
} from '../helpers/order.api.helper';
import {
  addToCartApi,
  clearCartApi,
  getCartApi,
} from '../helpers/cart.api.helper';
import {
  createProductApi,
  getAdminSession,
  getFirstCategoryId,
} from '../helpers/product.api.helper';
import { getVendorCredentials, uniqueProductName } from '../helpers/product.credentials';
import { loginApi, type ApiSession } from '../helpers/auth.api.helper';
import { establishSession } from '../helpers/session.functional.helper';
import { clearValidationRateLimits } from '../helpers/cart.validation.helper';

test.describe('Orders Smoke Suite', () => {
  let smokeProductId = '';
  let inventoryProductId = '';
  let seedOrderId = '';
  let adminSession: ApiSession;
  let vendorSession: ApiSession;

  test.beforeAll(async () => {
    // Clears auth + order Redis rate-limit keys (order:* prefix) between suite runs.
    clearValidationRateLimits();

    adminSession = await getAdminSession();
    const categoryId = await getFirstCategoryId(adminSession);

    const created = await createProductApi(adminSession, {
      name: uniqueProductName('ps-ord'),
      price: 250,
      categoryId,
      stock: 100,
      moq: 1,
    });
    smokeProductId = String(created._id || created.id);

    const inventoryProduct = await createProductApi(adminSession, {
      name: uniqueProductName('ps-ord-inv'),
      price: 175,
      categoryId,
      stock: 50,
      moq: 1,
    });
    inventoryProductId = String(inventoryProduct._id || inventoryProduct.id);

    const vendorCreds = getVendorCredentials();
    vendorSession = await loginApi(vendorCreds.mobile, vendorCreds.password);
    await clearCartApi(vendorSession);

    await addToCartApi(vendorSession, smokeProductId, 1);
    const seedOrder = await placeCodOrderApi(vendorSession);
    seedOrderId = resolveOrderId(seedOrder);
    expect(seedOrderId).toBeTruthy();
  });

  test('PS-ORD-001 | Unauthenticated user blocked from orders page', async ({ page }) => {
    await page.goto('/vendor/orders');
    await expect(page).toHaveURL(/\/login/);
  });

  test('PS-ORD-002 | Vendor navigates to orders page', async ({ page }) => {
    await establishSession(page, 'vendor');
    const ordersPage = new VendorOrdersPage(page);
    await ordersPage.goto();
    await ordersPage.waitForLoad();
    await expect(ordersPage.pageHeading()).toBeVisible();
    await expect(page.getByText('Track and manage all your orders.')).toBeVisible();
  });

  test('PS-ORD-003 | Checkout page loads with cart items', async ({ page }) => {
    await clearCartApi(vendorSession);
    await addToCartApi(vendorSession, smokeProductId, 1);
    await establishSession(page, 'vendor');

    const checkoutPage = new VendorCheckoutPage(page);
    await checkoutPage.goto();
    await checkoutPage.waitForLoad();
    await expect(checkoutPage.pageHeading()).toBeVisible();
    await expect(checkoutPage.placeOrderButton()).toBeVisible();
  });

  test('PS-ORD-004 | Place COD order and Success page loads', async ({ page }) => {
    await clearCartApi(vendorSession);
    await addToCartApi(vendorSession, smokeProductId, 1);
    vendorSession = await establishSession(page, 'vendor');

    const checkoutPage = new VendorCheckoutPage(page);
    await checkoutPage.goto();
    await checkoutPage.waitForLoad();
    await checkoutPage.placeCodOrder();

    const successPage = new VendorOrderSuccessPage(page);
    await successPage.waitForLoad();
    await expect(successPage.confirmationHeading()).toBeVisible();
    await expect(successPage.orderNumberLabel()).toBeVisible();
    await expect(page.getByRole('link', { name: 'View All Orders' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'View Order Details' })).toBeVisible();
  });

  test('PS-ORD-005 | Order appears in Order History', async ({ page }) => {
    await establishSession(page, 'vendor');
    const ordersPage = new VendorOrdersPage(page);
    await ordersPage.goto();
    await ordersPage.waitForLoad();
    await expect(ordersPage.orderCardById(seedOrderId)).toBeVisible({ timeout: 15000 });
  });

  test('PS-ORD-006 | Order Details page opens', async ({ page }) => {
    await establishSession(page, 'vendor');
    const detailsPage = new VendorOrderDetailsPage(page);
    await detailsPage.goto(seedOrderId);
    await detailsPage.waitForLoad();
    await expect(detailsPage.pageHeading()).toBeVisible();
    await expect(page.getByText(/Placed on/i)).toBeVisible();
  });

  test('PS-ORD-007 | Cart clears after COD order', async ({ page }) => {
    await clearCartApi(vendorSession);
    await addToCartApi(vendorSession, smokeProductId, 1);
    vendorSession = await establishSession(page, 'vendor');

    const checkoutPage = new VendorCheckoutPage(page);
    await checkoutPage.goto();
    await checkoutPage.waitForLoad();
    await checkoutPage.placeCodOrder();

    const successPage = new VendorOrderSuccessPage(page);
    await successPage.waitForLoad();

    const cart = await getCartApi(vendorSession);
    expect(cart?.items?.length ?? 0).toBe(0);

    const cartPage = new VendorCartPage(page);
    await cartPage.goto();
    await cartPage.waitForLoad();
    await cartPage.expectEmptyCart();
  });

  test('PS-ORD-008 | Inventory stock decreases after COD order', async () => {
    clearValidationRateLimits();
    const before = await getInventoryStockForProduct(adminSession, inventoryProductId);
    expect(before).toBeGreaterThanOrEqual(1);

    await clearCartApi(vendorSession);
    await addToCartApi(vendorSession, inventoryProductId, 1);
    await placeCodOrderApi(vendorSession);

    await expect
      .poll(() => getInventoryStockForProduct(adminSession, inventoryProductId), {
        timeout: 15000,
      })
      .toBe(before - 1);
  });

  test('PS-ORD-009 | Sidebar navigation to Orders works', async ({ page }) => {
    await establishSession(page, 'vendor');
    await page.goto('/vendor/dashboard');
    await page.getByLabel('Main navigation').getByRole('link', { name: 'Orders' }).click();
    await expect(page).toHaveURL(/\/vendor\/orders/, { timeout: 15000 });
    await expect(page.getByRole('heading', { name: 'My Orders' })).toBeVisible();
  });

  test('PS-ORD-010 | GET /orders returns list for authenticated vendor', async () => {
    const orders = await getOrdersApi(vendorSession);
    expect(Array.isArray(orders)).toBe(true);
    expect(orders.length).toBeGreaterThan(0);
    expect(orders.some((order) => resolveOrderId(order) === seedOrderId)).toBe(true);
  });

  test('PS-ORD-011 | POST /orders COD succeeds', async () => {
    clearValidationRateLimits();
    await clearCartApi(vendorSession);
    await addToCartApi(vendorSession, smokeProductId, 1);
    const order = await placeCodOrderApi(vendorSession);
    expect(resolveOrderId(order)).toBeTruthy();
    expect(String(order.status || '').toUpperCase()).toMatch(/CONFIRMED|PENDING|PROCESSING/);
    expect(String(order.paymentMethod || '').toUpperCase()).toBe('COD');
  });

  test('PS-ORD-012 | GET /orders/:id returns order details', async () => {
    const fetched = await getOrderByIdApi(vendorSession, seedOrderId);
    expect(resolveOrderId(fetched)).toBe(seedOrderId);
    expect((fetched?.items ?? []).length).toBeGreaterThan(0);
  });

  test('PS-ORD-013 | Unauthenticated GET /orders returns 401', async () => {
    const response = await getOrdersRaw();
    expect(response.status).toBe(401);
  });
});
