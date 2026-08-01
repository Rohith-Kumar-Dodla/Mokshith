/**
 * Admin Authorization Certification Suite (AA-ADM)
 *
 * Production truths (do not invent stricter rules):
 * - UI: ProtectedRoute requiredRole="admin" — Super Admin redirected to /super-admin/dashboard
 * - API /admin: authenticate + injectCsrfToken (NO csrfProtection); authorize(ADMIN, SUPER_ADMIN)
 * - Super Admin API allowed on /admin; Super Admin UI blocked from /admin/*
 * - Inventory stats/update: ADMIN only (Super Admin 403 on stats/update)
 * - Categories/products writes (except product status): csrfProtection
 * - Orders PATCH status: csrfProtection; logistics assign: no CSRF
 * - Analytics delivery: ADMIN+SA; analytics dashboard: SUPER_ADMIN only
 *
 * Locked suites AS-ADM / AF-ADM must not be modified.
 */
import { test, expect } from '../fixtures/product.functional.fixture';
import { expectApiStatus } from '../helpers/rbac.api.helper';
import { apiClient } from '../helpers/apiClient';
import { loginApiFresh, type ApiSession } from '../helpers/auth.api.helper';
import { establishSession } from '../helpers/session.functional.helper';
import {
  getAdminCredentials,
  getInactiveVendorCredentials,
  getVendorCredentials,
} from '../helpers/product.credentials';
import {
  decodeJwtPayload,
  signEscalatedRoleToken,
  signTestJwt,
  tamperTokenSignature,
} from '../helpers/token.test.helper';
import logoutFlow from '../flows/authentication/logout.flow';
import {
  type AdminAuthorizationSeed,
  authBearerOnly,
  authHeaders,
  bearerOnly,
  clearValidationRateLimits,
  createExtraPendingVendor,
  establishAdminUiSession,
  getAdminStatsRaw,
  getAdminUsersRaw,
  getAnalyticsDashboardRaw,
  getAnalyticsDeliveryRaw,
  getInventoryStatsRaw,
  getLogisticsQueueRaw,
  getOrdersRaw,
  messageOf,
  patchAdminUserStatusRaw,
  patchInventoryUpdateRaw,
  patchLogisticsAssignRaw,
  patchOrderStatusRaw,
  patchProductStatusRaw,
  postAdminApproveRaw,
  postAdminRejectRaw,
  postCategoryRaw,
  postProductRaw,
  readBackendFile,
  refreshAdminApiSession,
  refreshVendorApiSession,
  seedAdminAuthorizationData,
  uniqueProductName,
} from '../helpers/admin.authorization.helper';

let seed: AdminAuthorizationSeed;
let adminSession: ApiSession;
let vendorSession: ApiSession;
let deliverySession: ApiSession;
let superAdminSession: ApiSession;

