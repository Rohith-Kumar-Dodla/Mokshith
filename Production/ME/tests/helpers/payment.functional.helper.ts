import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { apiClient } from './apiClient';
import { authHeaders, loginApi, loginApiFresh, type ApiSession } from './auth.api.helper';
import {
  createProductApi,
  getAdminSession,
  getFirstCategoryId,
} from './product.api.helper';
import {
  getSuperAdminCredentials,
  getVendorCredentials,
  uniqueProductName,
} from './product.credentials';
import { addToCartApi, clearCartApi } from './cart.api.helper';
import { clearValidationRateLimits } from './cart.validation.helper';
import { createOrderApi, buildShippingAddress } from './cart.functional.helper';
import {
  getInventoryStockForProduct,
  getOrderByIdApi,
  placeCodOrderApi,
  placeOnlineOrderApi,
  resolveOrderId,
  type OrderResponse,
} from './order.functional.helper';
import { API_BASE } from './validation/product.validation.helper';

export type PaymentFunctionalProduct = {
  id: string;
  name: string;
  stock: number;
};

export type RazorpayProbe = {
  available: boolean;
  orderId?: string;
  gatewayOrderId?: string;
  amount?: number;
  message?: string;
};

export type PaymentsFunctionalSeed = {
  categoryId: string;
  codProduct: PaymentFunctionalProduct;
  onlineProduct: PaymentFunctionalProduct;
  bankProduct: PaymentFunctionalProduct;
  failProduct: PaymentFunctionalProduct;
  razorpay: RazorpayProbe;
  webhookConfigured: boolean;
};

/** Minimal valid 1×1 PNG for multipart bank-proof upload. */
export const MINI_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64'
);

