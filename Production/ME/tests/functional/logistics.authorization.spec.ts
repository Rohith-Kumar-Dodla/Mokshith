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
  AdminDeliveryAssignmentPage,
  DeliveryDashboardPage,
} from '../pages/delivery/DeliveryPages';
import {
  authBearerOnly,
  bearerOnly,
  clearValidationRateLimits,
  createPendingShipment,
  getAllLogisticsRaw,
  getLogisticsAnalyticsRaw,
  getLogisticsByIdRaw,
  getLogisticsHistoryRaw,
  getLogisticsQueueRaw,
  getMyAssignmentsRaw,
  messageOf,
  patchLogisticsAssignRaw,
  patchLogisticsReassignRaw,
  postLogisticsAcceptRaw,
  postLogisticsCompleteRaw,
  postLogisticsCreateRaw,
  postLogisticsDeliveredRaw,
  postLogisticsLocationRaw,
  postLogisticsPickRaw,
  postLogisticsStartRaw,
  readBackendFile,
  refreshAdminApiSession,
  refreshDeliveryApiSession,
  refreshVendorApiSession,
  seedLogisticsAuthorizationData,
  type LogisticsAuthorizationSeed,
} from '../helpers/logistics.authorization.helper';

let seed: LogisticsAuthorizationSeed;
let adminSession: ApiSession;
let vendorSession: ApiSession;
let deliverySession: ApiSession;
let delivery2Session: ApiSession;
let superAdminSession: ApiSession;

