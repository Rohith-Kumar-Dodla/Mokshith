import { test, expect } from '../fixtures/product.functional.fixture';
import VendorCheckoutPage from '../pages/vendor/VendorCheckoutPage';
import { expectApiStatus } from '../helpers/rbac.api.helper';
import {
  authHeaders,
  loginApi,
  loginApiFresh,
  type ApiSession,
} from '../helpers/auth.api.helper';
import { apiClient } from '../helpers/apiClient';
import { establishSession } from '../helpers/session.functional.helper';
import {
  getAdminCredentials,
  getCustomerCredentials,
  getDeliveryCredentials,
  getInactiveVendorCredentials,
  getSuperAdminCredentials,
  getVendorCredentials,
} from '../helpers/product.credentials';
import {
  decodeJwtPayload,
  signEscalatedRoleToken,
  signTestJwt,
  tamperTokenSignature,
} from '../helpers/token.test.helper';
import { getAdminSession } from '../helpers/product.api.helper';
import logoutFlow from '../flows/authentication/logout.flow';
import {
  addToCartApi,
  approvePaymentProofRaw,
  authBearerOnly,
  bearerOnly,
  clearCartApi,
  clearValidationRateLimits,
  getBankDetailsRaw,
  getPaymentProofByOrderRaw,
  getPendingPaymentProofsRaw,
  getRefundByIdRaw,
  getRefundHistoryRaw,
  getRazorpayWebhookSecret,
  getSuperAdminFreshSession,
  messageOf,
  MINI_PNG,
  placeBankTransferOrderApi,
  postPaymentsCreateOrderRaw,
  postPaymentsFailRaw,
  postPaymentsInitiateRaw,
  postPaymentsRefundRaw,
  postPaymentsVerifyRaw,
  postPaymentsWebhookRawFetch,
  readBackendFile,
  refreshVendorApiSession,
  rejectPaymentProofRaw,
  resolveOrderId,
  seedPaymentsAuthorizationData,
  signWebhookBody,
  uploadPaymentProofRaw,
  type PaymentsAuthorizationSeed,
} from '../helpers/payment.authorization.helper';

let seed: PaymentsAuthorizationSeed;
let vendorSession: ApiSession;
let vendor2Session: ApiSession;

