/**
 * Super Admin Smoke Certification Suite (SS-SA)
 *
 * Production sources of truth:
 * - ProtectedRoute requiredRole="super-admin" on /super-admin/*
 * - SuperAdminLayout sidebar (7 links): Dashboard, Platform Monitoring, User Management,
 *   Orders, Payment Verifications, Analytics, Settings — brand subtitle "Platform"
 * - Dashboard: GET /super-admin/stats (+ metrics/audit-logs) — Total Admins/Vendors/Orders/Revenue
 * - No separate Financial Dashboard or Reports pages (Analytics is the finance surface)
 * - User Management tabs: User Approvals | Admin Management | Vendor Management | Delivery Partners
 * - Payment Verifications routed + live (Admin stub remains separate)
 * - Backend /super-admin: protect + authorize(SUPER_ADMIN) only
 *
 * Explicitly NOT smoked (Functional phase or absent):
 * - Approve/reject mutations, create admin, order status transitions
 * - /super-admin/config, category CRUD, audit export
 * - Invented Financial Dashboard / Reports nav
 */
import { test, expect } from '../fixtures/product.functional.fixture';
import { loginApi, type ApiSession } from '../helpers/auth.api.helper';
import { establishSession } from '../helpers/session.functional.helper';
import {
  getAdminCredentials,
  getSuperAdminCredentials,
  getVendorCredentials,
} from '../helpers/product.credentials';
import LoginPage from '../pages/auth/LoginPage';
import logoutFlow from '../flows/authentication/logout.flow';
import {
  authHeaders,
  clearValidationRateLimits,
  establishSuperAdminUiSession,
  getAnalyticsDashboardRaw,
  getBankTransferPendingRaw,
  getSuperAdminStatsRaw,
  messageOf,
  refreshSuperAdminApiSession,
  unwrapData,
} from '../helpers/superadmin.smoke.helper';

const SIDEBAR_LINKS: Array<{ name: RegExp; path: RegExp }> = [
  { name: /^Dashboard$/, path: /\/super-admin\/dashboard/ },
  { name: /^Platform Monitoring$/, path: /\/super-admin\/platform/ },
  { name: /^User Management$/, path: /\/super-admin\/user-management/ },
  { name: /^Orders$/, path: /\/super-admin\/orders/ },
  { name: /^Payment Verifications$/, path: /\/super-admin\/payment-verifications/ },
  { name: /^Analytics$/, path: /\/super-admin\/analytics/ },
  { name: /^Settings$/, path: /\/super-admin\/settings/ },
];

