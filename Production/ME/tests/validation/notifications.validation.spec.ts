/**
 * Notifications Validation Certification Suite (NV-NOT)
 *
 * Production sources of truth:
 * - notification.validation.js → markAsReadSchema (params.id string.required ONLY)
 * - notification.routes.js → validate(markAsReadSchema) on PATCH /:id/read only
 * - GET / and PATCH /read-all → no Joi
 * - findByIdAndUpdate unknown ObjectId → null (200 + data null) — no 404 service check
 * - error.middleware.js → CastError → 400 INVALID_ID
 * - Drawer Mark All / check buttons are UI no-ops (no client validators)
 *
 * Explicitly NOT invented:
 * - Ownership validation on mark-read
 * - CSRF rejection on writes
 * - ObjectId format in Joi (string only — CastError at mongoose)
 * - Query/body schemas on GET / mark-all
 */
import { test, expect } from '../fixtures/product.validation.fixture';
import { type ApiSession } from '../helpers/auth.api.helper';
import { establishSession } from '../helpers/session.functional.helper';
import { expectApiStatus } from '../helpers/validation/product.validation.helper';
import {
  assertErrorEnvelope,
  assertSuccessEnvelope,
  clearNotificationsValidationRateLimits,
  getNotificationsApi,
  getNotificationsWithQueryApi,
  INVALID_OBJECT_ID,
  messageOf,
  NONEXISTENT_OBJECT_ID,
  notificationIdOf,
  patchMarkAllApi,
  patchMarkAllRawFetch,
  patchMarkReadApi,
  patchMarkReadRawFetch,
  readBackendFile,
  refreshVendorApiSession,
  seedNotificationsValidationData,
  unwrapList,
  type NotificationsValidationSeed,
} from '../helpers/notifications.validation.helper';

let vendorSession: ApiSession;
let seed: NotificationsValidationSeed;

