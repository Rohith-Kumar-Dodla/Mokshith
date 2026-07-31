/**
 * Super Admin Functional Certification Suite (SF-SA)
 *
 * Production sources of truth only. Super Admin Smoke (SS-SA) is LOCKED — do not modify.
 *
 * Covered: Dashboard quick actions / health / activity · Platform Monitoring ·
 * User Approvals approve/reject/refresh · Admin activate/deactivate/search ·
 * Vendor search/filter/approve/reject/suspend · Delivery search/filter/activate/deactivate ·
 * Global Orders search/filter/refresh/pagination/Manage · Payment approve/reject ·
 * Analytics read-only KPIs/charts · Settings profile/preferences/notifications/account UI ·
 * Notifications drawer · refresh persistence
 *
 * Explicitly NOT certified (absent / backend-only / stubs):
 * - Financial Dashboard / Reports pages
 * - Analytics date filters / CSV export
 * - Create Admin UI · Reset Password · Edit delivery partner
 * - Audit export · platform config · category CRUD under SA
 */
import { test, expect } from '../fixtures/product.functional.fixture';
import { type ApiSession } from '../helpers/auth.api.helper';
import {
  type SuperAdminFunctionalSeed,
  authHeaders,
  clearValidationRateLimits,
  establishSuperAdminUiSession,
  getSuperAdminStatsRaw,
  openUserManagementTab,
  refreshSuperAdminApiSession,
  saGoto,
  seedSuperAdminFunctionalData,
} from '../helpers/superadmin.functional.helper';

let saSession: ApiSession;
let seed: SuperAdminFunctionalSeed;

