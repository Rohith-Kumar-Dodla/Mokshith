/**
 * Admin Validation Certification helpers (AV-ADM).
 * Composes functional/authorization helpers — does not modify locked AS/AF/AA-ADM suites.
 */
import fs from 'fs';
import path from 'path';
import { apiClient } from './apiClient';
import { authHeaders, type ApiSession } from './auth.api.helper';
import { clearValidationRateLimits } from './cart.validation.helper';
import {
  seedAdminAuthorizationData,
  type AdminAuthorizationSeed,
  userIdFromSession,
} from './admin.authorization.helper';
import {
  API_BASE,
  INVALID_OBJECT_ID,
  NONEXISTENT_OBJECT_ID,
  messageOf,
  type ApiResult,
} from './validation/product.validation.helper';
import { uniqueProductName } from './product.credentials';

// re-export for specs

export type AdminValidationSeed = AdminAuthorizationSeed & {
  pendingVendorId: string;
  suspendVendorId: string;
  deliveryPartnerId: string;
};

export {
  API_BASE,
  INVALID_OBJECT_ID,
  NONEXISTENT_OBJECT_ID,
  authHeaders,
  clearValidationRateLimits,
  messageOf,
  uniqueProductName,
  userIdFromSession,
};

export function readBackendFile(relativePath: string): string {
  const filePath = path.resolve(process.cwd(), '..', 'b2b-backend', relativePath);
  return fs.readFileSync(filePath, 'utf8');
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

async function toApiResult(
  response: { status: number; data?: unknown }
): Promise<ApiResult> {
  return {
    status: response.status,
    body: (response.data as Record<string, unknown>) ?? {},
  };
}

export async function apiJson(
  session: ApiSession,
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
  endpoint: string,
  data?: unknown
): Promise<ApiResult> {
  const response = await apiClient.request({
    method,
    url: endpoint,
    data,
    headers: authHeaders(session),
    validateStatus: () => true,
  });
  return toApiResult(response);
}

export async function apiBearerOnly(
  session: ApiSession,
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
  endpoint: string,
  data?: unknown
): Promise<ApiResult> {
  const response = await apiClient.request({
    method,
    url: endpoint,
    data,
    headers: { Authorization: `Bearer ${session.accessToken}` },
    validateStatus: () => true,
  });
  return toApiResult(response);
}

export async function rawFetch(
  session: ApiSession,
  method: string,
  endpoint: string,
  options: { body?: string; contentType?: string | null } = {}
): Promise<ApiResult> {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${session.accessToken}`,
  };
  if (options.contentType) {
    headers['Content-Type'] = options.contentType;
  } else if (options.contentType === undefined && options.body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }
  const response = await fetch(`${API_BASE}${endpoint}`, {
    method,
    headers,
    body: options.body,
  });
  const body = (await response.json().catch(() => ({}))) as Record<string, unknown>;
  return { status: response.status, body };
}

export async function seedAdminValidationData(): Promise<{
  adminSession: ApiSession;
  vendorSession: ApiSession;
  deliverySession: ApiSession;
  seed: AdminValidationSeed;
}> {
  clearValidationRateLimits();
  const seeded = await seedAdminAuthorizationData();
  return {
    adminSession: seeded.adminSession,
    vendorSession: seeded.vendorSession,
    deliverySession: seeded.deliverySession,
    seed: {
      ...seeded.seed,
      pendingVendorId: seeded.seed.pendingVendor.id,
      suspendVendorId: seeded.seed.suspendVendor.id,
      deliveryPartnerId: seeded.seed.assignedShipment.deliveryPartnerId,
    },
  };
}

export async function patchAdminUserStatus(
  session: ApiSession,
  userId: string,
  body: unknown
): Promise<ApiResult> {
  return apiJson(session, 'PATCH', `/admin/users/${userId}`, body);
}

export async function postAdminApprove(
  session: ApiSession,
  userId: string,
  body: unknown = {}
): Promise<ApiResult> {
  return apiJson(session, 'POST', `/admin/approve/${userId}`, body);
}

export async function postAdminReject(
  session: ApiSession,
  userId: string,
  body: unknown = {}
): Promise<ApiResult> {
  return apiJson(session, 'POST', `/admin/reject/${userId}`, body);
}

export async function patchAdminCredit(
  session: ApiSession,
  userId: string,
  body: unknown
): Promise<ApiResult> {
  return apiJson(session, 'PATCH', `/admin/users/${userId}/credit`, body);
}

export async function postB2BCustomer(
  session: ApiSession,
  body: unknown
): Promise<ApiResult> {
  return apiJson(session, 'POST', '/admin/b2b-customers', body);
}

export async function postDeliveryPartner(
  session: ApiSession,
  body: unknown
): Promise<ApiResult> {
  return apiJson(session, 'POST', '/admin/delivery-partners', body);
}

export async function postProduct(
  session: ApiSession,
  body: unknown
): Promise<ApiResult> {
  return apiJson(session, 'POST', '/products', body);
}

export async function patchProductStatus(
  session: ApiSession,
  productId: string,
  body: unknown
): Promise<ApiResult> {
  return apiJson(session, 'PATCH', `/products/${productId}/status`, body);
}

export async function putProduct(
  session: ApiSession,
  productId: string,
  body: unknown
): Promise<ApiResult> {
  return apiJson(session, 'PUT', `/products/${productId}`, body);
}

export async function postCategory(
  session: ApiSession,
  body: unknown
): Promise<ApiResult> {
  return apiJson(session, 'POST', '/categories', body);
}

export async function putCategory(
  session: ApiSession,
  categoryId: string,
  body: unknown
): Promise<ApiResult> {
  return apiJson(session, 'PUT', `/categories/${categoryId}`, body);
}

export async function deleteCategory(
  session: ApiSession,
  categoryId: string
): Promise<ApiResult> {
  return apiJson(session, 'DELETE', `/categories/${categoryId}`);
}

export async function patchOrderStatus(
  session: ApiSession,
  orderId: string,
  body: unknown
): Promise<ApiResult> {
  return apiJson(session, 'PATCH', `/orders/${orderId}/status`, body);
}

export async function postInventory(
  session: ApiSession,
  body: unknown
): Promise<ApiResult> {
  return apiJson(session, 'POST', '/inventory', body);
}

export async function patchInventoryUpdate(
  session: ApiSession,
  body: unknown
): Promise<ApiResult> {
  return apiJson(session, 'PATCH', '/inventory/update', body);
}

export async function patchLogisticsAssign(
  session: ApiSession,
  shipmentId: string,
  body: unknown
): Promise<ApiResult> {
  return apiJson(session, 'PATCH', `/logistics/${shipmentId}/assign`, body);
}

export async function putUserMe(
  session: ApiSession,
  body: unknown
): Promise<ApiResult> {
  return apiJson(session, 'PUT', '/users/me', body);
}

export async function putSettings(
  session: ApiSession,
  body: unknown
): Promise<ApiResult> {
  return apiJson(session, 'PUT', '/settings', body);
}

export async function postChangePassword(
  session: ApiSession,
  body: unknown
): Promise<ApiResult> {
  return apiJson(session, 'POST', '/auth/change-password', body);
}
