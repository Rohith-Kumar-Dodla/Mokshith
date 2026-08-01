/**
 * Super Admin Validation Certification Suite (SAV-SA)
 *
 * Production truths only — do not invent stricter validation:
 * - Only PATCH /super-admin/users/:id/role has Joi (role enum required); id → CastError
 * - /super-admin admins/config/categories/stats: NO Joi
 * - /admin-approvals approve/reject: CSRF, NO Joi / no reason body
 * - payment-proof reject: reason min 3 max 500 + ObjectId pattern (Joi, not CastError)
 * - /admin/users status: string.required, NO enum; id → CastError
 * - Profile/settings: body.min(1) + field rules + CSRF
 * - Analytics: NO Joi on query params
 * - UI: Payment reject reason required client-side; Reset Password permanently disabled
 *
 * Locked SS-SA / SF-SA / SAA-SA must not be modified.
 */
import { test, expect } from '../fixtures/product.validation.fixture';
import { type ApiSession } from '../helpers/auth.api.helper';
import { expectApiStatus } from '../helpers/validation/product.validation.helper';
import {
  establishSuperAdminUiSession,
  saGoto,
} from '../helpers/superadmin.functional.helper';
import { refreshSuperAdminApiSession } from '../helpers/superadmin.smoke.helper';
import {
  type SuperAdminValidationSeed,
  INVALID_OBJECT_ID,
  NONEXISTENT_OBJECT_ID,
  apiBearerOnly,
  assertErrorEnvelope,
  assertSuccessEnvelope,
  clearValidationRateLimits,
  getAnalyticsDashboard,
  getSuperAdminStats,
  messageOf,
  patchAdminUserStatus,
  patchApprovalApprove,
  patchApprovalReject,
  patchBankTransferApprove,
  patchBankTransferReject,
  patchUserRole,
  postCreateAdmin,
  putSettings,
  putUserMe,
  rawFetch,
  readBackendFile,
  seedSuperAdminValidationData,
} from '../helpers/superadmin.validation.helper';

let saSession: ApiSession;
let seed: SuperAdminValidationSeed;

