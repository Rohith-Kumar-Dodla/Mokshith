/**
 * Notifications Smoke Certification Suite (NS-NOT)
 *
 * Production sources of truth:
 * - GET /notifications · PATCH /notifications/:id/read · PATCH /notifications/read-all
 * - Layout bells + NotificationDrawer (vendor/admin/delivery/super-admin) — no dedicated page
 * - Producers: COD order (Order Confirmed + Order Placed), logistics assign/status (Delivery *)
 *
 * Explicitly NOT smoked (absent or non-production):
 * - Dedicated /notifications route
 * - Delete / unread-count / pagination APIs
 * - FE Socket.IO client
 * - Real email / SMS / push
 * - Inventory-originated notifications
 * - Drawer "Mark All as Read" wiring (UI button is a no-op; API works — Functional/defect track)
 * - Razorpay "Payment Successful" (verify path; COD path asserts payment method in Order Confirmed)
 */
import { test, expect } from '../fixtures/product.functional.fixture';
import { loginApi, type ApiSession } from '../helpers/auth.api.helper';
import { establishSession } from '../helpers/session.functional.helper';
import { getVendorCredentials } from '../helpers/product.credentials';
import {
  authHeaders,
  clearValidationRateLimits,
  getNotificationsRaw,
  messageOf,
  notificationIdOf,
  patchMarkAllReadRaw,
  patchMarkReadRaw,
  postLogisticsAcceptRaw,
  seedNotificationsSmokeData,
  unwrapData,
  unwrapList,
  type NotificationsSmokeSeed,
} from '../helpers/notifications.smoke.helper';

