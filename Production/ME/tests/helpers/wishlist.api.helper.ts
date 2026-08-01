import { apiClient } from './apiClient';
import { authHeaders, type ApiSession } from './auth.api.helper';
import { resolveRefId } from './product.api.helper';

export type WishlistItem = {
  productId?: string | { _id?: string; id?: string; name?: string };
};

export type WishlistResponse = {
  _id?: string;
  id?: string;
  items?: WishlistItem[];
};

function unwrapData<T>(response: { data?: { data?: T; success?: boolean } & T }): T {
  const body = response.data as { data?: T } & T;
  return (body?.data ?? body) as T;
}

export async function getWishlistApi(session: ApiSession): Promise<WishlistResponse> {
  const response = await apiClient.get('/wishlist', { headers: authHeaders(session) });
  return unwrapData<WishlistResponse>(response);
}

export async function addToWishlistApi(session: ApiSession, productId: string) {
  const response = await apiClient.post(
    '/wishlist/add',
    { productId },
    { headers: authHeaders(session) }
  );
  return unwrapData<WishlistResponse>(response);
}

export async function removeFromWishlistApi(session: ApiSession, productId: string) {
  const response = await apiClient.delete(`/wishlist/remove/${productId}`, {
    headers: authHeaders(session),
  });
  return unwrapData<WishlistResponse>(response);
}

export async function clearWishlistApi(session: ApiSession) {
  try {
    await apiClient.delete('/wishlist/clear', { headers: authHeaders(session) });
  } catch (error) {
    const status = (error as { response?: { status?: number } })?.response?.status;
    if (status !== 404) {
      throw error;
    }
  }
}

export async function ensureEmptyWishlist(session: ApiSession) {
  await clearWishlistApi(session);
  const wishlist = await getWishlistApi(session);
  const remaining = wishlist?.items ?? [];
  if (remaining.length > 0) {
    for (const item of remaining) {
      const productId = resolveRefId(item.productId);
      if (productId) {
        await removeFromWishlistApi(session, productId);
      }
    }
  }
}
