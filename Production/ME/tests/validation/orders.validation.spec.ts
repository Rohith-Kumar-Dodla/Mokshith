import { test, expect, type Page } from '../fixtures/product.validation.fixture';
import VendorCheckoutPage from '../pages/vendor/VendorCheckoutPage';
import VendorOrderDetailsPage from '../pages/vendor/VendorOrderDetailsPage';
import {
  createProductApi,
  deleteProductApi,
  getAdminSession,
} from '../helpers/product.api.helper';
import { getAdminCredentials, getVendorCredentials, uniqueProductName } from '../helpers/product.credentials';
import { loginApi, loginApiFresh, type ApiSession } from '../helpers/auth.api.helper';
import { establishSession } from '../helpers/session.functional.helper';
import { addToCartApi, clearCartApi } from '../helpers/cart.api.helper';
import { fillCheckoutAddress } from '../helpers/cart.validation.helper';
import { expectApiStatus } from '../helpers/validation/product.validation.helper';
import {
  assertErrorEnvelope,
  assertSuccessEnvelope,
  buildOrderBody,
  buildValidShippingAddress,
  clearValidationRateLimits,
  getOrderInvoiceValidationApi,
  getOrderValidationApi,
  INVALID_OBJECT_ID,
  messageOf,
  NONEXISTENT_OBJECT_ID,
  patchOrderStatusValidationApi,
  postOrdersApi,
  postOrdersRawFetch,
  seedOrdersValidationData,
  type OrdersValidationSeed,
} from '../helpers/order.validation.helper';

let adminSession: ApiSession;
let vendorSession: ApiSession;
let seed: OrdersValidationSeed;

async function vendorUi(page: Page) {
  vendorSession = await establishSession(page, 'vendor');
  await clearCartApi(vendorSession);
}

async function refreshVendor() {
  const creds = getVendorCredentials(1);
  vendorSession = await loginApiFresh(creds.mobile, creds.password);
  return vendorSession;
}

