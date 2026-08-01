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
import {
  getLogisticsByIdRaw,
  getLogisticsQueueRaw,
  getMyAssignmentsRaw,
  messageOf,
  patchLogisticsAssignRaw,
  postLogisticsAcceptRaw,
  postLogisticsCompleteRaw,
  postLogisticsCreateRaw,
  postLogisticsDeliveredRaw,
  postLogisticsPickRaw,
  postLogisticsStartRaw,
  resolveShipmentId,
  unwrapData,
  unwrapList,
} from './logistics.smoke.helper';

export type LogisticsFunctionalProduct = {
  id: string;
  name: string;
};

export type LogisticsShipmentRef = {
  orderId: string;
  shipmentId: string;
  trackingNumber: string;
  deliveryPartnerId: string;
};

export type LogisticsFunctionalSeed = {
  categoryId: string;
  product: LogisticsFunctionalProduct;
  /** Stable ASSIGNED shipment for UI / search / ownership tests */
  ui: LogisticsShipmentRef;
};

function partnerIdFromSession(session: ApiSession): string {
  return String(
    decodeJwtPayload(session.accessToken).id ||
      session.user?._id ||
      session.user?.id ||
      ''
  );
}

export function linkedShipmentId(order: Record<string, unknown>): string {
  const shipmentId = order.shipmentId;
  if (shipmentId && typeof shipmentId === 'object') {
    return String(
      (shipmentId as { _id?: unknown; id?: unknown })._id ||
        (shipmentId as { id?: unknown }).id ||
        ''
    );
  }
  return String(shipmentId || (order.shipment as { _id?: unknown })?._id || '');
}

export async function patchLogisticsReassignRaw(
  shipmentId: string,
  deliveryPartnerId: string,
  headers: Record<string, string> = {}
) {
  return apiClient.patch(
    `/logistics/${shipmentId}/reassign`,
    { deliveryPartnerId },
    { headers, validateStatus: () => true }
  );
}

export async function getLogisticsHistoryRaw(headers: Record<string, string> = {}) {
  return apiClient.get('/logistics/history', { headers, validateStatus: () => true });
}

export async function getLogisticsAnalyticsRaw(headers: Record<string, string> = {}) {
  return apiClient.get('/logistics/analytics', { headers, validateStatus: () => true });
}

export async function getAllLogisticsRaw(headers: Record<string, string> = {}) {
  return apiClient.get('/logistics', { headers, validateStatus: () => true });
}

export async function postLogisticsLocationRaw(
  shipmentId: string,
  location: { lat: number; lng: number },
  headers: Record<string, string> = {}
) {
  return apiClient.post(`/logistics/${shipmentId}/location`, location, {
    headers,
    validateStatus: () => true,
  });
}

