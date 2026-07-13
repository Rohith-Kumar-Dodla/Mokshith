import fs from 'fs';
import path from 'path';
import { apiClient } from './apiClient';
import { authHeaders, loginApiFresh, type ApiSession } from './auth.api.helper';
import { getVendorCredentials } from './product.credentials';
import {
  createProductApi,
  getAdminSession,
  getFirstCategoryId,
  resolveRefId,
} from './product.api.helper';
import { uniqueProductName } from './product.credentials';
import { getCartApi } from './cart.api.helper';

export type AuthSeedProduct = {
  id: string;
  name: string;
};

export async function seedCartAuthorizationProduct(): Promise<AuthSeedProduct> {
  const adminSession = await getAdminSession();
  const categoryId = await getFirstCategoryId(adminSession);
  const created = await createProductApi(adminSession, {
    name: uniqueProductName('pa-cart'),
    price: 150,
    categoryId,
    stock: 100,
    moq: 1,
  });
  return {
    id: String(created._id || created.id),
    name: String(created.name),
  };
}

export async function getCartRaw(headers: Record<string, string> = {}) {
  return apiClient.get('/cart', { headers, validateStatus: () => true });
}

export async function postCartRaw(
  body: { productId: string; quantity: number },
  headers: Record<string, string> = {}
) {
  return apiClient.post('/cart', body, { headers, validateStatus: () => true });
}

export async function deleteCartRaw(productId: string, headers: Record<string, string> = {}) {
  return apiClient.delete(`/cart/${productId}`, { headers, validateStatus: () => true });
}

export async function postOrderRaw(
  body: Record<string, unknown>,
  headers: Record<string, string> = {}
) {
  return apiClient.post('/orders', body, { headers, validateStatus: () => true });
}

export function cartItemCount(cart: Awaited<ReturnType<typeof getCartApi>>): number {
  return cart?.items?.length ?? 0;
}

export function cartContainsProduct(
  cart: Awaited<ReturnType<typeof getCartApi>>,
  productId: string
): boolean {
  if (!cart?.items?.length) return false;
  return cart.items.some((item) => resolveRefId(item.productId) === productId);
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

/** Re-authenticate vendor 1 and refresh in-memory + on-disk loginApi caches. */
export async function refreshVendorApiSession(): Promise<ApiSession> {
  const creds = getVendorCredentials(1);
  return loginApiFresh(creds.mobile, creds.password);
}