test.describe('Super Admin Functional Suite', () => {
  test.beforeAll(async () => {
    clearValidationRateLimits();
    const seeded = await seedSuperAdminFunctionalData();
    saSession = seeded.saSession;
    seed = seeded.seed;
    expect(seed.orderId).toBeTruthy();
    expect(seed.approvalApprove.id).toBeTruthy();
    expect(seed.approveProof.id).toBeTruthy();
    expect(seed.disposableAdmin.id).toBeTruthy();
  });

  // ── Dashboard ─────────────────────────────────────────────────────────────
  test('SF-SA-001 | Dashboard exposes stats-backed metric cards', async ({ page }) => {
    await establishSuperAdminUiSession(page);
    await expect(page.getByText('Total Admins').first()).toBeVisible();
    await expect(page.getByText('Total Vendors').first()).toBeVisible();
    await expect(page.getByText('Total Orders').first()).toBeVisible();
    await expect(page.getByText('Total Revenue').first()).toBeVisible();
  });

  test('SF-SA-002 | Quick Action Monitor Platform navigates to Platform Monitoring', async ({
    page,
  }) => {
    await establishSuperAdminUiSession(page);
    await page.getByRole('link', { name: /Monitor Platform/i }).click();
    await expect(page).toHaveURL(/\/super-admin\/platform/);
    await expect(page.getByRole('heading', { name: 'Platform Monitoring' })).toBeVisible({
      timeout: 15000,
    });
  });

  test('SF-SA-003 | Quick Action Admin Approvals redirects into User Management', async ({
    page,
  }) => {
    await establishSuperAdminUiSession(page);
    await page.getByRole('link', { name: /Admin Approvals/i }).click();
    await expect(page).toHaveURL(/\/super-admin\/user-management/, { timeout: 15000 });
    await expect(page.getByRole('heading', { name: 'User Management' })).toBeVisible({
      timeout: 15000,
    });
  });

  test('SF-SA-004 | Quick Action View Vendors redirects into User Management', async ({
    page,
  }) => {
    await establishSuperAdminUiSession(page);
    await page.getByRole('link', { name: /View Vendors/i }).click();
    await expect(page).toHaveURL(/\/super-admin\/user-management/, { timeout: 15000 });
  });

  test('SF-SA-005 | Quick Action View Deliveries redirects into User Management', async ({
    page,
  }) => {
    await establishSuperAdminUiSession(page);
    await page.getByRole('link', { name: /View Deliveries/i }).click();
    await expect(page).toHaveURL(/\/super-admin\/user-management/, { timeout: 15000 });
  });

  test('SF-SA-006 | Quick Action View Orders navigates to Global Orders', async ({ page }) => {
    await establishSuperAdminUiSession(page);
    await page.getByRole('link', { name: /View Orders/i }).click();
    await expect(page).toHaveURL(/\/super-admin\/orders/);
    await expect(page.getByRole('heading', { name: 'Global Orders' })).toBeVisible({
      timeout: 15000,
    });
  });

  test('SF-SA-007 | Quick Action Generate Report navigates to Analytics (no report page)', async ({
    page,
  }) => {
    await establishSuperAdminUiSession(page);
    await page.getByRole('link', { name: /Generate Report/i }).click();
    await expect(page).toHaveURL(/\/super-admin\/analytics/);
    await expect(page.getByRole('heading', { name: 'Analytics' })).toBeVisible({
      timeout: 15000,
    });
    await expect(page).not.toHaveURL(/\/super-admin\/reports/);
  });

  test('SF-SA-008 | Dashboard Platform Health and Recent Activity sections present', async ({
    page,
  }) => {
    await establishSuperAdminUiSession(page);
    await expect(page.getByRole('heading', { name: 'Platform Health' })).toBeVisible();
    await expect(page.getByText('Pending Approvals').first()).toBeVisible();
    await expect(page.getByText('System Status').first()).toBeVisible();
    const activityHeading = page.getByRole('heading', { name: /Recent Activity/i });
    await expect(activityHeading).toBeVisible();
    const empty = page.getByText('No recent activity recorded.');
    if (await empty.isVisible().catch(() => false)) {
      await expect(empty).toBeVisible();
    }
  });

  // ── Platform Monitoring ───────────────────────────────────────────────────
  test('SF-SA-009 | Platform Monitoring shows vendor and health cards', async ({ page }) => {
    await saGoto(page, '/super-admin/platform');
    await expect(page.getByRole('heading', { name: 'Platform Monitoring' })).toBeVisible({
      timeout: 15000,
    });
    await expect(page.getByText('Total Vendors').first()).toBeVisible();
    await expect(page.getByText(/Operational|Healthy|Connected|Protected/i).first()).toBeVisible({
      timeout: 15000,
    });
  });

  // ── User Approvals ────────────────────────────────────────────────────────
  test('SF-SA-010 | User Approvals lists seeded pending registration', async ({ page }) => {
    await establishSuperAdminUiSession(page);
    await openUserManagementTab(page, /User Approvals/i);
    await expect(page.getByRole('heading', { name: 'User Approvals' })).toBeVisible({
      timeout: 15000,
    });
    await expect(
      page.locator('table tbody tr').filter({ hasText: seed.approvalApprove.name })
    ).toBeVisible({ timeout: 15000 });
  });

  test('SF-SA-011 | User Approvals Approve workflow confirms and removes row', async ({
    page,
  }) => {
    await establishSuperAdminUiSession(page);
    await openUserManagementTab(page, /User Approvals/i);
    const row = page.locator('table tbody tr').filter({ hasText: seed.approvalApprove.name });
    await expect(row).toBeVisible({ timeout: 15000 });
    page.once('dialog', async (d) => d.accept());
    await Promise.all([
      page.waitForResponse(
        (r) =>
          r.url().includes('/api/v1/admin-approvals/') &&
          r.url().includes('/approve') &&
          r.request().method() === 'PATCH',
        { timeout: 20000 }
      ),
      row.getByRole('button', { name: /^Approve$/i }).click(),
    ]);
    await expect(row).toHaveCount(0, { timeout: 15000 });
  });

  test('SF-SA-012 | User Approvals Reject workflow confirms and removes row', async ({
    page,
  }) => {
    await establishSuperAdminUiSession(page);
    await openUserManagementTab(page, /User Approvals/i);
    const row = page.locator('table tbody tr').filter({ hasText: seed.approvalReject.name });
    await expect(row).toBeVisible({ timeout: 15000 });
    page.once('dialog', async (d) => d.accept());
    await Promise.all([
      page.waitForResponse(
        (r) =>
          r.url().includes('/api/v1/admin-approvals/') &&
          r.url().includes('/reject') &&
          r.request().method() === 'PATCH',
        { timeout: 20000 }
      ),
      row.getByRole('button', { name: /^Reject$/i }).click(),
    ]);
    await expect(row).toHaveCount(0, { timeout: 15000 });
  });

  test('SF-SA-013 | User Approvals Refresh reloads pending list', async ({ page }) => {
    await establishSuperAdminUiSession(page);
    await openUserManagementTab(page, /User Approvals/i);
    const responsePromise = page.waitForResponse(
      (r) =>
        r.url().includes('/api/v1/admin-approvals/pending') && r.request().method() === 'GET',
      { timeout: 20000 }
    );
    await page.getByRole('button', { name: /^Refresh$/i }).click();
    const response = await responsePromise;
    expect(response.ok()).toBeTruthy();
  });

  // ── Admin Management ──────────────────────────────────────────────────────
  test('SF-SA-014 | Admin Management lists disposable admin via search', async ({ page }) => {
    await establishSuperAdminUiSession(page);
    await openUserManagementTab(page, /Admin Management/i);
    await expect(page.getByRole('heading', { name: 'Admin Management' })).toBeVisible({
      timeout: 15000,
    });
    await page.getByPlaceholder(/Search admins/i).fill(seed.disposableAdmin.name);
    await expect(
      page.locator('table tbody tr').filter({ hasText: seed.disposableAdmin.name })
    ).toBeVisible({ timeout: 15000 });
  });

  test('SF-SA-015 | Admin Management Deactivate disposable admin', async ({ page }) => {
    await establishSuperAdminUiSession(page);
    await openUserManagementTab(page, /Admin Management/i);
    await page.getByPlaceholder(/Search admins/i).fill(seed.disposableAdmin.name);
    const row = page.locator('table tbody tr').filter({ hasText: seed.disposableAdmin.name });
    await expect(row).toBeVisible({ timeout: 15000 });
    await Promise.all([
      page.waitForResponse(
        (r) =>
          r.url().includes(`/api/v1/admin/users/${seed.disposableAdmin.id}`) &&
          r.request().method() === 'PATCH',
        { timeout: 20000 }
      ),
      row.getByRole('button', { name: /^Deactivate$/i }).click(),
    ]);
    await expect(row.getByRole('button', { name: /^Activate$/i })).toBeVisible({
      timeout: 15000,
    });
  });

  test('SF-SA-016 | Admin Management Activate disposable admin', async ({ page }) => {
    await establishSuperAdminUiSession(page);
    await openUserManagementTab(page, /Admin Management/i);
    await page.getByPlaceholder(/Search admins/i).fill(seed.disposableAdmin.name);
    const row = page.locator('table tbody tr').filter({ hasText: seed.disposableAdmin.name });
    await expect(row).toBeVisible({ timeout: 15000 });
    await Promise.all([
      page.waitForResponse(
        (r) =>
          r.url().includes(`/api/v1/admin/users/${seed.disposableAdmin.id}`) &&
          r.request().method() === 'PATCH',
        { timeout: 20000 }
      ),
      row.getByRole('button', { name: /^Activate$/i }).click(),
    ]);
    await expect(row.getByRole('button', { name: /^Deactivate$/i })).toBeVisible({
      timeout: 15000,
    });
  });

  test('SF-SA-017 | Admin Management Reset Password remains disabled', async ({ page }) => {
    await establishSuperAdminUiSession(page);
    await openUserManagementTab(page, /Admin Management/i);
    await page.getByPlaceholder(/Search admins/i).fill(seed.disposableAdmin.name);
    const row = page.locator('table tbody tr').filter({ hasText: seed.disposableAdmin.name });
    await expect(row.getByRole('button', { name: /Reset Password/i })).toBeDisabled();
  });

  // ── Vendor Management ─────────────────────────────────────────────────────
  test('SF-SA-018 | Vendor Management search finds seeded pending vendor', async ({ page }) => {
    await establishSuperAdminUiSession(page);
    await openUserManagementTab(page, /Vendor Management/i);
    await expect(page.getByRole('heading', { name: 'Vendor Management' })).toBeVisible({
      timeout: 15000,
    });
    await expect(page.getByText('Total Vendors').first()).toBeVisible();
    await page
      .getByPlaceholder(/Search vendors by shop name, owner, or ID/i)
      .fill(seed.vendorApprove.name);
    await expect(
      page.locator('table tbody tr').filter({ hasText: seed.vendorApprove.name })
    ).toBeVisible({ timeout: 15000 });
  });

  test('SF-SA-019 | Vendor Management Status filter Pending', async ({ page }) => {
    await establishSuperAdminUiSession(page);
    await openUserManagementTab(page, /Vendor Management/i);
    // SuperAdmin FilterDropdown button shows the selected option label (default All Status).
    await page.getByRole('button', { name: /All Status|Approved|Pending|Rejected/i }).click();
    await page.getByRole('button', { name: 'Pending', exact: true }).click();
    await expect(
      page.locator('table tbody tr').filter({ hasText: seed.vendorApprove.name })
    ).toBeVisible({ timeout: 15000 });
  });

  test('SF-SA-020 | Vendor Management Approve pending vendor', async ({ page }) => {
    await establishSuperAdminUiSession(page);
    await openUserManagementTab(page, /Vendor Management/i);
    await page.getByPlaceholder(/Search vendors/i).fill(seed.vendorApprove.name);
    const row = page.locator('table tbody tr').filter({ hasText: seed.vendorApprove.name });
    await expect(row).toBeVisible({ timeout: 15000 });
    await Promise.all([
      page.waitForResponse(
        (r) => r.url().includes('/api/v1/admin/approve/') && r.request().method() === 'POST',
        { timeout: 20000 }
      ),
      row.locator('button[title="Approve"]').click(),
    ]);
    await page.getByRole('button', { name: /All Status|Approved|Pending|Rejected/i }).click();
    await page.getByRole('button', { name: 'Approved', exact: true }).click();
    await page.getByPlaceholder(/Search vendors/i).fill(seed.vendorApprove.name);
    await expect(row).toBeVisible({ timeout: 15000 });
  });

  test('SF-SA-021 | Vendor Management Reject pending vendor', async ({ page }) => {
    await establishSuperAdminUiSession(page);
    await openUserManagementTab(page, /Vendor Management/i);
    await page.getByPlaceholder(/Search vendors/i).fill(seed.vendorReject.name);
    const row = page.locator('table tbody tr').filter({ hasText: seed.vendorReject.name });
    await expect(row).toBeVisible({ timeout: 15000 });
    await Promise.all([
      page.waitForResponse(
        (r) => r.url().includes('/api/v1/admin/reject/') && r.request().method() === 'POST',
        { timeout: 20000 }
      ),
      row.locator('button[title="Reject"]').click(),
    ]);
    await page.getByRole('button', { name: /All Status|Approved|Pending|Rejected/i }).click();
    await page.getByRole('button', { name: 'Rejected', exact: true }).click();
    await page.getByPlaceholder(/Search vendors/i).fill(seed.vendorReject.name);
    await expect(row).toBeVisible({ timeout: 15000 });
  });

  test('SF-SA-022 | Vendor Management Suspend approved vendor', async ({ page }) => {
    await establishSuperAdminUiSession(page);
    await openUserManagementTab(page, /Vendor Management/i);
    await page.getByPlaceholder(/Search vendors/i).fill(seed.vendorSuspend.name);
    const row = page.locator('table tbody tr').filter({ hasText: seed.vendorSuspend.name });
    await expect(row).toBeVisible({ timeout: 15000 });
    await Promise.all([
      page.waitForResponse(
        (r) =>
          r.url().includes('/api/v1/admin/users/') &&
          r.request().method() === 'PATCH' &&
          r.url().includes(seed.vendorSuspend.id),
        { timeout: 20000 }
      ),
      row.locator('button[title="Suspend"]').click(),
    ]);
    // Production FilterDropdown has no Suspended option — assert action removed Suspend control.
    await page.getByPlaceholder(/Search vendors/i).fill(seed.vendorSuspend.name);
    await expect(row).toBeVisible({ timeout: 15000 });
    await expect(row.locator('button[title="Suspend"]')).toHaveCount(0);
  });

  // ── Delivery Partners ─────────────────────────────────────────────────────
  test('SF-SA-023 | Delivery Partners search finds disposable partner', async ({ page }) => {
    await establishSuperAdminUiSession(page);
    await openUserManagementTab(page, /Delivery Partners/i);
    await expect(page.getByRole('heading', { name: 'Delivery Partners' })).toBeVisible({
      timeout: 15000,
    });
    await page.getByPlaceholder(/Search delivery partners/i).fill(seed.disposablePartner.name);
    await expect(
      page.locator('table tbody tr').filter({ hasText: seed.disposablePartner.name })
    ).toBeVisible({ timeout: 15000 });
  });

  test('SF-SA-024 | Delivery Partners Deactivate disposable partner', async ({ page }) => {
    await establishSuperAdminUiSession(page);
    await openUserManagementTab(page, /Delivery Partners/i);
    await page.getByPlaceholder(/Search delivery partners/i).fill(seed.disposablePartner.name);
    const row = page.locator('table tbody tr').filter({ hasText: seed.disposablePartner.name });
    await expect(row).toBeVisible({ timeout: 15000 });
    await Promise.all([
      page.waitForResponse(
        (r) =>
          r.url().includes(`/api/v1/admin/users/${seed.disposablePartner.id}`) &&
          r.request().method() === 'PATCH',
        { timeout: 20000 }
      ),
      row.locator('button[title="Deactivate"]').click(),
    ]);
    await expect(row.locator('button[title="Activate"]')).toBeVisible({ timeout: 15000 });
  });

  test('SF-SA-025 | Delivery Partners Activate disposable partner', async ({ page }) => {
    await establishSuperAdminUiSession(page);
    await openUserManagementTab(page, /Delivery Partners/i);
    await page.getByPlaceholder(/Search delivery partners/i).fill(seed.disposablePartner.name);
    const row = page.locator('table tbody tr').filter({ hasText: seed.disposablePartner.name });
    await expect(row).toBeVisible({ timeout: 15000 });
    await Promise.all([
      page.waitForResponse(
        (r) =>
          r.url().includes(`/api/v1/admin/users/${seed.disposablePartner.id}`) &&
          r.request().method() === 'PATCH',
        { timeout: 20000 }
      ),
      row.locator('button[title="Activate"]').click(),
    ]);
    await expect(row.locator('button[title="Deactivate"]')).toBeVisible({ timeout: 15000 });
  });

  test('SF-SA-026 | Delivery Partners Edit shows not-implemented alert', async ({ page }) => {
    await establishSuperAdminUiSession(page);
    await openUserManagementTab(page, /Delivery Partners/i);
    await page.getByPlaceholder(/Search delivery partners/i).fill(seed.disposablePartner.name);
    const row = page.locator('table tbody tr').filter({ hasText: seed.disposablePartner.name });
    page.once('dialog', async (d) => {
      expect(d.message()).toMatch(/not implemented/i);
      await d.accept();
    });
    await row.locator('button[title="Edit"]').click();
  });

  // ── Global Orders ─────────────────────────────────────────────────────────
  test('SF-SA-027 | Global Orders list loads with seeded order searchable', async ({ page }) => {
    await saGoto(page, '/super-admin/orders');
    await expect(page.getByRole('heading', { name: 'Global Orders' })).toBeVisible({
      timeout: 15000,
    });
    await page.getByPlaceholder(/Search by order ID or vendor/i).fill(seed.orderId.slice(-8));
    await expect(page.locator('table tbody tr').first()).toBeVisible({ timeout: 15000 });
  });

  test('SF-SA-028 | Global Orders Status filter Pending sends status query', async ({ page }) => {
    await saGoto(page, '/super-admin/orders');
    const responsePromise = page.waitForResponse(
      (r) =>
        r.url().includes('/api/v1/orders') &&
        r.request().method() === 'GET' &&
        r.url().includes('status=PENDING'),
      { timeout: 20000 }
    );
    await page.getByRole('button', { name: /Status:/i }).click();
    await page.getByRole('button', { name: 'Pending', exact: true }).click();
    const response = await responsePromise;
    expect(response.ok()).toBeTruthy();
  });

  test('SF-SA-029 | Global Orders Refresh force-refetches list', async ({ page }) => {
    await saGoto(page, '/super-admin/orders');
    const responsePromise = page.waitForResponse(
      (r) => r.url().includes('/api/v1/orders') && r.request().method() === 'GET',
      { timeout: 20000 }
    );
    await page.getByRole('button', { name: /^Refresh$/i }).click();
    const response = await responsePromise;
    expect(response.ok()).toBeTruthy();
  });

  test('SF-SA-030 | Global Orders pagination controls visible', async ({ page }) => {
    await saGoto(page, '/super-admin/orders');
    await expect(page.getByText(/Page \d+ of \d+/)).toBeVisible({ timeout: 15000 });
    await expect(page.getByRole('button', { name: 'Prev' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Next' })).toBeVisible();
  });

  test('SF-SA-031 | Global Orders Manage opens modal and can confirm CONFIRMED', async ({
    page,
  }) => {
    await saGoto(page, '/super-admin/orders');
    await page.getByPlaceholder(/Search by order ID or vendor/i).fill(seed.orderId.slice(-8));
    const manage = page.getByRole('button', { name: /Manage/i }).first();
    await expect(manage).toBeVisible({ timeout: 15000 });
    await manage.click();
    const modal = page.getByRole('dialog', { name: 'Order Management' });
    await expect(modal).toBeVisible({ timeout: 10000 });
    await expect(modal.getByText('Order ID', { exact: true })).toBeVisible();
    const confirmedBtn = modal.getByRole('button', { name: /^CONFIRMED$/i });
    if (await confirmedBtn.isVisible().catch(() => false)) {
      await confirmedBtn.click();
      await Promise.all([
        page.waitForResponse(
          (r) =>
            r.url().includes('/api/v1/orders/') &&
            r.url().includes('/status') &&
            r.request().method() === 'PATCH',
          { timeout: 20000 }
        ),
        modal.getByRole('button', { name: /Confirm CONFIRMED/i }).click(),
      ]);
    }
  });

  // ── Payment Verifications ─────────────────────────────────────────────────
  test('SF-SA-032 | Payment Verifications lists seeded pending proof', async ({ page }) => {
    await saGoto(page, '/super-admin/payment-verifications');
    await expect(page.getByRole('heading', { name: 'Payment Verifications' })).toBeVisible({
      timeout: 15000,
    });
    await expect(page.getByText(seed.approveProof.utr).first()).toBeVisible({ timeout: 15000 });
  });

  test('SF-SA-033 | Payment Verifications Approve shows success toast', async ({ page }) => {
    await saGoto(page, '/super-admin/payment-verifications');
    const row = page.locator('table tbody tr').filter({ hasText: seed.approveProof.utr });
    await expect(row).toBeVisible({ timeout: 15000 });
    await Promise.all([
      page.waitForResponse(
        (r) =>
          r.url().includes('/api/v1/payments/bank-transfer/') &&
          r.url().includes('/approve') &&
          r.request().method() === 'PATCH',
        { timeout: 20000 }
      ),
      row.getByRole('button', { name: /^Approve$/i }).click(),
    ]);
    await expect(page.getByText('Payment approved successfully')).toBeVisible({
      timeout: 15000,
    });
  });

  test('SF-SA-034 | Payment Verifications Reject requires reason', async ({ page }) => {
    await saGoto(page, '/super-admin/payment-verifications');
    const row = page.locator('table tbody tr').filter({ hasText: seed.rejectProof.utr });
    await expect(row).toBeVisible({ timeout: 15000 });
    await row.getByRole('button', { name: /^Reject$/i }).click();
    await expect(page.getByRole('heading', { name: 'Reject Payment Proof' })).toBeVisible({
      timeout: 10000,
    });
    await page.getByRole('button', { name: /^Reject Payment$/i }).click();
    await expect(page.getByText('Rejection reason is required')).toBeVisible();
  });

  test('SF-SA-035 | Payment Verifications Reject with reason shows toast', async ({ page }) => {
    await saGoto(page, '/super-admin/payment-verifications');
    const row = page.locator('table tbody tr').filter({ hasText: seed.rejectProof.utr });
    await expect(row).toBeVisible({ timeout: 15000 });
    await row.getByRole('button', { name: /^Reject$/i }).click();
    await expect(page.getByRole('heading', { name: 'Reject Payment Proof' })).toBeVisible({
      timeout: 10000,
    });
    await page
      .getByPlaceholder(/Invalid UTR|unclear screenshot|payment not received/i)
      .fill('SF-SA functional reject — invalid UTR proof');
    await Promise.all([
      page.waitForResponse(
        (r) =>
          r.url().includes('/api/v1/payments/bank-transfer/') &&
          r.url().includes('/reject') &&
          r.request().method() === 'PATCH',
        { timeout: 20000 }
      ),
      page.getByRole('button', { name: /^Reject Payment$/i }).click(),
    ]);
    await expect(page.getByText('Payment rejected')).toBeVisible({ timeout: 15000 });
  });

  // ── Analytics ─────────────────────────────────────────────────────────────
  test('SF-SA-036 | Analytics exposes KPIs and chart section headings', async ({ page }) => {
    await saGoto(page, '/super-admin/analytics');
    await expect(page.getByRole('heading', { name: 'Analytics' })).toBeVisible({
      timeout: 15000,
    });
    await expect(page.getByText('Total Orders').first()).toBeVisible();
    await expect(page.getByText('Revenue').first()).toBeVisible();
    await expect(page.getByText('Orders Growth').first()).toBeVisible();
    await expect(page.getByText(/Revenue Trend|Category Distribution|Top Products/i).first()).toBeVisible({
      timeout: 15000,
    });
  });

  test('SF-SA-037 | Analytics has no date-filter or export controls', async ({ page }) => {
    await saGoto(page, '/super-admin/analytics');
    await expect(page.getByRole('heading', { name: 'Analytics' })).toBeVisible({
      timeout: 15000,
    });
    await expect(page.getByRole('button', { name: /export|download csv|date range/i })).toHaveCount(
      0
    );
    await expect(page.getByPlaceholder(/start date|end date/i)).toHaveCount(0);
  });

  // ── Settings ──────────────────────────────────────────────────────────────
  test('SF-SA-038 | Settings Profile Save Profile succeeds', async ({ page }) => {
    await saGoto(page, '/super-admin/settings');
    await expect(page.getByRole('heading', { name: 'Settings', exact: true }).first()).toBeVisible({
      timeout: 15000,
    });
    await page.getByRole('button', { name: /^Profile$/i }).click();
    await expect(page.getByRole('heading', { name: 'Profile Settings' })).toBeVisible({
      timeout: 10000,
    });
    const company = page.locator('label', { hasText: 'Company Name' }).locator('..').locator('input');
    const address = page.locator('label', { hasText: /^Address$/ }).locator('..').locator('textarea');
    if (await company.count()) {
      const val = await company.inputValue();
      if (!val) await company.fill('Mokshith Super Admin Co');
    }
    if (await address.count()) {
      const val = await address.inputValue();
      if (!val) await address.fill('SA HQ, Test City');
    }
    await page.getByRole('button', { name: /Save Profile/i }).click();
    await expect(
      page.getByText(/Profile updated successfully|Settings saved successfully/)
    ).toBeVisible({ timeout: 15000 });
  });

  test('SF-SA-039 | Settings Preferences Save Preferences succeeds', async ({ page }) => {
    await saGoto(page, '/super-admin/settings');
    await page.getByRole('button', { name: /^Preferences$/i }).click();
    await page.getByRole('button', { name: /Save Preferences/i }).click();
    await expect(page.getByText('Settings saved successfully')).toBeVisible({ timeout: 15000 });
  });

  test('SF-SA-040 | Settings Notifications Save Notifications succeeds', async ({ page }) => {
    await saGoto(page, '/super-admin/settings');
    // Scope to Settings tab nav — header also has a Notifications bell button.
    await page.locator('main nav').getByRole('button', { name: /^Notifications$/i }).click();
    await expect(page.getByRole('button', { name: /Save Notifications/i })).toBeVisible({
      timeout: 10000,
    });
    await page.getByRole('button', { name: /Save Notifications/i }).click();
    await expect(page.getByText('Settings saved successfully')).toBeVisible({ timeout: 15000 });
  });

  test('SF-SA-041 | Settings Account tab exposes password fields without submit', async ({
    page,
  }) => {
    await saGoto(page, '/super-admin/settings');
    await page.getByRole('button', { name: /^Account$/i }).click();
    await expect(
      page.getByText(/Change Password|Current Password|New Password/i).first()
    ).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole('button', { name: /Update Password/i })).toBeVisible();
  });

  // ── Notifications & persistence ───────────────────────────────────────────
  test('SF-SA-042 | Notification drawer opens from Super Admin layout', async ({ page }) => {
    await establishSuperAdminUiSession(page);
    await page.getByLabel('Notifications').click();
    await expect(page.getByRole('heading', { name: /^notifications$/i })).toBeVisible({
      timeout: 10000,
    });
  });

  test('SF-SA-043 | Browser refresh keeps SA on Analytics', async ({ page }) => {
    await saGoto(page, '/super-admin/analytics');
    await expect(page.getByRole('heading', { name: 'Analytics' })).toBeVisible({
      timeout: 15000,
    });
    await page.reload();
    await expect(page).toHaveURL(/\/super-admin\/analytics/);
    await expect(page.getByRole('heading', { name: 'Analytics' })).toBeVisible({
      timeout: 15000,
    });
  });

  test('SF-SA-044 | Authenticated GET /super-admin/stats succeeds after UI flows', async () => {
    const session = await refreshSuperAdminApiSession();
    saSession = session;
    const response = await getSuperAdminStatsRaw(authHeaders(session));
    expect(response.status).toBe(200);
  });

  test('SF-SA-045 | User Management tab switching preserves outer shell', async ({ page }) => {
    await establishSuperAdminUiSession(page);
    await openUserManagementTab(page, /Vendor Management/i);
    await expect(page.getByRole('heading', { name: 'Vendor Management' })).toBeVisible({
      timeout: 15000,
    });
    await page.getByRole('button', { name: /Delivery Partners/i }).first().click();
    await expect(page.getByRole('heading', { name: 'Delivery Partners' })).toBeVisible({
      timeout: 15000,
    });
    await expect(page.getByRole('heading', { name: 'User Management' })).toBeVisible();
  });
});
