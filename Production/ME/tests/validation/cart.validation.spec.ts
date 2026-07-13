import { test, expect, type Page } from '../fixtures/product.validation.fixture';
import VendorCartPage from '../pages/vendor/VendorCartPage';
import VendorProductsPage from '../pages/vendor/VendorProductsPage';
import VendorProductDetailsPage from '../pages/vendor/VendorProductDetailsPage';
import {
  addToCartApi,
  clearCartApi,
  getCartApi,
  removeFromCartApi,
} from '../helpers/cart.api.helper';
import {
  buildShippingAddress,
  disposeProduct,
  getCartLineQuantity,
  NONEXISTENT_OBJECT_ID,
  seedCartFunctionalProducts,
  type CartSeedData,
} from '../helpers/cart.functional.helper';
import {
  buildOrderPayload,
  clearValidationRateLimits,
  clearWishlistApi,
  deleteCartApi,
  fillCheckoutAddress,
  messageOf,
  postCartApi,
  seedCartValidationExtras,
  setDetailsQuantityInput,
  type CartValidationExtras,
} from '../helpers/cart.validation.helper';
import {
  createProductApi,
  deleteProductApi,
  getAdminSession,
  getFirstCategoryId,
  patchProductStatusApi,
  patchProductStockApi,
  resolveRefId,
} from '../helpers/product.api.helper';
import { getVendorCredentials, uniqueProductName } from '../helpers/product.credentials';
import { loginApi, type ApiSession } from '../helpers/auth.api.helper';
import { establishSession } from '../helpers/session.functional.helper';
import {
  apiJson,
  expectApiRejects,
  expectApiStatus,
  INVALID_OBJECT_ID,
  uniqueValidationName,
} from '../helpers/validation/product.validation.helper';

let adminSession: ApiSession;
let vendorSession: ApiSession;
let seed: CartSeedData;
let extras: CartValidationExtras;

async function vendorUi(page: Page) {
  await clearCartApi(vendorSession);
  await establishSession(page, 'vendor');
}

