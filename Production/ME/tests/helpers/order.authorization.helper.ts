import fs from 'fs';
import path from 'path';
import { apiClient } from './apiClient';
import { authHeaders, loginApiFresh, type ApiSession } from './auth.api.helper';
import { getVendorCredentials, uniqueProductName } from './product.credentials';
import {
  createProductApi,
  getAdminSession,
  getFirstCategoryId,
} from './product.api.helper';
import { addToCartApi, clearCartApi } from './cart.api.helper';
import { clearValidationRateLimits } from './cart.validation.helper';
import {
  buildShippingAddress,
  placeCodOrderApi,
  resolveOrderId,
  type OrderResponse,
} from './order.functional.helper';

export type AuthSeedProduct = {
  id: string;
  name: string;
  price: number;
};

export type OrdersAuthorizationSeed = {
  product: AuthSeedProduct;
  vendor1OrderId: string;
  vendor2OrderId: string;
};

export async function seedOrdersAuthorizationData(
  vendor1Session: ApiSession,
  vendor2Session: ApiSession
): Promise<OrdersAuthorizationSeed> {
  clearValidationRateLimits();
  const adminSession = await getAdminSession();
  const categoryId = await getFirstCategoryId(adminSession);
  const created = await createProductApi(adminSession, {
    name: uniqueProductName('oa-ord'),
    price: 120,
    categoryId,
    stock: 500,
    moq: 1,
  });
  const product: AuthSeedProduct = {
    id: String(created._id || created.id),
    name: String(created.name),
    price: 120,
  };

  await clearCartApi(vendor1Session);
  await addToCartApi(vendor1Session, product.id, 1);
  const vendor1Order = await placeCodOrderApi(vendor1Session, {
    idempotencyKey: `oa-ord-v1-${Date.now()}`,
  });

  await clearCartApi(vendor2Session);
  await addToCartApi(vendor2Session, product.id, 1);
  const vendor2Order = await placeCodOrderApi(vendor2Session, {
    idempotencyKey: `oa-ord-v2-${Date.now()}`,
  });

  return {
    product,
    vendor1OrderId: resolveOrderId(vendor1Order),
    vendor2OrderId: resolveOrderId(vendor2Order),
  };
}

export async function getOrdersRaw(headers: Record<string, string> = {}) {
  return apiClient.get('/orders', { headers, validateStatus: () => true });
}

export async function getOrderByIdRaw(
  orderId: string,
  headers: Record<string, string> = {}
) {
  return apiClient.get(`/orders/${orderId}`, { headers, validateStatus: () => true });
}

export async function postOrdersRaw(
  body: Record<string, unknown>,
  headers: Record<string, string> = {}
) {
  return apiClient.post('/orders', body, { headers, validateStatus: () => true });
}

export async function getOrderInvoiceRaw(
  orderId: string,
  headers: Record<string, string> = {}
) {
  return apiClient.get(`/orders/${orderId}/invoice`, {
    headers,
    responseType: 'arraybuffer',
    validateStatus: () => true,
  });
}

export async function postOrderFailRaw(
  orderId: string,
  headers: Record<string, string> = {}
) {
  return apiClient.post(`/orders/${orderId}/fail`, {}, { headers, validateStatus: () => true });
}

export async function patchOrderStatusRaw(
  orderId: string,
  body: Record<string, unknown>,
  headers: Record<string, string> = {}
) {
  return apiClient.patch(`/orders/${orderId}/status`, body, {
    headers,
    validateStatus: () => true,
  });
}

export async function getInvoiceByOrderIdRaw(
  orderId: string,
  headers: Record<string, string> = {}
) {
  return apiClient.get(`/invoices/${orderId}`, { headers, validateStatus: () => true });
}

export async function postGenerateInvoiceRaw(
  orderId: string,
  headers: Record<string, string> = {}
) {
  return apiClient.post(`/invoices/${orderId}`, {}, { headers, validateStatus: () => true });
}

export function unwrapOrdersList(payload: unknown): OrderResponse[] {
  if (Array.isArray(payload)) return payload as OrderResponse[];
  if (payload && typeof payload === 'object') {
    const data = (payload as { data?: unknown; orders?: OrderResponse[] }).data ?? payload;
    if (Array.isArray(data)) return data as OrderResponse[];
    if (data && typeof data === 'object' && Array.isArray((data as { orders?: OrderResponse[] }).orders)) {
      return (data as { orders: OrderResponse[] }).orders;
    }
  }
  return [];
}

export function ordersContainId(orders: OrderResponse[], orderId: string): boolean {
  return orders.some((order) => resolveOrderId(order) === orderId);
}

export function readBackendFile(relativePath: string): string {
  const filePath = path.resolve(process.cwd(), '..', 'b2b-backend', relativePath);
  return fs.readFileSync(filePath, 'utf8');
}

export function bearerOnly(accessToken: string) {
  return { Authorization: `Bearer ${accessToken}` };
}

export function authBearerOnly(session: ApiSession) {
  return { Authorization: `Bearer ${session.accessToken}` };
}

export async function refreshVendorApiSession(): Promise<ApiSession> {
  const creds = getVendorCredentials(1);
  return loginApiFresh(creds.mobile, creds.password);
}

export { authHeaders, buildShippingAddress, clearValidationRateLimits, resolveOrderId };