export async function createCodOrderForLogistics(
  vendorSession: ApiSession,
  productId: string,
  label: string
): Promise<string> {
  await clearCartApi(vendorSession);
  await addToCartApi(vendorSession, productId, 1);
  const order = await placeCodOrderApi(vendorSession, {
    idempotencyKey: `lf-log-${label}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  });
  return resolveOrderId(order);
}

export async function createPendingShipment(
  adminSession: ApiSession,
  vendorSession: ApiSession,
  productId: string,
  label: string
): Promise<LogisticsShipmentRef> {
  const orderId = await createCodOrderForLogistics(vendorSession, productId, label);
  const createRes = await postLogisticsCreateRaw(orderId, authHeaders(adminSession));
  if (createRes.status !== 200 && createRes.status !== 201) {
    throw new Error(`Create shipment failed (${createRes.status}): ${messageOf(createRes.data)}`);
  }
  const shipment = unwrapData(createRes.data);
  return {
    orderId,
    shipmentId: resolveShipmentId(shipment),
    trackingNumber: String(shipment.trackingNumber || ''),
    deliveryPartnerId: '',
  };
}

export async function createAssignedShipment(
  adminSession: ApiSession,
  vendorSession: ApiSession,
  productId: string,
  deliveryPartnerId: string,
  label: string
): Promise<LogisticsShipmentRef> {
  const pending = await createPendingShipment(adminSession, vendorSession, productId, label);
  const assignRes = await patchLogisticsAssignRaw(
    pending.shipmentId,
    deliveryPartnerId,
    authHeaders(adminSession)
  );
  if (assignRes.status !== 200) {
    throw new Error(`Assign failed (${assignRes.status}): ${messageOf(assignRes.data)}`);
  }
  return {
    ...pending,
    deliveryPartnerId,
  };
}

export async function advanceLifecycleTo(
  shipmentId: string,
  deliverySession: ApiSession,
  target:
    | 'ACCEPTED'
    | 'PICKED'
    | 'OUT_FOR_DELIVERY'
    | 'DELIVERED'
    | 'COMPLETED'
): Promise<Record<string, unknown>> {
  const headers = authHeaders(deliverySession);
  const steps: Array<{
    status: string;
    run: () => Promise<{ status: number; data: unknown }>;
  }> = [
    { status: 'ACCEPTED', run: () => postLogisticsAcceptRaw(shipmentId, headers) },
    { status: 'PICKED', run: () => postLogisticsPickRaw(shipmentId, headers) },
    { status: 'OUT_FOR_DELIVERY', run: () => postLogisticsStartRaw(shipmentId, headers) },
    { status: 'DELIVERED', run: () => postLogisticsDeliveredRaw(shipmentId, headers) },
    {
      status: 'COMPLETED',
      run: () => postLogisticsCompleteRaw(shipmentId, { notes: 'lf-log advance' }, headers),
    },
  ];

  let last: Record<string, unknown> = {};
  for (const step of steps) {
    const response = await step.run();
    if (response.status !== 200) {
      throw new Error(
        `Advance to ${step.status} failed (${response.status}): ${messageOf(response.data)}`
      );
    }
    last = unwrapData(response.data);
    if (step.status === target) break;
  }
  return last;
}

export async function seedLogisticsFunctionalData(vendorSession: ApiSession): Promise<{
  adminSession: ApiSession;
  deliverySession: ApiSession;
  delivery2Session: ApiSession;
  seed: LogisticsFunctionalSeed;
}> {
  clearValidationRateLimits();
  const adminSession = await getAdminSession();
  const deliveryCreds = getDeliveryCredentials(1);
  const delivery2Creds = getDeliveryCredentials(2);
  const deliverySession = await loginApiFresh(deliveryCreds.mobile, deliveryCreds.password);
  const delivery2Session = await loginApiFresh(delivery2Creds.mobile, delivery2Creds.password);
  const deliveryPartnerId = partnerIdFromSession(deliverySession);
  const delivery2PartnerId = partnerIdFromSession(delivery2Session);
  if (!deliveryPartnerId || !delivery2PartnerId) {
    throw new Error('Unable to resolve delivery partner ids for functional seed');
  }

  const categoryId = await getFirstCategoryId(adminSession);
  const created = await createProductApi(adminSession, {
    name: uniqueProductName('lf-log'),
    price: 175,
    categoryId,
    stock: 120,
    moq: 1,
  });
  const product: LogisticsFunctionalProduct = {
    id: String(created._id || created.id),
    name: String(created.name),
  };

  const ui = await createAssignedShipment(
    adminSession,
    vendorSession,
    product.id,
    deliveryPartnerId,
    'ui'
  );

  return {
    adminSession,
    deliverySession,
    delivery2Session,
    seed: {
      categoryId,
      product,
      ui: {
        ...ui,
        deliveryPartnerId,
      },
    },
  };
}

export {
  authHeaders,
  addToCartApi,
  clearCartApi,
  clearValidationRateLimits,
  getLogisticsByIdRaw,
  getLogisticsQueueRaw,
  getMyAssignmentsRaw,
  getOrderByIdApi,
  loginApi,
  messageOf,
  partnerIdFromSession,
  patchLogisticsAssignRaw,
  postLogisticsAcceptRaw,
  postLogisticsCompleteRaw,
  postLogisticsCreateRaw,
  postLogisticsDeliveredRaw,
  postLogisticsPickRaw,
  postLogisticsStartRaw,
  resolveOrderId,
  resolveShipmentId,
  unwrapData,
  unwrapList,
};
