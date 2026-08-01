import { apiClient } from './apiClient';
import { authHeaders, type ApiSession } from './auth.api.helper';
import { resolveRefId, listInventoryApi } from './product.api.helper';
import { createOrderApi, buildShippingAddress } from './cart.functional.helper';

export { createOrderApi, buildShippingAddress };

export type OrderResponse = {
  _id?: string;
  id?: string;
  status?: string;
  paymentMethod?: string;
  paymentStatus?: string;
  totalAmount?: number;
  items?: Array<{
    productId?: string | { _id?: string; id?: string };
    quantity?: number;
    name?: string;
  }>;
};

function unwrapData<T>(response: { data?: { data?: T; success?: boolean } & T }): T {
  const body = response.data as { data?: T } & T;
  return (body?.data ?? body) as T;
}

export function resolveOrderId(order: OrderResponse | null | undefined): string {
  return String(order?._id || order?.id || '');
}

export async function getOrdersApi(session: ApiSession): Promise<OrderResponse[]> {
  const response = await apiClient.get('/orders', { headers: authHeaders(session) });
  const data = unwrapData<OrderResponse[] | { orders?: OrderResponse[] }>(response);
  if (Array.isArray(data)) return data;
  if (data && Array.isArray((data as { orders?: OrderResponse[] }).orders)) {
    return (data as { orders: OrderResponse[] }).orders;
  }
  return [];
}

export async function getOrderByIdApi(
  session: ApiSession,
  orderId: string
): Promise<OrderResponse | null> {
  const response = await apiClient.get(`/orders/${orderId}`, {
    headers: authHeaders(session),
  });
  return unwrapData<OrderResponse | null>(response);
}

export async function placeCodOrderApi(
  session: ApiSession,
  options?: { idempotencyKey?: string }
): Promise<OrderResponse> {
  const order = await createOrderApi(session, {
    paymentMethod: 'COD',
    shippingAddress: buildShippingAddress(),
    idempotencyKey: options?.idempotencyKey ?? `ps-ord-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
  });
  return order as OrderResponse;
}

export async function getInventoryStockForProduct(
  adminSession: ApiSession,
  productId: string
): Promise<number> {
  const inventory = await listInventoryApi(adminSession);
  const rows = Array.isArray(inventory)
    ? inventory
    : ((inventory as { data?: unknown[] })?.data ?? []);

  let total = 0;
  for (const row of rows as Array<{ productId?: unknown; stock?: number }>) {
    if (resolveRefId(row.productId as string | { _id?: string; id?: string }) === productId) {
      total += Number(row.stock ?? 0);
    }
  }
  return total;
}

export async function getOrdersRaw(headers: Record<string, string> = {}) {
  return apiClient.get('/orders', { headers, validateStatus: () => true });
}

export async function postOrdersRaw(
  body: Record<string, unknown>,
  headers: Record<string, string> = {}
) {
  return apiClient.post('/orders', body, { headers, validateStatus: () => true });
}
