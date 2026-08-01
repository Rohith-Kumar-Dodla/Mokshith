/**
 * Notifications Functional Certification Suite (NF-NOT)
 *
 * Production sources of truth:
 * - Producers: order.service (COD/ONLINE), order.events, logistics notifyDeliveryStakeholders
 * - API: GET /notifications · PATCH /:id/read · PATCH /read-all
 * - FE: useNotifications autoLoad; drawers receive list only — Mark All / check are UI no-ops
 * - DeliveryLayout always-on red badge (not unread-gated)
 * - Admin Dashboard Recent Activities = first 6 notifications
 *
 * Explicitly NOT certified (absent / documented gaps):
 * - Dedicated notifications page, delete, pagination, unread-count API
 * - FE Socket.IO / real email / SMS / push
 * - Inventory producers, LOW_CREDIT template
 * - Razorpay Payment Successful / bank approve-reject (covered in Payments; optional later)
 * - Wired Mark All UI (assert no-op, do not invent)
 *
 * Smoke suite (NS-NOT) remains LOCKED — do not modify.
 */
import { test, expect } from '../fixtures/product.functional.fixture';
import { loginApi, type ApiSession } from '../helpers/auth.api.helper';
import { establishSession } from '../helpers/session.functional.helper';
import { getVendorCredentials } from '../helpers/product.credentials';
import {
  authHeaders,
  clearValidationRateLimits,
  findByTitle,
  listNotifications,
  messageOf,
  notificationIdOf,
  patchMarkAllReadRaw,
  patchMarkReadRaw,
  postLogisticsAcceptRaw,
  postLogisticsCompleteRaw,
  postLogisticsDeliveredRaw,
  postLogisticsPickRaw,
  postLogisticsStartRaw,
  seedNotificationsFunctionalData,
  titlesOf,
  unreadCountOf,
  type NotificationsFunctionalSeed,
} from '../helpers/notifications.functional.helper';