function readEnvValue(filePath: string, key: string): string | undefined {
  try {
    const text = fs.readFileSync(filePath, 'utf8');
    const match = text.match(new RegExp(`^${key}=(.*)$`, 'm'));
    if (!match) return undefined;
    return match[1]!.trim().replace(/^["']|["']$/g, '');
  } catch {
    return undefined;
  }
}

/** Prefer process env, then backend .env / .env.qa (for local HMAC signing only). */
export function getRazorpayKeySecret(): string | undefined {
  return (
    process.env.RAZORPAY_KEY_SECRET ||
    readEnvValue(path.resolve(process.cwd(), '..', 'b2b-backend', '.env'), 'RAZORPAY_KEY_SECRET') ||
    readEnvValue(path.resolve(process.cwd(), '..', 'b2b-backend', '.env.qa'), 'RAZORPAY_KEY_SECRET')
  );
}

export function getRazorpayWebhookSecret(): string | undefined {
  return (
    process.env.RAZORPAY_WEBHOOK_SECRET ||
    readEnvValue(path.resolve(process.cwd(), '..', 'b2b-backend', '.env'), 'RAZORPAY_WEBHOOK_SECRET') ||
    readEnvValue(path.resolve(process.cwd(), '..', 'b2b-backend', '.env.qa'), 'RAZORPAY_WEBHOOK_SECRET')
  );
}

/**
 * Probe the live backend for webhook secret configuration.
 * Local .env may have a signing secret while a reused QA process does not.
 */
export async function probeServerWebhookConfigured(): Promise<boolean> {
  const rawBody = JSON.stringify({
    id: `evt_cfg_probe_${Date.now()}`,
    event: 'payment.captured',
    payload: {
      payment: { entity: { id: 'pay_probe', order_id: 'order_probe', amount: 100 } },
    },
  });
  const res = await postPaymentsWebhookRawFetch({ body: rawBody, signature: 'invalid_probe_sig' });
  const msg = messageOf(res.body).toLowerCase();
  if (msg.includes('configuration') || msg.includes('not configured')) {
    return false;
  }
  return res.status === 400 || msg.includes('signature') || msg.includes('invalid');
}

export function signVerifyPayload(orderId: string, paymentId: string, secret: string): string {
  return crypto.createHmac('sha256', secret).update(`${orderId}|${paymentId}`).digest('hex');
}

export function signWebhookBody(rawBody: string, secret: string): string {
  return crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
}

async function seedProduct(
  adminSession: ApiSession,
  categoryId: string,
  prefix: string,
  stock: number
): Promise<PaymentFunctionalProduct> {
  const created = await createProductApi(adminSession, {
    name: uniqueProductName(prefix),
    price: 150,
    categoryId,
    stock,
    moq: 1,
  });
  return {
    id: String(created._id || created.id),
    name: String(created.name),
    stock,
  };
}

export async function placeBankTransferOrderApi(
  session: ApiSession,
  options?: { idempotencyKey?: string }
): Promise<OrderResponse> {
  const order = await createOrderApi(session, {
    paymentMethod: 'BANK_TRANSFER',
    shippingAddress: buildShippingAddress(),
    idempotencyKey:
      options?.idempotencyKey ?? `pf-pay-bank-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
  });
  return order as OrderResponse;
}

export async function seedPaymentsFunctionalData(vendorSession: ApiSession): Promise<{
  adminSession: ApiSession;
  superAdminSession: ApiSession;
  seed: PaymentsFunctionalSeed;
}> {
  clearValidationRateLimits();
  const adminSession = await getAdminSession();
  const saCreds = getSuperAdminCredentials();
  const superAdminSession = await loginApiFresh(saCreds.mobile, saCreds.password);
  const categoryId = await getFirstCategoryId(adminSession);

  const codProduct = await seedProduct(adminSession, categoryId, 'pf-pay-cod', 60);
  const onlineProduct = await seedProduct(adminSession, categoryId, 'pf-pay-on', 60);
  const bankProduct = await seedProduct(adminSession, categoryId, 'pf-pay-bank', 60);
  const failProduct = await seedProduct(adminSession, categoryId, 'pf-pay-fail', 60);

  // Probe Razorpay on the live backend (dev may have keys; qa may not).
  await clearCartApi(vendorSession);
  await addToCartApi(vendorSession, onlineProduct.id, 1);
  const onlineOrder = await placeOnlineOrderApi(vendorSession, {
    idempotencyKey: `pf-pay-probe-${Date.now()}`,
  });
  const onlineOrderId = resolveOrderId(onlineOrder);
  const orderDoc = await getOrderByIdApi(vendorSession, onlineOrderId);
  const amount = Number(orderDoc.totalAmount ?? 150);
  const createRes = await postPaymentsCreateOrderRaw(
    { amount, orderId: onlineOrderId },
    authHeaders(vendorSession)
  );
  const razorpay: RazorpayProbe =
    createRes.status === 200
      ? {
          available: true,
          orderId: onlineOrderId,
          gatewayOrderId: String(
            (createRes.data as { data?: { gatewayOrderId?: string; id?: string; order_id?: string } })
              ?.data?.gatewayOrderId ||
              (createRes.data as { data?: { id?: string } })?.data?.id ||
              (createRes.data as { data?: { order_id?: string } })?.data?.order_id ||
              ''
          ),
          amount,
        }
      : {
          available: false,
          orderId: onlineOrderId,
          message: messageOf(createRes.data),
        };

  return {
    adminSession,
    superAdminSession,
    seed: {
      categoryId,
      codProduct,
      onlineProduct,
      bankProduct,
      failProduct,
      razorpay,
      webhookConfigured: await probeServerWebhookConfigured(),
    },
  };
}

export function messageOf(payload: unknown): string {
  if (payload && typeof payload === 'object') {
    const msg = (payload as { message?: unknown }).message;
    if (typeof msg === 'string') return msg;
  }
  return JSON.stringify(payload ?? {});
}

export async function postPaymentsCreateOrderRaw(
  body: Record<string, unknown> = {},
  headers: Record<string, string> = {}
) {
  return apiClient.post('/payments/create-order', body, { headers, validateStatus: () => true });
}

export async function postPaymentsInitiateRaw(
  orderId: string,
  headers: Record<string, string> = {}
) {
  return apiClient.post(`/payments/initiate/${orderId}`, {}, { headers, validateStatus: () => true });
}

export async function postPaymentsVerifyRaw(
  body: Record<string, unknown> = {},
  headers: Record<string, string> = {}
) {
  return apiClient.post('/payments/verify', body, { headers, validateStatus: () => true });
}

export async function postPaymentsFailRaw(
  body: Record<string, unknown> = {},
  headers: Record<string, string> = {}
) {
  return apiClient.post('/payments/fail', body, { headers, validateStatus: () => true });
}

export async function postPaymentsRefundRaw(
  body: Record<string, unknown> = {},
  headers: Record<string, string> = {}
) {
  return apiClient.post('/payments/refund', body, { headers, validateStatus: () => true });
}

export async function getRefundHistoryRaw(
  orderId: string,
  headers: Record<string, string> = {}
) {
  return apiClient.get(`/payments/refund/history/${orderId}`, {
    headers,
    validateStatus: () => true,
  });
}

export async function getBankDetailsRaw(headers: Record<string, string> = {}) {
  return apiClient.get('/payments/bank-transfer/bank-details', {
    headers,
    validateStatus: () => true,
  });
}

export async function getPendingPaymentProofsRaw(headers: Record<string, string> = {}) {
  return apiClient.get('/payments/bank-transfer/pending', {
    headers,
    validateStatus: () => true,
  });
}

export async function approvePaymentProofRaw(
  proofId: string,
  headers: Record<string, string> = {}
) {
  return apiClient.patch(
    `/payments/bank-transfer/${proofId}/approve`,
    {},
    { headers, validateStatus: () => true }
  );
}

export async function rejectPaymentProofRaw(
  proofId: string,
  reason: string,
  headers: Record<string, string> = {}
) {
  return apiClient.patch(
    `/payments/bank-transfer/${proofId}/reject`,
    { reason },
    { headers, validateStatus: () => true }
  );
}

export async function uploadPaymentProofRaw(
  session: ApiSession,
  fields: { orderId: string; utrNumber: string; transferredAmount?: number },
  file: { name: string; mimeType: string; buffer: Buffer } = {
    name: 'proof.png',
    mimeType: 'image/png',
    buffer: MINI_PNG,
  }
): Promise<{ status: number; body: Record<string, unknown> }> {
  const form = new FormData();
  form.append('orderId', fields.orderId);
  form.append('utrNumber', fields.utrNumber);
  if (fields.transferredAmount != null) {
    form.append('transferredAmount', String(fields.transferredAmount));
  }
  form.append('screenshot', new Blob([new Uint8Array(file.buffer)], { type: file.mimeType }), file.name);

  const response = await fetch(`${API_BASE}/payments/bank-transfer/upload`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${session.accessToken}`,
      'x-csrf-token': session.csrfToken,
      Cookie: `csrf-token=${session.csrfToken}`,
    },
    body: form,
  });
  const body = (await response.json().catch(() => ({}))) as Record<string, unknown>;
  return { status: response.status, body };
}

export async function postPaymentsWebhookRawFetch(options: {
  body: string;
  signature?: string;
}): Promise<{ status: number; body: Record<string, unknown> }> {
  const response = await fetch(`${API_BASE}/payments/webhook`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(options.signature ? { 'x-razorpay-signature': options.signature } : {}),
    },
    body: options.body,
  });
  const body = (await response.json().catch(() => ({}))) as Record<string, unknown>;
  return { status: response.status, body };
}

export function unwrapProofId(payload: Record<string, unknown>): string {
  const data = (payload.data ?? payload) as Record<string, unknown>;
  const proof = (data.paymentProof ?? data.proof ?? data) as Record<string, unknown>;
  return String(proof._id || proof.id || data._id || data.id || '');
}

export {
  authHeaders,
  addToCartApi,
  clearCartApi,
  clearValidationRateLimits,
  getInventoryStockForProduct,
  getOrderByIdApi,
  placeCodOrderApi,
  placeOnlineOrderApi,
  resolveOrderId,
  getVendorCredentials,
  loginApi,
  type OrderResponse,
};
