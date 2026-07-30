import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { authHeaders, loginApiFresh, type ApiSession } from './auth.api.helper';
import { getVendorCredentials } from './product.credentials';
import {
  API_BASE,
  apiJson,
  INVALID_OBJECT_ID,
  messageOf,
  NONEXISTENT_OBJECT_ID,
  type ApiResult,
} from './validation/product.validation.helper';
import {
  seedNotificationsSmokeData,
  notificationIdOf,
  unwrapList,
  type NotificationsSmokeSeed,
} from './notifications.smoke.helper';

export { messageOf, INVALID_OBJECT_ID, NONEXISTENT_OBJECT_ID, apiJson, API_BASE };

export type NotificationsValidationSeed = NotificationsSmokeSeed & {
  validUnreadId: string;
  validAnyId: string;
};

export function clearNotificationsValidationRateLimits(): void {
  try {
    const script = path.resolve(
      process.cwd(),
      '..',
      'b2b-backend',
      'scripts',
      'clearAuthRateLimits.js'
    );
    execSync(`node "${script}"`, { stdio: 'ignore' });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.warn('Warning: failed to clear notifications validation rate limits:', message);
  }
}

export async function seedNotificationsValidationData(
  vendorSession: ApiSession
): Promise<{
  adminSession: ApiSession;
  deliverySession: ApiSession;
  seed: NotificationsValidationSeed;
}> {
  clearNotificationsValidationRateLimits();
  const seeded = await seedNotificationsSmokeData(vendorSession);
  const listRes = await apiJson(vendorSession, 'GET', '/notifications');
  const list = unwrapList(listRes.body);
  const unread = list.find((n) => n.isRead !== true);
  const validUnreadId = unread
    ? notificationIdOf(unread)
    : seeded.seed.vendorNotificationIds[0] || '';
  const validAnyId = seeded.seed.vendorNotificationIds[0] || validUnreadId;
  if (!validAnyId) {
    throw new Error('Validation seed missing vendor notification id');
  }
  return {
    adminSession: seeded.adminSession,
    deliverySession: seeded.deliverySession,
    seed: {
      ...seeded.seed,
      validUnreadId: validUnreadId || validAnyId,
      validAnyId,
    },
  };
}

export async function getNotificationsApi(session: ApiSession): Promise<ApiResult> {
  return apiJson(session, 'GET', '/notifications');
}

export async function getNotificationsWithQueryApi(
  session: ApiSession,
  query: string
): Promise<ApiResult> {
  return apiJson(session, 'GET', `/notifications${query}`);
}

export async function patchMarkAllApi(
  session: ApiSession,
  body: unknown = {}
): Promise<ApiResult> {
  return apiJson(session, 'PATCH', '/notifications/read-all', body);
}

export async function patchMarkReadApi(
  session: ApiSession,
  notificationId: string,
  body: unknown = {}
): Promise<ApiResult> {
  return apiJson(session, 'PATCH', `/notifications/${notificationId}/read`, body);
}

export async function patchMarkReadRawFetch(
  session: ApiSession,
  notificationId: string,
  options: { body: string; contentType?: string }
): Promise<ApiResult> {
  const response = await fetch(`${API_BASE}/notifications/${notificationId}/read`, {
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

export async function patchMarkAllRawFetch(
  session: ApiSession,
  options: { body: string; contentType?: string }
): Promise<ApiResult> {
  const response = await fetch(`${API_BASE}/notifications/read-all`, {
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

export function readBackendFile(relativePath: string): string {
  const filePath = path.resolve(process.cwd(), '..', 'b2b-backend', relativePath);
  return fs.readFileSync(filePath, 'utf8');
}

export async function refreshVendorApiSession(): Promise<ApiSession> {
  const creds = getVendorCredentials(1);
  return loginApiFresh(creds.mobile, creds.password);
}

export { authHeaders, unwrapList, notificationIdOf };
