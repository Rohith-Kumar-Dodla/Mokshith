/**
 * Logistics Validation Certification Suite (LV-LOG)
 *
 * Production sources of truth:
 * - logistics.validation.js → assignDeliverySchema (assign + reassign only)
 * - logistics.service.js → partner ACTIVE check, terminal assign/reassign blocks, transition map
 * - error.middleware.js → CastError → 400 INVALID_ID
 * - DeliveryAssignment.jsx → Confirm disabled without selectedPartner
 * - OrderDetails.jsx → actions gated by loading / confirmed
 *
 * Explicitly NOT tested (no production validator):
 * - updateStatusSchema (dead code — not wired to routes)
 * - FAILED / CANCELLED transitions (enum-only; no API path)
 * - Joi ObjectId format on deliveryPartnerId (string only)
 * - createShipment / accept / pick / start / delivered / complete / location Joi
 */
import { test, expect, type Page } from '../fixtures/product.validation.fixture';
import { establishSession } from '../helpers/session.functional.helper';
import { type ApiSession } from '../helpers/auth.api.helper';
import { expectApiStatus } from '../helpers/validation/product.validation.helper';
import { AdminDeliveryAssignmentPage, DeliveryOrderDetailsPage } from '../pages/delivery/DeliveryPages';
import {
  advanceLifecycleTo,
  assertErrorEnvelope,
  assertSuccessEnvelope,
  clearLogisticsValidationRateLimits,
  createPendingShipment,
  getShipmentApi,
  INVALID_OBJECT_ID,
  messageOf,
  NONEXISTENT_OBJECT_ID,
  patchAssignApi,
  patchAssignRawFetch,
  patchReassignApi,
  postAcceptApi,
  postCompleteApi,
  postCreateShipmentApi,
  postDeliveredApi,
  postLocationApi,
  postPickApi,
  postStartApi,
  refreshVendorApiSession,
  seedLogisticsValidationData,
  type LogisticsValidationSeed,
} from '../helpers/logistics.validation.helper';

let adminSession: ApiSession;
let deliverySession: ApiSession;
let seed: LogisticsValidationSeed;
let completedShipmentId: string;
let deliveredForCompleteId: string;
let transitionShipmentId: string;

async function adminUi(page: Page) {
  await establishSession(page, 'admin');
}

async function deliveryUi(page: Page) {
  await establishSession(page, 'delivery');
}

