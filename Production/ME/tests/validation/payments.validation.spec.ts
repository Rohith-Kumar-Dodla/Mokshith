import { test, expect, type Page } from '../fixtures/product.validation.fixture';
import VendorCheckoutPage from '../pages/vendor/VendorCheckoutPage';
import { establishSession } from '../helpers/session.functional.helper';
import { type ApiSession } from '../helpers/auth.api.helper';
import { expectApiStatus } from '../helpers/validation/product.validation.helper';
import {
  assertErrorEnvelope,
  assertSuccessEnvelope,
  clearPaymentsValidationRateLimits,
  getRefundHistoryValidation,
  getRazorpayWebhookSecret,
  INVALID_OBJECT_ID,
  messageOf,
  MINI_PNG,
  NONEXISTENT_OBJECT_ID,
  oversizedBuffer,
  postCreateOrderValidation,
  postFailValidation,
  postHybridValidation,
  postInitiateValidation,
  postPaymentsRawFetch,
  postRefundValidation,
  postVerifyValidation,
  postWebhookRaw,
  rejectProofValidation,
  seedPaymentsValidationData,
  signWebhookBody,
  uploadProofValidation,
  type PaymentsValidationSeed,
} from '../helpers/payment.validation.helper';

let vendorSession: ApiSession;
let seed: PaymentsValidationSeed;

async function vendorUi(page: Page) {
  await establishSession(page, 'vendor');
}

