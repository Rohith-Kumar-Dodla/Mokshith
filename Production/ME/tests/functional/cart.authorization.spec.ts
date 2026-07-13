import { test, expect } from '../fixtures/product.functional.fixture';
import VendorCartPage from '../pages/vendor/VendorCartPage';
import {
  addToCartApi,
  clearCartApi,
  getCartApi,
} from '../helpers/cart.api.helper';
import {
  authBearerOnly,
  bearerOnly,
  cartContainsProduct,
  cartItemCount,
  deleteCartRaw,
  getCartRaw,
  postCartRaw,
  postOrderRaw,
  readBackendFile,
  refreshVendorApiSession,
  seedCartAuthorizationProduct,
  type AuthSeedProduct,
} from '../helpers/cart.authorization.helper';
import { buildShippingAddress } from '../helpers/cart.functional.helper';
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
import { getAdminSession, getFirstCategoryId, resolveRefId } from '../helpers/product.api.helper';
import logoutFlow from '../flows/authentication/logout.flow';
import LoginPage from '../pages/auth/LoginPage';

let seedProduct: AuthSeedProduct;
let vendorSession: ApiSession;
let vendor2Session: ApiSession;

test.describe('Cart Authorization Suite', () => {
  test.beforeAll(async () => {
    seedProduct = await seedCartAuthorizationProduct();
    const vendorCreds = getVendorCredentials(1);
    const vendor2Creds = getVendorCredentials(2);
    vendorSession = await loginApi(vendorCreds.mobile, vendorCreds.password);
    vendor2Session = await loginApi(vendor2Creds.mobile, vendor2Creds.password);
    await clearCartApi(vendorSession);
    await clearCartApi(vendor2Session);
  });

  test.describe('Section A — Frontend Route Protection', () => {
    test('PA-CART-001 | Unauthenticated blocked from cart page', async ({ page }) => {
      await page.goto('/vendor/cart');
      await expect(page).toHaveURL(/\/login/);
    });

    test('PA-CART-002 | Unauthenticated blocked from checkout', async ({ page }) => {
      await page.goto('/vendor/checkout');
      await expect(page).toHaveURL(/\/login/);
    });

    test('PA-CART-003 | Admin redirected from cart page', async ({ page }) => {
      await establishSession(page, 'admin');
      await page.goto('/vendor/cart');
      await expect(page).toHaveURL(/\/admin\/dashboard/);
    });

    test('PA-CART-004 | SuperAdmin redirected from cart page', async ({ page }) => {
      await establishSession(page, 'superadmin');
      await page.goto('/vendor/cart');
      await expect(page).toHaveURL(/\/super-admin\/dashboard/);
    });

    test('PA-CART-005 | Delivery redirected from cart page', async ({ page }) => {
      await establishSession(page, 'delivery');
      await page.goto('/vendor/cart');
      await expect(page).toHaveURL(/\/delivery\/dashboard/);
    });

    test('PA-CART-006 | Vendor granted cart page', async ({ page }) => {
      await establishSession(page, 'vendor');
      const cartPage = new VendorCartPage(page);
      await cartPage.goto();
      await cartPage.waitForLoad();
      await expect(cartPage.pageHeading()).toBeVisible();
    });

    test('PA-CART-007 | B2B customer granted vendor cart', async ({ page }) => {
      await establishSession(page, 'customer');
      const cartPage = new VendorCartPage(page);
      await cartPage.goto();
      await cartPage.waitForLoad();
      await expect(cartPage.pageHeading()).toBeVisible();
    });

    test('PA-CART-008 | Unauthenticated blocked from order success', async ({ page }) => {
      await page.goto('/vendor/order-success');
      await expect(page).toHaveURL(/\/login/);
    });
  });

  test.describe('Section B — Hidden UI & Navigation', () => {
    test('PA-CART-009 | Admin sidebar has no cart link', async ({ page }) => {
      await establishSession(page, 'admin');
      await page.goto('/admin/dashboard');
      await expect(page.getByRole('link', { name: /^Cart$/ })).toHaveCount(0);
      await expect(page.locator('a[href="/vendor/cart"]')).toHaveCount(0);
    });

    test('PA-CART-010 | Delivery sidebar has no cart link', async ({ page }) => {
      await establishSession(page, 'delivery');
      await page.goto('/delivery/dashboard');
      await expect(page.getByRole('link', { name: /^Cart$/ })).toHaveCount(0);
      await expect(page.locator('a[href="/vendor/cart"]')).toHaveCount(0);
    });

    test('PA-CART-011 | SuperAdmin sidebar has no cart link', async ({ page }) => {
      await establishSession(page, 'superadmin');
      await page.goto('/super-admin/dashboard');
      await expect(page.getByRole('link', { name: /^Cart$/ })).toHaveCount(0);
      await expect(page.locator('a[href="/vendor/cart"]')).toHaveCount(0);
    });

    test('PA-CART-012 | Guest public navbar has no cart link', async ({ page }) => {
      await page.goto('/');
      await expect(page.locator('a[href="/vendor/cart"]')).toHaveCount(0);
      await expect(page.getByRole('link', { name: /^Cart$/ })).toHaveCount(0);
    });

    test('PA-CART-013 | Vendor sidebar cart link visible', async ({ page }) => {
      await establishSession(page, 'vendor');
      await page.goto('/vendor/dashboard');
      await expect(
        page.getByLabel('Main navigation').getByRole('link', { name: /^Cart$/ })
      ).toBeVisible();
    });

    test('PA-CART-014 | Vendor header cart badge visible', async ({ page }) => {
      await clearCartApi(vendorSession);
      await addToCartApi(vendorSession, seedProduct.id, 1);
      await establishSession(page, 'vendor');
      await page.goto('/vendor/products');
      await expect(page.locator('a[aria-label="Cart"]')).toBeVisible();
      await expect(page.locator('a[aria-label="Cart"] span')).toHaveText('1', { timeout: 15000 });
    });
  });

  test.describe('Section C — Unauthenticated API Access', () => {
    test('PA-CART-015 | GET cart without token returns 401', async () => {
      const response = await getCartRaw();
      expect(response.status).toBe(401);
    });

    test('PA-CART-016 | POST cart without token returns 401', async () => {
      const response = await postCartRaw({ productId: seedProduct.id, quantity: 1 });
      expect(response.status).toBe(401);
    });

    test('PA-CART-017 | DELETE cart without token returns 401', async () => {
      const response = await deleteCartRaw(seedProduct.id);
      expect(response.status).toBe(401);
    });

    test('PA-CART-018 | GET cart with malformed token returns 401', async () => {
      const response = await getCartRaw(bearerOnly('not-a-jwt'));
      expect(response.status).toBe(401);
    });

    test('PA-CART-019 | GET cart with expired token returns 401', async () => {
      const payload = decodeJwtPayload(vendorSession.accessToken);
      const expired = signTestJwt(
        {
          id: payload.id,
          role: payload.role,
          sessionId: payload.sessionId,
        },
        { expired: true }
      );
      const response = await getCartRaw(bearerOnly(expired));
      expect(response.status).toBe(401);
    });

    test('PA-CART-020 | GET cart with literal null token returns 401', async () => {
      const response = await getCartRaw(bearerOnly('null'));
      expect(response.status).toBe(401);
    });
  });

  test.describe('Section D — Token Security', () => {
    test('PA-CART-021 | Tampered JWT rejected on cart POST', async () => {
      const tampered = tamperTokenSignature(vendorSession.accessToken);
      const response = await postCartRaw(
        { productId: seedProduct.id, quantity: 1 },
        bearerOnly(tampered)
      );
      expect(response.status).toBe(401);
    });

    test('PA-CART-022 | Missing Authorization header rejected', async () => {
      await expectApiStatus(() => apiClient.get('/cart'), 401);
    });

    test('PA-CART-023 | Session-replaced token rejected on cart GET', async () => {
      const creds = getVendorCredentials(1);
      const first = await loginApiFresh(creds.mobile, creds.password);
      await loginApiFresh(creds.mobile, creds.password);
      const response = await getCartRaw(bearerOnly(first.accessToken));
      expect(response.status).toBe(401);
      vendorSession = await refreshVendorApiSession();
    });

    test('PA-CART-024 | Token without sessionId rejected when active session exists', async () => {
      const payload = decodeJwtPayload(vendorSession.accessToken);
      const noSession = signTestJwt({ id: payload.id, role: payload.role });
      const response = await getCartRaw(bearerOnly(noSession));
      expect(response.status).toBe(401);
    });

    test('PA-CART-025 | Escalated JWT cannot read another user cart', async () => {
      await clearCartApi(vendorSession);
      await clearCartApi(vendor2Session);
      await addToCartApi(vendorSession, seedProduct.id, 2);
      const escalated = signEscalatedRoleToken(vendor2Session.accessToken, 'SUPER_ADMIN');
      const victimCart = await getCartApi(vendorSession);
      const attackerCartResponse = await getCartRaw(bearerOnly(escalated));
      expect(attackerCartResponse.status).toBe(200);
      const attackerCart = attackerCartResponse.data?.data ?? attackerCartResponse.data;
      expect(cartContainsProduct(victimCart, seedProduct.id)).toBe(true);
      expect(cartContainsProduct(attackerCart, seedProduct.id)).toBe(false);
    });

    test('PA-CART-026 | Deleted user token rejected', async () => {
      const fakeUserId = '000000000000000000000099';
      const ghostToken = signTestJwt({ id: fakeUserId, role: 'VENDOR' });
      const response = await getCartRaw(bearerOnly(ghostToken));
      expect(response.status).toBe(401);
    });
  });

  test.describe('Section E — Cart Ownership & Isolation', () => {
    test('PA-CART-027 | User A cart not visible to User B', async () => {
      await clearCartApi(vendorSession);
      await clearCartApi(vendor2Session);
      await addToCartApi(vendorSession, seedProduct.id, 1);
      const vendor2Cart = await getCartApi(vendor2Session);
      expect(cartContainsProduct(vendor2Cart, seedProduct.id)).toBe(false);
    });

    test('PA-CART-028 | DELETE only affects caller cart', async () => {
      await clearCartApi(vendorSession);
      await clearCartApi(vendor2Session);
      await addToCartApi(vendorSession, seedProduct.id, 1);
      const deleteResponse = await deleteCartRaw(seedProduct.id, authBearerOnly(vendor2Session));
      expect([200, 404]).toContain(deleteResponse.status);
      const vendor1Cart = await getCartApi(vendorSession);
      expect(cartContainsProduct(vendor1Cart, seedProduct.id)).toBe(true);
    });

    test('PA-CART-029 | POST add creates independent cart documents', async () => {
      await clearCartApi(vendorSession);
      await clearCartApi(vendor2Session);
      await addToCartApi(vendorSession, seedProduct.id, 1);
      await addToCartApi(vendor2Session, seedProduct.id, 3);
      const cart1 = await getCartApi(vendorSession);
      const cart2 = await getCartApi(vendor2Session);
      expect(cartContainsProduct(cart1, seedProduct.id)).toBe(true);
      expect(cartContainsProduct(cart2, seedProduct.id)).toBe(true);
      const line1 = cart1?.items?.find((item) => resolveRefId(item.productId) === seedProduct.id);
      const line2 = cart2?.items?.find((item) => resolveRefId(item.productId) === seedProduct.id);
      expect(line1?.quantity).toBe(1);
      expect(line2?.quantity).toBe(3);
    });

    test('PA-CART-030 | No cross-user cart route exists', async () => {
      const otherUserId = String(vendor2Session.user._id || vendor2Session.user.id);
      const response = await apiClient.get(`/cart/${otherUserId}`, {
        headers: authHeaders(vendorSession),
        validateStatus: () => true,
      });
      expect(response.status).toBe(404);
    });

    test('PA-CART-031 | Admin GET returns admin own cart not vendor cart', async () => {
      await clearCartApi(vendorSession);
      await addToCartApi(vendorSession, seedProduct.id, 1);
      const adminSession = await loginApi(
        getAdminCredentials().mobile,
        getAdminCredentials().password
      );
      const adminCart = await getCartApi(adminSession);
      expect(cartContainsProduct(adminCart, seedProduct.id)).toBe(false);
    });
  });

  test.describe('Section F — Role API Access', () => {
    test('PA-CART-032 | Vendor GET own cart succeeds', async () => {
      const response = await getCartRaw(authBearerOnly(vendorSession));
      expect(response.status).toBe(200);
    });

    test('PA-CART-033 | Admin GET own cart succeeds', async () => {
      const adminSession = await loginApi(
        getAdminCredentials().mobile,
        getAdminCredentials().password
      );
      const response = await getCartRaw(authBearerOnly(adminSession));
      expect(response.status).toBe(200);
    });

    test('PA-CART-034 | SuperAdmin GET own cart succeeds', async () => {
      const superSession = await loginApi(
        getSuperAdminCredentials().mobile,
        getSuperAdminCredentials().password
      );
      const response = await getCartRaw(authBearerOnly(superSession));
      expect(response.status).toBe(200);
    });

    test('PA-CART-035 | Delivery GET own cart succeeds', async () => {
      const deliverySession = await loginApi(
        getDeliveryCredentials().mobile,
        getDeliveryCredentials().password
      );
      const response = await getCartRaw(authBearerOnly(deliverySession));
      expect(response.status).toBe(200);
    });

    test('PA-CART-036 | B2B customer POST add succeeds', async () => {
      const customerSession = await loginApi(
        getCustomerCredentials().mobile,
        getCustomerCredentials().password
      );
      await clearCartApi(customerSession);
      const response = await postCartRaw(
        { productId: seedProduct.id, quantity: 1 },
        authBearerOnly(customerSession)
      );
      expect(response.status).toBe(200);
      await clearCartApi(customerSession);
    });

    test('PA-CART-037 | Admin POST add succeeds on own cart', async () => {
      const adminSession = await loginApi(
        getAdminCredentials().mobile,
        getAdminCredentials().password
      );
      await clearCartApi(adminSession);
      const response = await postCartRaw(
        { productId: seedProduct.id, quantity: 1 },
        authBearerOnly(adminSession)
      );
      expect(response.status).toBe(200);
      await clearCartApi(adminSession);
    });

    test('PA-CART-038 | No super-admin cart list endpoint', async () => {
      const superSession = await loginApi(
        getSuperAdminCredentials().mobile,
        getSuperAdminCredentials().password
      );
      const response = await apiClient.get('/super-admin/carts', {
        headers: authHeaders(superSession),
        validateStatus: () => true,
      });
      expect(response.status).toBe(404);
    });

    test('PA-CART-039 | Vendor blocked from admin products UI', async ({ page }) => {
      await establishSession(page, 'vendor');
      await page.goto('/admin/products');
      await expect(page).toHaveURL(/\/vendor\/dashboard/);
    });
  });

  test.describe('Section G — Account Status & Session', () => {
    test('PA-CART-040 | Inactive account cart GET returns 403', async () => {
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
      const response = await getCartRaw(bearerOnly(inactiveToken));
      expect(response.status).toBe(403);
    });

    test('PA-CART-041 | Inactive account blocked from cart UI login', async () => {
      const creds = getInactiveVendorCredentials();
      await expect(loginApiFresh(creds.mobile, creds.password)).rejects.toMatchObject({
        response: { status: 403 },
      });
    });

    test('PA-CART-042 | SuperAdmin cart GET succeeds while active', async () => {
      const superSession = await loginApi(
        getSuperAdminCredentials().mobile,
        getSuperAdminCredentials().password
      );
      const response = await getCartRaw(authBearerOnly(superSession));
      expect(response.status).toBe(200);
    });

    test('PA-CART-043 | Restored vendor session loads cart', async ({ page }) => {
      await clearCartApi(vendorSession);
      await addToCartApi(vendorSession, seedProduct.id, 1);
      await establishSession(page, 'vendor');
      const cartPage = new VendorCartPage(page);
      await cartPage.goto();
      await cartPage.waitForLoad();
      await expect(cartPage.productTitle(seedProduct.name)).toBeVisible({ timeout: 15000 });
    });

    test('PA-CART-044 | Invalid browser token redirects to login on cart load', async ({ page }) => {
      await page.goto('/');
      await page.evaluate(() => {
        localStorage.setItem('accessToken', 'invalid-token-value');
        localStorage.setItem('refreshToken', 'invalid-refresh');
        localStorage.setItem('isAuthenticated', 'true');
        localStorage.setItem('user', JSON.stringify({ role: 'vendor', name: 'Bad Session' }));
      });
      await page.goto('/vendor/cart');
      await expect(page).toHaveURL(/\/login/, { timeout: 20000 });
    });

    test('PA-CART-045 | Logout blocks subsequent cart page access', async ({ page }) => {
      await establishSession(page, 'vendor');
      await page.goto('/vendor/cart');
      await logoutFlow(page);
      await page.goto('/vendor/cart');
      await expect(page).toHaveURL(/\/login/, { timeout: 15000 });
      vendorSession = await refreshVendorApiSession();
    });
  });

  test.describe('Section H — CSRF Implementation Truth', () => {
    test.beforeAll(async () => {
      vendorSession = await refreshVendorApiSession();
    });
    test('PA-CART-046 | POST cart succeeds without CSRF header', async () => {
      await clearCartApi(vendorSession);
      const response = await postCartRaw(
        { productId: seedProduct.id, quantity: 1 },
        authBearerOnly(vendorSession)
      );
      expect(response.status).toBe(200);
    });

    test('PA-CART-047 | DELETE cart succeeds without CSRF header', async () => {
      await clearCartApi(vendorSession);
      await addToCartApi(vendorSession, seedProduct.id, 1);
      const response = await deleteCartRaw(seedProduct.id, authBearerOnly(vendorSession));
      expect(response.status).toBe(200);
    });

    test('PA-CART-048 | POST orders without CSRF rejected', async () => {
      await clearCartApi(vendorSession);
      await addToCartApi(vendorSession, seedProduct.id, 1);
      const response = await postOrderRaw(
        {
          paymentMethod: 'COD',
          shippingAddress: buildShippingAddress(),
        },
        authBearerOnly(vendorSession)
      );
      expect(response.status).toBe(403);
    });

    test('PA-CART-049 | Authenticated cart GET may inject CSRF cookie', async () => {
      const response = await getCartRaw(authBearerOnly(vendorSession));
      expect(response.status).toBe(200);
      const setCookie = response.headers['set-cookie'];
      if (setCookie) {
        const cookieText = Array.isArray(setCookie) ? setCookie.join(';') : String(setCookie);
        expect(cookieText.toLowerCase()).toMatch(/csrf/i);
      }
    });
  });

  test.describe('Section I — Checkout & Order Authorization', () => {
    test('PA-CART-050 | Vendor can access checkout UI with items', async ({ page }) => {
      await clearCartApi(vendorSession);
      await addToCartApi(vendorSession, seedProduct.id, 1);
      await establishSession(page, 'vendor');
      await page.goto('/vendor/checkout');
      await expect(page.getByText('Delivery Address').or(page.getByText(/checkout/i)).first()).toBeVisible({
        timeout: 15000,
      });
    });

    test('PA-CART-051 | Admin blocked from checkout UI', async ({ page }) => {
      await establishSession(page, 'admin');
      await page.goto('/vendor/checkout');
      await expect(page).toHaveURL(/\/admin\/dashboard/);
    });

    test('PA-CART-052 | POST orders without token returns 401', async () => {
      const response = await postOrderRaw({
        paymentMethod: 'COD',
        shippingAddress: buildShippingAddress(),
      });
      expect(response.status).toBe(401);
    });

    test('PA-CART-053 | Order uses authenticated user cart only', async () => {
      await clearCartApi(vendorSession);
      await clearCartApi(vendor2Session);
      await addToCartApi(vendorSession, seedProduct.id, 1);
      const response = await postOrderRaw(
        {
          paymentMethod: 'COD',
          shippingAddress: buildShippingAddress(),
        },
        {
          ...authHeaders(vendor2Session),
          'Idempotency-Key': `pa-cart-order-${Date.now()}`,
        }
      );
      expect([400, 403]).toContain(response.status);
      const vendor1Cart = await getCartApi(vendorSession);
      expect(cartItemCount(vendor1Cart)).toBeGreaterThan(0);
    });

    test('PA-CART-054 | Checkout route accessible with empty cart', async ({ page }) => {
      await clearCartApi(vendorSession);
      await establishSession(page, 'vendor');
      await page.goto('/vendor/checkout');
      await expect(page.getByText('Your cart is empty')).toBeVisible({ timeout: 15000 });
    });

    test('PA-CART-055 | Delivery blocked from checkout UI', async ({ page }) => {
      await establishSession(page, 'delivery');
      await page.goto('/vendor/checkout');
      await expect(page).toHaveURL(/\/delivery\/dashboard/);
    });
  });

  test.describe('Section J — RBAC & Permission Inheritance', () => {
    test('PA-CART-056 | No cart permissions in permissions constant', async () => {
      const permissionsSource = readBackendFile('src/constants/permissions.js');
      expect(permissionsSource).not.toMatch(/CART_/);
    });

    test('PA-CART-057 | Cart routes skip permission middleware', async () => {
      const routesSource = readBackendFile('src/modules/cart/cart.routes.js');
      expect(routesSource).not.toMatch(/requirePermission/);
      expect(routesSource).toMatch(/protect/);
    });

    test('PA-CART-058 | Cart routes skip role authorize middleware', async () => {
      const routesSource = readBackendFile('src/modules/cart/cart.routes.js');
      expect(routesSource).not.toMatch(/authorize\(/);
    });

    test('PA-CART-059 | Cart item quota middleware not wired', async () => {
      const permissionMiddleware = readBackendFile('src/middlewares/permission.middleware.js');
      expect(permissionMiddleware).toMatch(/cart_items/);
      const routesSource = readBackendFile('src/modules/cart/cart.routes.js');
      expect(routesSource).not.toMatch(/checkResourceQuota/);
    });
  });

  test.describe('Section K — Client Session & Logout', () => {
    test('PA-CART-060 | Guest blocked from vendor products', async ({ page }) => {
      await page.goto('/vendor/products');
      await expect(page).toHaveURL(/\/login/);
    });

    test('PA-CART-061 | Direct cart URL after logout redirects', async ({ page }) => {
      await establishSession(page, 'vendor');
      await page.goto('/vendor/dashboard');
      await logoutFlow(page);
      await page.goto('/vendor/cart');
      await expect(page).toHaveURL(/\/login/, { timeout: 15000 });
      vendorSession = await refreshVendorApiSession();
    });

    test('PA-CART-062 | Cart API without auth returns 401', async () => {
      const response = await getCartRaw();
      expect(response.status).toBe(401);
    });

    test('PA-CART-063 | Login lands on dashboard not cart', async ({ page }) => {
      const creds = getVendorCredentials(1);
      const loginPage = new LoginPage(page);
      await loginPage.goto();
      await loginPage.fillMobile(creds.mobile);
      await loginPage.fillPassword(creds.password);
      await loginPage.submit();
      await expect(page).toHaveURL(/\/vendor\/dashboard/, { timeout: 20000 });
    });
  });

  test.describe('Section L — Maintenance Mode', () => {
    test('PA-CART-064 | Maintenance mode blocks vendor cart API', async () => {
      test.skip(
        true,
        'Platform maintenanceMode toggle not exposed in QA Playwright harness'
      );
    });

    test('PA-CART-065 | SuperAdmin bypasses maintenance for cart API', async () => {
      test.skip(
        true,
        'Platform maintenanceMode toggle not exposed in QA Playwright harness'
      );
    });
  });
});