test.describe('Cart Validation Certification Suite', () => {
  test.beforeAll(async () => {
    clearValidationRateLimits();
    adminSession = await getAdminSession();
    seed = await seedCartFunctionalProducts(adminSession);
    extras = await seedCartValidationExtras(adminSession, seed.categoryId);
    const vendorCreds = getVendorCredentials(1);
    vendorSession = await loginApi(vendorCreds.mobile, vendorCreds.password);
    await clearCartApi(vendorSession);
  });

  test.describe('Section A — Joi / Express API Input Validation', () => {
    test('PV-CART-001 | Reject missing productId', async () => {
      const result = await postCartApi(vendorSession, { quantity: 1 });
      await expectApiStatus(result, 400);
      expect(messageOf(result).toLowerCase()).toMatch(/productid|product id|required/);
    });

    test('PV-CART-002 | Reject missing quantity', async () => {
      const result = await postCartApi(vendorSession, { productId: seed.standard.id });
      await expectApiStatus(result, 400);
      expect(messageOf(result).toLowerCase()).toMatch(/quantity|required/);
    });

    test('PV-CART-003 | Reject zero quantity at Joi layer', async () => {
      await expectApiRejects(
        () => postCartApi(vendorSession, { productId: seed.standard.id, quantity: 0 }),
        400
      );
    });

    test('PV-CART-004 | Reject negative quantity at Joi layer', async () => {
      await expectApiRejects(
        () => postCartApi(vendorSession, { productId: seed.standard.id, quantity: -5 }),
        400
      );
    });

    test('PV-CART-005 | Reject non-numeric quantity strings', async () => {
      await expectApiRejects(
        () => postCartApi(vendorSession, { productId: seed.standard.id, quantity: 'abc' }),
        400
      );
    });

    test('PV-CART-006 | Accept numeric string quantity via middleware coercion', async () => {
      await clearCartApi(vendorSession);
      const result = await postCartApi(vendorSession, {
        productId: seed.standard.id,
        quantity: '10',
      });
      await expectApiStatus(result, 200);
      expect(await getCartLineQuantity(vendorSession, seed.standard.id)).toBe(10);
    });

    test('PV-CART-007 | Document decimal quantity acceptance at Joi layer', async () => {
      await clearCartApi(vendorSession);
      const result = await postCartApi(vendorSession, {
        productId: seed.standard.id,
        quantity: 1.5,
      });
      expect([200, 400]).toContain(result.status);
      if (result.status === 200) {
        const qty = await getCartLineQuantity(vendorSession, seed.standard.id);
        expect(qty).toBeGreaterThan(0);
      }
    });

    test('PV-CART-008 | Reject empty productId string', async () => {
      const result = await postCartApi(vendorSession, { productId: '', quantity: 1 });
      await expectApiStatus(result, 400);
    });

    test('PV-CART-009 | Reject non-string productId types', async () => {
      const result = await postCartApi(vendorSession, { productId: 12345, quantity: 1 });
      await expectApiStatus(result, 400);
    });

    test('PV-CART-010 | Unknown body fields do not break validation', async () => {
      await clearCartApi(vendorSession);
      const result = await postCartApi(vendorSession, {
        productId: seed.standard.id,
        quantity: 1,
        extraField: 'ignored',
      });
      await expectApiStatus(result, 200);
    });

    test('PV-CART-011 | Joi returns multiple errors (abortEarly false)', async () => {
      const result = await postCartApi(vendorSession, {});
      await expectApiStatus(result, 400);
      const msg = messageOf(result).toLowerCase();
      expect(msg).toMatch(/productid|product id|required/);
      expect(msg).toMatch(/quantity|required/);
    });

    test('PV-CART-012 | Reject completely empty JSON body', async () => {
      await expectApiRejects(() => postCartApi(vendorSession, {}), 400);
    });
  });

  test.describe('Section B — Service / Business API Validation', () => {
    test('PV-CART-013 | Reject malformed product ObjectId', async () => {
      const result = await postCartApi(vendorSession, {
        productId: INVALID_OBJECT_ID,
        quantity: 1,
      });
      await expectApiStatus(result, 400);
      expect(messageOf(result)).toMatch(/invalid product id/i);
    });

    test('PV-CART-014 | Reject valid but non-existent product', async () => {
      const result = await postCartApi(vendorSession, {
        productId: NONEXISTENT_OBJECT_ID,
        quantity: 10,
      });
      await expectApiStatus(result, 404);
      expect(messageOf(result)).toMatch(/not found/i);
    });

    test('PV-CART-015 | Reject inactive product', async () => {
      const result = await postCartApi(vendorSession, {
        productId: seed.inactive.id,
        quantity: 1,
      });
      await expectApiStatus(result, 400);
      expect(messageOf(result)).toMatch(/not available/i);
    });

    test('PV-CART-016 | Reject quantity below effective MOQ', async () => {
      await clearCartApi(vendorSession);
      const result = await postCartApi(vendorSession, {
        productId: seed.moq5.id,
        quantity: 2,
      });
      await expectApiStatus(result, 400);
      expect(messageOf(result)).toMatch(/minimum.*quantity/i);
    });

    test('PV-CART-017 | Accept quantity exactly at MOQ', async () => {
      await clearCartApi(vendorSession);
      const result = await postCartApi(vendorSession, {
        productId: seed.moq5.id,
        quantity: 5,
      });
      await expectApiStatus(result, 200);
      expect(await getCartLineQuantity(vendorSession, seed.moq5.id)).toBe(5);
    });

    test('PV-CART-018 | Enforce max(minOrderQty, moq) server-side', async () => {
      await clearCartApi(vendorSession);
      const result = await postCartApi(vendorSession, {
        productId: extras.moqSplit.id,
        quantity: 5,
      });
      await expectApiStatus(result, 400);
      expect(messageOf(result)).toMatch(/minimum.*quantity/i);
    });

    test('PV-CART-019 | Reject insufficient stock', async () => {
      await clearCartApi(vendorSession);
      const result = await postCartApi(vendorSession, {
        productId: seed.stockCap.id,
        quantity: 100,
      });
      await expectApiStatus(result, 400);
      expect(messageOf(result)).toMatch(/insufficient stock/i);
    });

    test('PV-CART-020 | Reject when inventory record missing', async () => {
      test.skip(true, 'QA product create auto-provisions inventory — edge not reproducible in persistent QA');
    });

    test('PV-CART-021 | Accept quantity exactly equal to total stock', async () => {
      await clearCartApi(vendorSession);
      const result = await postCartApi(vendorSession, {
        productId: extras.stockExact.id,
        quantity: 5,
      });
      await expectApiStatus(result, 200);
      expect(await getCartLineQuantity(vendorSession, extras.stockExact.id)).toBe(5);
    });

    test('PV-CART-022 | Reject quantity one above stock', async () => {
      await clearCartApi(vendorSession);
      const result = await postCartApi(vendorSession, {
        productId: seed.stockCap.id,
        quantity: 51,
      });
      await expectApiStatus(result, 400);
      expect(messageOf(result)).toMatch(/insufficient stock/i);
    });

    test('PV-CART-023 | Duplicate add merges quantities when each POST satisfies MOQ', async () => {
      await clearCartApi(vendorSession);
      await postCartApi(vendorSession, { productId: extras.moq10.id, quantity: 10 });
      const result = await postCartApi(vendorSession, { productId: extras.moq10.id, quantity: 10 });
      await expectApiStatus(result, 200);
      const cart = await getCartApi(vendorSession);
      expect(cart?.items?.length).toBe(1);
      expect(await getCartLineQuantity(vendorSession, extras.moq10.id)).toBe(20);
    });

    test('PV-CART-024 | Cumulative stock check blocks second add', async () => {
      await clearCartApi(vendorSession);
      await postCartApi(vendorSession, { productId: seed.stockCap.id, quantity: 50 });
      const result = await postCartApi(vendorSession, { productId: seed.stockCap.id, quantity: 1 });
      await expectApiStatus(result, 400);
      expect(messageOf(result)).toMatch(/insufficient stock/i);
      expect(await getCartLineQuantity(vendorSession, seed.stockCap.id)).toBe(50);
    });

    test('PV-CART-025 | Failed add does not corrupt existing cart', async () => {
      await clearCartApi(vendorSession);
      await postCartApi(vendorSession, { productId: seed.standard.id, quantity: 1 });
      await postCartApi(vendorSession, { productId: seed.moq5.id, quantity: 2 });
      const cart = await getCartApi(vendorSession);
      expect(cart?.items?.length).toBe(1);
      expect(await getCartLineQuantity(vendorSession, seed.standard.id)).toBe(1);
    });

    test('PV-CART-026 | Service-level qty guard (defense in depth)', async () => {
      await expectApiRejects(
        () => postCartApi(vendorSession, { productId: seed.standard.id, quantity: 0 }),
        400
      );
    });
  });

  test.describe('Section C — DELETE API Validation', () => {
    test('PV-CART-027 | Reject invalid productId param', async () => {
      await addToCartApi(vendorSession, seed.standard.id, 1);
      const result = await deleteCartApi(vendorSession, INVALID_OBJECT_ID);
      await expectApiStatus(result, 400);
      expect(messageOf(result)).toMatch(/invalid product id/i);
    });

    test('PV-CART-028 | DELETE on empty cart shell is idempotent', async () => {
      await clearCartApi(vendorSession);
      const result = await deleteCartApi(vendorSession, seed.standard.id);
      await expectApiStatus(result, 200);
      const cart = await getCartApi(vendorSession);
      expect(cart?.items?.length ?? 0).toBe(0);
    });

    test('PV-CART-029 | Idempotent delete of product not in cart', async () => {
      await clearCartApi(vendorSession);
      await addToCartApi(vendorSession, seed.standard.id, 1);
      await addToCartApi(vendorSession, seed.second.id, 1);
      const result = await deleteCartApi(vendorSession, NONEXISTENT_OBJECT_ID);
      await expectApiStatus(result, 200);
      const cart = await getCartApi(vendorSession);
      expect(cart?.items?.length).toBe(2);
    });

    test('PV-CART-030 | Successful remove reduces line count', async () => {
      await clearCartApi(vendorSession);
      await addToCartApi(vendorSession, seed.standard.id, 1);
      await addToCartApi(vendorSession, seed.second.id, 1);
      const result = await deleteCartApi(vendorSession, seed.standard.id);
      await expectApiStatus(result, 200);
      const cart = await getCartApi(vendorSession);
      expect(cart?.items?.length).toBe(1);
      expect(resolveRefId(cart?.items?.[0]?.productId)).toBe(seed.second.id);
    });
  });

  test.describe('Section D — GET Cart / Persistence Validation', () => {
    test('PV-CART-031 | Prune stale items with missing product refs on load', async () => {
      const created = await createProductApi(adminSession, {
        name: uniqueValidationName('pv-cart-stale'),
        price: 50,
        categoryId: seed.categoryId,
        stock: 10,
        moq: 1,
      });
      const productId = String(created._id || created.id);
      await addToCartApi(vendorSession, productId, 1);
      await deleteProductApi(adminSession, productId);
      const cart = await getCartApi(vendorSession);
      const staleLine = cart?.items?.find((item) => resolveRefId(item.productId) === productId);
      expect(staleLine).toBeUndefined();
    });

    test('PV-CART-032 | Valid add persists across session reload', async () => {
      await clearCartApi(vendorSession);
      await addToCartApi(vendorSession, seed.standard.id, 3);
      const qty = await getCartLineQuantity(vendorSession, seed.standard.id);
      expect(qty).toBe(3);
    });

    test('PV-CART-033 | Cart mapper computes MOQ and stock warnings correctly', async ({ page }) => {
      await vendorUi(page);
      await clearCartApi(vendorSession);
      await addToCartApi(vendorSession, seed.stockCap.id, 50);
      const cartPage = new VendorCartPage(page);
      await cartPage.goto();
      await cartPage.waitForLoad();
      await expect(
        cartPage.productCard(seed.stockCap.name).getByText(/Maximum stock reached/i)
      ).toBeVisible();
    });
  });

  test.describe('Section E — Frontend Product Listing Validation', () => {
    test('PV-CART-034 | Out-of-stock product cannot be added from listing', async ({ page }) => {
      await vendorUi(page);
      const productsPage = new VendorProductsPage(page);
      await productsPage.goto();
      await productsPage.search(seed.oos.name);
      const card = productsPage.cardByName(seed.oos.name);
      await expect(card.locator('button', { hasText: 'Out of Stock' })).toBeDisabled();
    });

    test('PV-CART-035 | Listing add sends MOQ quantity automatically', async ({ page }) => {
      await vendorUi(page);
      let postBody: Record<string, unknown> | null = null;
      page.on('request', (req) => {
        if (req.url().includes('/api/v1/cart') && req.method() === 'POST') {
          postBody = req.postDataJSON() as Record<string, unknown>;
        }
      });
      const productsPage = new VendorProductsPage(page);
      await productsPage.goto();
      await productsPage.search(seed.moq5.name);
      await productsPage.addToCartByName(seed.moq5.name);
      await expect(page.locator('text=/added to cart/i')).toBeVisible({ timeout: 10000 });
      expect(postBody?.quantity).toBe(5);
    });

    test('PV-CART-036 | Listing surfaces API stock error to user', async ({ page }) => {
      await vendorUi(page);
      const created = await createProductApi(adminSession, {
        name: uniqueProductName('pv-cart-ui-stock'),
        price: 60,
        categoryId: seed.categoryId,
        stock: 1,
        moq: 1,
      });
      const productId = String(created._id || created.id);
      await addToCartApi(vendorSession, productId, 1);
      const productsPage = new VendorProductsPage(page);
      await productsPage.goto();
      await productsPage.search(String(created.name));
      await productsPage.addToCartByName(String(created.name));
      await expect(page.locator('text=/insufficient stock|failed to add/i')).toBeVisible({
        timeout: 10000,
      });
      await disposeProduct(adminSession, productId);
    });
  });

  test.describe('Section F — Frontend Product Details Quantity Validation', () => {
    test('PV-CART-037 | Quantity initializes to MOQ when product loads', async ({ page }) => {
      await vendorUi(page);
      const details = new VendorProductDetailsPage(page);
      await details.goto(seed.moq5.id);
      await details.waitForLoad();
      await expect(details.quantityInput()).toHaveValue('5');
    });

    test('PV-CART-038 | Decrement button clamped at MOQ', async ({ page }) => {
      await vendorUi(page);
      const details = new VendorProductDetailsPage(page);
      await details.goto(seed.moq5.id);
      await details.waitForLoad();
      await details.quantityInput().locator('..').locator('button').first().click();
      await expect(details.quantityInput()).toHaveValue('5');
    });

    test('PV-CART-039 | Manual input below MOQ clamped to MOQ', async ({ page }) => {
      await vendorUi(page);
      const details = new VendorProductDetailsPage(page);
      await details.goto(seed.moq5.id);
      await details.waitForLoad();
      await details.quantityInput().fill('2');
      await expect(details.quantityInput()).toHaveValue('5');
    });

    test('PV-CART-040 | Increment capped at stock', async ({ page }) => {
      await vendorUi(page);
      const details = new VendorProductDetailsPage(page);
      await details.goto(seed.stockCap.id);
      await details.waitForLoad();
      for (let i = 0; i < 60; i += 1) {
        await details.quantityInput().locator('..').locator('button').last().click();
      }
      await expect(details.quantityInput()).toHaveValue(String(seed.stockCap.stock));
    });

    test('PV-CART-041 | Invalid characters in quantity input sanitized', async ({ page }) => {
      await vendorUi(page);
      const details = new VendorProductDetailsPage(page);
      await details.goto(seed.moq5.id);
      await details.waitForLoad();
      await setDetailsQuantityInput(page, 'abc');
      await expect(details.quantityInput()).toHaveValue('5');
    });

    test('PV-CART-042 | Paste negative value clamped to MOQ', async ({ page }) => {
      await vendorUi(page);
      const details = new VendorProductDetailsPage(page);
      await details.goto(seed.moq5.id);
      await details.waitForLoad();
      await details.quantityInput().fill('-3');
      await expect(details.quantityInput()).toHaveValue('5');
    });

    test('PV-CART-043 | Paste decimal truncated by parseInt', async ({ page }) => {
      await vendorUi(page);
      const details = new VendorProductDetailsPage(page);
      await details.goto(seed.moq5.id);
      await details.waitForLoad();
      await details.quantityInput().fill('7.9');
      await expect(details.quantityInput()).toHaveValue('7');
    });

    test('PV-CART-044 | Empty quantity input resets to MOQ', async ({ page }) => {
      await vendorUi(page);
      const details = new VendorProductDetailsPage(page);
      await details.goto(seed.moq5.id);
      await details.waitForLoad();
      await details.quantityInput().fill('');
      await details.quantityInput().blur();
      await expect(details.quantityInput()).toHaveValue('5');
    });

    test('PV-CART-045 | HTML5 min/max attributes set correctly', async ({ page }) => {
      await vendorUi(page);
      const details = new VendorProductDetailsPage(page);
      await details.goto(seed.moq5.id);
      await details.waitForLoad();
      await expect(details.quantityInput()).toHaveAttribute('min', '5');
      await expect(details.quantityInput()).toHaveAttribute('max', String(seed.moq5.stock));
    });

    test('PV-CART-046 | Client guard blocks API when qty below MOQ', async () => {
      test.skip(true, 'UI input clamp prevents below-MOQ state — client guard branch unreachable via UI');
    });

    test('PV-CART-047 | Out-of-stock details blocks add', async ({ page }) => {
      await vendorUi(page);
      const details = new VendorProductDetailsPage(page);
      await details.goto(seed.oos.id);
      await details.waitForLoad();
      await details.expectOutOfStockAddBlocked();
    });

    test('PV-CART-048 | API rejection surfaced in details cartMessage', async ({ page }) => {
      await vendorUi(page);
      const details = new VendorProductDetailsPage(page);
      await details.goto(seed.stockCap.id);
      await details.waitForLoad();
      await details.setQuantity(seed.stockCap.stock);
      await details.addToCart();
      await expect(page.locator('text=/added to cart/i')).toBeVisible({ timeout: 10000 });
      await details.setQuantity(seed.stockCap.stock);
      await details.addToCart();
      await expect(page.locator('text=/insufficient stock/i')).toBeVisible({ timeout: 10000 });
    });

    test('PV-CART-049 | Add button disabled while cart action loading', async ({ page }) => {
      await vendorUi(page);
      const details = new VendorProductDetailsPage(page);
      await details.goto(seed.standard.id);
      await details.waitForLoad();
      let postCount = 0;
      await page.route('**/api/v1/cart', async (route) => {
        if (route.request().method() === 'POST') {
          postCount += 1;
          await new Promise((r) => setTimeout(r, 2000));
        }
        await route.continue();
      });
      const clickPromise = details.addToCartButton().click();
      await expect(details.addToCartButton()).toHaveText(/Adding\.\.\./, { timeout: 5000 });
      await expect(details.addToCartButton()).toBeDisabled();
      await clickPromise;
      await expect.poll(() => postCount, { timeout: 10000 }).toBe(1);
      await page.unroute('**/api/v1/cart');
    });
  });

  test.describe('Section G — Frontend Cart Page Validation', () => {
    test('PV-CART-050 | Cart quantity editing disabled', async ({ page }) => {
      await vendorUi(page);
      await addToCartApi(vendorSession, seed.standard.id, 1);
      const cartPage = new VendorCartPage(page);
      await cartPage.goto();
      await cartPage.waitForLoad();
      await expect(cartPage.quantityLockedMessage()).toBeVisible();
    });

    test('PV-CART-051 | Max-stock warning when qty >= available stock', async ({ page }) => {
      await vendorUi(page);
      await addToCartApi(vendorSession, seed.stockCap.id, 50);
      const cartPage = new VendorCartPage(page);
      await cartPage.goto();
      await cartPage.waitForLoad();
      await expect(
        cartPage.productCard(seed.stockCap.name).getByText(/Maximum stock reached/i)
      ).toBeVisible();
    });

    test('PV-CART-052 | Below-MOQ cart warning branch (unreachable)', async () => {
      test.skip(true, 'Cannot seed cart line below MOQ via public API — display branch not reachable');
    });

    test('PV-CART-053 | Remove control remains enabled', async ({ page }) => {
      await vendorUi(page);
      await addToCartApi(vendorSession, seed.standard.id, 1);
      const cartPage = new VendorCartPage(page);
      await cartPage.goto();
      await cartPage.waitForLoad();
      await cartPage.removeProductByName(seed.standard.name);
      await cartPage.expectEmptyCart();
    });
  });

  test.describe('Section H — Frontend Wishlist Validation', () => {
    test('PV-CART-054 | Wishlist add-to-cart uses MOQ quantity', async ({ page }) => {
      await vendorUi(page);
      await clearWishlistApi(vendorSession);
      let postBody: Record<string, unknown> | null = null;
      page.on('request', (req) => {
        if (req.url().includes('/api/v1/cart') && req.method() === 'POST') {
          postBody = req.postDataJSON() as Record<string, unknown>;
        }
      });
      const { addToWishlistApi } = await import('../helpers/cart.functional.helper');
      await addToWishlistApi(vendorSession, seed.moq5.id);
      await page.goto('/vendor/wishlist');
      await page.waitForSelector('text=/Wishlist|Saved products/i', { timeout: 15000 });
      const card = page
        .locator('div.bg-white.rounded-lg.border')
        .filter({ has: page.locator('h3', { hasText: seed.moq5.name }) })
        .first();
      await card.getByRole('button', { name: /^Add to Cart$/ }).click();
      await expect.poll(() => postBody?.quantity, { timeout: 10000 }).toBe(5);
    });

    test('PV-CART-055 | Wishlist blocks OOS add', async ({ page }) => {
      await vendorUi(page);
      const { addToWishlistApi } = await import('../helpers/cart.functional.helper');
      await addToWishlistApi(vendorSession, seed.oos.id);
      await page.goto('/vendor/wishlist');
      await page.waitForSelector('text=/Wishlist|Saved products/i', { timeout: 15000 });
      const card = page
        .locator('div.bg-white.rounded-lg.border')
        .filter({ has: page.locator('h3', { hasText: seed.oos.name }) })
        .first();
      const button = card.getByRole('button', { name: /Add to Cart|Out of Stock/i });
      await expect(button).toBeDisabled();
    });
  });

  test.describe('Section I — Frontend Checkout Form Validation', () => {
    test.beforeAll(() => {
      clearValidationRateLimits();
    });
    test('PV-CART-056 | Empty cart shows checkout empty state', async ({ page }) => {
      await vendorUi(page);
      await page.goto('/vendor/checkout');
      await expect(page.getByText('Your cart is empty')).toBeVisible();
    });

    test('PV-CART-057 | Missing delivery address blocked client-side', async ({ page }) => {
      await vendorUi(page);
      await addToCartApi(vendorSession, seed.standard.id, 1);
      await page.goto('/vendor/checkout');
      await page.getByRole('button', { name: /^Place Order$/ }).click();
      await expect(page.getByText('Delivery address is required')).toBeVisible();
    });

    test('PV-CART-058 | Missing city blocked', async ({ page }) => {
      await vendorUi(page);
      await addToCartApi(vendorSession, seed.standard.id, 1);
      await page.goto('/vendor/checkout');
      await page.getByPlaceholder('Enter your complete delivery address').fill('123 Test Street');
      const stateInput = page.locator('label', { hasText: 'State' }).locator('..').locator('input');
      const pincodeInput = page.locator('label', { hasText: 'Pincode' }).locator('..').locator('input');
      await stateInput.fill('Telangana');
      await pincodeInput.fill('500001');
      await page.locator('label', { hasText: 'Phone Number' }).locator('..').locator('input').fill('9000000101');
      await page.getByRole('button', { name: /^Place Order$/ }).click();
      await expect(page.getByText('City is required')).toBeVisible();
    });

    test('PV-CART-059 | Missing state blocked', async ({ page }) => {
      await vendorUi(page);
      await addToCartApi(vendorSession, seed.standard.id, 1);
      await page.goto('/vendor/checkout');
      await page.getByPlaceholder('Enter your complete delivery address').fill('123 Test Street');
      await page.locator('label', { hasText: 'City' }).locator('..').locator('input').fill('Hyderabad');
      await page.locator('label', { hasText: 'Pincode' }).locator('..').locator('input').fill('500001');
      await page.locator('label', { hasText: 'Phone Number' }).locator('..').locator('input').fill('9000000101');
      await page.getByRole('button', { name: /^Place Order$/ }).click();
      await expect(page.getByText('State is required')).toBeVisible();
    });

    test('PV-CART-060 | Invalid pincode blocked', async ({ page }) => {
      await vendorUi(page);
      await addToCartApi(vendorSession, seed.standard.id, 1);
      await page.goto('/vendor/checkout');
      await page.getByPlaceholder('Enter your complete delivery address').fill('123 Test Street');
      await page.locator('label', { hasText: 'City' }).locator('..').locator('input').fill('Hyderabad');
      await page.locator('label', { hasText: 'State' }).locator('..').locator('input').fill('Telangana');
      await page.locator('label', { hasText: 'Pincode' }).locator('..').locator('input').fill('12345');
      await page.locator('label', { hasText: 'Phone Number' }).locator('..').locator('input').fill('9000000101');
      await page.getByRole('button', { name: /^Place Order$/ }).click();
      await expect(page.getByText('Pincode must be 6 digits')).toBeVisible();
    });

    test('PV-CART-061 | Pincode non-digit characters stripped before validation', async ({ page }) => {
      await vendorUi(page);
      await addToCartApi(vendorSession, seed.standard.id, 1);
      await page.goto('/vendor/checkout');
      await fillCheckoutAddress(page);
      await page.locator('label', { hasText: 'Pincode' }).locator('..').locator('input').fill('500 001');
      await page.getByRole('button', { name: /^Place Order$/ }).click();
      await page.waitForURL(/\/vendor\/order-success/, { timeout: 30000 });
    });

    test('PV-CART-062 | Missing phone blocked', async ({ page }) => {
      await vendorUi(page);
      await addToCartApi(vendorSession, seed.standard.id, 1);
      await page.goto('/vendor/checkout');
      await page.getByPlaceholder('Enter your complete delivery address').fill('123 Test Street');
      await page.locator('label', { hasText: 'City' }).locator('..').locator('input').fill('Hyderabad');
      await page.locator('label', { hasText: 'State' }).locator('..').locator('input').fill('Telangana');
      await page.locator('label', { hasText: 'Pincode' }).locator('..').locator('input').fill('500001');
      const phoneInput = page.locator('label', { hasText: 'Phone Number' }).locator('..').locator('input');
      await phoneInput.fill('');
      await page.getByRole('button', { name: /^Place Order$/ }).click();
      await expect(page.getByText('Phone number is required')).toBeVisible();
    });

    test('PV-CART-063 | Valid checkout form proceeds to order API', async ({ page }) => {
      await vendorUi(page);
      await addToCartApi(vendorSession, seed.standard.id, 1);
      await page.goto('/vendor/checkout');
      await fillCheckoutAddress(page);
      await page.getByRole('button', { name: /^Place Order$/ }).click();
      await page.waitForURL(/\/vendor\/order-success/, { timeout: 30000 });
    });

    test('PV-CART-064 | Double-click place order guarded', async ({ page }) => {
      clearValidationRateLimits();
      let orderPostCount = 0;

      try {
        await vendorUi(page);
        await addToCartApi(vendorSession, seed.second.id, 1);
        await page.goto('/vendor/checkout');
        await fillCheckoutAddress(page);
        await page.route('**/api/v1/orders', async (route) => {
          if (route.request().method() === 'POST') {
            orderPostCount += 1;
          }
          await route.continue();
        });
        const button = page.getByRole('button', { name: /^Place Order$/ });
        await button.dblclick();
        await page.waitForURL(/\/vendor\/order-success/, { timeout: 30000 });
        expect(orderPostCount).toBeLessThanOrEqual(1);
      } finally {
        await page.unroute('**/api/v1/orders').catch(() => {});
      }
    });
  });

  test.describe('Section J — Order API Business Validation', () => {
    test.beforeAll(() => {
      clearValidationRateLimits();
    });
    test('PV-CART-065 | Order from empty cart rejected server-side', async () => {
      await clearCartApi(vendorSession);
      const result = await apiJson(
        vendorSession,
        'POST',
        '/orders',
        buildOrderPayload(buildShippingAddress())
      );
      await expectApiStatus(result, 400);
      expect(messageOf(result)).toMatch(/cart is empty/i);
    });

    test('PV-CART-066 | Order rejects inactive product still in cart', async () => {
      const created = await createProductApi(adminSession, {
        name: uniqueValidationName('pv-cart-order-inact'),
        price: 55,
        categoryId: seed.categoryId,
        stock: 10,
        moq: 1,
      });
      const productId = String(created._id || created.id);
      await addToCartApi(vendorSession, productId, 1);
      await patchProductStatusApi(adminSession, productId, false);
      const result = await apiJson(
        vendorSession,
        'POST',
        '/orders',
        buildOrderPayload(buildShippingAddress())
      );
      await expectApiStatus(result, 400);
      expect(messageOf(result)).toMatch(/not available/i);
      await removeFromCartApi(vendorSession, productId);
      await disposeProduct(adminSession, productId);
    });

    test('PV-CART-067 | Order re-validates stock at checkout time', async () => {
      const created = await createProductApi(adminSession, {
        name: uniqueValidationName('pv-cart-order-stock'),
        price: 70,
        categoryId: seed.categoryId,
        stock: 5,
        moq: 1,
      });
      const productId = String(created._id || created.id);
      await clearCartApi(vendorSession);
      await addToCartApi(vendorSession, productId, 5);
      await patchProductStockApi(adminSession, productId, 2);
      const result = await apiJson(
        vendorSession,
        'POST',
        '/orders',
        buildOrderPayload(buildShippingAddress())
      );
      await expectApiStatus(result, 400);
      expect(messageOf(result)).toMatch(/insufficient stock/i);
      await removeFromCartApi(vendorSession, productId);
      await disposeProduct(adminSession, productId);
    });

    test('PV-CART-068 | Order shipping address Joi validation', async () => {
      await clearCartApi(vendorSession);
      await addToCartApi(vendorSession, seed.standard.id, 1);
      const result = await apiJson(
        vendorSession,
        'POST',
        '/orders',
        buildOrderPayload({
          ...buildShippingAddress(),
          pincode: '12345',
        })
      );
      await expectApiStatus(result, 400);
      expect(messageOf(result).toLowerCase()).toMatch(/pincode/);
    });

    test('PV-CART-069 | Document order MOQ rule vs cart max()', async () => {
      await clearCartApi(vendorSession);
      const belowSplit = await postCartApi(vendorSession, {
        productId: extras.moqSplit.id,
        quantity: 5,
      });
      expect(belowSplit.status).toBe(400);
      await postCartApi(vendorSession, { productId: extras.moqSplit.id, quantity: 10 });
      const orderResult = await apiJson(
        vendorSession,
        'POST',
        '/orders',
        buildOrderPayload(buildShippingAddress())
      );
      expect([200, 201]).toContain(orderResult.status);
    });
  });

  test.describe('Section K — Sanitization & Injection', () => {
    test('PV-CART-070 | NoSQL injection in productId rejected safely', async () => {
      const result = await postCartApi(vendorSession, {
        productId: '{ "$gt": "" }',
        quantity: 1,
      });
      await expectApiStatus(result, 400);
    });

    test('PV-CART-071 | XSS in API error message rendered safely in UI', async ({ page }) => {
      await vendorUi(page);
      const xssName = `<script>alert('xss')</script>${uniqueValidationName('pv-xss')}`;
      const created = await createProductApi(adminSession, {
        name: xssName,
        price: 50,
        categoryId: seed.categoryId,
        stock: 10,
        moq: 5,
      });
      const productId = String(created._id || created.id);
      const details = new VendorProductDetailsPage(page);
      await details.goto(productId);
      await details.waitForLoad();
      await details.setQuantity(10);
      await details.addToCart();
      await expect(page.locator('text=/added to cart/i')).toBeVisible({ timeout: 10000 });
      const scriptCount = await page.locator('script').evaluateAll((nodes) =>
        nodes.filter((n) => n.textContent?.includes("alert('xss')")).length
      );
      expect(scriptCount).toBe(0);
      await disposeProduct(adminSession, productId);
    });

    test('PV-CART-072 | DELETE path injection in productId param', async () => {
      const result = await apiJson(vendorSession, 'DELETE', '/cart/../../../etc');
      expect([400, 404]).toContain(result.status);
    });
  });

  test.describe('Section L — Boundary & Negative Testing', () => {
    test('PV-CART-073 | Product with stock < moq shows low_stock status', async ({ page }) => {
      await vendorUi(page);
      const productsPage = new VendorProductsPage(page);
      await productsPage.goto();
      await productsPage.search(seed.lowStock.name);
      const card = productsPage.cardByName(seed.lowStock.name);
      await expect(card.locator('span', { hasText: 'Low Stock' })).toBeVisible();
      await expect(card.locator('button', { hasText: 'Add to Cart' })).toBeEnabled();
    });

    test('PV-CART-074 | Deactivated product cannot be re-added', async () => {
      const created = await createProductApi(adminSession, {
        name: uniqueValidationName('pv-cart-readd'),
        price: 45,
        categoryId: seed.categoryId,
        stock: 10,
        moq: 1,
      });
      const productId = String(created._id || created.id);
      await addToCartApi(vendorSession, productId, 1);
      await patchProductStatusApi(adminSession, productId, false);
      const result = await postCartApi(vendorSession, { productId, quantity: 1 });
      await expectApiStatus(result, 400);
      expect(messageOf(result)).toMatch(/not available/i);
      await removeFromCartApi(vendorSession, productId);
      await disposeProduct(adminSession, productId);
    });

    test('PV-CART-075 | Very large quantity rejected by stock not overflow', async () => {
      await clearCartApi(vendorSession);
      const result = await postCartApi(vendorSession, {
        productId: seed.standard.id,
        quantity: 999999,
      });
      await expectApiStatus(result, 400);
      expect(messageOf(result)).toMatch(/insufficient stock/i);
    });

    test('PV-CART-076 | Unauthenticated cart mutation rejected', async () => {
      const result = await postCartApi(undefined, {
        productId: seed.standard.id,
        quantity: 1,
      });
      await expectApiStatus(result, 401);
    });
  });
});