test.describe('Notifications Validation Certification Suite', () => {
  test.beforeAll(async () => {
    clearNotificationsValidationRateLimits();
    vendorSession = await refreshVendorApiSession();
    const seeded = await seedNotificationsValidationData(vendorSession);
    seed = seeded.seed;
    expect(seed.validAnyId).toBeTruthy();
  });

  // ─── A — markAsReadSchema / params ───────────────────────────────────────
  test.describe('Section A — PATCH /:id/read Joi (markAsReadSchema)', () => {
    test('NV-NOT-001 | Invalid ObjectId string → CastError 400', async () => {
      const result = await patchMarkReadApi(vendorSession, INVALID_OBJECT_ID, {});
      await expectApiStatus(result, 400);
      assertErrorEnvelope(result);
      expect(messageOf(result).toLowerCase()).toMatch(/invalid|cast|objectid|_id/i);
    });

    test('NV-NOT-002 | CastError includes INVALID_ID code when present', async () => {
      const result = await patchMarkReadApi(vendorSession, INVALID_OBJECT_ID, {});
      await expectApiStatus(result, 400);
      const err = result.body.error as { code?: string } | undefined;
      if (err && typeof err === 'object' && err.code) {
        expect(err.code).toBe('INVALID_ID');
      }
    });

    test('NV-NOT-003 | Unknown but valid ObjectId → 200 with null data (no 404)', async () => {
      // Production: findByIdAndUpdate returns null; controller still successResponse.
      const result = await patchMarkReadApi(vendorSession, NONEXISTENT_OBJECT_ID, {});
      await expectApiStatus(result, 200);
      assertSuccessEnvelope(result);
      expect(messageOf(result)).toMatch(/notification marked as read/i);
      expect(result.body.data === null || result.body.data === undefined).toBeTruthy();
    });

    test('NV-NOT-004 | Valid id + empty body succeeds', async () => {
      const result = await patchMarkReadApi(vendorSession, seed.validAnyId, {});
      await expectApiStatus(result, 200);
      assertSuccessEnvelope(result);
      expect(messageOf(result)).toMatch(/notification marked as read/i);
    });

    test('NV-NOT-005 | Valid id + null body fields ignored (params-only schema)', async () => {
      const result = await patchMarkReadApi(vendorSession, seed.validAnyId, {
        isRead: null,
        title: null,
      });
      await expectApiStatus(result, 200);
      assertSuccessEnvelope(result);
    });

    test('NV-NOT-006 | Extra unknown body fields allowed (allowUnknown)', async () => {
      const result = await patchMarkReadApi(vendorSession, seed.validAnyId, {
        forgedAdmin: true,
        __proto__: { admin: true },
        extra: 'ignored',
      });
      await expectApiStatus(result, 200);
      assertSuccessEnvelope(result);
    });

    test('NV-NOT-007 | XSS-looking id rejected (CastError 400 or route 404)', async () => {
      // Production: axios encodes <> → Express may 404 "Route not found" before mongoose CastError.
      const result = await patchMarkReadApi(
        vendorSession,
        '<script>alert(1)</script>',
        {}
      );
      expect([400, 404]).toContain(result.status);
      assertErrorEnvelope(result);
    });

    test('NV-NOT-008 | Unicode id rejected via CastError', async () => {
      const result = await patchMarkReadApi(vendorSession, '通知-Δ-🚀', {});
      await expectApiStatus(result, 400);
      assertErrorEnvelope(result);
    });

    test('NV-NOT-009 | Mongo operator-looking id rejected via CastError', async () => {
      const result = await patchMarkReadApi(vendorSession, '$gt', {});
      await expectApiStatus(result, 400);
      assertErrorEnvelope(result);
    });

    test('NV-NOT-010 | 24-char non-hex id → CastError 400', async () => {
      const result = await patchMarkReadApi(
        vendorSession,
        'zzzzzzzzzzzzzzzzzzzzzzzz',
        {}
      );
      await expectApiStatus(result, 400);
      assertErrorEnvelope(result);
    });

    test('NV-NOT-011 | markAsReadSchema is params.id string.required only', async () => {
      const source = readBackendFile('src/modules/notification/notification.validation.js');
      expect(source).toMatch(/markAsReadSchema/);
      expect(source).toMatch(/id:\s*Joi\.string\(\)\.required\(\)/);
      expect(source).not.toMatch(/ObjectId|hex|pattern/i);
      expect(source).not.toMatch(/body:\s*Joi/);
    });
  });

  // ─── B — GET / mark-all soft validators (absent) ─────────────────────────
  test.describe('Section B — Soft / Absent Validators (GET + mark-all)', () => {
    test('NV-NOT-012 | GET /notifications has no Joi — succeeds', async () => {
      const result = await getNotificationsApi(vendorSession);
      await expectApiStatus(result, 200);
      assertSuccessEnvelope(result);
      expect(Array.isArray(result.body.data) || Array.isArray(result.body)).toBe(true);
    });

    test('NV-NOT-013 | GET ignores unknown query params', async () => {
      const result = await getNotificationsWithQueryApi(
        vendorSession,
        '?page=1&limit=999&filter[$gt]=1&role=ADMIN'
      );
      await expectApiStatus(result, 200);
      assertSuccessEnvelope(result);
    });

    test('NV-NOT-014 | PATCH mark-all with empty body succeeds (no validator)', async () => {
      const result = await patchMarkAllApi(vendorSession, {});
      await expectApiStatus(result, 200);
      assertSuccessEnvelope(result);
      expect(messageOf(result)).toMatch(/all notifications marked as read/i);
    });

    test('NV-NOT-015 | PATCH mark-all with junk body succeeds', async () => {
      const result = await patchMarkAllApi(vendorSession, {
        userId: NONEXISTENT_OBJECT_ID,
        $set: { isRead: false },
        constructor: { prototype: { polluted: true } },
      });
      await expectApiStatus(result, 200);
      assertSuccessEnvelope(result);
    });

    test('NV-NOT-016 | Routes wire validate only on /:id/read', async () => {
      const routes = readBackendFile('src/modules/notification/notification.routes.js');
      expect(routes).toMatch(/validate\(markAsReadSchema\)/);
      expect(routes).toMatch(/router\.get\('\/',\s*protect,\s*controller\.getNotifications\)/);
      expect(routes).toMatch(
        /router\.patch\('\/read-all',\s*protect,\s*controller\.markAllAsRead\)/
      );
    });
  });

  // ─── C — Transport / Content-Type ────────────────────────────────────────
  test.describe('Section C — Transport / Content-Type', () => {
    test('NV-NOT-017 | Invalid JSON on mark-read rejected or error envelope', async () => {
      const result = await patchMarkReadRawFetch(vendorSession, seed.validAnyId, {
        body: '{not-json',
        contentType: 'application/json',
      });
      expect([400, 500]).toContain(result.status);
      if (typeof result.body.success === 'boolean') {
        expect(result.body.success).toBe(false);
      }
    });

    test('NV-NOT-018 | text/plain mark-read still succeeds (params-only; no body Joi)', async () => {
      // Production truth: unlike logistics assign, mark-read does not require body.
      const result = await patchMarkReadRawFetch(vendorSession, seed.validAnyId, {
        body: 'not-parsed-as-json',
        contentType: 'text/plain',
      });
      await expectApiStatus(result, 200);
      assertSuccessEnvelope(result);
    });

    test('NV-NOT-019 | Missing Content-Type with empty body on mark-read succeeds', async () => {
      const result = await patchMarkReadRawFetch(vendorSession, seed.validAnyId, {
        body: '',
      });
      await expectApiStatus(result, 200);
      assertSuccessEnvelope(result);
    });

    test('NV-NOT-020 | Invalid JSON on mark-all rejected or error envelope', async () => {
      const result = await patchMarkAllRawFetch(vendorSession, {
        body: '{broken',
        contentType: 'application/json',
      });
      expect([400, 500]).toContain(result.status);
      if (typeof result.body.success === 'boolean') {
        expect(result.body.success).toBe(false);
      }
    });

    test('NV-NOT-021 | text/plain mark-all succeeds (no body validator)', async () => {
      const result = await patchMarkAllRawFetch(vendorSession, {
        body: 'plain-text-body',
        contentType: 'text/plain',
      });
      await expectApiStatus(result, 200);
      assertSuccessEnvelope(result);
    });

    test('NV-NOT-022 | Oversized JSON body on mark-read — accepted or transport-limited', async () => {
      const huge = { pad: 'x'.repeat(200_000) };
      const result = await patchMarkReadApi(vendorSession, seed.validAnyId, huge);
      // No size validator on notification routes — expect success unless infra rejects.
      expect([200, 413, 400, 500]).toContain(result.status);
      if (result.status === 200) {
        assertSuccessEnvelope(result);
      }
    });
  });

  // ─── D — Sanitization / injection payloads (body ignored) ────────────────
  test.describe('Section D — Payload Sanitization Truth', () => {
    test('NV-NOT-023 | Prototype pollution keys in mark-read body ignored', async () => {
      const result = await patchMarkReadApi(vendorSession, seed.validAnyId, {
        constructor: { prototype: { isAdmin: true } },
        '__proto__': { role: 'SUPER_ADMIN' },
      });
      await expectApiStatus(result, 200);
      assertSuccessEnvelope(result);
    });

    test('NV-NOT-024 | Mongo operator keys in mark-read body ignored', async () => {
      const result = await patchMarkReadApi(vendorSession, seed.validAnyId, {
        $set: { isRead: false },
        $where: '1==1',
      });
      await expectApiStatus(result, 200);
      assertSuccessEnvelope(result);
    });

    test('NV-NOT-025 | XSS string in mark-read body ignored (still 200)', async () => {
      const result = await patchMarkReadApi(vendorSession, seed.validAnyId, {
        message: '<img src=x onerror=alert(1)>',
        title: '<script>alert(1)</script>',
      });
      await expectApiStatus(result, 200);
      assertSuccessEnvelope(result);
    });

    test('NV-NOT-026 | Unicode payload in mark-read body ignored', async () => {
      const result = await patchMarkReadApi(vendorSession, seed.validAnyId, {
        note: 'नमस्ते 通知 🎉',
      });
      await expectApiStatus(result, 200);
      assertSuccessEnvelope(result);
    });

    test('NV-NOT-027 | Array body on mark-read does not crash', async () => {
      const result = await patchMarkReadApi(
        vendorSession,
        seed.validAnyId,
        [{ id: 1 }] as unknown as Record<string, unknown>
      );
      // Axios may send array; Express/Joi allowUnknown — expect 200 or 400 transport.
      expect([200, 400]).toContain(result.status);
    });
  });

  // ─── E — Envelopes & consistency ─────────────────────────────────────────
  test.describe('Section E — Envelope Consistency', () => {
    test('NV-NOT-028 | CastError envelope success=false + message + data null', async () => {
      const result = await patchMarkReadApi(vendorSession, INVALID_OBJECT_ID, {});
      await expectApiStatus(result, 400);
      assertErrorEnvelope(result);
      expect(typeof messageOf(result)).toBe('string');
      expect(result.body.data === null || result.body.data === undefined).toBeTruthy();
    });

    test('NV-NOT-029 | Successful mark-read envelope', async () => {
      const list = unwrapList((await getNotificationsApi(vendorSession)).body);
      const id = list.length ? notificationIdOf(list[0]) : seed.validAnyId;
      const result = await patchMarkReadApi(vendorSession, id, {});
      await expectApiStatus(result, 200);
      assertSuccessEnvelope(result);
      expect(messageOf(result)).toMatch(/notification marked as read/i);
    });

    test('NV-NOT-030 | Successful mark-all envelope returns list data', async () => {
      const result = await patchMarkAllApi(vendorSession, {});
      await expectApiStatus(result, 200);
      assertSuccessEnvelope(result);
      expect(messageOf(result)).toMatch(/all notifications marked as read/i);
      expect(Array.isArray(result.body.data)).toBe(true);
    });

    test('NV-NOT-031 | Successful GET envelope is array data', async () => {
      const result = await getNotificationsApi(vendorSession);
      await expectApiStatus(result, 200);
      assertSuccessEnvelope(result);
      expect(Array.isArray(result.body.data)).toBe(true);
    });

    test('NV-NOT-032 | Unknown id mark-read success envelope with null data', async () => {
      const result = await patchMarkReadApi(vendorSession, NONEXISTENT_OBJECT_ID, {});
      await expectApiStatus(result, 200);
      assertSuccessEnvelope(result);
      expect(result.body.data === null || result.body.data === undefined).toBeTruthy();
    });

    test('NV-NOT-033 | Error responses include string message', async () => {
      const result = await patchMarkReadApi(vendorSession, 'bad-id', {});
      await expectApiStatus(result, 400);
      expect(typeof result.body.message).toBe('string');
      expect(String(result.body.message).length).toBeGreaterThan(0);
    });
  });

  // ─── F — Repository / service validation truth (source) ──────────────────
  test.describe('Section F — Service / Repository Validation Truth', () => {
    test('NV-NOT-034 | Repository markAsRead uses findByIdAndUpdate only', async () => {
      const repo = readBackendFile('src/modules/notification/notification.repository.js');
      expect(repo).toMatch(/findByIdAndUpdate\(id,\s*\{\s*isRead:\s*true/);
      expect(repo).not.toMatch(/findOneAndUpdate\(\s*\{\s*_id:\s*id,\s*userId/);
    });

    test('NV-NOT-035 | Model type enum ORDER|PAYMENT|SYSTEM (producer-side)', async () => {
      const model = readBackendFile('src/modules/notification/notification.model.js');
      expect(model).toMatch(/enum:\s*\[\s*'ORDER',\s*'PAYMENT',\s*'SYSTEM'\s*\]/);
      expect(model).toMatch(/title:[\s\S]*required:\s*true/);
      expect(model).toMatch(/message:[\s\S]*required:\s*true/);
    });

    test('NV-NOT-036 | Controller does not validate existence before markAsRead', async () => {
      const controller = readBackendFile(
        'src/modules/notification/notification.controller.js'
      );
      expect(controller).toMatch(/markAsRead\(req\.params\.id\)/);
      expect(controller).not.toMatch(/if\s*\(\s*!data\s*\)/);
      expect(controller).not.toMatch(/404|not found/i);
    });
  });

  // ─── G — Frontend drawer / badge validation behavior ─────────────────────
  test.describe('Section G — Frontend Client Validation Truth', () => {
    test('NV-NOT-037 | Vendor drawer Mark All is present (UI no-op; no client schema)', async ({
      page,
    }) => {
      await establishSession(page, 'vendor');
      await page.goto('/vendor/dashboard');
      await expect(page.getByLabel('Notifications')).toBeVisible({ timeout: 15000 });
      await page.getByLabel('Notifications').click();
      await expect(page.getByRole('heading', { name: /^notifications$/i })).toBeVisible();
      const markAll = page.getByText(/mark all as read/i);
      await expect(markAll).toBeVisible();
      // Production: button has no onClick — click must not call mark-all API.
      const markAllReq = page
        .waitForRequest(
          (req) =>
            req.method() === 'PATCH' && req.url().includes('/notifications/read-all'),
          { timeout: 1500 }
        )
        .then(() => true)
        .catch(() => false);
      await markAll.evaluate((el) => (el as HTMLElement).click());
      expect(await markAllReq).toBe(false);
    });

    test('NV-NOT-038 | Vendor drawer empty or list state renders without client error UI', async ({
      page,
    }) => {
      await establishSession(page, 'vendor');
      await page.goto('/vendor/dashboard');
      await page.getByLabel('Notifications').click();
      await expect(page.getByRole('heading', { name: /^notifications$/i })).toBeVisible();
      const empty = page.getByRole('paragraph').filter({ hasText: /^no notifications$/i });
      const items = page.locator('.divide-y > div');
      const emptyCount = await empty.count();
      const itemCount = await items.count();
      expect(emptyCount + itemCount).toBeGreaterThan(0);
      await expect(page.getByText(/validation|invalid id|cast error/i)).toHaveCount(0);
    });

    test('NV-NOT-039 | Admin Recent Activities renders without validation error banner', async ({
      page,
    }) => {
      await establishSession(page, 'admin');
      await page.goto('/admin/dashboard');
      await expect(page.getByText(/recent activities/i).first()).toBeVisible({
        timeout: 15000,
      });
      await expect(page.getByText(/failed to load notifications|validation error/i)).toHaveCount(
        0
      );
    });

    test('NV-NOT-040 | Delivery bell opens drawer (always-on badge; no unread gate)', async ({
      page,
    }) => {
      await establishSession(page, 'delivery');
      await page.goto('/delivery/dashboard');
      const bell = page.getByLabel('Notifications');
      await expect(bell).toBeVisible({ timeout: 15000 });
      await expect(bell.locator('span.bg-red-500, span[class*="bg-red"]').first()).toBeVisible();
      await bell.click();
      await expect(page.getByRole('heading', { name: /^notifications$/i })).toBeVisible();
    });

    test('NV-NOT-041 | Close control dismisses vendor drawer (no form validation)', async ({
      page,
    }) => {
      // Production: isOpen=false removes overlay and applies translate-x-full (panel stays mounted).
      await establishSession(page, 'vendor');
      await page.goto('/vendor/dashboard');
      await page.getByLabel('Notifications').click();
      const drawer = page
        .locator('div.fixed.top-0.right-0')
        .filter({ has: page.getByRole('heading', { name: /^notifications$/i }) });
      await expect(drawer).toBeVisible();
      await expect(page.locator('.fixed.inset-0.bg-black')).toBeVisible();
      await drawer.locator('.border-b button').click();
      await expect(page.locator('.fixed.inset-0.bg-black')).toHaveCount(0);
      await expect(drawer).toHaveClass(/translate-x-full/);
    });
  });

  // ─── H — Persistence after validation paths ──────────────────────────────
  test.describe('Section H — Persistence After Valid Operations', () => {
    test('NV-NOT-042 | After mark-all, GET shows all vendor rows read', async () => {
      await patchMarkAllApi(vendorSession, {});
      const result = await getNotificationsApi(vendorSession);
      await expectApiStatus(result, 200);
      const list = unwrapList(result.body);
      expect(list.every((n) => n.isRead === true)).toBe(true);
    });

    test('NV-NOT-043 | Re-mark already-read id remains 200', async () => {
      const list = unwrapList((await getNotificationsApi(vendorSession)).body);
      expect(list.length).toBeGreaterThan(0);
      const id = notificationIdOf(list[0]);
      const first = await patchMarkReadApi(vendorSession, id, {});
      await expectApiStatus(first, 200);
      const second = await patchMarkReadApi(vendorSession, id, {});
      await expectApiStatus(second, 200);
      assertSuccessEnvelope(second);
    });

    test('NV-NOT-044 | GET ordering newest-first after validation traffic', async () => {
      const result = await getNotificationsApi(vendorSession);
      await expectApiStatus(result, 200);
      const list = unwrapList(result.body);
      if (list.length < 2) return;
      const times = list.map((n) => new Date(String(n.createdAt || 0)).getTime());
      for (let i = 1; i < times.length; i++) {
        expect(times[i - 1]).toBeGreaterThanOrEqual(times[i]);
      }
    });
  });
});
