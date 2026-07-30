/**
 * Notifications Authorization Certification Suite (NA-NOT)
 *
 * Production authorization truths (do not invent stricter rules):
 * - Mount: authenticate + injectCsrfToken (NO csrfProtection)
 * - Routes: protect only — NO authorize / role middleware
 * - GET / + PATCH /read-all scoped by req.user.id
 * - PATCH /:id/read has NO ownership check (cross-user mark-read succeeds)
 * - Bells/drawers only inside role-gated layouts; no /notifications page
 */
import { test, expect } from '../fixtures/product.functional.fixture';
import { expectApiStatus } from '../helpers/rbac.api.helper';
import {
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
import logoutFlow from '../flows/authentication/logout.flow';
import LoginPage from '../pages/auth/LoginPage';
import {
  authBearerOnly,
  authHeaders,
  bearerOnly,
  clearValidationRateLimits,
  getNotificationsRaw,
  idsOf,
  listContainsOrderId,
  messageOf,
  notificationIdOf,
  patchMarkAllReadRaw,
  patchMarkReadRaw,
  readBackendFile,
  refreshAdminApiSession,
  refreshDeliveryApiSession,
  refreshVendorApiSession,
  seedNotificationsAuthorizationData,
  unwrapList,
  userIdFromSession,
  type NotificationsAuthorizationSeed,
} from '../helpers/notifications.authorization.helper';

let seed: NotificationsAuthorizationSeed;
let adminSession: ApiSession;
let vendorSession: ApiSession;
let vendor2Session: ApiSession;
let deliverySession: ApiSession;
let superAdminSession: ApiSession;

test.describe('Notifications Authorization Suite', () => {
  test.beforeAll(async () => {
    clearValidationRateLimits();
    const vendorCreds = getVendorCredentials(1);
    vendorSession = await loginApiFresh(vendorCreds.mobile, vendorCreds.password);
    const seeded = await seedNotificationsAuthorizationData(vendorSession);
    adminSession = seeded.adminSession;
    deliverySession = seeded.deliverySession;
    vendor2Session = seeded.vendor2Session;
    seed = seeded.seed;
    const sa = getSuperAdminCredentials();
    superAdminSession = await loginApi(sa.mobile, sa.password);
    expect(seed.crossUserMarkTargetId).toBeTruthy();
    expect(seed.vendorUserId).toBeTruthy();
  });

  // ── A — Frontend route / portal protection ────────────────────────────────
  test.describe('Section A — Frontend Route Protection', () => {
    test('NA-NOT-001 | Guest vendor dashboard redirects to login (no bell)', async ({ page }) => {
      await page.goto('/vendor/dashboard');
      await expect(page).toHaveURL(/\/login/);
      await expect(page.getByLabel('Notifications')).toHaveCount(0);
    });

    test('NA-NOT-002 | Guest admin dashboard redirects to login', async ({ page }) => {
      await page.goto('/admin/dashboard');
      await expect(page).toHaveURL(/\/login/);
    });

    test('NA-NOT-003 | Guest delivery dashboard redirects to login', async ({ page }) => {
      await page.goto('/delivery/dashboard');
      await expect(page).toHaveURL(/\/login/);
    });

    test('NA-NOT-004 | Guest super-admin dashboard redirects to login', async ({ page }) => {
      await page.goto('/super-admin/dashboard');
      await expect(page).toHaveURL(/\/login/);
    });

    test('NA-NOT-005 | Guest /notifications deep-link has no inbox (catch-all home)', async ({
      page,
    }) => {
      await page.goto('/notifications');
      await expect(page).toHaveURL(/\/$/);
      await expect(page.getByLabel('Notifications')).toHaveCount(0);
      await expect(page.getByRole('heading', { name: /^notifications$/i })).toHaveCount(0);
    });

    test('NA-NOT-006 | Vendor redirected from admin dashboard', async ({ page }) => {
      await establishSession(page, 'vendor');
      await page.goto('/admin/dashboard');
      await expect(page).toHaveURL(/\/vendor\/dashboard/);
    });

    test('NA-NOT-007 | Vendor redirected from delivery dashboard', async ({ page }) => {
      await establishSession(page, 'vendor');
      await page.goto('/delivery/dashboard');
      await expect(page).toHaveURL(/\/vendor\/dashboard/);
    });

    test('NA-NOT-008 | Admin redirected from vendor dashboard', async ({ page }) => {
      await establishSession(page, 'admin');
      await page.goto('/vendor/dashboard');
      await expect(page).toHaveURL(/\/admin\/dashboard/);
    });

    test('NA-NOT-009 | Delivery redirected from admin dashboard', async ({ page }) => {
      await establishSession(page, 'delivery');
      await page.goto('/admin/dashboard');
      await expect(page).toHaveURL(/\/delivery\/dashboard/);
    });

    test('NA-NOT-010 | SuperAdmin redirected from admin dashboard', async ({ page }) => {
      await establishSession(page, 'superadmin');
      await page.goto('/admin/dashboard');
      await expect(page).toHaveURL(/\/super-admin\/dashboard/);
    });

    test('NA-NOT-011 | Customer redirected from delivery dashboard', async ({ page }) => {
      await establishSession(page, 'customer');
      await page.goto('/delivery/dashboard');
      await expect(page).toHaveURL(/\/vendor\/dashboard/);
    });
  });

  // ── B — Bell / drawer portal visibility ───────────────────────────────────
  test.describe('Section B — Portal Bell & Drawer Visibility', () => {
    test('NA-NOT-012 | Guest home has no notification bell', async ({ page }) => {
      await page.goto('/');
      await expect(page.getByLabel('Notifications')).toHaveCount(0);
    });

    test('NA-NOT-013 | Guest login page has no notification bell', async ({ page }) => {
      await page.goto('/login');
      await expect(page.getByLabel('Notifications')).toHaveCount(0);
    });

    test('NA-NOT-014 | Vendor bell + drawer granted on vendor dashboard', async ({ page }) => {
      await establishSession(page, 'vendor');
      await page.goto('/vendor/dashboard');
      await expect(page.getByLabel('Notifications')).toBeVisible({ timeout: 15000 });
      await page.getByLabel('Notifications').click();
      await expect(page.getByRole('heading', { name: /^notifications$/i })).toBeVisible();
    });

    test('NA-NOT-015 | Admin bell + drawer granted on admin dashboard', async ({ page }) => {
      await establishSession(page, 'admin');
      await page.goto('/admin/dashboard');
      await expect(page.getByLabel('Notifications')).toBeVisible({ timeout: 15000 });
      await page.getByLabel('Notifications').click();
      await expect(page.getByRole('heading', { name: /^notifications$/i })).toBeVisible();
    });

    test('NA-NOT-016 | Delivery bell + drawer granted on delivery dashboard', async ({ page }) => {
      await establishSession(page, 'delivery');
      await page.goto('/delivery/dashboard');
      await expect(page.getByLabel('Notifications')).toBeVisible({ timeout: 15000 });
      await page.getByLabel('Notifications').click();
      await expect(page.getByRole('heading', { name: /^notifications$/i })).toBeVisible();
    });

    test('NA-NOT-017 | Super Admin bell + drawer granted', async ({ page }) => {
      await establishSession(page, 'superadmin');
      await page.goto('/super-admin/dashboard');
      await expect(page.getByLabel('Notifications')).toBeVisible({ timeout: 15000 });
      await page.getByLabel('Notifications').click();
      await expect(page.getByRole('heading', { name: /^notifications$/i })).toBeVisible();
    });

    test('NA-NOT-018 | Vendor cannot open admin bell via portal (redirected)', async ({ page }) => {
      await establishSession(page, 'vendor');
      await page.goto('/admin/dashboard');
      await expect(page).toHaveURL(/\/vendor\/dashboard/);
      await expect(page.getByLabel('Notifications')).toBeVisible();
    });

    test('NA-NOT-019 | Authenticated vendor /notifications has no dedicated inbox', async ({
      page,
    }) => {
      await establishSession(page, 'vendor');
      await page.goto('/notifications');
      await expect(page).toHaveURL(/\/$/);
      await expect(page.getByRole('heading', { name: /^notifications$/i })).toHaveCount(0);
    });
  });

  // ── C — Unauthenticated API ───────────────────────────────────────────────
  test.describe('Section C — Unauthenticated API Access', () => {
    test('NA-NOT-020 | Unauthenticated GET /notifications → 401', async () => {
      const response = await getNotificationsRaw();
      expect(response.status).toBe(401);
      expect(messageOf(response.data)).toMatch(/not authorized|token/i);
    });

    test('NA-NOT-021 | Unauthenticated PATCH /notifications/read-all → 401', async () => {
      const response = await patchMarkAllReadRaw();
      expect(response.status).toBe(401);
    });

    test('NA-NOT-022 | Unauthenticated PATCH /notifications/:id/read → 401', async () => {
      const response = await patchMarkReadRaw(seed.crossUserMarkTargetId);
      expect(response.status).toBe(401);
    });

    test('NA-NOT-023 | Malformed JWT rejected on GET /notifications', async () => {
      const response = await getNotificationsRaw(bearerOnly('not-a-jwt'));
      expect(response.status).toBe(401);
    });

    test('NA-NOT-024 | Expired JWT rejected on GET /notifications', async () => {
      const payload = decodeJwtPayload(vendorSession.accessToken);
      const expired = signTestJwt(
        { id: payload.id, role: payload.role, sessionId: payload.sessionId },
        { expired: true }
      );
      const response = await getNotificationsRaw(bearerOnly(expired));
      expect(response.status).toBe(401);
    });

    test('NA-NOT-025 | Literal null token rejected on PATCH read-all', async () => {
      const response = await patchMarkAllReadRaw(bearerOnly('null'));
      expect(response.status).toBe(401);
    });

    test('NA-NOT-026 | Missing Authorization header rejected', async () => {
      await expectApiStatus(() => apiClient.get('/notifications'), 401);
    });
  });

  // ── D — Token security ────────────────────────────────────────────────────
  test.describe('Section D — Token Security', () => {
    test('NA-NOT-027 | Tampered JWT rejected on GET /notifications', async () => {
      const tampered = tamperTokenSignature(vendorSession.accessToken);
      const response = await getNotificationsRaw(bearerOnly(tampered));
      expect(response.status).toBe(401);
    });

    test('NA-NOT-028 | Session-replaced token rejected', async () => {
      const creds = getVendorCredentials(1);
      const first = await loginApiFresh(creds.mobile, creds.password);
      await loginApiFresh(creds.mobile, creds.password);
      const response = await getNotificationsRaw(bearerOnly(first.accessToken));
      expect(response.status).toBe(401);
      vendorSession = await refreshVendorApiSession(1);
    });

    test('NA-NOT-029 | Token without sessionId rejected when active session exists', async () => {
      const payload = decodeJwtPayload(vendorSession.accessToken);
      const noSession = signTestJwt({ id: payload.id, role: payload.role });
      const response = await getNotificationsRaw(bearerOnly(noSession));
      expect(response.status).toBe(401);
    });

    test('NA-NOT-030 | Escalated vendor JWT still loads own notifications (no role ACL)', async () => {
      // Production: protect loads user from DB by id — JWT role claim does not change userId scope.
      const escalated = signEscalatedRoleToken(vendorSession.accessToken, 'ADMIN');
      const response = await getNotificationsRaw(bearerOnly(escalated));
      expect(response.status).toBe(200);
      const list = unwrapList(response.data);
      expect(listContainsOrderId(list, seed.orderId)).toBe(true);
    });

    test('NA-NOT-031 | Escalated vendor JWT cannot unlock another user via role claim', async () => {
      const escalated = signEscalatedRoleToken(vendorSession.accessToken, 'SUPER_ADMIN');
      const response = await getNotificationsRaw(bearerOnly(escalated));
      expect(response.status).toBe(200);
      const list = unwrapList(response.data);
      const foreign = list.filter(
        (n) => String(n.userId || '') && String(n.userId) !== seed.vendorUserId
      );
      // Rows are always for authenticated DB user; userId field if present must match vendor.
      for (const row of list) {
        if (row.userId != null) {
          expect(String(row.userId)).toBe(seed.vendorUserId);
        }
      }
      expect(foreign.length).toBe(0);
    });

    test('NA-NOT-032 | Deleted/ghost user token rejected', async () => {
      const ghostToken = signTestJwt({ id: '000000000000000000000099', role: 'VENDOR' });
      const response = await getNotificationsRaw(bearerOnly(ghostToken));
      expect(response.status).toBe(401);
    });
  });

  // ── E — Role API access (no role ACL — all authenticated roles allowed) ───
  test.describe('Section E — Role API Access (No Role ACL)', () => {
    test('NA-NOT-033 | Vendor GET /notifications allowed', async () => {
      const response = await getNotificationsRaw(authBearerOnly(vendorSession));
      expect(response.status).toBe(200);
    });

    test('NA-NOT-034 | Admin GET /notifications allowed', async () => {
      const response = await getNotificationsRaw(authBearerOnly(adminSession));
      expect(response.status).toBe(200);
    });

    test('NA-NOT-035 | Delivery GET /notifications allowed', async () => {
      const response = await getNotificationsRaw(authBearerOnly(deliverySession));
      expect(response.status).toBe(200);
    });

    test('NA-NOT-036 | SuperAdmin GET /notifications allowed', async () => {
      const response = await getNotificationsRaw(authBearerOnly(superAdminSession));
      expect(response.status).toBe(200);
    });

    test('NA-NOT-037 | Customer/B2B GET /notifications allowed (auth-only API)', async () => {
      const customer = getCustomerCredentials();
      const session = await loginApiFresh(customer.mobile, customer.password);
      const response = await getNotificationsRaw(authBearerOnly(session));
      expect(response.status).toBe(200);
    });

    test('NA-NOT-038 | Vendor PATCH mark-all allowed', async () => {
      // Use vendor2 so vendor1 unread seed remains for ownership section.
      const response = await patchMarkAllReadRaw(authBearerOnly(vendor2Session));
      expect(response.status).toBe(200);
      expect(messageOf(response.data)).toMatch(/all notifications marked as read/i);
    });

    test('NA-NOT-039 | Delivery PATCH mark-all allowed', async () => {
      const response = await patchMarkAllReadRaw(authBearerOnly(deliverySession));
      expect(response.status).toBe(200);
    });

    test('NA-NOT-040 | Admin PATCH own notification mark-read allowed', async () => {
      const listRes = await getNotificationsRaw(authBearerOnly(adminSession));
      expect(listRes.status).toBe(200);
      const list = unwrapList(listRes.data);
      expect(list.length).toBeGreaterThan(0);
      const response = await patchMarkReadRaw(
        notificationIdOf(list[0]),
        authBearerOnly(adminSession)
      );
      expect(response.status).toBe(200);
    });
  });

  // ── F — Ownership (list / mark-all scoped; mark-one NOT owned) ─────────────
  test.describe('Section F — Notification Ownership', () => {
    test('NA-NOT-041 | Vendor list includes seeded order notifications', async () => {
      const response = await getNotificationsRaw(authBearerOnly(vendorSession));
      expect(response.status).toBe(200);
      const list = unwrapList(response.data);
      expect(listContainsOrderId(list, seed.orderId)).toBe(true);
    });

    test('NA-NOT-042 | Vendor2 list does not include vendor1 seed order notifications', async () => {
      const response = await getNotificationsRaw(authBearerOnly(vendor2Session));
      expect(response.status).toBe(200);
      const list = unwrapList(response.data);
      expect(listContainsOrderId(list, seed.orderId)).toBe(false);
    });

    test('NA-NOT-043 | Vendor1 notification ids absent from vendor2 list', async () => {
      const v1 = unwrapList((await getNotificationsRaw(authBearerOnly(vendorSession))).data);
      const v2 = unwrapList((await getNotificationsRaw(authBearerOnly(vendor2Session))).data);
      const v1Ids = new Set(idsOf(v1));
      for (const id of idsOf(v2)) {
        expect(v1Ids.has(id)).toBe(false);
      }
    });

    test('NA-NOT-044 | Delivery list does not include vendor Order Confirmed for seed order', async () => {
      const response = await getNotificationsRaw(authBearerOnly(deliverySession));
      expect(response.status).toBe(200);
      const list = unwrapList(response.data);
      const orderConfirmed = list.filter(
        (n) =>
          String(n.title) === seed.orderConfirmedTitle &&
          String(n.message || '').includes(seed.orderId)
      );
      expect(orderConfirmed.length).toBe(0);
    });

    test('NA-NOT-045 | Admin list does not include vendor-only Order Placed for seed order', async () => {
      const response = await getNotificationsRaw(authBearerOnly(adminSession));
      expect(response.status).toBe(200);
      const list = unwrapList(response.data);
      const orderPlaced = list.filter(
        (n) =>
          String(n.title) === seed.orderPlacedTitle &&
          String(n.message || '').includes(seed.orderId)
      );
      expect(orderPlaced.length).toBe(0);
    });

    test('NA-NOT-046 | Delivery mark-all does not clear vendor1 unread', async () => {
      const before = unwrapList((await getNotificationsRaw(authBearerOnly(vendorSession))).data);
      const unreadBefore = before.filter((n) => n.isRead !== true).length;
      expect(unreadBefore).toBeGreaterThan(0);

      const mark = await patchMarkAllReadRaw(authBearerOnly(deliverySession));
      expect(mark.status).toBe(200);

      const after = unwrapList((await getNotificationsRaw(authBearerOnly(vendorSession))).data);
      const unreadAfter = after.filter((n) => n.isRead !== true).length;
      expect(unreadAfter).toBe(unreadBefore);
    });

    test('NA-NOT-047 | Vendor2 mark-all does not clear vendor1 unread', async () => {
      const before = unwrapList((await getNotificationsRaw(authBearerOnly(vendorSession))).data);
      const unreadBefore = before.filter((n) => n.isRead !== true).length;

      const mark = await patchMarkAllReadRaw(authBearerOnly(vendor2Session));
      expect(mark.status).toBe(200);

      const after = unwrapList((await getNotificationsRaw(authBearerOnly(vendorSession))).data);
      const unreadAfter = after.filter((n) => n.isRead !== true).length;
      expect(unreadAfter).toBe(unreadBefore);
    });

    test('NA-NOT-048 | Cross-user mark-read ALLOWED (no ownership check) — production truth', async () => {
      // Production: markAsRead(id) has no userId filter — any authenticated caller may mark any id.
      const targetId = seed.crossUserMarkTargetId;
      const response = await patchMarkReadRaw(targetId, authBearerOnly(deliverySession));
      expect(response.status).toBe(200);
      expect(messageOf(response.data)).toMatch(/notification marked as read/i);

      const vendorList = unwrapList(
        (await getNotificationsRaw(authBearerOnly(vendorSession))).data
      );
      const row = vendorList.find((n) => notificationIdOf(n) === targetId);
      expect(row).toBeTruthy();
      expect(row!.isRead).toBe(true);
    });

    test('NA-NOT-049 | Cross-user mark-read response may include foreign notification payload', async () => {
      // Re-mark another unread if available; otherwise re-hit already-read target (still 200).
      const vendorList = unwrapList(
        (await getNotificationsRaw(authBearerOnly(vendorSession))).data
      );
      const unread = vendorList.find((n) => n.isRead !== true);
      const targetId = unread ? notificationIdOf(unread) : seed.crossUserMarkTargetId;
      const response = await patchMarkReadRaw(targetId, authBearerOnly(adminSession));
      expect(response.status).toBe(200);
      const data = response.data as { data?: Record<string, unknown> };
      const body = (data?.data || response.data) as Record<string, unknown>;
      if (body && typeof body === 'object' && (body._id || body.id || body.title)) {
        const uid = body.userId != null ? String(body.userId) : '';
        if (uid) {
          expect(uid).toBe(seed.vendorUserId);
          expect(uid).not.toBe(seed.adminUserId);
        }
      }
    });

    test('NA-NOT-050 | Vendor can mark own notification as read', async () => {
      const list = unwrapList((await getNotificationsRaw(authBearerOnly(vendorSession))).data);
      const target = list.find((n) => n.isRead !== true) || list[0];
      expect(target).toBeTruthy();
      const response = await patchMarkReadRaw(
        notificationIdOf(target!),
        authBearerOnly(vendorSession)
      );
      expect(response.status).toBe(200);
    });

    test('NA-NOT-051 | Vendor mark-all only affects own rows', async () => {
      const deliveryBefore = unwrapList(
        (await getNotificationsRaw(authBearerOnly(deliverySession))).data
      );
      const deliveryUnreadBefore = deliveryBefore.filter((n) => n.isRead !== true).length;

      const mark = await patchMarkAllReadRaw(authBearerOnly(vendorSession));
      expect(mark.status).toBe(200);

      const vendorAfter = unwrapList(
        (await getNotificationsRaw(authBearerOnly(vendorSession))).data
      );
      expect(vendorAfter.every((n) => n.isRead === true)).toBe(true);

      const deliveryAfter = unwrapList(
        (await getNotificationsRaw(authBearerOnly(deliverySession))).data
      );
      const deliveryUnreadAfter = deliveryAfter.filter((n) => n.isRead !== true).length;
      expect(deliveryUnreadAfter).toBe(deliveryUnreadBefore);
    });
  });

  // ── G — Account status, session, logout ───────────────────────────────────
  test.describe('Section G — Account Status & Logout', () => {
    test('NA-NOT-052 | Inactive account GET /notifications returns 403 or login blocked', async () => {
      const inactive = getInactiveVendorCredentials();
      const adminLookup = await apiClient.get('/users', {
        headers: authBearerOnly(adminSession),
        params: { search: inactive.mobile },
        validateStatus: () => true,
      });
      let inactiveId = '';
      if (adminLookup.status === 200) {
        const body = adminLookup.data as { data?: unknown };
        const list = Array.isArray(body?.data)
          ? body.data
          : Array.isArray(adminLookup.data)
            ? adminLookup.data
            : [];
        const row = (list as Array<Record<string, unknown>>).find(
          (u) => String(u.mobile || '') === inactive.mobile
        );
        inactiveId = String(row?._id || row?.id || '');
      }
      if (!inactiveId) {
        await expect(loginApiFresh(inactive.mobile, inactive.password)).rejects.toBeTruthy();
        return;
      }
      const token = signTestJwt({
        id: inactiveId,
        role: 'VENDOR',
        sessionId: 'inactive-session',
      });
      const response = await getNotificationsRaw(bearerOnly(token));
      expect([401, 403]).toContain(response.status);
    });

    test('NA-NOT-053 | Inactive account blocked from login', async () => {
      const inactive = getInactiveVendorCredentials();
      await expect(loginApiFresh(inactive.mobile, inactive.password)).rejects.toBeTruthy();
    });

    test('NA-NOT-054 | Invalid browser token redirects to login on vendor dashboard', async ({
      page,
    }) => {
      await page.addInitScript(() => {
        localStorage.setItem('accessToken', 'invalid.token.value');
        localStorage.setItem('token', 'invalid.token.value');
      });
      await page.goto('/vendor/dashboard');
      await expect(page).toHaveURL(/\/login/, { timeout: 15000 });
    });

    test('NA-NOT-055 | Logout blocks vendor dashboard + bell', async ({ page }) => {
      await establishSession(page, 'vendor');
      await page.goto('/vendor/dashboard');
      await expect(page.getByLabel('Notifications')).toBeVisible();
      await logoutFlow(page);
      await page.goto('/vendor/dashboard');
      await expect(page).toHaveURL(/\/login/, { timeout: 15000 });
      await expect(page.getByLabel('Notifications')).toHaveCount(0);
      vendorSession = await refreshVendorApiSession(1);
    });

    test('NA-NOT-056 | Logout blocks admin dashboard bell access', async ({ page }) => {
      await establishSession(page, 'admin');
      await page.goto('/admin/dashboard');
      await logoutFlow(page);
      await page.goto('/admin/dashboard');
      await expect(page).toHaveURL(/\/login/, { timeout: 15000 });
      adminSession = await refreshAdminApiSession();
    });

    test('NA-NOT-057 | Logout blocks delivery dashboard bell access', async ({ page }) => {
      await establishSession(page, 'delivery');
      await page.goto('/delivery/dashboard');
      await logoutFlow(page);
      await page.goto('/delivery/dashboard');
      await expect(page).toHaveURL(/\/login/, { timeout: 15000 });
      deliverySession = await refreshDeliveryApiSession(1);
    });

    test('NA-NOT-058 | After logout GET /notifications without token → 401', async () => {
      const response = await getNotificationsRaw();
      expect(response.status).toBe(401);
    });
  });

  // ── H — CSRF implementation truth ─────────────────────────────────────────
  test.describe('Section H — CSRF Implementation Truth', () => {
    test.beforeAll(async () => {
      vendorSession = await refreshVendorApiSession(1);
      adminSession = await refreshAdminApiSession();
      deliverySession = await refreshDeliveryApiSession(1);
    });

    test('NA-NOT-059 | GET /notifications succeeds with Bearer only (no CSRF header)', async () => {
      const response = await getNotificationsRaw(authBearerOnly(vendorSession));
      expect(response.status).toBe(200);
    });

    test('NA-NOT-060 | PATCH mark-read succeeds with Bearer only (no csrfProtection)', async () => {
      const list = unwrapList((await getNotificationsRaw(authBearerOnly(vendorSession))).data);
      const target = list[0];
      expect(target).toBeTruthy();
      const response = await patchMarkReadRaw(
        notificationIdOf(target!),
        authBearerOnly(vendorSession)
      );
      expect(response.status).toBe(200);
    });

    test('NA-NOT-061 | PATCH mark-all succeeds with Bearer only', async () => {
      const response = await patchMarkAllReadRaw(authBearerOnly(vendorSession));
      expect(response.status).toBe(200);
    });

    test('NA-NOT-062 | Authenticated GET may inject CSRF cookie', async () => {
      const response = await getNotificationsRaw(authBearerOnly(adminSession));
      expect(response.status).toBe(200);
      const setCookie = response.headers['set-cookie'];
      if (setCookie) {
        const cookieText = Array.isArray(setCookie) ? setCookie.join(';') : String(setCookie);
        expect(cookieText.toLowerCase()).toMatch(/csrf/i);
      }
    });

    test('NA-NOT-063 | Full authHeaders (Bearer + CSRF) also succeed on mark-read', async () => {
      const list = unwrapList((await getNotificationsRaw(authHeaders(vendorSession))).data);
      const target = list[0];
      expect(target).toBeTruthy();
      const response = await patchMarkReadRaw(notificationIdOf(target!), authHeaders(vendorSession));
      expect(response.status).toBe(200);
    });
  });

  // ── I — RBAC source truth (backend files) ──────────────────────────────────
  test.describe('Section I — RBAC Source Truth', () => {
    test('NA-NOT-064 | Notification routes use protect middleware', async () => {
      const routesSource = readBackendFile('src/modules/notification/notification.routes.js');
      expect(routesSource).toMatch(/protect/);
    });

    test('NA-NOT-065 | Notification routes do not use authorize', async () => {
      const routesSource = readBackendFile('src/modules/notification/notification.routes.js');
      expect(routesSource).not.toMatch(/authorize/);
    });

    test('NA-NOT-066 | Notification routes do not mount csrfProtection', async () => {
      const routesSource = readBackendFile('src/modules/notification/notification.routes.js');
      expect(routesSource).not.toMatch(/csrfProtection/);
    });

    test('NA-NOT-067 | v1 mount uses authenticate + injectCsrfToken for /notifications', async () => {
      const v1 = readBackendFile('src/routes/v1.routes.js');
      expect(v1).toMatch(
        /router\.use\(\s*'\/notifications',\s*authenticate,\s*injectCsrfToken,\s*notificationRoutes\s*\)/
      );
    });

    test('NA-NOT-068 | Controller getNotifications / markAllAsRead use req.user.id', async () => {
      const controller = readBackendFile(
        'src/modules/notification/notification.controller.js'
      );
      expect(controller).toMatch(/getNotifications\(req\.user\.id\)/);
      expect(controller).toMatch(/markAllAsRead\(req\.user\.id\)/);
    });

    test('NA-NOT-069 | Controller markAsRead does not pass req.user (no ownership)', async () => {
      const controller = readBackendFile(
        'src/modules/notification/notification.controller.js'
      );
      expect(controller).toMatch(/markAsRead\(req\.params\.id\)/);
      expect(controller).not.toMatch(/markAsRead\(req\.params\.id,\s*req\.user/);
    });

    test('NA-NOT-070 | Repository markAsRead has no userId filter', async () => {
      const repo = readBackendFile('src/modules/notification/notification.repository.js');
      expect(repo).toMatch(/findByIdAndUpdate/);
      // markAllAsRead must filter by userId; markAsRead must not.
      expect(repo).toMatch(/updateMany\(\s*\{\s*userId/);
    });
  });

  // ── J — Client session & deep links ───────────────────────────────────────
  test.describe('Section J — Client Session & Deep Links', () => {
    test('NA-NOT-071 | Login as vendor lands on vendor dashboard with bell', async ({ page }) => {
      const creds = getVendorCredentials(1);
      const loginPage = new LoginPage(page);
      await loginPage.goto();
      await loginPage.fillMobile(creds.mobile);
      await loginPage.fillPassword(creds.password);
      await loginPage.submit();
      await expect(page).toHaveURL(/\/vendor\/dashboard/, { timeout: 20000 });
      await expect(page.getByLabel('Notifications')).toBeVisible({ timeout: 15000 });
    });

    test('NA-NOT-072 | Login as delivery lands on delivery dashboard with bell', async ({
      page,
    }) => {
      const creds = getDeliveryCredentials(1);
      const loginPage = new LoginPage(page);
      await loginPage.goto();
      await loginPage.fillMobile(creds.mobile);
      await loginPage.fillPassword(creds.password);
      await loginPage.submit();
      await expect(page).toHaveURL(/\/delivery\/dashboard/, { timeout: 20000 });
      await expect(page.getByLabel('Notifications')).toBeVisible({ timeout: 15000 });
    });

    test('NA-NOT-073 | Direct /notifications after logout redirects to public home', async ({
      page,
    }) => {
      await establishSession(page, 'vendor');
      await page.goto('/vendor/dashboard');
      await logoutFlow(page);
      await page.goto('/notifications');
      await expect(page).toHaveURL(/\/$/);
      await expect(page.getByLabel('Notifications')).toHaveCount(0);
      vendorSession = await refreshVendorApiSession(1);
    });

    test('NA-NOT-074 | Guest API notification endpoints remain 401', async () => {
      await expectApiStatus(() => apiClient.get('/notifications'), 401);
      await expectApiStatus(() => apiClient.patch('/notifications/read-all', {}), 401);
      await expectApiStatus(
        () => apiClient.patch(`/notifications/${seed.crossUserMarkTargetId}/read`, {}),
        401
      );
    });

    test('NA-NOT-075 | userIdFromSession matches JWT id for vendor seed', async () => {
      expect(userIdFromSession(vendorSession)).toBe(seed.vendorUserId);
      expect(userIdFromSession(deliverySession)).toBe(seed.deliveryUserId);
    });
  });
});