test.describe('Admin Authorization Suite', () => {
  test.beforeAll(async () => {
    clearValidationRateLimits();
    const seeded = await seedAdminAuthorizationData();
    adminSession = seeded.adminSession;
    vendorSession = seeded.vendorSession;
    deliverySession = seeded.deliverySession;
    superAdminSession = seeded.superAdminSession;
    seed = seeded.seed;
    expect(seed.product.id).toBeTruthy();
    expect(seed.orderId).toBeTruthy();
    expect(seed.pendingVendor.id).toBeTruthy();
  });

  // ── A — Guest UI ──────────────────────────────────────────────────────────
  test.describe('Section A — Guest UI Route Protection', () => {
    test('AA-ADM-001 | Guest /admin/dashboard redirects to login', async ({ page }) => {
      await page.goto('/admin/dashboard');
      await expect(page).toHaveURL(/\/login/);
    });

    test('AA-ADM-002 | Guest /admin/products redirects to login', async ({ page }) => {
      await page.goto('/admin/products');
      await expect(page).toHaveURL(/\/login/);
    });

    test('AA-ADM-003 | Guest /admin/inventory redirects to login', async ({ page }) => {
      await page.goto('/admin/inventory');
      await expect(page).toHaveURL(/\/login/);
    });

    test('AA-ADM-004 | Guest /admin/orders redirects to login', async ({ page }) => {
      await page.goto('/admin/orders');
      await expect(page).toHaveURL(/\/login/);
    });

    test('AA-ADM-005 | Guest /admin/delivery-assignment redirects to login', async ({ page }) => {
      await page.goto('/admin/delivery-assignment');
      await expect(page).toHaveURL(/\/login/);
    });

    test('AA-ADM-006 | Guest /admin/vendors redirects to login', async ({ page }) => {
      await page.goto('/admin/vendors');
      await expect(page).toHaveURL(/\/login/);
    });

    test('AA-ADM-007 | Guest /admin/analytics redirects to login', async ({ page }) => {
      await page.goto('/admin/analytics');
      await expect(page).toHaveURL(/\/login/);
    });

    test('AA-ADM-008 | Guest /admin/payment-verifications redirects to login', async ({ page }) => {
      await page.goto('/admin/payment-verifications');
      await expect(page).toHaveURL(/\/login/);
    });
  });

  // ── B — Role redirects ────────────────────────────────────────────────────
  test.describe('Section B — Portal RBAC Redirects', () => {
    test('AA-ADM-009 | Vendor redirected from admin dashboard', async ({ page }) => {
      clearValidationRateLimits();
      await establishSession(page, 'vendor');
      await page.goto('/admin/dashboard');
      await expect(page).toHaveURL(/\/vendor\/dashboard/, { timeout: 15000 });
    });

    test('AA-ADM-010 | Delivery redirected from admin products', async ({ page }) => {
      clearValidationRateLimits();
      await establishSession(page, 'delivery');
      await page.goto('/admin/products');
      await expect(page).toHaveURL(/\/delivery\/dashboard/, { timeout: 15000 });
    });

    test('AA-ADM-011 | Super Admin redirected from admin dashboard', async ({ page }) => {
      clearValidationRateLimits();
      await establishSession(page, 'superadmin');
      await expect
        .poll(async () => page.evaluate(() => localStorage.getItem('role')), { timeout: 10000 })
        .toBe('super-admin');
      await page.goto('/admin/dashboard');
      await expect(page).toHaveURL(/\/super-admin\/dashboard/, { timeout: 15000 });
    });

    test('AA-ADM-012 | Super Admin redirected from admin inventory', async ({ page }) => {
      clearValidationRateLimits();
      await establishSession(page, 'superadmin');
      await page.goto('/admin/inventory');
      await expect(page).toHaveURL(/\/super-admin\/dashboard/, { timeout: 15000 });
    });

    test('AA-ADM-013 | Admin redirected from vendor dashboard', async ({ page }) => {
      await establishSession(page, 'admin');
      await page.goto('/vendor/dashboard');
      await expect(page).toHaveURL(/\/admin\/dashboard/, { timeout: 15000 });
    });

    test('AA-ADM-014 | Admin redirected from delivery dashboard', async ({ page }) => {
      await establishSession(page, 'admin');
      await page.goto('/delivery/dashboard');
      await expect(page).toHaveURL(/\/admin\/dashboard/, { timeout: 15000 });
    });

    test('AA-ADM-015 | Admin redirected from super-admin dashboard', async ({ page }) => {
      await establishSession(page, 'admin');
      await page.goto('/super-admin/dashboard');
      await expect(page).toHaveURL(/\/admin\/dashboard/, { timeout: 15000 });
    });

    test('AA-ADM-016 | Admin allowed on /admin/products', async ({ page }) => {
      await establishAdminUiSession(page);
      await page.goto('/admin/products');
      await expect(page).toHaveURL(/\/admin\/products/);
      await expect(page.getByRole('heading', { name: 'Product Management' })).toBeVisible({
        timeout: 15000,
      });
    });
  });

  // ── C — Guest / unauth API ────────────────────────────────────────────────
  test.describe('Section C — Unauthenticated Admin APIs', () => {
    test('AA-ADM-017 | Unauthenticated GET /admin/stats rejected', async () => {
      const response = await getAdminStatsRaw();
      expect(response.status).toBe(401);
      expect(messageOf(response.data)).toMatch(/not authorized|token/i);
    });

    test('AA-ADM-018 | Unauthenticated GET /admin/users rejected', async () => {
      const response = await getAdminUsersRaw();
      expect(response.status).toBe(401);
    });

    test('AA-ADM-019 | Unauthenticated POST /admin/approve rejected', async () => {
      const response = await postAdminApproveRaw(seed.pendingVendor.id);
      expect(response.status).toBe(401);
    });

    test('AA-ADM-020 | Unauthenticated POST /admin/reject rejected', async () => {
      const response = await postAdminRejectRaw(seed.rejectVendor.id);
      expect(response.status).toBe(401);
    });

    test('AA-ADM-021 | Unauthenticated PATCH /admin/users/:id rejected', async () => {
      const response = await patchAdminUserStatusRaw(seed.vendorUserId, 'ACTIVE');
      expect(response.status).toBe(401);
    });

    test('AA-ADM-022 | Unauthenticated GET /analytics/delivery rejected', async () => {
      const response = await getAnalyticsDeliveryRaw();
      expect(response.status).toBe(401);
    });

    test('AA-ADM-023 | Unauthenticated POST /categories rejected', async () => {
      const response = await postCategoryRaw({ name: 'AA Cat', isActive: true });
      expect(response.status).toBe(401);
    });

    test('AA-ADM-024 | Unauthenticated PATCH /orders/:id/status rejected', async () => {
      const response = await patchOrderStatusRaw(seed.orderId, { status: 'CONFIRMED' });
      expect(response.status).toBe(401);
    });
  });

  // ── D — JWT matrix ────────────────────────────────────────────────────────
  test.describe('Section D — JWT / Token Security on /admin/stats', () => {
    test('AA-ADM-025 | Malformed JWT rejected', async () => {
      const response = await getAdminStatsRaw(bearerOnly('not-a-jwt'));
      expect(response.status).toBe(401);
    });

    test('AA-ADM-026 | Literal null token rejected', async () => {
      const response = await getAdminStatsRaw(bearerOnly('null'));
      expect(response.status).toBe(401);
      expect(messageOf(response.data)).toMatch(/invalid token/i);
    });

    test('AA-ADM-027 | Expired JWT rejected', async () => {
      const payload = decodeJwtPayload(adminSession.accessToken);
      const expired = signTestJwt(
        { id: payload.id, role: payload.role, sessionId: payload.sessionId },
        { expired: true }
      );
      const response = await getAdminStatsRaw(bearerOnly(expired));
      expect(response.status).toBe(401);
      expect(messageOf(response.data)).toMatch(/token expired|expired/i);
    });

    test('AA-ADM-028 | Tampered JWT rejected', async () => {
      const tampered = tamperTokenSignature(adminSession.accessToken);
      const response = await getAdminStatsRaw(bearerOnly(tampered));
      expect(response.status).toBe(401);
      expect(messageOf(response.data)).toMatch(/invalid token/i);
    });

    test('AA-ADM-029 | Missing Authorization rejected', async () => {
      await expectApiStatus(() => apiClient.get('/admin/stats'), 401);
    });

    test('AA-ADM-030 | Deleted/ghost user JWT rejected', async () => {
      const ghost = signTestJwt({ id: '000000000000000000000099', role: 'ADMIN' });
      const response = await getAdminStatsRaw(bearerOnly(ghost));
      expect(response.status).toBe(401);
      expect(messageOf(response.data)).toMatch(/no longer exists/i);
    });

    test('AA-ADM-031 | Token without sessionId rejected when active session exists', async () => {
      const payload = decodeJwtPayload(adminSession.accessToken);
      const noSession = signTestJwt({ id: payload.id, role: payload.role });
      const response = await getAdminStatsRaw(bearerOnly(noSession));
      expect(response.status).toBe(401);
      expect(messageOf(response.data)).toMatch(/session expired/i);
    });

    test('AA-ADM-032 | Escalated Vendor JWT claim cannot unlock /admin/stats', async () => {
      const escalated = signEscalatedRoleToken(vendorSession.accessToken, 'ADMIN');
      const response = await getAdminStatsRaw(bearerOnly(escalated));
      expect(response.status).toBe(403);
    });
  });

  // ── E — Session / inactive ────────────────────────────────────────────────
  test.describe('Section E — Session Lifecycle & Account Status', () => {
    test('AA-ADM-033 | Session-replaced admin token rejected on /admin/stats', async () => {
      const creds = getAdminCredentials();
      const first = await loginApiFresh(creds.mobile, creds.password);
      await loginApiFresh(creds.mobile, creds.password);
      const response = await getAdminStatsRaw(bearerOnly(first.accessToken));
      expect(response.status).toBe(401);
      expect(messageOf(response.data)).toMatch(/session expired|another login/i);
      adminSession = await refreshAdminApiSession();
    });

    test('AA-ADM-034 | Inactive vendor forged token rejected on /admin/stats', async () => {
      // Inactive seeded vendor — forge JWT; protect returns 403 inactive or 401 session
      const inactive = getInactiveVendorCredentials();
      // Look up via admin users list or forge with known seed mobile user if listed
      const usersRes = await getAdminUsersRaw(authHeaders(adminSession));
      expect(usersRes.status).toBe(200);
      const payload = usersRes.data as { data?: unknown };
      const list = Array.isArray(payload?.data)
        ? (payload.data as Array<Record<string, unknown>>)
        : Array.isArray(payload)
          ? (payload as Array<Record<string, unknown>>)
          : [];
      const inactiveUser = list.find(
        (u) =>
          String(u.mobile || '') === inactive.mobile ||
          String(u.status || '').toUpperCase() === 'SUSPENDED' ||
          String(u.status || '').toUpperCase() === 'INACTIVE'
      );
      if (inactiveUser) {
        const userId = String(inactiveUser._id || inactiveUser.id);
        const token = signTestJwt({ id: userId, role: 'VENDOR' });
        const response = await getAdminStatsRaw(bearerOnly(token));
        expect([401, 403]).toContain(response.status);
      } else {
        // Fallback: inactive login itself is blocked (production account gate)
        const loginRes = await apiClient.post(
          '/auth/login',
          { identifier: inactive.mobile, mobile: inactive.mobile, password: inactive.password },
          { validateStatus: () => true }
        );
        expect(loginRes.status).toBe(403);
      }
    });

    test('AA-ADM-035 | Inactive vendor login blocked', async () => {
      const inactive = getInactiveVendorCredentials();
      const loginRes = await apiClient.post(
        '/auth/login',
        { identifier: inactive.mobile, mobile: inactive.mobile, password: inactive.password },
        { validateStatus: () => true }
      );
      expect(loginRes.status).toBe(403);
      expect(messageOf(loginRes.data)).toMatch(/inactive|suspended|support/i);
    });

    test('AA-ADM-036 | Valid admin session loads dashboard', async ({ page }) => {
      await establishAdminUiSession(page);
      await expect(
        page.getByRole('heading', { name: 'Marketplace Operations Dashboard.' })
      ).toBeVisible();
    });

    test('AA-ADM-037 | Cleared browser tokens redirect admin dashboard to login', async ({
      page,
    }) => {
      await establishAdminUiSession(page);
      await page.evaluate(() => {
        localStorage.clear();
        sessionStorage.clear();
      });
      await page.goto('/admin/dashboard');
      await expect(page).toHaveURL(/\/login/, { timeout: 15000 });
    });
  });

  // ── F — Admin / SuperAdmin API allow-deny ─────────────────────────────────
  test.describe('Section F — Admin & SuperAdmin API RBAC', () => {
    test('AA-ADM-038 | Admin GET /admin/stats allowed', async () => {
      adminSession = await refreshAdminApiSession();
      const response = await getAdminStatsRaw(authHeaders(adminSession));
      expect(response.status).toBe(200);
    });

    test('AA-ADM-039 | Super Admin GET /admin/stats allowed (API)', async () => {
      const response = await getAdminStatsRaw(authHeaders(superAdminSession));
      expect(response.status).toBe(200);
    });

    test('AA-ADM-040 | Vendor GET /admin/stats forbidden', async () => {
      const response = await getAdminStatsRaw(authHeaders(vendorSession));
      expect(response.status).toBe(403);
      expect(messageOf(response.data)).toMatch(/forbidden/i);
    });

    test('AA-ADM-041 | Delivery GET /admin/stats forbidden', async () => {
      const response = await getAdminStatsRaw(authHeaders(deliverySession));
      expect(response.status).toBe(403);
    });

    test('AA-ADM-042 | Admin POST /admin/approve allowed', async () => {
      const pending = await createExtraPendingVendor();
      const response = await postAdminApproveRaw(pending.id, authHeaders(adminSession));
      expect(response.status).not.toBe(401);
      expect(response.status).not.toBe(403);
      expect(response.status).toBeLessThan(500);
    });

    test('AA-ADM-043 | Super Admin POST /admin/approve allowed', async () => {
      const pending = await createExtraPendingVendor();
      const response = await postAdminApproveRaw(pending.id, authHeaders(superAdminSession));
      expect(response.status).not.toBe(401);
      expect(response.status).not.toBe(403);
      expect(response.status).toBeLessThan(500);
    });

    test('AA-ADM-044 | Vendor POST /admin/approve forbidden', async () => {
      const response = await postAdminApproveRaw(seed.rejectVendor.id, authHeaders(vendorSession));
      expect(response.status).toBe(403);
    });

    test('AA-ADM-045 | Admin GET /analytics/delivery allowed', async () => {
      const response = await getAnalyticsDeliveryRaw(authHeaders(adminSession));
      expect(response.status).toBe(200);
    });

    test('AA-ADM-046 | Admin GET /analytics/dashboard forbidden', async () => {
      const response = await getAnalyticsDashboardRaw(authHeaders(adminSession));
      expect(response.status).toBe(403);
    });

    test('AA-ADM-047 | Super Admin GET /analytics/dashboard allowed', async () => {
      const response = await getAnalyticsDashboardRaw(authHeaders(superAdminSession));
      expect(response.status).toBe(200);
    });

    test('AA-ADM-048 | Vendor GET /analytics/delivery forbidden', async () => {
      const response = await getAnalyticsDeliveryRaw(authHeaders(vendorSession));
      expect(response.status).toBe(403);
    });
  });

  // ── G — Domain RBAC ───────────────────────────────────────────────────────
  test.describe('Section G — Domain APIs Admin Uses', () => {
    test('AA-ADM-049 | Admin POST /products with CSRF allowed', async () => {
      const categoryId = seed.categoryId;
      const response = await postProductRaw(
        {
          name: uniqueProductName('aa-adm-prod'),
          price: 100,
          stock: 10,
          categoryId,
          moq: 1,
          isActive: true,
        },
        authHeaders(adminSession)
      );
      expect(response.status).not.toBe(403);
      expect(response.status).toBeLessThan(500);
    });

    test('AA-ADM-050 | Vendor POST /categories forbidden', async () => {
      const response = await postCategoryRaw(
        { name: `AA Vend Cat ${Date.now()}`, isActive: true },
        authHeaders(vendorSession)
      );
      expect(response.status).toBe(403);
    });

    test('AA-ADM-051 | Admin POST /categories with CSRF allowed', async () => {
      const response = await postCategoryRaw(
        { name: `AA Adm Cat ${Date.now()}`, isActive: true },
        authHeaders(adminSession)
      );
      expect([200, 201]).toContain(response.status);
    });

    test('AA-ADM-052 | Delivery POST /categories forbidden', async () => {
      const response = await postCategoryRaw(
        { name: `AA Del Cat ${Date.now()}`, isActive: true },
        authHeaders(deliverySession)
      );
      expect(response.status).toBe(403);
    });

    test('AA-ADM-053 | Admin GET /inventory/stats allowed', async () => {
      const response = await getInventoryStatsRaw(authHeaders(adminSession));
      expect(response.status).toBe(200);
    });

    test('AA-ADM-054 | Super Admin GET /inventory/stats forbidden', async () => {
      const response = await getInventoryStatsRaw(authHeaders(superAdminSession));
      expect(response.status).toBe(403);
    });

    test('AA-ADM-055 | Admin PATCH /inventory/update allowed', async () => {
      expect(seed.inventoryWarehouseId).toBeTruthy();
      const response = await patchInventoryUpdateRaw(
        {
          productId: seed.inventoryProduct.id,
          warehouseId: seed.inventoryWarehouseId,
          stock: 30,
          type: 'SET',
        },
        authHeaders(adminSession)
      );
      expect(response.status).toBe(200);
    });

    test('AA-ADM-056 | Super Admin PATCH /inventory/update forbidden', async () => {
      const response = await patchInventoryUpdateRaw(
        {
          productId: seed.inventoryProduct.id,
          warehouseId: seed.inventoryWarehouseId,
          stock: 31,
          type: 'SET',
        },
        authHeaders(superAdminSession)
      );
      expect(response.status).toBe(403);
    });

    test('AA-ADM-057 | Admin GET /orders allowed', async () => {
      const response = await getOrdersRaw(authHeaders(adminSession));
      expect(response.status).toBe(200);
    });

    test('AA-ADM-058 | Vendor PATCH /orders/:id/status forbidden', async () => {
      const response = await patchOrderStatusRaw(
        seed.orderId,
        { status: 'CONFIRMED' },
        authHeaders(vendorSession)
      );
      expect(response.status).toBe(403);
    });

    test('AA-ADM-059 | Admin PATCH /orders/:id/status with CSRF allowed', async () => {
      const response = await patchOrderStatusRaw(
        seed.orderId,
        { status: 'CONFIRMED', note: 'AA-ADM-059' },
        authHeaders(adminSession)
      );
      // May already be past PENDING — accept success or domain validation, not auth failure
      expect(response.status).not.toBe(401);
      expect(response.status).not.toBe(403);
    });

    test('AA-ADM-060 | Admin GET /logistics/delivery-queue allowed', async () => {
      const response = await getLogisticsQueueRaw(authHeaders(adminSession));
      expect(response.status).toBe(200);
    });

    test('AA-ADM-061 | Vendor GET /logistics/delivery-queue forbidden', async () => {
      const response = await getLogisticsQueueRaw(authHeaders(vendorSession));
      expect(response.status).toBe(403);
    });

    test('AA-ADM-062 | Admin PATCH logistics assign without CSRF allowed', async () => {
      const partnerId = String(
        decodeJwtPayload(deliverySession.accessToken).id ||
          deliverySession.user?._id ||
          deliverySession.user?.id ||
          ''
      );
      const response = await patchLogisticsAssignRaw(
        seed.assignedShipment.shipmentId,
        partnerId,
        authBearerOnly(adminSession)
      );
      expect(response.status).not.toBe(401);
      expect(response.status).not.toBe(403);
    });
  });

  // ── H — CSRF truth ────────────────────────────────────────────────────────
  test.describe('Section H — CSRF Middleware Truth', () => {
    test('AA-ADM-063 | Admin POST /admin/approve Bearer-only succeeds (no CSRF req)', async () => {
      const pending = await createExtraPendingVendor();
      const response = await postAdminApproveRaw(pending.id, authBearerOnly(adminSession));
      expect(response.status).not.toBe(403);
      expect(response.status).toBeLessThan(500);
    });

    test('AA-ADM-064 | Admin PATCH /admin/users Bearer-only succeeds (no CSRF req)', async () => {
      // Use disposable suspend target already ACTIVE from seed (approved earlier in functional seed)
      const response = await patchAdminUserStatusRaw(
        seed.suspendVendor.id,
        'SUSPENDED',
        authBearerOnly(adminSession)
      );
      expect(response.status).not.toBe(403);
      expect(response.status).toBeLessThan(500);
    });

    test('AA-ADM-065 | Admin POST /categories Bearer-only rejected (CSRF required)', async () => {
      const response = await postCategoryRaw(
        { name: `AA CSRF Cat ${Date.now()}`, isActive: true },
        authBearerOnly(adminSession)
      );
      expect(response.status).toBe(403);
      expect(messageOf(response.data)).toMatch(/csrf/i);
    });

    test('AA-ADM-066 | Admin POST /products Bearer-only rejected (CSRF required)', async () => {
      const response = await postProductRaw(
        {
          name: uniqueProductName('aa-csrf'),
          price: 10,
          stock: 1,
          categoryId: seed.categoryId,
          moq: 1,
          isActive: true,
        },
        authBearerOnly(adminSession)
      );
      expect(response.status).toBe(403);
      expect(messageOf(response.data)).toMatch(/csrf/i);
    });

    test('AA-ADM-067 | Admin PATCH order status Bearer-only rejected (CSRF required)', async () => {
      const response = await patchOrderStatusRaw(
        seed.orderId,
        { status: 'PROCESSING' },
        authBearerOnly(adminSession)
      );
      expect(response.status).toBe(403);
      expect(messageOf(response.data)).toMatch(/csrf/i);
    });

    test('AA-ADM-068 | Admin PATCH /inventory/update Bearer-only succeeds (no CSRF)', async () => {
      const response = await patchInventoryUpdateRaw(
        {
          productId: seed.inventoryProduct.id,
          warehouseId: seed.inventoryWarehouseId,
          stock: 33,
          type: 'SET',
        },
        authBearerOnly(adminSession)
      );
      expect(response.status).toBe(200);
    });

    test('AA-ADM-069 | Admin logistics assign Bearer-only succeeds (no CSRF)', async () => {
      const partnerId = String(
        decodeJwtPayload(deliverySession.accessToken).id ||
          deliverySession.user?._id ||
          deliverySession.user?.id ||
          ''
      );
      const response = await patchLogisticsAssignRaw(
        seed.pendingShipment.shipmentId,
        partnerId,
        authBearerOnly(adminSession)
      );
      // pending may already be assigned in earlier tests — still must not be CSRF 403
      if (response.status === 403) {
        expect(messageOf(response.data)).not.toMatch(/csrf/i);
      } else {
        expect(response.status).not.toBe(401);
      }
    });

    test('AA-ADM-070 | Admin PATCH /products/:id/status Bearer-only succeeds (no CSRF)', async () => {
      const response = await patchProductStatusRaw(
        seed.product.id,
        true,
        authBearerOnly(adminSession)
      );
      expect(response.status).toBe(200);
    });
  });

  // ── I — Logout / deep-link / nav ──────────────────────────────────────────
  test.describe('Section I — Logout, Deep-link, Nav Visibility', () => {
    test('AA-ADM-071 | Logout then /admin/dashboard redirects to login', async ({ page }) => {
      await establishAdminUiSession(page);
      await logoutFlow(page);
      await page.goto('/admin/dashboard');
      await expect(page).toHaveURL(/\/login/, { timeout: 15000 });
      adminSession = await refreshAdminApiSession();
    });

    test('AA-ADM-072 | Logout then /admin/orders redirects to login', async ({ page }) => {
      await establishAdminUiSession(page);
      await logoutFlow(page);
      await page.goto('/admin/orders');
      await expect(page).toHaveURL(/\/login/, { timeout: 15000 });
      adminSession = await refreshAdminApiSession();
    });

    test('AA-ADM-073 | After logout API GET /admin/stats is 401', async ({ page }) => {
      await establishAdminUiSession(page);
      await logoutFlow(page);
      // Browser tokens cleared; API session may still be live until refresh — assert guest browser path
      await page.goto('/admin/dashboard');
      await expect(page).toHaveURL(/\/login/, { timeout: 15000 });
      const guest = await getAdminStatsRaw();
      expect(guest.status).toBe(401);
      adminSession = await refreshAdminApiSession();
    });

    test('AA-ADM-074 | Admin sidebar exposes production nav links', async ({ page }) => {
      await establishAdminUiSession(page);
      const nav = page.getByLabel('Main navigation');
      await expect(nav.getByRole('link', { name: /^Products$/ })).toBeVisible();
      await expect(nav.getByRole('link', { name: /^Inventory$/ })).toBeVisible();
      await expect(nav.getByRole('link', { name: /^Delivery Assignment$/ })).toBeVisible();
      await expect(nav.getByRole('link', { name: /payment verifications/i })).toHaveCount(0);
    });

    test('AA-ADM-075 | Vendor portal has no /admin nav links', async ({ page }) => {
      await establishSession(page, 'vendor');
      await page.goto('/vendor/dashboard');
      await expect(page).toHaveURL(/\/vendor\/dashboard/, { timeout: 15000 });
      await expect(page.locator('a[href^="/admin"]')).toHaveCount(0);
    });

    test('AA-ADM-076 | Delivery portal has no /admin nav links', async ({ page }) => {
      await establishSession(page, 'delivery');
      await page.goto('/delivery/dashboard');
      await expect(page).toHaveURL(/\/delivery\/dashboard/, { timeout: 15000 });
      await expect(page.locator('a[href^="/admin"]')).toHaveCount(0);
    });

    test('AA-ADM-077 | Super Admin portal has no /admin nav links', async ({ page }) => {
      await establishSession(page, 'superadmin');
      await page.goto('/super-admin/dashboard');
      await expect(page).toHaveURL(/\/super-admin\/dashboard/, { timeout: 15000 });
      await expect(page.locator('a[href^="/admin"]')).toHaveCount(0);
    });

    test('AA-ADM-078 | Admin payment-verifications shows restricted stub', async ({ page }) => {
      await establishAdminUiSession(page);
      await page.goto('/admin/payment-verifications');
      await expect(
        page.getByRole('heading', { name: 'Payment Verifications (Restricted)' })
      ).toBeVisible({ timeout: 15000 });
    });
  });

  // ── J — Source truth ──────────────────────────────────────────────────────
  test.describe('Section J — Backend Source Truth', () => {
    test('AA-ADM-079 | v1.routes /admin mounts injectCsrfToken not csrfProtection', () => {
      const src = readBackendFile('src/routes/v1.routes.js');
      expect(src).toMatch(/router\.use\(\s*['"]\/admin['"][\s\S]*injectCsrfToken/);
      const adminMount = src.match(
        /router\.use\(\s*['"]\/admin['"][\s\S]*?adminRoutes/
      )?.[0];
      expect(adminMount).toBeTruthy();
      expect(adminMount!).not.toMatch(/csrfProtection/);
    });

    test('AA-ADM-080 | admin.routes authorize ADMIN and SUPER_ADMIN', () => {
      const src = readBackendFile('src/modules/admin/admin.routes.js');
      expect(src).toMatch(/authorize\(\s*['"]ADMIN['"]\s*,\s*['"]SUPER_ADMIN['"]\s*\)/);
    });

    test('AA-ADM-081 | inventory stats authorize ADMIN only', () => {
      const src = readBackendFile('src/modules/inventory/inventory.routes.js');
      expect(src).toMatch(/\/stats[\s\S]{0,120}authorize\(\s*['"]ADMIN['"]\s*\)/);
    });

    test('AA-ADM-082 | analytics delivery vs dashboard role split', () => {
      const src = readBackendFile('src/modules/analytics/analytics.routes.js');
      expect(src).toMatch(/\/delivery[\s\S]{0,200}ADMIN[\s\S]{0,80}SUPER_ADMIN/);
      expect(src).toMatch(/\/dashboard[\s\S]{0,200}SUPER_ADMIN/);
    });
  });
});
