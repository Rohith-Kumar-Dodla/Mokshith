import { test, expect } from '../fixtures/product.functional.fixture';
import { loginApi, type ApiSession } from '../helpers/auth.api.helper';
import { establishSession } from '../helpers/session.functional.helper';
import { getVendorCredentials } from '../helpers/product.credentials';
import {
  AdminDeliveryAssignmentPage,
  DeliveryAssignedOrdersPage,
  DeliveryDashboardPage,
} from '../pages/delivery/DeliveryPages';
import {
  authHeaders,
  clearValidationRateLimits,
  getLogisticsByIdRaw,
  getLogisticsQueueRaw,
  getMyAssignmentsRaw,
  getOrderByIdApi,
  messageOf,
  patchLogisticsAssignRaw,
  postLogisticsAcceptRaw,
  postLogisticsCompleteRaw,
  postLogisticsCreateRaw,
  postLogisticsDeliveredRaw,
  postLogisticsPickRaw,
  postLogisticsStartRaw,
  seedLogisticsSmokeData,
  unwrapData,
  unwrapList,
  type LogisticsSmokeSeed,
} from '../helpers/logistics.smoke.helper';

test.describe('Logistics Smoke Suite', () => {
  let adminSession: ApiSession;
  let vendorSession: ApiSession;
  let deliverySession: ApiSession;
  let seed: LogisticsSmokeSeed;

  test.beforeAll(async () => {
    clearValidationRateLimits();
    const vendorCreds = getVendorCredentials(1);
    vendorSession = await loginApi(vendorCreds.mobile, vendorCreds.password);
    const seeded = await seedLogisticsSmokeData(vendorSession);
    adminSession = seeded.adminSession;
    deliverySession = seeded.deliverySession;
    seed = seeded.seed;
    expect(seed.orderId).toBeTruthy();
    expect(seed.shipmentId).toBeTruthy();
    expect(seed.deliveryPartnerId).toBeTruthy();
  });

  test('LS-LOG-001 | Guest blocked from delivery dashboard', async ({ page }) => {
    await page.goto('/delivery/dashboard');
    await expect(page).toHaveURL(/\/login/);
  });

  test('LS-LOG-002 | Guest blocked from admin delivery-assignment', async ({ page }) => {
    await page.goto('/admin/delivery-assignment');
    await expect(page).toHaveURL(/\/login/);
  });

  test('LS-LOG-003 | Vendor redirected from delivery dashboard', async ({ page }) => {
    await establishSession(page, 'vendor');
    await page.goto('/delivery/dashboard');
    await expect(page).toHaveURL(/\/vendor\/dashboard/);
  });

  test('LS-LOG-004 | Admin Delivery Assignment page loads', async ({ page }) => {
    await establishSession(page, 'admin');
    const assignmentPage = new AdminDeliveryAssignmentPage(page);
    await assignmentPage.goto();
    await assignmentPage.waitForLoad();
    await expect(assignmentPage.pageHeading()).toBeVisible();
    await expect(page.getByText(/unassigned|active|completed/i).first()).toBeVisible();
  });

  test('LS-LOG-005 | Delivery Operations Dashboard loads', async ({ page }) => {
    await establishSession(page, 'delivery');
    const dashboard = new DeliveryDashboardPage(page);
    await dashboard.goto();
    await dashboard.waitForLoad();
    await expect(dashboard.pageHeading()).toBeVisible();
    await expect(page.getByText(/assigned orders|pending deliveries|completed/i).first()).toBeVisible();
  });

  test('LS-LOG-006 | Delivery Assigned Orders page loads', async ({ page }) => {
    await establishSession(page, 'delivery');
    const assigned = new DeliveryAssignedOrdersPage(page);
    await assigned.goto();
    await assigned.waitForLoad();
    await expect(page).toHaveURL(/\/delivery\/assigned-orders/);
  });

  test('LS-LOG-007 | Seed shipment linked to order', async () => {
    const order = await getOrderByIdApi(vendorSession, seed.orderId);
    // Production may return shipmentId as ObjectId string or populated Logistics doc.
    const linkedId =
      order.shipmentId && typeof order.shipmentId === 'object'
        ? String(order.shipmentId._id || order.shipmentId.id || '')
        : String(order.shipmentId || order.shipment?._id || '');
    expect(linkedId).toBe(seed.shipmentId);
    const details = await getLogisticsByIdRaw(seed.shipmentId, authHeaders(adminSession));
    expect(details.status).toBe(200);
    const shipment = unwrapData(details.data);
    expect(String(shipment._id || shipment.id)).toBe(seed.shipmentId);
    expect(String(shipment.status || '').toUpperCase()).toBe('ASSIGNED');
    expect(String(shipment.trackingNumber || seed.trackingNumber)).toMatch(/^TRK-/);
  });

  test('LS-LOG-008 | Admin GET delivery-queue succeeds', async () => {
    const response = await getLogisticsQueueRaw(authHeaders(adminSession));
    expect(response.status).toBe(200);
    const list = unwrapList(response.data);
    expect(Array.isArray(list)).toBe(true);
    expect(list.some((row) => String(row._id || row.id) === seed.shipmentId)).toBe(true);
  });

  test('LS-LOG-009 | Delivery partner sees assignment in my-assignments', async () => {
    const response = await getMyAssignmentsRaw(authHeaders(deliverySession));
    expect(response.status).toBe(200);
    const list = unwrapList(response.data);
    expect(list.some((row) => String(row._id || row.id) === seed.shipmentId)).toBe(true);
  });

  test('LS-LOG-010 | Unauthenticated GET my-assignments rejected', async () => {
    const response = await getMyAssignmentsRaw();
    expect(response.status).toBe(401);
  });

  test('LS-LOG-011 | Unauthenticated assign rejected', async () => {
    const response = await patchLogisticsAssignRaw(seed.shipmentId, seed.deliveryPartnerId);
    expect([401, 403]).toContain(response.status);
  });

  test('LS-LOG-012 | Invalid lifecycle jump ASSIGNED→DELIVERED rejected', async () => {
    const response = await postLogisticsDeliveredRaw(
      seed.shipmentId,
      authHeaders(deliverySession)
    );
    expect(response.status).toBe(400);
    expect(messageOf(response.data).toLowerCase()).toMatch(/transition|invalid|not allowed|cannot/);
  });

  test('LS-LOG-013 | Accept delivery advances to ACCEPTED', async () => {
    const response = await postLogisticsAcceptRaw(seed.shipmentId, authHeaders(deliverySession));
    expect(response.status).toBe(200);
    const shipment = unwrapData(response.data);
    expect(String(shipment.status || '').toUpperCase()).toBe('ACCEPTED');
  });

  test('LS-LOG-014 | Pick advances to PICKED', async () => {
    const response = await postLogisticsPickRaw(seed.shipmentId, authHeaders(deliverySession));
    expect(response.status).toBe(200);
    expect(String(unwrapData(response.data).status || '').toUpperCase()).toBe('PICKED');
  });

  test('LS-LOG-015 | Start advances to OUT_FOR_DELIVERY', async () => {
    const response = await postLogisticsStartRaw(seed.shipmentId, authHeaders(deliverySession));
    expect(response.status).toBe(200);
    expect(String(unwrapData(response.data).status || '').toUpperCase()).toBe('OUT_FOR_DELIVERY');
  });

  test('LS-LOG-016 | Mark delivered advances to DELIVERED', async () => {
    const response = await postLogisticsDeliveredRaw(
      seed.shipmentId,
      authHeaders(deliverySession)
    );
    expect(response.status).toBe(200);
    expect(String(unwrapData(response.data).status || '').toUpperCase()).toBe('DELIVERED');
  });

  test('LS-LOG-017 | Complete advances to COMPLETED and syncs order', async () => {
    const response = await postLogisticsCompleteRaw(
      seed.shipmentId,
      { notes: 'LS-LOG smoke complete' },
      authHeaders(deliverySession)
    );
    expect(response.status).toBe(200);
    expect(String(unwrapData(response.data).status || '').toUpperCase()).toBe('COMPLETED');

    const order = await getOrderByIdApi(vendorSession, seed.orderId);
    expect(String(order.status || '').toUpperCase()).toMatch(/DELIVERED|COMPLETED/);
  });

  test('LS-LOG-018 | Create shipment for unknown order rejected', async () => {
    const response = await postLogisticsCreateRaw(
      '000000000000000000000001',
      authHeaders(adminSession)
    );
    expect([400, 404]).toContain(response.status);
    expect(response.status).not.toBe(200);
  });
});
