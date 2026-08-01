import { test, expect } from '../fixtures/product.functional.fixture';
import AdminInventoryPage from '../pages/admin/AdminInventoryPage';
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
import {
  addBody,
  authBearerOnly,
  bearerOnly,
  clearValidationRateLimits,
  getInventoryRaw,
  getInventoryStatsRaw,
  getLowStockRaw,
  patchInventoryUpdateRaw,
  postInventoryRaw,
  readBackendFile,
  refreshAdminApiSession,
  refreshVendorApiSession,
  seedInventoryAuthorizationData,
  updateBody,
  type InventoryAuthorizationSeed,
} from '../helpers/inventory.authorization.helper';

let seed: InventoryAuthorizationSeed;
let adminSession: ApiSession;
let vendorSession: ApiSession;

test.describe('Inventory Authorization Suite', () => {
  test.beforeAll(async () => {
    clearValidationRateLimits();
    const seeded = await seedInventoryAuthorizationData();
    adminSession = seeded.adminSession;
    seed = seeded.seed;
    const vendorCreds = getVendorCredentials(1);
    vendorSession = await loginApiFresh(vendorCreds.mobile, vendorCreds.password);
  });

  test.describe('Section A — Frontend Route Protection', () => {
    test('IA-INV-001 | Guest Inventory page redirects to login', async ({ page }) => {
      await page.goto('/admin/inventory');
      await expect(page).toHaveURL(/\/login/);
    });

    test('IA-INV-002 | Vendor redirected from Inventory page', async ({ page }) => {
      await establishSession(page, 'vendor');
      await page.goto('/admin/inventory');
      await expect(page).toHaveURL(/\/vendor\/dashboard/);
    });

    test('IA-INV-003 | SuperAdmin redirected from Inventory page', async ({ page }) => {
      await establishSession(page, 'superadmin');
      await page.goto('/admin/inventory');
      await expect(page).toHaveURL(/\/super-admin\/dashboard/);
    });

    test('IA-INV-004 | Delivery redirected from Inventory page', async ({ page }) => {
      await establishSession(page, 'delivery');
      await page.goto('/admin/inventory');
      await expect(page).toHaveURL(/\/delivery\/dashboard/);
    });

    test('IA-INV-005 | B2B customer redirected from Inventory page', async ({ page }) => {
      await establishSession(page, 'customer');
      await page.goto('/admin/inventory');
      await expect(page).toHaveURL(/\/vendor\/dashboard/);
    });

    test('IA-INV-006 | Admin granted Inventory page', async ({ page }) => {
      await establishSession(page, 'admin');
      const inventoryPage = new AdminInventoryPage(page);
      await inventoryPage.goto();
      await expect(inventoryPage.pageHeading()).toBeVisible({ timeout: 15000 });
      await inventoryPage.waitForTable();
    });

    test('IA-INV-007 | Deep-link /admin/inventory requires auth', async ({ page }) => {
      await page.goto('/admin/inventory');
      await expect(page).toHaveURL(/\/login/);
      await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();
    });
  });

  test.describe('Section B — Hidden UI & Navigation', () => {
    test('IA-INV-008 | Admin sidebar Inventory link visible', async ({ page }) => {
      await establishSession(page, 'admin');
      await page.goto('/admin/dashboard');
      await expect(
        page.getByLabel('Main navigation').getByRole('link', { name: /^Inventory$/ })
      ).toBeVisible();
    });

    test('IA-INV-009 | Vendor sidebar has no Inventory link', async ({ page }) => {
      await establishSession(page, 'vendor');
      await page.goto('/vendor/dashboard');
      await expect(page.locator('a[href="/admin/inventory"]')).toHaveCount(0);
    });

    test('IA-INV-010 | SuperAdmin sidebar has no Inventory link', async ({ page }) => {
      await establishSession(page, 'superadmin');
      await page.goto('/super-admin/dashboard');
      await expect(page.locator('a[href="/admin/inventory"]')).toHaveCount(0);
    });

    test('IA-INV-011 | Delivery sidebar has no Inventory link', async ({ page }) => {
      await establishSession(page, 'delivery');
      await page.goto('/delivery/dashboard');
      await expect(page.locator('a[href="/admin/inventory"]')).toHaveCount(0);
    });

    test('IA-INV-012 | Guest public navbar has no Inventory link', async ({ page }) => {
      await page.goto('/');
      await expect(page.locator('a[href="/admin/inventory"]')).toHaveCount(0);
    });
  });

  test.describe('Section C — Unauthenticated API Access', () => {
    test('IA-INV-013 | GET /inventory without token returns 401', async () => {
      const response = await getInventoryRaw();
      expect(response.status).toBe(401);
    });

    test('IA-INV-014 | GET /inventory/stats without token returns 401', async () => {
      const response = await getInventoryStatsRaw();
      expect(response.status).toBe(401);
    });

    test('IA-INV-015 | GET /inventory/low-stock without token returns 401', async () => {
      const response = await getLowStockRaw();
      expect(response.status).toBe(401);
    });

    test('IA-INV-016 | POST /inventory without token returns 401', async () => {
      const response = await postInventoryRaw(addBody(seed.product, 1));
      expect(response.status).toBe(401);
    });

    test('IA-INV-017 | PATCH /inventory/update without token returns 401', async () => {
      const response = await patchInventoryUpdateRaw(updateBody(seed.product, 10));
      expect(response.status).toBe(401);
    });

    test('IA-INV-018 | GET /inventory with malformed token returns 401', async () => {
      const response = await getInventoryRaw(bearerOnly('not-a-jwt'));
      expect(response.status).toBe(401);
    });

    test('IA-INV-019 | GET /inventory with expired token returns 401', async () => {
      const payload = decodeJwtPayload(vendorSession.accessToken);
      const expired = signTestJwt(
        {
          id: payload.id,
          role: payload.role,
          sessionId: payload.sessionId,
        },
        { expired: true }
      );
      const response = await getInventoryRaw(bearerOnly(expired));
      expect(response.status).toBe(401);
    });

    test('IA-INV-020 | GET /inventory with literal null token returns 401', async () => {
      const response = await getInventoryRaw(bearerOnly('null'));
      expect(response.status).toBe(401);
    });
  });

  test.describe('Section D — Token Security', () => {
    test('IA-INV-021 | Tampered JWT rejected on GET /inventory', async () => {
      const tampered = tamperTokenSignature(vendorSession.accessToken);
      const response = await getInventoryRaw(bearerOnly(tampered));
      expect(response.status).toBe(401);
    });

    test('IA-INV-022 | Missing Authorization header rejected', async () => {
      await expectApiStatus(() => apiClient.get('/inventory'), 401);
    });

    test('IA-INV-023 | Session-replaced token rejected on GET /inventory', async () => {
      const creds = getVendorCredentials(1);
      const first = await loginApiFresh(creds.mobile, creds.password);
      await loginApiFresh(creds.mobile, creds.password);
      const response = await getInventoryRaw(bearerOnly(first.accessToken));
      expect(response.status).toBe(401);
      vendorSession = await refreshVendorApiSession();
    });

    test('IA-INV-024 | Token without sessionId rejected when active session exists', async () => {
      const payload = decodeJwtPayload(vendorSession.accessToken);
      const noSession = signTestJwt({ id: payload.id, role: payload.role });
      const response = await getInventoryRaw(bearerOnly(noSession));
      expect(response.status).toBe(401);
    });

    test('IA-INV-025 | Escalated JWT role claim cannot unlock ADMIN stats', async () => {
      const escalated = signEscalatedRoleToken(vendorSession.accessToken, 'ADMIN');
      const response = await getInventoryStatsRaw(bearerOnly(escalated));
      expect(response.status).toBe(403);
    });

    test('IA-INV-026 | Escalated JWT role claim cannot unlock ADMIN POST', async () => {
      const escalated = signEscalatedRoleToken(vendorSession.accessToken, 'ADMIN');
      const response = await postInventoryRaw(addBody(seed.product, 1), bearerOnly(escalated));
      expect(response.status).toBe(403);
    });

    test('IA-INV-027 | Deleted user token rejected', async () => {
      const ghostToken = signTestJwt({ id: '000000000000000000000099', role: 'ADMIN' });
      const response = await getInventoryRaw(bearerOnly(ghostToken));
      expect(response.status).toBe(401);
    });
  });

  test.describe('Section E — Role API Access (Reads)', () => {
    test('IA-INV-028 | Vendor GET /inventory allowed', async () => {
      const response = await getInventoryRaw(authBearerOnly(vendorSession));
      expect(response.status).toBe(200);
    });

    test('IA-INV-029 | Admin GET /inventory allowed', async () => {
      const response = await getInventoryRaw(authBearerOnly(adminSession));
      expect(response.status).toBe(200);
    });

    test('IA-INV-030 | SuperAdmin GET /inventory allowed', async () => {
      const superSession = await loginApi(
        getSuperAdminCredentials().mobile,
        getSuperAdminCredentials().password
      );
      const response = await getInventoryRaw(authBearerOnly(superSession));
      expect(response.status).toBe(200);
    });

    test('IA-INV-031 | Delivery GET /inventory allowed', async () => {
      const deliverySession = await loginApi(
        getDeliveryCredentials().mobile,
        getDeliveryCredentials().password
      );
      const response = await getInventoryRaw(authBearerOnly(deliverySession));
      expect(response.status).toBe(200);
    });

    test('IA-INV-032 | B2B customer GET /inventory allowed', async () => {
      const customerSession = await loginApi(
        getCustomerCredentials().mobile,
        getCustomerCredentials().password
      );
      const response = await getInventoryRaw(authBearerOnly(customerSession));
      expect(response.status).toBe(200);
    });

    test('IA-INV-033 | Vendor GET /inventory/stats forbidden', async () => {
      const response = await getInventoryStatsRaw(authBearerOnly(vendorSession));
      expect(response.status).toBe(403);
    });

    test('IA-INV-034 | SuperAdmin GET /inventory/stats forbidden', async () => {
      const superSession = await loginApi(
        getSuperAdminCredentials().mobile,
        getSuperAdminCredentials().password
      );
      const response = await getInventoryStatsRaw(authBearerOnly(superSession));
      expect(response.status).toBe(403);
    });

    test('IA-INV-035 | Delivery GET /inventory/stats forbidden', async () => {
      const deliverySession = await loginApi(
        getDeliveryCredentials().mobile,
        getDeliveryCredentials().password
      );
      const response = await getInventoryStatsRaw(authBearerOnly(deliverySession));
      expect(response.status).toBe(403);
    });

    test('IA-INV-036 | Admin GET /inventory/stats allowed', async () => {
      const response = await getInventoryStatsRaw(authBearerOnly(adminSession));
      expect(response.status).toBe(200);
    });

    test('IA-INV-037 | Vendor GET /inventory/low-stock forbidden', async () => {
      const response = await getLowStockRaw(authBearerOnly(vendorSession));
      expect(response.status).toBe(403);
    });

    test('IA-INV-038 | SuperAdmin GET /inventory/low-stock forbidden', async () => {
      const superSession = await loginApi(
        getSuperAdminCredentials().mobile,
        getSuperAdminCredentials().password
      );
      const response = await getLowStockRaw(authBearerOnly(superSession));
      expect(response.status).toBe(403);
    });

    test('IA-INV-039 | Admin GET /inventory/low-stock allowed', async () => {
      const response = await getLowStockRaw(authBearerOnly(adminSession));
      expect(response.status).toBe(200);
    });
  });

  test.describe('Section F — Role API Access (Writes)', () => {
    test('IA-INV-040 | Vendor PATCH /inventory/update allowed', async () => {
      const response = await patchInventoryUpdateRaw(
        updateBody(seed.product, 41, 'SET'),
        authHeaders(vendorSession)
      );
      expect(response.status).toBe(200);
      seed.product.stock = 41;
    });

    test('IA-INV-041 | Admin PATCH /inventory/update allowed', async () => {
      const response = await patchInventoryUpdateRaw(
        updateBody(seed.product, 42, 'SET'),
        authHeaders(adminSession)
      );
      expect(response.status).toBe(200);
      seed.product.stock = 42;
    });

    test('IA-INV-042 | SuperAdmin PATCH /inventory/update forbidden', async () => {
      const superSession = await loginApi(
        getSuperAdminCredentials().mobile,
        getSuperAdminCredentials().password
      );
      const response = await patchInventoryUpdateRaw(
        updateBody(seed.product, 43, 'SET'),
        authHeaders(superSession)
      );
      expect(response.status).toBe(403);
    });

    test('IA-INV-043 | Delivery PATCH /inventory/update forbidden', async () => {
      const deliverySession = await loginApi(
        getDeliveryCredentials().mobile,
        getDeliveryCredentials().password
      );
      const response = await patchInventoryUpdateRaw(
        updateBody(seed.product, 43, 'SET'),
        authHeaders(deliverySession)
      );
      expect(response.status).toBe(403);
    });

    test('IA-INV-044 | B2B customer PATCH /inventory/update forbidden', async () => {
      const customerSession = await loginApi(
        getCustomerCredentials().mobile,
        getCustomerCredentials().password
      );
      const response = await patchInventoryUpdateRaw(
        updateBody(seed.product, 43, 'SET'),
        authHeaders(customerSession)
      );
      expect(response.status).toBe(403);
    });

    test('IA-INV-045 | Vendor POST /inventory forbidden', async () => {
      const response = await postInventoryRaw(addBody(seed.product, 1), authHeaders(vendorSession));
      expect(response.status).toBe(403);
    });

    test('IA-INV-046 | SuperAdmin POST /inventory forbidden', async () => {
      const superSession = await loginApi(
        getSuperAdminCredentials().mobile,
        getSuperAdminCredentials().password
      );
      const response = await postInventoryRaw(addBody(seed.product, 1), authHeaders(superSession));
      expect(response.status).toBe(403);
    });

    test('IA-INV-047 | Delivery POST /inventory forbidden', async () => {
      const deliverySession = await loginApi(
        getDeliveryCredentials().mobile,
        getDeliveryCredentials().password
      );
      const response = await postInventoryRaw(
        addBody(seed.product, 1),
        authHeaders(deliverySession)
      );
      expect(response.status).toBe(403);
    });

    test('IA-INV-048 | Admin POST /inventory allowed', async () => {
      const response = await postInventoryRaw(addBody(seed.product, 1), authHeaders(adminSession));
      expect(response.status).toBe(200);
      seed.product.stock += 1;
    });
  });

  test.describe('Section G — Warehouse Access Truth', () => {
    test('IA-INV-049 | Vendor may PATCH known product/warehouse (no ownership isolation)', async () => {
      // Production: authorize(ADMIN|VENDOR) only — no warehouse/user ownership check.
      const response = await patchInventoryUpdateRaw(
        updateBody(seed.product, 45, 'SET'),
        authHeaders(vendorSession)
      );
      expect(response.status).toBe(200);
      seed.product.stock = 45;
    });

    test('IA-INV-050 | Authenticated GET /inventory returns unscoped list (no role filter)', async () => {
      const response = await getInventoryRaw(authBearerOnly(vendorSession));
      expect(response.status).toBe(200);
      const payload = response.data as { data?: unknown } | unknown[];
      const rows = Array.isArray(payload)
        ? payload
        : Array.isArray((payload as { data?: unknown })?.data)
          ? ((payload as { data: unknown[] }).data)
          : [];
      expect(rows.length).toBeGreaterThan(0);
    });
  });

  test.describe('Section H — Account Status & Session', () => {
    test('IA-INV-051 | Inactive account GET /inventory returns 403', async () => {
      const creds = getInactiveVendorCredentials();
      const admin = await getAdminSession();
      const usersResponse = await apiClient.get('/users', {
        params: { search: creds.mobile },
        headers: authHeaders(admin),
      });
      const body = usersResponse.data?.data ?? usersResponse.data ?? {};
      const users = Array.isArray(body) ? body : body.users ?? [];
      const inactiveUser = users.find(
        (user: { mobile?: string }) => String(user.mobile) === creds.mobile
      );
      expect(inactiveUser).toBeTruthy();
      const userId = String(inactiveUser._id || inactiveUser.id);
      const inactiveToken = signTestJwt({ id: userId, role: 'VENDOR' });
      const response = await getInventoryRaw(bearerOnly(inactiveToken));
      expect(response.status).toBe(403);
    });

    test('IA-INV-052 | Inactive account blocked from login', async () => {
      const creds = getInactiveVendorCredentials();
      await expect(loginApiFresh(creds.mobile, creds.password)).rejects.toMatchObject({
        response: { status: 403 },
      });
    });

    test('IA-INV-053 | Restored admin session loads Inventory', async ({ page }) => {
      await establishSession(page, 'admin');
      const inventoryPage = new AdminInventoryPage(page);
      await inventoryPage.goto();
      await expect(inventoryPage.pageHeading()).toBeVisible({ timeout: 15000 });
    });

    test('IA-INV-054 | Invalid browser token redirects to login on Inventory', async ({ page }) => {
      await page.goto('/');
      await page.evaluate(() => {
        localStorage.setItem('accessToken', 'invalid-token-value');
        localStorage.setItem('refreshToken', 'invalid-refresh');
        localStorage.setItem('isAuthenticated', 'true');
        localStorage.setItem('user', JSON.stringify({ role: 'admin', name: 'Bad Session' }));
      });
      await page.goto('/admin/inventory');
      await expect(page).toHaveURL(/\/login/, { timeout: 20000 });
    });

    test('IA-INV-055 | Logout blocks subsequent Inventory page access', async ({ page }) => {
      await establishSession(page, 'admin');
      await page.goto('/admin/inventory');
      await logoutFlow(page);
      await page.goto('/admin/inventory');
      await expect(page).toHaveURL(/\/login/, { timeout: 15000 });
      adminSession = await refreshAdminApiSession();
    });
  });

  test.describe('Section I — CSRF Implementation Truth', () => {
    test.beforeAll(async () => {
      vendorSession = await refreshVendorApiSession();
      adminSession = await refreshAdminApiSession();
    });

    test('IA-INV-056 | PATCH /inventory/update succeeds without CSRF header', async () => {
      // Production: inventory routes use injectCsrfToken only — no csrfProtection on writes.
      const response = await patchInventoryUpdateRaw(
        updateBody(seed.product, 46, 'SET'),
        authBearerOnly(vendorSession)
      );
      expect(response.status).toBe(200);
      seed.product.stock = 46;
    });

    test('IA-INV-057 | POST /inventory succeeds without CSRF header for ADMIN', async () => {
      const response = await postInventoryRaw(addBody(seed.product, 1), authBearerOnly(adminSession));
      expect(response.status).toBe(200);
      seed.product.stock += 1;
    });

    test('IA-INV-058 | GET /inventory succeeds without CSRF header', async () => {
      const response = await getInventoryRaw(authBearerOnly(vendorSession));
      expect(response.status).toBe(200);
    });

    test('IA-INV-059 | Authenticated GET /inventory may inject CSRF cookie', async () => {
      const response = await getInventoryRaw(authBearerOnly(adminSession));
      expect(response.status).toBe(200);
      const setCookie = response.headers['set-cookie'];
      if (setCookie) {
        const cookieText = Array.isArray(setCookie) ? setCookie.join(';') : String(setCookie);
        expect(cookieText.toLowerCase()).toMatch(/csrf/i);
      }
    });
  });

  test.describe('Section J — RBAC Source Truth', () => {
    test('IA-INV-060 | Inventory routes use protect middleware', async () => {
      const routesSource = readBackendFile('src/modules/inventory/inventory.routes.js');
      expect(routesSource).toMatch(/protect/);
    });

    test('IA-INV-061 | Stats and low-stock authorize ADMIN only', async () => {
      const routesSource = readBackendFile('src/modules/inventory/inventory.routes.js');
      expect(routesSource).toMatch(/low-stock[\s\S]*authorize\('ADMIN'\)/);
      expect(routesSource).toMatch(/stats[\s\S]*authorize\('ADMIN'\)/);
    });

    test('IA-INV-062 | POST /inventory authorize ADMIN only', async () => {
      const routesSource = readBackendFile('src/modules/inventory/inventory.routes.js');
      expect(routesSource).toMatch(/router\.post\(\s*'\/'[\s\S]*authorize\('ADMIN'\)/);
    });

    test('IA-INV-063 | PATCH /update authorize ADMIN and VENDOR', async () => {
      const routesSource = readBackendFile('src/modules/inventory/inventory.routes.js');
      expect(routesSource).toMatch(/authorize\('ADMIN',\s*'VENDOR'\)/);
    });

    test('IA-INV-064 | Inventory routes do not mount csrfProtection', async () => {
      const routesSource = readBackendFile('src/modules/inventory/inventory.routes.js');
      expect(routesSource).not.toMatch(/csrfProtection/);
    });

    test('IA-INV-065 | GET /inventory has no role authorize middleware', async () => {
      const routesSource = readBackendFile('src/modules/inventory/inventory.routes.js');
      expect(routesSource).toMatch(/router\.get\('\/',\s*protect,\s*controller\.getInventory\)/);
    });
  });

  test.describe('Section K — Client Session & Deep Links', () => {
    test('IA-INV-066 | Login as admin lands on dashboard not Inventory', async ({ page }) => {
      const creds = getAdminCredentials();
      const loginPage = new LoginPage(page);
      await loginPage.goto();
      await loginPage.fillMobile(creds.mobile);
      await loginPage.fillPassword(creds.password);
      await loginPage.submit();
      await expect(page).toHaveURL(/\/admin\/dashboard/, { timeout: 20000 });
    });

    test('IA-INV-067 | Direct Inventory URL after logout redirects', async ({ page }) => {
      await establishSession(page, 'admin');
      await page.goto('/admin/inventory');
      await logoutFlow(page);
      await page.goto('/admin/inventory');
      await expect(page).toHaveURL(/\/login/, { timeout: 15000 });
    });

    test('IA-INV-068 | Guest API inventory endpoints remain 401', async () => {
      const list = await getInventoryRaw();
      const stats = await getInventoryStatsRaw();
      const patch = await patchInventoryUpdateRaw(updateBody(seed.product, 1));
      expect(list.status).toBe(401);
      expect(stats.status).toBe(401);
      expect(patch.status).toBe(401);
    });
  });
});