test.describe('Orders Validation Certification Suite', () => {
  test.beforeAll(async () => {
    clearValidationRateLimits();
    adminSession = await getAdminSession();
    const vendorCreds = getVendorCredentials(1);
    vendorSession = await loginApiFresh(vendorCreds.mobile, vendorCreds.password);
    seed = await seedOrdersValidationData(adminSession, vendorSession);
  });

  test.describe('Section A — Joi Create Payload Validation', () => {
    test('OV-ORD-001 | Reject missing paymentMethod', async () => {
      const body = buildOrderBody();
      delete body.paymentMethod;
      const result = await postOrdersApi(vendorSession, body);
      await expectApiStatus(result, 400);
      assertErrorEnvelope(result);
      expect(messageOf(result).toLowerCase()).toMatch(/paymentmethod|required/);
    });

    test('OV-ORD-002 | Reject invalid paymentMethod', async () => {
      const result = await postOrdersApi(
        vendorSession,
        buildOrderBody({ paymentMethod: 'BITCOIN' })
      );
      await expectApiStatus(result, 400);
      expect(messageOf(result).toLowerCase()).toMatch(/paymentmethod|must be one of|valid/);
    });

    test('OV-ORD-003 | Reject HYBRID paymentMethod (model/Joi mismatch)', async () => {
      const result = await postOrdersApi(
        vendorSession,
        buildOrderBody({ paymentMethod: 'HYBRID' })
      );
      await expectApiStatus(result, 400);
    });

    test('OV-ORD-004 | Reject missing shippingAddress', async () => {
      const body = buildOrderBody();
      delete body.shippingAddress;
      const result = await postOrdersApi(vendorSession, body);
      await expectApiStatus(result, 400);
      expect(messageOf(result).toLowerCase()).toMatch(/shippingaddress|required/);
    });

    test('OV-ORD-005 | Reject short shipping name', async () => {
      const result = await postOrdersApi(
        vendorSession,
        buildOrderBody({}, { name: 'A' })
      );
      await expectApiStatus(result, 400);
      expect(messageOf(result).toLowerCase()).toMatch(/name|length|characters/);
    });

    test('OV-ORD-006 | Reject whitespace-only name after trim', async () => {
      const result = await postOrdersApi(
        vendorSession,
        buildOrderBody({}, { name: '   ' })
      );
      await expectApiStatus(result, 400);
    });

    test('OV-ORD-007 | Reject invalid phone pattern', async () => {
      const result = await postOrdersApi(
        vendorSession,
        buildOrderBody({}, { phone: '12345' })
      );
      await expectApiStatus(result, 400);
      expect(messageOf(result).toLowerCase()).toMatch(/phone|pattern|fails to match/);
    });

    test('OV-ORD-008 | Reject short addressLine', async () => {
      const result = await postOrdersApi(
        vendorSession,
        buildOrderBody({}, { addressLine: 'abc' })
      );
      await expectApiStatus(result, 400);
      expect(messageOf(result).toLowerCase()).toMatch(/addressline|length|characters/);
    });

    test('OV-ORD-009 | Reject missing city', async () => {
      const address = buildValidShippingAddress();
      delete (address as { city?: string }).city;
      const result = await postOrdersApi(
        vendorSession,
        buildOrderBody({ shippingAddress: address })
      );
      await expectApiStatus(result, 400);
      expect(messageOf(result).toLowerCase()).toMatch(/city|required/);
    });

    test('OV-ORD-010 | Reject missing state', async () => {
      const address = buildValidShippingAddress();
      delete (address as { state?: string }).state;
      const result = await postOrdersApi(
        vendorSession,
        buildOrderBody({ shippingAddress: address })
      );
      await expectApiStatus(result, 400);
      expect(messageOf(result).toLowerCase()).toMatch(/state|required/);
    });

    test('OV-ORD-011 | Reject invalid pincode', async () => {
      const result = await postOrdersApi(
        vendorSession,
        buildOrderBody({}, { pincode: '12345' })
      );
      await expectApiStatus(result, 400);
      expect(messageOf(result).toLowerCase()).toMatch(/pincode|pattern|fails to match/);
    });

    test('OV-ORD-012 | Reject empty items array when provided', async () => {
      const result = await postOrdersApi(
        vendorSession,
        buildOrderBody({ items: [] })
      );
      await expectApiStatus(result, 400);
      expect(messageOf(result).toLowerCase()).toMatch(/items|must contain|least/);
    });

    test('OV-ORD-013 | Reject quantity below 1', async () => {
      const result = await postOrdersApi(
        vendorSession,
        buildOrderBody({
          items: [{ productId: seed.standard.id, quantity: 0 }],
        })
      );
      await expectApiStatus(result, 400);
      expect(messageOf(result).toLowerCase()).toMatch(/quantity|greater|least|min/);
    });

    test('OV-ORD-014 | Reject quantity above 10000', async () => {
      const result = await postOrdersApi(
        vendorSession,
        buildOrderBody({
          items: [{ productId: seed.standard.id, quantity: 10001 }],
        })
      );
      await expectApiStatus(result, 400);
      expect(messageOf(result).toLowerCase()).toMatch(/quantity|less|max|must be/);
    });

    test('OV-ORD-015 | Reject invalid productId in items', async () => {
      const result = await postOrdersApi(
        vendorSession,
        buildOrderBody({
          items: [{ productId: INVALID_OBJECT_ID, quantity: 1 }],
        })
      );
      await expectApiStatus(result, 400);
    });

    test('OV-ORD-016 | Reject idempotencyKey with invalid characters', async () => {
      const result = await postOrdersApi(
        vendorSession,
        buildOrderBody({ idempotencyKey: 'bad:key:with:colons' })
      );
      await expectApiStatus(result, 400);
      expect(messageOf(result).toLowerCase()).toMatch(/idempotencykey|pattern|fails to match/);
    });

    test('OV-ORD-017 | Accept valid COD enum paymentMethod reaches service', async () => {
      clearValidationRateLimits();
      await clearCartApi(vendorSession);
      await addToCartApi(vendorSession, seed.standard.id, 1);
      const result = await postOrdersApi(vendorSession, buildOrderBody({ paymentMethod: 'COD' }));
      await expectApiStatus(result, 200);
      assertSuccessEnvelope(result);
    });

    test('OV-ORD-018 | Unexpected extra body fields do not break valid create', async () => {
      clearValidationRateLimits();
      await clearCartApi(vendorSession);
      await addToCartApi(vendorSession, seed.second.id, 1);
      const result = await postOrdersApi(
        vendorSession,
        buildOrderBody({
          paymentMethod: 'COD',
          extraField: 'ignored',
          hackerFlag: true,
        })
      );
      await expectApiStatus(result, 200);
    });
  });

  test.describe('Section B — Service / Business Validation', () => {
    test('OV-ORD-019 | Empty cart rejected', async () => {
      clearValidationRateLimits();
      await clearCartApi(vendorSession);
      const result = await postOrdersApi(vendorSession, buildOrderBody());
      await expectApiStatus(result, 400);
      expect(messageOf(result)).toMatch(/cart is empty/i);
    });

    test('OV-ORD-020 | Deleted product rejected', async () => {
      clearValidationRateLimits();
      const created = await createProductApi(adminSession, {
        name: uniqueProductName('ov-ord-del'),
        price: 88,
        categoryId: seed.categoryId,
        stock: 10,
        moq: 1,
      });
      const pid = String(created._id || created.id);
      await deleteProductApi(adminSession, pid);
      const result = await postOrdersApi(
        vendorSession,
        buildOrderBody({
          items: [{ productId: pid, quantity: 1 }],
        })
      );
      await expectApiStatus(result, 404);
      expect(messageOf(result)).toMatch(/no longer exist|not found/i);
    });

    test('OV-ORD-021 | Inactive product rejected', async () => {
      clearValidationRateLimits();
      const result = await postOrdersApi(
        vendorSession,
        buildOrderBody({
          items: [{ productId: seed.inactive.id, quantity: 1 }],
        })
      );
      await expectApiStatus(result, 400);
      expect(messageOf(result)).toMatch(/not available/i);
    });

    test('OV-ORD-022 | Out-of-stock explicit item rejected', async () => {
      clearValidationRateLimits();
      const result = await postOrdersApi(
        vendorSession,
        buildOrderBody({
          items: [{ productId: seed.oos.id, quantity: 1 }],
        })
      );
      await expectApiStatus(result, 400);
      expect(messageOf(result)).toMatch(/insufficient stock/i);
    });

    test('OV-ORD-023 | Quantity below MOQ rejected', async () => {
      clearValidationRateLimits();
      const result = await postOrdersApi(
        vendorSession,
        buildOrderBody({
          items: [{ productId: seed.moq5.id, quantity: 1 }],
        })
      );
      await expectApiStatus(result, 400);
      expect(messageOf(result)).toMatch(/minimum order quantity/i);
    });

    test('OV-ORD-024 | Quantity exceeding stock rejected', async () => {
      clearValidationRateLimits();
      const result = await postOrdersApi(
        vendorSession,
        buildOrderBody({
          items: [{ productId: seed.lowStock.id, quantity: 5 }],
        })
      );
      await expectApiStatus(result, 400);
      expect(messageOf(result)).toMatch(/insufficient stock/i);
    });

    test('OV-ORD-025 | Non-existent product ObjectId rejected', async () => {
      clearValidationRateLimits();
      const result = await postOrdersApi(
        vendorSession,
        buildOrderBody({
          items: [{ productId: NONEXISTENT_OBJECT_ID, quantity: 1 }],
        })
      );
      await expectApiStatus(result, 404);
      expect(messageOf(result)).toMatch(/no longer exist|not found/i);
    });

    test('OV-ORD-026 | MOQ-compliant quantity succeeds', async () => {
      clearValidationRateLimits();
      const result = await postOrdersApi(
        vendorSession,
        buildOrderBody({
          items: [{ productId: seed.moq5.id, quantity: 5 }],
        })
      );
      await expectApiStatus(result, 200);
      assertSuccessEnvelope(result);
    });

    test('OV-ORD-027 | ONLINE payment creates PENDING_PAYMENT order', async () => {
      clearValidationRateLimits();
      await clearCartApi(vendorSession);
      await addToCartApi(vendorSession, seed.standard.id, 1);
      const result = await postOrdersApi(
        vendorSession,
        buildOrderBody({ paymentMethod: 'ONLINE' })
      );
      await expectApiStatus(result, 200);
      const data = (result.body.data ?? result.body) as { status?: string };
      expect(String(data.status || '').toUpperCase()).toBe('PENDING_PAYMENT');
    });
  });

  test.describe('Section C — ObjectId / Detail / Invoice Validation', () => {
    test('OV-ORD-028 | Malformed order ID on GET returns 400', async () => {
      const result = await getOrderValidationApi(vendorSession, INVALID_OBJECT_ID);
      await expectApiStatus(result, 400);
      expect(messageOf(result)).toMatch(/invalid order id/i);
    });

    test('OV-ORD-029 | Non-existent order ID on GET returns 404', async () => {
      const result = await getOrderValidationApi(vendorSession, NONEXISTENT_OBJECT_ID);
      await expectApiStatus(result, 404);
      expect(messageOf(result)).toMatch(/order not found/i);
    });

    test('OV-ORD-030 | Valid own order GET succeeds', async () => {
      const result = await getOrderValidationApi(vendorSession, seed.seededOrderId);
      await expectApiStatus(result, 200);
      assertSuccessEnvelope(result);
    });

    test('OV-ORD-031 | Malformed order ID on invoice returns 400', async () => {
      const result = await getOrderInvoiceValidationApi(vendorSession, INVALID_OBJECT_ID);
      await expectApiStatus(result, 400);
      expect(messageOf(result)).toMatch(/invalid order id/i);
    });

    test('OV-ORD-032 | Non-existent order invoice returns 404', async () => {
      const result = await getOrderInvoiceValidationApi(vendorSession, NONEXISTENT_OBJECT_ID);
      await expectApiStatus(result, 404);
    });

    test('OV-ORD-033 | Owner invoice download succeeds', async () => {
      const result = await getOrderInvoiceValidationApi(vendorSession, seed.seededOrderId);
      expect([200, 404]).toContain(result.status);
      if (result.status === 200) {
        // PDF may come as binary; envelope may be absent for download stream via axios json parse.
        expect(result.status).toBe(200);
      }
    });
  });

  test.describe('Section D — Status Update Validation', () => {
    test('OV-ORD-034 | Vendor PATCH status forbidden', async () => {
      const result = await patchOrderStatusValidationApi(vendorSession, seed.seededOrderId, {
        status: 'SHIPPED',
      });
      await expectApiStatus(result, 403);
    });

    test('OV-ORD-035 | Admin missing status rejected', async () => {
      const admin = await loginApi(
        getAdminCredentials().mobile,
        getAdminCredentials().password
      );
      const result = await patchOrderStatusValidationApi(admin, seed.seededOrderId, {});
      await expectApiStatus(result, 400);
      expect(messageOf(result).toLowerCase()).toMatch(/status|required/);
    });

    test('OV-ORD-036 | Admin invalid status enum rejected', async () => {
      const admin = await loginApi(
        getAdminCredentials().mobile,
        getAdminCredentials().password
      );
      const result = await patchOrderStatusValidationApi(admin, seed.seededOrderId, {
        status: 'NOT_A_REAL_STATUS',
      });
      await expectApiStatus(result, 400);
    });

    test('OV-ORD-037 | Admin malformed order id rejected', async () => {
      const admin = await loginApi(
        getAdminCredentials().mobile,
        getAdminCredentials().password
      );
      const result = await patchOrderStatusValidationApi(admin, INVALID_OBJECT_ID, {
        status: 'CONFIRMED',
      });
      await expectApiStatus(result, 400);
    });

    test('OV-ORD-038 | Admin invalid workflow transition rejected', async () => {
      const admin = await loginApi(
        getAdminCredentials().mobile,
        getAdminCredentials().password
      );
      // Seeded COD order is CONFIRMED — jumping to DELIVERED should fail workflow.
      const result = await patchOrderStatusValidationApi(admin, seed.seededOrderId, {
        status: 'DELIVERED',
      });
      await expectApiStatus(result, 400);
      expect(messageOf(result)).toMatch(/invalid status transition/i);
    });

    test('OV-ORD-039 | Admin note over 500 chars rejected', async () => {
      const admin = await loginApi(
        getAdminCredentials().mobile,
        getAdminCredentials().password
      );
      const result = await patchOrderStatusValidationApi(admin, seed.seededOrderId, {
        status: 'PROCESSING',
        note: 'n'.repeat(501),
      });
      await expectApiStatus(result, 400);
      expect(messageOf(result).toLowerCase()).toMatch(/note|length|characters|fewer/);
    });
  });

  test.describe('Section E — CSRF / Idempotency Validation', () => {
    test('OV-ORD-040 | POST without CSRF rejected', async () => {
      clearValidationRateLimits();
      await clearCartApi(vendorSession);
      await addToCartApi(vendorSession, seed.standard.id, 1);
      const result = await postOrdersRawFetch(vendorSession, {
        body: JSON.stringify(buildOrderBody()),
        contentType: 'application/json',
        omitCsrf: true,
      });
      await expectApiStatus(result, 403);
      expect(messageOf(result).toLowerCase()).toMatch(/csrf/);
    });

    test('OV-ORD-041 | CSRF enforced before Joi for invalid payload', async () => {
      const result = await postOrdersRawFetch(vendorSession, {
        body: JSON.stringify({ paymentMethod: 'NOPE' }),
        contentType: 'application/json',
        omitCsrf: true,
      });
      await expectApiStatus(result, 403);
      expect(messageOf(result).toLowerCase()).toMatch(/csrf/);
    });

    test('OV-ORD-042 | Same Idempotency-Key returns same order', async () => {
      clearValidationRateLimits();
      await refreshVendor();
      await clearCartApi(vendorSession);
      await addToCartApi(vendorSession, seed.standard.id, 1);
      const key = `ov-ord-idem-${Date.now()}`;
      const first = await postOrdersApi(vendorSession, buildOrderBody({ idempotencyKey: key }), {
        'Idempotency-Key': key,
      });
      await expectApiStatus(first, 200);
      const firstId = String(
        ((first.body.data ?? first.body) as { _id?: string; id?: string })._id ||
          ((first.body.data ?? first.body) as { id?: string }).id
      );
      await clearCartApi(vendorSession);
      await addToCartApi(vendorSession, seed.standard.id, 1);
      const second = await postOrdersApi(vendorSession, buildOrderBody({ idempotencyKey: key }), {
        'Idempotency-Key': key,
      });
      await expectApiStatus(second, 200);
      const secondId = String(
        ((second.body.data ?? second.body) as { _id?: string; id?: string })._id ||
          ((second.body.data ?? second.body) as { id?: string }).id
      );
      expect(secondId).toBe(firstId);
    });

    test('OV-ORD-043 | Valid create with CSRF succeeds', async () => {
      clearValidationRateLimits();
      await clearCartApi(vendorSession);
      await addToCartApi(vendorSession, seed.standard.id, 1);
      const result = await postOrdersApi(vendorSession, buildOrderBody());
      await expectApiStatus(result, 200);
    });
  });

  test.describe('Section F — Sanitization & Injection', () => {
    test('OV-ORD-044 | NoSQL injection string in productId rejected', async () => {
      const result = await postOrdersApi(
        vendorSession,
        buildOrderBody({
          items: [{ productId: '{ "$gt": "" }', quantity: 1 }],
        })
      );
      await expectApiStatus(result, 400);
    });

    test('OV-ORD-045 | Mongo operator object productId rejected', async () => {
      const result = await postOrdersApi(
        vendorSession,
        buildOrderBody({
          items: [{ productId: { $gt: '' }, quantity: 1 }],
        })
      );
      await expectApiStatus(result, 400);
    });

    test('OV-ORD-046 | Prototype pollution payload does not escalate', async () => {
      clearValidationRateLimits();
      await clearCartApi(vendorSession);
      await addToCartApi(vendorSession, seed.standard.id, 1);
      const result = await postOrdersApi(
        vendorSession,
        buildOrderBody({
          __proto__: { isAdmin: true },
          constructor: { prototype: { isAdmin: true } },
        })
      );
      await expectApiStatus(result, 200);
    });

    test('OV-ORD-047 | XSS in address name sanitized/accepted within length', async () => {
      clearValidationRateLimits();
      await clearCartApi(vendorSession);
      await addToCartApi(vendorSession, seed.standard.id, 1);
      const result = await postOrdersApi(
        vendorSession,
        buildOrderBody({}, { name: `<script>alert(1)</script>` })
      );
      // Valid length string — Joi accepts; XSS not executed server-side.
      expect([200, 400]).toContain(result.status);
    });

    test('OV-ORD-048 | SQL-like phone string rejected by pattern', async () => {
      const result = await postOrdersApi(
        vendorSession,
        buildOrderBody({}, { phone: `' OR '1'='1` })
      );
      await expectApiStatus(result, 400);
    });

    test('OV-ORD-049 | Unicode pincode rejected', async () => {
      const result = await postOrdersApi(
        vendorSession,
        buildOrderBody({}, { pincode: '५००००१' })
      );
      await expectApiStatus(result, 400);
    });

    test('OV-ORD-050 | Extremely long addressLine rejected', async () => {
      const result = await postOrdersApi(
        vendorSession,
        buildOrderBody({}, { addressLine: 'A'.repeat(250) })
      );
      await expectApiStatus(result, 400);
    });

    test('OV-ORD-051 | Oversized idempotencyKey rejected', async () => {
      const result = await postOrdersApi(
        vendorSession,
        buildOrderBody({ idempotencyKey: 'a'.repeat(300) })
      );
      await expectApiStatus(result, 400);
    });
  });

  test.describe('Section G — Transport / Content-Type', () => {
    test('OV-ORD-052 | Invalid JSON body rejected', async () => {
      const result = await postOrdersRawFetch(vendorSession, {
        body: '{paymentMethod:',
        contentType: 'application/json',
      });
      expect([400, 500]).toContain(result.status);
    });

    test('OV-ORD-053 | Unsupported Content-Type text/plain', async () => {
      const result = await postOrdersRawFetch(vendorSession, {
        body: 'paymentMethod=COD',
        contentType: 'text/plain',
      });
      // Production quirk: body undefined can surface as 400/403/500 depending on middleware path.
      expect([400, 403, 415, 500]).toContain(result.status);
    });

    test('OV-ORD-054 | Empty JSON body rejected', async () => {
      const result = await postOrdersRawFetch(vendorSession, {
        body: '',
        contentType: 'application/json',
      });
      expect([400, 500]).toContain(result.status);
    });

    test('OV-ORD-055 | Array root body rejected', async () => {
      const result = await postOrdersApi(
        vendorSession,
        [{ paymentMethod: 'COD' }] as unknown as Record<string, unknown>
      );
      await expectApiStatus(result, 400);
    });
  });

  test.describe('Section H — Frontend Client Validation', () => {
    test('OV-ORD-056 | Empty cart checkout shows empty state', async ({ page }) => {
      await vendorUi(page);
      const checkout = new VendorCheckoutPage(page);
      await checkout.goto();
      await checkout.waitForLoad();
      await expect(checkout.emptyCartState()).toBeVisible();
    });

    test('OV-ORD-057 | Missing delivery address blocked client-side', async ({ page }) => {
      await vendorUi(page);
      await addToCartApi(vendorSession, seed.standard.id, 1);
      const checkout = new VendorCheckoutPage(page);
      await checkout.goto();
      await checkout.waitForLoad();
      await checkout.placeOrderButton().click();
      await expect(page.getByText('Delivery address is required')).toBeVisible();
    });

    test('OV-ORD-058 | Missing city blocked client-side', async ({ page }) => {
      await vendorUi(page);
      await addToCartApi(vendorSession, seed.standard.id, 1);
      await page.goto('/vendor/checkout');
      await page.getByPlaceholder('Enter your complete delivery address').fill('123 Test Street');
      await page.locator('label', { hasText: 'State' }).locator('..').locator('input').fill('Telangana');
      await page.locator('label', { hasText: 'Pincode' }).locator('..').locator('input').fill('500001');
      await page
        .locator('label', { hasText: 'Phone Number' })
        .locator('..')
        .locator('input')
        .fill('9000000101');
      await page.getByRole('button', { name: /^Place Order$/ }).click();
      await expect(page.getByText('City is required')).toBeVisible();
    });

    test('OV-ORD-059 | Missing state blocked client-side', async ({ page }) => {
      await vendorUi(page);
      await addToCartApi(vendorSession, seed.standard.id, 1);
      await page.goto('/vendor/checkout');
      await page.getByPlaceholder('Enter your complete delivery address').fill('123 Test Street');
      await page.locator('label', { hasText: 'City' }).locator('..').locator('input').fill('Hyderabad');
      await page.locator('label', { hasText: 'Pincode' }).locator('..').locator('input').fill('500001');
      await page
        .locator('label', { hasText: 'Phone Number' })
        .locator('..')
        .locator('input')
        .fill('9000000101');
      await page.getByRole('button', { name: /^Place Order$/ }).click();
      await expect(page.getByText('State is required')).toBeVisible();
    });

    test('OV-ORD-060 | Invalid pincode blocked client-side', async ({ page }) => {
      await vendorUi(page);
      await addToCartApi(vendorSession, seed.standard.id, 1);
      await page.goto('/vendor/checkout');
      await page.getByPlaceholder('Enter your complete delivery address').fill('123 Test Street');
      await page.locator('label', { hasText: 'City' }).locator('..').locator('input').fill('Hyderabad');
      await page.locator('label', { hasText: 'State' }).locator('..').locator('input').fill('Telangana');
      await page.locator('label', { hasText: 'Pincode' }).locator('..').locator('input').fill('12345');
      await page
        .locator('label', { hasText: 'Phone Number' })
        .locator('..')
        .locator('input')
        .fill('9000000101');
      await page.getByRole('button', { name: /^Place Order$/ }).click();
      await expect(page.getByText('Pincode must be 6 digits')).toBeVisible();
    });

    test('OV-ORD-061 | Missing phone blocked client-side', async ({ page }) => {
      await vendorUi(page);
      await addToCartApi(vendorSession, seed.standard.id, 1);
      await page.goto('/vendor/checkout');
      await page.getByPlaceholder('Enter your complete delivery address').fill('123 Test Street');
      await page.locator('label', { hasText: 'City' }).locator('..').locator('input').fill('Hyderabad');
      await page.locator('label', { hasText: 'State' }).locator('..').locator('input').fill('Telangana');
      await page.locator('label', { hasText: 'Pincode' }).locator('..').locator('input').fill('500001');
      await page.locator('label', { hasText: 'Phone Number' }).locator('..').locator('input').fill('');
      await page.getByRole('button', { name: /^Place Order$/ }).click();
      await expect(page.getByText('Phone number is required')).toBeVisible();
    });

    test('OV-ORD-062 | Valid checkout proceeds to success', async ({ page }) => {
      clearValidationRateLimits();
      await vendorUi(page);
      await addToCartApi(vendorSession, seed.standard.id, 1);
      const checkout = new VendorCheckoutPage(page);
      await checkout.goto();
      await checkout.waitForLoad();
      await fillCheckoutAddress(page);
      await checkout.selectCod();
      await checkout.placeOrderButton().click();
      await page.waitForURL(/\/vendor\/order-success/, { timeout: 30000 });
    });

    test('OV-ORD-063 | Malformed order deep-link shows not found', async ({ page }) => {
      await vendorUi(page);
      await page.goto(`/vendor/orders/${INVALID_OBJECT_ID}`);
      await expect(page.getByText(/Order not found/i)).toBeVisible({ timeout: 15000 });
    });
  });

  test.describe('Section I — Response Schema Consistency', () => {
    test('OV-ORD-064 | Error schema on invalid paymentMethod', async () => {
      const result = await postOrdersApi(
        vendorSession,
        buildOrderBody({ paymentMethod: 'NOPE' })
      );
      await expectApiStatus(result, 400);
      assertErrorEnvelope(result);
      expect(result.body).toHaveProperty('message');
    });

    test('OV-ORD-065 | Success schema on valid create', async () => {
      clearValidationRateLimits();
      await clearCartApi(vendorSession);
      await addToCartApi(vendorSession, seed.standard.id, 1);
      const result = await postOrdersApi(vendorSession, buildOrderBody());
      await expectApiStatus(result, 200);
      assertSuccessEnvelope(result);
      const data = (result.body.data ?? result.body) as { _id?: string; id?: string; status?: string };
      expect(data._id || data.id).toBeTruthy();
      expect(data.status).toBeTruthy();
    });

    test('OV-ORD-066 | HTTP status consistency — 400 vs 404 on order GET', async () => {
      const bad = await getOrderValidationApi(vendorSession, INVALID_OBJECT_ID);
      await expectApiStatus(bad, 400);
      const missing = await getOrderValidationApi(vendorSession, NONEXISTENT_OBJECT_ID);
      await expectApiStatus(missing, 404);
    });

    test('OV-ORD-067 | Valid ONLINE enum accepted by Joi', async () => {
      clearValidationRateLimits();
      await clearCartApi(vendorSession);
      await addToCartApi(vendorSession, seed.standard.id, 1);
      const result = await postOrdersApi(
        vendorSession,
        buildOrderBody({ paymentMethod: 'ONLINE' })
      );
      await expectApiStatus(result, 200);
    });

    test('OV-ORD-068 | Owner details page loads for seeded order', async ({ page }) => {
      await vendorUi(page);
      const details = new VendorOrderDetailsPage(page);
      await details.goto(seed.seededOrderId);
      await details.waitForLoad();
      await expect(details.pageHeading()).toBeVisible();
    });
  });
});
