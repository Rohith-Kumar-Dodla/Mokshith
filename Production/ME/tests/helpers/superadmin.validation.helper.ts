/**
 * Super Admin Validation Certification helpers (SAV-SA).
 * Does not modify locked SS-SA / SF-SA / SAA-SA or Admin validation suites.
 */
import fs from 'fs';
import path from 'path';
import { apiClient } from './apiClient';
import { authHeaders, type ApiSession } from './auth.api.helper';
import { clearValidationRateLimits } from './cart.validation.helper';
import { addToCartApi, clearCartApi } from './cart.api.helper';
import {
  createProductApi,
  getAdminSession,
  getFirstCategoryId,
  resolveRefId,
} from './product.api.helper';
import {
  getVendorCredentials,
  uniqueProductName,
} from './product.credentials';
import { loginApi } from './auth.api.helper';
import { placeBankTransferOrderApi, uploadPaymentProofRaw, unwrapProofId } from './payment.functional.helper';
import { resolveOrderId } from './order.functional.helper';
import { registerPendingVendor } from './admin.functional.helper';
import {
  createDisposableAdminApi,
  refreshSuperAdminApiSession,
  messageOf as smokeMessageOf,
} from './superadmin.functional.helper';
import {
  API_BASE,
  INVALID_OBJECT_ID,
  NONEXISTENT_OBJECT_ID,
  messageOf,
  type ApiResult,
} from './validation/product.validation.helper';

export type SuperAdminValidationSeed = {
  pendingApprovalId: string;
  disposableAdminId: string;
  rejectProofId: string;
  rejectProofUtr: string;
};

export {
  API_BASE,
  INVALID_OBJECT_ID,
  NONEXISTENT_OBJECT_ID,
  authHeaders,
  clearValidationRateLimits,
  messageOf,
  uniqueProductName,
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

async function toApiResult(response: {
  status: number;
  data?: unknown;
}): Promise<ApiResult> {
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
    'x-csrf-token': session.csrfToken,
    Cookie: `csrf-token=${session.csrfToken}`,
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

export async function seedSuperAdminValidationData(): Promise<{
  saSession: ApiSession;
  seed: SuperAdminValidationSeed;
}> {
  clearValidationRateLimits();
  const saSession = await refreshSuperAdminApiSession();
  const adminSession = await getAdminSession();
  const vendorCreds = getVendorCredentials(1);
  const vendorSession = await loginApi(vendorCreds.mobile, vendorCreds.password);

  const pending = await registerPendingVendor('sav-pend');
  const disposable = await createDisposableAdminApi(saSession, 'sav');

  const categoryId = await getFirstCategoryId(adminSession);
  const productRaw = await createProductApi(adminSession, {
    name: uniqueProductName('sav-bank'),
    description: 'SA validation bank product',
    price: 110,
    stock: 40,
    categoryId,
    moq: 1,
    isActive: true,
  });
  const productId = String(resolveRefId(productRaw as { _id?: string; id?: string }) || '');
  await clearCartApi(vendorSession);
  await addToCartApi(vendorSession, productId, 1);
  const order = await placeBankTransferOrderApi(vendorSession, {
    idempotencyKey: `sav-bank-${Date.now()}`,
  });
  const orderId = resolveOrderId(order);
  const utr = `SAV${Date.now()}`.slice(0, 22);
  const upload = await uploadPaymentProofRaw(vendorSession, { orderId, utrNumber: utr });
  if (upload.status !== 200 && upload.status !== 201) {
    throw new Error(`Upload proof failed (${upload.status}): ${smokeMessageOf(upload.body)}`);
  }
  const rejectProofId = unwrapProofId(upload.body);
  if (!rejectProofId) {
    throw new Error(`No proof id: ${JSON.stringify(upload.body)}`);
  }

  return {
    saSession,
    seed: {
      pendingApprovalId: pending.id,
      disposableAdminId: disposable.id,
      rejectProofId,
      rejectProofUtr: utr,
    },
  };
}

export async function patchUserRole(
  session: ApiSession,
  userId: string,
  body: unknown
): Promise<ApiResult> {
  return apiJson(session, 'PATCH', `/super-admin/users/${userId}/role`, body);
}

export async function patchApprovalApprove(
  session: ApiSession,
  userId: string,
  body: unknown = {}
): Promise<ApiResult> {
  return apiJson(session, 'PATCH', `/admin-approvals/${userId}/approve`, body);
}

export async function patchApprovalReject(
  session: ApiSession,
  userId: string,
  body: unknown = {}
): Promise<ApiResult> {
  return apiJson(session, 'PATCH', `/admin-approvals/${userId}/reject`, body);
}

export async function postCreateAdmin(
  session: ApiSession,
  body: unknown
): Promise<ApiResult> {
  return apiJson(session, 'POST', '/super-admin/admins', body);
}

export async function patchAdminUserStatus(
  session: ApiSession,
  userId: string,
  body: unknown
): Promise<ApiResult> {
  return apiJson(session, 'PATCH', `/admin/users/${userId}`, body);
}

export async function patchBankTransferReject(
  session: ApiSession,
  proofId: string,
  body: unknown
): Promise<ApiResult> {
  return apiJson(session, 'PATCH', `/payments/bank-transfer/${proofId}/reject`, body);
}

export async function patchBankTransferApprove(
  session: ApiSession,
  proofId: string,
  body: unknown = {}
): Promise<ApiResult> {
  return apiJson(session, 'PATCH', `/payments/bank-transfer/${proofId}/approve`, body);
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

export async function getAnalyticsDashboard(
  session: ApiSession,
  params: Record<string, string> = {}
): Promise<ApiResult> {
  const response = await apiClient.get('/analytics/dashboard', {
    headers: authHeaders(session),
    params,
    validateStatus: () => true,
  });
  return toApiResult(response);
}

export async function getSuperAdminStats(
  session: ApiSession,
  params: Record<string, string> = {}
): Promise<ApiResult> {
  const response = await apiClient.get('/super-admin/stats', {
    headers: authHeaders(session),
    params,
    validateStatus: () => true,
  });
  return toApiResult(response);
}
