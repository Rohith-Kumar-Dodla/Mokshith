import path from 'path';
import { apiClient } from './apiClient';
import { authHeaders, type ApiSession } from './auth.api.helper';
import {
  createProductApi,
  deleteProductApi,
  getFirstCategoryId,
  patchProductStatusApi,
  resolveRefId,
  updateProductApi,
  type ProductPayload,
} from './product.api.helper';
import { uniqueProductName } from './product.credentials';
import { getCartApi } from './cart.api.helper';

export const NONEXISTENT_OBJECT_ID = '000000000000000000000001';

const VALID_IMAGE = path.resolve(process.cwd(), 'tests/test-data/products/valid-sample.png');

export type SeededProduct = {
  id: string;
  name: string;
  price: number;
  moq: number;
  stock: number;
};

export type CartSeedData = {
  categoryId: string;
  standard: SeededProduct;
  bulk: SeededProduct;
  second: SeededProduct;
  third: SeededProduct;
  fourth: SeededProduct;
  oos: SeededProduct;
  moq5: SeededProduct;
  moq7: SeededProduct;
  lowStock: SeededProduct;
  stockCap: SeededProduct;
  inactive: SeededProduct;
  imageProduct: SeededProduct;
};

function toSeeded(created: Record<string, unknown>, fallback: ProductPayload): SeededProduct {
  return {
    id: String(created._id || created.id),
    name: String(created.name ?? fallback.name),
    price: Number(created.price ?? fallback.price),
    moq: Number(created.moq ?? fallback.moq ?? 1),
    stock: Number(created.stock ?? fallback.stock ?? 0),
  };
}

export async function seedCartFunctionalProducts(
  adminSession: ApiSession
): Promise<CartSeedData> {
  const categoryId = await getFirstCategoryId(adminSession);

  const mk = async (prefix: string, payload: ProductPayload, imagePath?: string) => {
    const created = (await createProductApi(adminSession, payload, imagePath)) as Record<
      string,
      unknown
    >;
    return toSeeded(created, payload);
  };

  const standard = await mk('pf-cart-std', {
    name: uniqueProductName('pf-cart-std'),
    price: 100,
    categoryId,
    stock: 100,
    moq: 1,
  });

  const bulk = await mk('pf-cart-bulk', {
    name: uniqueProductName('pf-cart-bulk'),
    price: 100,
    categoryId,
    stock: 100,
    moq: 1,
    bulkPricing: [
      { minQuantity: 10, price: 90 },
      { minQuantity: 25, price: 80 },
    ],
  });

  const second = await mk('pf-cart-2', {
    name: uniqueProductName('pf-cart-2'),
    price: 200,
    categoryId,
    stock: 80,
    moq: 1,
  });

  const third = await mk('pf-cart-3', {
    name: uniqueProductName('pf-cart-3'),
    price: 150,
    categoryId,
    stock: 60,
    moq: 1,
  });

  const fourth = await mk('pf-cart-4', {
    name: uniqueProductName('pf-cart-4'),
    price: 175,
    categoryId,
    stock: 40,
    moq: 1,
  });

  const oos = await mk('pf-cart-oos', {
    name: uniqueProductName('pf-cart-oos'),
    price: 50,
    categoryId,
    stock: 0,
    moq: 1,
  });

  const moq5 = await mk('pf-cart-moq5', {
    name: uniqueProductName('pf-cart-moq5'),
    price: 60,
    categoryId,
    stock: 50,
    moq: 5,
  });

  const moq7 = await mk('pf-cart-moq7', {
    name: uniqueProductName('pf-cart-moq7'),
    price: 70,
    categoryId,
    stock: 50,
    moq: 7,
  });

  const lowStock = await mk('pf-cart-low', {
    name: uniqueProductName('pf-cart-low'),
    price: 55,
    categoryId,
    stock: 5,
    moq: 10,
  });

  const stockCap = await mk('pf-cart-cap', {
    name: uniqueProductName('pf-cart-cap'),
    price: 65,
    categoryId,
    stock: 50,
    moq: 1,
  });

  const inactiveCreated = await mk('pf-cart-inact', {
    name: uniqueProductName('pf-cart-inact'),
    price: 45,
    categoryId,
    stock: 10,
    moq: 1,
    isActive: true,
  });
  await patchProductStatusApi(adminSession, inactiveCreated.id, false);
  const inactive = { ...inactiveCreated };

  const imageProduct = await mk(
    'pf-cart-img',
    {
      name: uniqueProductName('pf-cart-img'),
      price: 120,
      categoryId,
      stock: 30,
      moq: 1,
    },
    VALID_IMAGE
  );

  return {
    categoryId,
    standard,
    bulk,
    second,
    third,
    fourth,
    oos,
    moq5,
    moq7,
    lowStock,
    stockCap,
    inactive,
    imageProduct,
  };
}

export async function addToWishlistApi(session: ApiSession, productId: string) {
  const response = await apiClient.post(
    '/wishlist/add',
    { productId },
    { headers: authHeaders(session) }
  );
  const body = response.data as { data?: unknown } & Record<string, unknown>;
  return body?.data ?? body;
}

export async function createOrderApi(
  session: ApiSession,
  payload: {
    paymentMethod: string;
    shippingAddress: Record<string, string>;
    idempotencyKey?: string;
  }
) {
  const response = await apiClient.post('/orders', payload, {
    headers: {
      ...authHeaders(session),
      ...(payload.idempotencyKey ? { 'Idempotency-Key': payload.idempotencyKey } : {}),
    },
  });
  const body = response.data as { data?: unknown } & Record<string, unknown>;
  return body?.data ?? body;
}

export function buildShippingAddress() {
  return {
    name: 'Cart Functional Vendor',
    phone: '9000000101',
    addressLine: '123 Certification Street',
    city: 'Hyderabad',
    state: 'Telangana',
    pincode: '500001',
  };
}

export function parseRupee(text: string): number {
  const normalized = text.replace(/[₹,\s]/g, '');
  return Number(normalized);
}

/** Discount rows render as `-₹100.00`; compare absolute savings amount. */
export function parseDiscountRupee(text: string): number {
  return Math.abs(parseRupee(text));
}

export async function getCartLineQuantity(
  session: ApiSession,
  productId: string
): Promise<number> {
  const cart = await getCartApi(session);
  const line = cart?.items?.find(
    (item) => resolveRefId(item.productId) === productId
  );
  return Number(line?.quantity ?? 0);
}

export async function disposeProduct(adminSession: ApiSession, productId: string) {
  try {
    await deleteProductApi(adminSession, productId);
  } catch {
    // best-effort cleanup
  }
}
