import { execSync } from 'child_process';
import path from 'path';
import { authHeaders, loginApiFresh, type ApiSession } from './auth.api.helper';
import {
  getAdminCredentials,
  getDeliveryCredentials,
  getVendorCredentials,
} from './product.credentials';
import {
  API_BASE,
  apiJson,
  messageOf,
  type ApiResult,
} from './validation/product.validation.helper';
import {
  advanceLifecycleTo,
  createAssignedShipment,
  createPendingShipment,
  partnerIdFromSession,
  seedLogisticsFunctionalData,
  type LogisticsFunctionalSeed,
  type LogisticsShipmentRef,
} from './logistics.functional.helper';
import { decodeJwtPayload } from './token.test.helper';

export { messageOf };
export { INVALID_OBJECT_ID, NONEXISTENT_OBJECT_ID } from './validation/product.validation.helper';

export type LogisticsValidationSeed = LogisticsFunctionalSeed & {
  /** ASSIGNED to DP1 — used for transition / ownership-adjacent validation */
  assigned: LogisticsShipmentRef;
  /** PENDING — used for assign Joi/service cases */
  pending: LogisticsShipmentRef;
  /** Will be advanced to DELIVERED then COMPLETED for terminal assign blocks */
  terminal: LogisticsShipmentRef;
  deliveryPartnerId: string;
  delivery2PartnerId: string;
  vendorUserId: string;
};

export function clearLogisticsValidationRateLimits(): void {
  try {
    const script = path.resolve(process.cwd(), '..', 'b2b-backend', 'scripts', 'clearAuthRateLimits.js');
    execSync(`node "${script}"`, { stdio: 'ignore' });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.warn('Warning: failed to clear logistics validation rate limits:', message);
  }
}

export async function seedLogisticsValidationData(vendorSession: ApiSession): Promise<{
  adminSession: ApiSession;
  deliverySession: ApiSession;
  delivery2Session: ApiSession;
  seed: LogisticsValidationSeed;
}> {
  clearLogisticsValidationRateLimits();
  const seeded = await seedLogisticsFunctionalData(vendorSession);
  const dp1 = partnerIdFromSession(seeded.deliverySession);
  const dp2 = partnerIdFromSession(seeded.delivery2Session);
  const vendorUserId = String(
    decodeJwtPayload(vendorSession.accessToken).id ||
      vendorSession.user?._id ||
      vendorSession.user?.id ||
      ''
  );

  const pending = await createPendingShipment(
    seeded.adminSession,
    vendorSession,
    seeded.seed.product.id,
    'val-pending'
  );
  const assigned = await createAssignedShipment(
    seeded.adminSession,
    vendorSession,
    seeded.seed.product.id,
    dp1,
    'val-assigned'
  );
  const terminal = await createAssignedShipment(
    seeded.adminSession,
    vendorSession,
    seeded.seed.product.id,
    dp1,
    'val-terminal'
  );

  return {
    adminSession: seeded.adminSession,
    deliverySession: seeded.deliverySession,
    delivery2Session: seeded.delivery2Session,
    seed: {
      ...seeded.seed,
      assigned: { ...assigned, deliveryPartnerId: dp1 },
      pending,
      terminal: { ...terminal, deliveryPartnerId: dp1 },
      deliveryPartnerId: dp1,
      delivery2PartnerId: dp2,
      vendorUserId,
    },
  };
}

export async function patchAssignApi(
  session: ApiSession | undefined,
  shipmentId: string,
  body: unknown
): Promise<ApiResult> {
  return apiJson(session, 'PATCH', `/logistics/${shipmentId}/assign`, body);
}

export async function patchReassignApi(
  session: ApiSession | undefined,
  shipmentId: string,
  body: unknown
): Promise<ApiResult> {
  return apiJson(session, 'PATCH', `/logistics/${shipmentId}/reassign`, body);
}

export async function postCreateShipmentApi(
  session: ApiSession | undefined,
  orderId: string,
  body: unknown = {}
): Promise<ApiResult> {
  return apiJson(session, 'POST', `/logistics/${orderId}`, body);
}

export async function postAcceptApi(
  session: ApiSession | undefined,
  shipmentId: string,
  body: unknown = {}
): Promise<ApiResult> {
  return apiJson(session, 'POST', `/logistics/${shipmentId}/accept`, body);
}

export async function postPickApi(
  session: ApiSession | undefined,
  shipmentId: string,
  body: unknown = {}
): Promise<ApiResult> {
  return apiJson(session, 'POST', `/logistics/${shipmentId}/pick`, body);
}

export async function postStartApi(
  session: ApiSession | undefined,
  shipmentId: string,
  body: unknown = {}
): Promise<ApiResult> {
  return apiJson(session, 'POST', `/logistics/${shipmentId}/start`, body);
}

export async function postDeliveredApi(
  session: ApiSession | undefined,
  shipmentId: string,
  body: unknown = {}
): Promise<ApiResult> {
  return apiJson(session, 'POST', `/logistics/${shipmentId}/delivered`, body);
}

export async function postCompleteApi(
  session: ApiSession | undefined,
  shipmentId: string,
  body: unknown = {}
): Promise<ApiResult> {
  return apiJson(session, 'POST', `/logistics/${shipmentId}/complete`, body);
}

export async function postLocationApi(
  session: ApiSession | undefined,
  shipmentId: string,
  body: unknown = {}
): Promise<ApiResult> {
  return apiJson(session, 'POST', `/logistics/${shipmentId}/location`, body);
}

export async function getShipmentApi(
  session: ApiSession | undefined,
  shipmentId: string
): Promise<ApiResult> {
  return apiJson(session, 'GET', `/logistics/${shipmentId}`);
}

export async function patchAssignRawFetch(
  session: ApiSession,
  shipmentId: string,
  options: { body: string; contentType?: string }
): Promise<ApiResult> {
  const response = await fetch(`${API_BASE}/logistics/${shipmentId}/assign`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${session.accessToken}`,
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

export async function refreshAdminApiSession(): Promise<ApiSession> {
  const creds = getAdminCredentials();
  return loginApiFresh(creds.mobile, creds.password);
}

export async function refreshDeliveryApiSession(index = 1): Promise<ApiSession> {
  const creds = getDeliveryCredentials(index);
  return loginApiFresh(creds.mobile, creds.password);
}

export async function refreshVendorApiSession(): Promise<ApiSession> {
  const creds = getVendorCredentials(1);
  return loginApiFresh(creds.mobile, creds.password);
}

export {
  authHeaders,
  apiJson,
  advanceLifecycleTo,
  createAssignedShipment,
  createPendingShipment,
  partnerIdFromSession,
};
