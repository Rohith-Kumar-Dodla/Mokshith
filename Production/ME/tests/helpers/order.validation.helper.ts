import { apiClient } from './apiClient';
import { authHeaders, type ApiSession } from './auth.api.helper';
import {
  createProductApi,
  getFirstCategoryId,
  patchProductStatusApi,
  type ProductPayload,
} from './product.api.helper';
import { uniqueProductName } from './product.credentials';
import { addToCartApi, clearCartApi } from './cart.api.helper';
import { placeCodOrderApi, resolveOrderId } from './order.functional.helper';
import {
  API_BASE,
  apiJson,
  messageOf,
  type ApiResult,
  INVALID_OBJECT_ID,
  NONEXISTENT_OBJECT_ID,
} from './validation/product.validation.helper';
import { clearValidationRateLimits } from './cart.validation.helper';

export { messageOf, clearValidationRateLimits, INVALID_OBJECT_ID, NONEXISTENT_OBJECT_ID };

export type SeededOrderValidationProduct = {
  id: string;
  name: string;
  price: number;
  moq: number;
  stock: number;
};

export type OrdersValidationSeed = {
  categoryId: string;
  standard: SeededOrderValidationProduct;
  second: SeededOrderValidationProduct;
  oos: SeededOrderValidationProduct;
  moq5: SeededOrderValidationProduct;
  lowStock: SeededOrderValidationProduct;
  inactive: SeededOrderValidationProduct;
  seededOrderId: string;
};

function toSeeded(
  created: Record<string, unknown>,
  fallback: ProductPayload
): SeededOrderValidationProduct {
  return {
    id: String(created._id || created.id),
    name: String(created.name ?? fallback.name),
    price: Number(created.price ?? fallback.price),
    moq: Number(created.moq ?? fallback.moq ?? 1),
    stock: Number(created.stock ?? fallback.stock ?? 0),
  };
}

export function buildValidShippingAddress(
  overrides: Partial<Record<string, string>> = {}
): Record<string, string> {
  return {
    name: 'Orders Validation Vendor',
    phone: '9000000101',
    addressLine: '123 Certification Street',
    city: 'Hyderabad',
    state: 'Telangana',
    pincode: '500001',
    ...overrides,
  };
}

export function buildOrderBody(
  overrides: Record<string, unknown> = {},
  addressOverrides: Partial<Record<string, string>> = {}
): Record<string, unknown> {
  return {
    paymentMethod: 'COD',
    shippingAddress: buildValidShippingAddress(addressOverrides),
    idempotencyKey: `ov-ord-${Date.now()}-${Math.floor(Math.random() * 100000)}`,
    ...overrides,
  };
}

export async function seedOrdersValidationData(
  adminSession: ApiSession,
  vendorSession: ApiSession
): Promise<OrdersValidationSeed> {
  clearValidationRateLimits();
  const categoryId = await getFirstCategoryId(adminSession);

  const mk = async (prefix: string, payload: ProductPayload) => {
    const created = (await createProductApi(adminSession, {
      ...payload,
      name: uniqueProductName(prefix),
    })) as Record<string, unknown>;
    return toSeeded(created, payload);
  };

  const standard = await mk('ov-ord-std', {
    name: 'std',
    price: 100,
    categoryId,
    stock: 200,
    moq: 1,
  });
  const second = await mk('ov-ord-2', {
    name: 'second',
    price: 110,
    categoryId,
    stock: 200,
    moq: 1,
  });
  const oos = await mk('ov-ord-oos', {
    name: 'oos',
    price: 50,
    categoryId,
    stock: 0,
    moq: 1,
  });
  const moq5 = await mk('ov-ord-moq5', {
    name: 'moq5',
    price: 60,
    categoryId,
    stock: 50,
    moq: 5,
    minOrderQty: 5,
  });
  const lowStock = await mk('ov-ord-low', {
    name: 'low',
    price: 70,
    categoryId,
    stock: 2,
    moq: 1,
  });
  const inactiveCreated = await mk('ov-ord-inact', {
    name: 'inact',
    price: 40,
    categoryId,
    stock: 20,
    moq: 1,
  });
  await patchProductStatusApi(adminSession, inactiveCreated.id, false);

  await clearCartApi(vendorSession);
  await addToCartApi(vendorSession, standard.id, 1);
  const seeded = await placeCodOrderApi(vendorSession, {
    idempotencyKey: `ov-ord-seed-${Date.now()}`,
  });

  return {
    categoryId,
    standard,
    second,
    oos,
    moq5,
    lowStock,
    inactive: { ...inactiveCreated },
    seededOrderId: resolveOrderId(seeded),
  };
}

export async function postOrdersApi(
  session: ApiSession | undefined,
  body: Record<string, unknown> | unknown,
  extraHeaders: Record<string, string> = {}
): Promise<ApiResult> {
  if (!session) {
    return apiJson(undefined, 'POST', '/orders', body);
  }
  const headers = { ...authHeaders(session), ...extraHeaders };
  try {
    const response = await apiClient.post('/orders', body, {
      headers,
      validateStatus: () => true,
    });
    return {
      status: response.status,
      body: (response.data as Record<string, unknown>) ?? {},
    };
  } catch (err: unknown) {
    const axiosErr = err as { response?: { status?: number; data?: Record<string, unknown> } };
    return {
      status: axiosErr.response?.status ?? 500,
      body: axiosErr.response?.data ?? { message: String(err) },
    };
  }
}

export async function getOrderValidationApi(
  session: ApiSession,
  orderId: string
): Promise<ApiResult> {
  return apiJson(session, 'GET', `/orders/${orderId}`);
}

export async function getOrderInvoiceValidationApi(
  session: ApiSession,
  orderId: string
): Promise<ApiResult> {
  return apiJson(session, 'GET', `/orders/${orderId}/invoice`);
}

export async function patchOrderStatusValidationApi(
  session: ApiSession,
  orderId: string,
  body: Record<string, unknown>
): Promise<ApiResult> {
  return apiJson(session, 'PATCH', `/orders/${orderId}/status`, body);
}

export async function postOrdersRawFetch(
  session: ApiSession,
  options: { body: string; contentType?: string; omitCsrf?: boolean }
): Promise<ApiResult> {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${session.accessToken}`,
  };
  if (!options.omitCsrf) {
    headers['x-csrf-token'] = session.csrfToken;
    headers.Cookie = `csrf-token=${session.csrfToken}`;
  }
  if (options.contentType) {
    headers['Content-Type'] = options.contentType;
  }
  const response = await fetch(`${API_BASE}/orders`, {
    method: 'POST',
    headers,
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

export { authHeaders, apiJson, resolveOrderId };
