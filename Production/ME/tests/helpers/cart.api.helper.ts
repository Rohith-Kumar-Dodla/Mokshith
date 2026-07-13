import { apiClient } from './apiClient';
import { authHeaders, type ApiSession } from './auth.api.helper';
import {
  addToCartApi,
  resolveRefId,
} from './product.api.helper';

export { addToCartApi };

function unwrapData<T>(response: { data?: { data?: T; success?: boolean } & T }): T {
  const body = response.data as { data?: T } & T;
  return (body?.data ?? body) as T;
}

export type CartResponse = {
  _id?: string;
  id?: string;
  items?: Array<{
    productId?: string | { _id?: string; id?: string; name?: string };
    quantity?: number;
  }>;
};

export async function getCartApi(session: ApiSession): Promise<CartResponse | null> {
  const response = await apiClient.get('/cart', { headers: authHeaders(session) });
  return unwrapData<CartResponse | null>(response);
}

export async function removeFromCartApi(session: ApiSession, productId: string) {
  const response = await apiClient.delete(`/cart/${productId}`, {
    headers: authHeaders(session),
  });
  return unwrapData(response);
}

export async function clearCartApi(session: ApiSession) {
  const cart = await getCartApi(session);
  if (!cart?.items?.length) {
    return;
  }

  for (const item of cart.items) {
    const productId = resolveRefId(item.productId);
    if (productId) {
      await removeFromCartApi(session, productId);
    }
  }
}
