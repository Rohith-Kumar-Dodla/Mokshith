import { apiClient } from './apiClient';
import { authHeaders, loginApi, loginApiFresh, type ApiSession } from './auth.api.helper';
import {
  createProductApi,
  getAdminSession,
  getFirstCategoryId,
} from './product.api.helper';
import {
  getDeliveryCredentials,
  uniqueProductName,
} from './product.credentials';
import { addToCartApi, clearCartApi } from './cart.api.helper';
import { clearValidationRateLimits } from './cart.validation.helper';
import {
  getOrderByIdApi,
  placeCodOrderApi,
  resolveOrderId,
} from './order.functional.helper';
import { decodeJwtPayload } from './token.test.helper';

export type LogisticsSmokeProduct = {
  id: string;
  name: string;
};

export type LogisticsSmokeSeed = {
  categoryId: string;
  product: LogisticsSmokeProduct;
  orderId: string;
  shipmentId: string;
  trackingNumber: string;
  deliveryPartnerId: string;
};

function unwrapData(payload: unknown): Record<string, unknown> {
  if (payload && typeof payload === 'object') {
    const body = payload as { data?: unknown };
    if (body.data && typeof body.data === 'object') {
      return body.data as Record<string, unknown>;
    }
    return payload as Record<string, unknown>;
  }
  return {};
}

function unwrapList(payload: unknown): Array<Record<string, unknown>> {
  const data = unwrapData(payload);
  if (Array.isArray(data)) return data as Array<Record<string, unknown>>;
  if (Array.isArray((data as { shipments?: unknown }).shipments)) {
    return (data as { shipments: Array<Record<string, unknown>> }).shipments;
  }
  if (Array.isArray((payload as { data?: unknown })?.data)) {
    return (payload as { data: Array<Record<string, unknown>> }).data;
  }
  return [];
}

export function messageOf(payload: unknown): string {
  if (payload && typeof payload === 'object') {
    const msg = (payload as { message?: unknown }).message;
    if (typeof msg === 'string') return msg;
  }
  return JSON.stringify(payload ?? {});
}

export function resolveShipmentId(payload: Record<string, unknown>): string {
  return String(payload._id || payload.id || '');
}

export async function postLogisticsCreateRaw(
  orderId: string,
  headers: Record<string, string> = {}
) {
  return apiClient.post(`/logistics/${orderId}`, {}, { headers, validateStatus: () => true });
}

export async function patchLogisticsAssignRaw(
  shipmentId: string,
  deliveryPartnerId: string,
  headers: Record<string, string> = {}
) {
  return apiClient.patch(
    `/logistics/${shipmentId}/assign`,
    { deliveryPartnerId },
    { headers, validateStatus: () => true }
  );
}

export async function getLogisticsQueueRaw(headers: Record<string, string> = {}) {
  return apiClient.get('/logistics/delivery-queue', { headers, validateStatus: () => true });
}

export async function getMyAssignmentsRaw(headers: Record<string, string> = {}) {
  return apiClient.get('/logistics/my-assignments', { headers, validateStatus: () => true });
}

export async function getLogisticsByIdRaw(
  shipmentId: string,
  headers: Record<string, string> = {}
) {
  return apiClient.get(`/logistics/${shipmentId}`, { headers, validateStatus: () => true });
}

export async function postLogisticsAcceptRaw(
  shipmentId: string,
  headers: Record<string, string> = {}
) {
  return apiClient.post(`/logistics/${shipmentId}/accept`, {}, { headers, validateStatus: () => true });
}

export async function postLogisticsPickRaw(
  shipmentId: string,
  headers: Record<string, string> = {}
) {
  return apiClient.post(`/logistics/${shipmentId}/pick`, {}, { headers, validateStatus: () => true });
}

export async function postLogisticsStartRaw(
  shipmentId: string,
  headers: Record<string, string> = {}
) {
  return apiClient.post(`/logistics/${shipmentId}/start`, {}, { headers, validateStatus: () => true });
}

export async function postLogisticsDeliveredRaw(
  shipmentId: string,
  headers: Record<string, string> = {}
) {
  return apiClient.post(
    `/logistics/${shipmentId}/delivered`,
    {},
    { headers, validateStatus: () => true }
  );
}

export async function postLogisticsCompleteRaw(
  shipmentId: string,
  body: Record<string, unknown> = {},
  headers: Record<string, string> = {}
) {
  return apiClient.post(`/logistics/${shipmentId}/complete`, body, {
    headers,
    validateStatus: () => true,
  });
}

export async function seedLogisticsSmokeData(vendorSession: ApiSession): Promise<{
  adminSession: ApiSession;
  deliverySession: ApiSession;
  seed: LogisticsSmokeSeed;
}> {
  clearValidationRateLimits();
  const adminSession = await getAdminSession();
  const deliveryCreds = getDeliveryCredentials(1);
  const deliverySession = await loginApiFresh(deliveryCreds.mobile, deliveryCreds.password);
  const deliveryPartnerId = String(
    decodeJwtPayload(deliverySession.accessToken).id ||
      deliverySession.user?._id ||
      deliverySession.user?.id ||
      ''
  );
  if (!deliveryPartnerId) {
    throw new Error('Unable to resolve seeded delivery partner id');
  }

  const categoryId = await getFirstCategoryId(adminSession);
  const created = await createProductApi(adminSession, {
    name: uniqueProductName('ls-log'),
    price: 160,
    categoryId,
    stock: 40,
    moq: 1,
  });
  const product: LogisticsSmokeProduct = {
    id: String(created._id || created.id),
    name: String(created.name),
  };

  await clearCartApi(vendorSession);
  await addToCartApi(vendorSession, product.id, 1);
  const order = await placeCodOrderApi(vendorSession, {
    idempotencyKey: `ls-log-seed-${Date.now()}`,
  });
  const orderId = resolveOrderId(order);

  const createRes = await postLogisticsCreateRaw(orderId, authHeaders(adminSession));
  if (createRes.status !== 200 && createRes.status !== 201) {
    throw new Error(`Logistics create failed (${createRes.status}): ${messageOf(createRes.data)}`);
  }
  const shipment = unwrapData(createRes.data);
  const shipmentId = resolveShipmentId(shipment);
  const trackingNumber = String(shipment.trackingNumber || '');

  const assignRes = await patchLogisticsAssignRaw(
    shipmentId,
    deliveryPartnerId,
    authHeaders(adminSession)
  );
  if (assignRes.status !== 200) {
    throw new Error(`Logistics assign failed (${assignRes.status}): ${messageOf(assignRes.data)}`);
  }

  return {
    adminSession,
    deliverySession,
    seed: {
      categoryId,
      product,
      orderId,
      shipmentId,
      trackingNumber,
      deliveryPartnerId,
    },
  };
}

export {
  authHeaders,
  addToCartApi,
  clearCartApi,
  clearValidationRateLimits,
  getOrderByIdApi,
  loginApi,
  resolveOrderId,
  unwrapData,
  unwrapList,
};