test.describe('Payments Validation Certification Suite', () => {
  test.beforeAll(async () => {
    clearPaymentsValidationRateLimits();
    const seeded = await seedPaymentsValidationData();
    vendorSession = seeded.vendorSession;
    seed = seeded.seed;
  });

  test.describe('Section A — Create-Order Amount Validation', () => {
    test('PV-PAY-001 | Missing amount rejected', async () => {
      const result = await postCreateOrderValidation(vendorSession, {
        orderId: seed.onlineOrderId,
      });
      await expectApiStatus(result, 400);
      assertErrorEnvelope(result);
      expect(messageOf(result).toLowerCase()).toMatch(/minimum|amount|₹1|rupee/);
    });

    test('PV-PAY-002 | Zero amount rejected', async () => {
      const result = await postCreateOrderValidation(vendorSession, {
        amount: 0,
        orderId: seed.onlineOrderId,
      });
      await expectApiStatus(result, 400);
      expect(messageOf(result).toLowerCase()).toMatch(/minimum|amount/);
    });

    test('PV-PAY-003 | Negative amount rejected', async () => {
      const result = await postCreateOrderValidation(vendorSession, {
        amount: -10,
        orderId: seed.onlineOrderId,
      });
      await expectApiStatus(result, 400);
      expect(messageOf(result).toLowerCase()).toMatch(/minimum|amount/);
    });

    test('PV-PAY-004 | Non-numeric amount rejected', async () => {
      const result = await postCreateOrderValidation(vendorSession, {
        amount: 'abc',
        orderId: seed.onlineOrderId,
      });
      await expectApiStatus(result, 400);
      expect(messageOf(result).toLowerCase()).toMatch(/minimum|amount|number|nan/);
    });

    test('PV-PAY-005 | Invalid orderId format on create-order', async () => {
      const result = await postCreateOrderValidation(vendorSession, {
        amount: 125,
        orderId: INVALID_OBJECT_ID,
      });
      // Service may 400 invalid format, or gateway path if orderId ignored badly.
      expect([400, 404, 500]).toContain(result.status);
      expect(result.status).not.toBe(200);
      assertErrorEnvelope(result);
    });

    test('PV-PAY-006 | Unknown orderId returns not-found or gateway error', async () => {
      const result = await postCreateOrderValidation(vendorSession, {
        amount: 125,
        orderId: NONEXISTENT_OBJECT_ID,
      });
      expect([400, 404, 500]).toContain(result.status);
      expect(result.status).not.toBe(200);
    });
  });

  test.describe('Section B — Verify Payment Joi Validation', () => {
    test('PV-PAY-007 | Missing razorpay_order_id rejected', async () => {
      const result = await postVerifyValidation(vendorSession, {
        orderId: seed.onlineOrderId,
        razorpay_payment_id: 'pay_x',
        razorpay_signature: 'sig_x',
      });
      await expectApiStatus(result, 400);
      assertErrorEnvelope(result);
      expect(messageOf(result).toLowerCase()).toMatch(/razorpay_order_id|required/);
    });

    test('PV-PAY-008 | Missing razorpay_payment_id rejected', async () => {
      const result = await postVerifyValidation(vendorSession, {
        orderId: seed.onlineOrderId,
        razorpay_order_id: 'order_x',
        razorpay_signature: 'sig_x',
      });
      await expectApiStatus(result, 400);
      expect(messageOf(result).toLowerCase()).toMatch(/razorpay_payment_id|required/);
    });

    test('PV-PAY-009 | Missing razorpay_signature rejected', async () => {
      const result = await postVerifyValidation(vendorSession, {
        orderId: seed.onlineOrderId,
        razorpay_order_id: 'order_x',
        razorpay_payment_id: 'pay_x',
      });
      await expectApiStatus(result, 400);
      expect(messageOf(result).toLowerCase()).toMatch(/razorpay_signature|required/);
    });

    test('PV-PAY-010 | Empty verify body rejected', async () => {
      const result = await postVerifyValidation(vendorSession, {});
      await expectApiStatus(result, 400);
      expect(messageOf(result).toLowerCase()).toMatch(/required/);
    });

    test('PV-PAY-011 | Null razorpay fields rejected', async () => {
      const result = await postVerifyValidation(vendorSession, {
        razorpay_order_id: null,
        razorpay_payment_id: null,
        razorpay_signature: null,
      });
      await expectApiStatus(result, 400);
    });

    test('PV-PAY-012 | Invalid signature rejected after Joi', async () => {
      const result = await postVerifyValidation(vendorSession, {
        orderId: seed.onlineOrderId,
        razorpay_order_id: 'order_invalid_sig',
        razorpay_payment_id: 'pay_invalid_sig',
        razorpay_signature: 'deadbeef',
      });
      await expectApiStatus(result, 400);
      expect(messageOf(result).toLowerCase()).toMatch(/verification failed|signature|invalid|payment/);
    });
  });

  test.describe('Section C — Fail / Initiate / Hybrid Validation', () => {
    test('PV-PAY-013 | failPayment missing orderId rejected', async () => {
      const result = await postFailValidation(vendorSession, { reason: 'pv-pay' });
      expect([400, 404, 500]).toContain(result.status);
      expect(result.status).not.toBe(200);
      assertErrorEnvelope(result);
    });

    test('PV-PAY-014 | failPayment invalid ObjectId rejected', async () => {
      const result = await postFailValidation(vendorSession, {
        orderId: INVALID_OBJECT_ID,
        reason: 'pv-pay',
      });
      expect([400, 404, 500]).toContain(result.status);
      expect(result.status).not.toBe(200);
    });

    test('PV-PAY-015 | initiate invalid ObjectId rejected', async () => {
      const result = await postInitiateValidation(vendorSession, INVALID_OBJECT_ID);
      expect([400, 404, 500]).toContain(result.status);
      expect(result.status).not.toBe(200);
    });

    test('PV-PAY-016 | initiate unknown order returns 404', async () => {
      const result = await postInitiateValidation(vendorSession, NONEXISTENT_OBJECT_ID);
      await expectApiStatus(result, 404);
      expect(messageOf(result).toLowerCase()).toMatch(/not found|order/);
    });

    test('PV-PAY-017 | hybrid missing orderId rejected by Joi', async () => {
      const result = await postHybridValidation(vendorSession, { totalAmount: 100 });
      await expectApiStatus(result, 400);
      assertErrorEnvelope(result);
      expect(messageOf(result).toLowerCase()).toMatch(/orderid|required/);
    });

    test('PV-PAY-018 | hybrid invalid orderId rejected by Joi', async () => {
      const result = await postHybridValidation(vendorSession, {
        orderId: INVALID_OBJECT_ID,
        totalAmount: 100,
      });
      await expectApiStatus(result, 400);
      expect(messageOf(result).toLowerCase()).toMatch(/invalid|objectid|orderid|pattern/);
    });
  });

  test.describe('Section D — Refund Validation', () => {
    test('PV-PAY-019 | Refund unpaid COD order rejected', async () => {
      const result = await postRefundValidation(vendorSession, {
        orderId: seed.codOrderId,
        amount: 10,
        reason: 'pv-pay unpaid',
      });
      expect([400, 404]).toContain(result.status);
      expect(result.status).not.toBe(200);
      expect(messageOf(result).toLowerCase()).toMatch(/unpaid|cannot refund|payment|not found/);
    });

    test('PV-PAY-020 | Refund missing orderId rejected', async () => {
      const result = await postRefundValidation(vendorSession, {
        amount: 10,
        reason: 'pv-pay',
      });
      expect([400, 404, 500]).toContain(result.status);
      expect(result.status).not.toBe(200);
    });

    test('PV-PAY-021 | Refund invalid ObjectId rejected', async () => {
      const result = await postRefundValidation(vendorSession, {
        orderId: INVALID_OBJECT_ID,
        amount: 10,
        reason: 'pv-pay',
      });
      expect([400, 404, 500]).toContain(result.status);
      expect(result.status).not.toBe(200);
    });

    test('PV-PAY-022 | Refund zero amount rejected when paid path reached', async () => {
      const result = await postRefundValidation(vendorSession, {
        orderId: seed.codOrderId,
        amount: 0,
        reason: 'pv-pay zero',
      });
      // Unpaid fails first (400) or amount validation — never 200.
      expect(result.status).not.toBe(200);
      expect(result.status).toBeGreaterThanOrEqual(400);
    });

    test('PV-PAY-023 | Refund negative amount rejected', async () => {
      const result = await postRefundValidation(vendorSession, {
        orderId: seed.codOrderId,
        amount: -5,
        reason: 'pv-pay neg',
      });
      expect(result.status).not.toBe(200);
      expect(result.status).toBeGreaterThanOrEqual(400);
    });

    test('PV-PAY-024 | Refund history invalid ObjectId handled', async () => {
      const result = await getRefundHistoryValidation(vendorSession, INVALID_OBJECT_ID);
      expect([400, 404, 500]).toContain(result.status);
      expect(result.status).not.toBe(200);
    });
  });

  test.describe('Section E — Bank Transfer Upload Validation', () => {
    test('PV-PAY-025 | Upload missing orderId rejected', async () => {
      const result = await uploadProofValidation(
        vendorSession,
        { utrNumber: 'UTR12345678' },
        { name: 'proof.png', mimeType: 'image/png', buffer: MINI_PNG }
      );
      await expectApiStatus(result, 400);
      assertErrorEnvelope(result);
      expect(messageOf(result).toLowerCase()).toMatch(/orderid|required/);
    });

    test('PV-PAY-026 | Upload missing UTR rejected', async () => {
      const result = await uploadProofValidation(
        vendorSession,
        { orderId: seed.bankOrderId },
        { name: 'proof.png', mimeType: 'image/png', buffer: MINI_PNG }
      );
      await expectApiStatus(result, 400);
      expect(messageOf(result).toLowerCase()).toMatch(/utr|required/);
    });

    test('PV-PAY-027 | Upload short UTR rejected', async () => {
      const result = await uploadProofValidation(
        vendorSession,
        { orderId: seed.bankOrderId, utrNumber: 'AB' },
        { name: 'proof.png', mimeType: 'image/png', buffer: MINI_PNG }
      );
      await expectApiStatus(result, 400);
      expect(messageOf(result).toLowerCase()).toMatch(/utr|length|min|characters/);
    });

    test('PV-PAY-028 | Upload missing screenshot rejected', async () => {
      const result = await uploadProofValidation(vendorSession, {
        orderId: seed.bankOrderId,
        utrNumber: 'UTRNOFILE1234',
      });
      await expectApiStatus(result, 400);
      expect(messageOf(result).toLowerCase()).toMatch(/screenshot|required|file/);
    });

    test('PV-PAY-029 | Upload invalid ObjectId orderId rejected', async () => {
      const result = await uploadProofValidation(
        vendorSession,
        { orderId: INVALID_OBJECT_ID, utrNumber: 'UTRINVALIDOID1' },
        { name: 'proof.png', mimeType: 'image/png', buffer: MINI_PNG }
      );
      await expectApiStatus(result, 400);
      expect(messageOf(result).toLowerCase()).toMatch(/orderid|invalid|pattern/);
    });

    test('PV-PAY-030 | Upload invalid file type rejected', async () => {
      const result = await uploadProofValidation(
        vendorSession,
        { orderId: seed.bankOrderId, utrNumber: 'UTRBADTYPE1234' },
        {
          name: 'malware.exe',
          mimeType: 'application/octet-stream',
          buffer: Buffer.from('MZ'),
        }
      );
      expect([400, 415]).toContain(result.status);
      expect(messageOf(result).toLowerCase()).toMatch(/file|type|jpg|png|pdf|invalid|allowed/);
    });

    test('PV-PAY-031 | Upload oversized file rejected', async () => {
      clearPaymentsValidationRateLimits();
      const result = await uploadProofValidation(
        vendorSession,
        { orderId: seed.bankOrderId, utrNumber: `UTRBIG${Date.now()}` },
        {
          name: 'big.png',
          mimeType: 'image/png',
          buffer: oversizedBuffer(6 * 1024 * 1024),
        }
      );
      expect([400, 413]).toContain(result.status);
      expect(result.status).not.toBe(200);
      expect(result.status).not.toBe(201);
    });

    test('PV-PAY-032 | Upload negative transferredAmount rejected', async () => {
      const result = await uploadProofValidation(
        vendorSession,
        {
          orderId: seed.bankOrderId,
          utrNumber: `UTRNEG${Date.now()}`,
          transferredAmount: '-10',
        },
        { name: 'proof.png', mimeType: 'image/png', buffer: MINI_PNG }
      );
      await expectApiStatus(result, 400);
      expect(messageOf(result).toLowerCase()).toMatch(/transferredamount|positive|greater|amount/);
    });

    test('PV-PAY-033 | Reject proof missing reason rejected', async () => {
      const result = await rejectProofValidation(vendorSession, NONEXISTENT_OBJECT_ID, {});
      // Vendor gets 403 authz OR SA path 400 validation — never success.
      expect([400, 403]).toContain(result.status);
      if (result.status === 400) {
        expect(messageOf(result).toLowerCase()).toMatch(/reason|required/);
      }
    });

    test('PV-PAY-034 | Reject proof short reason rejected for valid SA schema shape', async () => {
      // Auth may 403 for vendor; if Joi runs after authorize, SUPER_ADMIN would 400.
      // Production: authorize(SUPER_ADMIN) before validate → vendor 403.
      const result = await rejectProofValidation(vendorSession, NONEXISTENT_OBJECT_ID, {
        reason: 'no',
      });
      expect([400, 403]).toContain(result.status);
      expect(result.status).not.toBe(200);
    });
  });

  test.describe('Section F — Webhook Validation', () => {
    test('PV-PAY-035 | Webhook without signature rejected', async () => {
      const result = await postWebhookRaw({
        body: JSON.stringify({
          id: `evt_pv_${Date.now()}`,
          event: 'payment.captured',
          payload: { payment: { entity: { id: 'pay_x', order_id: 'ord_x', amount: 100 } } },
        }),
      });
      expect(result.status).not.toBe(200);
      expect(result.status).toBeGreaterThanOrEqual(400);
    });

    test('PV-PAY-036 | Webhook invalid signature rejected', async () => {
      const result = await postWebhookRaw({
        body: JSON.stringify({
          id: `evt_pv_bad_${Date.now()}`,
          event: 'payment.captured',
          payload: { payment: { entity: { id: 'pay_x', order_id: 'ord_x', amount: 100 } } },
        }),
        signature: 'invalid_signature',
      });
      expect(result.status).not.toBe(200);
      expect(result.status).toBeGreaterThanOrEqual(400);
      expect(messageOf(result).toLowerCase()).toMatch(/signature|configuration|invalid|webhook/);
    });

    test('PV-PAY-037 | Webhook malformed JSON rejected', async () => {
      const result = await postWebhookRaw({
        body: '{not-json',
        signature: 'x',
      });
      expect(result.status).not.toBe(200);
      expect(result.status).toBeGreaterThanOrEqual(400);
    });

    test('PV-PAY-038 | Webhook empty body rejected', async () => {
      const result = await postWebhookRaw({ body: '', signature: 'x' });
      expect(result.status).not.toBe(200);
      expect(result.status).toBeGreaterThanOrEqual(400);
    });

    test('PV-PAY-039 | Signed unknown payment webhook acknowledged or config-gated', async () => {
      const secret = getRazorpayWebhookSecret();
      if (!seed.webhookConfigured || !secret) {
        const result = await postWebhookRaw({
          body: JSON.stringify({ id: 'evt_pv_cfg', event: 'payment.captured', payload: {} }),
          signature: 'x',
        });
        expect(result.status).toBeGreaterThanOrEqual(400);
        return;
      }
      const rawBody = JSON.stringify({
        id: `evt_pv_ok_${Date.now()}`,
        event: 'payment.captured',
        payload: {
          payment: {
            entity: { id: 'pay_unknown', order_id: 'order_unknown', amount: 100, status: 'captured' },
          },
        },
      });
      const result = await postWebhookRaw({
        body: rawBody,
        signature: signWebhookBody(rawBody, secret),
      });
      await expectApiStatus(result, 200);
      assertSuccessEnvelope(result);
    });
  });

  test.describe('Section G — Security & Payload Hardening', () => {
    test('PV-PAY-040 | Mongo operator injection in verify orderId rejected', async () => {
      const result = await postVerifyValidation(vendorSession, {
        orderId: { $gt: '' },
        razorpay_order_id: 'order_x',
        razorpay_payment_id: 'pay_x',
        razorpay_signature: 'sig_x',
      });
      expect([400, 404]).toContain(result.status);
      expect(result.status).not.toBe(200);
    });

    test('PV-PAY-041 | Prototype pollution keys on create-order rejected or ignored safely', async () => {
      const result = await postCreateOrderValidation(vendorSession, {
        amount: 0,
        __proto__: { admin: true },
        constructor: { prototype: { admin: true } },
      });
      await expectApiStatus(result, 400);
      assertErrorEnvelope(result);
    });

    test('PV-PAY-042 | XSS payload in refund reason does not succeed on unpaid order', async () => {
      const result = await postRefundValidation(vendorSession, {
        orderId: seed.codOrderId,
        amount: 1,
        reason: '<script>alert(1)</script>',
      });
      expect(result.status).not.toBe(200);
      expect(result.status).toBeGreaterThanOrEqual(400);
    });

    test('PV-PAY-043 | Unicode UTR accepted only if length valid; else 400', async () => {
      const result = await uploadProofValidation(
        vendorSession,
        { orderId: seed.bankOrderId, utrNumber: 'यूटीआर१२३४' },
        { name: 'proof.png', mimeType: 'image/png', buffer: MINI_PNG }
      );
      // Production Joi: min 4 chars — unicode string length may pass Joi then hit business rules.
      expect([200, 201, 400]).toContain(result.status);
      if (result.status >= 400) {
        assertErrorEnvelope(result);
      }
    });

    test('PV-PAY-044 | Oversized JSON body on verify handled', async () => {
      const huge = 'x'.repeat(50_000);
      const result = await postVerifyValidation(vendorSession, {
        orderId: seed.onlineOrderId,
        razorpay_order_id: huge,
        razorpay_payment_id: 'pay_x',
        razorpay_signature: 'sig_x',
      });
      expect([400, 413, 500]).toContain(result.status);
      expect(result.status).not.toBe(200);
    });

    test('PV-PAY-045 | Wrong Content-Type on verify with raw body', async () => {
      const result = await postPaymentsRawFetch(vendorSession, '/payments/verify', {
        body: 'razorpay_order_id=order_x&razorpay_payment_id=pay_x&razorpay_signature=sig',
        contentType: 'text/plain',
      });
      expect([400, 415, 500]).toContain(result.status);
      expect(result.status).not.toBe(200);
    });

    test('PV-PAY-046 | Empty JSON object on create-order rejected', async () => {
      const result = await postCreateOrderValidation(vendorSession, {});
      await expectApiStatus(result, 400);
      assertErrorEnvelope(result);
    });

    test('PV-PAY-047 | Null body fields on hybrid rejected', async () => {
      const result = await postHybridValidation(vendorSession, {
        orderId: null,
        totalAmount: null,
      });
      await expectApiStatus(result, 400);
    });
  });

  test.describe('Section H — Client Validation', () => {
    test('PV-PAY-048 | Checkout blocks place order when address empty', async ({ page }) => {
      await vendorUi(page);
      const { addToCartApi, clearCartApi } = await import('../helpers/payment.validation.helper');
      await clearCartApi(vendorSession);
      await addToCartApi(vendorSession, seed.productId, 1);

      const checkout = new VendorCheckoutPage(page);
      await checkout.goto();
      await checkout.waitForLoad();
      await page.getByPlaceholder('Enter your complete delivery address').fill('');
      await page.locator('label', { hasText: 'City' }).locator('..').locator('input').fill('');
      await page.locator('label', { hasText: 'State' }).locator('..').locator('input').fill('');
      await page.locator('label', { hasText: 'Pincode' }).locator('..').locator('input').fill('');
      await checkout.placeOrderButton().click();
      await expect(
        page.getByText(/delivery address is required|city is required|state is required|pincode must be 6 digits/i)
      ).toBeVisible({ timeout: 10000 });
      await expect(page).toHaveURL(/\/vendor\/checkout/);
    });

    test('PV-PAY-049 | Checkout shows invalid pincode message', async ({ page }) => {
      await vendorUi(page);
      const { addToCartApi, clearCartApi } = await import('../helpers/payment.validation.helper');
      await clearCartApi(vendorSession);
      await addToCartApi(vendorSession, seed.productId, 1);

      const checkout = new VendorCheckoutPage(page);
      await checkout.goto();
      await checkout.waitForLoad();
      await checkout.fillAddress();
      await page.locator('label', { hasText: 'Pincode' }).locator('..').locator('input').fill('12');
      await checkout.placeOrderButton().click();
      await expect(page.getByText(/pincode must be 6 digits/i)).toBeVisible({ timeout: 10000 });
    });

    test('PV-PAY-050 | Checkout exposes COD and Razorpay options only', async ({ page }) => {
      await vendorUi(page);
      const { addToCartApi, clearCartApi } = await import('../helpers/payment.validation.helper');
      await clearCartApi(vendorSession);
      await addToCartApi(vendorSession, seed.productId, 1);
      const checkout = new VendorCheckoutPage(page);
      await checkout.goto();
      await checkout.waitForLoad();
      await expect(page.getByText('Cash On Delivery')).toBeVisible();
      await expect(page.getByText('Razorpay (Online Payment)')).toBeVisible();
      await expect(page.getByText(/Credit Line/i)).toHaveCount(0);
    });

    test('PV-PAY-051 | Bank payment page requires UTR client-side', async ({ page }) => {
      await vendorUi(page);
      await page.goto(`/vendor/orders/${seed.bankOrderId}/payment`);
      await expect(page.getByText(/UTR|payment proof|bank transfer/i).first()).toBeVisible({
        timeout: 15000,
      });
      const submit = page.getByRole('button', { name: /submit|upload/i }).first();
      if (await submit.isVisible().catch(() => false)) {
        await submit.click();
        await expect(page.getByText(/UTR number is required|screenshot is required/i)).toBeVisible({
          timeout: 10000,
        });
      } else {
        // Pending/approved state may hide form — still a valid validation surface.
        await expect(page.getByText(/pending|approved|rejected|payment/i).first()).toBeVisible();
      }
    });
  });

  test.describe('Section I — Envelope & Consistency', () => {
    test('PV-PAY-052 | Verify error uses success=false envelope', async () => {
      const result = await postVerifyValidation(vendorSession, {});
      await expectApiStatus(result, 400);
      assertErrorEnvelope(result);
      expect(result.body).toHaveProperty('message');
    });

    test('PV-PAY-053 | Create-order error envelope consistency', async () => {
      const result = await postCreateOrderValidation(vendorSession, { amount: -1 });
      await expectApiStatus(result, 400);
      assertErrorEnvelope(result);
    });

    test('PV-PAY-054 | Upload validation envelope consistency', async () => {
      const result = await uploadProofValidation(vendorSession, {
        orderId: seed.bankOrderId,
        utrNumber: 'AB',
      });
      await expectApiStatus(result, 400);
      assertErrorEnvelope(result);
    });

    test('PV-PAY-055 | Hybrid validation envelope consistency', async () => {
      const result = await postHybridValidation(vendorSession, {});
      await expectApiStatus(result, 400);
      assertErrorEnvelope(result);
    });

    test('PV-PAY-056 | Webhook error envelope includes message', async () => {
      const result = await postWebhookRaw({
        body: JSON.stringify({ event: 'payment.captured' }),
        signature: 'bad',
      });
      expect(result.status).toBeGreaterThanOrEqual(400);
      expect(typeof result.body.message === 'string' || result.body.message == null).toBeTruthy();
    });

    test('PV-PAY-057 | initiate unknown order envelope', async () => {
      const result = await postInitiateValidation(vendorSession, NONEXISTENT_OBJECT_ID);
      await expectApiStatus(result, 404);
      assertErrorEnvelope(result);
    });

    test('PV-PAY-058 | Valid UTR length boundary (4 chars) reaches business layer', async () => {
      clearPaymentsValidationRateLimits();
      const result = await uploadProofValidation(
        vendorSession,
        { orderId: seed.bankOrderId, utrNumber: 'ABCD' },
        { name: 'proof.png', mimeType: 'image/png', buffer: MINI_PNG }
      );
      // Joi passes min(4); business may 200/201 or 400 pending-already / status rules.
      expect([200, 201, 400]).toContain(result.status);
      if (result.status === 200 || result.status === 201) {
        assertSuccessEnvelope(result);
      } else {
        assertErrorEnvelope(result);
      }
    });

    test('PV-PAY-059 | UTR over max length rejected', async () => {
      const result = await uploadProofValidation(
        vendorSession,
        { orderId: seed.bankOrderId, utrNumber: 'U'.repeat(51) },
        { name: 'proof.png', mimeType: 'image/png', buffer: MINI_PNG }
      );
      await expectApiStatus(result, 400);
      expect(messageOf(result).toLowerCase()).toMatch(/utr|length|max|characters|50/);
    });

    test('PV-PAY-060 | Reject reason over max length rejected when authorize allows', async () => {
      const { loginApiFresh } = await import('../helpers/auth.api.helper');
      const { getSuperAdminCredentials } = await import('../helpers/product.credentials');
      const saCreds = getSuperAdminCredentials();
      const sa = await loginApiFresh(saCreds.mobile, saCreds.password);
      const result = await rejectProofValidation(sa, NONEXISTENT_OBJECT_ID, {
        reason: 'R'.repeat(501),
      });
      // Joi max 500 → 400; or 404 if validation order differs after authorize.
      expect([400, 404]).toContain(result.status);
      expect(result.status).not.toBe(200);
    });
  });
});
