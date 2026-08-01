import {
  createProductApi,
  getFirstCategoryId,
  patchProductStatusApi,
  resolveRefId,
  type ProductPayload,
} from './product.api.helper';
import { uniqueProductName } from './product.credentials';
import { authHeaders, type ApiSession } from './auth.api.helper';
import {
  addToWishlistApi,
  getWishlistApi,
  type WishlistResponse,
} from './wishlist.api.helper';
import { apiClient } from './apiClient';

export type SeededWishlistProduct = {
  id: string;
  name: string;
  price: number;
  moq: number;
  stock: number;
};

export type WishlistSeedData = {
  categoryId: string;
  standard: SeededWishlistProduct;
  second: SeededWishlistProduct;
  third: SeededWishlistProduct;
  oos: SeededWishlistProduct;
  moq5: SeededWishlistProduct;
  lowStock: SeededWishlistProduct;
  inactive: SeededWishlistProduct;
};

function toSeeded(created: Record<string, unknown>, fallback: ProductPayload): SeededWishlistProduct {
  return {
    id: String(created._id || created.id),
    name: String(created.name ?? fallback.name),
    price: Number(created.price ?? fallback.price),
    moq: Number(created.moq ?? fallback.moq ?? 1),
    stock: Number(created.stock ?? fallback.stock ?? 0),
  };
}

export async function seedWishlistFunctionalProducts(
  adminSession: ApiSession
): Promise<WishlistSeedData> {
  const categoryId = await getFirstCategoryId(adminSession);

  const mk = async (prefix: string, payload: ProductPayload) => {
    const created = (await createProductApi(adminSession, payload)) as Record<string, unknown>;
    return toSeeded(created, payload);
  };

  const standard = await mk('pf-wl-std', {
    name: uniqueProductName('pf-wl-std'),
    price: 120,
    categoryId,
    stock: 100,
    moq: 1,
  });

  const second = await mk('pf-wl-2', {
    name: uniqueProductName('pf-wl-2'),
    price: 130,
    categoryId,
    stock: 80,
    moq: 1,
  });

  const third = await mk('pf-wl-3', {
    name: uniqueProductName('pf-wl-3'),
    price: 140,
    categoryId,
    stock: 60,
    moq: 1,
  });

  const oos = await mk('pf-wl-oos', {
    name: uniqueProductName('pf-wl-oos'),
    price: 50,
    categoryId,
    stock: 0,
    moq: 1,
  });

  const moq5 = await mk('pf-wl-moq5', {
    name: uniqueProductName('pf-wl-moq5'),
    price: 60,
    categoryId,
    stock: 50,
    moq: 5,
  });

  const lowStock = await mk('pf-wl-low', {
    name: uniqueProductName('pf-wl-low'),
    price: 55,
    categoryId,
    stock: 5,
    moq: 10,
  });

  const inactiveCreated = await mk('pf-wl-inact', {
    name: uniqueProductName('pf-wl-inact'),
    price: 45,
    categoryId,
    stock: 10,
    moq: 1,
    isActive: true,
  });
  await patchProductStatusApi(adminSession, inactiveCreated.id, false);
  const inactive = { ...inactiveCreated };

  return {
    categoryId,
    standard,
    second,
    third,
    oos,
    moq5,
    lowStock,
    inactive,
  };
}

export async function getWishlistItemCount(session: ApiSession): Promise<number> {
  const wishlist = await getWishlistApi(session);
  return wishlist?.items?.length ?? 0;
}

export async function wishlistContainsProduct(
  session: ApiSession,
  productId: string
): Promise<boolean> {
  const wishlist = await getWishlistApi(session);
  return (wishlist?.items ?? []).some((item) => resolveRefId(item.productId) === productId);
}

export async function duplicateAddWishlistApi(
  session: ApiSession,
  productId: string
): Promise<WishlistResponse> {
  await addToWishlistApi(session, productId);
  return addToWishlistApi(session, productId);
}

export async function addManyToWishlistApi(session: ApiSession, productIds: string[]) {
  for (const productId of productIds) {
    await addToWishlistApi(session, productId);
  }
}

export async function interceptWishlistLoad(
  page: import('@playwright/test').Page,
  handler: (route: import('@playwright/test').Route) => Promise<void>
) {
  await page.route('**/api/v1/wishlist**', handler);
}

export async function interceptWishlistLoadFailure(page: import('@playwright/test').Page) {
  await page.route('**/api/v1/wishlist', async (route) => {
    if (route.request().method() === 'GET') {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ success: false, message: 'Wishlist unavailable' }),
      });
      return;
    }
    await route.continue();
  });
}

export async function postWishlistAddRaw(
  session: ApiSession,
  body: Record<string, unknown>
) {
  return apiClient.post('/wishlist/add', body, { headers: authHeaders(session) });
}
