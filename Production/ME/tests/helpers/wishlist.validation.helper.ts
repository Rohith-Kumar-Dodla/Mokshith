import { execSync } from 'child_process';
import path from 'path';
import { apiClient } from './apiClient';
import { authHeaders, type ApiSession } from './auth.api.helper';
import {
  createProductApi,
  getFirstCategoryId,
  patchProductStatusApi,
  type ProductPayload,
} from './product.api.helper';
import { uniqueProductName } from './product.credentials';
import {
  API_BASE,
  apiJson,
  messageOf,
  type ApiResult,
} from './validation/product.validation.helper';

export { messageOf };
export { INVALID_OBJECT_ID, NONEXISTENT_OBJECT_ID } from './validation/product.validation.helper';

export type SeededWishlistValidationProduct = {
  id: string;
  name: string;
  price: number;
  moq: number;
  stock: number;
};

export type WishlistValidationSeed = {
  categoryId: string;
  standard: SeededWishlistValidationProduct;
  second: SeededWishlistValidationProduct;
  oos: SeededWishlistValidationProduct;
  moq5: SeededWishlistValidationProduct;
  lowStock: SeededWishlistValidationProduct;
  inactive: SeededWishlistValidationProduct;
};

function toSeeded(
  created: Record<string, unknown>,
  fallback: ProductPayload
): SeededWishlistValidationProduct {
  return {
    id: String(created._id || created.id),
    name: String(created.name ?? fallback.name),
    price: Number(created.price ?? fallback.price),
    moq: Number(created.moq ?? fallback.moq ?? 1),
    stock: Number(created.stock ?? fallback.stock ?? 0),
  };
}

export function clearWishlistValidationRateLimits(): void {
  try {
    const script = path.resolve(process.cwd(), '..', 'b2b-backend', 'scripts', 'clearAuthRateLimits.js');
    execSync(`node "${script}"`, { stdio: 'ignore' });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.warn('Warning: failed to clear wishlist validation rate limits:', message);
  }
}

export async function seedWishlistValidationProducts(
  adminSession: ApiSession
): Promise<WishlistValidationSeed> {
  const categoryId = await getFirstCategoryId(adminSession);

  const mk = async (prefix: string, payload: ProductPayload) => {
    const created = (await createProductApi(adminSession, payload)) as Record<string, unknown>;
    return toSeeded(created, payload);
  };

  const standard = await mk('pv-wl-std', {
    name: uniqueProductName('pv-wl-std'),
    price: 120,
    categoryId,
    stock: 100,
    moq: 1,
  });

  const second = await mk('pv-wl-2', {
    name: uniqueProductName('pv-wl-2'),
    price: 130,
    categoryId,
    stock: 80,
    moq: 1,
  });

  const oos = await mk('pv-wl-oos', {
    name: uniqueProductName('pv-wl-oos'),
    price: 50,
    categoryId,
    stock: 0,
    moq: 1,
  });

  const moq5 = await mk('pv-wl-moq5', {
    name: uniqueProductName('pv-wl-moq5'),
    price: 60,
    categoryId,
    stock: 50,
    moq: 5,
  });

  const lowStock = await mk('pv-wl-low', {
    name: uniqueProductName('pv-wl-low'),
    price: 55,
    categoryId,
    stock: 5,
    moq: 10,
  });

  const inactiveCreated = await mk('pv-wl-inact', {
    name: uniqueProductName('pv-wl-inact'),
    price: 45,
    categoryId,
    stock: 10,
    moq: 1,
    isActive: true,
  });
  await patchProductStatusApi(adminSession, inactiveCreated.id, false);

  return {
    categoryId,
    standard,
    second,
    oos,
    moq5,
    lowStock,
    inactive: { ...inactiveCreated },
  };
}

export async function postWishlistAddApi(
  session: ApiSession | undefined,
  body: Record<string, unknown> | unknown
): Promise<ApiResult> {
  return apiJson(session, 'POST', '/wishlist/add', body);
}

export async function getWishlistValidationApi(session: ApiSession): Promise<ApiResult> {
  return apiJson(session, 'GET', '/wishlist');
}

export async function deleteWishlistItemValidationApi(
  session: ApiSession | undefined,
  productId: string
): Promise<ApiResult> {
  return apiJson(session, 'DELETE', `/wishlist/remove/${productId}`);
}

export async function clearWishlistValidationApi(session: ApiSession): Promise<ApiResult> {
  return apiJson(session, 'DELETE', '/wishlist/clear');
}

/** Raw HTTP helpers for Content-Type / invalid JSON edge cases. */
export async function postWishlistRawFetch(
  session: ApiSession,
  options: {
    body: string;
    contentType?: string;
  }
): Promise<ApiResult> {
  const response = await fetch(`${API_BASE}/wishlist/add`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${session.accessToken}`,
      'x-csrf-token': session.csrfToken,
      Cookie: `csrf-token=${session.csrfToken}`,
      ...(options.contentType ? { 'Content-Type': options.contentType } : {}),
    },
    body: options.body,
  });
  const body = (await response.json().catch(() => ({}))) as Record<string, unknown>;
  return { status: response.status, body };
}

export function wishlistItemsFromResult(result: ApiResult): unknown[] {
  const data = (result.body?.data ?? result.body) as { items?: unknown[] };
  return Array.isArray(data?.items) ? data.items : [];
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

export { authHeaders, apiClient };