test.describe('Super Admin Smoke Suite', () => {
  let saSession: ApiSession;

  test.beforeAll(async () => {
    clearValidationRateLimits();
    saSession = await refreshSuperAdminApiSession();
    expect(saSession.accessToken).toBeTruthy();
  });

  // ── Auth & route protection ───────────────────────────────────────────────
  test('SS-SA-001 | Guest blocked from super-admin dashboard', async ({ page }) => {
    await page.goto('/super-admin/dashboard');
    await expect(page).toHaveURL(/\/login/);
  });

  test('SS-SA-002 | Guest blocked from payment-verifications', async ({ page }) => {
    await page.goto('/super-admin/payment-verifications');
    await expect(page).toHaveURL(/\/login/);
  });

  test('SS-SA-003 | Admin redirected from super-admin dashboard', async ({ page }) => {
    clearValidationRateLimits();
    await establishSession(page, 'admin');
    await page.goto('/super-admin/dashboard');
    await expect(page).toHaveURL(/\/admin\/dashboard/, { timeout: 15000 });
  });

  test('SS-SA-004 | Vendor redirected from super-admin dashboard', async ({ page }) => {
    clearValidationRateLimits();
    await establishSession(page, 'vendor');
    await page.goto('/super-admin/dashboard');
    await expect(page).toHaveURL(/\/vendor\/dashboard/, { timeout: 15000 });
  });

  test('SS-SA-005 | Delivery redirected from super-admin dashboard', async ({ page }) => {
    clearValidationRateLimits();
    await establishSession(page, 'delivery');
    await page.goto('/super-admin/dashboard');
    await expect(page).toHaveURL(/\/delivery\/dashboard/, { timeout: 15000 });
  });

  // ── Dashboard ─────────────────────────────────────────────────────────────
  test('SS-SA-006 | Super Admin dashboard loads with Platform brand', async ({ page }) => {
    await establishSuperAdminUiSession(page);
    await expect(page.getByLabel('Main navigation')).toBeVisible();
    await expect(page.getByText('Platform').first()).toBeVisible();
  });

  test('SS-SA-007 | Dashboard exposes stats-backed metric labels', async ({ page }) => {
    await establishSuperAdminUiSession(page);
    await expect(page.getByText('Total Admins').first()).toBeVisible();
    await expect(page.getByText('Total Vendors').first()).toBeVisible();
    await expect(page.getByText('Total Orders').first()).toBeVisible();
    await expect(page.getByText('Total Revenue').first()).toBeVisible();
  });

  test('SS-SA-008 | Dashboard Quick Actions and Platform Health sections present', async ({
    page,
  }) => {
    await establishSuperAdminUiSession(page);
    await expect(page.getByRole('heading', { name: 'Quick Actions' })).toBeVisible({
      timeout: 15000,
    });
    await expect(page.getByRole('heading', { name: 'Platform Health' })).toBeVisible();
  });

  // ── Sidebar navigation ────────────────────────────────────────────────────
  test('SS-SA-009 | Sidebar lists production Super Admin nav links', async ({ page }) => {
    await establishSuperAdminUiSession(page);
    const nav = page.getByLabel('Main navigation');
    for (const link of SIDEBAR_LINKS) {
      await expect(nav.getByRole('link', { name: link.name })).toBeVisible();
    }
    // No inventing Reports / Financial Dashboard nav
    await expect(nav.getByRole('link', { name: /^Reports$/ })).toHaveCount(0);
    await expect(nav.getByRole('link', { name: /financial dashboard/i })).toHaveCount(0);
  });

  test('SS-SA-010 | Sidebar navigates to Platform Monitoring', async ({ page }) => {
    await establishSuperAdminUiSession(page);
    await page
      .getByLabel('Main navigation')
      .getByRole('link', { name: /^Platform Monitoring$/ })
      .click();
    await expect(page).toHaveURL(/\/super-admin\/platform/);
    await expect(page.getByRole('heading', { name: 'Platform Monitoring' })).toBeVisible({
      timeout: 15000,
    });
  });

  test('SS-SA-011 | Sidebar navigates to User Management', async ({ page }) => {
    await establishSuperAdminUiSession(page);
    await page
      .getByLabel('Main navigation')
      .getByRole('link', { name: /^User Management$/ })
      .click();
    await expect(page).toHaveURL(/\/super-admin\/user-management/);
    await expect(page.getByRole('heading', { name: 'User Management' })).toBeVisible({
      timeout: 15000,
    });
  });

  test('SS-SA-012 | Sidebar navigates to Orders (Global Orders)', async ({ page }) => {
    await establishSuperAdminUiSession(page);
    await page.getByLabel('Main navigation').getByRole('link', { name: /^Orders$/ }).click();
    await expect(page).toHaveURL(/\/super-admin\/orders/);
    await expect(page.getByRole('heading', { name: 'Global Orders' })).toBeVisible({
      timeout: 15000,
    });
  });

  test('SS-SA-013 | Sidebar navigates to Payment Verifications', async ({ page }) => {
    await establishSuperAdminUiSession(page);
    await page
      .getByLabel('Main navigation')
      .getByRole('link', { name: /^Payment Verifications$/ })
      .click();
    await expect(page).toHaveURL(/\/super-admin\/payment-verifications/);
    await expect(page.getByRole('heading', { name: 'Payment Verifications' })).toBeVisible({
      timeout: 15000,
    });
  });

  test('SS-SA-014 | Sidebar navigates to Analytics', async ({ page }) => {
    await establishSuperAdminUiSession(page);
    await page.getByLabel('Main navigation').getByRole('link', { name: /^Analytics$/ }).click();
    await expect(page).toHaveURL(/\/super-admin\/analytics/);
    await expect(page.getByRole('heading', { name: 'Analytics' })).toBeVisible({
      timeout: 15000,
    });
  });

  test('SS-SA-015 | Sidebar navigates to Settings', async ({ page }) => {
    await establishSuperAdminUiSession(page);
    await page.getByLabel('Main navigation').getByRole('link', { name: /^Settings$/ }).click();
    await expect(page).toHaveURL(/\/super-admin\/settings/);
    await expect(page.getByRole('heading', { name: 'Settings', exact: true }).first()).toBeVisible({
      timeout: 15000,
    });
  });

  // ── Core pages ────────────────────────────────────────────────────────────
  test('SS-SA-016 | User Management exposes production tabs', async ({ page }) => {
    await establishSuperAdminUiSession(page);
    await page.goto('/super-admin/user-management');
    await expect(page.getByRole('heading', { name: 'User Management' })).toBeVisible({
      timeout: 15000,
    });
    await expect(page.getByRole('button', { name: /User Approvals/i }).first()).toBeVisible();
    await expect(page.getByRole('button', { name: /Admin Management/i }).first()).toBeVisible();
    await expect(page.getByRole('button', { name: /Vendor Management/i }).first()).toBeVisible();
    await expect(page.getByRole('button', { name: /Delivery Partners/i }).first()).toBeVisible();
  });

  test('SS-SA-017 | User Approvals tab shows empty-or-list state', async ({ page }) => {
    await establishSuperAdminUiSession(page);
    await page.goto('/super-admin/user-management');
    await page.getByRole('button', { name: /User Approvals/i }).first().click();
    await expect(
      page
        .getByText(/No pending registration requests\.|Loading pending registrations/i)
        .or(page.getByRole('table'))
        .first()
    ).toBeVisible({ timeout: 15000 });
  });

  test('SS-SA-018 | Admin Management tab loads', async ({ page }) => {
    await establishSuperAdminUiSession(page);
    await page.goto('/super-admin/user-management');
    await page.getByRole('button', { name: /Admin Management/i }).first().click();
    await expect(page.getByRole('heading', { name: 'Admin Management' })).toBeVisible({
      timeout: 15000,
    });
  });

  test('SS-SA-019 | Payment Verifications shows empty-or-list state', async ({ page }) => {
    await establishSuperAdminUiSession(page);
    await page.goto('/super-admin/payment-verifications');
    await expect(page.getByRole('heading', { name: 'Payment Verifications' })).toBeVisible({
      timeout: 15000,
    });
    await expect(
      page
        .getByText(/No pending verifications|Loading pending verifications/i)
        .or(page.getByRole('table'))
        .first()
    ).toBeVisible({ timeout: 15000 });
  });

  test('SS-SA-020 | Analytics exposes Total Orders and Revenue KPIs', async ({ page }) => {
    await establishSuperAdminUiSession(page);
    await page.goto('/super-admin/analytics');
    await expect(page.getByRole('heading', { name: 'Analytics' })).toBeVisible({
      timeout: 15000,
    });
    await expect(page.getByText('Total Orders').first()).toBeVisible();
    await expect(page.getByText('Revenue').first()).toBeVisible();
  });

  test('SS-SA-021 | Platform Monitoring page loads', async ({ page }) => {
    await establishSuperAdminUiSession(page);
    await page.goto('/super-admin/platform');
    await expect(page.getByRole('heading', { name: 'Platform Monitoring' })).toBeVisible({
      timeout: 15000,
    });
    await expect(page.getByText('Total Vendors').first()).toBeVisible();
  });

  test('SS-SA-022 | Legacy /super-admin/admin-approvals redirects to user-management', async ({
    page,
  }) => {
    await establishSuperAdminUiSession(page);
    await page.goto('/super-admin/admin-approvals');
    await expect(page).toHaveURL(/\/super-admin\/user-management/, { timeout: 15000 });
  });

  // ── Notifications ─────────────────────────────────────────────────────────
  test('SS-SA-023 | Super Admin notification bell opens drawer', async ({ page }) => {
    await establishSuperAdminUiSession(page);
    await expect(page.getByLabel('Notifications')).toBeVisible({ timeout: 15000 });
    await page.getByLabel('Notifications').click();
    await expect(page.getByRole('heading', { name: /^notifications$/i })).toBeVisible({
      timeout: 10000,
    });
  });

  // ── API health ────────────────────────────────────────────────────────────
  test('SS-SA-024 | Authenticated GET /super-admin/stats succeeds', async () => {
    saSession = await refreshSuperAdminApiSession();
    const response = await getSuperAdminStatsRaw(authHeaders(saSession));
    expect(response.status).toBe(200);
    const stats = unwrapData(response.data);
    expect(stats).toMatchObject({
      admins: expect.anything(),
      vendors: expect.anything(),
      orders: expect.anything(),
      revenue: expect.anything(),
    });
  });

  test('SS-SA-025 | Authenticated GET /analytics/dashboard succeeds for SA', async () => {
    const response = await getAnalyticsDashboardRaw(authHeaders(saSession));
    expect(response.status).toBe(200);
    expect((response.data as { success?: boolean }).success).not.toBe(false);
  });

  test('SS-SA-026 | Unauthenticated GET /super-admin/stats rejected', async () => {
    const response = await getSuperAdminStatsRaw();
    expect(response.status).toBe(401);
    expect(messageOf(response.data)).toMatch(/not authorized|token/i);
  });

  test('SS-SA-027 | Admin GET /analytics/dashboard forbidden', async () => {
    const adminCreds = getAdminCredentials();
    const adminSession = await loginApi(adminCreds.mobile, adminCreds.password);
    const response = await getAnalyticsDashboardRaw(authHeaders(adminSession));
    expect(response.status).toBe(403);
  });

  test('SS-SA-028 | Admin GET /payments/bank-transfer/pending forbidden', async () => {
    const adminCreds = getAdminCredentials();
    const adminSession = await loginApi(adminCreds.mobile, adminCreds.password);
    const response = await getBankTransferPendingRaw(authHeaders(adminSession));
    expect(response.status).toBe(403);
  });

  test('SS-SA-029 | Vendor GET /super-admin/stats forbidden', async () => {
    const vendorCreds = getVendorCredentials(1);
    const vendorSession = await loginApi(vendorCreds.mobile, vendorCreds.password);
    const response = await getSuperAdminStatsRaw(authHeaders(vendorSession));
    expect(response.status).toBe(403);
  });

  // ── Session persistence, UI login, logout ─────────────────────────────────
  test('SS-SA-030 | Browser refresh keeps SA on dashboard', async ({ page }) => {
    await establishSuperAdminUiSession(page);
    await page.reload();
    await expect(page).toHaveURL(/\/super-admin\/dashboard/);
    await expect(page.getByRole('heading', { name: 'Super Admin Dashboard' })).toBeVisible({
      timeout: 15000,
    });
  });

  test('SS-SA-031 | Super Admin UI login lands on SA dashboard', async ({ page }) => {
    clearValidationRateLimits();
    const creds = getSuperAdminCredentials();
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.fillMobile(creds.mobile);
    await loginPage.fillPassword(creds.password);
    await loginPage.submit();
    await expect(page).toHaveURL(/\/super-admin\/dashboard/, { timeout: 20000 });
    await expect(page.getByRole('heading', { name: 'Super Admin Dashboard' })).toBeVisible({
      timeout: 15000,
    });
    saSession = await refreshSuperAdminApiSession();
  });

  test('SS-SA-032 | Logout then SA dashboard redirects to login', async ({ page }) => {
    await establishSuperAdminUiSession(page);
    await logoutFlow(page);
    await page.goto('/super-admin/dashboard');
    await expect(page).toHaveURL(/\/login/);
  });
});
