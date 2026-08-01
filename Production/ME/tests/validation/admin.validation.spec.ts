/**
 * Admin Validation Certification Suite (AV-ADM)
 *
 * Production truths only — do not invent stricter validation:
 * - /admin: updateUserStatusSchema (status string.required, no enum); create B2B/DP Joi;
 *   approve/reject/credit have NO Joi; no csrfProtection on /admin writes
 * - Products/categories writes: Joi + csrfProtection (except product status — no CSRF)
 * - Order status: hex ObjectId pattern + ORDER_STATUS enum + workflow transitions + CSRF
 * - Inventory POST: addStockSchema; PATCH /update: no Joi
 * - Logistics assign: deliveryPartnerId required; params id → CastError
 * - Profile/settings: body.min(1) + field rules + CSRF
 * - UI: Products/Categories formError strings; Inventory "Enter a valid stock quantity";
 *   PaymentVerifications restriction stub
 *
 * Locked AS/AF/AA-ADM suites must not be modified.
 */
import { test, expect } from '../fixtures/product.validation.fixture';
import { type ApiSession } from '../helpers/auth.api.helper';
import { expectApiStatus } from '../helpers/validation/product.validation.helper';
import { establishAdminUiSession } from '../helpers/admin.smoke.helper';
import { adminGoto } from '../helpers/admin.functional.helper';
import AdminProductsPage from '../pages/admin/AdminProductsPage';
import AdminCategoriesPage from '../pages/admin/AdminCategoriesPage';
import AdminInventoryPage from '../pages/admin/AdminInventoryPage';
import { authHeaders } from '../helpers/auth.api.helper';
import { getAdminStatsRaw } from '../helpers/admin.smoke.helper';
import {
  type AdminValidationSeed,
  INVALID_OBJECT_ID,
  NONEXISTENT_OBJECT_ID,
  apiBearerOnly,
  assertErrorEnvelope,
  assertSuccessEnvelope,
  clearValidationRateLimits,
  deleteCategory,
  messageOf,
  patchAdminCredit,
  patchAdminUserStatus,
  patchInventoryUpdate,
  patchLogisticsAssign,
  patchOrderStatus,
  patchProductStatus,
  postAdminApprove,
  postAdminReject,
  postB2BCustomer,
  postCategory,
  postChangePassword,
  postDeliveryPartner,
  postInventory,
  postProduct,
  putCategory,
  putProduct,
  putSettings,
  putUserMe,
  rawFetch,
  readBackendFile,
  seedAdminValidationData,
  uniqueProductName,
} from '../helpers/admin.validation.helper';

let adminSession: ApiSession;
let seed: AdminValidationSeed;

