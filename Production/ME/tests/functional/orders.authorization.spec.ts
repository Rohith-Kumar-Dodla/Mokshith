import { test, expect } from '../fixtures/product.functional.fixture';
import VendorOrdersPage from '../pages/vendor/VendorOrdersPage';
import VendorOrderDetailsPage from '../pages/vendor/VendorOrderDetailsPage';
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
import { addToCartApi, clearCartApi } from '../helpers/cart.api.helper';
import logoutFlow from '../flows/authentication/logout.flow';
import LoginPage from '../pages/auth/LoginPage';
import {
  authBearerOnly,
  bearerOnly,
  buildShippingAddress,
  clearValidationRateLimits,
  getInvoiceByOrderIdRaw,
  getOrderByIdRaw,
  getOrderInvoiceRaw,
  getOrdersRaw,
  ordersContainId,
  patchOrderStatusRaw,
  postGenerateInvoiceRaw,
  postOrderFailRaw,
  postOrdersRaw,
  readBackendFile,
  refreshVendorApiSession,
  seedOrdersAuthorizationData,
  unwrapOrdersList,
  type OrdersAuthorizationSeed,
} from '../helpers/order.authorization.helper';

let seed: OrdersAuthorizationSeed;
let vendorSession: ApiSession;
let vendor2Session: ApiSession;