test.describe('Notifications Smoke Suite', () => {
  let adminSession: ApiSession;
  let vendorSession: ApiSession;
  let deliverySession: ApiSession;
  let seed: NotificationsSmokeSeed;

  test.beforeAll(async () => {
    clearValidationRateLimits();
    const vendorCreds = getVendorCredentials(1);
    vendorSession = await loginApi(vendorCreds.mobile, vendorCreds.password);
    const seeded = await seedNotificationsSmokeData(vendorSession);
    adminSession = seeded.adminSession;
    deliverySession = seeded.deliverySession;
    seed = seeded.seed;
    expect(seed.orderId).toBeTruthy();
    expect(seed.shipmentId).toBeTruthy();
    expect(seed.vendorNotificationIds.length).toBeGreaterThan(0);
  });

  // ── Guest / unauthenticated ───────────────────────────────────────────────
  test('NS-NOT-001 | Guest blocked from vendor dashboard', async ({ page }) => {
    await page.goto('/vendor/dashboard');
    await expect(page).toHaveURL(/\/login/);
  });

  test('NS-NOT-002 | Guest blocked from admin dashboard', async ({ page }) => {
    await page.goto('/admin/dashboard');
    await expect(page).toHaveURL(/\/login/);
  });

  test('NS-NOT-003 | Guest blocked from delivery dashboard', async ({ page }) => {
    await page.goto('/delivery/dashboard');
    await expect(page).toHaveURL(/\/login/);
  });

  test('NS-NOT-004 | Unauthenticated GET /notifications rejected', async () => {
    const response = await getNotificationsRaw();
    expect(response.status).toBe(401);
    expect(messageOf(response.data)).toMatch(/not authorized|token/i);
  });

  test('NS-NOT-005 | Unauthenticated PATCH /notifications/read-all rejected', async () => {
    const response = await patchMarkAllReadRaw();
    expect([401, 403]).toContain(response.status);
  });

  test('NS-NOT-006 | Unauthenticated PATCH /notifications/:id/read rejected', async () => {
    const id = seed.vendorNotificationIds[0] || '000000000000000000000001';
    const response = await patchMarkReadRaw(id);
    expect([401, 403]).toContain(response.status);
  });

  // ── Authenticated UI (bell / drawer) ──────────────────────────────────────
  test('NS-NOT-007 | Vendor notification bell loads on dashboard', async ({ page }) => {
    await establishSession(page, 'vendor');
    await page.goto('/vendor/dashboard');
    await expect(page.getByLabel('Notifications')).toBeVisible({ timeout: 15000 });
  });

  test('NS-NOT-008 | Vendor notification drawer opens with heading and list or empty', async ({
    page,
  }) => {
    await establishSession(page, 'vendor');
    await page.goto('/vendor/dashboard');
    await page.getByLabel('Notifications').click();
    await expect(page.getByRole('heading', { name: /^notifications$/i })).toBeVisible();
    const empty = page.getByText(/^no notifications$/i);
    const seededTitle = page.getByText(seed.orderConfirmedTitle).or(
      page.getByText(seed.orderPlacedTitle)
    ).or(page.getByText(seed.deliveryAssignedTitle));
    await expect(empty.or(seededTitle.first())).toBeVisible({ timeout: 15000 });
  });

  test('NS-NOT-009 | Vendor unread badge visible when unread notifications exist', async ({
    page,
  }) => {
    // Ensure at least one unread remains for badge (seed may still be unread before mark tests)
    const listRes = await getNotificationsRaw(authHeaders(vendorSession));
    expect(listRes.status).toBe(200);
    const unread = unwrapList(listRes.data).filter((n) => n.isRead !== true);
    await establishSession(page, 'vendor');
    await page.goto('/vendor/dashboard');
    const bell = page.getByLabel('Notifications');
    await expect(bell).toBeVisible({ timeout: 15000 });
    if (unread.length > 0) {
      await expect(bell.locator('span').first()).toBeVisible();
    }
  });

  test('NS-NOT-010 | Admin notification bell and drawer load', async ({ page }) => {
    await establishSession(page, 'admin');
    await page.goto('/admin/dashboard');
    await expect(page.getByLabel('Notifications')).toBeVisible({ timeout: 15000 });
    await page.getByLabel('Notifications').click();
    await expect(page.getByRole('heading', { name: /^notifications$/i })).toBeVisible();
  });

  test('NS-NOT-011 | Admin dashboard exposes Recent Activities section', async ({ page }) => {
    await establishSession(page, 'admin');
    await page.goto('/admin/dashboard');
    const heading = page.getByRole('heading', { name: /^recent activities$/i });
    await expect(heading).toBeVisible({ timeout: 15000 });
    const list = heading.locator('xpath=following-sibling::div[1]');
    await expect(
      list.getByText('No recent notifications.').or(list.locator('h3').first())
    ).toBeVisible({ timeout: 15000 });
  });

  test('NS-NOT-012 | Delivery bell shows always-on indicator and opens drawer', async ({
    page,
  }) => {
    await establishSession(page, 'delivery');
    await page.goto('/delivery/dashboard');
    const bell = page.getByLabel('Notifications');
    await expect(bell).toBeVisible({ timeout: 15000 });
    // Production DeliveryLayout always renders a red dot (not count-gated)
    await expect(bell.locator('span.bg-red-500')).toBeVisible();
    await bell.click();
    await expect(page.getByRole('heading', { name: /^notifications$/i })).toBeVisible();
  });

  test('NS-NOT-013 | Super Admin notification bell opens drawer', async ({ page }) => {
    await establishSession(page, 'superadmin');
    await page.goto('/super-admin/dashboard');
    await expect(page.getByLabel('Notifications')).toBeVisible({ timeout: 15000 });
    await page.getByLabel('Notifications').click();
    await expect(page.getByRole('heading', { name: /^notifications$/i })).toBeVisible();
  });

  // ── API list / mark / persistence ─────────────────────────────────────────
  test('NS-NOT-014 | Authenticated GET /notifications returns seeded vendor rows', async () => {
    const response = await getNotificationsRaw(authHeaders(vendorSession));
    expect(response.status).toBe(200);
    expect((response.data as { success?: boolean }).success).not.toBe(false);
    const list = unwrapList(response.data);
    expect(Array.isArray(list)).toBe(true);
    const titles = list.map((n) => String(n.title || ''));
    expect(titles).toEqual(expect.arrayContaining([seed.orderConfirmedTitle]));
    expect(titles).toEqual(expect.arrayContaining([seed.orderPlacedTitle]));
    expect(titles).toEqual(expect.arrayContaining([seed.deliveryAssignedTitle]));
  });

  test('NS-NOT-015 | Order Confirmed message includes payment method (COD path)', async () => {
    const response = await getNotificationsRaw(authHeaders(vendorSession));
    expect(response.status).toBe(200);
    const confirmed = unwrapList(response.data).find(
      (n) => String(n.title) === seed.orderConfirmedTitle
    );
    expect(confirmed).toBeTruthy();
    expect(String(confirmed?.message || '')).toMatch(/placed successfully via/i);
    expect(String(confirmed?.message || '')).toMatch(/COD|Cash/i);
  });

  test('NS-NOT-016 | Shipment assign produces Delivery Assigned for vendor', async () => {
    const response = await getNotificationsRaw(authHeaders(vendorSession));
    expect(response.status).toBe(200);
    const assigned = unwrapList(response.data).find(
      (n) => String(n.title) === seed.deliveryAssignedTitle
    );
    expect(assigned).toBeTruthy();
    expect(String(assigned?.message || '')).toMatch(
      new RegExp(`Order #${seed.orderId} has been assigned for delivery`, 'i')
    );
  });

  test('NS-NOT-017 | Delivery accept produces Delivery Accepted notification', async () => {
    const accept = await postLogisticsAcceptRaw(seed.shipmentId, authHeaders(deliverySession));
    expect(accept.status).toBe(200);

    const response = await getNotificationsRaw(authHeaders(vendorSession));
    expect(response.status).toBe(200);
    const titles = unwrapList(response.data).map((n) => String(n.title || ''));
    expect(titles).toEqual(expect.arrayContaining(['Delivery Accepted']));
  });

  test('NS-NOT-018 | PATCH mark one notification as read', async () => {
    const listRes = await getNotificationsRaw(authHeaders(vendorSession));
    expect(listRes.status).toBe(200);
    const unread = unwrapList(listRes.data).find((n) => n.isRead !== true);
    expect(unread).toBeTruthy();
    const id = notificationIdOf(unread!);
    expect(id).toBeTruthy();

    const response = await patchMarkReadRaw(id, authHeaders(vendorSession));
    expect(response.status).toBe(200);
    expect(messageOf(response.data)).toMatch(/notification marked as read/i);
    const updated = unwrapData(response.data);
    expect(Boolean(updated.isRead)).toBe(true);
  });

  test('NS-NOT-019 | Mark-read persists on subsequent GET', async () => {
    const listRes = await getNotificationsRaw(authHeaders(vendorSession));
    expect(listRes.status).toBe(200);
    const list = unwrapList(listRes.data);
    const readRow = list.find((n) => n.isRead === true);
    // After NS-NOT-018 at least one should be read
    expect(readRow).toBeTruthy();
  });

  test('NS-NOT-020 | PATCH mark all notifications as read', async () => {
    const response = await patchMarkAllReadRaw(authHeaders(vendorSession));
    expect(response.status).toBe(200);
    expect(messageOf(response.data)).toMatch(/all notifications marked as read/i);
    const list = unwrapList(response.data);
    expect(Array.isArray(list)).toBe(true);
    expect(list.every((n) => n.isRead === true)).toBe(true);
  });

  test('NS-NOT-021 | Mark-all persists — GET shows all vendor notifications read', async () => {
    const response = await getNotificationsRaw(authHeaders(vendorSession));
    expect(response.status).toBe(200);
    const list = unwrapList(response.data);
    expect(list.length).toBeGreaterThan(0);
    expect(list.every((n) => n.isRead === true)).toBe(true);
  });

  test('NS-NOT-022 | Notifications ordered newest-first (createdAt desc)', async () => {
    const response = await getNotificationsRaw(authHeaders(vendorSession));
    expect(response.status).toBe(200);
    const list = unwrapList(response.data);
    expect(list.length).toBeGreaterThan(1);
    const times = list.map((n) => new Date(String(n.createdAt || 0)).getTime());
    for (let i = 1; i < times.length; i += 1) {
      expect(times[i - 1]).toBeGreaterThanOrEqual(times[i]!);
    }
  });

  test('NS-NOT-023 | Invalid ObjectId on mark-read returns CastError 400', async () => {
    const response = await patchMarkReadRaw('not-a-valid-id', authHeaders(vendorSession));
    expect(response.status).toBe(400);
    expect(messageOf(response.data).toLowerCase()).toMatch(/invalid/);
  });

  test('NS-NOT-024 | Admin GET /notifications succeeds (includes logistics fan-out)', async () => {
    const response = await getNotificationsRaw(authHeaders(adminSession));
    expect(response.status).toBe(200);
    const list = unwrapList(response.data);
    expect(Array.isArray(list)).toBe(true);
    const titles = list.map((n) => String(n.title || ''));
    // Admins receive Delivery Assigned / Accepted from logistics notify stakeholders
    expect(
      titles.some((t) => t === seed.deliveryAssignedTitle || t === 'Delivery Accepted')
    ).toBe(true);
  });
});
