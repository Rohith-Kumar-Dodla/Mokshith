import { execSync } from 'child_process';
import path from 'path';
import { authHeaders, loginApi, type ApiSession } from './auth.api.helper';
import {
  createProductApi,
  getAdminSession,
  getFirstCategoryId,
} from './product.api.helper';
import { getVendorCredentials, uniqueProductName } from './product.credentials';
import { addToCartApi, clearCartApi } from './cart.api.helper';
import {
  placeBankTransferOrderApi,
  placeCodOrderApi,
  placeOnlineOrderApi,
  resolveOrderId,
  MINI_PNG,
  getRazorpayWebhookSecret,
  signWebhookBody,
  probeServerWebhookConfigured,
} from './payment.functional.helper';
import {
  API_BASE,
  apiJson,
  messageOf,
  type ApiResult,
  INVALID_OBJECT_ID,
  NONEXISTENT_OBJECT_ID,
} from './validation/product.validation.helper';

export { messageOf, INVALID_OBJECT_ID, NONEXISTENT_OBJECT_ID, API_BASE };
export type { ApiResult };

export type PaymentsValidationSeed = {
  categoryId: string;
  productId: string;
  onlineOrderId: string;
  bankOrderId: string;
  codOrderId: string;
  webhookConfigured: boolean;
};

export function clearPaymentsValidationRateLimits(): void {
  try {
    const script = path.resolve(process.cwd(), '..', 'b2b-backend', 'scripts', 'clearAuthRateLimits.js');
    execSync(`node "${script}"`, { stdio: 'ignore' });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.warn('Warning: failed to clear payments validation rate limits:', message);
  }
}

export async function seedPaymentsValidationData(): Promise<{
  vendorSession: ApiSession;
  seed: PaymentsValidationSeed;
}> {
  clearPaymentsValidationRateLimits();
  const vendorCreds = getVendorCredentials(1);
  const vendorSession = await loginApi(vendorCreds.mobile, vendorCreds.password);
  const adminSession = await getAdminSession();
  const categoryId = await getFirstCategoryId(adminSession);
  const created = await createProductApi(adminSession, {
    name: uniqueProductName('pv-pay'),
    price: 125,
    categoryId,
    stock: 120,
    moq: 1,
  });
  const productId = String(created._id || created.id);

  await clearCartApi(vendorSession);
  await addToCartApi(vendorSession, productId, 1);
  const online = await placeOnlineOrderApi(vendorSession, {
    idempotencyKey: `pv-pay-on-${Date.now()}`,
  });

  await clearCartApi(vendorSession);
  await addToCartApi(vendorSession, productId, 1);
  const bank = await placeBankTransferOrderApi(vendorSession, {
    idempotencyKey: `pv-pay-bank-${Date.now()}`,
  });

  await clearCartApi(vendorSession);
  await addToCartApi(vendorSession, productId, 1);
  const cod = await placeCodOrderApi(vendorSession, {
    idempotencyKey: `pv-pay-cod-${Date.now()}`,
  });

  return {
    vendorSession,
    seed: {
      categoryId,
      productId,
      onlineOrderId: resolveOrderId(online),
      bankOrderId: resolveOrderId(bank),
      codOrderId: resolveOrderId(cod),
      webhookConfigured: await probeServerWebhookConfigured(),
    },
  };
}

export async function postCreateOrderValidation(
  session: ApiSession,
  body: Record<string, unknown>
): Promise<ApiResult> {
  return apiJson(session, 'POST', '/payments/create-order', body);
}

export async function postVerifyValidation(
  session: ApiSession,
  body: Record<string, unknown>
): Promise<ApiResult> {
  return apiJson(session, 'POST', '/payments/verify', body);
}

export async function postFailValidation(
  session: ApiSession,
  body: Record<string, unknown>
): Promise<ApiResult> {
  return apiJson(session, 'POST', '/payments/fail', body);
}

export async function postInitiateValidation(
  session: ApiSession,
  orderId: string
): Promise<ApiResult> {
  return apiJson(session, 'POST', `/payments/initiate/${orderId}`, {});
}

export async function postHybridValidation(
  session: ApiSession,
  body: Record<string, unknown>
): Promise<ApiResult> {
  return apiJson(session, 'POST', '/payments/hybrid', body);
}

export async function postRefundValidation(
  session: ApiSession,
  body: Record<string, unknown>
): Promise<ApiResult> {
  return apiJson(session, 'POST', '/payments/refund', body);
}

export async function getRefundHistoryValidation(
  session: ApiSession,
  orderId: string
): Promise<ApiResult> {
  return apiJson(session, 'GET', `/payments/refund/history/${orderId}`);
}

export async function rejectProofValidation(
  session: ApiSession,
  proofId: string,
  body: Record<string, unknown>
): Promise<ApiResult> {
  return apiJson(session, 'PATCH', `/payments/bank-transfer/${proofId}/reject`, body);
}

export async function uploadProofValidation(
  session: ApiSession,
  fields: Record<string, string>,
  file?: { name: string; mimeType: string; buffer: Buffer } | null
): Promise<ApiResult> {
  const form = new FormData();
  Object.entries(fields).forEach(([key, value]) => form.append(key, value));
  if (file) {
    form.append(
      'screenshot',
      new Blob([new Uint8Array(file.buffer)], { type: file.mimeType }),
      file.name
    );
  }

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

export async function postWebhookRaw(options: {
  body: string;
  signature?: string;
  contentType?: string | null;
}): Promise<ApiResult> {
  const headers: Record<string, string> = {};
  if (options.contentType !== null) {
    headers['Content-Type'] = options.contentType ?? 'application/json';
  }
  if (options.signature) {
    headers['x-razorpay-signature'] = options.signature;
  }
  const response = await fetch(`${API_BASE}/payments/webhook`, {
    method: 'POST',
    headers,
    body: options.body,
  });
  const body = (await response.json().catch(() => ({}))) as Record<string, unknown>;
  return { status: response.status, body };
}

export async function postPaymentsRawFetch(
  session: ApiSession,
  endpoint: string,
  options: { body: string; contentType?: string }
): Promise<ApiResult> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${session.accessToken}`,
      'x-csrf-token': session.csrfToken,
      Cookie: `csrf-token=${session.csrfToken}`,
      ...(options.contentType ? { 'Content-Type': options.contentType } : {}),
    },
    body: options.body,
  });
  const body = (await response.json().catch(() => ({}))) as Record<string, unknown>;
  return { status: response.status, body };
}

export function assertErrorEnvelope(result: ApiResult) {
  if (typeof result.body.success === 'boolean' && result.body.success !== false) {
    throw new Error(`Expected success=false: ${messageOf(result)}`);
  }
  if (result.body.message != null && typeof result.body.message !== 'string') {
    throw new Error(`Expected string message: ${messageOf(result)}`);
  }
}

export function assertSuccessEnvelope(result: ApiResult) {
  if (typeof result.body.success === 'boolean' && result.body.success !== true) {
    throw new Error(`Expected success=true: ${messageOf(result)}`);
  }
}

export function oversizedBuffer(bytes: number): Buffer {
  return Buffer.alloc(bytes, 1);
}

export {
  authHeaders,
  addToCartApi,
  clearCartApi,
  MINI_PNG,
  resolveOrderId,
  getRazorpayWebhookSecret,
  signWebhookBody,
  placeOnlineOrderApi,
};