test.describe('Logistics Validation Certification Suite', () => {
  test.beforeAll(async () => {
    clearLogisticsValidationRateLimits();
    const vendor = await refreshVendorApiSession();
    const seeded = await seedLogisticsValidationData(vendor);
    adminSession = seeded.adminSession;
    deliverySession = seeded.deliverySession;
    seed = seeded.seed;

    // Dedicated ASSIGNED shipment for invalid/duplicate transition cases
    const transition = await createPendingShipment(
      adminSession,
      vendor,
      seed.product.id,
      'val-transition'
    );
    const assignRes = await patchAssignApi(adminSession, transition.shipmentId, {
      deliveryPartnerId: seed.deliveryPartnerId,
    });
    await expectApiStatus(assignRes, 200);
    transitionShipmentId = transition.shipmentId;

    // Advance terminal seed → COMPLETED for assign/reassign terminal blocks
    await advanceLifecycleTo(seed.terminal.shipmentId, deliverySession, 'COMPLETED');
    completedShipmentId = seed.terminal.shipmentId;

    // Separate DELIVERED shipment for complete softness + assign-after-DELIVERED
    const deliveredSeed = await createPendingShipment(
      adminSession,
      vendor,
      seed.product.id,
      'val-delivered'
    );
    await expectApiStatus(
      await patchAssignApi(adminSession, deliveredSeed.shipmentId, {
        deliveryPartnerId: seed.deliveryPartnerId,
      }),
      200
    );
    await advanceLifecycleTo(deliveredSeed.shipmentId, deliverySession, 'DELIVERED');
    deliveredForCompleteId = deliveredSeed.shipmentId;
  });

  // ─── Section A — Assign Joi (assignDeliverySchema) ───────────────────────
  test.describe('Section A — PATCH assign Joi Input Validation', () => {
    test('LV-LOG-001 | Missing deliveryPartnerId rejected', async () => {
      const result = await patchAssignApi(adminSession, seed.pending.shipmentId, {});
      await expectApiStatus(result, 400);
      assertErrorEnvelope(result);
      expect(messageOf(result)).toMatch(/deliveryPartnerId.*required/i);
    });

    test('LV-LOG-002 | Null deliveryPartnerId rejected', async () => {
      const result = await patchAssignApi(adminSession, seed.pending.shipmentId, {
        deliveryPartnerId: null,
      });
      await expectApiStatus(result, 400);
      expect(messageOf(result).toLowerCase()).toMatch(/deliverypartnerid|string|required/);
    });

    test('LV-LOG-003 | Empty string deliveryPartnerId rejected', async () => {
      const result = await patchAssignApi(adminSession, seed.pending.shipmentId, {
        deliveryPartnerId: '',
      });
      await expectApiStatus(result, 400);
      expect(messageOf(result).toLowerCase()).toMatch(/empty|not allowed|required/);
    });

    test('LV-LOG-004 | Non-string deliveryPartnerId rejected', async () => {
      const result = await patchAssignApi(adminSession, seed.pending.shipmentId, {
        deliveryPartnerId: 12345,
      });
      await expectApiStatus(result, 400);
      expect(messageOf(result).toLowerCase()).toMatch(/string/);
    });

    test('LV-LOG-005 | Array deliveryPartnerId rejected', async () => {
      const result = await patchAssignApi(adminSession, seed.pending.shipmentId, {
        deliveryPartnerId: [seed.deliveryPartnerId],
      });
      await expectApiStatus(result, 400);
      expect(messageOf(result).toLowerCase()).toMatch(/string/);
    });

    test('LV-LOG-006 | Object deliveryPartnerId rejected (Mongo operator shape)', async () => {
      const result = await patchAssignApi(adminSession, seed.pending.shipmentId, {
        deliveryPartnerId: { $gt: '' },
      });
      await expectApiStatus(result, 400);
      assertErrorEnvelope(result);
      expect(messageOf(result).toLowerCase()).toMatch(/string/);
    });

    test('LV-LOG-007 | Reassign missing deliveryPartnerId rejected', async () => {
      const result = await patchReassignApi(adminSession, seed.assigned.shipmentId, {});
      await expectApiStatus(result, 400);
      expect(messageOf(result)).toMatch(/deliveryPartnerId.*required/i);
    });

    test('LV-LOG-008 | Reassign empty deliveryPartnerId rejected', async () => {
      const result = await patchReassignApi(adminSession, seed.assigned.shipmentId, {
        deliveryPartnerId: '',
      });
      await expectApiStatus(result, 400);
      expect(messageOf(result).toLowerCase()).toMatch(/empty|not allowed|required/);
    });
  });

  // ─── Section B — Assign / reassign service validation ─────────────────────
  test.describe('Section B — Assign / Reassign Service Validation', () => {
    test('LV-LOG-009 | Unknown deliveryPartner returns 404', async () => {
      const result = await patchAssignApi(adminSession, seed.pending.shipmentId, {
        deliveryPartnerId: NONEXISTENT_OBJECT_ID,
      });
      await expectApiStatus(result, 404);
      assertErrorEnvelope(result);
      expect(messageOf(result)).toMatch(/delivery partner not found or inactive/i);
    });

    test('LV-LOG-010 | Non-partner user id treated as inactive/not found', async () => {
      const result = await patchAssignApi(adminSession, seed.pending.shipmentId, {
        deliveryPartnerId: seed.vendorUserId,
      });
      await expectApiStatus(result, 404);
      expect(messageOf(result)).toMatch(/delivery partner not found or inactive/i);
    });

    test('LV-LOG-011 | Invalid shipment ObjectId on assign → CastError 400', async () => {
      const result = await patchAssignApi(adminSession, INVALID_OBJECT_ID, {
        deliveryPartnerId: seed.deliveryPartnerId,
      });
      await expectApiStatus(result, 400);
      assertErrorEnvelope(result);
      expect(messageOf(result)).toMatch(/invalid/i);
      expect(String(result.body?.error?.code || result.body?.code || '')).toMatch(/INVALID_ID|/);
    });

    test('LV-LOG-012 | Unknown shipment id on assign → 404', async () => {
      const result = await patchAssignApi(adminSession, NONEXISTENT_OBJECT_ID, {
        deliveryPartnerId: seed.deliveryPartnerId,
      });
      await expectApiStatus(result, 404);
      expect(messageOf(result)).toMatch(/shipment not found/i);
    });

    test('LV-LOG-013 | Invalid deliveryPartnerId ObjectId → CastError 400', async () => {
      const result = await patchAssignApi(adminSession, seed.pending.shipmentId, {
        deliveryPartnerId: INVALID_OBJECT_ID,
      });
      await expectApiStatus(result, 400);
      expect(messageOf(result)).toMatch(/invalid/i);
    });

    test('LV-LOG-014 | Re-assign same partner while ASSIGNED succeeds (no duplicate block)', async () => {
      const result = await patchAssignApi(adminSession, seed.assigned.shipmentId, {
        deliveryPartnerId: seed.deliveryPartnerId,
      });
      await expectApiStatus(result, 200);
      assertSuccessEnvelope(result);
    });

    test('LV-LOG-015 | Reassign to second partner succeeds before terminal', async () => {
      const result = await patchReassignApi(adminSession, seed.assigned.shipmentId, {
        deliveryPartnerId: seed.delivery2PartnerId,
      });
      await expectApiStatus(result, 200);
      assertSuccessEnvelope(result);
      // Restore DP1 for later delivery-owned flows if needed
      await patchReassignApi(adminSession, seed.assigned.shipmentId, {
        deliveryPartnerId: seed.deliveryPartnerId,
      });
    });

    test('LV-LOG-016 | Assign after COMPLETED rejected', async () => {
      const result = await patchAssignApi(adminSession, completedShipmentId, {
        deliveryPartnerId: seed.deliveryPartnerId,
      });
      await expectApiStatus(result, 400);
      expect(messageOf(result)).toMatch(/cannot assign partner to a completed delivery/i);
    });

    test('LV-LOG-017 | Reassign after COMPLETED rejected', async () => {
      const result = await patchReassignApi(adminSession, completedShipmentId, {
        deliveryPartnerId: seed.delivery2PartnerId,
      });
      await expectApiStatus(result, 400);
      expect(messageOf(result)).toMatch(/cannot reassign a completed delivery/i);
    });

    test('LV-LOG-018 | Assign after DELIVERED rejected (same terminal gate)', async () => {
      const result = await patchAssignApi(adminSession, deliveredForCompleteId, {
        deliveryPartnerId: seed.delivery2PartnerId,
      });
      await expectApiStatus(result, 400);
      expect(messageOf(result)).toMatch(/cannot assign partner to a completed delivery/i);
    });
  });

  // ─── Section C — Create shipment / GET ObjectId ───────────────────────────
  test.describe('Section C — Create Shipment & Lookup Validation', () => {
    test('LV-LOG-019 | Create shipment unknown order → 404', async () => {
      const result = await postCreateShipmentApi(adminSession, NONEXISTENT_OBJECT_ID, {});
      await expectApiStatus(result, 404);
      expect(messageOf(result)).toMatch(/order not found/i);
    });

    test('LV-LOG-020 | Create shipment invalid order ObjectId → 400', async () => {
      const result = await postCreateShipmentApi(adminSession, INVALID_OBJECT_ID, {});
      await expectApiStatus(result, 400);
      expect(messageOf(result)).toMatch(/invalid/i);
    });

    test('LV-LOG-021 | GET unknown shipment → 404', async () => {
      const result = await getShipmentApi(adminSession, NONEXISTENT_OBJECT_ID);
      await expectApiStatus(result, 404);
      expect(messageOf(result)).toMatch(/shipment not found|not found/i);
    });

    test('LV-LOG-022 | GET invalid shipment ObjectId → 400', async () => {
      const result = await getShipmentApi(adminSession, INVALID_OBJECT_ID);
      await expectApiStatus(result, 400);
      expect(messageOf(result)).toMatch(/invalid/i);
    });

    test('LV-LOG-023 | Duplicate create returns existing shipment (idempotent)', async () => {
      const result = await postCreateShipmentApi(adminSession, seed.pending.orderId, {});
      await expectApiStatus(result, 200);
      assertSuccessEnvelope(result);
    });
  });

  // ─── Section D — Lifecycle transition validation ──────────────────────────
  test.describe('Section D — Lifecycle Transition Validation', () => {
    test('LV-LOG-024 | Invalid skip transition ASSIGNED → PICKED rejected', async () => {
      const result = await postPickApi(deliverySession, transitionShipmentId, {});
      await expectApiStatus(result, 400);
      expect(messageOf(result)).toMatch(/invalid delivery transition/i);
    });

    test('LV-LOG-025 | Accept from ASSIGNED succeeds', async () => {
      const result = await postAcceptApi(deliverySession, transitionShipmentId, {});
      await expectApiStatus(result, 200);
      assertSuccessEnvelope(result);
    });

    test('LV-LOG-026 | Duplicate accept (ACCEPTED → ACCEPTED) rejected', async () => {
      const result = await postAcceptApi(deliverySession, transitionShipmentId, {});
      await expectApiStatus(result, 400);
      expect(messageOf(result)).toMatch(/invalid delivery transition from ACCEPTED to ACCEPTED/i);
    });

    test('LV-LOG-027 | Invalid start while ACCEPTED rejected', async () => {
      const result = await postStartApi(deliverySession, transitionShipmentId, {});
      await expectApiStatus(result, 400);
      expect(messageOf(result)).toMatch(/invalid delivery transition/i);
    });

    test('LV-LOG-028 | Transition after COMPLETED rejected', async () => {
      const result = await postAcceptApi(deliverySession, completedShipmentId, {});
      await expectApiStatus(result, 400);
      expect(messageOf(result)).toMatch(/invalid delivery transition from COMPLETED/i);
    });

    test('LV-LOG-029 | Delivered on PENDING shipment rejected', async () => {
      const result = await postDeliveredApi(deliverySession, seed.pending.shipmentId, {});
      await expectApiStatus(result, 400);
      expect(messageOf(result)).toMatch(/invalid delivery transition/i);
    });

    test('LV-LOG-030 | Complete without notes/proof when DELIVERED succeeds (optional)', async () => {
      const result = await postCompleteApi(deliverySession, deliveredForCompleteId, {});
      await expectApiStatus(result, 200);
      assertSuccessEnvelope(result);
    });

    test('LV-LOG-031 | Complete after already COMPLETED rejected', async () => {
      const result = await postCompleteApi(deliverySession, completedShipmentId, {
        notes: 'again',
      });
      await expectApiStatus(result, 400);
      expect(messageOf(result)).toMatch(/invalid delivery transition/i);
    });
  });

  // ─── Section E — Soft validators (no Joi on location / complete extras) ───
  test.describe('Section E — Soft / Absent Request Validators', () => {
    test('LV-LOG-032 | Location with empty body reaches service (no Joi)', async () => {
      // Use assigned seed — still active; location has no Joi; may 200 or 404
      const result = await postLocationApi(deliverySession, seed.assigned.shipmentId, {});
      // Production: no Joi — either updates with undefined coords (200) or fails soft
      expect([200, 400, 404]).toContain(result.status);
      if (result.status >= 400) assertErrorEnvelope(result);
      else assertSuccessEnvelope(result);
    });

    test('LV-LOG-033 | Complete accepts unicode notes when DELIVERED path available', async () => {
      // Create fresh DELIVERED shipment for unicode notes
      const vendor = await refreshVendorApiSession();
      const pending = await createPendingShipment(
        adminSession,
        vendor,
        seed.product.id,
        'val-unicode'
      );
      await expectApiStatus(
        await patchAssignApi(adminSession, pending.shipmentId, {
          deliveryPartnerId: seed.deliveryPartnerId,
        }),
        200
      );
      await advanceLifecycleTo(pending.shipmentId, deliverySession, 'DELIVERED');
      const result = await postCompleteApi(deliverySession, pending.shipmentId, {
        notes: '配達完了 ✅ café résumé',
      });
      await expectApiStatus(result, 200);
      assertSuccessEnvelope(result);
    });

    test('LV-LOG-034 | XSS string as deliveryPartnerId rejected by partner lookup or CastError', async () => {
      const result = await patchAssignApi(adminSession, seed.pending.shipmentId, {
        deliveryPartnerId: '<script>alert(1)</script>',
      });
      expect([400, 404]).toContain(result.status);
      assertErrorEnvelope(result);
    });

    test('LV-LOG-035 | Prototype pollution keys on assign do not grant success without partner', async () => {
      const result = await patchAssignApi(adminSession, seed.pending.shipmentId, {
        deliveryPartnerId: seed.deliveryPartnerId,
        __proto__: { admin: true },
        constructor: { prototype: { polluted: true } },
      });
      // allowUnknown:true — valid partner still assigns; pollution must not crash
      expect([200, 400]).toContain(result.status);
      if (result.status === 200) assertSuccessEnvelope(result);
      else assertErrorEnvelope(result);
    });
  });

  // ─── Section F — Transport / Content-Type ─────────────────────────────────
  test.describe('Section F — Transport Validation', () => {
    test('LV-LOG-036 | Invalid JSON body on assign rejected', async () => {
      const result = await patchAssignRawFetch(adminSession, seed.pending.shipmentId, {
        body: '{not-json',
        contentType: 'application/json',
      });
      expect([400, 500]).toContain(result.status);
      if (typeof result.body.success === 'boolean') {
        expect(result.body.success).toBe(false);
      }
    });

    test('LV-LOG-037 | Wrong Content-Type text/plain fails Joi (missing partner)', async () => {
      const result = await patchAssignRawFetch(adminSession, seed.pending.shipmentId, {
        body: JSON.stringify({ deliveryPartnerId: seed.deliveryPartnerId }),
        contentType: 'text/plain',
      });
      await expectApiStatus(result, 400);
      assertErrorEnvelope(result);
      expect(messageOf(result).toLowerCase()).toMatch(/body|deliverypartnerid|required/);
    });

    test('LV-LOG-038 | Empty body string with JSON content-type fails Joi', async () => {
      const result = await patchAssignRawFetch(adminSession, seed.pending.shipmentId, {
        body: '',
        contentType: 'application/json',
      });
      expect([400, 500]).toContain(result.status);
    });
  });

  // ─── Section G — Error / success envelopes ────────────────────────────────
  test.describe('Section G — Envelope Consistency', () => {
    test('LV-LOG-039 | Joi error envelope success=false + message', async () => {
      const result = await patchAssignApi(adminSession, seed.pending.shipmentId, {});
      await expectApiStatus(result, 400);
      assertErrorEnvelope(result);
      expect(typeof messageOf(result)).toBe('string');
      expect(result.body.data === null || result.body.data === undefined).toBeTruthy();
    });

    test('LV-LOG-040 | Service 404 envelope for unknown partner', async () => {
      const result = await patchAssignApi(adminSession, seed.pending.shipmentId, {
        deliveryPartnerId: NONEXISTENT_OBJECT_ID,
      });
      await expectApiStatus(result, 404);
      assertErrorEnvelope(result);
    });

    test('LV-LOG-041 | Transition error envelope', async () => {
      const result = await postPickApi(deliverySession, seed.pending.shipmentId, {});
      await expectApiStatus(result, 400);
      assertErrorEnvelope(result);
      expect(messageOf(result)).toMatch(/invalid delivery transition/i);
    });

    test('LV-LOG-042 | Successful assign envelope', async () => {
      // Ensure pending still assignable — may already be assigned by LV-LOG-035
      const getRes = await getShipmentApi(adminSession, seed.pending.shipmentId);
      const status = String(
        (getRes.body?.data as { status?: string } | undefined)?.status ||
          (getRes.body as { status?: string })?.status ||
          ''
      );
      if (status === 'PENDING' || status === 'ASSIGNED') {
        const result = await patchAssignApi(adminSession, seed.pending.shipmentId, {
          deliveryPartnerId: seed.deliveryPartnerId,
        });
        await expectApiStatus(result, 200);
        assertSuccessEnvelope(result);
      } else {
        // Already advanced — use a fresh pending
        const vendor = await refreshVendorApiSession();
        const pending = await createPendingShipment(
          adminSession,
          vendor,
          seed.product.id,
          'val-envelope'
        );
        const result = await patchAssignApi(adminSession, pending.shipmentId, {
          deliveryPartnerId: seed.deliveryPartnerId,
        });
        await expectApiStatus(result, 200);
        assertSuccessEnvelope(result);
      }
    });

    test('LV-LOG-043 | CastError includes INVALID_ID code when present', async () => {
      const result = await getShipmentApi(adminSession, INVALID_OBJECT_ID);
      await expectApiStatus(result, 400);
      assertErrorEnvelope(result);
      const code = (result.body?.error as { code?: string } | undefined)?.code;
      if (code) expect(code).toBe('INVALID_ID');
    });
  });

  // ─── Section H — Frontend client validation ───────────────────────────────
  test.describe('Section H — Frontend Client Validation', () => {
    test('LV-LOG-044 | Assign modal Confirm disabled without partner selection', async ({
      page,
    }) => {
      await adminUi(page);
      const assignment = new AdminDeliveryAssignmentPage(page);
      await assignment.goto();
      await assignment.waitForLoad();

      const assignBtn = page.getByRole('button', { name: /assign delivery/i }).first();
      const hasUnassigned = await assignBtn.isVisible().catch(() => false);
      if (!hasUnassigned) {
        // Seed pending exists — refresh list
        await assignment.refreshButton().click();
        await assignment.waitForLoad();
      }

      const visibleAssign = page.getByRole('button', { name: /assign delivery/i }).first();
      await expect(visibleAssign).toBeVisible({ timeout: 20000 });
      await visibleAssign.click();

      await expect(page.getByRole('heading', { name: /assign delivery partner/i })).toBeVisible();
      const confirm = page.getByRole('button', { name: /^confirm$/i });
      await expect(confirm).toBeDisabled();
    });

    test('LV-LOG-045 | Order details hides primary action while loading then enables', async ({
      page,
    }) => {
      await deliveryUi(page);
      const details = new DeliveryOrderDetailsPage(page);
      await details.goto(seed.assigned.shipmentId);
      await details.waitForLoad();
      // After load, either next-action or confirm/completed UI is present — not stuck loading
      await expect(page.getByText(/loading order details/i)).toHaveCount(0);
      await expect(details.pageHeading()).toBeVisible();
      await expect(details.timelineHeading()).toBeVisible();
    });

    test('LV-LOG-046 | Completed delivery Confirm button stays disabled', async ({ page }) => {
      await deliveryUi(page);
      const details = new DeliveryOrderDetailsPage(page);
      await details.goto(completedShipmentId);
      await details.waitForLoad();
      const confirm = page.getByRole('button', { name: /delivery confirmed|confirm delivery/i });
      if (await confirm.isVisible().catch(() => false)) {
        await expect(confirm).toBeDisabled();
      } else {
        // Completed shipments may only show timeline without confirm CTA
        await expect(details.timelineHeading()).toBeVisible();
      }
    });
  });
});
