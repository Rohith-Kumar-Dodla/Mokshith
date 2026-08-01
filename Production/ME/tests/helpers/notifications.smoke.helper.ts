import { apiClient } from './apiClient';
import { authHeaders, loginApiFresh, type ApiSession } from './auth.api.helper';
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
  placeCodOrderApi,
  resolveOrderId,
} from './order.functional.helper';
import { decodeJwtPayload } from './token.test.helper';

export type NotificationsSmokeProduct = {
  id: string;
  name: string;
};

export type NotificationsSmokeSeed = {
  categoryId: string;
  product: NotificationsSmokeProduct;
  orderId: string;
  shipmentId: string;
  deliveryPartnerId: string;
  /** Vendor notification ids from seed list (unread expected at seed time) */
  vendorNotificationIds: string[];
  orderConfirmedTitle: string;
  orderPlacedTitle: string;
  deliveryAssignedTitle: string;
};

function unwrapData(payload: unknown): Record<string, unknown> {
  if (payload && typeof payload === 'object') {
    const body = payload as { data?: unknown };
    if (body.data && typeof body.data === 'object' && !Array.isArray(body.data)) {
      return body.data as Record<string, unknown>;
    }
    return payload as Record<string, unknown>;
  }
  return {};
}

function unwrapList(payload: unknown): Array<Record<string, unknown>> {
  if (payload && typeof payload === 'object') {
    const body = payload as { data?: unknown };
    if (Array.isArray(body.data)) return body.data as Array<Record<string, unknown>>;
  }
  if (Array.isArray(payload)) return payload as Array<Record<string, unknown>>;
  return [];
}

export function messageOf(payload: unknown): string {
  if (payload && typeof payload === 'object') {
    const msg = (payload as { message?: unknown }).message;
    if (typeof msg === 'string') return msg;
  }
  return JSON.stringify(payload ?? {});
}

export function notificationIdOf(row: Record<string, unknown>): string {
  return String(row._id || row.id || '');
}

export async function getNotificationsRaw(headers: Record<string, string> = {}) {
  return apiClient.get('/notifications', { headers, validateStatus: () => true });
}

export async function patchMarkReadRaw(
  notificationId: string,
  headers: Record<string, string> = {}
) {
  return apiClient.patch(
    `/notifications/${notificationId}/read`,
    {},
    { headers, validateStatus: () => true }
  );
}

export async function patchMarkAllReadRaw(headers: Record<string, string> = {}) {
  return apiClient.patch('/notifications/read-all', {}, { headers, validateStatus: () => true });
}

async function postLogisticsCreateRaw(orderId: string, headers: Record<string, string>) {
  return apiClient.post(`/logistics/${orderId}`, {}, { headers, validateStatus: () => true });
}

async function patchLogisticsAssignRaw(
  shipmentId: string,
  deliveryPartnerId: string,
  headers: Record<string, string>
) {
  return apiClient.patch(
    `/logistics/${shipmentId}/assign`,
    { deliveryPartnerId },
    { headers, validateStatus: () => true }
  );
}

export async function postLogisticsAcceptRaw(
  shipmentId: string,
  headers: Record<string, string> = {}
) {
  return apiClient.post(
    `/logistics/${shipmentId}/accept`,
    {},
    { headers, validateStatus: () => true }
  );
}

/**
 * Seeds notifications via production producers only:
 * - COD place → Order Confirmed + Order Placed (vendor)
 * - Logistics create + assign → Delivery Assigned (vendor, partner, admins)
 */
export async function seedNotificationsSmokeData(vendorSession: ApiSession): Promise<{
  adminSession: ApiSession;
  deliverySession: ApiSession;
  seed: NotificationsSmokeSeed;
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
    name: uniqueProductName('ns-not'),
    price: 150,
    categoryId,
    stock: 40,
    moq: 1,
  });
  const product: NotificationsSmokeProduct = {
    id: String(created._id || created.id),
    name: String(created.name),
  };

  await clearCartApi(vendorSession);
  await addToCartApi(vendorSession, product.id, 1);
  const order = await placeCodOrderApi(vendorSession, {
    idempotencyKey: `ns-not-seed-${Date.now()}`,
  });
  const orderId = resolveOrderId(order);

  const createRes = await postLogisticsCreateRaw(orderId, authHeaders(adminSession));
  if (createRes.status !== 200 && createRes.status !== 201) {
    throw new Error(`Logistics create failed (${createRes.status}): ${messageOf(createRes.data)}`);
  }
  const shipment = unwrapData(createRes.data);
  const shipmentId = String(shipment._id || shipment.id || '');
  if (!shipmentId) {
    throw new Error('Logistics create returned no shipment id');
  }

  const assignRes = await patchLogisticsAssignRaw(
    shipmentId,
    deliveryPartnerId,
    authHeaders(adminSession)
  );
  if (assignRes.status !== 200) {
    throw new Error(`Logistics assign failed (${assignRes.status}): ${messageOf(assignRes.data)}`);
  }

  const listRes = await getNotificationsRaw(authHeaders(vendorSession));
  if (listRes.status !== 200) {
    throw new Error(`GET /notifications failed (${listRes.status}): ${messageOf(listRes.data)}`);
  }
  const list = unwrapList(listRes.data);
  const vendorNotificationIds = list.map(notificationIdOf).filter(Boolean);

  return {
    adminSession,
    deliverySession,
    seed: {
      categoryId,
      product,
      orderId,
      shipmentId,
      deliveryPartnerId,
      vendorNotificationIds,
      orderConfirmedTitle: 'Order Confirmed',
      orderPlacedTitle: 'Order Placed',
      deliveryAssignedTitle: 'Delivery Assigned',
    },
  };
}

export {
  authHeaders,
  clearValidationRateLimits,
  unwrapData,
  unwrapList,
};
