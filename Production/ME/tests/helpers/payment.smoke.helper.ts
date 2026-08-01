import { apiClient } from './apiClient';
import { authHeaders, type ApiSession } from './auth.api.helper';
import {
  createProductApi,
  getAdminSession,
  getFirstCategoryId,
} from './product.api.helper';
import { uniqueProductName } from './product.credentials';
import { addToCartApi, clearCartApi } from './cart.api.helper';
import { clearValidationRateLimits } from './cart.validation.helper';
import {
  getInventoryStockForProduct,
  getOrderByIdApi,
  placeCodOrderApi,
  placeOnlineOrderApi,
  resolveOrderId,
  type OrderResponse,
} from './order.functional.helper';
import { API_BASE } from './validation/product.validation.helper';

export type PaymentSmokeProduct = {
  id: string;
  name: string;
  stock: number;
};

export type PaymentsSmokeSeed = {
  categoryId: string;
  codProduct: PaymentSmokeProduct;
  onlineProduct: PaymentSmokeProduct;
  failProduct: PaymentSmokeProduct;
  seedCodOrderId: string;
  seedOnlineOrderId: string;
};

async function seedProduct(
  adminSession: ApiSession,
  categoryId: string,
  prefix: string,
  stock: number
): Promise<PaymentSmokeProduct> {
  const created = await createProductApi(adminSession, {
    name: uniqueProductName(prefix),
    price: 180,
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

export async function seedPaymentsSmokeData(vendorSession: ApiSession): Promise<{
  adminSession: ApiSession;
  seed: PaymentsSmokeSeed;
}> {
  clearValidationRateLimits();
  const adminSession = await getAdminSession();
  const categoryId = await getFirstCategoryId(adminSession);

  const codProduct = await seedProduct(adminSession, categoryId, 'ps-pay-cod', 40);
  const onlineProduct = await seedProduct(adminSession, categoryId, 'ps-pay-on', 40);
  const failProduct = await seedProduct(adminSession, categoryId, 'ps-pay-fail', 40);

  await clearCartApi(vendorSession);
  await addToCartApi(vendorSession, codProduct.id, 1);
  const seedCodOrder = await placeCodOrderApi(vendorSession, {
    idempotencyKey: `ps-pay-seed-cod-${Date.now()}`,
  });

  await clearCartApi(vendorSession);
  await addToCartApi(vendorSession, onlineProduct.id, 1);
  const seedOnlineOrder = await placeOnlineOrderApi(vendorSession, {
    idempotencyKey: `ps-pay-seed-on-${Date.now()}`,
  });

  return {
    adminSession,
    seed: {
      categoryId,
      codProduct,
      onlineProduct,
      failProduct,
      seedCodOrderId: resolveOrderId(seedCodOrder),
      seedOnlineOrderId: resolveOrderId(seedOnlineOrder),
    },
  };
}

export async function postPaymentsCreateOrderRaw(
  body: Record<string, unknown> = {},
  headers: Record<string, string> = {}
) {
  return apiClient.post('/payments/create-order', body, {
    headers,
    validateStatus: () => true,
  });
}

export async function postPaymentsVerifyRaw(
  body: Record<string, unknown> = {},
  headers: Record<string, string> = {}
) {
  return apiClient.post('/payments/verify', body, {
    headers,
    validateStatus: () => true,
  });
}

export async function postPaymentsFailRaw(
  body: Record<string, unknown> = {},
  headers: Record<string, string> = {}
) {
  return apiClient.post('/payments/fail', body, {
    headers,
    validateStatus: () => true,
  });
}

export async function postPaymentsInitiateRaw(
  orderId: string,
  headers: Record<string, string> = {}
) {
  return apiClient.post(
    `/payments/initiate/${orderId}`,
    {},
    { headers, validateStatus: () => true }
  );
}

export async function getBankDetailsRaw(headers: Record<string, string> = {}) {
  return apiClient.get('/payments/bank-transfer/bank-details', {
    headers,
    validateStatus: () => true,
  });
}

/** Webhook has no auth; raw fetch preserves body for signature path. */
export async function postPaymentsWebhookRawFetch(options: {
  body: string;
  signature?: string;
  contentType?: string;
}): Promise<{ status: number; body: Record<string, unknown> }> {
  const response = await fetch(`${API_BASE}/payments/webhook`, {
    method: 'POST',
    headers: {
      ...(options.contentType ? { 'Content-Type': options.contentType } : { 'Content-Type': 'application/json' }),
      ...(options.signature ? { 'x-razorpay-signature': options.signature } : {}),
    },
    body: options.body,
  });
  const body = (await response.json().catch(() => ({}))) as Record<string, unknown>;
  return { status: response.status, body };
}

export function messageOf(payload: unknown): string {
  if (payload && typeof payload === 'object') {
    const msg = (payload as { message?: unknown }).message;
    if (typeof msg === 'string') return msg;
  }
  return JSON.stringify(payload);
}

export {
  authHeaders,
  clearCartApi,
  addToCartApi,
  clearValidationRateLimits,
  getInventoryStockForProduct,
  getOrderByIdApi,
  placeCodOrderApi,
  placeOnlineOrderApi,
  resolveOrderId,
  type OrderResponse,
};
