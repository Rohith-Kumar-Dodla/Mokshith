import { authHeaders, type ApiSession } from './auth.api.helper';
import {
  clearValidationRateLimits,
  getNotificationsRaw,
  messageOf,
  notificationIdOf,
  patchMarkAllReadRaw,
  patchMarkReadRaw,
  seedNotificationsSmokeData,
  unwrapData,
  unwrapList,
  type NotificationsSmokeSeed,
} from './notifications.smoke.helper';
import {
  advanceLifecycleTo,
  createAssignedShipment,
  createPendingShipment,
} from './logistics.functional.helper';
import {
  postLogisticsAcceptRaw,
  postLogisticsCompleteRaw,
  postLogisticsDeliveredRaw,
  postLogisticsPickRaw,
  postLogisticsStartRaw,
} from './logistics.smoke.helper';
import {
  placeOnlineOrderApi,
  resolveOrderId,
} from './order.functional.helper';
import { addToCartApi, clearCartApi } from './cart.api.helper';

export type NotificationsFunctionalSeed = NotificationsSmokeSeed & {
  /** Separate ASSIGNED shipment reserved for lifecycle fan-out tests */
  lifecycleShipmentId: string;
  lifecycleOrderId: string;
  /** ONLINE order — Order Initiated producer */
  onlineOrderId: string;
  /** PENDING-only shipment (create without assign) — no status notification */
  pendingOnlyOrderId: string;
  pendingOnlyShipmentId: string;
};

export async function seedNotificationsFunctionalData(vendorSession: ApiSession): Promise<{
  adminSession: ApiSession;
  deliverySession: ApiSession;
  seed: NotificationsFunctionalSeed;
}> {
  clearValidationRateLimits();
  const seeded = await seedNotificationsSmokeData(vendorSession);
  const { adminSession, deliverySession } = seeded;
  const productId = seeded.seed.product.id;
  const partnerId = seeded.seed.deliveryPartnerId;

  const lifecycle = await createAssignedShipment(
    adminSession,
    vendorSession,
    productId,
    partnerId,
    'nf-lifecycle'
  );

  await clearCartApi(vendorSession);
  await addToCartApi(vendorSession, productId, 1);
  const online = await placeOnlineOrderApi(vendorSession, {
    idempotencyKey: `nf-not-online-${Date.now()}`,
  });
  const onlineOrderId = resolveOrderId(online);

  const pendingOnly = await createPendingShipment(
    adminSession,
    vendorSession,
    productId,
    'nf-pending-only'
  );

  return {
    adminSession,
    deliverySession,
    seed: {
      ...seeded.seed,
      lifecycleShipmentId: lifecycle.shipmentId,
      lifecycleOrderId: lifecycle.orderId,
      onlineOrderId,
      pendingOnlyOrderId: pendingOnly.orderId,
      pendingOnlyShipmentId: pendingOnly.shipmentId,
    },
  };
}

export function titlesOf(list: Array<Record<string, unknown>>): string[] {
  return list.map((n) => String(n.title || ''));
}

export function findByTitle(
  list: Array<Record<string, unknown>>,
  title: string
): Record<string, unknown> | undefined {
  return list.find((n) => String(n.title) === title);
}

export function unreadCountOf(list: Array<Record<string, unknown>>): number {
  return list.filter((n) => n.isRead !== true).length;
}

export async function listNotifications(session: ApiSession) {
  const response = await getNotificationsRaw(authHeaders(session));
  return {
    status: response.status,
    list: unwrapList(response.data),
    body: response.data,
  };
}

export {
  authHeaders,
  advanceLifecycleTo,
  clearValidationRateLimits,
  getNotificationsRaw,
  messageOf,
  notificationIdOf,
  patchMarkAllReadRaw,
  patchMarkReadRaw,
  postLogisticsAcceptRaw,
  postLogisticsCompleteRaw,
  postLogisticsDeliveredRaw,
  postLogisticsPickRaw,
  postLogisticsStartRaw,
  unwrapData,
  unwrapList,
};
