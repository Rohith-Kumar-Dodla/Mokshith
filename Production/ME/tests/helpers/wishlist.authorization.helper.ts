import fs from 'fs';
import path from 'path';
import { apiClient } from './apiClient';
import { authHeaders, loginApiFresh, type ApiSession } from './auth.api.helper';
import { getVendorCredentials, uniqueProductName } from './product.credentials';
import {
  createProductApi,
  getAdminSession,
  getFirstCategoryId,
  resolveRefId,
} from './product.api.helper';
import { getWishlistApi, type WishlistResponse } from './wishlist.api.helper';

export type AuthSeedProduct = {
  id: string;
  name: string;
};

export async function seedWishlistAuthorizationProduct(): Promise<AuthSeedProduct> {
  const adminSession = await getAdminSession();
  const categoryId = await getFirstCategoryId(adminSession);
  const created = await createProductApi(adminSession, {
    name: uniqueProductName('pa-wl'),
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

export async function getWishlistRaw(headers: Record<string, string> = {}) {
  return apiClient.get('/wishlist', { headers, validateStatus: () => true });
}

export async function postWishlistRaw(
  body: { productId: string },
  headers: Record<string, string> = {}
) {
  return apiClient.post('/wishlist/add', body, { headers, validateStatus: () => true });
}

export async function deleteWishlistItemRaw(
  productId: string,
  headers: Record<string, string> = {}
) {
  return apiClient.delete(`/wishlist/remove/${productId}`, {
    headers,
    validateStatus: () => true,
  });
}

export async function clearWishlistRaw(headers: Record<string, string> = {}) {
  return apiClient.delete('/wishlist/clear', { headers, validateStatus: () => true });
}

export function wishlistItemCount(wishlist: WishlistResponse | null | undefined): number {
  return wishlist?.items?.length ?? 0;
}

export function wishlistContainsProduct(
  wishlist: WishlistResponse | null | undefined,
  productId: string
): boolean {
  if (!wishlist?.items?.length) return false;
  return wishlist.items.some((item) => resolveRefId(item.productId) === productId);
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

export { getWishlistApi, authHeaders, resolveRefId };
