/**
 * Admin Authorization Certification helpers (AA-ADM).
 * Composes smoke/functional helpers — does not modify locked AS-ADM / AF-ADM specs.
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
import {
  getAdminCredentials,
  getDeliveryCredentials,
  getSuperAdminCredentials,
  getVendorCredentials,
  uniqueProductName,
} from './product.credentials';
import { clearValidationRateLimits } from './cart.validation.helper';
import {
  createProductApi,
  getAdminSession,
  getFirstCategoryId,
  resolveRefId,
} from './product.api.helper';
import { findInventoryRowForProduct } from './inventory.smoke.helper';
import {
  approveUserApi,
  registerPendingVendor,
  seedAdminFunctionalData,
  type AdminFunctionalSeed,
} from './admin.functional.helper';
import {
  establishAdminUiSession,
  getAdminStatsRaw,
  getAdminUsersRaw,
  messageOf,
  unwrapData,
} from './admin.smoke.helper';
import { decodeJwtPayload } from './token.test.helper';

export type AdminAuthorizationSeed = AdminFunctionalSeed & {
  adminUserId: string;
  vendorUserId: string;
  inventoryWarehouseId: string;
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

export async function postAdminApproveRaw(
  userId: string,
  headers: Record<string, string> = {}
) {
  return apiClient.post(`/admin/approve/${userId}`, {}, {
    headers,
    validateStatus: () => true,
  });
}

export async function postAdminRejectRaw(
  userId: string,
  headers: Record<string, string> = {}
) {
  return apiClient.post(`/admin/reject/${userId}`, {}, {
    headers,
    validateStatus: () => true,
  });
}

export async function patchAdminUserStatusRaw(
  userId: string,
  status: string,
  headers: Record<string, string> = {}
) {
  return apiClient.patch(
    `/admin/users/${userId}`,
    { status },
    { headers, validateStatus: () => true }
  );
}

export async function postCategoryRaw(
  body: Record<string, unknown>,
  headers: Record<string, string> = {}
) {
  return apiClient.post('/categories', body, { headers, validateStatus: () => true });
}

export async function postProductRaw(
  body: Record<string, unknown>,
  headers: Record<string, string> = {}
) {
  return apiClient.post('/products', body, { headers, validateStatus: () => true });
}

export async function patchProductStatusRaw(
  productId: string,
  isActive: boolean,
  headers: Record<string, string> = {}
) {
  return apiClient.patch(
    `/products/${productId}/status`,
    { isActive },
    { headers, validateStatus: () => true }
  );
}

export async function patchInventoryUpdateRaw(
  body: Record<string, unknown>,
  headers: Record<string, string> = {}
) {
  return apiClient.patch('/inventory/update', body, {
    headers,
    validateStatus: () => true,
  });
}

export async function getInventoryStatsRaw(headers: Record<string, string> = {}) {
  return apiClient.get('/inventory/stats', { headers, validateStatus: () => true });
}

export async function getOrdersRaw(headers: Record<string, string> = {}) {
  return apiClient.get('/orders', { headers, validateStatus: () => true });
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

export async function getLogisticsQueueRaw(headers: Record<string, string> = {}) {
  return apiClient.get('/logistics/delivery-queue', {
    headers,
    validateStatus: () => true,
  });
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

export async function getAnalyticsDeliveryRaw(headers: Record<string, string> = {}) {
  return apiClient.get('/analytics/delivery', { headers, validateStatus: () => true });
}

export async function getAnalyticsDashboardRaw(headers: Record<string, string> = {}) {
  return apiClient.get('/analytics/dashboard', { headers, validateStatus: () => true });
}

export async function seedAdminAuthorizationData(): Promise<{
  adminSession: ApiSession;
  vendorSession: ApiSession;
  deliverySession: ApiSession;
  superAdminSession: ApiSession;
  seed: AdminAuthorizationSeed;
}> {
  clearValidationRateLimits();
  const seeded = await seedAdminFunctionalData();
  const sa = getSuperAdminCredentials();
  const superAdminSession = await loginApi(sa.mobile, sa.password);

  const invRow = await findInventoryRowForProduct(
    seeded.adminSession,
    seeded.seed.inventoryProduct.id
  );

  return {
    adminSession: seeded.adminSession,
    vendorSession: seeded.vendorSession,
    deliverySession: seeded.deliverySession,
    superAdminSession,
    seed: {
      ...seeded.seed,
      adminUserId: userIdFromSession(seeded.adminSession),
      vendorUserId: userIdFromSession(seeded.vendorSession),
      inventoryWarehouseId: invRow?.warehouseId || '',
    },
  };
}

export async function refreshAdminApiSession(): Promise<ApiSession> {
  const creds = getAdminCredentials();
  return loginApiFresh(creds.mobile, creds.password);
}

export async function refreshVendorApiSession(index = 1): Promise<ApiSession> {
  const creds = getVendorCredentials(index);
  return loginApiFresh(creds.mobile, creds.password);
}

export async function createExtraPendingVendor() {
  return registerPendingVendor('aa-extra');
}

export {
  approveUserApi,
  authHeaders,
  clearValidationRateLimits,
  createProductApi,
  establishAdminUiSession,
  getAdminSession,
  getAdminStatsRaw,
  getAdminUsersRaw,
  getDeliveryCredentials,
  getFirstCategoryId,
  loginApi,
  loginApiFresh,
  messageOf,
  registerPendingVendor,
  resolveRefId,
  uniqueProductName,
  unwrapData,
};
