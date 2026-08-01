import { test, expect } from '../fixtures/product.functional.fixture';
import VendorWishlistPage from '../pages/vendor/VendorWishlistPage';
import {
  addToWishlistApi,
  ensureEmptyWishlist,
} from '../helpers/wishlist.api.helper';
import {
  authBearerOnly,
  bearerOnly,
  clearWishlistRaw,
  deleteWishlistItemRaw,
  getWishlistApi,
  getWishlistRaw,
  postWishlistRaw,
  readBackendFile,
  refreshVendorApiSession,
  seedWishlistAuthorizationProduct,
  wishlistContainsProduct,
  wishlistItemCount,
  type AuthSeedProduct,
} from '../helpers/wishlist.authorization.helper';
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
import LoginPage from '../pages/auth/LoginPage';

let seedProduct: AuthSeedProduct;
let vendorSession: ApiSession;
let vendor2Session: ApiSession;

test.describe('Wishlist Authorization Suite', () => {
  test.beforeAll(async () => {
    seedProduct = await seedWishlistAuthorizationProduct();
    const vendorCreds = getVendorCredentials(1);
    const vendor2Creds = getVendorCredentials(2);
    vendorSession = await loginApi(vendorCreds.mobile, vendorCreds.password);
    vendor2Session = await loginApi(vendor2Creds.mobile, vendor2Creds.password);
    await ensureEmptyWishlist(vendorSession);
    await ensureEmptyWishlist(vendor2Session);
  });

  test.describe('Section A — Frontend Route Protection', () => {
    test('WA-WL-001 | Unauthenticated blocked from wishlist page', async ({ page }) => {
      await page.goto('/vendor/wishlist');
      await expect(page).toHaveURL(/\/login/);
    });

    test('WA-WL-002 | Admin redirected from wishlist page', async ({ page }) => {
      await establishSession(page, 'admin');
      await page.goto('/vendor/wishlist');
      await expect(page).toHaveURL(/\/admin\/dashboard/);
    });

    test('WA-WL-003 | SuperAdmin redirected from wishlist page', async ({ page }) => {
      await establishSession(page, 'superadmin');
      await page.goto('/vendor/wishlist');
      await expect(page).toHaveURL(/\/super-admin\/dashboard/);
    });

    test('WA-WL-004 | Delivery redirected from wishlist page', async ({ page }) => {
      await establishSession(page, 'delivery');
      await page.goto('/vendor/wishlist');
      await expect(page).toHaveURL(/\/delivery\/dashboard/);
    });

    test('WA-WL-005 | Vendor granted wishlist page', async ({ page }) => {
      await establishSession(page, 'vendor');
      const wishlistPage = new VendorWishlistPage(page);
      await wishlistPage.goto();
      await wishlistPage.waitForLoad();
      await expect(wishlistPage.pageHeading()).toBeVisible();
    });

    test('WA-WL-006 | B2B customer granted vendor wishlist', async ({ page }) => {
      await establishSession(page, 'customer');
      const wishlistPage = new VendorWishlistPage(page);
      await wishlistPage.goto();
      await wishlistPage.waitForLoad();
      await expect(wishlistPage.pageHeading()).toBeVisible();
    });
  });

  test.describe('Section B — Hidden UI & Navigation', () => {
    test('WA-WL-007 | Admin sidebar has no wishlist link', async ({ page }) => {
      await establishSession(page, 'admin');
      await page.goto('/admin/dashboard');
      await expect(page.getByRole('link', { name: /^Wishlist$/ })).toHaveCount(0);
      await expect(page.locator('a[href="/vendor/wishlist"]')).toHaveCount(0);
    });

    test('WA-WL-008 | Delivery sidebar has no wishlist link', async ({ page }) => {
      await establishSession(page, 'delivery');
      await page.goto('/delivery/dashboard');
      await expect(page.getByRole('link', { name: /^Wishlist$/ })).toHaveCount(0);
      await expect(page.locator('a[href="/vendor/wishlist"]')).toHaveCount(0);
    });

    test('WA-WL-009 | SuperAdmin sidebar has no wishlist link', async ({ page }) => {
      await establishSession(page, 'superadmin');
      await page.goto('/super-admin/dashboard');
      await expect(page.getByRole('link', { name: /^Wishlist$/ })).toHaveCount(0);
      await expect(page.locator('a[href="/vendor/wishlist"]')).toHaveCount(0);
    });

    test('WA-WL-010 | Guest public navbar has no wishlist link', async ({ page }) => {
      await page.goto('/');
      await expect(page.locator('a[href="/vendor/wishlist"]')).toHaveCount(0);
      await expect(page.getByRole('link', { name: /^Wishlist$/ })).toHaveCount(0);
    });

    test('WA-WL-011 | Vendor sidebar wishlist link visible', async ({ page }) => {
      await establishSession(page, 'vendor');
      await page.goto('/vendor/dashboard');
      await expect(
        page.getByLabel('Main navigation').getByRole('link', { name: /^Wishlist$/ })
      ).toBeVisible();
    });

    test('WA-WL-012 | Vendor header wishlist badge visible', async ({ page }) => {
      await ensureEmptyWishlist(vendorSession);
      await addToWishlistApi(vendorSession, seedProduct.id);
      await establishSession(page, 'vendor');
      await page.goto('/vendor/products');
      await expect(page.locator('a[aria-label="Wishlist"]')).toBeVisible();
      await expect(page.locator('a[aria-label="Wishlist"] span')).toHaveText('1', {
        timeout: 15000,
      });
    });
  });

  test.describe('Section C — Unauthenticated API Access', () => {
    test('WA-WL-013 | GET wishlist without token returns 401', async () => {
      const response = await getWishlistRaw();
      expect(response.status).toBe(401);
    });

    test('WA-WL-014 | POST wishlist/add without token returns 401', async () => {
      const response = await postWishlistRaw({ productId: seedProduct.id });
      expect(response.status).toBe(401);
    });

    test('WA-WL-015 | DELETE wishlist/remove without token returns 401', async () => {
      const response = await deleteWishlistItemRaw(seedProduct.id);
      expect(response.status).toBe(401);
    });

    test('WA-WL-016 | DELETE wishlist/clear without token returns 401', async () => {
      const response = await clearWishlistRaw();
      expect(response.status).toBe(401);
    });

    test('WA-WL-017 | GET wishlist with malformed token returns 401', async () => {
      const response = await getWishlistRaw(bearerOnly('not-a-jwt'));
      expect(response.status).toBe(401);
    });

    test('WA-WL-018 | GET wishlist with expired token returns 401', async () => {
      const payload = decodeJwtPayload(vendorSession.accessToken);
      const expired = signTestJwt(
        {
          id: payload.id,
          role: payload.role,
          sessionId: payload.sessionId,
        },
        { expired: true }
      );
      const response = await getWishlistRaw(bearerOnly(expired));
      expect(response.status).toBe(401);
    });

    test('WA-WL-019 | GET wishlist with literal null token returns 401', async () => {
      const response = await getWishlistRaw(bearerOnly('null'));
      expect(response.status).toBe(401);
    });
  });

  test.describe('Section D — Token Security', () => {
    test('WA-WL-020 | Tampered JWT rejected on wishlist POST', async () => {
      const tampered = tamperTokenSignature(vendorSession.accessToken);
      const response = await postWishlistRaw(
        { productId: seedProduct.id },
        bearerOnly(tampered)
      );
      expect(response.status).toBe(401);
    });

    test('WA-WL-021 | Missing Authorization header rejected', async () => {
      await expectApiStatus(() => apiClient.get('/wishlist'), 401);
    });

    test('WA-WL-022 | Session-replaced token rejected on wishlist GET', async () => {
      const creds = getVendorCredentials(1);
      const first = await loginApiFresh(creds.mobile, creds.password);
      await loginApiFresh(creds.mobile, creds.password);
      const response = await getWishlistRaw(bearerOnly(first.accessToken));
      expect(response.status).toBe(401);
      vendorSession = await refreshVendorApiSession();
    });

    test('WA-WL-023 | Token without sessionId rejected when active session exists', async () => {
      const payload = decodeJwtPayload(vendorSession.accessToken);
      const noSession = signTestJwt({ id: payload.id, role: payload.role });
      const response = await getWishlistRaw(bearerOnly(noSession));
      expect(response.status).toBe(401);
    });

    test('WA-WL-024 | Escalated JWT cannot read another user wishlist', async () => {
      await ensureEmptyWishlist(vendorSession);
      await ensureEmptyWishlist(vendor2Session);
      await addToWishlistApi(vendorSession, seedProduct.id);
      const escalated = signEscalatedRoleToken(vendor2Session.accessToken, 'SUPER_ADMIN');
      const victimWishlist = await getWishlistApi(vendorSession);
      const attackerResponse = await getWishlistRaw(bearerOnly(escalated));
      expect(attackerResponse.status).toBe(200);
      const attackerWishlist = attackerResponse.data?.data ?? attackerResponse.data;
      expect(wishlistContainsProduct(victimWishlist, seedProduct.id)).toBe(true);
      expect(wishlistContainsProduct(attackerWishlist, seedProduct.id)).toBe(false);
    });

    test('WA-WL-025 | Deleted user token rejected', async () => {
      const fakeUserId = '000000000000000000000099';
      const ghostToken = signTestJwt({ id: fakeUserId, role: 'VENDOR' });
      const response = await getWishlistRaw(bearerOnly(ghostToken));
      expect(response.status).toBe(401);
    });
  });

  test.describe('Section E — Wishlist Ownership & Isolation', () => {
    test('WA-WL-026 | User A wishlist not visible to User B', async () => {
      await ensureEmptyWishlist(vendorSession);
      await ensureEmptyWishlist(vendor2Session);
      await addToWishlistApi(vendorSession, seedProduct.id);
      const vendor2Wishlist = await getWishlistApi(vendor2Session);
      expect(wishlistContainsProduct(vendor2Wishlist, seedProduct.id)).toBe(false);
    });

    test('WA-WL-027 | DELETE only affects caller wishlist', async () => {
      await ensureEmptyWishlist(vendorSession);
      await ensureEmptyWishlist(vendor2Session);
      await addToWishlistApi(vendorSession, seedProduct.id);
      const deleteResponse = await deleteWishlistItemRaw(
        seedProduct.id,
        authBearerOnly(vendor2Session)
      );
      expect([200, 404]).toContain(deleteResponse.status);
      const vendor1Wishlist = await getWishlistApi(vendorSession);
      expect(wishlistContainsProduct(vendor1Wishlist, seedProduct.id)).toBe(true);
    });

    test('WA-WL-028 | POST add creates independent wishlist documents', async () => {
      await ensureEmptyWishlist(vendorSession);
      await ensureEmptyWishlist(vendor2Session);
      await addToWishlistApi(vendorSession, seedProduct.id);
      await addToWishlistApi(vendor2Session, seedProduct.id);
      const list1 = await getWishlistApi(vendorSession);
      const list2 = await getWishlistApi(vendor2Session);
      expect(wishlistContainsProduct(list1, seedProduct.id)).toBe(true);
      expect(wishlistContainsProduct(list2, seedProduct.id)).toBe(true);
      expect(wishlistItemCount(list1)).toBe(1);
      expect(wishlistItemCount(list2)).toBe(1);
    });

    test('WA-WL-029 | No cross-user wishlist route exists', async () => {
      const otherUserId = String(vendor2Session.user._id || vendor2Session.user.id);
      const response = await apiClient.get(`/wishlist/${otherUserId}`, {
        headers: authHeaders(vendorSession),
        validateStatus: () => true,
      });
      expect(response.status).toBe(404);
    });

    test('WA-WL-030 | Admin GET returns admin own wishlist not vendor wishlist', async () => {
      await ensureEmptyWishlist(vendorSession);
      await addToWishlistApi(vendorSession, seedProduct.id);
      const adminSession = await loginApi(
        getAdminCredentials().mobile,
        getAdminCredentials().password
      );
      const adminWishlist = await getWishlistApi(adminSession);
      expect(wishlistContainsProduct(adminWishlist, seedProduct.id)).toBe(false);
    });
  });

  test.describe('Section F — Role API Access', () => {
    test('WA-WL-031 | Vendor GET own wishlist succeeds', async () => {
      const response = await getWishlistRaw(authBearerOnly(vendorSession));
      expect(response.status).toBe(200);
    });

    test('WA-WL-032 | Admin GET own wishlist succeeds', async () => {
      const adminSession = await loginApi(
        getAdminCredentials().mobile,
        getAdminCredentials().password
      );
      const response = await getWishlistRaw(authBearerOnly(adminSession));
      expect(response.status).toBe(200);
    });

    test('WA-WL-033 | SuperAdmin GET own wishlist succeeds', async () => {
      const superSession = await loginApi(
        getSuperAdminCredentials().mobile,
        getSuperAdminCredentials().password
      );
      const response = await getWishlistRaw(authBearerOnly(superSession));
      expect(response.status).toBe(200);
    });

    test('WA-WL-034 | Delivery GET own wishlist succeeds', async () => {
      const deliverySession = await loginApi(
        getDeliveryCredentials().mobile,
        getDeliveryCredentials().password
      );
      const response = await getWishlistRaw(authBearerOnly(deliverySession));
      expect(response.status).toBe(200);
    });

    test('WA-WL-035 | B2B customer POST add succeeds', async () => {
      const customerSession = await loginApi(
        getCustomerCredentials().mobile,
        getCustomerCredentials().password
      );
      await ensureEmptyWishlist(customerSession);
      const response = await postWishlistRaw(
        { productId: seedProduct.id },
        authBearerOnly(customerSession)
      );
      expect(response.status).toBe(200);
      await ensureEmptyWishlist(customerSession);
    });

    test('WA-WL-036 | Admin POST add succeeds on own wishlist', async () => {
      const adminSession = await loginApi(
        getAdminCredentials().mobile,
        getAdminCredentials().password
      );
      await ensureEmptyWishlist(adminSession);
      const response = await postWishlistRaw(
        { productId: seedProduct.id },
        authBearerOnly(adminSession)
      );
      expect(response.status).toBe(200);
      await ensureEmptyWishlist(adminSession);
    });

    test('WA-WL-037 | No super-admin wishlists list endpoint', async () => {
      const superSession = await loginApi(
        getSuperAdminCredentials().mobile,
        getSuperAdminCredentials().password
      );
      const response = await apiClient.get('/super-admin/wishlists', {
        headers: authHeaders(superSession),
        validateStatus: () => true,
      });
      expect(response.status).toBe(404);
    });

    test('WA-WL-038 | Vendor blocked from admin products UI', async ({ page }) => {
      await establishSession(page, 'vendor');
      await page.goto('/admin/products');
      await expect(page).toHaveURL(/\/vendor\/dashboard/);
    });
  });

  test.describe('Section G — Account Status & Session', () => {
    test('WA-WL-039 | Inactive account wishlist GET returns 403', async () => {
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
      const response = await getWishlistRaw(bearerOnly(inactiveToken));
      expect(response.status).toBe(403);
    });

    test('WA-WL-040 | Inactive account blocked from wishlist UI login', async () => {
      const creds = getInactiveVendorCredentials();
      await expect(loginApiFresh(creds.mobile, creds.password)).rejects.toMatchObject({
        response: { status: 403 },
      });
    });

    test('WA-WL-041 | SuperAdmin wishlist GET succeeds while active', async () => {
      const superSession = await loginApi(
        getSuperAdminCredentials().mobile,
        getSuperAdminCredentials().password
      );
      const response = await getWishlistRaw(authBearerOnly(superSession));
      expect(response.status).toBe(200);
    });

    test('WA-WL-042 | Restored vendor session loads wishlist', async ({ page }) => {
      await ensureEmptyWishlist(vendorSession);
      await addToWishlistApi(vendorSession, seedProduct.id);
      await establishSession(page, 'vendor');
      const wishlistPage = new VendorWishlistPage(page);
      await wishlistPage.goto();
      await wishlistPage.waitForLoad();
      await expect(wishlistPage.productTitle(seedProduct.name)).toBeVisible({ timeout: 15000 });
    });

    test('WA-WL-043 | Invalid browser token redirects to login on wishlist load', async ({
      page,
    }) => {
      await page.goto('/');
      await page.evaluate(() => {
        localStorage.setItem('accessToken', 'invalid-token-value');
        localStorage.setItem('refreshToken', 'invalid-refresh');
        localStorage.setItem('isAuthenticated', 'true');
        localStorage.setItem('user', JSON.stringify({ role: 'vendor', name: 'Bad Session' }));
      });
      await page.goto('/vendor/wishlist');
      await expect(page).toHaveURL(/\/login/, { timeout: 20000 });
    });

    test('WA-WL-044 | Logout blocks subsequent wishlist page access', async ({ page }) => {
      await establishSession(page, 'vendor');
      await page.goto('/vendor/wishlist');
      await logoutFlow(page);
      await page.goto('/vendor/wishlist');
      await expect(page).toHaveURL(/\/login/, { timeout: 15000 });
      vendorSession = await refreshVendorApiSession();
    });
  });

  test.describe('Section H — CSRF Implementation Truth', () => {
    test.beforeAll(async () => {
      vendorSession = await refreshVendorApiSession();
    });

    test('WA-WL-045 | POST wishlist succeeds without CSRF header', async () => {
      await ensureEmptyWishlist(vendorSession);
      const response = await postWishlistRaw(
        { productId: seedProduct.id },
        authBearerOnly(vendorSession)
      );
      expect(response.status).toBe(200);
    });

    test('WA-WL-046 | DELETE wishlist item succeeds without CSRF header', async () => {
      await ensureEmptyWishlist(vendorSession);
      await addToWishlistApi(vendorSession, seedProduct.id);
      const response = await deleteWishlistItemRaw(
        seedProduct.id,
        authBearerOnly(vendorSession)
      );
      expect(response.status).toBe(200);
    });

    test('WA-WL-047 | DELETE clear succeeds without CSRF header', async () => {
      await ensureEmptyWishlist(vendorSession);
      await addToWishlistApi(vendorSession, seedProduct.id);
      const response = await clearWishlistRaw(authBearerOnly(vendorSession));
      expect(response.status).toBe(200);
    });

    test('WA-WL-048 | Authenticated wishlist GET may inject CSRF cookie', async () => {
      const response = await getWishlistRaw(authBearerOnly(vendorSession));
      expect(response.status).toBe(200);
      const setCookie = response.headers['set-cookie'];
      if (setCookie) {
        const cookieText = Array.isArray(setCookie) ? setCookie.join(';') : String(setCookie);
        expect(cookieText.toLowerCase()).toMatch(/csrf/i);
      }
    });
  });

  test.describe('Section I — Clear Authorization Isolation', () => {
    test('WA-WL-049 | Vendor can clear own wishlist', async () => {
      await ensureEmptyWishlist(vendorSession);
      await addToWishlistApi(vendorSession, seedProduct.id);
      const response = await clearWishlistRaw(authBearerOnly(vendorSession));
      expect(response.status).toBe(200);
      const wishlist = await getWishlistApi(vendorSession);
      expect(wishlistItemCount(wishlist)).toBe(0);
    });

    test('WA-WL-050 | Vendor2 clear does not empty Vendor1 wishlist', async () => {
      await ensureEmptyWishlist(vendorSession);
      await ensureEmptyWishlist(vendor2Session);
      await addToWishlistApi(vendorSession, seedProduct.id);
      await addToWishlistApi(vendor2Session, seedProduct.id);
      const clearResponse = await clearWishlistRaw(authBearerOnly(vendor2Session));
      expect(clearResponse.status).toBe(200);
      const vendor1Wishlist = await getWishlistApi(vendorSession);
      expect(wishlistContainsProduct(vendor1Wishlist, seedProduct.id)).toBe(true);
    });

    test('WA-WL-051 | Clear without token returns 401', async () => {
      const response = await clearWishlistRaw();
      expect(response.status).toBe(401);
    });
  });

  test.describe('Section J — RBAC & Permission Inheritance', () => {
    test('WA-WL-052 | No wishlist permissions in permissions constant', async () => {
      const permissionsSource = readBackendFile('src/constants/permissions.js');
      expect(permissionsSource).not.toMatch(/WISHLIST_/);
    });

    test('WA-WL-053 | Wishlist routes skip permission middleware', async () => {
      const routesSource = readBackendFile('src/modules/wishlist/wishlist.routes.js');
      expect(routesSource).not.toMatch(/requirePermission/);
      expect(routesSource).toMatch(/protect/);
    });

    test('WA-WL-054 | Wishlist routes skip role authorize middleware', async () => {
      const routesSource = readBackendFile('src/modules/wishlist/wishlist.routes.js');
      expect(routesSource).not.toMatch(/authorize\(/);
    });

    test('WA-WL-055 | Wishlist mount uses authenticate + injectCsrfToken', async () => {
      const v1Source = readBackendFile('src/routes/v1.routes.js');
      expect(v1Source).toMatch(
        /router\.use\(\s*['"]\/wishlist['"]\s*,\s*authenticate\s*,\s*injectCsrfToken\s*,\s*wishlistRoutes\s*\)/
      );
    });
  });

  test.describe('Section K — Client Session & Logout', () => {
    test('WA-WL-056 | Guest blocked from vendor products', async ({ page }) => {
      await page.goto('/vendor/products');
      await expect(page).toHaveURL(/\/login/);
    });

    test('WA-WL-057 | Direct wishlist URL after logout redirects', async ({ page }) => {
      await establishSession(page, 'vendor');
      await page.goto('/vendor/dashboard');
      await logoutFlow(page);
      await page.goto('/vendor/wishlist');
      await expect(page).toHaveURL(/\/login/, { timeout: 15000 });
      vendorSession = await refreshVendorApiSession();
    });

    test('WA-WL-058 | Wishlist API without auth returns 401', async () => {
      const response = await getWishlistRaw();
      expect(response.status).toBe(401);
    });

    test('WA-WL-059 | Login lands on dashboard not wishlist', async ({ page }) => {
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
    test('WA-WL-060 | Maintenance mode blocks vendor wishlist API', async () => {
      test.skip(
        true,
        'Platform maintenanceMode toggle not exposed in QA Playwright harness'
      );
    });

    test('WA-WL-061 | SuperAdmin bypasses maintenance for wishlist API', async () => {
      test.skip(
        true,
        'Platform maintenanceMode toggle not exposed in QA Playwright harness'
      );
    });
  });
});
