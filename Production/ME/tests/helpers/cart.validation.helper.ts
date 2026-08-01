import { execSync } from 'child_process';
import path from 'path';
import { type Page } from '@playwright/test';
import { apiClient } from './apiClient';
import { authHeaders, type ApiSession } from './auth.api.helper';
import { type SeededProduct } from './cart.functional.helper';
import {
  createProductApi,
  type ProductPayload,
} from './product.api.helper';
import { uniqueProductName } from './product.credentials';
import {
  apiJson,
  messageOf,
  type ApiResult,
  uniqueValidationName,
} from './validation/product.validation.helper';

/**
 * Clears Redis auth/fraud/order rate-limit keys before validation suites.
 * Deterministic test maintenance — does not weaken production rate limiting.
 */
export function clearValidationRateLimits(): void {
  try {
    const script = path.resolve(process.cwd(), '..', 'b2b-backend', 'scripts', 'clearAuthRateLimits.js');
    const redisUrl =
      !process.env.REDIS_URL || String(process.env.REDIS_URL).includes('upstash')
        ? process.env.PLAYWRIGHT_REDIS_URL || 'redis://127.0.0.1:6379'
        : process.env.REDIS_URL;
    execSync(`node "${script}"`, {
      stdio: 'ignore',
      env: { ...process.env, REDIS_URL: redisUrl },
      timeout: 20000,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.warn('Warning: failed to clear validation rate limits:', message);
  }
}

export { messageOf };

export async function postCartApi(
  session: ApiSession | undefined,
  body: Record<string, unknown>
): Promise<ApiResult> {
  return apiJson(session, 'POST', '/cart', body);
}

export async function deleteCartApi(
  session: ApiSession,
  productId: string
): Promise<ApiResult> {
  return apiJson(session, 'DELETE', `/cart/${productId}`);
}

export async function fillCheckoutAddress(page: Page) {
  await page.getByPlaceholder('Enter your complete delivery address').fill('123 Certification Street');
  const cityInput = page.locator('label', { hasText: 'City' }).locator('..').locator('input');
  const stateInput = page.locator('label', { hasText: 'State' }).locator('..').locator('input');
  const pincodeInput = page.locator('label', { hasText: 'Pincode' }).locator('..').locator('input');
  await cityInput.fill('Hyderabad');
  await stateInput.fill('Telangana');
  await pincodeInput.fill('500001');
  const phoneInput = page.locator('label', { hasText: 'Phone Number' }).locator('..').locator('input');
  await phoneInput.fill('9000000101');
}

function toSeeded(created: Record<string, unknown>, fallback: ProductPayload): SeededProduct {
  return {
    id: String(created._id || created.id),
    name: String(created.name ?? fallback.name),
    price: Number(created.price ?? fallback.price),
    moq: Number(created.moq ?? fallback.moq ?? 1),
    stock: Number(created.stock ?? fallback.stock ?? 0),
  };
}

export type CartValidationExtras = {
  moqSplit: SeededProduct;
  stockExact: SeededProduct;
  moq10: SeededProduct;
};

export async function seedCartValidationExtras(
  adminSession: ApiSession,
  categoryId: string
): Promise<CartValidationExtras> {
  const moqSplitResult = await apiJson(adminSession, 'POST', '/products', {
    name: uniqueValidationName('pv-cart-moq-split'),
    price: 100,
    categoryId,
    stock: 50,
    moq: 3,
    minOrderQty: 10,
  });
  const moqSplitCreated = (moqSplitResult.body?.data ?? moqSplitResult.body) as Record<string, unknown>;
  const moqSplit = toSeeded(moqSplitCreated, {
    name: 'moq-split',
    price: 100,
    categoryId,
    stock: 50,
    moq: 3,
  });

  const stockExact = toSeeded(
    (await createProductApi(adminSession, {
      name: uniqueProductName('pv-cart-stock-exact'),
      price: 80,
      categoryId,
      stock: 5,
      moq: 5,
    })) as Record<string, unknown>,
    { name: 'stock-exact', price: 80, categoryId, stock: 5, moq: 5 }
  );

  const moq10 = toSeeded(
    (await createProductApi(adminSession, {
      name: uniqueProductName('pv-cart-moq10'),
      price: 90,
      categoryId,
      stock: 100,
      moq: 10,
    })) as Record<string, unknown>,
    { name: 'moq10', price: 90, categoryId, stock: 100, moq: 10 }
  );

  return { moqSplit, stockExact, moq10 };
}

export function buildOrderPayload(shippingAddress: Record<string, string>, paymentMethod = 'COD') {
  return {
    paymentMethod,
    shippingAddress,
    idempotencyKey: `pv-cart-order-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
  };
}

export async function clearWishlistApi(session: ApiSession) {
  await apiClient.delete('/wishlist/clear', { headers: authHeaders(session) });
}

export async function setDetailsQuantityInput(page: Page, value: string) {
  const input = page
    .locator('div.bg-white')
    .filter({ has: page.locator('h1') })
    .first()
    .locator('input[type="number"]')
    .first();
  await input.evaluate((el, nextValue) => {
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set;
    setter?.call(el, nextValue);
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
  }, value);
}