test.describe('Orders Authorization Suite', () => {
  test.beforeAll(async () => {
    clearValidationRateLimits();
    const vendorCreds = getVendorCredentials(1);
    const vendor2Creds = getVendorCredentials(2);
    // Fresh sessions avoid stale JWT after logout/session-replacement tests + worker restart.
    vendorSession = await loginApiFresh(vendorCreds.mobile, vendorCreds.password);
    vendor2Session = await loginApiFresh(vendor2Creds.mobile, vendor2Creds.password);
    seed = await seedOrdersAuthorizationData(vendorSession, vendor2Session);
  });

  test.describe('Section A — Frontend Route Protection', () => {
    test('OA-ORD-001 | Unauthenticated blocked from Orders page', async ({ page }) => {
      await page.goto('/vendor/orders');
      await expect(page).toHaveURL(/\/login/);
    });

    test('OA-ORD-002 | Unauthenticated blocked from Checkout', async ({ page }) => {
      await page.goto('/vendor/checkout');
      await expect(page).toHaveURL(/\/login/);
    });

    test('OA-ORD-003 | Unauthenticated blocked from Order Details', async ({ page }) => {
      await page.goto(`/vendor/orders/${seed.vendor1OrderId}`);
      await expect(page).toHaveURL(/\/login/);
    });

    test('OA-ORD-004 | Unauthenticated blocked from Order Success', async ({ page }) => {
      await page.goto('/vendor/order-success');
      await expect(page).toHaveURL(/\/login/);
    });

    test('OA-ORD-005 | Admin redirected from vendor Orders', async ({ page }) => {
      await establishSession(page, 'admin');
      await page.goto('/vendor/orders');
      await expect(page).toHaveURL(/\/admin\/dashboard/);
    });

    test('OA-ORD-006 | SuperAdmin redirected from vendor Orders', async ({ page }) => {
      await establishSession(page, 'superadmin');
      await page.goto('/vendor/orders');
      await expect(page).toHaveURL(/\/super-admin\/dashboard/);
    });

    test('OA-ORD-007 | Delivery redirected from vendor Orders', async ({ page }) => {
      await establishSession(page, 'delivery');
      await page.goto('/vendor/orders');
      await expect(page).toHaveURL(/\/delivery\/dashboard/);
    });

    test('OA-ORD-008 | Vendor granted Orders page', async ({ page }) => {
      await establishSession(page, 'vendor');
      const ordersPage = new VendorOrdersPage(page);
      await ordersPage.goto();
      await ordersPage.waitForLoad();
      await expect(ordersPage.pageHeading()).toBeVisible();
    });

    test('OA-ORD-009 | B2B customer granted vendor Orders', async ({ page }) => {
      await establishSession(page, 'customer');
      const ordersPage = new VendorOrdersPage(page);
      await ordersPage.goto();
      await ordersPage.waitForLoad();
      await expect(ordersPage.pageHeading()).toBeVisible();
    });

    test('OA-ORD-010 | Admin granted admin Orders page', async ({ page }) => {
      await establishSession(page, 'admin');
      await page.goto('/admin/orders');
      await expect(page.getByText('Area Orders')).toBeVisible({ timeout: 15000 });
    });

    test('OA-ORD-011 | Delivery granted assigned-orders page', async ({ page }) => {
      await establishSession(page, 'delivery');
      await page.goto('/delivery/assigned-orders');
      await expect(page.getByRole('heading', { name: 'Assigned Deliveries' })).toBeVisible({
        timeout: 15000,
      });
    });
  });

  test.describe('Section B — Hidden UI & Navigation', () => {
    test('OA-ORD-012 | Admin sidebar has no vendor Orders link', async ({ page }) => {
      await establishSession(page, 'admin');
      await page.goto('/admin/dashboard');
      await expect(page.locator('a[href="/vendor/orders"]')).toHaveCount(0);
    });

    test('OA-ORD-013 | Delivery sidebar has no vendor Orders link', async ({ page }) => {
      await establishSession(page, 'delivery');
      await page.goto('/delivery/dashboard');
      await expect(page.locator('a[href="/vendor/orders"]')).toHaveCount(0);
    });

    test('OA-ORD-014 | Guest public navbar has no vendor Orders link', async ({ page }) => {
      await page.goto('/');
      await expect(page.locator('a[href="/vendor/orders"]')).toHaveCount(0);
    });

    test('OA-ORD-015 | Vendor sidebar Orders link visible', async ({ page }) => {
      await establishSession(page, 'vendor');
      await page.goto('/vendor/dashboard');
      await expect(
        page.getByLabel('Main navigation').getByRole('link', { name: /^Orders$/ })
      ).toBeVisible();
    });

    test('OA-ORD-016 | Vendor blocked from admin Orders UI', async ({ page }) => {
      await establishSession(page, 'vendor');
      await page.goto('/admin/orders');
      await expect(page).toHaveURL(/\/vendor\/dashboard/);
    });
  });

  test.describe('Section C — Unauthenticated API Access', () => {
    test('OA-ORD-017 | GET /orders without token returns 401', async () => {
      const response = await getOrdersRaw();
      expect(response.status).toBe(401);
    });

    test('OA-ORD-018 | POST /orders without token returns 401', async () => {
      const response = await postOrdersRaw({
        paymentMethod: 'COD',
        shippingAddress: buildShippingAddress(),
      });
      expect(response.status).toBe(401);
    });

    test('OA-ORD-019 | GET /orders/:id without token returns 401', async () => {
      const response = await getOrderByIdRaw(seed.vendor1OrderId);
      expect(response.status).toBe(401);
    });

    test('OA-ORD-020 | GET /orders/:id/invoice without token returns 401', async () => {
      const response = await getOrderInvoiceRaw(seed.vendor1OrderId);
      expect(response.status).toBe(401);
    });

    test('OA-ORD-021 | GET /orders with malformed token returns 401', async () => {
      const response = await getOrdersRaw(bearerOnly('not-a-jwt'));
      expect(response.status).toBe(401);
    });

    test('OA-ORD-022 | GET /orders with expired token returns 401', async () => {
      const payload = decodeJwtPayload(vendorSession.accessToken);
      const expired = signTestJwt(
        {
          id: payload.id,
          role: payload.role,
          sessionId: payload.sessionId,
        },
        { expired: true }
      );
      const response = await getOrdersRaw(bearerOnly(expired));
      expect(response.status).toBe(401);
    });

    test('OA-ORD-023 | GET /orders with literal null token returns 401', async () => {
      const response = await getOrdersRaw(bearerOnly('null'));
      expect(response.status).toBe(401);
    });
  });

  test.describe('Section D — Token Security', () => {
    test('OA-ORD-024 | Tampered JWT rejected on GET /orders', async () => {
      const tampered = tamperTokenSignature(vendorSession.accessToken);
      const response = await getOrdersRaw(bearerOnly(tampered));
      expect(response.status).toBe(401);
    });

    test('OA-ORD-025 | Missing Authorization header rejected', async () => {
      await expectApiStatus(() => apiClient.get('/orders'), 401);
    });

    test('OA-ORD-026 | Session-replaced token rejected on GET /orders', async () => {
      const creds = getVendorCredentials(1);
      const first = await loginApiFresh(creds.mobile, creds.password);
      await loginApiFresh(creds.mobile, creds.password);
      const response = await getOrdersRaw(bearerOnly(first.accessToken));
      expect(response.status).toBe(401);
      vendorSession = await refreshVendorApiSession();
    });

    test('OA-ORD-027 | Token without sessionId rejected when active session exists', async () => {
      const payload = decodeJwtPayload(vendorSession.accessToken);
      const noSession = signTestJwt({ id: payload.id, role: payload.role });
      const response = await getOrdersRaw(bearerOnly(noSession));
      expect(response.status).toBe(401);
    });

    test('OA-ORD-028 | Escalated JWT role claim cannot access another user order', async () => {
      const escalated = signEscalatedRoleToken(vendor2Session.accessToken, 'SUPER_ADMIN');
      const response = await getOrderByIdRaw(seed.vendor1OrderId, bearerOnly(escalated));
      expect(response.status).toBe(403);
    });

    test('OA-ORD-029 | Deleted user token rejected', async () => {
      const ghostToken = signTestJwt({ id: '000000000000000000000099', role: 'VENDOR' });
      const response = await getOrdersRaw(bearerOnly(ghostToken));
      expect(response.status).toBe(401);
    });
  });

  test.describe('Section E — Ownership & Isolation', () => {
    test('OA-ORD-030 | Vendor1 order not visible in Vendor2 list', async () => {
      const response = await getOrdersRaw(authBearerOnly(vendor2Session));
      expect(response.status).toBe(200);
      const orders = unwrapOrdersList(response.data);
      expect(ordersContainId(orders, seed.vendor1OrderId)).toBe(false);
    });

    test('OA-ORD-031 | Cross-user GET /orders/:id denied with 403', async () => {
      const response = await getOrderByIdRaw(
        seed.vendor1OrderId,
        authBearerOnly(vendor2Session)
      );
      expect(response.status).toBe(403);
    });

    test('OA-ORD-032 | Cross-user GET /orders/:id/invoice denied with 403', async () => {
      const response = await getOrderInvoiceRaw(
        seed.vendor1OrderId,
        authBearerOnly(vendor2Session)
      );
      expect(response.status).toBe(403);
    });

    test('OA-ORD-033 | Cross-user POST /orders/:id/fail denied with 403', async () => {
      const response = await postOrderFailRaw(
        seed.vendor1OrderId,
        authHeaders(vendor2Session)
      );
      expect(response.status).toBe(403);
    });

    test('OA-ORD-034 | Unknown order id returns 404', async () => {
      const response = await getOrderByIdRaw(
        '000000000000000000000001',
        authBearerOnly(vendorSession)
      );
      expect(response.status).toBe(404);
    });

    test('OA-ORD-035 | Vendor can GET own order details', async () => {
      const response = await getOrderByIdRaw(
        seed.vendor1OrderId,
        authBearerOnly(vendorSession)
      );
      expect(response.status).toBe(200);
    });

    test('OA-ORD-036 | Admin can GET any vendor order', async () => {
      const adminSession = await loginApi(
        getAdminCredentials().mobile,
        getAdminCredentials().password
      );
      const response = await getOrderByIdRaw(
        seed.vendor1OrderId,
        authBearerOnly(adminSession)
      );
      expect(response.status).toBe(200);
    });

    test('OA-ORD-037 | Vendor own order visible in own list', async () => {
      const response = await getOrdersRaw(authBearerOnly(vendorSession));
      expect(response.status).toBe(200);
      const orders = unwrapOrdersList(response.data);
      expect(ordersContainId(orders, seed.vendor1OrderId)).toBe(true);
    });
  });

  test.describe('Section F — Role API Access', () => {
    test('OA-ORD-038 | Vendor GET /orders succeeds', async () => {
      const response = await getOrdersRaw(authBearerOnly(vendorSession));
      expect(response.status).toBe(200);
    });

    test('OA-ORD-039 | Admin GET /orders succeeds', async () => {
      const adminSession = await loginApi(
        getAdminCredentials().mobile,
        getAdminCredentials().password
      );
      const response = await getOrdersRaw(authBearerOnly(adminSession));
      expect(response.status).toBe(200);
    });

    test('OA-ORD-040 | SuperAdmin GET /orders succeeds', async () => {
      const superSession = await loginApi(
        getSuperAdminCredentials().mobile,
        getSuperAdminCredentials().password
      );
      const response = await getOrdersRaw(authBearerOnly(superSession));
      expect(response.status).toBe(200);
    });

    test('OA-ORD-041 | Delivery GET /orders does not leak vendor1 order', async () => {
      const deliverySession = await loginApi(
        getDeliveryCredentials().mobile,
        getDeliveryCredentials().password
      );
      const response = await getOrdersRaw(authBearerOnly(deliverySession));
      expect(response.status).toBe(200);
      const orders = unwrapOrdersList(response.data);
      expect(ordersContainId(orders, seed.vendor1OrderId)).toBe(false);
    });

    test('OA-ORD-042 | Vendor PATCH status forbidden', async () => {
      const response = await patchOrderStatusRaw(
        seed.vendor1OrderId,
        { status: 'SHIPPED' },
        authHeaders(vendorSession)
      );
      expect(response.status).toBe(403);
    });

    test('OA-ORD-043 | Delivery PATCH status forbidden', async () => {
      const deliverySession = await loginApi(
        getDeliveryCredentials().mobile,
        getDeliveryCredentials().password
      );
      const response = await patchOrderStatusRaw(
        seed.vendor1OrderId,
        { status: 'SHIPPED' },
        authHeaders(deliverySession)
      );
      expect(response.status).toBe(403);
    });

    test('OA-ORD-044 | Admin PATCH status not role-forbidden', async () => {
      const adminSession = await loginApi(
        getAdminCredentials().mobile,
        getAdminCredentials().password
      );
      const response = await patchOrderStatusRaw(
        seed.vendor1OrderId,
        { status: 'CONFIRMED' },
        authHeaders(adminSession)
      );
      // Role middleware allows admin; workflow may accept or reject transition.
      expect(response.status).not.toBe(401);
      expect(response.status).not.toBe(403);
    });

    test('OA-ORD-045 | Admin blocked from vendor Checkout UI', async ({ page }) => {
      await establishSession(page, 'admin');
      await page.goto('/vendor/checkout');
      await expect(page).toHaveURL(/\/admin\/dashboard/);
    });

    test('OA-ORD-046 | Delivery blocked from vendor Checkout UI', async ({ page }) => {
      await establishSession(page, 'delivery');
      await page.goto('/vendor/checkout');
      await expect(page).toHaveURL(/\/delivery\/dashboard/);
    });

    test('OA-ORD-047 | B2B customer POST /orders allowed when cart ready', async () => {
      clearValidationRateLimits();
      const customerSession = await loginApi(
        getCustomerCredentials().mobile,
        getCustomerCredentials().password
      );
      await clearCartApi(customerSession);
      await addToCartApi(customerSession, seed.product.id, 1);
      const response = await postOrdersRaw(
        {
          paymentMethod: 'COD',
          shippingAddress: buildShippingAddress(),
          idempotencyKey: `oa-ord-cust-${Date.now()}`,
        },
        {
          ...authHeaders(customerSession),
          'Idempotency-Key': `oa-ord-cust-${Date.now()}`,
        }
      );
      expect(response.status).toBe(200);
    });
  });

  test.describe('Section G — Account Status & Session', () => {
    test('OA-ORD-048 | Inactive account GET /orders returns 403', async () => {
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
      const response = await getOrdersRaw(bearerOnly(inactiveToken));
      expect(response.status).toBe(403);
    });

    test('OA-ORD-049 | Inactive account blocked from login', async () => {
      const creds = getInactiveVendorCredentials();
      await expect(loginApiFresh(creds.mobile, creds.password)).rejects.toMatchObject({
        response: { status: 403 },
      });
    });

    test('OA-ORD-050 | Restored vendor session loads Orders', async ({ page }) => {
      await establishSession(page, 'vendor');
      const ordersPage = new VendorOrdersPage(page);
      await ordersPage.goto();
      await ordersPage.waitForLoad();
      await expect(ordersPage.orderCardById(seed.vendor1OrderId)).toBeVisible({ timeout: 15000 });
    });

    test('OA-ORD-051 | Invalid browser token redirects to login on Orders', async ({ page }) => {
      await page.goto('/');
      await page.evaluate(() => {
        localStorage.setItem('accessToken', 'invalid-token-value');
        localStorage.setItem('refreshToken', 'invalid-refresh');
        localStorage.setItem('isAuthenticated', 'true');
        localStorage.setItem('user', JSON.stringify({ role: 'vendor', name: 'Bad Session' }));
      });
      await page.goto('/vendor/orders');
      await expect(page).toHaveURL(/\/login/, { timeout: 20000 });
    });

    test('OA-ORD-052 | Logout blocks subsequent Orders page access', async ({ page }) => {
      await establishSession(page, 'vendor');
      await page.goto('/vendor/orders');
      await logoutFlow(page);
      await page.goto('/vendor/orders');
      await expect(page).toHaveURL(/\/login/, { timeout: 15000 });
      vendorSession = await refreshVendorApiSession();
    });
  });

  test.describe('Section H — CSRF Implementation Truth', () => {
    test.beforeAll(async () => {
      vendorSession = await refreshVendorApiSession();
    });

    test('OA-ORD-053 | POST /orders without CSRF rejected', async () => {
      await clearCartApi(vendorSession);
      await addToCartApi(vendorSession, seed.product.id, 1);
      const response = await postOrdersRaw(
        {
          paymentMethod: 'COD',
          shippingAddress: buildShippingAddress(),
        },
        authBearerOnly(vendorSession)
      );
      expect(response.status).toBe(403);
    });

    test('OA-ORD-054 | GET /orders succeeds without CSRF header', async () => {
      const response = await getOrdersRaw(authBearerOnly(vendorSession));
      expect(response.status).toBe(200);
    });

    test('OA-ORD-055 | POST /orders with valid CSRF succeeds', async () => {
      clearValidationRateLimits();
      await clearCartApi(vendorSession);
      await addToCartApi(vendorSession, seed.product.id, 1);
      const response = await postOrdersRaw(
        {
          paymentMethod: 'COD',
          shippingAddress: buildShippingAddress(),
          idempotencyKey: `oa-ord-csrf-${Date.now()}`,
        },
        {
          ...authHeaders(vendorSession),
          'Idempotency-Key': `oa-ord-csrf-${Date.now()}`,
        }
      );
      expect(response.status).toBe(200);
    });

    test('OA-ORD-056 | Authenticated GET /orders may inject CSRF cookie', async () => {
      const response = await getOrdersRaw(authBearerOnly(vendorSession));
      expect(response.status).toBe(200);
      const setCookie = response.headers['set-cookie'];
      if (setCookie) {
        const cookieText = Array.isArray(setCookie) ? setCookie.join(';') : String(setCookie);
        expect(cookieText.toLowerCase()).toMatch(/csrf/i);
      }
    });
  });

  test.describe('Section I — Invoice Authorization', () => {
    test('OA-ORD-057 | Owner can download invoice via /orders/:id/invoice', async () => {
      const response = await getOrderInvoiceRaw(
        seed.vendor1OrderId,
        authBearerOnly(vendorSession)
      );
      expect(response.status).toBe(200);
      const bytes = Buffer.from(response.data as ArrayBuffer);
      expect(bytes.subarray(0, 4).toString()).toBe('%PDF');
    });

    test('OA-ORD-058 | Cross-user GET /invoices/:orderId denied', async () => {
      // Ensure invoice record exists via owner download path.
      await getOrderInvoiceRaw(seed.vendor1OrderId, authBearerOnly(vendorSession));
      const response = await getInvoiceByOrderIdRaw(
        seed.vendor1OrderId,
        authBearerOnly(vendor2Session)
      );
      expect(response.status).toBe(403);
    });

    test('OA-ORD-059 | Cross-user POST /invoices/:orderId denied', async () => {
      const response = await postGenerateInvoiceRaw(
        seed.vendor1OrderId,
        authHeaders(vendor2Session)
      );
      expect(response.status).toBe(403);
    });

    test('OA-ORD-060 | Admin can download any order invoice', async () => {
      const adminSession = await loginApi(
        getAdminCredentials().mobile,
        getAdminCredentials().password
      );
      const response = await getOrderInvoiceRaw(
        seed.vendor1OrderId,
        authBearerOnly(adminSession)
      );
      expect(response.status).toBe(200);
    });
  });

  test.describe('Section J — RBAC Source Truth', () => {
    test('OA-ORD-061 | Order routes use protect middleware', async () => {
      const routesSource = readBackendFile('src/modules/order/order.routes.js');
      expect(routesSource).toMatch(/protect/);
    });

    test('OA-ORD-062 | Status route authorizes ADMIN and SUPER_ADMIN only', async () => {
      const routesSource = readBackendFile('src/modules/order/order.routes.js');
      expect(routesSource).toMatch(/authorize\(\s*['"]ADMIN['"]\s*,\s*['"]SUPER_ADMIN['"]\s*\)/);
    });

    test('OA-ORD-063 | State-changing order routes use csrfProtection', async () => {
      const routesSource = readBackendFile('src/modules/order/order.routes.js');
      expect(routesSource).toMatch(/csrfProtection/);
      expect(routesSource).toMatch(/router\.post\(\s*['"]\/['"]\s*,\s*protect[\s\S]*csrfProtection/);
    });

    test('OA-ORD-064 | Orders mount uses authenticate + injectCsrfToken', async () => {
      const v1Source = readBackendFile('src/routes/v1.routes.js');
      expect(v1Source).toMatch(
        /router\.use\(\s*['"]\/orders['"]\s*,\s*authenticate\s*,\s*injectCsrfToken\s*,\s*orderRoutes\s*\)/
      );
    });
  });

  test.describe('Section K — Client Session & Deep Links', () => {
    test('OA-ORD-065 | Guest blocked from vendor products', async ({ page }) => {
      await page.goto('/vendor/products');
      await expect(page).toHaveURL(/\/login/);
    });

    test('OA-ORD-066 | Direct Orders URL after logout redirects', async ({ page }) => {
      await establishSession(page, 'vendor');
      await page.goto('/vendor/dashboard');
      await logoutFlow(page);
      await page.goto('/vendor/orders');
      await expect(page).toHaveURL(/\/login/, { timeout: 15000 });
      vendorSession = await refreshVendorApiSession();
    });

    test('OA-ORD-067 | Direct Order Details URL after logout redirects', async ({ page }) => {
      await establishSession(page, 'vendor');
      await page.goto('/vendor/dashboard');
      await logoutFlow(page);
      await page.goto(`/vendor/orders/${seed.vendor1OrderId}`);
      await expect(page).toHaveURL(/\/login/, { timeout: 15000 });
      vendorSession = await refreshVendorApiSession();
    });

    test('OA-ORD-068 | Login lands on dashboard not Orders', async ({ page }) => {
      const creds = getVendorCredentials(1);
      const loginPage = new LoginPage(page);
      await loginPage.goto();
      await loginPage.fillMobile(creds.mobile);
      await loginPage.fillPassword(creds.password);
      await loginPage.submit();
      await expect(page).toHaveURL(/\/vendor\/dashboard/, { timeout: 20000 });
    });

    test('OA-ORD-069 | Vendor Order Details deep-link loads for owner', async ({ page }) => {
      await establishSession(page, 'vendor');
      const details = new VendorOrderDetailsPage(page);
      await details.goto(seed.vendor1OrderId);
      await details.waitForLoad();
      await expect(details.pageHeading()).toBeVisible();
    });

    test('OA-ORD-070 | Vendor Checkout empty-cart state reachable when authenticated', async ({
      page,
    }) => {
      // UI login in OA-ORD-068 replaces activeSessionId — refresh API session first.
      vendorSession = await refreshVendorApiSession();
      await clearCartApi(vendorSession);
      await establishSession(page, 'vendor');
      const checkout = new VendorCheckoutPage(page);
      await checkout.goto();
      await checkout.waitForLoad();
      await expect(checkout.emptyCartState()).toBeVisible();
    });
  });
});
