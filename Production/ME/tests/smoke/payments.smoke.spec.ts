import { test, expect } from '../fixtures/product.functional.fixture';
import VendorCheckoutPage from '../pages/vendor/VendorCheckoutPage';
import { VendorOrderSuccessPage } from '../pages/vendor/VendorOrderDetailsPage';
import { loginApi, type ApiSession } from '../helpers/auth.api.helper';
import { establishSession } from '../helpers/session.functional.helper';
import { getVendorCredentials } from '../helpers/product.credentials';
import {
  addToCartApi,
  authHeaders,
  clearCartApi,
  clearValidationRateLimits,
  getBankDetailsRaw,
  getInventoryStockForProduct,
  getOrderByIdApi,
  messageOf,
  placeCodOrderApi,
  placeOnlineOrderApi,
  postPaymentsCreateOrderRaw,
  postPaymentsFailRaw,
  postPaymentsInitiateRaw,
  postPaymentsVerifyRaw,
  postPaymentsWebhookRawFetch,
  resolveOrderId,
  seedPaymentsSmokeData,
  type PaymentsSmokeSeed,
} from '../helpers/payment.smoke.helper';

test.describe('Payments Smoke Suite', () => {
  let adminSession: ApiSession;
  let vendorSession: ApiSession;
  let seed: PaymentsSmokeSeed;

  test.beforeAll(async () => {
    clearValidationRateLimits();
    const vendorCreds = getVendorCredentials(1);
    vendorSession = await loginApi(vendorCreds.mobile, vendorCreds.password);
    const seeded = await seedPaymentsSmokeData(vendorSession);
    adminSession = seeded.adminSession;
    seed = seeded.seed;
    expect(seed.seedCodOrderId).toBeTruthy();
    expect(seed.seedOnlineOrderId).toBeTruthy();
  });

  test('PS-PAY-001 | Guest blocked from checkout', async ({ page }) => {
    await page.goto('/vendor/checkout');
    await expect(page).toHaveURL(/\/login/);
  });

  test('PS-PAY-002 | Guest blocked from order-success', async ({ page }) => {
    await page.goto('/vendor/order-success');
    await expect(page).toHaveURL(/\/login/);
  });

  test('PS-PAY-003 | Admin redirected from checkout', async ({ page }) => {
    await establishSession(page, 'admin');
    await page.goto('/vendor/checkout');
    await expect(page).toHaveURL(/\/admin\/dashboard/);
  });

  test('PS-PAY-004 | Vendor checkout loads with payment methods', async ({ page }) => {
    await clearCartApi(vendorSession);
    await addToCartApi(vendorSession, seed.codProduct.id, 1);
    await establishSession(page, 'vendor');
    const checkoutPage = new VendorCheckoutPage(page);
    await checkoutPage.goto();
    await checkoutPage.waitForLoad();
    await expect(checkoutPage.pageHeading()).toBeVisible();
    await expect(page.getByText('Cash On Delivery')).toBeVisible();
    await expect(page.getByText('Razorpay (Online Payment)')).toBeVisible();
    await expect(checkoutPage.placeOrderButton()).toBeVisible();
  });

  test('PS-PAY-005 | COD checkout completes to Order Success', async ({ page }) => {
    await clearCartApi(vendorSession);
    await addToCartApi(vendorSession, seed.codProduct.id, 1);
    await establishSession(page, 'vendor');
    const checkoutPage = new VendorCheckoutPage(page);
    await checkoutPage.goto();
    await checkoutPage.waitForLoad();
    await checkoutPage.placeCodOrder();
    const successPage = new VendorOrderSuccessPage(page);
    await successPage.waitForLoad();
    await expect(successPage.confirmationHeading()).toBeVisible();
    await expect(successPage.orderNumberLabel()).toBeVisible();
  });

  test('PS-PAY-006 | Seed COD order has COD payment linkage', async () => {
    const order = await getOrderByIdApi(vendorSession, seed.seedCodOrderId);
    expect(String(order.paymentMethod || '').toUpperCase()).toBe('COD');
    expect(String(order.status || '').toUpperCase()).toMatch(/CONFIRMED|PROCESSING|PENDING/);
    expect(String(order.paymentStatus || '').toUpperCase()).toMatch(/PENDING|PAID/);
  });

  test('PS-PAY-007 | ONLINE order creates PENDING_PAYMENT', async () => {
    const order = await getOrderByIdApi(vendorSession, seed.seedOnlineOrderId);
    expect(String(order.paymentMethod || '').toUpperCase()).toMatch(/ONLINE|RAZORPAY|UPI|CARD/);
    expect(String(order.status || '').toUpperCase()).toBe('PENDING_PAYMENT');
    expect(String(order.paymentStatus || '').toUpperCase()).toBe('PENDING');
  });

  test('PS-PAY-008 | ONLINE order retains inventory until payment', async () => {
    await clearCartApi(vendorSession);
    await addToCartApi(vendorSession, seed.onlineProduct.id, 1);
    const before = await getInventoryStockForProduct(adminSession, seed.onlineProduct.id);
    const order = await placeOnlineOrderApi(vendorSession, {
      idempotencyKey: `ps-pay-res-${Date.now()}`,
    });
    expect(resolveOrderId(order)).toBeTruthy();
    const after = await getInventoryStockForProduct(adminSession, seed.onlineProduct.id);
    expect(after).toBe(before);
  });

  test('PS-PAY-009 | COD order deducts inventory', async () => {
    await clearCartApi(vendorSession);
    await addToCartApi(vendorSession, seed.failProduct.id, 1);
    const before = await getInventoryStockForProduct(adminSession, seed.failProduct.id);
    expect(before).toBeGreaterThanOrEqual(1);
    await placeCodOrderApi(vendorSession, {
      idempotencyKey: `ps-pay-cod-deduct-${Date.now()}`,
    });
    await expect
      .poll(() => getInventoryStockForProduct(adminSession, seed.failProduct.id), { timeout: 15000 })
      .toBe(before - 1);
  });

  test('PS-PAY-010 | Unauthenticated POST /payments/create-order rejected', async () => {
    // Production: csrfProtection mounts before protect on payment writes → 403 without CSRF.
    const response = await postPaymentsCreateOrderRaw({ amount: 100 });
    expect(response.status).toBe(403);
    expect(messageOf(response.data).toLowerCase()).toMatch(/csrf|forbidden|token/);
  });

  test('PS-PAY-011 | Unauthenticated POST /payments/verify rejected', async () => {
    const response = await postPaymentsVerifyRaw({
      razorpay_order_id: 'order_x',
      razorpay_payment_id: 'pay_x',
      razorpay_signature: 'sig_x',
    });
    expect(response.status).toBe(403);
    expect(messageOf(response.data).toLowerCase()).toMatch(/csrf|forbidden|token/);
  });

  test('PS-PAY-012 | Unauthenticated POST /payments/fail rejected', async () => {
    const response = await postPaymentsFailRaw({ orderId: seed.seedOnlineOrderId });
    expect(response.status).toBe(403);
    expect(messageOf(response.data).toLowerCase()).toMatch(/csrf|forbidden|token/);
  });

  test('PS-PAY-013 | Unauthenticated POST /payments/initiate/:orderId rejected', async () => {
    const response = await postPaymentsInitiateRaw(seed.seedOnlineOrderId);
    expect(response.status).toBe(403);
    expect(messageOf(response.data).toLowerCase()).toMatch(/csrf|forbidden|token/);
  });

  test('PS-PAY-014 | Webhook without signature is rejected', async () => {
    const response = await postPaymentsWebhookRawFetch({
      body: JSON.stringify({ event: 'payment.captured', payload: {} }),
      contentType: 'application/json',
    });
    expect(response.status).not.toBe(200);
    expect(response.status).toBeGreaterThanOrEqual(400);
  });

  test('PS-PAY-015 | Authenticated failPayment records ONLINE failure', async () => {
    clearValidationRateLimits();
    await clearCartApi(vendorSession);
    await addToCartApi(vendorSession, seed.onlineProduct.id, 1);
    const order = await placeOnlineOrderApi(vendorSession, {
      idempotencyKey: `ps-pay-fail-${Date.now()}`,
    });
    const orderId = resolveOrderId(order);
    const response = await postPaymentsFailRaw(
      { orderId, reason: 'ps-pay-smoke-cancel' },
      authHeaders(vendorSession)
    );
    expect(response.status).toBe(200);
    expect(messageOf(response.data).toLowerCase()).toMatch(/failure|failed|recorded/);
    const updated = await getOrderByIdApi(vendorSession, orderId);
    expect(String(updated.paymentStatus || '').toUpperCase()).toBe('FAILED');
    expect(String(updated.status || '').toUpperCase()).toBe('FAILED');
  });

  test('PS-PAY-016 | Authenticated GET bank-transfer bank-details succeeds', async () => {
    const response = await getBankDetailsRaw(authHeaders(vendorSession));
    expect(response.status).toBe(200);
    const data = (response.data as { data?: Record<string, unknown> })?.data ?? response.data;
    expect(data).toBeTruthy();
  });

  test('PS-PAY-017 | Unauthenticated GET bank-details returns 401', async () => {
    const response = await getBankDetailsRaw();
    expect(response.status).toBe(401);
  });

  test('PS-PAY-018 | Authenticated create-order reaches payment gateway layer', async () => {
    clearValidationRateLimits();
    const response = await postPaymentsCreateOrderRaw(
      { amount: 100, orderId: seed.seedOnlineOrderId },
      authHeaders(vendorSession)
    );
    // Auth/CSRF pass. Gateway returns 200 when Razorpay configured, else config/business error.
    expect(response.status).not.toBe(401);
    expect(response.status).not.toBe(403);
    expect([200, 400, 500]).toContain(response.status);
    if (response.status === 200) {
      expect(messageOf(response.data).toLowerCase()).toMatch(/razorpay|created|order/);
    }
    if (response.status >= 400) {
      expect(messageOf(response.data).length).toBeGreaterThan(0);
    }
  });
});