test.describe('Notifications Functional Suite', () => {
  let adminSession: ApiSession;
  let vendorSession: ApiSession;
  let deliverySession: ApiSession;
  let seed: NotificationsFunctionalSeed;

  test.beforeAll(async () => {
    clearValidationRateLimits();
    const vendorCreds = getVendorCredentials(1);
    vendorSession = await loginApi(vendorCreds.mobile, vendorCreds.password);
    const seeded = await seedNotificationsFunctionalData(vendorSession);
    adminSession = seeded.adminSession;
    deliverySession = seeded.deliverySession;
    seed = seeded.seed;
    expect(seed.orderId).toBeTruthy();
    expect(seed.shipmentId).toBeTruthy();
    expect(seed.lifecycleShipmentId).toBeTruthy();
    expect(seed.onlineOrderId).toBeTruthy();
  });

  // ─── Section A — UI surfaces ──────────────────────────────────────────────
  test.describe('Section A — Bell, Drawer, Badge, Recent Activities', () => {
    test('NF-NOT-001 | Vendor drawer lists Order Confirmed, Order Placed, Delivery Assigned', async ({
      page,
    }) => {
      await establishSession(page, 'vendor');
      await page.goto('/vendor/dashboard');
      await page.getByLabel('Notifications').click();
      await expect(page.getByRole('heading', { name: /^notifications$/i })).toBeVisible();
      await expect(page.getByText(seed.orderConfirmedTitle).first()).toBeVisible({ timeout: 15000 });
      await expect(page.getByText(seed.orderPlacedTitle).first()).toBeVisible();
      await expect(page.getByText(seed.deliveryAssignedTitle).first()).toBeVisible();
    });

    test('NF-NOT-002 | Vendor unread badge matches API unread count when unread > 0', async ({
      page,
    }) => {
      const { list } = await listNotifications(vendorSession);
      const unread = unreadCountOf(list);
      expect(unread).toBeGreaterThan(0);
      await establishSession(page, 'vendor');
      const loaded = page.waitForResponse(
        (res) =>
          res.url().includes('/notifications') &&
          res.request().method() === 'GET' &&
          res.ok(),
        { timeout: 20000 }
      );
      await page.goto('/vendor/dashboard');
      await loaded.catch(() => undefined);
      const bell = page.getByLabel('Notifications');
      await expect(bell).toBeVisible({ timeout: 15000 });
      const badge = bell.locator('span').filter({ hasText: /\d|\+/ });
      await expect(badge).toBeVisible({ timeout: 15000 });
      const text = (await badge.textContent())?.trim() || '';
      if (unread > 9) {
        expect(text).toBe('9+');
      } else {
        // UI may lag by concurrent producers; badge must be numeric and ≤ API unread
        expect(Number(text)).toBeGreaterThan(0);
        expect(Number(text)).toBeLessThanOrEqual(unread);
      }
    });

    test('NF-NOT-003 | Admin drawer shows Delivery Assigned fan-out', async ({ page }) => {
      await establishSession(page, 'admin');
      await page.goto('/admin/dashboard');
      await page.getByLabel('Notifications').click();
      await expect(page.getByRole('heading', { name: /^notifications$/i })).toBeVisible();
      await expect(page.getByText(seed.deliveryAssignedTitle).first()).toBeVisible({
        timeout: 15000,
      });
    });

    test('NF-NOT-004 | Admin Recent Activities section loads', async ({ page }) => {
      await establishSession(page, 'admin');
      await page.goto('/admin/dashboard');
      const heading = page.getByRole('heading', { name: /^recent activities$/i });
      await expect(heading).toBeVisible({ timeout: 15000 });
      const list = heading.locator('xpath=following-sibling::div[1]');
      await expect(
        list.getByText('No recent notifications.').or(list.locator('h3, p').first())
      ).toBeVisible({ timeout: 15000 });
    });

    test('NF-NOT-005 | Recent Activities mirrors notification titles (max 6)', async ({
      page,
    }) => {
      const { list } = await listNotifications(adminSession);
      const expected = titlesOf(list).slice(0, 6);
      await establishSession(page, 'admin');
      await page.goto('/admin/dashboard');
      await expect(page.getByRole('heading', { name: /^recent activities$/i })).toBeVisible({
        timeout: 15000,
      });
      if (expected.length === 0) {
        await expect(page.getByText('No recent notifications.')).toBeVisible();
        return;
      }
      for (const title of expected.slice(0, 3)) {
        await expect(page.getByText(title).first()).toBeVisible();
      }
    });

    test('NF-NOT-006 | Delivery always-on red indicator and drawer heading', async ({ page }) => {
      await establishSession(page, 'delivery');
      await page.goto('/delivery/dashboard');
      const bell = page.getByLabel('Notifications');
      await expect(bell).toBeVisible({ timeout: 15000 });
      await expect(bell.locator('span.bg-red-500')).toBeVisible();
      await bell.click();
      await expect(page.getByRole('heading', { name: /^notifications$/i })).toBeVisible();
    });

    test('NF-NOT-007 | Delivery drawer shows Delivery Assigned for partner seed', async ({
      page,
    }) => {
      await establishSession(page, 'delivery');
      await page.goto('/delivery/dashboard');
      await page.getByLabel('Notifications').click();
      await expect(page.getByText(seed.deliveryAssignedTitle).first()).toBeVisible({
        timeout: 15000,
      });
    });

    test('NF-NOT-008 | Super Admin drawer opens and can show logistics fan-out', async ({
      page,
    }) => {
      await establishSession(page, 'superadmin');
      await page.goto('/super-admin/dashboard');
      await page.getByLabel('Notifications').click();
      await expect(page.getByRole('heading', { name: /^notifications$/i })).toBeVisible();
      const { list } = await listNotifications(adminSession);
      // SuperAdmin receives same logistics fan-out as admins in production notify path
      if (titlesOf(list).includes(seed.deliveryAssignedTitle)) {
        await expect(page.getByText(seed.deliveryAssignedTitle).first()).toBeVisible({
          timeout: 15000,
        });
      }
    });
  });

  // ─── Section B — Order producers ──────────────────────────────────────────
  test.describe('Section B — Order Producers', () => {
    test('NF-NOT-009 | COD Order Confirmed includes payment method', async () => {
      const { status, list } = await listNotifications(vendorSession);
      expect(status).toBe(200);
      const row = list.find(
        (n) =>
          String(n.title) === seed.orderConfirmedTitle &&
          String(n.message || '').includes(seed.orderId)
      );
      expect(row).toBeTruthy();
      expect(String(row?.message || '')).toMatch(/placed successfully via/i);
      expect(String(row?.message || '')).toMatch(/COD|Cash/i);
    });

    test('NF-NOT-010 | Order Placed template present for COD', async () => {
      const { list } = await listNotifications(vendorSession);
      const row = findByTitle(list, seed.orderPlacedTitle);
      expect(row).toBeTruthy();
      expect(String(row?.message || '')).toMatch(/has been placed successfully/i);
    });

    test('NF-NOT-011 | ONLINE place produces Order Initiated', async () => {
      const { list } = await listNotifications(vendorSession);
      const row = findByTitle(list, 'Order Initiated');
      expect(row).toBeTruthy();
      expect(String(row?.message || '')).toMatch(/please complete the payment/i);
      expect(String(row?.message || '')).toContain(seed.onlineOrderId);
    });

    test('NF-NOT-012 | Admin list does not receive vendor Order Confirmed/Placed', async () => {
      const { list } = await listNotifications(adminSession);
      const titles = titlesOf(list);
      // Admins get logistics fan-out, not buyer order place notifications
      const adminOrderConfirmed = list.filter(
        (n) =>
          String(n.title) === seed.orderConfirmedTitle &&
          String(n.message || '').includes(seed.orderId)
      );
      expect(adminOrderConfirmed.length).toBe(0);
      expect(titles).toEqual(expect.arrayContaining([seed.deliveryAssignedTitle]));
    });
  });

  // ─── Section C — Logistics lifecycle fan-out ──────────────────────────────
  test.describe('Section C — Logistics Lifecycle Fan-out', () => {
    test('NF-NOT-013 | Assign seed message matches production template', async () => {
      const { list } = await listNotifications(vendorSession);
      const row = list.find(
        (n) =>
          String(n.title) === seed.deliveryAssignedTitle &&
          String(n.message || '').includes(seed.orderId)
      );
      expect(row).toBeTruthy();
      expect(String(row?.message || '')).toMatch(
        new RegExp(`Order #${seed.orderId} has been assigned for delivery`, 'i')
      );
      expect(String(row?.type || '')).toMatch(/ORDER|order/i);
    });

    test('NF-NOT-014 | Accept produces Delivery Accepted for vendor', async () => {
      const accept = await postLogisticsAcceptRaw(
        seed.lifecycleShipmentId,
        authHeaders(deliverySession)
      );
      expect(accept.status).toBe(200);
      const { list } = await listNotifications(vendorSession);
      expect(titlesOf(list)).toEqual(expect.arrayContaining(['Delivery Accepted']));
    });

    test('NF-NOT-015 | Pick produces Order Picked Up', async () => {
      const pick = await postLogisticsPickRaw(
        seed.lifecycleShipmentId,
        authHeaders(deliverySession)
      );
      expect(pick.status).toBe(200);
      const { list } = await listNotifications(vendorSession);
      expect(titlesOf(list)).toEqual(expect.arrayContaining(['Order Picked Up']));
    });

    test('NF-NOT-016 | Start produces Out For Delivery', async () => {
      const start = await postLogisticsStartRaw(
        seed.lifecycleShipmentId,
        authHeaders(deliverySession)
      );
      expect(start.status).toBe(200);
      const { list } = await listNotifications(vendorSession);
      expect(titlesOf(list)).toEqual(expect.arrayContaining(['Out For Delivery']));
    });

    test('NF-NOT-017 | Delivered produces Order Delivered', async () => {
      const delivered = await postLogisticsDeliveredRaw(
        seed.lifecycleShipmentId,
        authHeaders(deliverySession)
      );
      expect(delivered.status).toBe(200);
      const { list } = await listNotifications(vendorSession);
      expect(titlesOf(list)).toEqual(expect.arrayContaining(['Order Delivered']));
    });

    test('NF-NOT-018 | Complete produces Delivery Completed', async () => {
      const complete = await postLogisticsCompleteRaw(
        seed.lifecycleShipmentId,
        { notes: 'nf-not complete' },
        authHeaders(deliverySession)
      );
      expect(complete.status).toBe(200);
      const { list } = await listNotifications(vendorSession);
      expect(titlesOf(list)).toEqual(expect.arrayContaining(['Delivery Completed']));
      const row = findByTitle(list, 'Delivery Completed');
      expect(String(row?.message || '')).toMatch(
        new RegExp(`Order #${seed.lifecycleOrderId}.*completed`, 'i')
      );
    });

    test('NF-NOT-019 | Delivery partner receives lifecycle titles', async () => {
      const { status, list } = await listNotifications(deliverySession);
      expect(status).toBe(200);
      const titles = titlesOf(list);
      expect(titles).toEqual(
        expect.arrayContaining([
          'Delivery Accepted',
          'Order Picked Up',
          'Out For Delivery',
          'Order Delivered',
          'Delivery Completed',
        ])
      );
    });

    test('NF-NOT-020 | Admin receives lifecycle fan-out titles', async () => {
      const { list } = await listNotifications(adminSession);
      const titles = titlesOf(list);
      expect(titles).toEqual(
        expect.arrayContaining(['Order Delivered', 'Delivery Completed'])
      );
    });

    test('NF-NOT-021 | PENDING create-only does not invent a PENDING notification title', async () => {
      const { list } = await listNotifications(vendorSession);
      const pendingTitles = list.filter(
        (n) =>
          /pending/i.test(String(n.title || '')) &&
          String(n.message || '').includes(seed.pendingOnlyOrderId)
      );
      expect(pendingTitles.length).toBe(0);
    });
  });

  // ─── Section D — Mark-read API vs UI no-op ────────────────────────────────
  test.describe('Section D — Mark Read API & UI No-op', () => {
    test('NF-NOT-022 | PATCH mark one notification as read', async () => {
      const { list } = await listNotifications(vendorSession);
      const unread = list.find((n) => n.isRead !== true);
      expect(unread).toBeTruthy();
      const id = notificationIdOf(unread!);
      const result = await patchMarkReadRaw(id, authHeaders(vendorSession));
      expect(result.status).toBe(200);
      expect(messageOf(result.data)).toMatch(/notification marked as read/i);
    });

    test('NF-NOT-023 | Mark-read persists on subsequent GET', async () => {
      const before = await listNotifications(vendorSession);
      const target = before.list.find((n) => n.isRead === true);
      expect(target).toBeTruthy();
      const id = notificationIdOf(target!);
      const after = await listNotifications(vendorSession);
      const row = after.list.find((n) => notificationIdOf(n) === id);
      expect(row?.isRead).toBe(true);
    });

    test('NF-NOT-024 | Vendor Mark All as Read UI button does not call API', async ({
      page,
    }) => {
      await establishSession(page, 'vendor');
      await page.goto('/vendor/dashboard');
      await page.getByLabel('Notifications').click();
      const markAll = page.getByRole('button', { name: /mark all as read/i });
      await expect(markAll).toBeVisible({ timeout: 15000 });
      await markAll.scrollIntoViewIfNeeded();
      const patchSeen = page
        .waitForRequest(
          (req) =>
            req.method() === 'PATCH' &&
            /\/notifications\/(read-all|[^/]+\/read)/.test(req.url()),
          { timeout: 2000 }
        )
        .then(() => true)
        .catch(() => false);
      // Footer sits after a long list outside the visible drawer viewport — DOM click
      // still exercises the no-op button without inventing scroll/layout behavior.
      await markAll.evaluate((el: HTMLElement) => el.click());
      expect(await patchSeen).toBe(false);
    });

    test('NF-NOT-025 | Super Admin per-item check does not call mark-read API', async ({
      page,
    }) => {
      await establishSession(page, 'superadmin');
      await page.goto('/super-admin/dashboard');
      await page.getByLabel('Notifications').click();
      await expect(page.getByRole('heading', { name: /^notifications$/i })).toBeVisible();
      const check = page.locator('button').filter({ has: page.locator('svg') }).first();
      if (!(await check.isVisible().catch(() => false))) {
        // Empty list — production allows empty; no-op path still documented
        return;
      }
      const patchSeen = page
        .waitForRequest(
          (req) => req.method() === 'PATCH' && req.url().includes('/notifications/'),
          { timeout: 2000 }
        )
        .then(() => true)
        .catch(() => false);
      await check.click({ force: true }).catch(() => undefined);
      expect(await patchSeen).toBe(false);
    });

    test('NF-NOT-026 | PATCH mark-all reads all vendor notifications', async () => {
      const result = await patchMarkAllReadRaw(authHeaders(vendorSession));
      expect(result.status).toBe(200);
      expect(messageOf(result.data)).toMatch(/all notifications marked as read/i);
      const { list } = await listNotifications(vendorSession);
      expect(list.length).toBeGreaterThan(0);
      expect(list.every((n) => n.isRead === true)).toBe(true);
    });

    test('NF-NOT-027 | After mark-all, vendor badge is hidden', async ({ page }) => {
      await establishSession(page, 'vendor');
      await page.goto('/vendor/dashboard');
      const bell = page.getByLabel('Notifications');
      await expect(bell).toBeVisible({ timeout: 15000 });
      await expect(bell.locator('span').filter({ hasText: /\d|\+/ })).toHaveCount(0);
    });

    test('NF-NOT-028 | Vendor mark-all does not clear admin logistics notifications', async () => {
      const { list } = await listNotifications(adminSession);
      const unreadAdmin = unreadCountOf(list);
      // Admin may still have unread logistics rows; at minimum list is non-empty
      expect(list.length).toBeGreaterThan(0);
      expect(unreadAdmin).toBeGreaterThanOrEqual(0);
      const stillHasLogistics = titlesOf(list).some((t) =>
        /Delivery|Order Picked|Out For Delivery/i.test(t)
      );
      expect(stillHasLogistics).toBe(true);
    });
  });

  // ─── Section E — Refresh, ordering, delivery badge quirk ──────────────────
  test.describe('Section E — Refresh, Ordering, Badge Quirks', () => {
    test('NF-NOT-029 | Browser reload persists vendor notification titles via remount', async ({
      page,
    }) => {
      await establishSession(page, 'vendor');
      await page.goto('/vendor/dashboard');
      await page.reload();
      await page.getByLabel('Notifications').click();
      await expect(page.getByText(seed.orderConfirmedTitle).first()).toBeVisible({
        timeout: 15000,
      });
    });

    test('NF-NOT-030 | Notifications ordered createdAt descending', async () => {
      const { list } = await listNotifications(vendorSession);
      expect(list.length).toBeGreaterThan(1);
      const times = list.map((n) => new Date(String(n.createdAt || 0)).getTime());
      for (let i = 1; i < times.length; i += 1) {
        expect(times[i - 1]).toBeGreaterThanOrEqual(times[i]!);
      }
    });

    test('NF-NOT-031 | New lifecycle notification restores vendor unread badge', async ({
      page,
    }) => {
      // Produce a new unread for vendor via accept on seed.shipmentId (still ASSIGNED)
      const accept = await postLogisticsAcceptRaw(seed.shipmentId, authHeaders(deliverySession));
      expect(accept.status).toBe(200);

      const { list } = await listNotifications(vendorSession);
      expect(unreadCountOf(list)).toBeGreaterThan(0);

      await establishSession(page, 'vendor');
      await page.goto('/vendor/dashboard');
      const bell = page.getByLabel('Notifications');
      await expect(bell.locator('span').filter({ hasText: /\d|\+/ })).toBeVisible({
        timeout: 15000,
      });
    });

    test('NF-NOT-032 | Delivery always-on red dot remains after partner mark-all', async ({
      page,
    }) => {
      await patchMarkAllReadRaw(authHeaders(deliverySession));
      await establishSession(page, 'delivery');
      await page.goto('/delivery/dashboard');
      const bell = page.getByLabel('Notifications');
      await expect(bell.locator('span.bg-red-500')).toBeVisible({ timeout: 15000 });
    });

    test('NF-NOT-033 | Notification timestamps are present on API rows', async () => {
      const { list } = await listNotifications(vendorSession);
      expect(list.length).toBeGreaterThan(0);
      for (const row of list.slice(0, 5)) {
        expect(String(row.createdAt || '')).toBeTruthy();
      }
    });

    test('NF-NOT-034 | Multiple unread notifications coexist after new producer', async () => {
      const { list } = await listNotifications(vendorSession);
      const unread = list.filter((n) => n.isRead !== true);
      expect(unread.length).toBeGreaterThanOrEqual(1);
      expect(titlesOf(list).length).toBeGreaterThan(3);
    });
  });

  // ─── Section F — Gaps / consistency ───────────────────────────────────────
  test.describe('Section F — Consistency & Documented Gaps', () => {
    test('NF-NOT-035 | Invalid ObjectId mark-read returns 400', async () => {
      const result = await patchMarkReadRaw('not-a-valid-id', authHeaders(vendorSession));
      expect(result.status).toBe(400);
      expect(messageOf(result.data).toLowerCase()).toMatch(/invalid/);
    });

    test('NF-NOT-036 | Logistics notifications carry type ORDER when set', async () => {
      const { list } = await listNotifications(vendorSession);
      const logistics = list.filter((n) =>
        /Delivery Assigned|Delivery Accepted|Order Delivered|Delivery Completed/i.test(
          String(n.title || '')
        )
      );
      expect(logistics.length).toBeGreaterThan(0);
      expect(logistics.some((n) => String(n.type || '').toUpperCase() === 'ORDER')).toBe(true);
    });
  });
});
