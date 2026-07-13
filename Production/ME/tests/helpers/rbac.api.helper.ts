import { expect } from '@playwright/test';
import type { ApiSession } from './auth.api.helper';
import { loginApi } from './auth.api.helper';
import { apiClient } from './apiClient';
import {
  createProductApi,
  deleteProductApi,
  getAdminSession,
  getFirstCategoryId,
  getProductApi,
  listProductsApi,
  patchProductStockApi,
  patchProductStatusApi,
  updateProductApi,
  type ProductPayload,
} from './product.api.helper';
import {
  getDeliveryCredentials,
  getSuperAdminCredentials,
  getVendorCredentials,
  uniqueProductName,
} from './product.credentials';

export async function expectApiStatus(
  action: () => Promise<unknown>,
  status: number
): Promise<void> {
  await expect(action()).rejects.toMatchObject({ response: { status } });
}

export function bearerOnly(accessToken: string) {
  return { Authorization: `Bearer ${accessToken}` };
}

export async function getSuperAdminSession(): Promise<ApiSession> {
  const { mobile, password } = getSuperAdminCredentials();
  return loginApi(mobile, password);
}

export async function getDeliverySession(): Promise<ApiSession> {
  const { mobile, password } = getDeliveryCredentials();
  return loginApi(mobile, password);
}

export async function createVendorOwnedProduct(
  vendorIndex = 1,
  overrides: Partial<ProductPayload> = {}
) {
  const creds = getVendorCredentials(vendorIndex);
  const vendor = await loginApi(creds.mobile, creds.password);
  const categoryId = await getFirstCategoryId(vendor);
  const vendorId = String(vendor.user._id || vendor.user.id);
  const created = await createProductApi(vendor, {
    name: uniqueProductName(`pf-rbac-v${vendorIndex}`),
    price: 500,
    categoryId,
    vendorId,
    stock: 5,
    ...overrides,
  });
  const productId = String(created._id || created.id);
  return { vendor, productId, created, categoryId };
}

export async function safeDeleteProduct(productId: string): Promise<void> {
  try {
    const admin = await getAdminSession();
    await deleteProductApi(admin, productId);
  } catch {
    // Best-effort cleanup for RBAC discovery runs.
  }
}

export async function postProductRaw(
  payload: ProductPayload,
  headers: Record<string, string> = {}
) {
  return apiClient.post('/products', payload, { headers });
}

export async function putProductRaw(
  productId: string,
  payload: Partial<ProductPayload>,
  headers: Record<string, string> = {}
) {
  return apiClient.put(`/products/${productId}`, payload, { headers });
}

export async function deleteProductRaw(productId: string, headers: Record<string, string> = {}) {
  return apiClient.delete(`/products/${productId}`, { headers });
}

export async function patchStockRaw(
  productId: string,
  stock: number,
  headers: Record<string, string> = {}
) {
  return apiClient.patch(`/products/${productId}/stock`, { stock }, { headers });
}

export async function patchStatusRaw(
  productId: string,
  isActive: boolean,
  headers: Record<string, string> = {}
) {
  return apiClient.patch(`/products/${productId}/status`, { isActive }, { headers });
}

export async function getProductsRaw(headers: Record<string, string> = {}) {
  return apiClient.get('/products', { headers });
}

export async function getProductRaw(productId: string, headers: Record<string, string> = {}) {
  return apiClient.get(`/products/${productId}`, { headers });
}

export {
  createProductApi,
  deleteProductApi,
  getAdminSession,
  getFirstCategoryId,
  getProductApi,
  listProductsApi,
  patchProductStockApi,
  patchProductStatusApi,
  updateProductApi,
} from './product.api.helper';

export { authHeaders } from './auth.api.helper';
