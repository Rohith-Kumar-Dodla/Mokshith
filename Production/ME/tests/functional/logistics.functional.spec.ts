import { test, expect, type Page } from '../fixtures/product.functional.fixture';
import { establishSession } from '../helpers/session.functional.helper';
import { loginApi, type ApiSession } from '../helpers/auth.api.helper';
import { getVendorCredentials } from '../helpers/product.credentials';
import {
  AdminDeliveryAssignmentPage,
  DeliveryAssignedOrdersPage,
  DeliveryDashboardPage,
  DeliveryHistoryPage,
  DeliveryOrderDetailsPage,
} from '../pages/delivery/DeliveryPages';
import {
  advanceLifecycleTo,
  authHeaders,
  clearValidationRateLimits,
  createAssignedShipment,
  createPendingShipment,
  getAllLogisticsRaw,
  getLogisticsAnalyticsRaw,
  getLogisticsByIdRaw,
  getLogisticsHistoryRaw,
  getLogisticsQueueRaw,
  getMyAssignmentsRaw,
  getOrderByIdApi,
  linkedShipmentId,
  messageOf,
  partnerIdFromSession,
  patchLogisticsAssignRaw,
  patchLogisticsReassignRaw,
  postLogisticsAcceptRaw,
  postLogisticsCompleteRaw,
  postLogisticsCreateRaw,
  postLogisticsDeliveredRaw,
  postLogisticsLocationRaw,
  postLogisticsPickRaw,
  postLogisticsStartRaw,
  resolveShipmentId,
  seedLogisticsFunctionalData,
  unwrapData,
  unwrapList,
  type LogisticsFunctionalSeed,
} from '../helpers/logistics.functional.helper';

let adminSession: ApiSession;
let vendorSession: ApiSession;
let deliverySession: ApiSession;
let delivery2Session: ApiSession;
let seed: LogisticsFunctionalSeed;
let delivery2PartnerId: string;

async function adminUi(page: Page) {
  await establishSession(page, 'admin');
}

async function deliveryUi(page: Page) {
  await establishSession(page, 'delivery');
}