test.describe('Payments Authorization Suite', () => {
  test.beforeAll(async () => {
    clearValidationRateLimits();
    const vendorCreds = getVendorCredentials(1);
    const vendor2Creds = getVendorCredentials(2);
    vendorSession = await loginApiFresh(vendorCreds.mobile, vendorCreds.password);
    vendor2Session = await loginApiFresh(vendor2Creds.mobile, vendor2Creds.password);
    seed = await seedPaymentsAuthorizationData(vendorSession, vendor2Session);
  });

  test.describe('Section A — Frontend Route Protection', () => {
    test('PA-PAY-001 | Guest blocked from checkout', async ({ page }) => {
      await page.goto('/vendor/checkout');
      await expect(page).toHaveURL(/\/login/);
    });

    test('PA-PAY-002 | Guest blocked from order-success', async ({ page }) => {
      await page.goto('/vendor/order-success');
      await expect(page).toHaveURL(/\/login/);
    });

    test('PA-PAY-003 | Guest blocked from bank transfer payment page', async ({ page }) => {
      await page.goto(`/vendor/orders/${seed.vendor1BankOrderId}/payment`);
      await expect(page).toHaveURL(/\/login/);
    });

    test('PA-PAY-004 | Admin redirected from vendor checkout', async ({ page }) => {
      await establishSession(page, 'admin');
      await page.goto('/vendor/checkout');
      await expect(page).toHaveURL(/\/admin\/dashboard/);
    });

    test('PA-PAY-005 | SuperAdmin redirected from vendor checkout', async ({ page }) => {
      await establishSession(page, 'superadmin');
      await page.goto('/vendor/checkout');
      await expect(page).toHaveURL(/\/super-admin\/dashboard/);
    });

    test('PA-PAY-006 | Delivery redirected from vendor checkout', async ({ page }) => {
      await establishSession(page, 'delivery');
      await page.goto('/vendor/checkout');
      await expect(page).toHaveURL(/\/delivery\/dashboard/);
    });

    test('PA-PAY-007 | Vendor granted checkout page', async ({ page }) => {
      await establishSession(page, 'vendor');
      const checkout = new VendorCheckoutPage(page);
      await checkout.goto();
      await expect(page).toHaveURL(/\/vendor\/checkout/);
      await expect(checkout.pageHeading()).toBeVisible({ timeout: 15000 });
    });

    test('PA-PAY-008 | B2B customer granted vendor checkout', async ({ page }) => {
      await establishSession(page, 'customer');
      await page.goto('/vendor/checkout');
      await expect(page).toHaveURL(/\/vendor\/checkout/);
    });

    test('PA-PAY-009 | Deep-link bank payment page requires auth', async ({ page }) => {
      await page.goto(`/vendor/orders/${seed.vendor1BankOrderId}/payment`);
      await expect(page).toHaveURL(/\/login/);
      await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();
    });

    test('PA-PAY-010 | Guest blocked from admin payment-verifications', async ({ page }) => {
      await page.goto('/admin/payment-verifications');
      await expect(page).toHaveURL(/\/login/);
    });

    test('PA-PAY-011 | Vendor redirected from admin payment-verifications', async ({ page }) => {
      await establishSession(page, 'vendor');
      await page.goto('/admin/payment-verifications');
      await expect(page).toHaveURL(/\/vendor\/dashboard/);
    });

    test('PA-PAY-012 | Admin payment-verifications shows restricted notice', async ({ page }) => {
      await establishSession(page, 'admin');
      await page.goto('/admin/payment-verifications');
      await expect(page).toHaveURL(/\/admin\/payment-verifications/);
      await expect(page.getByText(/restricted|super admin/i).first()).toBeVisible({
        timeout: 15000,
      });
    });

    test('PA-PAY-013 | SuperAdmin granted payment-verifications page', async ({ page }) => {
      await establishSession(page, 'superadmin');
      await page.goto('/super-admin/payment-verifications');
      await expect(page).toHaveURL(/\/super-admin\/payment-verifications/);
      await expect(page.getByRole('heading', { name: /payment verifications/i })).toBeVisible({
        timeout: 20000,
      });
    });
  });

  test.describe('Section B — Navigation Visibility', () => {
    test('PA-PAY-014 | SuperAdmin sidebar shows Payment Verifications', async ({ page }) => {
      await establishSession(page, 'superadmin');
      await page.goto('/super-admin/dashboard');
      await expect(
        page.getByRole('link', { name: /payment verifications/i })
      ).toBeVisible();
    });

    test('PA-PAY-015 | Vendor sidebar has no admin payment-verifications link', async ({ page }) => {
      await establishSession(page, 'vendor');
      await page.goto('/vendor/dashboard');
      await expect(page.locator('a[href="/admin/payment-verifications"]')).toHaveCount(0);
    });

    test('PA-PAY-016 | Delivery has no payment-verifications nav', async ({ page }) => {
      await establishSession(page, 'delivery');
      await page.goto('/delivery/dashboard');
      await expect(page.locator('a[href*="payment-verifications"]')).toHaveCount(0);
    });
  });

  test.describe('Section C — Unauthenticated API', () => {
    test('PA-PAY-017 | Unauthenticated create-order rejected (CSRF before protect)', async () => {
      const response = await postPaymentsCreateOrderRaw({ amount: 100 });
      expect(response.status).toBe(403);
      expect(messageOf(response.data).toLowerCase()).toMatch(/csrf|forbidden|token/);
    });

    test('PA-PAY-018 | Unauthenticated verify rejected', async () => {
      const response = await postPaymentsVerifyRaw({
        orderId: seed.vendor1OnlineOrderId,
        razorpay_order_id: 'order_x',
        razorpay_payment_id: 'pay_x',
        razorpay_signature: 'sig_x',
      });
      expect(response.status).toBe(403);
    });

    test('PA-PAY-019 | Unauthenticated fail rejected', async () => {
      const response = await postPaymentsFailRaw({ orderId: seed.vendor1OnlineOrderId });
      expect(response.status).toBe(403);
    });

    test('PA-PAY-020 | Unauthenticated initiate rejected', async () => {
      const response = await postPaymentsInitiateRaw(seed.vendor1OnlineOrderId);
      expect(response.status).toBe(403);
    });

    test('PA-PAY-021 | Unauthenticated refund POST rejected', async () => {
      const response = await postPaymentsRefundRaw({
        orderId: seed.vendor1CodOrderId,
        amount: 10,
      });
      expect(response.status).toBe(403);
    });

    test('PA-PAY-022 | Unauthenticated GET bank-details returns 401', async () => {
      const response = await getBankDetailsRaw();
      expect(response.status).toBe(401);
    });

    test('PA-PAY-023 | Unauthenticated GET refund history returns 401', async () => {
      const response = await getRefundHistoryRaw(seed.vendor1CodOrderId);
      expect(response.status).toBe(401);
    });

    test('PA-PAY-024 | Unauthenticated GET pending proofs returns 401', async () => {
      const response = await getPendingPaymentProofsRaw();
      expect(response.status).toBe(401);
    });

    test('PA-PAY-025 | Unauthenticated bank upload rejected', async () => {
      const response = await uploadPaymentProofRaw(
        { accessToken: '', csrfToken: '' } as unknown as ApiSession,
        {
          orderId: seed.vendor1BankOrderId,
          utrNumber: `UTR${Date.now()}`,
          transferredAmount: 140,
        },
        { buffer: MINI_PNG, name: 'proof.png', mimeType: 'image/png' }
      );
      expect([401, 403]).toContain(response.status);
    });
  });

  test.describe('Section D — JWT / Session Hardening', () => {
    test('PA-PAY-026 | Malformed Bearer on create-order rejected', async () => {
      const response = await postPaymentsCreateOrderRaw(
        { amount: 100, orderId: seed.vendor1OnlineOrderId },
        { Authorization: 'Bearer not-a-jwt', 'x-csrf-token': 'x', Cookie: 'csrf-token=x' }
      );
      expect([401, 403]).toContain(response.status);
    });

    test('PA-PAY-027 | Expired JWT rejected on GET bank-details', async () => {
      const payload = decodeJwtPayload(vendorSession.accessToken);
      const expired = signTestJwt(
        { id: payload.id, role: payload.role, sessionId: payload.sessionId },
        { expired: true }
      );
      const response = await getBankDetailsRaw(bearerOnly(expired));
      expect(response.status).toBe(401);
    });

    test('PA-PAY-028 | Tampered JWT signature rejected', async () => {
      const tampered = tamperTokenSignature(vendorSession.accessToken);
      const response = await getBankDetailsRaw(bearerOnly(tampered));
      expect(response.status).toBe(401);
    });

    test('PA-PAY-029 | Literal null token rejected', async () => {
      const response = await getBankDetailsRaw(bearerOnly('null'));
      expect(response.status).toBe(401);
    });

    test('PA-PAY-030 | Missing Authorization on GET bank-details returns 401', async () => {
      await expectApiStatus(() => apiClient.get('/payments/bank-transfer/bank-details'), 401);
    });

    test('PA-PAY-031 | Session-replaced token rejected on bank-details', async () => {
      const creds = getVendorCredentials(1);
      const first = await loginApiFresh(creds.mobile, creds.password);
      await loginApiFresh(creds.mobile, creds.password);
      const response = await getBankDetailsRaw(bearerOnly(first.accessToken));
      expect(response.status).toBe(401);
      vendorSession = await refreshVendorApiSession(1);
    });

    test('PA-PAY-032 | Token without sessionId rejected when active session exists', async () => {
      const payload = decodeJwtPayload(vendorSession.accessToken);
      const noSession = signTestJwt({ id: payload.id, role: payload.role });
      const response = await getBankDetailsRaw(bearerOnly(noSession));
      expect(response.status).toBe(401);
    });

    test('PA-PAY-033 | Escalated JWT role cannot approve bank proof', async () => {
      const escalated = signEscalatedRoleToken(vendorSession.accessToken, 'SUPER_ADMIN');
      const response = await approvePaymentProofRaw(
        '000000000000000000000001',
        bearerOnly(escalated)
      );
      // CSRF may fire first without cookie; otherwise authorize/protect rejects.
      expect([401, 403]).toContain(response.status);
    });

    test('PA-PAY-034 | Deleted user token rejected', async () => {
      const ghost = signTestJwt({ id: '000000000000000000000099', role: 'VENDOR' });
      const response = await getBankDetailsRaw(bearerOnly(ghost));
      expect(response.status).toBe(401);
    });
  });

  test.describe('Section E — Ownership & Cross-tenant Isolation', () => {
    test('PA-PAY-035 | Vendor can initiate own ONLINE order', async () => {
      clearValidationRateLimits();
      const response = await postPaymentsInitiateRaw(
        seed.vendor1OnlineOrderId,
        authHeaders(vendorSession)
      );
      // Gateway may be unconfigured → 400/500; ownership must not yield 403.
      expect(response.status).not.toBe(403);
      expect(response.status).not.toBe(401);
    });

    test('PA-PAY-036 | Vendor cannot initiate another vendor ONLINE order', async () => {
      const response = await postPaymentsInitiateRaw(
        seed.vendor1OnlineOrderId,
        authHeaders(vendor2Session)
      );
      expect(response.status).toBe(403);
      expect(messageOf(response.data).toLowerCase()).toMatch(/access|denied|forbidden/);
    });

    test('PA-PAY-037 | Vendor cannot fail another vendor ONLINE order', async () => {
      const response = await postPaymentsFailRaw(
        { orderId: seed.vendor1OnlineOrderId, reason: 'pa-pay cross' },
        authHeaders(vendor2Session)
      );
      expect(response.status).toBe(403);
    });

    test('PA-PAY-038 | Vendor cannot verify another vendor order', async () => {
      const response = await postPaymentsVerifyRaw(
        {
          orderId: seed.vendor1OnlineOrderId,
          razorpay_order_id: 'order_x',
          razorpay_payment_id: 'pay_x',
          razorpay_signature: 'sig_x',
        },
        authHeaders(vendor2Session)
      );
      // Signature invalid → 400 after ownership, or 403 ownership first.
      expect([400, 403]).toContain(response.status);
      if (response.status === 403) {
        expect(messageOf(response.data).toLowerCase()).toMatch(/access|denied|forbidden/);
      }
    });

    test('PA-PAY-039 | Vendor cannot upload proof for another vendor bank order', async () => {
      clearValidationRateLimits();
      const response = await uploadPaymentProofRaw(
        vendor2Session,
        {
          orderId: seed.vendor1BankOrderId,
          utrNumber: `UTRPA${Date.now()}`,
          transferredAmount: 140,
        },
        { buffer: MINI_PNG, name: 'proof.png', mimeType: 'image/png' }
      );
      expect(response.status).toBe(403);
      expect(messageOf(response.body).toLowerCase()).toMatch(/own|forbidden|denied/);
    });

    test('PA-PAY-040 | Vendor cannot read another vendor payment proof by order', async () => {
      const response = await getPaymentProofByOrderRaw(
        seed.vendor1BankOrderId,
        authBearerOnly(vendor2Session)
      );
      expect(response.status).toBe(403);
    });

    test('PA-PAY-041 | Vendor can read own payment proof by order', async () => {
      const response = await getPaymentProofByOrderRaw(
        seed.vendor1BankOrderId,
        authBearerOnly(vendorSession)
      );
      expect(response.status).toBe(200);
    });

    test('PA-PAY-042 | Cross-user refund attempt denied', async () => {
      const response = await postPaymentsRefundRaw(
        { orderId: seed.vendor1CodOrderId, amount: 10, reason: 'pa-pay cross refund' },
        authHeaders(vendor2Session)
      );
      expect(response.status).toBe(403);
      expect(messageOf(response.data).toLowerCase()).toMatch(/unauthorized|forbidden|denied/);
    });

    test('PA-PAY-043 | Cross-user refund history denied', async () => {
      const response = await getRefundHistoryRaw(
        seed.vendor1CodOrderId,
        authBearerOnly(vendor2Session)
      );
      expect(response.status).toBe(403);
    });

    test('PA-PAY-044 | Owner refund history allowed (authz path)', async () => {
      const response = await getRefundHistoryRaw(
        seed.vendor1CodOrderId,
        authBearerOnly(vendorSession)
      );
      expect(response.status).toBe(200);
      const data = (response.data as { data?: unknown })?.data ?? response.data;
      expect(data === null || Array.isArray(data) || typeof data === 'object').toBeTruthy();
    });
  });

  test.describe('Section F — Role API Access', () => {
    test('PA-PAY-045 | Vendor GET bank-details succeeds', async () => {
      const response = await getBankDetailsRaw(authBearerOnly(vendorSession));
      expect(response.status).toBe(200);
    });

    test('PA-PAY-046 | Admin GET bank-details succeeds', async () => {
      const adminSession = await loginApi(
        getAdminCredentials().mobile,
        getAdminCredentials().password
      );
      const response = await getBankDetailsRaw(authBearerOnly(adminSession));
      expect(response.status).toBe(200);
    });

    test('PA-PAY-047 | Delivery GET bank-details succeeds (authenticated)', async () => {
      const delivery = await loginApi(
        getDeliveryCredentials().mobile,
        getDeliveryCredentials().password
      );
      const response = await getBankDetailsRaw(authBearerOnly(delivery));
      expect(response.status).toBe(200);
    });

    test('PA-PAY-048 | Vendor cannot list pending proofs', async () => {
      const response = await getPendingPaymentProofsRaw(authBearerOnly(vendorSession));
      expect(response.status).toBe(403);
    });

    test('PA-PAY-049 | Admin cannot list pending proofs (SUPER_ADMIN only)', async () => {
      const adminSession = await loginApi(
        getAdminCredentials().mobile,
        getAdminCredentials().password
      );
      const response = await getPendingPaymentProofsRaw(authBearerOnly(adminSession));
      expect(response.status).toBe(403);
    });

    test('PA-PAY-050 | SuperAdmin can list pending proofs', async () => {
      const sa = await getSuperAdminFreshSession();
      const response = await getPendingPaymentProofsRaw(authBearerOnly(sa));
      expect(response.status).toBe(200);
    });

    test('PA-PAY-051 | Admin cannot approve payment proof', async () => {
      const adminSession = await loginApi(
        getAdminCredentials().mobile,
        getAdminCredentials().password
      );
      const response = await approvePaymentProofRaw(
        '000000000000000000000001',
        authHeaders(adminSession)
      );
      expect(response.status).toBe(403);
    });

    test('PA-PAY-052 | Delivery cannot approve payment proof', async () => {
      const delivery = await loginApi(
        getDeliveryCredentials().mobile,
        getDeliveryCredentials().password
      );
      const response = await approvePaymentProofRaw(
        '000000000000000000000001',
        authHeaders(delivery)
      );
      expect(response.status).toBe(403);
    });

    test('PA-PAY-053 | SuperAdmin approve unknown proof is not auth-denied', async () => {
      const sa = await getSuperAdminFreshSession();
      const response = await approvePaymentProofRaw(
        '000000000000000000000001',
        authHeaders(sa)
      );
      expect(response.status).not.toBe(401);
      expect(response.status).not.toBe(403);
      expect([400, 404]).toContain(response.status);
    });

    test('PA-PAY-054 | Admin can initiate any vendor order (elevated ownership)', async () => {
      clearValidationRateLimits();
      const adminSession = await loginApi(
        getAdminCredentials().mobile,
        getAdminCredentials().password
      );
      const response = await postPaymentsInitiateRaw(
        seed.vendor2OnlineOrderId,
        authHeaders(adminSession)
      );
      expect(response.status).not.toBe(403);
      expect(response.status).not.toBe(401);
    });
  });

  test.describe('Section G — Account Status & Logout', () => {
    test('PA-PAY-055 | Inactive account GET bank-details returns 403', async () => {
      const creds = getInactiveVendorCredentials();
      const adminSession = await getAdminSession();
      const usersResponse = await apiClient.get('/users', {
        params: { search: creds.mobile },
        headers: authHeaders(adminSession),
      });
      const body = usersResponse.data?.data ?? usersResponse.data ?? {};
      const users = Array.isArray(body) ? body : body.users ?? [];
      const inactiveUser = users.find(
        (user: { mobile?: string }) => String(user.mobile) === creds.mobile
      );
      expect(inactiveUser).toBeTruthy();
      const userId = String(inactiveUser._id || inactiveUser.id);
      const inactiveToken = signTestJwt({ id: userId, role: 'VENDOR' });
      const response = await getBankDetailsRaw(bearerOnly(inactiveToken));
      expect(response.status).toBe(403);
    });

    test('PA-PAY-056 | Inactive account blocked from login', async () => {
      const creds = getInactiveVendorCredentials();
      await expect(loginApiFresh(creds.mobile, creds.password)).rejects.toMatchObject({
        response: { status: 403 },
      });
    });

    test('PA-PAY-057 | Invalid browser token redirects to login on checkout', async ({ page }) => {
      await page.goto('/');
      await page.evaluate(() => {
        localStorage.setItem('accessToken', 'invalid-token-value');
        localStorage.setItem('refreshToken', 'invalid-refresh');
        localStorage.setItem('isAuthenticated', 'true');
        localStorage.setItem('user', JSON.stringify({ role: 'vendor', name: 'Bad Session' }));
      });
      await page.goto('/vendor/checkout');
      await expect(page).toHaveURL(/\/login/, { timeout: 20000 });
    });

    test('PA-PAY-058 | Logout blocks subsequent checkout access', async ({ page }) => {
      await establishSession(page, 'vendor');
      await page.goto('/vendor/checkout');
      await logoutFlow(page);
      await page.goto('/vendor/checkout');
      await expect(page).toHaveURL(/\/login/, { timeout: 15000 });
      vendorSession = await refreshVendorApiSession(1);
    });

    test('PA-PAY-059 | Logout blocks bank payment deep-link', async ({ page }) => {
      await establishSession(page, 'vendor');
      await page.goto('/vendor/dashboard');
      await logoutFlow(page);
      await page.goto(`/vendor/orders/${seed.vendor1BankOrderId}/payment`);
      await expect(page).toHaveURL(/\/login/, { timeout: 15000 });
      vendorSession = await refreshVendorApiSession(1);
    });
  });

  test.describe('Section H — CSRF Implementation Truth', () => {
    test.beforeAll(async () => {
      vendorSession = await refreshVendorApiSession(1);
    });

    test('PA-PAY-060 | create-order without CSRF rejected', async () => {
      const response = await postPaymentsCreateOrderRaw(
        { amount: 100, orderId: seed.vendor1OnlineOrderId },
        authBearerOnly(vendorSession)
      );
      expect(response.status).toBe(403);
      expect(messageOf(response.data).toLowerCase()).toMatch(/csrf|forbidden|token/);
    });

    test('PA-PAY-061 | fail without CSRF rejected', async () => {
      const response = await postPaymentsFailRaw(
        { orderId: seed.vendor2OnlineOrderId },
        authBearerOnly(vendorSession)
      );
      expect(response.status).toBe(403);
    });

    test('PA-PAY-062 | GET bank-details succeeds without CSRF header', async () => {
      const response = await getBankDetailsRaw(authBearerOnly(vendorSession));
      expect(response.status).toBe(200);
    });

    test('PA-PAY-063 | create-order with valid CSRF reaches gateway layer', async () => {
      clearValidationRateLimits();
      const response = await postPaymentsCreateOrderRaw(
        { amount: 140, orderId: seed.vendor1OnlineOrderId },
        authHeaders(vendorSession)
      );
      expect(response.status).not.toBe(401);
      expect(response.status).not.toBe(403);
      expect([200, 400, 500]).toContain(response.status);
    });

    test('PA-PAY-064 | Bank upload without CSRF rejected', async () => {
      const response = await uploadPaymentProofRaw(
        { ...vendorSession, csrfToken: '' },
        {
          orderId: seed.vendor1BankOrderId,
          utrNumber: `UTRNOCSRF${Date.now()}`,
          transferredAmount: 140,
        },
        { buffer: MINI_PNG, name: 'proof.png', mimeType: 'image/png' }
      );
      expect(response.status).toBe(403);
    });

    test('PA-PAY-065 | Payment state-changing routes use csrfProtection', async () => {
      const routesSource = readBackendFile('src/modules/payment/payment.routes.js');
      expect(routesSource).toMatch(/csrfProtection/);
      expect(routesSource).toMatch(/create-order/);
      expect(routesSource).toMatch(/verify/);
      expect(routesSource).toMatch(/fail/);
      expect(routesSource).toMatch(/refund/);
    });

    test('PA-PAY-066 | Bank proof mutate routes use csrfProtection', async () => {
      const routesSource = readBackendFile('src/modules/payment-proof/paymentProof.routes.js');
      expect(routesSource).toMatch(/csrfProtection/);
      expect(routesSource).toMatch(/upload/);
      expect(routesSource).toMatch(/approve/);
      expect(routesSource).toMatch(/reject/);
    });
  });

  test.describe('Section I — Webhook Authorization', () => {
    test('PA-PAY-067 | Webhook accepts requests without JWT', async () => {
      const response = await postPaymentsWebhookRawFetch({
        body: JSON.stringify({
          id: `evt_pa_nojwt_${Date.now()}`,
          event: 'payment.captured',
          payload: { payment: { entity: { id: 'pay_x', order_id: 'ord_x', amount: 100 } } },
        }),
      });
      // No JWT required — rejection is signature/config, not 401.
      expect(response.status).not.toBe(401);
      expect(response.status).toBeGreaterThanOrEqual(400);
    });

    test('PA-PAY-068 | Webhook unsigned / invalid signature rejected', async () => {
      const response = await postPaymentsWebhookRawFetch({
        body: JSON.stringify({
          id: `evt_pa_bad_${Date.now()}`,
          event: 'payment.captured',
          payload: { payment: { entity: { id: 'pay_x', order_id: 'ord_x', amount: 100 } } },
        }),
        signature: 'invalid',
      });
      expect(response.status).not.toBe(200);
      expect(response.status).toBeGreaterThanOrEqual(400);
    });

    test('PA-PAY-069 | Signed duplicate webhook is acknowledged when configured', async () => {
      const webhookSecret = getRazorpayWebhookSecret();
      if (!seed.webhookConfigured || !webhookSecret) {
        const response = await postPaymentsWebhookRawFetch({
          body: JSON.stringify({ id: 'evt_pa_cfg', event: 'payment.captured', payload: {} }),
          signature: 'x',
        });
        expect(response.status).toBeGreaterThanOrEqual(400);
        expect(messageOf(response.body).toLowerCase()).toMatch(
          /configuration|signature|invalid|webhook/
        );
        return;
      }

      const eventId = `evt_pa_dup_${Date.now()}`;
      const rawBody = JSON.stringify({
        id: eventId,
        event: 'payment.captured',
        payload: {
          payment: {
            entity: { id: 'pay_unknown', order_id: 'order_unknown', amount: 100, status: 'captured' },
          },
        },
      });
      const signature = signWebhookBody(rawBody, webhookSecret);
      const first = await postPaymentsWebhookRawFetch({ body: rawBody, signature });
      const second = await postPaymentsWebhookRawFetch({ body: rawBody, signature });
      expect(first.status).toBe(200);
      expect(second.status).toBe(200);
    });

    test('PA-PAY-070 | Webhook route is mounted without protect middleware', async () => {
      const routesSource = readBackendFile('src/modules/payment/payment.routes.js');
      const webhookLine = routesSource
        .split('\n')
        .find((line) => /router\.post\(\s*['"]\/webhook['"]/.test(line));
      expect(webhookLine).toBeTruthy();
      expect(webhookLine).toMatch(/paymentLimiter/);
      expect(webhookLine).toMatch(/razorpayWebhook/);
      expect(webhookLine).not.toMatch(/\bprotect\b/);
    });
  });

  test.describe('Section J — Bank Approve / Reject AuthZ', () => {
    test('PA-PAY-071 | Vendor upload own proof then SuperAdmin reject allowed', async () => {
      clearValidationRateLimits();
      await clearCartApi(vendorSession);
      await addToCartApi(vendorSession, seed.productId, 1);
      const order = await placeBankTransferOrderApi(vendorSession, {
        idempotencyKey: `pa-pay-rej-${Date.now()}`,
      });
      const orderId = resolveOrderId(order);
      const upload = await uploadPaymentProofRaw(
        vendorSession,
        {
          orderId,
          utrNumber: `UTRREJ${Date.now()}`,
          transferredAmount: 140,
        },
        { buffer: MINI_PNG, name: 'proof.png', mimeType: 'image/png' }
      );
      expect([200, 201]).toContain(upload.status);
      const data = (upload.body.data ?? upload.body) as Record<string, unknown>;
      const proof = (data.paymentProof ?? data.proof ?? data) as Record<string, unknown>;
      const proofId = String(proof._id || proof.id || '');
      expect(proofId.length).toBeGreaterThan(0);

      const sa = await getSuperAdminFreshSession();
      const reject = await rejectPaymentProofRaw(
        proofId,
        'PA-PAY authorization reject',
        authHeaders(sa)
      );
      expect(reject.status).toBe(200);
    });

    test('PA-PAY-072 | Vendor cannot reject payment proof', async () => {
      const response = await rejectPaymentProofRaw(
        '000000000000000000000001',
        'vendor attempt',
        authHeaders(vendorSession)
      );
      expect(response.status).toBe(403);
    });

    test('PA-PAY-073 | Customer role cannot list pending proofs', async () => {
      const customer = await loginApi(
        getCustomerCredentials().mobile,
        getCustomerCredentials().password
      );
      const response = await getPendingPaymentProofsRaw(authBearerOnly(customer));
      expect(response.status).toBe(403);
    });

    test('PA-PAY-074 | getRefundById unknown id is not auth leak', async () => {
      const response = await getRefundByIdRaw(
        '000000000000000000000001',
        authBearerOnly(vendorSession)
      );
      expect(response.status).toBe(404);
    });
  });
});