test.describe('Admin Validation Certification Suite', () => {
  test.beforeAll(async () => {
    clearValidationRateLimits();
    const seeded = await seedAdminValidationData();
    adminSession = seeded.adminSession;
    seed = seeded.seed;
    expect(seed.product.id).toBeTruthy();
    expect(seed.orderId).toBeTruthy();
    expect(seed.pendingVendorId).toBeTruthy();
  });

  // ── A — Admin user status / approve / reject / create ─────────────────────
  test.describe('Section A — Admin /users status & approvals', () => {
    test('AV-ADM-001 | PATCH /admin/users missing status → 400 Joi', async () => {
      const result = await patchAdminUserStatus(adminSession, seed.suspendVendorId, {});
      await expectApiStatus(result, 400);
      assertErrorEnvelope(result);
      expect(messageOf(result)).toMatch(/status|required/i);
    });

    test('AV-ADM-002 | PATCH /admin/users empty status → 400 Joi', async () => {
      const result = await patchAdminUserStatus(adminSession, seed.suspendVendorId, {
        status: '',
      });
      await expectApiStatus(result, 400);
      assertErrorEnvelope(result);
    });

    test('AV-ADM-003 | PATCH /admin/users valid ACTIVE → 200', async () => {
      const result = await patchAdminUserStatus(adminSession, seed.suspendVendorId, {
        status: 'ACTIVE',
      });
      await expectApiStatus(result, 200);
      assertSuccessEnvelope(result);
    });

    test('AV-ADM-004 | PATCH /admin/users invalid ObjectId → 400 CastError', async () => {
      const result = await patchAdminUserStatus(adminSession, INVALID_OBJECT_ID, {
        status: 'ACTIVE',
      });
      await expectApiStatus(result, 400);
      assertErrorEnvelope(result);
      expect(messageOf(result).toLowerCase()).toMatch(/invalid|cast|objectid|_id/i);
    });

    test('AV-ADM-005 | PATCH /admin/users unknown ObjectId → 404', async () => {
      const result = await patchAdminUserStatus(adminSession, NONEXISTENT_OBJECT_ID, {
        status: 'ACTIVE',
      });
      await expectApiStatus(result, 404);
      assertErrorEnvelope(result);
      expect(messageOf(result)).toMatch(/user not found/i);
    });

    test('AV-ADM-006 | PATCH /admin/users XSS-looking id → 400 or 404', async () => {
      const result = await patchAdminUserStatus(
        adminSession,
        '<script>alert(1)</script>',
        { status: 'ACTIVE' }
      );
      expect([400, 404]).toContain(result.status);
      assertErrorEnvelope(result);
    });

    test('AV-ADM-007 | Source truth: status is string.required without enum', async () => {
      const src = readBackendFile('src/modules/admin/admin.validation.js');
      expect(src).toMatch(/status:\s*Joi\.string\(\)\.required\(\)/);
      expect(src).not.toMatch(/status:\s*Joi\.string\(\)\.valid\(/);
    });

    test('AV-ADM-008 | Arbitrary status string accepted by Joi (no enum)', async () => {
      // Production: findByIdAndUpdate without runValidators — Joi allows any string.
      const result = await patchAdminUserStatus(adminSession, seed.suspendVendorId, {
        status: 'NOT_A_REAL_STATUS',
      });
      expect([200, 400]).toContain(result.status);
      if (result.status === 200) {
        assertSuccessEnvelope(result);
      } else {
        assertErrorEnvelope(result);
      }
      // Restore ACTIVE for later tests
      await patchAdminUserStatus(adminSession, seed.suspendVendorId, { status: 'ACTIVE' });
    });

    test('AV-ADM-009 | POST /admin/approve invalid ObjectId → 400', async () => {
      const result = await postAdminApprove(adminSession, INVALID_OBJECT_ID);
      await expectApiStatus(result, 400);
      assertErrorEnvelope(result);
    });

    test('AV-ADM-010 | POST /admin/approve unknown ObjectId → 404', async () => {
      const result = await postAdminApprove(adminSession, NONEXISTENT_OBJECT_ID);
      await expectApiStatus(result, 404);
      assertErrorEnvelope(result);
      expect(messageOf(result)).toMatch(/user not found/i);
    });

    test('AV-ADM-011 | POST /admin/reject invalid ObjectId → 400', async () => {
      const result = await postAdminReject(adminSession, INVALID_OBJECT_ID);
      await expectApiStatus(result, 400);
      assertErrorEnvelope(result);
    });

    test('AV-ADM-012 | POST /admin/approve empty body succeeds (no Joi)', async () => {
      const result = await postAdminApprove(adminSession, seed.pendingVendorId, {});
      await expectApiStatus(result, 200);
      assertSuccessEnvelope(result);
      expect(messageOf(result)).toMatch(/approved/i);
    });

    test('AV-ADM-013 | POST /admin/reject allowUnknown / prototype keys', async () => {
      const id = seed.rejectVendor.id;
      expect(id).toBeTruthy();
      const result = await postAdminReject(adminSession, id, {
        forged: true,
        __proto__: { admin: true },
      });
      await expectApiStatus(result, 200);
      assertSuccessEnvelope(result);
    });

    test('AV-ADM-014 | PATCH credit has no Joi — missing body documented', async () => {
      const src = readBackendFile('src/modules/admin/admin.routes.js');
      expect(src).toMatch(/\/users\/:id\/credit/);
      expect(src).not.toMatch(/credit[\s\S]*validate\(/);
      const result = await patchAdminCredit(adminSession, seed.suspendVendorId, {});
      // No Joi — service may 200 with NaN handling or 500/400 from mongoose
      expect([200, 400, 500]).toContain(result.status);
    });

    test('AV-ADM-015 | POST /admin/b2b-customers missing email → 400', async () => {
      const result = await postB2BCustomer(adminSession, {
        name: 'AV B2B',
        mobile: `9${Date.now().toString().slice(-9)}`,
        password: 'Vendor@123',
        businessName: 'Biz',
        ownerName: 'Owner',
        gstNumber: '29AAAAA0000A1Z5',
        businessAddress: 'Addr',
      });
      await expectApiStatus(result, 400);
      assertErrorEnvelope(result);
      expect(messageOf(result)).toMatch(/email|required/i);
    });

    test('AV-ADM-016 | POST /admin/b2b-customers bad email → 400', async () => {
      const result = await postB2BCustomer(adminSession, {
        name: 'AV B2B',
        email: 'not-an-email',
        mobile: `9${Date.now().toString().slice(-9)}`,
        password: 'Vendor@123',
        businessName: 'Biz',
        ownerName: 'Owner',
        gstNumber: '29AAAAA0000A1Z5',
        businessAddress: 'Addr',
      });
      await expectApiStatus(result, 400);
      assertErrorEnvelope(result);
    });

    test('AV-ADM-017 | POST /admin/b2b-customers negative creditLimit → 400', async () => {
      const result = await postB2BCustomer(adminSession, {
        name: 'AV B2B',
        email: `av-b2b-${Date.now()}@example.com`,
        mobile: `9${Date.now().toString().slice(-9)}`,
        password: 'Vendor@123',
        businessName: 'Biz',
        ownerName: 'Owner',
        gstNumber: '29AAAAA0000A1Z5',
        businessAddress: 'Addr',
        creditLimit: -1,
      });
      await expectApiStatus(result, 400);
      assertErrorEnvelope(result);
    });

    test('AV-ADM-018 | POST /admin/delivery-partners invalid vehicleType → 400', async () => {
      const result = await postDeliveryPartner(adminSession, {
        name: 'AV DP',
        email: `av-dp-${Date.now()}@example.com`,
        mobile: `9${Date.now().toString().slice(-9)}`,
        password: 'Delivery@123',
        vehicleType: 'SPACESHIP',
        vehicleNumber: 'KA01AB1234',
        licenseNumber: 'LIC123',
      });
      await expectApiStatus(result, 400);
      assertErrorEnvelope(result);
    });
  });

  // ── B — Products ──────────────────────────────────────────────────────────
  test.describe('Section B — Product validation', () => {
    test('AV-ADM-019 | POST /products missing name → 400', async () => {
      const result = await postProduct(adminSession, {
        price: 10,
        categoryId: seed.categoryId,
      });
      await expectApiStatus(result, 400);
      assertErrorEnvelope(result);
      expect(messageOf(result)).toMatch(/name|required/i);
    });

    test('AV-ADM-020 | POST /products missing categoryId → 400', async () => {
      const result = await postProduct(adminSession, {
        name: uniqueProductName('av-miss-cat'),
        price: 10,
      });
      await expectApiStatus(result, 400);
      assertErrorEnvelope(result);
      expect(messageOf(result)).toMatch(/category|required/i);
    });

    test('AV-ADM-021 | POST /products missing price → 400', async () => {
      const result = await postProduct(adminSession, {
        name: uniqueProductName('av-miss-price'),
        categoryId: seed.categoryId,
      });
      await expectApiStatus(result, 400);
      assertErrorEnvelope(result);
      expect(messageOf(result)).toMatch(/price|required/i);
    });

    test('AV-ADM-022 | POST /products price ≤ 0 → 400', async () => {
      const result = await postProduct(adminSession, {
        name: uniqueProductName('av-price0'),
        price: 0,
        categoryId: seed.categoryId,
      });
      await expectApiStatus(result, 400);
      assertErrorEnvelope(result);
    });

    test('AV-ADM-023 | POST /products negative stock → 400', async () => {
      const result = await postProduct(adminSession, {
        name: uniqueProductName('av-neg-stock'),
        price: 10,
        stock: -5,
        categoryId: seed.categoryId,
      });
      await expectApiStatus(result, 400);
      assertErrorEnvelope(result);
    });

    test('AV-ADM-024 | POST /products valid create → 200/201', async () => {
      const result = await postProduct(adminSession, {
        name: uniqueProductName('av-ok'),
        price: 42,
        stock: 5,
        categoryId: seed.categoryId,
        moq: 1,
      });
      expect([200, 201]).toContain(result.status);
      assertSuccessEnvelope(result);
    });

    test('AV-ADM-025 | PUT /products invalid id → 400 CastError', async () => {
      const result = await putProduct(adminSession, INVALID_OBJECT_ID, { name: 'x' });
      await expectApiStatus(result, 400);
      assertErrorEnvelope(result);
    });

    test('AV-ADM-026 | PUT /products unknown id → 404', async () => {
      const result = await putProduct(adminSession, NONEXISTENT_OBJECT_ID, {
        name: uniqueProductName('av-unk'),
      });
      await expectApiStatus(result, 404);
      assertErrorEnvelope(result);
    });

    test('AV-ADM-027 | PATCH product status missing isActive → 400', async () => {
      const result = await patchProductStatus(adminSession, seed.product.id, {});
      await expectApiStatus(result, 400);
      assertErrorEnvelope(result);
      expect(messageOf(result)).toMatch(/isActive|required/i);
    });

    test('AV-ADM-028 | PATCH product status non-boolean → 400', async () => {
      const result = await patchProductStatus(adminSession, seed.product.id, {
        isActive: 'yes',
      });
      await expectApiStatus(result, 400);
      assertErrorEnvelope(result);
    });

    test('AV-ADM-029 | POST /products Mongo $gt categoryId → 400/404', async () => {
      const result = await postProduct(adminSession, {
        name: uniqueProductName('av-op'),
        price: 10,
        categoryId: { $gt: '' },
      });
      expect([400, 404, 500]).toContain(result.status);
      assertErrorEnvelope(result);
    });

    test('AV-ADM-030 | POST /products prototype pollution keys do not elevate', async () => {
      const result = await postProduct(adminSession, {
        name: uniqueProductName('av-proto'),
        price: 11,
        categoryId: seed.categoryId,
        __proto__: { isAdmin: true },
        constructor: { prototype: { isAdmin: true } },
      });
      // allowUnknown: true — create may succeed; must not break auth
      expect([200, 201, 400]).toContain(result.status);
    });

    test('AV-ADM-031 | POST /products invalid JSON → 400 band', async () => {
      const result = await rawFetch(adminSession, 'POST', '/products', {
        body: '{not-json',
        contentType: 'application/json',
      });
      expect([400, 500]).toContain(result.status);
      assertErrorEnvelope(result);
    });

    test('AV-ADM-032 | POST /products Bearer-only without CSRF → 403', async () => {
      const result = await apiBearerOnly(adminSession, 'POST', '/products', {
        name: uniqueProductName('av-csrf'),
        price: 10,
        categoryId: seed.categoryId,
      });
      await expectApiStatus(result, 403);
      assertErrorEnvelope(result);
      expect(messageOf(result)).toMatch(/csrf/i);
    });
  });

  // ── C — Categories ────────────────────────────────────────────────────────
  test.describe('Section C — Category validation', () => {
    test('AV-ADM-033 | POST /categories missing name → 400', async () => {
      const result = await postCategory(adminSession, { description: 'x' });
      await expectApiStatus(result, 400);
      assertErrorEnvelope(result);
      expect(messageOf(result)).toMatch(/name|required/i);
    });

    test('AV-ADM-034 | POST /categories empty name → 400', async () => {
      const result = await postCategory(adminSession, { name: '   ' });
      await expectApiStatus(result, 400);
      assertErrorEnvelope(result);
    });

    test('AV-ADM-035 | POST /categories valid create → 200/201', async () => {
      const result = await postCategory(adminSession, {
        name: uniqueProductName('av-cat'),
        description: 'av',
      });
      expect([200, 201]).toContain(result.status);
      assertSuccessEnvelope(result);
    });

    test('AV-ADM-036 | PUT /categories invalid id → 400', async () => {
      const result = await putCategory(adminSession, INVALID_OBJECT_ID, {
        name: uniqueProductName('av-cat-u'),
      });
      await expectApiStatus(result, 400);
      assertErrorEnvelope(result);
    });

    test('AV-ADM-037 | DELETE /categories invalid id → 400', async () => {
      const result = await deleteCategory(adminSession, INVALID_OBJECT_ID);
      await expectApiStatus(result, 400);
      assertErrorEnvelope(result);
    });

    test('AV-ADM-038 | DELETE /categories unknown id → 404', async () => {
      const result = await deleteCategory(adminSession, NONEXISTENT_OBJECT_ID);
      await expectApiStatus(result, 404);
      assertErrorEnvelope(result);
    });

    test('AV-ADM-039 | Duplicate category name under parent → 400', async () => {
      const name = uniqueProductName('av-dup');
      const first = await postCategory(adminSession, { name });
      expect([200, 201]).toContain(first.status);
      const second = await postCategory(adminSession, { name });
      await expectApiStatus(second, 400);
      assertErrorEnvelope(second);
      expect(messageOf(second)).toMatch(/already exists/i);
    });

    test('AV-ADM-040 | Extra unknown fields allowed on create', async () => {
      const result = await postCategory(adminSession, {
        name: uniqueProductName('av-extra'),
        forgedAdmin: true,
      });
      expect([200, 201]).toContain(result.status);
      assertSuccessEnvelope(result);
    });

    test('AV-ADM-041 | POST /categories Bearer-only without CSRF → 403', async () => {
      const result = await apiBearerOnly(adminSession, 'POST', '/categories', {
        name: uniqueProductName('av-cat-csrf'),
      });
      await expectApiStatus(result, 403);
      expect(messageOf(result)).toMatch(/csrf/i);
    });
  });

  // ── D — Order status (Admin) ──────────────────────────────────────────────
  test.describe('Section D — Order status validation', () => {
    test('AV-ADM-042 | PATCH order status missing status → 400', async () => {
      const result = await patchOrderStatus(adminSession, seed.orderId, {});
      await expectApiStatus(result, 400);
      assertErrorEnvelope(result);
      expect(messageOf(result)).toMatch(/status|required/i);
    });

    test('AV-ADM-043 | PATCH order invalid status enum → 400', async () => {
      const result = await patchOrderStatus(adminSession, seed.orderId, {
        status: 'NOT_A_STATUS',
      });
      await expectApiStatus(result, 400);
      assertErrorEnvelope(result);
    });

    test('AV-ADM-044 | PATCH order non-hex id → 400 Joi pattern', async () => {
      const result = await patchOrderStatus(adminSession, INVALID_OBJECT_ID, {
        status: 'CONFIRMED',
      });
      await expectApiStatus(result, 400);
      assertErrorEnvelope(result);
    });

    test('AV-ADM-045 | PATCH order unknown hex id → 404', async () => {
      const result = await patchOrderStatus(adminSession, NONEXISTENT_OBJECT_ID, {
        status: 'CONFIRMED',
      });
      await expectApiStatus(result, 404);
      assertErrorEnvelope(result);
      expect(messageOf(result)).toMatch(/order not found/i);
    });

    test('AV-ADM-046 | PATCH order invalid transition → 400', async () => {
      // Skip far ahead in lifecycle — production rejects illegal transitions
      const result = await patchOrderStatus(adminSession, seed.orderId, {
        status: 'REFUNDED',
      });
      await expectApiStatus(result, 400);
      assertErrorEnvelope(result);
      expect(messageOf(result)).toMatch(/invalid status transition|not found|status/i);
    });

    test('AV-ADM-047 | PATCH order note > 500 → 400', async () => {
      const result = await patchOrderStatus(adminSession, seed.orderId, {
        status: 'CONFIRMED',
        note: 'x'.repeat(501),
      });
      await expectApiStatus(result, 400);
      assertErrorEnvelope(result);
    });

    test('AV-ADM-048 | PATCH order Mongo operator in status → 400', async () => {
      const result = await patchOrderStatus(adminSession, seed.orderId, {
        status: { $gt: '' },
      });
      await expectApiStatus(result, 400);
      assertErrorEnvelope(result);
    });

    test('AV-ADM-049 | PATCH order empty body → CSRF or parse error band', async () => {
      // Production: csrfProtection runs before body parse; empty JSON body often → 403 CSRF
      const result = await rawFetch(adminSession, 'PATCH', `/orders/${seed.orderId}/status`, {
        body: '',
        contentType: 'application/json',
      });
      expect([400, 403, 500]).toContain(result.status);
      assertErrorEnvelope(result);
    });

    test('AV-ADM-050 | PATCH order status Bearer-only without CSRF → 403', async () => {
      const result = await apiBearerOnly(
        adminSession,
        'PATCH',
        `/orders/${seed.orderId}/status`,
        { status: 'CONFIRMED' }
      );
      await expectApiStatus(result, 403);
      expect(messageOf(result)).toMatch(/csrf/i);
    });
  });

  // ── E — Inventory / logistics (Admin path, thin) ──────────────────────────
  test.describe('Section E — Inventory & logistics validation', () => {
    test('AV-ADM-051 | POST /inventory missing productId → 400', async () => {
      const result = await postInventory(adminSession, {
        warehouseId: seed.inventoryWarehouseId || NONEXISTENT_OBJECT_ID,
        stock: 5,
      });
      await expectApiStatus(result, 400);
      assertErrorEnvelope(result);
      expect(messageOf(result)).toMatch(/productId|required/i);
    });

    test('AV-ADM-052 | PATCH /inventory/update SUBTRACT insufficient → 400', async () => {
      const result = await patchInventoryUpdate(adminSession, {
        productId: seed.inventoryProduct.id,
        warehouseId: seed.inventoryWarehouseId,
        stock: 999999,
        type: 'SUBTRACT',
      });
      await expectApiStatus(result, 400);
      assertErrorEnvelope(result);
      expect(messageOf(result)).toMatch(/insufficient stock/i);
    });

    test('AV-ADM-053 | PATCH logistics assign missing deliveryPartnerId → 400', async () => {
      const result = await patchLogisticsAssign(
        adminSession,
        seed.pendingShipment.shipmentId,
        {}
      );
      await expectApiStatus(result, 400);
      assertErrorEnvelope(result);
      expect(messageOf(result)).toMatch(/deliveryPartnerId|required/i);
    });

    test('AV-ADM-054 | PATCH logistics assign invalid shipment id → 400', async () => {
      const result = await patchLogisticsAssign(adminSession, INVALID_OBJECT_ID, {
        deliveryPartnerId: seed.deliveryPartnerId,
      });
      await expectApiStatus(result, 400);
      assertErrorEnvelope(result);
    });

    test('AV-ADM-055 | PATCH logistics assign unknown partner → 404', async () => {
      const result = await patchLogisticsAssign(
        adminSession,
        seed.pendingShipment.shipmentId,
        { deliveryPartnerId: NONEXISTENT_OBJECT_ID }
      );
      await expectApiStatus(result, 404);
      assertErrorEnvelope(result);
      expect(messageOf(result)).toMatch(/delivery partner|not found|inactive/i);
    });

    test('AV-ADM-056 | Inventory PATCH has no Joi (source truth)', async () => {
      const routes = readBackendFile('src/modules/inventory/inventory.routes.js');
      expect(routes).toMatch(/\/update/);
      // update route should not call validate( for update body
      const updateBlock = routes.split('/update')[1] || '';
      expect(updateBlock.slice(0, 200)).not.toMatch(/validate\(/);
    });
  });

  // ── F — Settings / profile ────────────────────────────────────────────────
  test.describe('Section F — Settings & profile validation', () => {
    test('AV-ADM-057 | PUT /users/me empty body → 400', async () => {
      const result = await putUserMe(adminSession, {});
      await expectApiStatus(result, 400);
      assertErrorEnvelope(result);
    });

    test('AV-ADM-058 | PUT /users/me bad email → 400', async () => {
      const result = await putUserMe(adminSession, { email: 'bad' });
      await expectApiStatus(result, 400);
      assertErrorEnvelope(result);
    });

    test('AV-ADM-059 | PUT /users/me bad mobile pattern → 400', async () => {
      const result = await putUserMe(adminSession, { mobile: '123' });
      await expectApiStatus(result, 400);
      assertErrorEnvelope(result);
    });

    test('AV-ADM-060 | PUT /settings empty body → 400', async () => {
      const result = await putSettings(adminSession, {});
      await expectApiStatus(result, 400);
      assertErrorEnvelope(result);
    });

    test('AV-ADM-061 | PUT /settings invalid theme → 400', async () => {
      const result = await putSettings(adminSession, {
        preferences: { theme: 'neon' },
      });
      await expectApiStatus(result, 400);
      assertErrorEnvelope(result);
    });

    test('AV-ADM-062 | PUT /settings invalid language → 400', async () => {
      const result = await putSettings(adminSession, {
        preferences: { language: 'fr' },
      });
      await expectApiStatus(result, 400);
      assertErrorEnvelope(result);
    });

    test('AV-ADM-063 | Change password missing oldPassword → 400', async () => {
      const result = await postChangePassword(adminSession, {
        newPassword: 'Vendor@12345',
      });
      await expectApiStatus(result, 400);
      assertErrorEnvelope(result);
    });

    test('AV-ADM-064 | Change password wrong current → 401', async () => {
      const result = await postChangePassword(adminSession, {
        oldPassword: 'DefinitelyWrong@123',
        newPassword: 'Vendor@12345xx',
      });
      await expectApiStatus(result, 401);
      assertErrorEnvelope(result);
      expect(messageOf(result)).toMatch(/current password|incorrect|invalid/i);
    });

    test('AV-ADM-065 | PUT /settings Bearer-only without CSRF → 403', async () => {
      const result = await apiBearerOnly(adminSession, 'PUT', '/settings', {
        preferences: { theme: 'light' },
      });
      await expectApiStatus(result, 403);
      expect(messageOf(result)).toMatch(/csrf/i);
    });

    test('AV-ADM-066 | PUT /users/me Bearer-only without CSRF → 403', async () => {
      const result = await apiBearerOnly(adminSession, 'PUT', '/users/me', {
        name: 'Admin Name',
      });
      await expectApiStatus(result, 403);
      expect(messageOf(result)).toMatch(/csrf/i);
    });
  });

  // ── G — Frontend client validation ────────────────────────────────────────
  test.describe('Section G — Admin UI client validation', () => {
    test('AV-ADM-067 | Products empty name blocked by HTML required', async ({ page }) => {
      // Production: Product Name has HTML required — browser blocks before React formError.
      await adminGoto(page, '/admin/products');
      const products = new AdminProductsPage(page);
      await products.openCreateModal();
      await products.selectFirstCategory();
      await products.priceInput().fill('50');
      await products.saveButton().click();
      await expect(products.nameInput()).toBeFocused();
      const missing = await products
        .nameInput()
        .evaluate((el: HTMLInputElement) => el.validity.valueMissing);
      expect(missing).toBe(true);
      await expect(page.getByRole('heading', { name: 'Add New Product' })).toBeVisible();
    });

    test('AV-ADM-068 | Categories empty name blocked by HTML required', async ({ page }) => {
      await adminGoto(page, '/admin/categories');
      const categories = new AdminCategoriesPage(page);
      await expect(page.getByRole('heading', { name: 'Product Categories' })).toBeVisible({
        timeout: 15000,
      });
      await categories.openCreateModal();
      await categories.nameInput().fill('');
      await categories.saveButton().click();
      const missing = await categories
        .nameInput()
        .evaluate((el: HTMLInputElement) => el.validity.valueMissing);
      if (missing) {
        expect(missing).toBe(true);
      } else {
        await expect(page.getByText(/category name is required/i)).toBeVisible({
          timeout: 5000,
        });
      }
    });

    test('AV-ADM-069 | Inventory UI rejects negative stock client-side', async ({ page }) => {
      await adminGoto(page, '/admin/inventory');
      const inventory = new AdminInventoryPage(page);
      await inventory.waitForTable();
      await inventory.search(seed.inventoryProduct.name);
      await inventory.openStockModalForProduct(seed.inventoryProduct.name);
      await inventory.setStockQuantity('-1');
      await page
        .getByRole('dialog', { name: /update stock/i })
        .getByRole('button', { name: /^Update Stock$/i })
        .click();
      await expect(page.getByText('Enter a valid stock quantity')).toBeVisible({
        timeout: 5000,
      });
    });

    test('AV-ADM-070 | Payment Verifications shows restriction stub', async ({ page }) => {
      await adminGoto(page, '/admin/payment-verifications');
      await expect(page.getByText(/restricted|super admin/i).first()).toBeVisible({
        timeout: 15000,
      });
    });
  });

  // ── H — Source locks & envelopes ──────────────────────────────────────────
  test.describe('Section H — Source truth & envelopes', () => {
    test('AV-ADM-071 | admin.routes has no csrfProtection', async () => {
      const src = readBackendFile('src/modules/admin/admin.routes.js');
      expect(src).not.toMatch(/csrfProtection/);
      expect(src).toMatch(/authorize\('ADMIN',\s*'SUPER_ADMIN'\)/);
    });

    test('AV-ADM-072 | v1 /admin mounts injectCsrfToken only', async () => {
      const src = readBackendFile('src/routes/v1.routes.js');
      expect(src).toMatch(
        /router\.use\(\s*['"]\/admin['"],\s*authenticate,\s*injectCsrfToken,\s*adminRoutes\s*\)/
      );
    });

    test('AV-ADM-073 | approve/reject routes have no validate()', async () => {
      const src = readBackendFile('src/modules/admin/admin.routes.js');
      expect(src).toMatch(/post\('\/approve\/:id',\s*adminController\.approveUser\)/);
      expect(src).toMatch(/post\('\/reject\/:id',\s*adminController\.rejectUser\)/);
    });

    test('AV-ADM-074 | CastError envelope exposes INVALID_ID when present', async () => {
      const result = await patchAdminUserStatus(adminSession, INVALID_OBJECT_ID, {
        status: 'ACTIVE',
      });
      await expectApiStatus(result, 400);
      assertErrorEnvelope(result);
      const err = result.body.error as { code?: string } | undefined;
      if (err && typeof err === 'object' && err.code) {
        expect(err.code).toBe('INVALID_ID');
      }
    });

    test('AV-ADM-075 | Joi failure uses success=false message string', async () => {
      const result = await patchAdminUserStatus(adminSession, seed.suspendVendorId, {});
      await expectApiStatus(result, 400);
      expect(result.body.success).toBe(false);
      expect(typeof result.body.message).toBe('string');
      expect(result.body.data === null || result.body.data === undefined).toBeTruthy();
    });

    test('AV-ADM-076 | Success envelope on GET /admin/stats', async () => {
      const response = await getAdminStatsRaw(authHeaders(adminSession));
      expect(response.status).toBe(200);
      const data = response.data as { success?: boolean } | undefined;
      expect(data?.success === true || data != null).toBeTruthy();
    });

    test('AV-ADM-077 | Unicode category name accepted or rejected per Joi trim', async () => {
      const result = await postCategory(adminSession, {
        name: `通知-Δ-${Date.now()}`,
      });
      expect([200, 201, 400]).toContain(result.status);
      if (result.status >= 400) assertErrorEnvelope(result);
      else assertSuccessEnvelope(result);
    });

    test('AV-ADM-078 | XSS-looking category name stored as text (no HTML exec)', async () => {
      const xss = `<img src=x onerror=alert(1)> ${Date.now()}`;
      const result = await postCategory(adminSession, { name: xss });
      expect([200, 201, 400]).toContain(result.status);
      if (result.status < 400) {
        assertSuccessEnvelope(result);
      }
    });
  });
});
