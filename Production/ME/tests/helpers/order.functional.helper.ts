import { apiClient } from './apiClient';
import { authHeaders, type ApiSession } from './auth.api.helper';
import {
  createProductApi,
  getFirstCategoryId,
  resolveRefId,
  listInventoryApi,
} from './product.api.helper';
import { uniqueProductName } from './product.credentials';
import { createOrderApi, buildShippingAddress } from './cart.functional.helper';
import { clearValidationRateLimits } from './cart.validation.helper';
import { addToCartApi, clearCartApi } from './cart.api.helper';

export { createOrderApi, buildShippingAddress, clearValidationRateLimits };

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
    price?: number;
    finalPrice?: number;
  }>;
  shippingAddress?: Record<string, string>;
  createdAt?: string;
};

export type SeededOrderProduct = {
  id: string;
  name: string;
  price: number;
  moq: number;
  stock: number;
};

export type OrdersFunctionalSeed = {
  categoryId: string;
  standard: SeededOrderProduct;
  second: SeededOrderProduct;
  third: SeededOrderProduct;
  inventory: SeededOrderProduct;
  codOrderId: string;
  secondOrderId: string;
  onlineOrderId: string;
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
    idempotencyKey:
      options?.idempotencyKey ??
      `pf-ord-cod-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
  });
  return order as OrderResponse;
}

export async function placeOnlineOrderApi(
  session: ApiSession,
  options?: { idempotencyKey?: string }
): Promise<OrderResponse> {
  const order = await createOrderApi(session, {
    paymentMethod: 'ONLINE',
    shippingAddress: buildShippingAddress(),
    idempotencyKey:
      options?.idempotencyKey ??
      `pf-ord-online-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
  });
  return order as OrderResponse;
}

export async function downloadInvoiceApi(session: ApiSession, orderId: string) {
  return apiClient.get(`/orders/${orderId}/invoice`, {
    headers: authHeaders(session),
    responseType: 'arraybuffer',
    validateStatus: () => true,
  });
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

async function mkProduct(
  adminSession: ApiSession,
  categoryId: string,
  prefix: string,
  price: number,
  stock: number
): Promise<SeededOrderProduct> {
  const created = await createProductApi(adminSession, {
    name: uniqueProductName(prefix),
    price,
    categoryId,
    stock,
    moq: 1,
  });
  return {
    id: String(created._id || created.id),
    name: String(created.name),
    price,
    moq: 1,
    stock,
  };
}

export async function seedOrdersFunctionalData(
  adminSession: ApiSession,
  vendorSession: ApiSession
): Promise<OrdersFunctionalSeed> {
  clearValidationRateLimits();
  const categoryId = await getFirstCategoryId(adminSession);

  const standard = await mkProduct(adminSession, categoryId, 'pf-ord-std', 100, 200);
  const second = await mkProduct(adminSession, categoryId, 'pf-ord-2', 150, 200);
  const third = await mkProduct(adminSession, categoryId, 'pf-ord-3', 200, 200);
  const inventory = await mkProduct(adminSession, categoryId, 'pf-ord-inv', 80, 80);

  await clearCartApi(vendorSession);
  await addToCartApi(vendorSession, standard.id, 1);
  const codOrder = await placeCodOrderApi(vendorSession);
  const codOrderId = resolveOrderId(codOrder);

  await clearCartApi(vendorSession);
  await addToCartApi(vendorSession, second.id, 1);
  const secondOrder = await placeCodOrderApi(vendorSession);
  const secondOrderId = resolveOrderId(secondOrder);

  await clearCartApi(vendorSession);
  await addToCartApi(vendorSession, third.id, 2);
  const onlineOrder = await placeOnlineOrderApi(vendorSession);
  const onlineOrderId = resolveOrderId(onlineOrder);

  return {
    categoryId,
    standard,
    second,
    third,
    inventory,
    codOrderId,
    secondOrderId,
    onlineOrderId,
  };
}

/** Expected COD/order total for price*qty with 18% GST and no bulk discount (qty < 5). */
export function expectedOrderTotalWithGst(unitPrice: number, quantity: number): number {
  const subtotal = unitPrice * quantity;
  return Number((subtotal + subtotal * 0.18).toFixed(2));
}
