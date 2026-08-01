import fs from 'fs';
import path from 'path';
import { authHeaders, loginApiFresh, type ApiSession } from './auth.api.helper';
import {
  getAdminCredentials,
  getDeliveryCredentials,
  getVendorCredentials,
} from './product.credentials';
import { clearValidationRateLimits } from './cart.validation.helper';
import { decodeJwtPayload } from './token.test.helper';
import {
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

export type NotificationsAuthorizationSeed = NotificationsSmokeSeed & {
  vendorUserId: string;
  deliveryUserId: string;
  adminUserId: string;
  /** Stable unread vendor notification reserved for cross-user mark-read truth */
  crossUserMarkTargetId: string;
};

export function userIdFromSession(session: ApiSession): string {
  return String(
    decodeJwtPayload(session.accessToken).id ||
      session.user?._id ||
      session.user?.id ||
      ''
  );
}

export async function seedNotificationsAuthorizationData(
  vendorSession: ApiSession
): Promise<{
  adminSession: ApiSession;
  deliverySession: ApiSession;
  vendor2Session: ApiSession;
  seed: NotificationsAuthorizationSeed;
}> {
  clearValidationRateLimits();
  const seeded = await seedNotificationsSmokeData(vendorSession);
  const vendor2Creds = getVendorCredentials(2);
  const vendor2Session = await loginApiFresh(vendor2Creds.mobile, vendor2Creds.password);

  const vendorList = unwrapList(
    (await getNotificationsRaw(authHeaders(vendorSession))).data
  );
  const unread = vendorList.find((n) => n.isRead !== true);
  const crossUserMarkTargetId = unread
    ? notificationIdOf(unread)
    : seeded.seed.vendorNotificationIds[0] || '';

  if (!crossUserMarkTargetId) {
    throw new Error('Authorization seed missing vendor notification for cross-user mark-read');
  }

  return {
    adminSession: seeded.adminSession,
    deliverySession: seeded.deliverySession,
    vendor2Session,
    seed: {
      ...seeded.seed,
      vendorUserId: userIdFromSession(vendorSession),
      deliveryUserId: userIdFromSession(seeded.deliverySession),
      adminUserId: userIdFromSession(seeded.adminSession),
      crossUserMarkTargetId,
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

export async function refreshVendorApiSession(index = 1): Promise<ApiSession> {
  const creds = getVendorCredentials(index);
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

export function listContainsOrderId(
  list: Array<Record<string, unknown>>,
  orderId: string
): boolean {
  return list.some((n) => String(n.message || '').includes(orderId));
}

export function idsOf(list: Array<Record<string, unknown>>): string[] {
  return list.map((n) => notificationIdOf(n)).filter(Boolean);
}

export {
  authHeaders,
  clearValidationRateLimits,
  getNotificationsRaw,
  messageOf,
  notificationIdOf,
  patchMarkAllReadRaw,
  patchMarkReadRaw,
  unwrapData,
  unwrapList,
};
