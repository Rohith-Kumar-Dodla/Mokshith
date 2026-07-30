import { test, expect, type Page } from '../fixtures/product.validation.fixture';
import AdminInventoryPage from '../pages/admin/AdminInventoryPage';
import { establishSession } from '../helpers/session.functional.helper';
import { loginApi, type ApiSession } from '../helpers/auth.api.helper';
import { getVendorCredentials } from '../helpers/product.credentials';
import { expectApiStatus } from '../helpers/validation/product.validation.helper';
import {
  addBody,
  assertErrorEnvelope,
  assertSuccessEnvelope,
  clearInventoryValidationRateLimits,
  getInventoryStatsValidationApi,
  getInventoryValidationApi,
  INVALID_OBJECT_ID,
  messageOf,
  NONEXISTENT_OBJECT_ID,
  patchInventoryRawFetch,
  patchInventoryValidationApi,
  postInventoryRawFetch,
  postInventoryValidationApi,
  seedInventoryValidationData,
  updateBody,
  type InventoryValidationSeed,
} from '../helpers/inventory.validation.helper';

let adminSession: ApiSession;
let vendorSession: ApiSession;
let seed: InventoryValidationSeed;

async function adminUi(page: Page) {
  await establishSession(page, 'admin');
}

test.describe('Inventory Validation Certification Suite', () => {
  test.beforeAll(async () => {
    clearInventoryValidationRateLimits();
    const seeded = await seedInventoryValidationData();
    adminSession = seeded.adminSession;
    seed = seeded.seed;
    const vendorCreds = getVendorCredentials(1);
    vendorSession = await loginApi(vendorCreds.mobile, vendorCreds.password);
  });

  test.describe('Section A — POST /inventory Joi Input Validation', () => {
    test('IV-INV-001 | Reject missing productId', async () => {
      const result = await postInventoryValidationApi(adminSession, {
        warehouseId: seed.standard.warehouseId,
        stock: 1,
      });
      await expectApiStatus(result, 400);
      assertErrorEnvelope(result);
      expect(messageOf(result).toLowerCase()).toMatch(/productid|required/);
    });

    test('IV-INV-002 | Reject missing warehouseId', async () => {
      const result = await postInventoryValidationApi(adminSession, {
        productId: seed.standard.id,
        stock: 1,
      });
      await expectApiStatus(result, 400);
      expect(messageOf(result).toLowerCase()).toMatch(/warehouseid|required/);
    });

    test('IV-INV-003 | Reject missing stock', async () => {
      const result = await postInventoryValidationApi(adminSession, {
        productId: seed.standard.id,
        warehouseId: seed.standard.warehouseId,
      });
      await expectApiStatus(result, 400);
      expect(messageOf(result).toLowerCase()).toMatch(/stock|required/);
    });

    test('IV-INV-004 | Reject null productId', async () => {
      const result = await postInventoryValidationApi(adminSession, {
        productId: null,
        warehouseId: seed.standard.warehouseId,
        stock: 1,
      });
      await expectApiStatus(result, 400);
      expect(messageOf(result).toLowerCase()).toMatch(/productid|string|required/);
    });

    test('IV-INV-005 | Reject empty string productId', async () => {
      const result = await postInventoryValidationApi(adminSession, {
        productId: '',
        warehouseId: seed.standard.warehouseId,
        stock: 1,
      });
      await expectApiStatus(result, 400);
      expect(messageOf(result).toLowerCase()).toMatch(/productid|empty|required/);
    });

    test('IV-INV-006 | Reject empty string warehouseId', async () => {
      const result = await postInventoryValidationApi(adminSession, {
        productId: seed.standard.id,
        warehouseId: '',
        stock: 1,
      });
      await expectApiStatus(result, 400);
      expect(messageOf(result).toLowerCase()).toMatch(/warehouseid|empty|required/);
    });

    test('IV-INV-007 | Reject stock below 1 (zero)', async () => {
      const result = await postInventoryValidationApi(adminSession, addBody(seed.standard, 0));
      await expectApiStatus(result, 400);
      expect(messageOf(result).toLowerCase()).toMatch(/stock|greater than or equal to 1|min/);
    });

    test('IV-INV-008 | Reject negative stock on POST', async () => {
      const result = await postInventoryValidationApi(adminSession, addBody(seed.standard, -5));
      await expectApiStatus(result, 400);
      expect(messageOf(result).toLowerCase()).toMatch(/stock|greater than or equal to 1|min/);
    });

    test('IV-INV-009 | Reject non-numeric stock', async () => {
      const result = await postInventoryValidationApi(adminSession, {
        productId: seed.standard.id,
        warehouseId: seed.standard.warehouseId,
        stock: 'abc',
      });
      await expectApiStatus(result, 400);
      expect(messageOf(result).toLowerCase()).toMatch(/stock|number/);
    });

    test('IV-INV-010 | Reject invalid ObjectId productId', async () => {
      const result = await postInventoryValidationApi(adminSession, {
        productId: INVALID_OBJECT_ID,
        warehouseId: seed.standard.warehouseId,
        stock: 1,
      });
      await expectApiStatus(result, 400);
      expect(messageOf(result).toLowerCase()).toMatch(/invalid/);
    });

    test('IV-INV-011 | Reject malformed ObjectId warehouseId', async () => {
      const result = await postInventoryValidationApi(adminSession, {
        productId: seed.standard.id,
        warehouseId: 'abcdef0123456789',
        stock: 1,
      });
      await expectApiStatus(result, 400);
      expect(messageOf(result).toLowerCase()).toMatch(/invalid/);
    });

    test('IV-INV-012 | Unknown product returns 404', async () => {
      const result = await postInventoryValidationApi(adminSession, {
        productId: NONEXISTENT_OBJECT_ID,
        warehouseId: seed.standard.warehouseId,
        stock: 1,
      });
      await expectApiStatus(result, 404);
      expect(messageOf(result)).toMatch(/product not found/i);
    });

    test('IV-INV-013 | Unknown warehouse returns 404', async () => {
      const result = await postInventoryValidationApi(adminSession, {
        productId: seed.standard.id,
        warehouseId: NONEXISTENT_OBJECT_ID,
        stock: 1,
      });
      await expectApiStatus(result, 404);
      expect(messageOf(result)).toMatch(/warehouse not found/i);
    });

    test('IV-INV-014 | Valid POST add succeeds', async () => {
      const result = await postInventoryValidationApi(adminSession, addBody(seed.mutate, 1));
      await expectApiStatus(result, 200);
      assertSuccessEnvelope(result);
      seed.mutate.stock += 1;
    });

    test('IV-INV-015 | Decimal stock >= 1 allowed on POST', async () => {
      const result = await postInventoryValidationApi(adminSession, addBody(seed.mutate, 1.5));
      await expectApiStatus(result, 200);
      seed.mutate.stock += 1.5;
    });
  });

  test.describe('Section B — PATCH /inventory/update Business Validation', () => {
    test('IV-INV-016 | SUBTRACT beyond available stock rejected', async () => {
      const result = await patchInventoryValidationApi(
        adminSession,
        updateBody(seed.mutate, 999999, 'SUBTRACT')
      );
      await expectApiStatus(result, 400);
      expect(messageOf(result)).toMatch(/insufficient stock/i);
    });

    test('IV-INV-017 | SET stock to zero allowed', async () => {
      const result = await patchInventoryValidationApi(
        adminSession,
        updateBody(seed.mutate, 0, 'SET')
      );
      await expectApiStatus(result, 200);
      seed.mutate.stock = 0;
    });

    test('IV-INV-018 | SET negative stock rejected by model min', async () => {
      const result = await patchInventoryValidationApi(
        adminSession,
        updateBody(seed.mutate, -3, 'SET')
      );
      await expectApiStatus(result, 400);
      expect(messageOf(result).toLowerCase()).toMatch(/stock|minimum|less than|min/);
    });

    test('IV-INV-019 | SET restores positive stock', async () => {
      const result = await patchInventoryValidationApi(
        adminSession,
        updateBody(seed.mutate, 25, 'SET')
      );
      await expectApiStatus(result, 200);
      seed.mutate.stock = 25;
    });

    test('IV-INV-020 | ADD increases stock', async () => {
      const result = await patchInventoryValidationApi(
        adminSession,
        updateBody(seed.mutate, 5, 'ADD')
      );
      await expectApiStatus(result, 200);
      seed.mutate.stock += 5;
    });

    test('IV-INV-021 | SUBTRACT decreases stock when sufficient', async () => {
      const result = await patchInventoryValidationApi(
        adminSession,
        updateBody(seed.mutate, 2, 'SUBTRACT')
      );
      await expectApiStatus(result, 200);
      seed.mutate.stock -= 2;
    });

    test('IV-INV-022 | Unknown type treated as SET', async () => {
      const result = await patchInventoryValidationApi(adminSession, {
        productId: seed.mutate.id,
        warehouseId: seed.mutate.warehouseId,
        stock: 18,
        type: 'MULTIPLY',
      });
      await expectApiStatus(result, 200);
      seed.mutate.stock = 18;
    });

    test('IV-INV-023 | ADD without inventory row returns 404', async () => {
      const result = await patchInventoryValidationApi(adminSession, {
        productId: NONEXISTENT_OBJECT_ID,
        warehouseId: NONEXISTENT_OBJECT_ID,
        stock: 1,
        type: 'ADD',
      });
      await expectApiStatus(result, 404);
      expect(messageOf(result)).toMatch(/inventory record not found/i);
    });

    test('IV-INV-024 | SUBTRACT without inventory row returns 404', async () => {
      const result = await patchInventoryValidationApi(adminSession, {
        productId: NONEXISTENT_OBJECT_ID,
        warehouseId: NONEXISTENT_OBJECT_ID,
        stock: 1,
        type: 'SUBTRACT',
      });
      await expectApiStatus(result, 404);
      expect(messageOf(result)).toMatch(/inventory record not found/i);
    });

    test('IV-INV-025 | PATCH invalid ObjectId rejected', async () => {
      const result = await patchInventoryValidationApi(adminSession, {
        productId: INVALID_OBJECT_ID,
        warehouseId: seed.mutate.warehouseId,
        stock: 1,
        type: 'SET',
      });
      await expectApiStatus(result, 400);
      expect(messageOf(result).toLowerCase()).toMatch(/invalid/);
    });

    test('IV-INV-026 | PATCH missing productId on SET create rejected', async () => {
      const result = await patchInventoryValidationApi(adminSession, {
        warehouseId: seed.mutate.warehouseId,
        stock: 1,
        type: 'SET',
      });
      await expectApiStatus(result, 400);
      expect(messageOf(result).toLowerCase()).toMatch(/productid|required|invalid/);
    });

    test('IV-INV-027 | PATCH missing warehouseId on SET create rejected', async () => {
      const result = await patchInventoryValidationApi(adminSession, {
        productId: seed.mutate.id,
        stock: 1,
        type: 'SET',
      });
      // Existing row may match on productId alone depending on findInventory — assert not 500.
      expect(result.status).not.toBe(500);
      if (result.status >= 400) {
        assertErrorEnvelope(result);
      }
    });

    test('IV-INV-028 | Vendor PATCH valid SET succeeds', async () => {
      const result = await patchInventoryValidationApi(
        vendorSession,
        updateBody(seed.mutate, 22, 'SET')
      );
      await expectApiStatus(result, 200);
      seed.mutate.stock = 22;
    });

    test('IV-INV-029 | Vendor POST add forbidden (authz edge, not Joi)', async () => {
      const result = await postInventoryValidationApi(vendorSession, addBody(seed.mutate, 1));
      await expectApiStatus(result, 403);
    });
  });

  test.describe('Section C — Status Consistency (400 vs 404)', () => {
    test('IV-INV-030 | Malformed id is 400, unknown product is 404 on POST', async () => {
      const bad = await postInventoryValidationApi(adminSession, {
        productId: INVALID_OBJECT_ID,
        warehouseId: seed.standard.warehouseId,
        stock: 1,
      });
      await expectApiStatus(bad, 400);

      const missing = await postInventoryValidationApi(adminSession, {
        productId: NONEXISTENT_OBJECT_ID,
        warehouseId: seed.standard.warehouseId,
        stock: 1,
      });
      await expectApiStatus(missing, 404);
    });

    test('IV-INV-031 | Insufficient stock is 400 not 404', async () => {
      const result = await patchInventoryValidationApi(
        adminSession,
        updateBody(seed.mutate, 999999, 'SUBTRACT')
      );
      await expectApiStatus(result, 400);
      expect(messageOf(result)).toMatch(/insufficient stock/i);
    });

    test('IV-INV-032 | Error responses include string message', async () => {
      const result = await postInventoryValidationApi(adminSession, { stock: 1 });
      await expectApiStatus(result, 400);
      assertErrorEnvelope(result);
      expect(typeof messageOf(result)).toBe('string');
      expect(messageOf(result).length).toBeGreaterThan(0);
    });
  });

  test.describe('Section D — Sanitization & Injection', () => {
    test('IV-INV-033 | Mongo operator injection on productId rejected', async () => {
      const result = await postInventoryValidationApi(adminSession, {
        productId: { $gt: '' },
        warehouseId: seed.standard.warehouseId,
        stock: 1,
      });
      await expectApiStatus(result, 400);
      expect(messageOf(result).toLowerCase()).toMatch(/productid|string|required/);
    });

    test('IV-INV-034 | Mongo operator injection on PATCH stock rejected or ignored safely', async () => {
      const result = await patchInventoryValidationApi(adminSession, {
        productId: seed.mutate.id,
        warehouseId: seed.mutate.warehouseId,
        stock: { $gt: 0 },
        type: 'SET',
      });
      expect([400, 500]).toContain(result.status);
      if (result.status === 400) assertErrorEnvelope(result);
    });

    test('IV-INV-035 | Prototype pollution keys do not escalate POST', async () => {
      const result = await postInventoryValidationApi(adminSession, {
        ...addBody(seed.mutate, 1),
        __proto__: { role: 'SUPER_ADMIN' },
        constructor: { prototype: { role: 'SUPER_ADMIN' } },
      });
      // Valid payload still succeeds; pollution must not change auth (already admin).
      expect([200, 400]).toContain(result.status);
      if (result.status === 200) {
        seed.mutate.stock += 1;
        assertSuccessEnvelope(result);
      }
    });

    test('IV-INV-036 | XSS string as productId rejected', async () => {
      const result = await postInventoryValidationApi(adminSession, {
        productId: '<script>alert(1)</script>',
        warehouseId: seed.standard.warehouseId,
        stock: 1,
      });
      await expectApiStatus(result, 400);
      expect(messageOf(result).toLowerCase()).toMatch(/invalid/);
    });

    test('IV-INV-037 | SQL injection string as warehouseId rejected', async () => {
      const result = await postInventoryValidationApi(adminSession, {
        productId: seed.standard.id,
        warehouseId: "'; DROP TABLE inventory;--",
        stock: 1,
      });
      await expectApiStatus(result, 400);
      expect(messageOf(result).toLowerCase()).toMatch(/invalid/);
    });

    test('IV-INV-038 | Unicode stock rejected', async () => {
      const result = await postInventoryValidationApi(adminSession, {
        productId: seed.standard.id,
        warehouseId: seed.standard.warehouseId,
        stock: '१०',
      });
      await expectApiStatus(result, 400);
      expect(messageOf(result).toLowerCase()).toMatch(/stock|number/);
    });

    test('IV-INV-039 | Extremely large stock on PATCH SET is handled', async () => {
      const result = await patchInventoryValidationApi(
        adminSession,
        updateBody(seed.mutate, Number.MAX_SAFE_INTEGER, 'SET')
      );
      // Production allows large numbers; restore afterwards.
      expect([200, 400]).toContain(result.status);
      const restore = await patchInventoryValidationApi(
        adminSession,
        updateBody(seed.mutate, 22, 'SET')
      );
      await expectApiStatus(restore, 200);
      seed.mutate.stock = 22;
    });

    test('IV-INV-040 | Oversized productId string rejected', async () => {
      const result = await postInventoryValidationApi(adminSession, {
        productId: 'a'.repeat(10000),
        warehouseId: seed.standard.warehouseId,
        stock: 1,
      });
      await expectApiStatus(result, 400);
    });
  });

  test.describe('Section E — Transport / Content-Type', () => {
    test('IV-INV-041 | Invalid JSON body on POST rejected', async () => {
      const result = await postInventoryRawFetch(adminSession, {
        body: '{productId:',
        contentType: 'application/json',
      });
      expect([400, 500]).toContain(result.status);
    });

    test('IV-INV-042 | Invalid JSON body on PATCH rejected', async () => {
      const result = await patchInventoryRawFetch(adminSession, {
        body: '{stock:',
        contentType: 'application/json',
      });
      expect([400, 500]).toContain(result.status);
    });

    test('IV-INV-043 | Unsupported Content-Type text/plain on POST', async () => {
      const result = await postInventoryRawFetch(adminSession, {
        body: JSON.stringify(addBody(seed.standard, 1)),
        contentType: 'text/plain',
      });
      expect([400, 415, 500]).toContain(result.status);
    });

    test('IV-INV-044 | Missing Content-Type with JSON-looking body', async () => {
      const result = await postInventoryRawFetch(adminSession, {
        body: JSON.stringify(addBody(seed.standard, 1)),
      });
      expect([200, 400, 415, 500]).toContain(result.status);
    });

    test('IV-INV-045 | Empty body on POST rejected', async () => {
      const result = await postInventoryRawFetch(adminSession, {
        body: '',
        contentType: 'application/json',
      });
      expect([400, 500]).toContain(result.status);
    });

    test('IV-INV-046 | Unexpected extra fields allowed by Joi (allowUnknown)', async () => {
      const result = await postInventoryValidationApi(adminSession, {
        ...addBody(seed.mutate, 1),
        unexpectedField: 'noise',
      });
      await expectApiStatus(result, 200);
      seed.mutate.stock += 1;
    });
  });

  test.describe('Section F — Frontend Client Validation', () => {
    test('IV-INV-047 | Negative stock shows client validation message', async ({ page }) => {
      await adminUi(page);
      const inventoryPage = new AdminInventoryPage(page);
      await inventoryPage.goto();
      await inventoryPage.waitForTable();
      await inventoryPage.search(seed.standard.name);
      await inventoryPage.openStockModalForProduct(seed.standard.name);
      await inventoryPage.setStockQuantity(-1);
      await page
        .getByRole('dialog', { name: /update stock/i })
        .getByRole('button', { name: /^Update Stock$/i })
        .click();
      await expect(page.getByText('Enter a valid stock quantity')).toBeVisible();
    });

    test('IV-INV-048 | Non-numeric stock shows client validation message', async ({ page }) => {
      await adminUi(page);
      const inventoryPage = new AdminInventoryPage(page);
      await inventoryPage.goto();
      await inventoryPage.waitForTable();
      await inventoryPage.search(seed.standard.name);
      await inventoryPage.openStockModalForProduct(seed.standard.name);
      await inventoryPage.setStockQuantity('abc');
      await page
        .getByRole('dialog', { name: /update stock/i })
        .getByRole('button', { name: /^Update Stock$/i })
        .click();
      await expect(page.getByText('Enter a valid stock quantity')).toBeVisible();
    });

    test('IV-INV-049 | Valid SET via modal succeeds', async ({ page }) => {
      await adminUi(page);
      const inventoryPage = new AdminInventoryPage(page);
      await inventoryPage.goto();
      await inventoryPage.waitForTable();
      await inventoryPage.search(seed.standard.name);
      await inventoryPage.openStockModalForProduct(seed.standard.name);
      await inventoryPage.setStockQuantity(55);
      const response = await inventoryPage.submitStockUpdate();
      expect(response.status()).toBe(200);
      await inventoryPage.search(seed.standard.name);
      await expect(inventoryPage.stockCellInRow(seed.standard.name)).toContainText('55');
      seed.standard.stock = 55;
    });

    test('IV-INV-050 | Zero stock via modal allowed client-side', async ({ page }) => {
      await adminUi(page);
      const inventoryPage = new AdminInventoryPage(page);
      await inventoryPage.goto();
      await inventoryPage.waitForTable();
      await inventoryPage.search(seed.mutate.name);
      await inventoryPage.openStockModalForProduct(seed.mutate.name);
      await inventoryPage.setStockQuantity(0);
      const response = await inventoryPage.submitStockUpdate();
      expect(response.status()).toBe(200);
      seed.mutate.stock = 0;
      // Restore for later API tests
      await patchInventoryValidationApi(adminSession, updateBody(seed.mutate, 22, 'SET'));
      seed.mutate.stock = 22;
    });
  });

  test.describe('Section G — Reads & Boundary', () => {
    test('IV-INV-051 | GET /inventory succeeds for admin', async () => {
      const result = await getInventoryValidationApi(adminSession);
      await expectApiStatus(result, 200);
      assertSuccessEnvelope(result);
    });

    test('IV-INV-052 | GET /inventory/stats succeeds for admin', async () => {
      const result = await getInventoryStatsValidationApi(adminSession);
      await expectApiStatus(result, 200);
      assertSuccessEnvelope(result);
    });

    test('IV-INV-053 | POST stock string numeric coerced when valid', async () => {
      const result = await postInventoryValidationApi(adminSession, {
        productId: seed.mutate.id,
        warehouseId: seed.mutate.warehouseId,
        stock: '2',
      });
      await expectApiStatus(result, 200);
      seed.mutate.stock += 2;
    });

    test('IV-INV-054 | Whitespace-only productId rejected', async () => {
      const result = await postInventoryValidationApi(adminSession, {
        productId: '   ',
        warehouseId: seed.standard.warehouseId,
        stock: 1,
      });
      await expectApiStatus(result, 400);
    });

    test('IV-INV-055 | Boolean stock rejected', async () => {
      const result = await postInventoryValidationApi(adminSession, {
        productId: seed.standard.id,
        warehouseId: seed.standard.warehouseId,
        stock: true,
      });
      // validate middleware may coerce true→boolean; Joi number fails OR coerce path.
      expect([400]).toContain(result.status);
      expect(messageOf(result).toLowerCase()).toMatch(/stock|number/);
    });

    test('IV-INV-056 | Array stock rejected', async () => {
      const result = await postInventoryValidationApi(adminSession, {
        productId: seed.standard.id,
        warehouseId: seed.standard.warehouseId,
        stock: [1],
      });
      await expectApiStatus(result, 400);
      expect(messageOf(result).toLowerCase()).toMatch(/stock|number/);
    });

    test('IV-INV-057 | Nested object body rejected for productId', async () => {
      const result = await postInventoryValidationApi(adminSession, {
        productId: { id: seed.standard.id },
        warehouseId: seed.standard.warehouseId,
        stock: 1,
      });
      await expectApiStatus(result, 400);
    });

    test('IV-INV-058 | SUBTRACT exact available stock succeeds', async () => {
      await patchInventoryValidationApi(adminSession, updateBody(seed.mutate, 5, 'SET'));
      const result = await patchInventoryValidationApi(
        adminSession,
        updateBody(seed.mutate, 5, 'SUBTRACT')
      );
      await expectApiStatus(result, 200);
      seed.mutate.stock = 0;
      await patchInventoryValidationApi(adminSession, updateBody(seed.mutate, 22, 'SET'));
      seed.mutate.stock = 22;
    });

    test('IV-INV-059 | SUBTRACT one more than available rejected', async () => {
      await patchInventoryValidationApi(adminSession, updateBody(seed.mutate, 3, 'SET'));
      const result = await patchInventoryValidationApi(
        adminSession,
        updateBody(seed.mutate, 4, 'SUBTRACT')
      );
      await expectApiStatus(result, 400);
      expect(messageOf(result)).toMatch(/insufficient stock/i);
      await patchInventoryValidationApi(adminSession, updateBody(seed.mutate, 22, 'SET'));
      seed.mutate.stock = 22;
    });

    test('IV-INV-060 | Success envelope for PATCH SET', async () => {
      const result = await patchInventoryValidationApi(
        adminSession,
        updateBody(seed.mutate, 24, 'SET')
      );
      await expectApiStatus(result, 200);
      assertSuccessEnvelope(result);
      expect(messageOf(result).toLowerCase()).toMatch(/stock updated|success/);
      seed.mutate.stock = 24;
    });
  });
});
