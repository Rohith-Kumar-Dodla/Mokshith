/**
 * Admin Smoke Certification Suite (AS-ADM)
 *
 * Production sources of truth:
 * - ProtectedRoute requiredRole="admin" on /admin/*
 * - AdminLayout sidebar (10 links; Payment Verifications NOT in nav)
 * - Dashboard: GET /admin/stats → Total Orders, Vendors, Delivery Partners, Pending Approvals, etc.
 * - Domain pages: Products, Categories, Inventory, Vendors, Orders, Delivery Assignment, Reports, Analytics, Settings
 * - Notification bell + drawer in AdminLayout
 * - Backend /admin: protect + authorize(ADMIN, SUPER_ADMIN); stats/users/approvals (not products/orders under /admin)
 *
 * Explicitly NOT smoked (absent or non-production for Admin smoke):
 * - Financial /analytics/dashboard (SUPER_ADMIN-only; Admin UI intentionally skips)
 * - Payment Verifications as a nav workflow (restricted stub only)
 * - Invented Admin CRUD deep journeys (Functional phase)
 */
import { test, expect } from '../fixtures/product.functional.fixture';
import { loginApi, type ApiSession } from '../helpers/auth.api.helper';
import { establishSession } from '../helpers/session.functional.helper';
import {
  getAdminCredentials,
  getVendorCredentials,
} from '../helpers/product.credentials';
import LoginPage from '../pages/auth/LoginPage';
import logoutFlow from '../flows/authentication/logout.flow';
import { AdminDeliveryAssignmentPage } from '../pages/delivery/DeliveryPages';
import AdminInventoryPage from '../pages/admin/AdminInventoryPage';
import AdminProductsPage from '../pages/admin/AdminProductsPage';
import AdminCategoriesPage from '../pages/admin/AdminCategoriesPage';
import {
  authHeaders,
  clearValidationRateLimits,
  establishAdminUiSession,
  getAdminStatsRaw,
  getAdminUsersRaw,
  messageOf,
  refreshAdminApiSession,
  unwrapData,
} from '../helpers/admin.smoke.helper';

const SIDEBAR_LINKS: Array<{ name: RegExp; path: RegExp }> = [
  { name: /^Dashboard$/, path: /\/admin\/dashboard/ },
  { name: /^Products$/, path: /\/admin\/products/ },
  { name: /^Categories$/, path: /\/admin\/categories/ },
  { name: /^Inventory$/, path: /\/admin\/inventory/ },
  { name: /^Vendors$/, path: /\/admin\/vendors/ },
  { name: /^Orders$/, path: /\/admin\/orders/ },
  { name: /^Delivery Assignment$/, path: /\/admin\/delivery-assignment/ },
  { name: /^Reports$/, path: /\/admin\/reports/ },
  { name: /^Analytics$/, path: /\/admin\/analytics/ },
  { name: /^Settings$/, path: /\/admin\/settings/ },
];