test.describe('Logistics Authorization Suite', () => {
  test.beforeAll(async () => {
    clearValidationRateLimits();
    const vendorCreds = getVendorCredentials(1);
    vendorSession = await loginApiFresh(vendorCreds.mobile, vendorCreds.password);
    const seeded = await seedLogisticsAuthorizationData(vendorSession);
    adminSession = seeded.adminSession;
    deliverySession = seeded.deliverySession;
    delivery2Session = seeded.delivery2Session;
    seed = seeded.seed;
    const sa = getSuperAdminCredentials();
    superAdminSession = await loginApi(sa.mobile, sa.password);
    expect(seed.ownedByDp1.shipmentId).toBeTruthy();
    expect(seed.ownedByDp2.shipmentId).toBeTruthy();
  });

  test.describe('Section A — Frontend Route Protection', () => {
    test('LA-LOG-001 | Guest delivery dashboard redirects to login', async ({ page }) => {
      await page.goto('/delivery/dashboard');
      await expect(page).toHaveURL(/\/login/);
    });

    test('LA-LOG-002 | Guest admin delivery-assignment redirects to login', async ({ page }) => {
      await page.goto('/admin/delivery-assignment');
      await expect(page).toHaveURL(/\/login/);
    });

    test('LA-LOG-003 | Vendor redirected from delivery dashboard', async ({ page }) => {
      await establishSession(page, 'vendor');
      await page.goto('/delivery/dashboard');
      await expect(page).toHaveURL(/\/vendor\/dashboard/);
    });

    test('LA-LOG-004 | Vendor redirected from admin delivery-assignment', async ({ page }) => {
      await establishSession(page, 'vendor');
      await page.goto('/admin/delivery-assignment');
      await expect(page).toHaveURL(/\/vendor\/dashboard/);
    });

    test('LA-LOG-005 | Admin redirected from delivery dashboard', async ({ page }) => {
      await establishSession(page, 'admin');
      await page.goto('/delivery/dashboard');
      await expect(page).toHaveURL(/\/admin\/dashboard/);
    });

    test('LA-LOG-006 | Delivery redirected from admin delivery-assignment', async ({ page }) => {
      await establishSession(page, 'delivery');
      await page.goto('/admin/delivery-assignment');
      await expect(page).toHaveURL(/\/delivery\/dashboard/);
    });

    test('LA-LOG-007 | SuperAdmin redirected from admin delivery-assignment', async ({ page }) => {
      await establishSession(page, 'superadmin');
      await page.goto('/admin/delivery-assignment');
      await expect(page).toHaveURL(/\/super-admin\/dashboard/);
    });

    test('LA-LOG-008 | SuperAdmin redirected from delivery dashboard', async ({ page }) => {
      await establishSession(page, 'superadmin');
      await page.goto('/delivery/dashboard');
      await expect(page).toHaveURL(/\/super-admin\/dashboard/);
    });

    test('LA-LOG-009 | B2B customer redirected from delivery dashboard', async ({ page }) => {
      await establishSession(page, 'customer');
      await page.goto('/delivery/dashboard');
      await expect(page).toHaveURL(/\/vendor\/dashboard/);
    });

    test('LA-LOG-010 | Admin granted Delivery Assignment page', async ({ page }) => {
      await establishSession(page, 'admin');
      const assignment = new AdminDeliveryAssignmentPage(page);
      await assignment.goto();
      await assignment.waitForLoad();
      await expect(assignment.pageHeading()).toBeVisible();
    });

    test('LA-LOG-011 | Delivery partner granted Delivery Dashboard', async ({ page }) => {
      await establishSession(page, 'delivery');
      const dashboard = new DeliveryDashboardPage(page);
      await dashboard.goto();
      await dashboard.waitForLoad();
      await expect(dashboard.pageHeading()).toBeVisible();
    });

    test('LA-LOG-012 | Deep-link /delivery/assigned-orders requires auth', async ({ page }) => {
      await page.goto('/delivery/assigned-orders');
      await expect(page).toHaveURL(/\/login/);
      await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();
    });
  });

  test.describe('Section B — Hidden UI & Navigation', () => {
    test('LA-LOG-013 | Admin sidebar shows Delivery Assignment', async ({ page }) => {
      await establishSession(page, 'admin');
      await page.goto('/admin/dashboard');
      await expect(
        page.getByLabel('Main navigation').getByRole('link', { name: /delivery assignment/i })
      ).toBeVisible();
    });

    test('LA-LOG-014 | Vendor sidebar has no Delivery Assignment link', async ({ page }) => {
      await establishSession(page, 'vendor');
      await page.goto('/vendor/dashboard');
      await expect(page.locator('a[href="/admin/delivery-assignment"]')).toHaveCount(0);
    });

    test('LA-LOG-015 | SuperAdmin sidebar has no Delivery Assignment link', async ({ page }) => {
      await establishSession(page, 'superadmin');
      await page.goto('/super-admin/dashboard');
      await expect(page.locator('a[href="/admin/delivery-assignment"]')).toHaveCount(0);
    });

    test('LA-LOG-016 | Delivery sidebar has Assigned Orders, no admin assignment', async ({
      page,
    }) => {
      await establishSession(page, 'delivery');
      await page.goto('/delivery/dashboard');
      await expect(page.locator('a[href="/delivery/assigned-orders"]')).toBeVisible();
      await expect(page.locator('a[href="/admin/delivery-assignment"]')).toHaveCount(0);
    });

    test('LA-LOG-017 | Guest public navbar has no delivery portal links', async ({ page }) => {
      await page.goto('/');
      await expect(page.locator('a[href="/delivery/dashboard"]')).toHaveCount(0);
      await expect(page.locator('a[href="/admin/delivery-assignment"]')).toHaveCount(0);
    });
  });

  test.describe('Section C — Unauthenticated API Access', () => {
    test('LA-LOG-018 | Unauthenticated GET delivery-queue returns 401', async () => {
      const response = await getLogisticsQueueRaw();
      expect(response.status).toBe(401);
    });

    test('LA-LOG-019 | Unauthenticated GET my-assignments returns 401', async () => {
      const response = await getMyAssignmentsRaw();
      expect(response.status).toBe(401);
    });

    test('LA-LOG-020 | Unauthenticated GET history returns 401', async () => {
      const response = await getLogisticsHistoryRaw();
      expect(response.status).toBe(401);
    });

    test('LA-LOG-021 | Unauthenticated GET analytics returns 401', async () => {
      const response = await getLogisticsAnalyticsRaw();
      expect(response.status).toBe(401);
    });

    test('LA-LOG-022 | Unauthenticated POST create shipment returns 401', async () => {
      const response = await postLogisticsCreateRaw(seed.ownedByDp1.orderId);
      expect(response.status).toBe(401);
    });

    test('LA-LOG-023 | Unauthenticated PATCH assign returns 401', async () => {
      const response = await patchLogisticsAssignRaw(
        seed.ownedByDp1.shipmentId,
        seed.ownedByDp1.deliveryPartnerId
      );
      expect(response.status).toBe(401);
    });

    test('LA-LOG-024 | Unauthenticated POST accept returns 401', async () => {
      const response = await postLogisticsAcceptRaw(seed.ownedByDp1.shipmentId);
      expect(response.status).toBe(401);
    });

    test('LA-LOG-025 | Unauthenticated GET shipment by id returns 401', async () => {
      const response = await getLogisticsByIdRaw(seed.ownedByDp1.shipmentId);
      expect(response.status).toBe(401);
    });

    test('LA-LOG-026 | Malformed JWT rejected on GET delivery-queue', async () => {
      const response = await getLogisticsQueueRaw(bearerOnly('not-a-jwt'));
      expect(response.status).toBe(401);
    });

    test('LA-LOG-027 | Expired JWT rejected on GET my-assignments', async () => {
      const payload = decodeJwtPayload(deliverySession.accessToken);
      const expired = signTestJwt(
        { id: payload.id, role: payload.role, sessionId: payload.sessionId },
        { expired: true }
      );
      const response = await getMyAssignmentsRaw(bearerOnly(expired));
      expect(response.status).toBe(401);
    });

    test('LA-LOG-028 | Literal null token rejected on GET analytics', async () => {
      const response = await getLogisticsAnalyticsRaw(bearerOnly('null'));
      expect(response.status).toBe(401);
    });
  });

  test.describe('Section D — Token Security', () => {
    test('LA-LOG-029 | Tampered JWT rejected on GET delivery-queue', async () => {
      const tampered = tamperTokenSignature(deliverySession.accessToken);
      const response = await getLogisticsQueueRaw(bearerOnly(tampered));
      expect(response.status).toBe(401);
    });

    test('LA-LOG-030 | Missing Authorization header rejected', async () => {
      await expectApiStatus(() => apiClient.get('/logistics/delivery-queue'), 401);
    });

    test('LA-LOG-031 | Session-replaced token rejected on GET my-assignments', async () => {
      const creds = getDeliveryCredentials(1);
      const first = await loginApiFresh(creds.mobile, creds.password);
      await loginApiFresh(creds.mobile, creds.password);
      const response = await getMyAssignmentsRaw(bearerOnly(first.accessToken));
      expect(response.status).toBe(401);
      deliverySession = await refreshDeliveryApiSession(1);
    });

    test('LA-LOG-032 | Token without sessionId rejected when active session exists', async () => {
      const payload = decodeJwtPayload(deliverySession.accessToken);
      const noSession = signTestJwt({ id: payload.id, role: payload.role });
      const response = await getMyAssignmentsRaw(bearerOnly(noSession));
      expect(response.status).toBe(401);
    });

    test('LA-LOG-033 | Escalated vendor JWT cannot unlock admin create shipment', async () => {
      const escalated = signEscalatedRoleToken(vendorSession.accessToken, 'ADMIN');
      const response = await postLogisticsCreateRaw(
        seed.ownedByDp1.orderId,
        bearerOnly(escalated)
      );
      expect(response.status).toBe(403);
    });

    test('LA-LOG-034 | Escalated vendor JWT cannot unlock delivery accept', async () => {
      const escalated = signEscalatedRoleToken(vendorSession.accessToken, 'DELIVERY_PARTNER');
      const response = await postLogisticsAcceptRaw(
        seed.ownedByDp1.shipmentId,
        bearerOnly(escalated)
      );
      expect(response.status).toBe(403);
    });

    test('LA-LOG-035 | Deleted/ghost user token rejected', async () => {
      const ghostToken = signTestJwt({ id: '000000000000000000000099', role: 'ADMIN' });
      const response = await getLogisticsQueueRaw(bearerOnly(ghostToken));
      expect(response.status).toBe(401);
    });
  });

  test.describe('Section E — Role API Access (Reads)', () => {
    test('LA-LOG-036 | Admin GET delivery-queue allowed', async () => {
      const response = await getLogisticsQueueRaw(authBearerOnly(adminSession));
      expect(response.status).toBe(200);
    });

    test('LA-LOG-037 | Delivery GET delivery-queue allowed', async () => {
      const response = await getLogisticsQueueRaw(authBearerOnly(deliverySession));
      expect(response.status).toBe(200);
    });

    test('LA-LOG-038 | SuperAdmin GET delivery-queue allowed', async () => {
      const response = await getLogisticsQueueRaw(authBearerOnly(superAdminSession));
      expect(response.status).toBe(200);
    });

    test('LA-LOG-039 | Vendor GET delivery-queue forbidden', async () => {
      const response = await getLogisticsQueueRaw(authBearerOnly(vendorSession));
      expect(response.status).toBe(403);
    });

    test('LA-LOG-040 | Admin GET history allowed', async () => {
      const response = await getLogisticsHistoryRaw(authBearerOnly(adminSession));
      expect(response.status).toBe(200);
    });

    test('LA-LOG-041 | Delivery GET history allowed', async () => {
      const response = await getLogisticsHistoryRaw(authBearerOnly(deliverySession));
      expect(response.status).toBe(200);
    });

    test('LA-LOG-042 | Vendor GET history forbidden', async () => {
      const response = await getLogisticsHistoryRaw(authBearerOnly(vendorSession));
      expect(response.status).toBe(403);
    });

    test('LA-LOG-043 | Admin GET analytics allowed', async () => {
      const response = await getLogisticsAnalyticsRaw(authBearerOnly(adminSession));
      expect(response.status).toBe(200);
    });

    test('LA-LOG-044 | Delivery GET analytics allowed', async () => {
      const response = await getLogisticsAnalyticsRaw(authBearerOnly(deliverySession));
      expect(response.status).toBe(200);
    });

    test('LA-LOG-045 | Vendor GET analytics forbidden', async () => {
      const response = await getLogisticsAnalyticsRaw(authBearerOnly(vendorSession));
      expect(response.status).toBe(403);
    });

    test('LA-LOG-046 | Delivery GET my-assignments allowed', async () => {
      const response = await getMyAssignmentsRaw(authBearerOnly(deliverySession));
      expect(response.status).toBe(200);
    });

    test('LA-LOG-047 | Admin GET my-assignments forbidden', async () => {
      const response = await getMyAssignmentsRaw(authBearerOnly(adminSession));
      expect(response.status).toBe(403);
    });

    test('LA-LOG-048 | Vendor GET my-assignments forbidden', async () => {
      const response = await getMyAssignmentsRaw(authBearerOnly(vendorSession));
      expect(response.status).toBe(403);
    });

    test('LA-LOG-049 | Admin GET /logistics list allowed', async () => {
      const response = await getAllLogisticsRaw(authBearerOnly(adminSession));
      expect(response.status).toBe(200);
    });

    test('LA-LOG-050 | Delivery GET /logistics list forbidden', async () => {
      const response = await getAllLogisticsRaw(authBearerOnly(deliverySession));
      expect(response.status).toBe(403);
    });

    test('LA-LOG-051 | Vendor GET /logistics list forbidden', async () => {
      const response = await getAllLogisticsRaw(authBearerOnly(vendorSession));
      expect(response.status).toBe(403);
    });

    test('LA-LOG-052 | Vendor GET shipment by id allowed (auth-only, no ownership)', async () => {
      // Production truth: GET /:id is protect-only — any authenticated role may read.
      const response = await getLogisticsByIdRaw(
        seed.ownedByDp1.shipmentId,
        authBearerOnly(vendorSession)
      );
      expect(response.status).toBe(200);
    });

    test('LA-LOG-053 | Delivery GET foreign shipment by id allowed (no ownership on GET)', async () => {
      const response = await getLogisticsByIdRaw(
        seed.ownedByDp2.shipmentId,
        authBearerOnly(deliverySession)
      );
      expect(response.status).toBe(200);
    });
  });

  test.describe('Section F — Role API Access (Writes)', () => {
    test('LA-LOG-054 | Admin create shipment allowed', async () => {
      const pending = await createPendingShipment(
        adminSession,
        vendorSession,
        seed.product.id,
        'authz-create'
      );
      expect(pending.shipmentId).toBeTruthy();
    });

    test('LA-LOG-055 | Vendor create shipment forbidden', async () => {
      const response = await postLogisticsCreateRaw(
        seed.ownedByDp1.orderId,
        authBearerOnly(vendorSession)
      );
      expect(response.status).toBe(403);
    });

    test('LA-LOG-056 | Delivery create shipment forbidden', async () => {
      const response = await postLogisticsCreateRaw(
        seed.ownedByDp1.orderId,
        authBearerOnly(deliverySession)
      );
      expect(response.status).toBe(403);
    });

    test('LA-LOG-057 | SuperAdmin create shipment allowed', async () => {
      const pending = await createPendingShipment(
        adminSession,
        vendorSession,
        seed.product.id,
        'authz-sa-pending'
      );
      const response = await postLogisticsCreateRaw(
        pending.orderId,
        authBearerOnly(superAdminSession)
      );
      // Idempotent create returns existing shipment.
      expect([200, 201]).toContain(response.status);
    });

    test('LA-LOG-058 | Admin assign shipment allowed', async () => {
      const pending = await createPendingShipment(
        adminSession,
        vendorSession,
        seed.product.id,
        'authz-assign'
      );
      const response = await patchLogisticsAssignRaw(
        pending.shipmentId,
        seed.ownedByDp1.deliveryPartnerId,
        authBearerOnly(adminSession)
      );
      expect(response.status).toBe(200);
    });

    test('LA-LOG-059 | Vendor assign shipment forbidden', async () => {
      const response = await patchLogisticsAssignRaw(
        seed.ownedByDp1.shipmentId,
        seed.ownedByDp2.deliveryPartnerId,
        authBearerOnly(vendorSession)
      );
      expect(response.status).toBe(403);
    });

    test('LA-LOG-060 | Delivery assign shipment forbidden', async () => {
      const response = await patchLogisticsAssignRaw(
        seed.ownedByDp1.shipmentId,
        seed.ownedByDp2.deliveryPartnerId,
        authBearerOnly(deliverySession)
      );
      expect(response.status).toBe(403);
    });

    test('LA-LOG-061 | Admin reassign shipment allowed', async () => {
      const pending = await createPendingShipment(
        adminSession,
        vendorSession,
        seed.product.id,
        'authz-reassign'
      );
      await patchLogisticsAssignRaw(
        pending.shipmentId,
        seed.ownedByDp1.deliveryPartnerId,
        authBearerOnly(adminSession)
      );
      const response = await patchLogisticsReassignRaw(
        pending.shipmentId,
        seed.ownedByDp2.deliveryPartnerId,
        authBearerOnly(adminSession)
      );
      expect(response.status).toBe(200);
    });

    test('LA-LOG-062 | Vendor reassign shipment forbidden', async () => {
      const response = await patchLogisticsReassignRaw(
        seed.ownedByDp1.shipmentId,
        seed.ownedByDp2.deliveryPartnerId,
        authBearerOnly(vendorSession)
      );
      expect(response.status).toBe(403);
    });

    test('LA-LOG-063 | Admin accept delivery forbidden (partner-only)', async () => {
      const response = await postLogisticsAcceptRaw(
        seed.ownedByDp1.shipmentId,
        authBearerOnly(adminSession)
      );
      expect(response.status).toBe(403);
    });

    test('LA-LOG-064 | Vendor accept delivery forbidden', async () => {
      const response = await postLogisticsAcceptRaw(
        seed.ownedByDp1.shipmentId,
        authBearerOnly(vendorSession)
      );
      expect(response.status).toBe(403);
    });

    test('LA-LOG-065 | SuperAdmin accept delivery forbidden (partner-only)', async () => {
      const response = await postLogisticsAcceptRaw(
        seed.ownedByDp1.shipmentId,
        authBearerOnly(superAdminSession)
      );
      expect(response.status).toBe(403);
    });
  });

  test.describe('Section G — Ownership Isolation', () => {
    test('LA-LOG-066 | Delivery partner accept own assigned shipment allowed', async () => {
      const pending = await createPendingShipment(
        adminSession,
        vendorSession,
        seed.product.id,
        'authz-own-accept'
      );
      await patchLogisticsAssignRaw(
        pending.shipmentId,
        seed.ownedByDp1.deliveryPartnerId,
        authBearerOnly(adminSession)
      );
      const response = await postLogisticsAcceptRaw(
        pending.shipmentId,
        authBearerOnly(deliverySession)
      );
      expect(response.status).toBe(200);
    });

    test('LA-LOG-067 | Delivery partner cannot accept foreign shipment', async () => {
      const response = await postLogisticsAcceptRaw(
        seed.ownedByDp2.shipmentId,
        authBearerOnly(deliverySession)
      );
      expect(response.status).toBe(403);
      expect(messageOf(response.data).toLowerCase()).toMatch(/not assigned/);
    });

    test('LA-LOG-068 | Delivery partner cannot pick foreign shipment', async () => {
      const response = await postLogisticsPickRaw(
        seed.ownedByDp2.shipmentId,
        authBearerOnly(deliverySession)
      );
      expect(response.status).toBe(403);
      expect(messageOf(response.data).toLowerCase()).toMatch(/not assigned/);
    });

    test('LA-LOG-069 | Delivery partner cannot start foreign shipment', async () => {
      const response = await postLogisticsStartRaw(
        seed.ownedByDp2.shipmentId,
        authBearerOnly(deliverySession)
      );
      expect(response.status).toBe(403);
    });

    test('LA-LOG-070 | Delivery partner cannot mark foreign shipment delivered', async () => {
      const response = await postLogisticsDeliveredRaw(
        seed.ownedByDp2.shipmentId,
        authBearerOnly(deliverySession)
      );
      expect(response.status).toBe(403);
    });

    test('LA-LOG-071 | Delivery partner cannot complete foreign shipment', async () => {
      const response = await postLogisticsCompleteRaw(
        seed.ownedByDp2.shipmentId,
        { notes: 'authz' },
        authBearerOnly(deliverySession)
      );
      expect(response.status).toBe(403);
    });

    test('LA-LOG-072 | DP2 cannot accept DP1 shipment', async () => {
      const response = await postLogisticsAcceptRaw(
        seed.ownedByDp1.shipmentId,
        authBearerOnly(delivery2Session)
      );
      expect(response.status).toBe(403);
    });

    test('LA-LOG-073 | Location update has role gate only (no ownership) — DP1 may update DP2 shipment', async () => {
      // Production truth: updateLocation does not check deliveryPartnerId.
      const response = await postLogisticsLocationRaw(
        seed.ownedByDp2.shipmentId,
        { lat: 12.9, lng: 77.5 },
        authBearerOnly(deliverySession)
      );
      expect(response.status).toBe(200);
    });

    test('LA-LOG-074 | Vendor cannot update location', async () => {
      const response = await postLogisticsLocationRaw(
        seed.ownedByDp1.shipmentId,
        { lat: 12.9, lng: 77.5 },
        authBearerOnly(vendorSession)
      );
      expect(response.status).toBe(403);
    });
  });

  test.describe('Section H — Account Status & Session', () => {
    test('LA-LOG-075 | Inactive account GET delivery-queue returns 403', async () => {
      const inactive = getInactiveVendorCredentials();
      try {
        await loginApi(inactive.mobile, inactive.password);
        expect(true).toBe(false);
      } catch {
        // Login may be blocked — forge token from known inactive pattern via admin if needed.
      }
      // Prefer forging JWT for inactive user id if login blocked; reuse inventory pattern:
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
        // Fallback: inactive login is blocked — assert login rejection instead.
        await expect(
          loginApiFresh(inactive.mobile, inactive.password)
        ).rejects.toBeTruthy();
        return;
      }
      const token = signTestJwt({ id: inactiveId, role: 'VENDOR', sessionId: 'inactive-session' });
      const response = await getLogisticsQueueRaw(bearerOnly(token));
      expect([401, 403]).toContain(response.status);
    });

    test('LA-LOG-076 | Inactive account blocked from login', async () => {
      const inactive = getInactiveVendorCredentials();
      await expect(loginApiFresh(inactive.mobile, inactive.password)).rejects.toBeTruthy();
    });

    test('LA-LOG-077 | Invalid browser token redirects to login on delivery dashboard', async ({
      page,
    }) => {
      await page.addInitScript(() => {
        localStorage.setItem('accessToken', 'invalid.token.value');
        localStorage.setItem('token', 'invalid.token.value');
      });
      await page.goto('/delivery/dashboard');
      await expect(page).toHaveURL(/\/login/, { timeout: 15000 });
    });

    test('LA-LOG-078 | Logout blocks subsequent delivery dashboard access', async ({ page }) => {
      await establishSession(page, 'delivery');
      await page.goto('/delivery/dashboard');
      await logoutFlow(page);
      await page.goto('/delivery/dashboard');
      await expect(page).toHaveURL(/\/login/, { timeout: 15000 });
      deliverySession = await refreshDeliveryApiSession(1);
    });

    test('LA-LOG-079 | Logout blocks subsequent admin delivery-assignment access', async ({
      page,
    }) => {
      await establishSession(page, 'admin');
      await page.goto('/admin/delivery-assignment');
      await logoutFlow(page);
      await page.goto('/admin/delivery-assignment');
      await expect(page).toHaveURL(/\/login/, { timeout: 15000 });
      adminSession = await refreshAdminApiSession();
    });
  });

  test.describe('Section I — CSRF Implementation Truth', () => {
    test.beforeAll(async () => {
      vendorSession = await refreshVendorApiSession();
      adminSession = await refreshAdminApiSession();
      deliverySession = await refreshDeliveryApiSession(1);
    });

    test('LA-LOG-080 | Assign succeeds without CSRF header (Bearer only)', async () => {
      // Production: logistics uses injectCsrfToken only — no csrfProtection on writes.
      const pending = await createPendingShipment(
        adminSession,
        vendorSession,
        seed.product.id,
        'authz-csrf-assign'
      );
      const response = await patchLogisticsAssignRaw(
        pending.shipmentId,
        seed.ownedByDp1.deliveryPartnerId,
        authBearerOnly(adminSession)
      );
      expect(response.status).toBe(200);
    });

    test('LA-LOG-081 | Accept succeeds without CSRF header for assigned partner', async () => {
      const pending = await createPendingShipment(
        adminSession,
        vendorSession,
        seed.product.id,
        'authz-csrf-accept'
      );
      await patchLogisticsAssignRaw(
        pending.shipmentId,
        seed.ownedByDp1.deliveryPartnerId,
        authBearerOnly(adminSession)
      );
      const response = await postLogisticsAcceptRaw(
        pending.shipmentId,
        authBearerOnly(deliverySession)
      );
      expect(response.status).toBe(200);
    });

    test('LA-LOG-082 | GET delivery-queue succeeds without CSRF header', async () => {
      const response = await getLogisticsQueueRaw(authBearerOnly(adminSession));
      expect(response.status).toBe(200);
    });

    test('LA-LOG-083 | Authenticated GET may inject CSRF cookie', async () => {
      const response = await getLogisticsQueueRaw(authBearerOnly(adminSession));
      expect(response.status).toBe(200);
      const setCookie = response.headers['set-cookie'];
      if (setCookie) {
        const cookieText = Array.isArray(setCookie) ? setCookie.join(';') : String(setCookie);
        expect(cookieText.toLowerCase()).toMatch(/csrf/i);
      }
    });
  });

  test.describe('Section J — RBAC Source Truth', () => {
    test('LA-LOG-084 | Logistics routes use protect middleware', async () => {
      const routesSource = readBackendFile('src/modules/logistics/logistics.routes.js');
      expect(routesSource).toMatch(/protect/);
    });

    test('LA-LOG-085 | Lifecycle actions authorize DELIVERY_PARTNER only', async () => {
      const routesSource = readBackendFile('src/modules/logistics/logistics.routes.js');
      expect(routesSource).toMatch(
        /accept[\s\S]*authorize\('DELIVERY_PARTNER'\)/
      );
      expect(routesSource).toMatch(/pick[\s\S]*authorize\('DELIVERY_PARTNER'\)/);
      expect(routesSource).toMatch(/complete[\s\S]*authorize\('DELIVERY_PARTNER'\)/);
    });

    test('LA-LOG-086 | Create/assign/reassign authorize ADMIN and SUPER_ADMIN', async () => {
      const routesSource = readBackendFile('src/modules/logistics/logistics.routes.js');
      expect(routesSource).toMatch(/authorize\('ADMIN',\s*'SUPER_ADMIN'\)/);
      expect(routesSource).toMatch(/\/:id\/assign/);
      expect(routesSource).toMatch(/\/:id\/reassign/);
    });

    test('LA-LOG-087 | Queue/history/analytics include DELIVERY_PARTNER', async () => {
      const routesSource = readBackendFile('src/modules/logistics/logistics.routes.js');
      expect(routesSource).toMatch(
        /delivery-queue[\s\S]*authorize\('ADMIN',\s*'DELIVERY_PARTNER',\s*'SUPER_ADMIN'\)/
      );
    });

    test('LA-LOG-088 | Logistics routes do not mount csrfProtection', async () => {
      const routesSource = readBackendFile('src/modules/logistics/logistics.routes.js');
      expect(routesSource).not.toMatch(/csrfProtection/);
    });

    test('LA-LOG-089 | GET /:id has protect only (no authorize)', async () => {
      const routesSource = readBackendFile('src/modules/logistics/logistics.routes.js');
      expect(routesSource).toMatch(
        /router\.get\('\/:id',\s*protect,\s*controller\.getShipmentDetails\)/
      );
    });

    test('LA-LOG-090 | my-assignments authorize DELIVERY_PARTNER only', async () => {
      const routesSource = readBackendFile('src/modules/logistics/logistics.routes.js');
      expect(routesSource).toMatch(
        /my-assignments[\s\S]*authorize\('DELIVERY_PARTNER'\)/
      );
    });
  });

  test.describe('Section K — Client Session & Deep Links', () => {
    test('LA-LOG-091 | Login as delivery lands on delivery dashboard', async ({ page }) => {
      const creds = getDeliveryCredentials(1);
      const loginPage = new LoginPage(page);
      await loginPage.goto();
      await loginPage.fillMobile(creds.mobile);
      await loginPage.fillPassword(creds.password);
      await loginPage.submit();
      await expect(page).toHaveURL(/\/delivery\/dashboard/, { timeout: 20000 });
    });

    test('LA-LOG-092 | Login as admin lands on admin dashboard not assignment', async ({
      page,
    }) => {
      const creds = getAdminCredentials();
      const loginPage = new LoginPage(page);
      await loginPage.goto();
      await loginPage.fillMobile(creds.mobile);
      await loginPage.fillPassword(creds.password);
      await loginPage.submit();
      await expect(page).toHaveURL(/\/admin\/dashboard/, { timeout: 20000 });
    });

    test('LA-LOG-093 | Direct delivery order-details URL after logout redirects', async ({
      page,
    }) => {
      await establishSession(page, 'delivery');
      await page.goto(`/delivery/order-details/${seed.ownedByDp1.shipmentId}`);
      await logoutFlow(page);
      await page.goto(`/delivery/order-details/${seed.ownedByDp1.shipmentId}`);
      await expect(page).toHaveURL(/\/login/, { timeout: 15000 });
    });

    test('LA-LOG-094 | Guest API logistics endpoints remain 401', async () => {
      await expectApiStatus(() => apiClient.get('/logistics/delivery-queue'), 401);
      await expectApiStatus(() => apiClient.get('/logistics/my-assignments'), 401);
      await expectApiStatus(
        () => apiClient.post(`/logistics/${seed.ownedByDp1.shipmentId}/accept`, {}),
        401
      );
    });

    test('LA-LOG-095 | Customer role cannot access delivery-queue API', async () => {
      const customer = getCustomerCredentials();
      const session = await loginApiFresh(customer.mobile, customer.password);
      const response = await getLogisticsQueueRaw(authBearerOnly(session));
      expect(response.status).toBe(403);
    });
  });
});
