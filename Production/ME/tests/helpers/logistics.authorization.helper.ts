import fs from 'fs';
import path from 'path';
import { authHeaders, loginApiFresh, type ApiSession } from './auth.api.helper';
import {
  getAdminCredentials,
  getDeliveryCredentials,
  getVendorCredentials,
} from './product.credentials';
import { clearValidationRateLimits } from './cart.validation.helper';
import { loginApi } from './auth.api.helper';
import {
  createAssignedShipment,
  createPendingShipment,
  getAllLogisticsRaw,
  getLogisticsAnalyticsRaw,
  getLogisticsHistoryRaw,
  partnerIdFromSession,
  patchLogisticsReassignRaw,
  postLogisticsLocationRaw,
  seedLogisticsFunctionalData,
  type LogisticsFunctionalSeed,
  type LogisticsShipmentRef,
} from './logistics.functional.helper';
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
} from './logistics.smoke.helper';

export type LogisticsAuthorizationSeed = LogisticsFunctionalSeed & {
  /** ASSIGNED to delivery partner 1 — ownership positive/negative cases */
  ownedByDp1: LogisticsShipmentRef;
  /** ASSIGNED to delivery partner 2 — foreign-ownership cases for DP1 */
  ownedByDp2: LogisticsShipmentRef;
};

export async function seedLogisticsAuthorizationData(vendorSession: ApiSession): Promise<{
  adminSession: ApiSession;
  deliverySession: ApiSession;
  delivery2Session: ApiSession;
  seed: LogisticsAuthorizationSeed;
}> {
  clearValidationRateLimits();
  const seeded = await seedLogisticsFunctionalData(vendorSession);
  const dp1Id = partnerIdFromSession(seeded.deliverySession);
  const dp2Id = partnerIdFromSession(seeded.delivery2Session);

  const ownedByDp1 = await createAssignedShipment(
    seeded.adminSession,
    vendorSession,
    seeded.seed.product.id,
    dp1Id,
    'authz-dp1'
  );
  const ownedByDp2 = await createAssignedShipment(
    seeded.adminSession,
    vendorSession,
    seeded.seed.product.id,
    dp2Id,
    'authz-dp2'
  );

  return {
    adminSession: seeded.adminSession,
    deliverySession: seeded.deliverySession,
    delivery2Session: seeded.delivery2Session,
    seed: {
      ...seeded.seed,
      ownedByDp1: { ...ownedByDp1, deliveryPartnerId: dp1Id },
      ownedByDp2: { ...ownedByDp2, deliveryPartnerId: dp2Id },
    },
  };
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

export async function refreshAdminApiSession(): Promise<ApiSession> {
  const creds = getAdminCredentials();
  return loginApiFresh(creds.mobile, creds.password);
}

export async function refreshDeliveryApiSession(index = 1): Promise<ApiSession> {
  const creds = getDeliveryCredentials(index);
  return loginApiFresh(creds.mobile, creds.password);
}

export {
  authHeaders,
  clearValidationRateLimits,
  createAssignedShipment,
  createPendingShipment,
  getAllLogisticsRaw,
  getLogisticsAnalyticsRaw,
  getLogisticsByIdRaw,
  getLogisticsHistoryRaw,
  getLogisticsQueueRaw,
  getMyAssignmentsRaw,
  loginApi,
  loginApiFresh,
  messageOf,
  partnerIdFromSession,
  patchLogisticsAssignRaw,
  patchLogisticsReassignRaw,
  postLogisticsAcceptRaw,
  postLogisticsCompleteRaw,
  postLogisticsCreateRaw,
  postLogisticsDeliveredRaw,
  postLogisticsLocationRaw,
  postLogisticsPickRaw,
  postLogisticsStartRaw,
};