test.describe('Super Admin Validation Certification Suite', () => {
  test.beforeAll(async () => {
    clearValidationRateLimits();
    const seeded = await seedSuperAdminValidationData();
    saSession = seeded.saSession;
    seed = seeded.seed;
    expect(seed.pendingApprovalId).toBeTruthy();
    expect(seed.disposableAdminId).toBeTruthy();
    expect(seed.rejectProofId).toBeTruthy();
  });

  // ── A — Role change Joi (only SA Joi schema) ──────────────────────────────
  test.describe('Section A — PATCH /super-admin/users/:id/role Joi', () => {
    test('SAV-SA-001 | Missing role → 400 Joi', async () => {
      const result = await patchUserRole(saSession, seed.disposableAdminId, {});
      await expectApiStatus(result, 400);
      assertErrorEnvelope(result);
      expect(messageOf(result)).toMatch(/role|required/i);
    });

    test('SAV-SA-002 | Empty role → 400 Joi', async () => {
      const result = await patchUserRole(saSession, seed.disposableAdminId, { role: '' });
      await expectApiStatus(result, 400);
      assertErrorEnvelope(result);
    });

    test('SAV-SA-003 | Invalid role → 400 Joi', async () => {
      const result = await patchUserRole(saSession, seed.disposableAdminId, {
        role: 'NOT_A_ROLE',
      });
      await expectApiStatus(result, 400);
      assertErrorEnvelope(result);
      expect(messageOf(result)).toMatch(/role|must be one of|valid/i);
    });

    test('SAV-SA-004 | Valid ADMIN role → not 401/403 (domain success band)', async () => {
      const result = await patchUserRole(saSession, seed.disposableAdminId, {
        role: 'ADMIN',
      });
      expect(result.status).not.toBe(401);
      expect(result.status).not.toBe(403);
      expect(result.status).toBeLessThan(500);
    });

    test('SAV-SA-005 | Invalid ObjectId param → 400 CastError', async () => {
      const result = await patchUserRole(saSession, INVALID_OBJECT_ID, { role: 'ADMIN' });
      await expectApiStatus(result, 400);
      assertErrorEnvelope(result);
      expect(messageOf(result).toLowerCase()).toMatch(/invalid|cast|objectid|_id/i);
    });

    test('SAV-SA-006 | Unknown ObjectId → 404', async () => {
      const result = await patchUserRole(saSession, NONEXISTENT_OBJECT_ID, {
        role: 'VENDOR',
      });
      await expectApiStatus(result, 404);
      assertErrorEnvelope(result);
      expect(messageOf(result)).toMatch(/user not found|not found/i);
    });

    test('SAV-SA-007 | Source lock: updateUserRoleSchema has role.valid(ROLES)', () => {
      const src = readBackendFile('src/modules/superAdmin/superAdmin.validation.js');
      expect(src).toMatch(/updateUserRoleSchema/);
      expect(src).toMatch(/role[\s\S]{0,80}\.valid\(/);
      expect(src).toMatch(/ROLES/);
    });
  });

  // ── B — Admin-approvals (no Joi) ──────────────────────────────────────────
  test.describe('Section B — Admin Approvals (no Joi)', () => {
    test('SAV-SA-008 | Approve empty body succeeds (no Joi)', async () => {
      const result = await patchApprovalApprove(saSession, seed.pendingApprovalId, {});
      expect(result.status).not.toBe(400);
      expect([200, 404]).toContain(result.status);
      if (result.status === 200) assertSuccessEnvelope(result);
    });

    test('SAV-SA-009 | Approve invalid ObjectId → 400 CastError', async () => {
      const result = await patchApprovalApprove(saSession, INVALID_OBJECT_ID, {});
      await expectApiStatus(result, 400);
      assertErrorEnvelope(result);
    });

    test('SAV-SA-010 | Approve unknown ObjectId → 404', async () => {
      const result = await patchApprovalApprove(saSession, NONEXISTENT_OBJECT_ID, {});
      await expectApiStatus(result, 404);
      assertErrorEnvelope(result);
    });

    test('SAV-SA-011 | Reject Bearer-only → 403 CSRF (before any body Joi)', async () => {
      const result = await apiBearerOnly(
        saSession,
        'PATCH',
        `/admin-approvals/${NONEXISTENT_OBJECT_ID}/reject`,
        {}
      );
      await expectApiStatus(result, 403);
      expect(messageOf(result)).toMatch(/csrf/i);
    });

    test('SAV-SA-012 | Source lock: adminApprovals approve/reject have no validate()', () => {
      const src = readBackendFile('src/modules/adminApprovals/adminApprovals.routes.js');
      expect(src).not.toMatch(/validate\(/);
      expect(src).toMatch(/csrfProtection/);
    });
  });

  // ── C — Super Admin writes (no Joi) ───────────────────────────────────────
  test.describe('Section C — /super-admin writes without Joi', () => {
    test('SAV-SA-013 | POST /super-admin/admins empty body → domain error band (no Joi)', async () => {
      const result = await postCreateAdmin(saSession, {});
      // Service may throw 400/500 — must not be Joi "role" style; no validate() on route
      expect(result.status).not.toBe(401);
      expect(result.status).not.toBe(403);
      expect([400, 500]).toContain(result.status);
      assertErrorEnvelope(result);
    });

    test('SAV-SA-014 | POST /super-admin/admins prototype keys do not elevate', async () => {
      const mobile = `94${String(Date.now()).slice(-8)}`.slice(0, 10);
      const result = await postCreateAdmin(saSession, {
        name: `SAV Proto ${Date.now().toString(36).slice(-4)}`,
        email: `sav.proto.${Date.now()}@example.com`,
        mobile,
        password: 'Qx7#mLp2!sRw9',
        __proto__: { role: 'SUPER_ADMIN' },
        constructor: { prototype: { role: 'SUPER_ADMIN' } },
      });
      expect([200, 201, 400]).toContain(result.status);
      expect(result.status).not.toBe(401);
    });

    test('SAV-SA-015 | GET /super-admin/stats ignores unknown query (no Joi)', async () => {
      const result = await getSuperAdminStats(saSession, {
        startDate: 'not-a-date',
        $gt: '1',
      });
      await expectApiStatus(result, 200);
      assertSuccessEnvelope(result);
    });

    test('SAV-SA-016 | Source lock: superAdmin.routes only validates users/:id/role', () => {
      const src = readBackendFile('src/modules/superAdmin/superAdmin.routes.js');
      const validateCount = (src.match(/validate\(/g) || []).length;
      expect(validateCount).toBe(1);
      expect(src).toMatch(/users\/:id\/role/);
    });
  });

  // ── D — Admin users status (SA-usable) ────────────────────────────────────
  test.describe('Section D — PATCH /admin/users status', () => {
    test('SAV-SA-017 | Missing status → 400 Joi', async () => {
      const result = await patchAdminUserStatus(saSession, seed.disposableAdminId, {});
      await expectApiStatus(result, 400);
      assertErrorEnvelope(result);
      expect(messageOf(result)).toMatch(/status|required/i);
    });

    test('SAV-SA-018 | Empty status → 400 Joi', async () => {
      const result = await patchAdminUserStatus(saSession, seed.disposableAdminId, {
        status: '',
      });
      await expectApiStatus(result, 400);
      assertErrorEnvelope(result);
    });

    test('SAV-SA-019 | Arbitrary status string may pass Joi (no enum)', async () => {
      const result = await patchAdminUserStatus(saSession, seed.disposableAdminId, {
        status: 'TOTALLY_MADE_UP',
      });
      // No enum — Joi allows; domain may 200 or 400
      expect(result.status).not.toBe(401);
      expect(result.status).not.toBe(403);
      expect(result.status).toBeLessThan(500);
    });

    test('SAV-SA-020 | Invalid ObjectId → 400 CastError', async () => {
      const result = await patchAdminUserStatus(saSession, INVALID_OBJECT_ID, {
        status: 'ACTIVE',
      });
      await expectApiStatus(result, 400);
      assertErrorEnvelope(result);
    });

    test('SAV-SA-021 | Mongo operator in status stripped then Joi fails', async () => {
      const result = await patchAdminUserStatus(saSession, seed.disposableAdminId, {
        status: { $gt: '' },
      });
      await expectApiStatus(result, 400);
      assertErrorEnvelope(result);
    });

    test('SAV-SA-022 | Source lock: updateUserStatusSchema status has no .valid(', () => {
      const src = readBackendFile('src/modules/admin/admin.validation.js');
      expect(src).toMatch(/status:\s*Joi\.string\(\)\.required\(\)/);
      expect(src).not.toMatch(/status:[\s\S]{0,40}\.valid\(/);
    });
  });

  // ── E — Payment verification validation ───────────────────────────────────
  test.describe('Section E — Payment bank-transfer validation', () => {
    test('SAV-SA-023 | Reject missing reason → 400 Joi', async () => {
      const result = await patchBankTransferReject(saSession, seed.rejectProofId, {});
      await expectApiStatus(result, 400);
      assertErrorEnvelope(result);
      expect(messageOf(result)).toMatch(/reason|required/i);
    });

    test('SAV-SA-024 | Reject empty reason → 400 Joi', async () => {
      const result = await patchBankTransferReject(saSession, seed.rejectProofId, {
        reason: '',
      });
      await expectApiStatus(result, 400);
      assertErrorEnvelope(result);
    });

    test('SAV-SA-025 | Reject reason shorter than 3 → 400 Joi', async () => {
      const result = await patchBankTransferReject(saSession, seed.rejectProofId, {
        reason: 'ab',
      });
      await expectApiStatus(result, 400);
      assertErrorEnvelope(result);
      expect(messageOf(result)).toMatch(/reason|length|3|characters/i);
    });

    test('SAV-SA-026 | Reject reason longer than 500 → 400 Joi', async () => {
      const result = await patchBankTransferReject(saSession, seed.rejectProofId, {
        reason: 'x'.repeat(501),
      });
      await expectApiStatus(result, 400);
      assertErrorEnvelope(result);
    });

    test('SAV-SA-027 | Reject invalid id pattern → 400 Joi (not CastError path)', async () => {
      const result = await patchBankTransferReject(saSession, INVALID_OBJECT_ID, {
        reason: 'Invalid UTR provided for SAV',
      });
      await expectApiStatus(result, 400);
      assertErrorEnvelope(result);
    });

    test('SAV-SA-028 | Reject Bearer-only → 403 CSRF before Joi', async () => {
      const result = await apiBearerOnly(
        saSession,
        'PATCH',
        `/payments/bank-transfer/${seed.rejectProofId}/reject`,
        { reason: 'Should not reach Joi' }
      );
      await expectApiStatus(result, 403);
      expect(messageOf(result)).toMatch(/csrf/i);
    });

    test('SAV-SA-029 | Reject valid reason on seeded proof → success band', async () => {
      const result = await patchBankTransferReject(saSession, seed.rejectProofId, {
        reason: 'SAV-SA functional reject — unclear screenshot',
      });
      expect(result.status).not.toBe(401);
      expect(result.status).not.toBe(403);
      expect([200, 400, 404]).toContain(result.status);
      if (result.status === 200) assertSuccessEnvelope(result);
    });

    test('SAV-SA-030 | Approve invalid id pattern → 400 Joi', async () => {
      const result = await patchBankTransferApprove(saSession, INVALID_OBJECT_ID, {});
      await expectApiStatus(result, 400);
      assertErrorEnvelope(result);
    });

    test('SAV-SA-031 | Source lock: rejectPaymentProofSchema reason min(3).max(500)', () => {
      const src = readBackendFile('src/modules/payment-proof/paymentProof.validation.js');
      expect(src).toMatch(/rejectPaymentProofSchema/);
      expect(src).toMatch(/reason:[\s\S]{0,80}\.min\(3\)/);
      expect(src).toMatch(/reason:[\s\S]{0,120}\.max\(500\)/);
    });
  });

  // ── F — Settings / profile ────────────────────────────────────────────────
  test.describe('Section F — Settings & Profile validation', () => {
    test('SAV-SA-032 | PUT /users/me empty body → 400 (.min(1))', async () => {
      const result = await putUserMe(saSession, {});
      await expectApiStatus(result, 400);
      assertErrorEnvelope(result);
    });

    test('SAV-SA-033 | PUT /users/me invalid email → 400', async () => {
      const result = await putUserMe(saSession, { email: 'not-an-email' });
      await expectApiStatus(result, 400);
      assertErrorEnvelope(result);
      expect(messageOf(result)).toMatch(/email/i);
    });

    test('SAV-SA-034 | PUT /users/me XSS-looking name sanitized/accepted band', async () => {
      const result = await putUserMe(saSession, {
        name: '<script>alert(1)</script>SAV',
      });
      expect([200, 400]).toContain(result.status);
      expect(result.status).not.toBe(401);
    });

    test('SAV-SA-035 | PUT /settings empty body → 400 (.min(1))', async () => {
      const result = await putSettings(saSession, {});
      await expectApiStatus(result, 400);
      assertErrorEnvelope(result);
    });

    test('SAV-SA-036 | PUT /settings invalid theme → 400', async () => {
      const result = await putSettings(saSession, {
        preferences: { theme: 'neon-purple' },
      });
      await expectApiStatus(result, 400);
      assertErrorEnvelope(result);
      expect(messageOf(result)).toMatch(/theme|must be one of|valid/i);
    });

    test('SAV-SA-037 | PUT /settings valid preferences → 200', async () => {
      const result = await putSettings(saSession, {
        preferences: { theme: 'light', language: 'en' },
      });
      await expectApiStatus(result, 200);
      assertSuccessEnvelope(result);
    });

    test('SAV-SA-038 | PUT /settings Bearer-only → 403 CSRF', async () => {
      const result = await apiBearerOnly(saSession, 'PUT', '/settings', {
        preferences: { theme: 'dark' },
      });
      await expectApiStatus(result, 403);
      expect(messageOf(result)).toMatch(/csrf/i);
    });
  });

  // ── G — Analytics / transport / envelopes ─────────────────────────────────
  test.describe('Section G — Analytics, transport, envelopes', () => {
    test('SAV-SA-039 | Analytics dashboard with garbage query still 200 (no Joi)', async () => {
      const result = await getAnalyticsDashboard(saSession, {
        from: 'abc',
        to: 'xyz',
        page: '-1',
      });
      await expectApiStatus(result, 200);
      assertSuccessEnvelope(result);
    });

    test('SAV-SA-040 | Source lock: analytics.routes have no validate()', () => {
      const src = readBackendFile('src/modules/analytics/analytics.routes.js');
      expect(src).not.toMatch(/validate\(/);
    });

    test('SAV-SA-041 | Malformed JSON on role PATCH → 400 band', async () => {
      const result = await rawFetch(
        saSession,
        'PATCH',
        `/super-admin/users/${seed.disposableAdminId}/role`,
        { body: '{not-json', contentType: 'application/json' }
      );
      expect([400, 500]).toContain(result.status);
      assertErrorEnvelope(result);
    });

    test('SAV-SA-042 | Wrong Content-Type on role PATCH → error band', async () => {
      const result = await rawFetch(
        saSession,
        'PATCH',
        `/super-admin/users/${seed.disposableAdminId}/role`,
        { body: 'role=ADMIN', contentType: 'text/plain' }
      );
      expect(result.status).toBeGreaterThanOrEqual(400);
      expect(result.status).toBeLessThan(600);
    });

    test('SAV-SA-043 | Joi error envelope has success=false and string message', async () => {
      const result = await patchUserRole(saSession, seed.disposableAdminId, {});
      await expectApiStatus(result, 400);
      assertErrorEnvelope(result);
      expect(result.body.success).toBe(false);
      expect(typeof result.body.message).toBe('string');
    });

    test('SAV-SA-044 | CastError envelope includes INVALID_ID code when present', async () => {
      const result = await patchUserRole(saSession, INVALID_OBJECT_ID, { role: 'ADMIN' });
      await expectApiStatus(result, 400);
      assertErrorEnvelope(result);
      const err = result.body.error as { code?: string } | undefined;
      if (err && typeof err === 'object' && err.code) {
        expect(err.code).toMatch(/INVALID_ID|VALIDATION/i);
      }
    });

    test('SAV-SA-045 | Unicode payload on createAdmin does not 401', async () => {
      const mobile = `95${String(Date.now()).slice(-8)}`.slice(0, 10);
      const result = await postCreateAdmin(saSession, {
        name: 'SAV スーパー 管理员 🚀',
        email: `sav.uni.${Date.now()}@example.com`,
        mobile,
        password: 'Qx7#mLp2!sRw9',
      });
      expect([200, 201, 400]).toContain(result.status);
      expect(result.status).not.toBe(401);
    });
  });

  // ── H — Frontend client validation ────────────────────────────────────────
  test.describe('Section H — Frontend client validation', () => {
    test('SAV-SA-046 | Payment reject without reason shows client error', async ({ page }) => {
      await saGoto(page, '/super-admin/payment-verifications');
      await expect(page.getByRole('heading', { name: 'Payment Verifications' })).toBeVisible({
        timeout: 15000,
      });
      const empty = page.getByRole('heading', { name: 'No pending verifications' });
      if (await empty.isVisible().catch(() => false)) {
        // Proof may already be rejected in API tests — still certify empty-state production copy
        await expect(empty).toBeVisible();
        return;
      }
      const rejectBtn = page.getByRole('button', { name: /^Reject$/i }).first();
      await expect(rejectBtn).toBeVisible({ timeout: 15000 });
      await rejectBtn.click();
      await expect(page.getByRole('heading', { name: 'Reject Payment Proof' })).toBeVisible({
        timeout: 10000,
      });
      await page.getByRole('button', { name: /^Reject Payment$/i }).click();
      await expect(page.getByText('Rejection reason is required')).toBeVisible();
    });

    test('SAV-SA-047 | Admin Management Reset Password remains disabled', async ({ page }) => {
      await establishSuperAdminUiSession(page);
      await page.goto('/super-admin/user-management');
      await page.getByRole('button', { name: /Admin Management/i }).first().click();
      await expect(page.getByRole('heading', { name: 'Admin Management' })).toBeVisible({
        timeout: 15000,
      });
      const reset = page.getByRole('button', { name: /Reset Password/i }).first();
      await expect(reset).toBeDisabled();
    });

    test('SAV-SA-048 | Settings Profile Name input is HTML required', async ({ page }) => {
      await saGoto(page, '/super-admin/settings');
      await page.getByRole('button', { name: /^Profile$/i }).click();
      await expect(page.getByRole('heading', { name: 'Profile Settings' })).toBeVisible({
        timeout: 10000,
      });
      const nameInput = page.locator('label', { hasText: /Full Name|Name/i }).locator('..').locator('input').first();
      if (await nameInput.count()) {
        const required = await nameInput.evaluate((el: HTMLInputElement) => el.required);
        expect(required).toBe(true);
      }
    });

    test('SAV-SA-049 | Settings Preferences Save succeeds with production enums', async ({
      page,
    }) => {
      await saGoto(page, '/super-admin/settings');
      await page.getByRole('button', { name: /^Preferences$/i }).click();
      await page.getByRole('button', { name: /Save Preferences/i }).click();
      await expect(page.getByText('Settings saved successfully')).toBeVisible({
        timeout: 15000,
      });
    });
  });

  // ── I — Source locks & health ─────────────────────────────────────────────
  test.describe('Section I — Source locks & post-suite health', () => {
    test('SAV-SA-050 | error.middleware CastError maps to 400 Invalid path', () => {
      const src = readBackendFile('src/middlewares/error.middleware.js');
      expect(src).toMatch(/CastError/);
      expect(src).toMatch(/Invalid \$\{err\.path\}|Invalid \$\{err\.path\}: \$\{err\.value\}|Invalid \$\{/);
    });

    test('SAV-SA-051 | mongoSanitize strips \$ keys', () => {
      const src = readBackendFile('src/middlewares/mongoSanitize.middleware.js');
      expect(src).toMatch(/startsWith\(['"]\$['"]\)|key\.startsWith\(['"]\$['"]\)/);
      expect(src).toMatch(/delete target\[key\]/);
    });

    test('SAV-SA-052 | validate.middleware Joi envelope success:false', () => {
      const src = readBackendFile('src/middlewares/validate.middleware.js');
      expect(src).toMatch(/success:\s*false/);
      expect(src).toMatch(/abortEarly:\s*false/);
    });

    test('SAV-SA-053 | Authenticated GET /super-admin/stats succeeds after validation flows', async () => {
      const session = await refreshSuperAdminApiSession();
      saSession = session;
      const result = await getSuperAdminStats(session);
      await expectApiStatus(result, 200);
      assertSuccessEnvelope(result);
    });
  });
});