test.describe('Logistics Functional Suite', () => {
  test.beforeAll(async () => {
    clearValidationRateLimits();
    const vendorCreds = getVendorCredentials(1);
    vendorSession = await loginApi(vendorCreds.mobile, vendorCreds.password);
    const seeded = await seedLogisticsFunctionalData(vendorSession);
    adminSession = seeded.adminSession;
    deliverySession = seeded.deliverySession;
    delivery2Session = seeded.delivery2Session;
    seed = seeded.seed;
    delivery2PartnerId = partnerIdFromSession(delivery2Session);
    expect(seed.ui.shipmentId).toBeTruthy();
    expect(seed.ui.trackingNumber).toMatch(/^TRK-/);
  });

  test.describe('Section A — Admin Delivery Assignment UI', () => {
    test('LF-LOG-001 | Admin Delivery Assignment page loads with tabs', async ({ page }) => {
      await adminUi(page);
      const assignment = new AdminDeliveryAssignmentPage(page);
      await assignment.goto();
      await assignment.waitForLoad();
      await expect(assignment.pageHeading()).toBeVisible();
      await expect(assignment.tabButton(/unassigned/i)).toBeVisible();
      await expect(assignment.tabButton(/active/i)).toBeVisible();
      await expect(assignment.tabButton(/completed/i)).toBeVisible();
    });

    test('LF-LOG-002 | Assignment tabs switch list headings', async ({ page }) => {
      await adminUi(page);
      const assignment = new AdminDeliveryAssignmentPage(page);
      await assignment.goto();
      await assignment.waitForLoad();

      await assignment.tabButton(/unassigned/i).click();
      await expect(page.getByRole('heading', { name: /unassigned orders/i })).toBeVisible();

      await assignment.tabButton(/active/i).click();
      await expect(page.getByRole('heading', { name: /active deliveries/i })).toBeVisible();

      await assignment.tabButton(/completed/i).click();
      await expect(page.getByRole('heading', { name: /completed deliveries/i })).toBeVisible();
    });

    test('LF-LOG-003 | Admin search finds seeded active shipment', async ({ page }) => {
      await adminUi(page);
      const assignment = new AdminDeliveryAssignmentPage(page);
      await assignment.goto();
      await assignment.waitForLoad();
      await assignment.tabButton(/active/i).click();
      await assignment.search(seed.ui.shipmentId);
      // Admin list displays last 8 of orderId (or shipment id fallback).
      await expect(
        page.getByText(seed.ui.orderId.slice(-8).toUpperCase())
      ).toBeVisible();
    });

    test('LF-LOG-004 | Admin search with no matches shows empty list', async ({ page }) => {
      await adminUi(page);
      const assignment = new AdminDeliveryAssignmentPage(page);
      await assignment.goto();
      await assignment.waitForLoad();
      await assignment.tabButton(/active/i).click();
      await assignment.search(`no-match-${Date.now()}`);
      await expect(page.getByText(/0 records/i)).toBeVisible();
    });

    test('LF-LOG-005 | Admin Refresh reloads assignment data', async ({ page }) => {
      await adminUi(page);
      const assignment = new AdminDeliveryAssignmentPage(page);
      await assignment.goto();
      await assignment.waitForLoad();
      await assignment.refreshButton().click();
      await assignment.waitForLoad();
      await expect(assignment.pageHeading()).toBeVisible();
      await expect(assignment.tabButton(/active/i)).toBeVisible();
    });
  });

  test.describe('Section B — Delivery Partner Pages', () => {
    test('LF-LOG-006 | Delivery Operations Dashboard loads with stats', async ({ page }) => {
      await deliveryUi(page);
      const dashboard = new DeliveryDashboardPage(page);
      await dashboard.goto();
      await dashboard.waitForLoad();
      await expect(page.getByText(/assigned orders/i).first()).toBeVisible();
      await expect(page.getByText(/pending deliveries/i).first()).toBeVisible();
      await expect(page.getByText(/completed deliveries/i).first()).toBeVisible();
    });

    test('LF-LOG-007 | Assigned Deliveries lists seeded shipment', async ({ page }) => {
      await deliveryUi(page);
      const assigned = new DeliveryAssignedOrdersPage(page);
      await assigned.goto();
      await assigned.waitForLoad();
      await expect(page.getByRole('heading', { name: seed.ui.shipmentId, exact: true })).toBeVisible();
      await expect(page.getByText(/^assigned$/i).first()).toBeVisible();
    });

    test('LF-LOG-008 | Assigned Deliveries search finds shipment', async ({ page }) => {
      await deliveryUi(page);
      const assigned = new DeliveryAssignedOrdersPage(page);
      await assigned.goto();
      await assigned.waitForLoad();
      await assigned.search(seed.ui.shipmentId);
      await expect(page.getByRole('heading', { name: seed.ui.shipmentId, exact: true })).toBeVisible();
    });

    test('LF-LOG-009 | Assigned Deliveries search empty state', async ({ page }) => {
      await deliveryUi(page);
      const assigned = new DeliveryAssignedOrdersPage(page);
      await assigned.goto();
      await assigned.waitForLoad();
      await assigned.search(`zzz-no-orders-${Date.now()}`);
      await expect(assigned.emptyState()).toBeVisible();
    });

    test('LF-LOG-010 | Order Details loads timeline and status badge', async ({ page }) => {
      await deliveryUi(page);
      const details = new DeliveryOrderDetailsPage(page);
      await details.goto(seed.ui.shipmentId);
      await details.waitForLoad();
      await expect(details.timelineHeading()).toBeVisible();
      await expect(page.getByText(/order assigned/i)).toBeVisible();
      await expect(page.getByText(/^assigned$/i).first()).toBeVisible();
      await expect(page.getByText(/in progress/i).first()).toBeVisible();
      await expect(details.nextActionButton(/accept delivery/i)).toBeVisible();
    });

    test('LF-LOG-011 | Delivery History page loads', async ({ page }) => {
      await deliveryUi(page);
      const history = new DeliveryHistoryPage(page);
      await history.goto();
      await history.waitForLoad();
      await expect(history.pageHeading()).toBeVisible();
    });
  });

  test.describe('Section C — Create, Assign, Reassign', () => {
    test('LF-LOG-012 | Create shipment links order and sets PENDING + TRK', async () => {
      const pending = await createPendingShipment(
        adminSession,
        vendorSession,
        seed.product.id,
        'create'
      );
      expect(pending.shipmentId).toBeTruthy();
      expect(pending.trackingNumber).toMatch(/^TRK-/);

      const details = await getLogisticsByIdRaw(pending.shipmentId, authHeaders(adminSession));
      expect(details.status).toBe(200);
      expect(String(unwrapData(details.data).status || '').toUpperCase()).toBe('PENDING');

      const order = await getOrderByIdApi(vendorSession, pending.orderId);
      expect(linkedShipmentId(order)).toBe(pending.shipmentId);
    });

    test('LF-LOG-013 | Create shipment is idempotent for same order', async () => {
      const pending = await createPendingShipment(
        adminSession,
        vendorSession,
        seed.product.id,
        'idem'
      );
      const again = await postLogisticsCreateRaw(pending.orderId, authHeaders(adminSession));
      expect([200, 201]).toContain(again.status);
      expect(resolveShipmentId(unwrapData(again.data))).toBe(pending.shipmentId);
      expect(String(unwrapData(again.data).trackingNumber || '')).toBe(pending.trackingNumber);
    });

    test('LF-LOG-014 | Assign delivery partner advances PENDING→ASSIGNED and syncs order', async () => {
      const pending = await createPendingShipment(
        adminSession,
        vendorSession,
        seed.product.id,
        'assign'
      );
      const response = await patchLogisticsAssignRaw(
        pending.shipmentId,
        seed.ui.deliveryPartnerId,
        authHeaders(adminSession)
      );
      expect(response.status).toBe(200);
      const shipment = unwrapData(response.data);
      expect(String(shipment.status || '').toUpperCase()).toBe('ASSIGNED');
      const partner =
        shipment.deliveryPartnerId && typeof shipment.deliveryPartnerId === 'object'
          ? String(
              (shipment.deliveryPartnerId as { _id?: unknown })._id ||
                (shipment.deliveryPartnerId as { id?: unknown }).id ||
                ''
            )
          : String(shipment.deliveryPartnerId || '');
      expect(partner).toBe(seed.ui.deliveryPartnerId);

      const order = await getOrderByIdApi(vendorSession, pending.orderId);
      expect(String(order.status || '').toUpperCase()).toMatch(/PROCESSING|PACKED|OUT_FOR_DELIVERY|DELIVERED|COMPLETED/);
    });

    test('LF-LOG-015 | Reassign updates delivery partner', async () => {
      const assigned = await createAssignedShipment(
        adminSession,
        vendorSession,
        seed.product.id,
        seed.ui.deliveryPartnerId,
        'reassign'
      );
      const response = await patchLogisticsReassignRaw(
        assigned.shipmentId,
        delivery2PartnerId,
        authHeaders(adminSession)
      );
      expect(response.status).toBe(200);
      const shipment = unwrapData(response.data);
      const partner =
        shipment.deliveryPartnerId && typeof shipment.deliveryPartnerId === 'object'
          ? String(
              (shipment.deliveryPartnerId as { _id?: unknown })._id ||
                (shipment.deliveryPartnerId as { id?: unknown }).id ||
                ''
            )
          : String(shipment.deliveryPartnerId || '');
      expect(partner).toBe(delivery2PartnerId);

      const mine = await getMyAssignmentsRaw(authHeaders(delivery2Session));
      expect(mine.status).toBe(200);
      expect(
        unwrapList(mine.data).some((row) => String(row._id || row.id) === assigned.shipmentId)
      ).toBe(true);
    });

    test('LF-LOG-016 | Cannot assign partner after DELIVERED', async () => {
      const assigned = await createAssignedShipment(
        adminSession,
        vendorSession,
        seed.product.id,
        seed.ui.deliveryPartnerId,
        'assign-blocked'
      );
      await advanceLifecycleTo(assigned.shipmentId, deliverySession, 'DELIVERED');
      const response = await patchLogisticsAssignRaw(
        assigned.shipmentId,
        delivery2PartnerId,
        authHeaders(adminSession)
      );
      expect(response.status).toBe(400);
      expect(messageOf(response.data).toLowerCase()).toMatch(/cannot assign|completed/);
    });
  });

  test.describe('Section D — Lifecycle Transitions & Order Sync', () => {
    let life: { orderId: string; shipmentId: string; trackingNumber: string };

    test.beforeAll(async () => {
      life = await createAssignedShipment(
        adminSession,
        vendorSession,
        seed.product.id,
        seed.ui.deliveryPartnerId,
        'life'
      );
    });

    test('LF-LOG-017 | Accept advances to ACCEPTED', async () => {
      const response = await postLogisticsAcceptRaw(life.shipmentId, authHeaders(deliverySession));
      expect(response.status).toBe(200);
      expect(String(unwrapData(response.data).status || '').toUpperCase()).toBe('ACCEPTED');
      const order = await getOrderByIdApi(vendorSession, life.orderId);
      expect(String(order.status || '').toUpperCase()).toMatch(/PROCESSING|PACKED|OUT_FOR_DELIVERY|DELIVERED|COMPLETED/);
    });

    test('LF-LOG-018 | Pick advances to PICKED and syncs order to PACKED+', async () => {
      const response = await postLogisticsPickRaw(life.shipmentId, authHeaders(deliverySession));
      expect(response.status).toBe(200);
      expect(String(unwrapData(response.data).status || '').toUpperCase()).toBe('PICKED');
      const order = await getOrderByIdApi(vendorSession, life.orderId);
      expect(String(order.status || '').toUpperCase()).toMatch(/PACKED|OUT_FOR_DELIVERY|DELIVERED|COMPLETED/);
    });

    test('LF-LOG-019 | Start advances to OUT_FOR_DELIVERY', async () => {
      const response = await postLogisticsStartRaw(life.shipmentId, authHeaders(deliverySession));
      expect(response.status).toBe(200);
      expect(String(unwrapData(response.data).status || '').toUpperCase()).toBe('OUT_FOR_DELIVERY');
      const order = await getOrderByIdApi(vendorSession, life.orderId);
      expect(String(order.status || '').toUpperCase()).toMatch(/OUT_FOR_DELIVERY|DELIVERED|COMPLETED/);
    });

    test('LF-LOG-020 | Mark delivered sets DELIVERED and deliveredAt', async () => {
      const response = await postLogisticsDeliveredRaw(
        life.shipmentId,
        authHeaders(deliverySession)
      );
      expect(response.status).toBe(200);
      const shipment = unwrapData(response.data);
      expect(String(shipment.status || '').toUpperCase()).toBe('DELIVERED');
      expect(shipment.deliveredAt).toBeTruthy();
      const order = await getOrderByIdApi(vendorSession, life.orderId);
      expect(String(order.status || '').toUpperCase()).toMatch(/DELIVERED|COMPLETED/);
    });

    test('LF-LOG-021 | Complete with notes sets COMPLETED and syncs order', async () => {
      const response = await postLogisticsCompleteRaw(
        life.shipmentId,
        { notes: 'LF-LOG functional complete' },
        authHeaders(deliverySession)
      );
      expect(response.status).toBe(200);
      const shipment = unwrapData(response.data);
      expect(String(shipment.status || '').toUpperCase()).toBe('COMPLETED');
      expect(shipment.completedAt).toBeTruthy();
      expect(String(shipment.deliveryNotes || '')).toContain('LF-LOG functional complete');
      const order = await getOrderByIdApi(vendorSession, life.orderId);
      expect(String(order.status || '').toUpperCase()).toBe('COMPLETED');
    });

    test('LF-LOG-022 | Tracking number persists through full lifecycle', async () => {
      const details = await getLogisticsByIdRaw(life.shipmentId, authHeaders(adminSession));
      expect(details.status).toBe(200);
      expect(String(unwrapData(details.data).trackingNumber || '')).toBe(life.trackingNumber);
      expect(String(unwrapData(details.data).status || '').toUpperCase()).toBe('COMPLETED');
    });
  });

  test.describe('Section E — Queue, History, Analytics & Persistence', () => {
    test('LF-LOG-023 | Admin delivery-queue excludes COMPLETED lifecycle shipment', async () => {
      const life = await createAssignedShipment(
        adminSession,
        vendorSession,
        seed.product.id,
        seed.ui.deliveryPartnerId,
        'queue-complete'
      );
      await advanceLifecycleTo(life.shipmentId, deliverySession, 'COMPLETED');
      const queue = await getLogisticsQueueRaw(authHeaders(adminSession));
      expect(queue.status).toBe(200);
      expect(
        unwrapList(queue.data).some((row) => String(row._id || row.id) === life.shipmentId)
      ).toBe(false);
    });

    test('LF-LOG-024 | my-assignments excludes COMPLETED shipment', async () => {
      const life = await createAssignedShipment(
        adminSession,
        vendorSession,
        seed.product.id,
        seed.ui.deliveryPartnerId,
        'mine-complete'
      );
      await advanceLifecycleTo(life.shipmentId, deliverySession, 'COMPLETED');
      const mine = await getMyAssignmentsRaw(authHeaders(deliverySession));
      expect(mine.status).toBe(200);
      expect(
        unwrapList(mine.data).some((row) => String(row._id || row.id) === life.shipmentId)
      ).toBe(false);
    });

    test('LF-LOG-025 | History includes COMPLETED shipment', async () => {
      const life = await createAssignedShipment(
        adminSession,
        vendorSession,
        seed.product.id,
        seed.ui.deliveryPartnerId,
        'hist'
      );
      await advanceLifecycleTo(life.shipmentId, deliverySession, 'COMPLETED');
      const history = await getLogisticsHistoryRaw(authHeaders(deliverySession));
      expect(history.status).toBe(200);
      expect(
        unwrapList(history.data).some((row) => String(row._id || row.id) === life.shipmentId)
      ).toBe(true);
    });

    test('LF-LOG-026 | Analytics endpoint succeeds for delivery partner', async () => {
      const response = await getLogisticsAnalyticsRaw(authHeaders(deliverySession));
      expect(response.status).toBe(200);
      const data = unwrapData(response.data);
      expect(data).toBeTruthy();
      expect(
        typeof data.activeDeliveries === 'number' ||
          typeof data.completedDeliveries === 'number' ||
          typeof data.totalDeliveries === 'number'
      ).toBe(true);
    });

    test('LF-LOG-027 | Admin GET /logistics lists shipments including seed', async () => {
      const response = await getAllLogisticsRaw(authHeaders(adminSession));
      expect(response.status).toBe(200);
      const list = unwrapList(response.data);
      expect(Array.isArray(list)).toBe(true);
      expect(list.some((row) => String(row._id || row.id) === seed.ui.shipmentId)).toBe(true);
    });

    test('LF-LOG-028 | Location update persists currentLocation', async () => {
      const assigned = await createAssignedShipment(
        adminSession,
        vendorSession,
        seed.product.id,
        seed.ui.deliveryPartnerId,
        'loc'
      );
      const response = await postLogisticsLocationRaw(
        assigned.shipmentId,
        { lat: 12.9716, lng: 77.5946 },
        authHeaders(deliverySession)
      );
      expect(response.status).toBe(200);
      const details = await getLogisticsByIdRaw(assigned.shipmentId, authHeaders(adminSession));
      const shipment = unwrapData(details.data);
      const loc = shipment.currentLocation as { lat?: number; lng?: number } | undefined;
      expect(Number(loc?.lat)).toBeCloseTo(12.9716, 3);
      expect(Number(loc?.lng)).toBeCloseTo(77.5946, 3);
    });

    test('LF-LOG-029 | Dashboard reload still succeeds after completed deliveries', async ({
      page,
    }) => {
      await deliveryUi(page);
      const dashboard = new DeliveryDashboardPage(page);
      await dashboard.goto();
      await dashboard.waitForLoad();
      await page.reload();
      await dashboard.waitForLoad();
      await expect(dashboard.pageHeading()).toBeVisible();
    });
  });

  test.describe('Section F — Multi-shipment & Ownership Behavior', () => {
    test('LF-LOG-030 | Multiple active shipments coexist for partner', async () => {
      const a = await createAssignedShipment(
        adminSession,
        vendorSession,
        seed.product.id,
        seed.ui.deliveryPartnerId,
        'multi-a'
      );
      const b = await createAssignedShipment(
        adminSession,
        vendorSession,
        seed.product.id,
        seed.ui.deliveryPartnerId,
        'multi-b'
      );
      const mine = await getMyAssignmentsRaw(authHeaders(deliverySession));
      expect(mine.status).toBe(200);
      const ids = unwrapList(mine.data).map((row) => String(row._id || row.id));
      expect(ids).toContain(a.shipmentId);
      expect(ids).toContain(b.shipmentId);
      expect(ids).toContain(seed.ui.shipmentId);
    });

    test('LF-LOG-031 | Other partner cannot accept owned shipment (ownership)', async () => {
      const assigned = await createAssignedShipment(
        adminSession,
        vendorSession,
        seed.product.id,
        seed.ui.deliveryPartnerId,
        'own'
      );
      const response = await postLogisticsAcceptRaw(
        assigned.shipmentId,
        authHeaders(delivery2Session)
      );
      expect(response.status).toBe(403);
      expect(messageOf(response.data).toLowerCase()).toMatch(/not assigned|forbidden|not authorized/);
    });

    test('LF-LOG-032 | Invalid jump ASSIGNED→DELIVERED rejected', async () => {
      const assigned = await createAssignedShipment(
        adminSession,
        vendorSession,
        seed.product.id,
        seed.ui.deliveryPartnerId,
        'jump'
      );
      const response = await postLogisticsDeliveredRaw(
        assigned.shipmentId,
        authHeaders(deliverySession)
      );
      expect(response.status).toBe(400);
      expect(messageOf(response.data).toLowerCase()).toMatch(/transition|invalid|not allowed|cannot|step/);
    });
  });

  test.describe('Section G — UI Lifecycle Actions', () => {
    test('LF-LOG-033 | UI Accept Delivery advances status badge', async ({ page }) => {
      const assigned = await createAssignedShipment(
        adminSession,
        vendorSession,
        seed.product.id,
        seed.ui.deliveryPartnerId,
        'ui-accept'
      );
      await deliveryUi(page);
      const details = new DeliveryOrderDetailsPage(page);
      await details.goto(assigned.shipmentId);
      await details.waitForLoad();
      await details.nextActionButton(/accept delivery/i).click();
      await expect(page.getByText(/accept delivery successful/i)).toBeVisible({ timeout: 15000 });
      await expect(page.getByText(/^accepted$/i).first()).toBeVisible();
      await expect(details.nextActionButton(/mark picked up/i)).toBeVisible();
    });

    test('LF-LOG-034 | UI Pick → Start → Delivered → Confirm completes shipment', async ({
      page,
    }) => {
      const assigned = await createAssignedShipment(
        adminSession,
        vendorSession,
        seed.product.id,
        seed.ui.deliveryPartnerId,
        'ui-full'
      );
      await postLogisticsAcceptRaw(assigned.shipmentId, authHeaders(deliverySession));

      await deliveryUi(page);
      const details = new DeliveryOrderDetailsPage(page);
      await details.goto(assigned.shipmentId);
      await details.waitForLoad();

      await details.nextActionButton(/mark picked up/i).click();
      await expect(page.getByText(/mark picked up successful/i)).toBeVisible({ timeout: 15000 });

      await details.nextActionButton(/start delivery/i).click();
      await expect(page.getByText(/start delivery successful/i)).toBeVisible({ timeout: 15000 });

      await details.nextActionButton(/mark delivered/i).click();
      await expect(page.getByText(/mark delivered successful/i)).toBeVisible({ timeout: 15000 });

      await details.notesInput().fill('UI confirm notes');
      await details.confirmDeliveryButton().click();
      await expect(page.getByText(/delivery confirmed and completed/i)).toBeVisible({
        timeout: 15000,
      });
      await expect(page.getByText(/^completed$/i).first()).toBeVisible();

      const order = await getOrderByIdApi(vendorSession, assigned.orderId);
      expect(String(order.status || '').toUpperCase()).toBe('COMPLETED');
    });

    test('LF-LOG-035 | Order details reload persists current status after accept', async ({
      page,
    }) => {
      const assigned = await createAssignedShipment(
        adminSession,
        vendorSession,
        seed.product.id,
        seed.ui.deliveryPartnerId,
        'ui-reload'
      );
      await postLogisticsAcceptRaw(assigned.shipmentId, authHeaders(deliverySession));
      await deliveryUi(page);
      const details = new DeliveryOrderDetailsPage(page);
      await details.goto(assigned.shipmentId);
      await details.waitForLoad();
      await expect(page.getByText(/^accepted$/i).first()).toBeVisible();
      await page.reload();
      await details.waitForLoad();
      await expect(page.getByText(/^accepted$/i).first()).toBeVisible();
      await expect(details.timelineHeading()).toBeVisible();
      await expect(page.getByText(/in progress/i).first()).toBeVisible();
    });

    test('LF-LOG-036 | Completed shipment appears on History UI', async ({ page }) => {
      const assigned = await createAssignedShipment(
        adminSession,
        vendorSession,
        seed.product.id,
        seed.ui.deliveryPartnerId,
        'ui-hist'
      );
      await advanceLifecycleTo(assigned.shipmentId, deliverySession, 'COMPLETED');
      await deliveryUi(page);
      const history = new DeliveryHistoryPage(page);
      await history.goto();
      await history.waitForLoad();
      await expect(page.getByText(assigned.shipmentId).first()).toBeVisible();
    });
  });
});
