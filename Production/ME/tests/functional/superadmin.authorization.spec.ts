/**
 * Super Admin Authorization Certification Suite (SAA-SA)
 *
 * Production truths (do not invent stricter rules):
 * - UI: ProtectedRoute requiredRole="super-admin" — Admin/Vendor/Delivery redirected to role dashboards
 * - API /super-admin: authenticate + injectCsrfToken; module protect + authorize(SUPER_ADMIN) only
 * - /super-admin writes: NO csrfProtection (inject only)
 * - /admin-approvals: SUPER_ADMIN; PATCH approve/reject require csrfProtection
 * - /payments/bank-transfer pending/approve/reject: SUPER_ADMIN; approve/reject require CSRF
 * - /analytics/dashboard: SUPER_ADMIN only; /analytics/delivery: ADMIN + SUPER_ADMIN
 * - /admin API: ADMIN + SUPER_ADMIN (SA API allowed; SA UI blocked from /admin/*)
 * - Inventory stats/update: ADMIN only (SA 403)
 * - SUPER_ADMIN exempt from inactive status gate in protect/login
 *
 * Locked SS-SA / SF-SA must not be modified.
 */
import { test, expect } from '../fixtures/product.functional.fixture';
import { expectApiStatus } from '../helpers/rbac.api.helper';
import { apiClient } from '../helpers/apiClient';
import { loginApiFresh, type ApiSession } from '../helpers/auth.api.helper';
import { establishSession } from '../helpers/session.functional.helper';
import {
  getAdminCredentials,
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
import logoutFlow from '../flows/authentication/logout.flow';
import { registerPendingVendor } from '../helpers/admin.functional.helper';
import {
  type SuperAdminAuthorizationSeed,
  authBearerOnly,
  authHeaders,
  bearerOnly,
  clearValidationRateLimits,
  establishSuperAdminUiSession,
  getAdminApprovalsPendingRaw,
  getAdminStatsRaw,
  getAdminUsersRaw,
  getAnalyticsDashboardRaw,
  getAnalyticsDeliveryRaw,
  getBankTransferPendingRaw,
  getInventoryStatsRaw,
  getSuperAdminAdminsRaw,
  getSuperAdminMetricsRaw,
  getSuperAdminStatsRaw,
  getSuperAdminUsersRaw,
  messageOf,
  patchAdminApprovalApproveRaw,
  patchAdminApprovalRejectRaw,
  patchBankTransferApproveRaw,
  patchBankTransferRejectRaw,
  patchOrderStatusRaw,
  postAdminApproveRaw,
  postSuperAdminAdminRaw,
  readBackendFile,
  refreshSuperAdminApiSession,
  seedSuperAdminAuthorizationData,
  userIdFromSession,
} from '../helpers/superadmin.authorization.helper';

let seed: SuperAdminAuthorizationSeed;
let saSession: ApiSession;
let adminSession: ApiSession;
let vendorSession: ApiSession;
let deliverySession: ApiSession;

test.describe('Super Admin Authorization Suite', () => {
  test.beforeAll(async () => {
    clearValidationRateLimits();
    const seeded = await seedSuperAdminAuthorizationData();
    saSession = seeded.saSession;
    adminSession = seeded.adminSession;
    vendorSession = seeded.vendorSession;
    deliverySession = seeded.deliverySession;
    seed = seeded.seed;
    expect(seed.pendingApprovalId).toBeTruthy();
  });

  // ── A — Guest UI ──────────────────────────────────────────────────────────
  test.describe('Section A — Guest UI Route Protection', () => {
    test('SAA-SA-001 | Guest /super-admin/dashboard redirects to login', async ({ page }) => {
      await page.goto('/super-admin/dashboard');
      await expect(page).toHaveURL(/\/login/);
    });

    test('SAA-SA-002 | Guest /super-admin/user-management redirects to login', async ({
      page,
    }) => {
      await page.goto('/super-admin/user-management');
      await expect(page).toHaveURL(/\/login/);
    });

    test('SAA-SA-003 | Guest /super-admin/payment-verifications redirects to login', async ({
      page,
    }) => {
      await page.goto('/super-admin/payment-verifications');
      await expect(page).toHaveURL(/\/login/);
    });

    test('SAA-SA-004 | Guest /super-admin/analytics redirects to login', async ({ page }) => {
      await page.goto('/super-admin/analytics');
      await expect(page).toHaveURL(/\/login/);
    });

    test('SAA-SA-005 | Guest /super-admin/orders redirects to login', async ({ page }) => {
      await page.goto('/super-admin/orders');
      await expect(page).toHaveURL(/\/login/);
    });

    test('SAA-SA-006 | Guest /super-admin/settings redirects to login', async ({ page }) => {
      await page.goto('/super-admin/settings');
      await expect(page).toHaveURL(/\/login/);
    });

    test('SAA-SA-007 | Guest /super-admin/platform redirects to login', async ({ page }) => {
      await page.goto('/super-admin/platform');
      await expect(page).toHaveURL(/\/login/);
    });
  });

  // ── B — Portal RBAC ───────────────────────────────────────────────────────
  test.describe('Section B — Portal RBAC Redirects', () => {
    test('SAA-SA-008 | Vendor redirected from super-admin dashboard', async ({ page }) => {
      clearValidationRateLimits();
      await establishSession(page, 'vendor');
      await page.goto('/super-admin/dashboard');
      await expect(page).toHaveURL(/\/vendor\/dashboard/, { timeout: 15000 });
    });

    test('SAA-SA-009 | Delivery redirected from super-admin payment-verifications', async ({
      page,
    }) => {
      clearValidationRateLimits();
      await establishSession(page, 'delivery');
      await page.goto('/super-admin/payment-verifications');
      await expect(page).toHaveURL(/\/delivery\/dashboard/, { timeout: 15000 });
    });

    test('SAA-SA-010 | Admin redirected from super-admin dashboard', async ({ page }) => {
      clearValidationRateLimits();
      await establishSession(page, 'admin');
      await page.goto('/super-admin/dashboard');
      await expect(page).toHaveURL(/\/admin\/dashboard/, { timeout: 15000 });
    });

    test('SAA-SA-011 | Admin redirected from super-admin analytics', async ({ page }) => {
      clearValidationRateLimits();
      await establishSession(page, 'admin');
      await page.goto('/super-admin/analytics');
      await expect(page).toHaveURL(/\/admin\/dashboard/, { timeout: 15000 });
    });

    test('SAA-SA-012 | Super Admin redirected from admin dashboard (UI isolation)', async ({
      page,
    }) => {
      clearValidationRateLimits();
      await establishSession(page, 'superadmin');
      await expect
        .poll(async () => page.evaluate(() => localStorage.getItem('role')), { timeout: 10000 })
        .toBe('super-admin');
      await page.goto('/admin/dashboard');
      await expect(page).toHaveURL(/\/super-admin\/dashboard/, { timeout: 15000 });
    });

    test('SAA-SA-013 | Super Admin redirected from vendor dashboard', async ({ page }) => {
      await establishSession(page, 'superadmin');
      await page.goto('/vendor/dashboard');
      await expect(page).toHaveURL(/\/super-admin\/dashboard/, { timeout: 15000 });
    });

    test('SAA-SA-014 | Super Admin allowed on /super-admin/dashboard', async ({ page }) => {
      await establishSuperAdminUiSession(page);
      await expect(page).toHaveURL(/\/super-admin\/dashboard/);
      await expect(page.getByRole('heading', { name: 'Super Admin Dashboard' })).toBeVisible({
        timeout: 15000,
      });
    });

    test('SAA-SA-015 | Super Admin sidebar Main navigation visible', async ({ page }) => {
      await establishSuperAdminUiSession(page);
      await expect(page.getByLabel('Main navigation')).toBeVisible();
      await expect(
        page.getByLabel('Main navigation').getByRole('link', { name: /^Payment Verifications$/ })
      ).toBeVisible();
    });
  });

  // ── C — Unauthenticated APIs ──────────────────────────────────────────────
  test.describe('Section C — Unauthenticated Super Admin APIs', () => {
    test('SAA-SA-016 | Unauthenticated GET /super-admin/stats rejected', async () => {
      const response = await getSuperAdminStatsRaw();
      expect(response.status).toBe(401);
      expect(messageOf(response.data)).toMatch(/not authorized|token/i);
    });

    test('SAA-SA-017 | Unauthenticated GET /super-admin/metrics rejected', async () => {
      const response = await getSuperAdminMetricsRaw();
      expect(response.status).toBe(401);
    });

    test('SAA-SA-018 | Unauthenticated GET /super-admin/users rejected', async () => {
      const response = await getSuperAdminUsersRaw();
      expect(response.status).toBe(401);
    });

    test('SAA-SA-019 | Unauthenticated GET /admin-approvals/pending rejected', async () => {
      const response = await getAdminApprovalsPendingRaw();
      expect(response.status).toBe(401);
    });

    test('SAA-SA-020 | Unauthenticated GET /analytics/dashboard rejected', async () => {
      const response = await getAnalyticsDashboardRaw();
      expect(response.status).toBe(401);
    });

    test('SAA-SA-021 | Unauthenticated GET /payments/bank-transfer/pending rejected', async () => {
      const response = await getBankTransferPendingRaw();
      expect(response.status).toBe(401);
    });

    test('SAA-SA-022 | Unauthenticated PATCH /admin-approvals/:id/approve rejected', async () => {
      const response = await patchAdminApprovalApproveRaw(seed.pendingApprovalId);
      expect(response.status).toBe(401);
    });

    test('SAA-SA-023 | Unauthenticated POST /super-admin/admins rejected', async () => {
      const response = await postSuperAdminAdminRaw({
        name: 'SAA Ghost',
        email: `saa.ghost.${Date.now()}@example.com`,
        mobile: '9299999999',
        password: 'Qx7#mLp2!sRw9',
      });
      expect(response.status).toBe(401);
    });
  });

  // ── D — JWT matrix ────────────────────────────────────────────────────────
  test.describe('Section D — JWT / Token Security on /super-admin/stats', () => {
    test('SAA-SA-024 | Malformed JWT rejected', async () => {
      const response = await getSuperAdminStatsRaw(bearerOnly('not-a-jwt'));
      expect(response.status).toBe(401);
    });

    test('SAA-SA-025 | Literal null token rejected', async () => {
      const response = await getSuperAdminStatsRaw(bearerOnly('null'));
      expect(response.status).toBe(401);
      expect(messageOf(response.data)).toMatch(/invalid token/i);
    });

    test('SAA-SA-026 | Expired JWT rejected', async () => {
      const payload = decodeJwtPayload(saSession.accessToken);
      const expired = signTestJwt(
        { id: payload.id, role: payload.role, sessionId: payload.sessionId },
        { expired: true }
      );
      const response = await getSuperAdminStatsRaw(bearerOnly(expired));
      expect(response.status).toBe(401);
      expect(messageOf(response.data)).toMatch(/token expired|expired/i);
    });

    test('SAA-SA-027 | Tampered JWT rejected', async () => {
      const tampered = tamperTokenSignature(saSession.accessToken);
      const response = await getSuperAdminStatsRaw(bearerOnly(tampered));
      expect(response.status).toBe(401);
      expect(messageOf(response.data)).toMatch(/invalid token/i);
    });

    test('SAA-SA-028 | Missing Authorization rejected', async () => {
      await expectApiStatus(() => apiClient.get('/super-admin/stats'), 401);
    });

    test('SAA-SA-029 | Deleted/ghost user JWT rejected', async () => {
      const ghost = signTestJwt({ id: '000000000000000000000099', role: 'SUPER_ADMIN' });
      const response = await getSuperAdminStatsRaw(bearerOnly(ghost));
      expect(response.status).toBe(401);
      expect(messageOf(response.data)).toMatch(/no longer exists/i);
    });

    test('SAA-SA-030 | Token without sessionId rejected when active session exists', async () => {
      const payload = decodeJwtPayload(saSession.accessToken);
      const noSession = signTestJwt({ id: payload.id, role: payload.role });
      const response = await getSuperAdminStatsRaw(bearerOnly(noSession));
      expect(response.status).toBe(401);
      expect(messageOf(response.data)).toMatch(/session expired/i);
    });

    test('SAA-SA-031 | Escalated Admin JWT claim cannot unlock /super-admin/stats', async () => {
      const escalated = signEscalatedRoleToken(adminSession.accessToken, 'SUPER_ADMIN');
      const response = await getSuperAdminStatsRaw(bearerOnly(escalated));
      expect(response.status).toBe(403);
    });

    test('SAA-SA-032 | Escalated Vendor JWT claim cannot unlock /super-admin/stats', async () => {
      const escalated = signEscalatedRoleToken(vendorSession.accessToken, 'SUPER_ADMIN');
      const response = await getSuperAdminStatsRaw(bearerOnly(escalated));
      expect(response.status).toBe(403);
    });
  });

  // ── E — Session lifecycle ─────────────────────────────────────────────────
  test.describe('Section E — Session Lifecycle & Account Status', () => {
    test('SAA-SA-033 | Session-replaced SA token rejected on /super-admin/stats', async () => {
      const creds = getSuperAdminCredentials();
      const first = await loginApiFresh(creds.mobile, creds.password);
      await loginApiFresh(creds.mobile, creds.password);
      const response = await getSuperAdminStatsRaw(bearerOnly(first.accessToken));
      expect(response.status).toBe(401);
      expect(messageOf(response.data)).toMatch(/session expired|another login/i);
      saSession = await refreshSuperAdminApiSession();
    });

    test('SAA-SA-034 | Inactive vendor login blocked (non-SA status gate)', async () => {
      const inactive = getInactiveVendorCredentials();
      const loginRes = await apiClient.post(
        '/auth/login',
        { identifier: inactive.mobile, mobile: inactive.mobile, password: inactive.password },
        { validateStatus: () => true }
      );
      expect(loginRes.status).toBe(403);
      expect(messageOf(loginRes.data)).toMatch(/inactive|suspended|support/i);
    });

    test('SAA-SA-035 | Valid Super Admin session loads dashboard', async ({ page }) => {
      await establishSuperAdminUiSession(page);
      await expect(page.getByRole('heading', { name: 'Super Admin Dashboard' })).toBeVisible();
    });

    test('SAA-SA-036 | Cleared browser tokens redirect SA dashboard to login', async ({
      page,
    }) => {
      await establishSuperAdminUiSession(page);
      await page.evaluate(() => {
        localStorage.clear();
        sessionStorage.clear();
      });
      await page.goto('/super-admin/dashboard');
      await expect(page).toHaveURL(/\/login/, { timeout: 15000 });
    });
  });

  // ── F — Role API matrix ───────────────────────────────────────────────────
  test.describe('Section F — Role API RBAC Matrix', () => {
    test('SAA-SA-037 | Super Admin GET /super-admin/stats allowed', async () => {
      saSession = await refreshSuperAdminApiSession();
      const response = await getSuperAdminStatsRaw(authHeaders(saSession));
      expect(response.status).toBe(200);
    });

    test('SAA-SA-038 | Admin GET /super-admin/stats forbidden', async () => {
      const response = await getSuperAdminStatsRaw(authHeaders(adminSession));
      expect(response.status).toBe(403);
      expect(messageOf(response.data)).toMatch(/forbidden/i);
    });

    test('SAA-SA-039 | Vendor GET /super-admin/stats forbidden', async () => {
      const response = await getSuperAdminStatsRaw(authHeaders(vendorSession));
      expect(response.status).toBe(403);
    });

    test('SAA-SA-040 | Delivery GET /super-admin/stats forbidden', async () => {
      const response = await getSuperAdminStatsRaw(authHeaders(deliverySession));
      expect(response.status).toBe(403);
    });

    test('SAA-SA-041 | Super Admin GET /super-admin/metrics allowed', async () => {
      const response = await getSuperAdminMetricsRaw(authHeaders(saSession));
      expect(response.status).toBe(200);
    });

    test('SAA-SA-042 | Admin GET /super-admin/admins forbidden', async () => {
      const response = await getSuperAdminAdminsRaw(authHeaders(adminSession));
      expect(response.status).toBe(403);
    });

    test('SAA-SA-043 | Super Admin GET /admin-approvals/pending allowed', async () => {
      const response = await getAdminApprovalsPendingRaw(authHeaders(saSession));
      expect(response.status).toBe(200);
    });

    test('SAA-SA-044 | Admin GET /admin-approvals/pending forbidden', async () => {
      const response = await getAdminApprovalsPendingRaw(authHeaders(adminSession));
      expect(response.status).toBe(403);
    });

    test('SAA-SA-045 | Vendor GET /admin-approvals/pending forbidden', async () => {
      const response = await getAdminApprovalsPendingRaw(authHeaders(vendorSession));
      expect(response.status).toBe(403);
    });

    test('SAA-SA-046 | Super Admin GET /analytics/dashboard allowed', async () => {
      const response = await getAnalyticsDashboardRaw(authHeaders(saSession));
      expect(response.status).toBe(200);
    });

    test('SAA-SA-047 | Admin GET /analytics/dashboard forbidden', async () => {
      const response = await getAnalyticsDashboardRaw(authHeaders(adminSession));
      expect(response.status).toBe(403);
    });

    test('SAA-SA-048 | Super Admin GET /analytics/delivery allowed', async () => {
      const response = await getAnalyticsDeliveryRaw(authHeaders(saSession));
      expect(response.status).toBe(200);
    });

    test('SAA-SA-049 | Admin GET /analytics/delivery allowed', async () => {
      const response = await getAnalyticsDeliveryRaw(authHeaders(adminSession));
      expect(response.status).toBe(200);
    });

    test('SAA-SA-050 | Vendor GET /analytics/dashboard forbidden', async () => {
      const response = await getAnalyticsDashboardRaw(authHeaders(vendorSession));
      expect(response.status).toBe(403);
    });

    test('SAA-SA-051 | Super Admin GET /payments/bank-transfer/pending allowed', async () => {
      const response = await getBankTransferPendingRaw(authHeaders(saSession));
      expect(response.status).toBe(200);
    });

    test('SAA-SA-052 | Admin GET /payments/bank-transfer/pending forbidden', async () => {
      const response = await getBankTransferPendingRaw(authHeaders(adminSession));
      expect(response.status).toBe(403);
    });

    test('SAA-SA-053 | Vendor GET /payments/bank-transfer/pending forbidden', async () => {
      const response = await getBankTransferPendingRaw(authHeaders(vendorSession));
      expect(response.status).toBe(403);
    });

    test('SAA-SA-054 | Delivery GET /payments/bank-transfer/pending forbidden', async () => {
      const response = await getBankTransferPendingRaw(authHeaders(deliverySession));
      expect(response.status).toBe(403);
    });
  });

  // ── G — Cross-module interoperability ─────────────────────────────────────
  test.describe('Section G — Cross-Module API Interoperability', () => {
    test('SAA-SA-055 | Super Admin GET /admin/stats allowed (API)', async () => {
      const response = await getAdminStatsRaw(authHeaders(saSession));
      expect(response.status).toBe(200);
    });

    test('SAA-SA-056 | Super Admin GET /admin/users allowed (API)', async () => {
      const response = await getAdminUsersRaw(authHeaders(saSession), { role: 'ADMIN' });
      expect(response.status).toBe(200);
    });

    test('SAA-SA-057 | Super Admin POST /admin/approve allowed (API)', async () => {
      const pending = await registerPendingVendor('saa-adm-appr');
      const response = await postAdminApproveRaw(pending.id, authHeaders(saSession));
      expect(response.status).not.toBe(401);
      expect(response.status).not.toBe(403);
      expect(response.status).toBeLessThan(500);
    });

    test('SAA-SA-058 | Super Admin GET /inventory/stats forbidden (ADMIN only)', async () => {
      const response = await getInventoryStatsRaw(authHeaders(saSession));
      expect(response.status).toBe(403);
    });

    test('SAA-SA-059 | Admin PATCH /admin-approvals/:id/approve forbidden', async () => {
      const response = await patchAdminApprovalApproveRaw(
        seed.pendingApprovalId,
        authHeaders(adminSession)
      );
      expect(response.status).toBe(403);
    });

    test('SAA-SA-060 | Vendor PATCH bank-transfer approve forbidden', async () => {
      const response = await patchBankTransferApproveRaw(
        '000000000000000000000001',
        authHeaders(vendorSession)
      );
      expect(response.status).toBe(403);
    });

    test('SAA-SA-061 | Admin PATCH bank-transfer reject forbidden', async () => {
      const response = await patchBankTransferRejectRaw(
        '000000000000000000000001',
        'SAA reject probe',
        authHeaders(adminSession)
      );
      expect(response.status).toBe(403);
    });
  });

  // ── H — CSRF middleware truth ─────────────────────────────────────────────
  test.describe('Section H — CSRF Middleware Truth', () => {
    test.beforeAll(async () => {
      clearValidationRateLimits();
      saSession = await refreshSuperAdminApiSession();
    });

    test('SAA-SA-062 | SA POST /super-admin/admins Bearer-only succeeds (no CSRF req)', async () => {
      const mobile = `93${String(Date.now()).slice(-8)}`.slice(0, 10);
      const response = await postSuperAdminAdminRaw(
        {
          name: `SAA Admin ${Date.now().toString(36).slice(-4)}`,
          email: `saa.admin.${Date.now()}@example.com`,
          mobile,
          password: 'Qx7#mLp2!sRw9',
        },
        authBearerOnly(saSession)
      );
      // Domain may 400 on duplicate — must not be CSRF 403
      if (response.status === 403) {
        expect(messageOf(response.data)).not.toMatch(/csrf/i);
      } else {
        expect(response.status).not.toBe(401);
        expect(response.status).toBeLessThan(500);
      }
    });

    test('SAA-SA-063 | SA PATCH /admin-approvals approve Bearer-only rejected (CSRF)', async () => {
      const pending = await registerPendingVendor('saa-csrf-ap');
      const response = await patchAdminApprovalApproveRaw(pending.id, authBearerOnly(saSession));
      expect(response.status).toBe(403);
      expect(messageOf(response.data)).toMatch(/csrf/i);
    });

    test('SAA-SA-064 | SA PATCH /admin-approvals approve with CSRF headers not forbidden by CSRF', async () => {
      saSession = await refreshSuperAdminApiSession();
      const pending = await registerPendingVendor('saa-csrf-ok');
      const response = await patchAdminApprovalApproveRaw(pending.id, authHeaders(saSession));
      expect(response.status).not.toBe(401);
      // Must not be CSRF failure; domain 200/404/400 ok
      if (response.status === 403) {
        expect(messageOf(response.data)).not.toMatch(/csrf/i);
      }
    });

    test('SAA-SA-065 | SA PATCH /admin-approvals reject Bearer-only rejected (CSRF)', async () => {
      const pending = await registerPendingVendor('saa-csrf-rj');
      const response = await patchAdminApprovalRejectRaw(pending.id, authBearerOnly(saSession));
      expect(response.status).toBe(403);
      expect(messageOf(response.data)).toMatch(/csrf/i);
    });

    test('SAA-SA-066 | SA PATCH bank-transfer approve Bearer-only rejected (CSRF)', async () => {
      const response = await patchBankTransferApproveRaw(
        '000000000000000000000001',
        authBearerOnly(saSession)
      );
      expect(response.status).toBe(403);
      expect(messageOf(response.data)).toMatch(/csrf/i);
    });

    test('SAA-SA-067 | SA PATCH bank-transfer reject Bearer-only rejected (CSRF)', async () => {
      const response = await patchBankTransferRejectRaw(
        '000000000000000000000001',
        'SAA CSRF reject probe reason',
        authBearerOnly(saSession)
      );
      expect(response.status).toBe(403);
      expect(messageOf(response.data)).toMatch(/csrf/i);
    });

    test('SAA-SA-068 | SA PATCH /orders/:id/status Bearer-only rejected (CSRF)', async () => {
      // Fake id — CSRF runs before domain; expect CSRF 403 not role 403
      const response = await patchOrderStatusRaw(
        '000000000000000000000001',
        { status: 'CONFIRMED' },
        authBearerOnly(saSession)
      );
      expect(response.status).toBe(403);
      expect(messageOf(response.data)).toMatch(/csrf/i);
    });

    test('SAA-SA-069 | SA POST /admin/approve Bearer-only succeeds (no CSRF on /admin)', async () => {
      const pending = await registerPendingVendor('saa-adm-nocsrf');
      const response = await postAdminApproveRaw(pending.id, authBearerOnly(saSession));
      expect(response.status).not.toBe(403);
      expect(response.status).toBeLessThan(500);
    });
  });

  // ── I — Logout / deep-link ────────────────────────────────────────────────
  test.describe('Section I — Logout & Deep-Link Protection', () => {
    test('SAA-SA-070 | Logout then SA dashboard redirects to login', async ({ page }) => {
      await establishSuperAdminUiSession(page);
      await logoutFlow(page);
      await page.goto('/super-admin/dashboard');
      await expect(page).toHaveURL(/\/login/);
    });

    test('SAA-SA-071 | Logout then deep-link payment-verifications redirects to login', async ({
      page,
    }) => {
      await establishSuperAdminUiSession(page);
      await logoutFlow(page);
      await page.goto('/super-admin/payment-verifications');
      await expect(page).toHaveURL(/\/login/);
    });

    test('SAA-SA-072 | Logout then deep-link analytics redirects to login', async ({ page }) => {
      await establishSuperAdminUiSession(page);
      await logoutFlow(page);
      await page.goto('/super-admin/analytics');
      await expect(page).toHaveURL(/\/login/);
    });

    test('SAA-SA-073 | After logout SA sidebar navigation is inaccessible', async ({ page }) => {
      await establishSuperAdminUiSession(page);
      await logoutFlow(page);
      await page.goto('/super-admin/user-management');
      await expect(page).toHaveURL(/\/login/);
      await expect(page.getByLabel('Main navigation')).toHaveCount(0);
    });
  });

  // ── J — Backend source locks ──────────────────────────────────────────────
  test.describe('Section J — Backend Source-Truth Mounts', () => {
    test('SAA-SA-074 | v1 mounts /super-admin with authenticate + injectCsrfToken', () => {
      const src = readBackendFile('src/routes/v1.routes.js');
      expect(src).toMatch(/super-admin[\s\S]{0,120}authenticate[\s\S]{0,80}injectCsrfToken|injectCsrfToken[\s\S]{0,80}super-admin/i);
      expect(src).toMatch(/['"]\/super-admin['"]/);
    });

    test('SAA-SA-075 | superAdmin.routes authorize SUPER_ADMIN only', () => {
      const src = readBackendFile('src/modules/superAdmin/superAdmin.routes.js');
      expect(src).toMatch(/authorize\(\s*['"]SUPER_ADMIN['"]\s*\)/);
      expect(src).not.toMatch(/authorize\(\s*['"]ADMIN['"]/);
    });

    test('SAA-SA-076 | adminApprovals.routes SUPER_ADMIN + CSRF on approve/reject', () => {
      const src = readBackendFile('src/modules/adminApprovals/adminApprovals.routes.js');
      expect(src).toMatch(/authorize\(\s*['"]SUPER_ADMIN['"]\s*\)/);
      expect(src).toMatch(/approve[\s\S]{0,80}csrfProtection|csrfProtection[\s\S]{0,80}approve/i);
      expect(src).toMatch(/reject[\s\S]{0,80}csrfProtection|csrfProtection[\s\S]{0,80}reject/i);
    });

    test('SAA-SA-077 | analytics.routes dashboard SUPER_ADMIN; delivery ADMIN+SA', () => {
      const src = readBackendFile('src/modules/analytics/analytics.routes.js');
      expect(src).toMatch(
        /dashboard[\s\S]{0,120}authorize\(\s*['"]SUPER_ADMIN['"]\s*\)|authorize\(\s*['"]SUPER_ADMIN['"]\s*\)[\s\S]{0,80}dashboard/i
      );
      expect(src).toMatch(/delivery[\s\S]{0,120}ADMIN[\s\S]{0,40}SUPER_ADMIN|SUPER_ADMIN[\s\S]{0,40}ADMIN/i);
    });

    test('SAA-SA-078 | admin.routes authorize ADMIN and SUPER_ADMIN', () => {
      const src = readBackendFile('src/modules/admin/admin.routes.js');
      expect(src).toMatch(/authorize\(\s*['"]ADMIN['"]\s*,\s*['"]SUPER_ADMIN['"]\s*\)/);
    });

    test('SAA-SA-079 | paymentProof bank-transfer pending/approve/reject SUPER_ADMIN', () => {
      const src = readBackendFile('src/modules/payment-proof/paymentProof.routes.js');
      expect(src).toMatch(/pending[\s\S]{0,200}SUPER_ADMIN|SUPER_ADMIN[\s\S]{0,200}pending/i);
      expect(src).toMatch(/approve[\s\S]{0,200}csrfProtection|csrfProtection[\s\S]{0,120}approve/i);
    });

    test('SAA-SA-080 | Authenticated GET /super-admin/stats still succeeds after AuthZ flows', async () => {
      const session = await refreshSuperAdminApiSession();
      saSession = session;
      const response = await getSuperAdminStatsRaw(authHeaders(session));
      expect(response.status).toBe(200);
      expect(userIdFromSession(session)).toBeTruthy();
    });
  });
});
