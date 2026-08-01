/**
 * Super Admin Authorization Certification helpers (SAA-SA).
 * Does not modify locked SS-SA / SF-SA or Admin / Notifications / Logistics suites.
 */
import fs from 'fs';
import path from 'path';
import { apiClient } from './apiClient';
import {
  authHeaders,
  loginApi,
  loginApiFresh,
  type ApiSession,
} from './auth.api.helper';
import { clearValidationRateLimits } from './cart.validation.helper';
import {
  getAdminCredentials,
  getDeliveryCredentials,
  getSuperAdminCredentials,
  getVendorCredentials,
} from './product.credentials';
import { registerPendingVendor } from './admin.functional.helper';
import {
  establishSuperAdminUiSession,
  getAnalyticsDashboardRaw,
  getBankTransferPendingRaw,
  getSuperAdminMetricsRaw,
  getSuperAdminStatsRaw,
  messageOf,
  refreshSuperAdminApiSession,
  unwrapData,
} from './superadmin.smoke.helper';
import { decodeJwtPayload } from './token.test.helper';

export type SuperAdminAuthorizationSeed = {
  pendingApprovalId: string;
  pendingApprovalName: string;
};

export function userIdFromSession(session: ApiSession): string {
  return String(
    decodeJwtPayload(session.accessToken).id ||
      session.user?._id ||
      session.user?.id ||
      ''
  );
}

export function bearerOnly(accessToken: string) {
  return { Authorization: `Bearer ${accessToken}` };
}

export function authBearerOnly(session: ApiSession) {
  return { Authorization: `Bearer ${session.accessToken}` };
}

export function readBackendFile(relativePath: string): string {
  const filePath = path.resolve(process.cwd(), '..', 'b2b-backend', relativePath);
  return fs.readFileSync(filePath, 'utf8');
}

export async function getAdminStatsRaw(headers: Record<string, string> = {}) {
  return apiClient.get('/admin/stats', { headers, validateStatus: () => true });
}

export async function getAdminUsersRaw(
  headers: Record<string, string> = {},
  params: Record<string, string> = {}
) {
  return apiClient.get('/admin/users', {
    headers,
    params,
    validateStatus: () => true,
  });
}

export async function getAnalyticsDeliveryRaw(headers: Record<string, string> = {}) {
  return apiClient.get('/analytics/delivery', { headers, validateStatus: () => true });
}

export async function getInventoryStatsRaw(headers: Record<string, string> = {}) {
  return apiClient.get('/inventory/stats', { headers, validateStatus: () => true });
}

export async function getAdminApprovalsPendingRaw(headers: Record<string, string> = {}) {
  return apiClient.get('/admin-approvals/pending', {
    headers,
    validateStatus: () => true,
  });
}

export async function patchAdminApprovalApproveRaw(
  userId: string,
  headers: Record<string, string> = {}
) {
  return apiClient.patch(
    `/admin-approvals/${userId}/approve`,
    {},
    { headers, validateStatus: () => true }
  );
}

export async function patchAdminApprovalRejectRaw(
  userId: string,
  headers: Record<string, string> = {}
) {
  return apiClient.patch(
    `/admin-approvals/${userId}/reject`,
    {},
    { headers, validateStatus: () => true }
  );
}

export async function postSuperAdminAdminRaw(
  body: Record<string, unknown>,
  headers: Record<string, string> = {}
) {
  return apiClient.post('/super-admin/admins', body, {
    headers,
    validateStatus: () => true,
  });
}

export async function getSuperAdminUsersRaw(headers: Record<string, string> = {}) {
  return apiClient.get('/super-admin/users', { headers, validateStatus: () => true });
}

export async function getSuperAdminAdminsRaw(headers: Record<string, string> = {}) {
  return apiClient.get('/super-admin/admins', { headers, validateStatus: () => true });
}

export async function patchBankTransferApproveRaw(
  proofId: string,
  headers: Record<string, string> = {}
) {
  return apiClient.patch(
    `/payments/bank-transfer/${proofId}/approve`,
    {},
    { headers, validateStatus: () => true }
  );
}

export async function patchBankTransferRejectRaw(
  proofId: string,
  reason: string,
  headers: Record<string, string> = {}
) {
  return apiClient.patch(
    `/payments/bank-transfer/${proofId}/reject`,
    { reason },
    { headers, validateStatus: () => true }
  );
}

export async function patchOrderStatusRaw(
  orderId: string,
  body: Record<string, unknown>,
  headers: Record<string, string> = {}
) {
  return apiClient.patch(`/orders/${orderId}/status`, body, {
    headers,
    validateStatus: () => true,
  });
}

export async function postAdminApproveRaw(
  userId: string,
  headers: Record<string, string> = {}
) {
  return apiClient.post(`/admin/approve/${userId}`, {}, {
    headers,
    validateStatus: () => true,
  });
}

export async function seedSuperAdminAuthorizationData(): Promise<{
  saSession: ApiSession;
  adminSession: ApiSession;
  vendorSession: ApiSession;
  deliverySession: ApiSession;
  seed: SuperAdminAuthorizationSeed;
}> {
  clearValidationRateLimits();
  const saCreds = getSuperAdminCredentials();
  const saSession = await loginApiFresh(saCreds.mobile, saCreds.password);
  const adminCreds = getAdminCredentials();
  const adminSession = await loginApi(adminCreds.mobile, adminCreds.password);
  const vendorCreds = getVendorCredentials(1);
  const vendorSession = await loginApi(vendorCreds.mobile, vendorCreds.password);
  const deliveryCreds = getDeliveryCredentials(1);
  const deliverySession = await loginApi(deliveryCreds.mobile, deliveryCreds.password);

  const pending = await registerPendingVendor('saa-pend');

  return {
    saSession,
    adminSession,
    vendorSession,
    deliverySession,
    seed: {
      pendingApprovalId: pending.id,
      pendingApprovalName: pending.name,
    },
  };
}

export {
  authHeaders,
  clearValidationRateLimits,
  establishSuperAdminUiSession,
  getAnalyticsDashboardRaw,
  getBankTransferPendingRaw,
  getSuperAdminMetricsRaw,
  getSuperAdminStatsRaw,
  loginApiFresh,
  messageOf,
  refreshSuperAdminApiSession,
  unwrapData,
};