test.describe('Admin Smoke Suite', () => {
  let adminSession: ApiSession;

  test.beforeAll(async () => {
    clearValidationRateLimits();
    adminSession = await refreshAdminApiSession();
    expect(adminSession.accessToken).toBeTruthy();
  });

  // ── Auth & route protection ───────────────────────────────────────────────
  test('AS-ADM-001 | Guest blocked from admin dashboard', async ({ page }) => {
    await page.goto('/admin/dashboard');
    await expect(page).toHaveURL(/\/login/);
  });

  test('AS-ADM-002 | Guest blocked from admin products', async ({ page }) => {
    await page.goto('/admin/products');
    await expect(page).toHaveURL(/\/login/);
  });

  test('AS-ADM-003 | Vendor redirected from admin dashboard', async ({ page }) => {
    clearValidationRateLimits();
    await establishSession(page, 'vendor');
    await page.goto('/admin/dashboard');
    // Full navigation remounts AuthProvider; wait for restore + ProtectedRoute redirect.
    await expect(page).toHaveURL(/\/vendor\/dashboard/, { timeout: 15000 });
  });

  test('AS-ADM-004 | Delivery redirected from admin dashboard', async ({ page }) => {
    clearValidationRateLimits();
    await establishSession(page, 'delivery');
    await page.goto('/admin/dashboard');
    await expect(page).toHaveURL(/\/delivery\/dashboard/, { timeout: 15000 });
  });

  test('AS-ADM-005 | Super Admin redirected from admin dashboard', async ({ page }) => {
    clearValidationRateLimits();
    await establishSession(page, 'superadmin');
    await expect
      .poll(async () => page.evaluate(() => localStorage.getItem('role')), { timeout: 10000 })
      .toBe('super-admin');
    await page.goto('/admin/dashboard');
    await expect(page).toHaveURL(/\/super-admin\/dashboard/, { timeout: 15000 });
  });

  // ── Dashboard ─────────────────────────────────────────────────────────────
  test('AS-ADM-006 | Admin dashboard loads with operations heading', async ({ page }) => {
    await establishAdminUiSession(page);
    await expect(page.getByLabel('Main navigation')).toBeVisible();
    await expect(page.getByText('Admin Portal')).toBeVisible();
  });

  test('AS-ADM-007 | Dashboard exposes stats-backed metric labels', async ({ page }) => {
    await establishAdminUiSession(page);
    // Production: metrics from GET /admin/stats (not financial analytics)
    await expect(page.getByText('Total Orders').first()).toBeVisible();
    await expect(page.getByText('Pending Approvals').first()).toBeVisible();
    await expect(page.getByText(/Total Vendors|Delivery Partners|Total Admins/i).first()).toBeVisible();
  });

  test('AS-ADM-008 | Dashboard Marketplace Overview section present', async ({ page }) => {
    await establishAdminUiSession(page);
    await expect(page.getByRole('heading', { name: 'Marketplace Overview' })).toBeVisible({
      timeout: 15000,
    });
  });

  // ── Sidebar navigation ────────────────────────────────────────────────────
  test('AS-ADM-009 | Sidebar lists production Admin nav links', async ({ page }) => {
    await establishAdminUiSession(page);
    const nav = page.getByLabel('Main navigation');
    for (const link of SIDEBAR_LINKS) {
      await expect(nav.getByRole('link', { name: link.name })).toBeVisible();
    }
    // Payment Verifications intentionally not in Admin sidebar
    await expect(nav.getByRole('link', { name: /payment verifications/i })).toHaveCount(0);
  });

  test('AS-ADM-010 | Sidebar navigates to Products', async ({ page }) => {
    await establishAdminUiSession(page);
    await page.getByLabel('Main navigation').getByRole('link', { name: /^Products$/ }).click();
    await expect(page).toHaveURL(/\/admin\/products/);
    await expect(page.getByRole('heading', { name: 'Product Management' })).toBeVisible({
      timeout: 15000,
    });
  });

  test('AS-ADM-011 | Sidebar navigates to Delivery Assignment', async ({ page }) => {
    await establishAdminUiSession(page);
    await page
      .getByLabel('Main navigation')
      .getByRole('link', { name: /^Delivery Assignment$/ })
      .click();
    await expect(page).toHaveURL(/\/admin\/delivery-assignment/);
    await expect(page.getByRole('heading', { name: 'Delivery Assignment' })).toBeVisible({
      timeout: 15000,
    });
  });

  // ── Core module pages ─────────────────────────────────────────────────────
  test('AS-ADM-012 | Products page loads', async ({ page }) => {
    await establishAdminUiSession(page);
    const products = new AdminProductsPage(page);
    await products.goto();
    await expect(page.getByRole('heading', { name: 'Product Management' })).toBeVisible({
      timeout: 15000,
    });
  });

  test('AS-ADM-013 | Categories page loads', async ({ page }) => {
    await establishAdminUiSession(page);
    const categories = new AdminCategoriesPage(page);
    await categories.goto();
    await expect(page.getByRole('heading', { name: 'Product Categories' })).toBeVisible({
      timeout: 15000,
    });
  });

  test('AS-ADM-014 | Inventory page loads', async ({ page }) => {
    await establishAdminUiSession(page);
    const inventory = new AdminInventoryPage(page);
    await inventory.goto();
    await expect(inventory.pageHeading()).toBeVisible({ timeout: 15000 });
  });

  test('AS-ADM-015 | Vendors page loads', async ({ page }) => {
    await establishAdminUiSession(page);
    await page.goto('/admin/vendors');
    await expect(page.getByRole('heading', { name: 'Vendor Management' })).toBeVisible({
      timeout: 15000,
    });
  });

  test('AS-ADM-016 | Orders page loads', async ({ page }) => {
    await establishAdminUiSession(page);
    await page.goto('/admin/orders');
    await expect(page.getByRole('heading', { name: 'Area Orders' })).toBeVisible({
      timeout: 15000,
    });
  });

  test('AS-ADM-017 | Delivery Assignment page loads', async ({ page }) => {
    await establishAdminUiSession(page);
    const assignment = new AdminDeliveryAssignmentPage(page);
    await assignment.goto();
    await assignment.waitForLoad();
    await expect(assignment.pageHeading()).toBeVisible();
  });

  test('AS-ADM-018 | Reports page loads', async ({ page }) => {
    await establishAdminUiSession(page);
    await page.goto('/admin/reports');
    await expect(page.getByRole('heading', { name: 'Reports' })).toBeVisible({ timeout: 15000 });
  });

  test('AS-ADM-019 | Analytics page loads', async ({ page }) => {
    await establishAdminUiSession(page);
    await page.goto('/admin/analytics');
    await expect(page.getByRole('heading', { name: 'Analytics' })).toBeVisible({ timeout: 15000 });
  });

  test('AS-ADM-020 | Settings page loads', async ({ page }) => {
    await establishAdminUiSession(page);
    await page.goto('/admin/settings');
    await expect(page.getByRole('heading', { name: 'Settings', exact: true })).toBeVisible({
      timeout: 15000,
    });
  });

  test('AS-ADM-021 | Direct payment-verifications shows restricted stub', async ({ page }) => {
    // Production: route exists but is restricted stub; not in sidebar
    await establishAdminUiSession(page);
    await page.goto('/admin/payment-verifications');
    await expect(
      page.getByRole('heading', { name: 'Payment Verifications (Restricted)' })
    ).toBeVisible({ timeout: 15000 });
  });

  // ── Notifications ─────────────────────────────────────────────────────────
  test('AS-ADM-022 | Admin notification bell opens drawer', async ({ page }) => {
    await establishAdminUiSession(page);
    await expect(page.getByLabel('Notifications')).toBeVisible({ timeout: 15000 });
    await page.getByLabel('Notifications').click();
    await expect(page.getByRole('heading', { name: /^notifications$/i })).toBeVisible({
      timeout: 10000,
    });
  });

  // ── API health ────────────────────────────────────────────────────────────
  test('AS-ADM-023 | Authenticated GET /admin/stats succeeds', async () => {
    adminSession = await refreshAdminApiSession();
    const response = await getAdminStatsRaw(authHeaders(adminSession));
    expect(response.status).toBe(200);
    const stats = unwrapData(response.data);
    expect(stats).toMatchObject({
      totalOrders: expect.anything(),
      totalVendors: expect.anything(),
      pendingApprovals: expect.anything(),
    });
    // Production: no revenue field on /admin/stats
    expect(stats).not.toHaveProperty('revenue');
  });

  test('AS-ADM-024 | Authenticated GET /admin/users succeeds', async () => {
    const response = await getAdminUsersRaw(authHeaders(adminSession));
    expect(response.status).toBe(200);
    expect((response.data as { success?: boolean }).success).not.toBe(false);
  });

  test('AS-ADM-025 | Unauthenticated GET /admin/stats rejected', async () => {
    const response = await getAdminStatsRaw();
    expect(response.status).toBe(401);
    expect(messageOf(response.data)).toMatch(/not authorized|token/i);
  });

  test('AS-ADM-026 | Vendor GET /admin/stats forbidden', async () => {
    const vendorCreds = getVendorCredentials(1);
    const vendorSession = await loginApi(vendorCreds.mobile, vendorCreds.password);
    const response = await getAdminStatsRaw(authHeaders(vendorSession));
    expect(response.status).toBe(403);
  });

  // ── Session persistence, UI login, logout ─────────────────────────────────
  test('AS-ADM-027 | Browser refresh keeps admin on dashboard', async ({ page }) => {
    await establishAdminUiSession(page);
    await page.reload();
    await expect(page).toHaveURL(/\/admin\/dashboard/);
    await expect(
      page.getByRole('heading', { name: 'Marketplace Operations Dashboard.' })
    ).toBeVisible({ timeout: 15000 });
  });

  test('AS-ADM-028 | Admin UI login lands on admin dashboard', async ({ page }) => {
    // Placed after API-session UI tests; clear auth counters before the only UI login in suite.
    clearValidationRateLimits();
    const creds = getAdminCredentials();
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.fillMobile(creds.mobile);
    await loginPage.fillPassword(creds.password);
    await loginPage.submit();
    await expect(page).toHaveURL(/\/admin\/dashboard/, { timeout: 20000 });
    await expect(
      page.getByRole('heading', { name: 'Marketplace Operations Dashboard.' })
    ).toBeVisible({ timeout: 15000 });
    adminSession = await refreshAdminApiSession();
  });

  test('AS-ADM-029 | Logout blocks subsequent admin dashboard access', async ({ page }) => {
    await establishAdminUiSession(page);
    await logoutFlow(page);
    await page.goto('/admin/dashboard');
    await expect(page).toHaveURL(/\/login/, { timeout: 15000 });
    adminSession = await refreshAdminApiSession();
  });
});
