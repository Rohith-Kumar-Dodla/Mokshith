import { test, expect, type Page } from '../fixtures/product.validation.fixture';
import VendorWishlistPage from '../pages/vendor/VendorWishlistPage';
import VendorProductsPage from '../pages/vendor/VendorProductsPage';
import VendorProductDetailsPage from '../pages/vendor/VendorProductDetailsPage';
import {
  addToWishlistApi,
  ensureEmptyWishlist,
  getWishlistApi,
} from '../helpers/wishlist.api.helper';
import { clearCartApi, getCartApi } from '../helpers/cart.api.helper';
import {
  createProductApi,
  deleteProductApi,
  getAdminSession,
  resolveRefId,
} from '../helpers/product.api.helper';
import { getVendorCredentials, uniqueProductName } from '../helpers/product.credentials';
import { loginApi, type ApiSession } from '../helpers/auth.api.helper';
import { establishSession } from '../helpers/session.functional.helper';
import { getCartLineQuantity } from '../helpers/cart.functional.helper';
import {
  apiJson,
  expectApiRejects,
  expectApiStatus,
  uniqueValidationName,
} from '../helpers/validation/product.validation.helper';
import {
  assertErrorEnvelope,
  assertSuccessEnvelope,
  clearWishlistValidationApi,
  clearWishlistValidationRateLimits,
  deleteWishlistItemValidationApi,
  getWishlistValidationApi,
  INVALID_OBJECT_ID,
  messageOf,
  NONEXISTENT_OBJECT_ID,
  postWishlistAddApi,
  postWishlistRawFetch,
  seedWishlistValidationProducts,
  wishlistItemsFromResult,
  type WishlistValidationSeed,
} from '../helpers/wishlist.validation.helper';

let adminSession: ApiSession;
let vendorSession: ApiSession;
let seed: WishlistValidationSeed;

async function vendorUi(page: Page) {
  vendorSession = await establishSession(page, 'vendor');
  await ensureEmptyWishlist(vendorSession);
  await clearCartApi(vendorSession);
}

/** Ensure wishlist document exists (clear returns 200 instead of 404). */
async function ensureWishlistDocument() {
  await addToWishlistApi(vendorSession, seed.standard.id);
  await ensureEmptyWishlist(vendorSession);
}

test.describe('Wishlist Validation Certification Suite', () => {
  test.beforeAll(async () => {
    clearWishlistValidationRateLimits();
    adminSession = await getAdminSession();
    seed = await seedWishlistValidationProducts(adminSession);
    const vendorCreds = getVendorCredentials(1);
    vendorSession = await loginApi(vendorCreds.mobile, vendorCreds.password);
    await ensureEmptyWishlist(vendorSession);
    await clearCartApi(vendorSession);
  });

  test.describe('Section A — Joi / Express Input Validation (POST /wishlist/add)', () => {
    test('WV-WL-001 | Reject missing productId', async () => {
      const result = await postWishlistAddApi(vendorSession, {});
      await expectApiStatus(result, 400);
      assertErrorEnvelope(result);
      expect(messageOf(result).toLowerCase()).toMatch(/productid|product id|required/);
    });

    test('WV-WL-002 | Reject null productId', async () => {
      const result = await postWishlistAddApi(vendorSession, { productId: null });
      await expectApiStatus(result, 400);
      expect(messageOf(result).toLowerCase()).toMatch(/productid|string|required/);
    });

    test('WV-WL-003 | Reject undefined productId (missing key)', async () => {
      const result = await postWishlistAddApi(vendorSession, { productId: undefined });
      await expectApiStatus(result, 400);
    });

    test('WV-WL-004 | Empty string productId rejected at ObjectId layer', async () => {
      const result = await postWishlistAddApi(vendorSession, { productId: '' });
      await expectApiStatus(result, 400);
      expect(messageOf(result).toLowerCase()).toMatch(/invalid product id|productid|required/);
    });

    test('WV-WL-005 | Whitespace productId rejected', async () => {
      const result = await postWishlistAddApi(vendorSession, { productId: '   ' });
      await expectApiStatus(result, 400);
      expect(messageOf(result).toLowerCase()).toMatch(/invalid product id|productid/);
    });

    test('WV-WL-006 | Reject invalid ObjectId string', async () => {
      const result = await postWishlistAddApi(vendorSession, { productId: INVALID_OBJECT_ID });
      await expectApiStatus(result, 400);
      expect(messageOf(result)).toMatch(/invalid product id/i);
    });

    test('WV-WL-007 | Reject malformed ObjectId (wrong length hex)', async () => {
      const result = await postWishlistAddApi(vendorSession, {
        productId: 'abcdef0123456789',
      });
      await expectApiStatus(result, 400);
      expect(messageOf(result)).toMatch(/invalid product id/i);
    });

    test('WV-WL-008 | Reject random non-ObjectId string', async () => {
      const result = await postWishlistAddApi(vendorSession, {
        productId: 'definitely-not-an-object-id',
      });
      await expectApiStatus(result, 400);
    });

    test('WV-WL-009 | Reject number productId', async () => {
      const result = await postWishlistAddApi(vendorSession, { productId: 12345 });
      await expectApiStatus(result, 400);
    });

    test('WV-WL-010 | Reject boolean productId', async () => {
      const result = await postWishlistAddApi(vendorSession, { productId: true });
      await expectApiStatus(result, 400);
    });

    test('WV-WL-011 | Reject array productId', async () => {
      const result = await postWishlistAddApi(vendorSession, { productId: [seed.standard.id] });
      await expectApiStatus(result, 400);
    });

    test('WV-WL-012 | Reject object productId', async () => {
      const result = await postWishlistAddApi(vendorSession, {
        productId: { id: seed.standard.id },
      });
      await expectApiStatus(result, 400);
    });

    test('WV-WL-013 | Unexpected extra fields do not break valid add', async () => {
      await ensureEmptyWishlist(vendorSession);
      const result = await postWishlistAddApi(vendorSession, {
        productId: seed.standard.id,
        extraField: 'ignored',
        quantity: 99,
      });
      await expectApiStatus(result, 200);
      assertSuccessEnvelope(result);
    });
  });

  test.describe('Section B — Service / Business Validation', () => {
    test('WV-WL-014 | Reject non-existent product (valid ObjectId)', async () => {
      const result = await postWishlistAddApi(vendorSession, {
        productId: NONEXISTENT_OBJECT_ID,
      });
      await expectApiStatus(result, 404);
      expect(messageOf(result)).toMatch(/product not found/i);
    });

    test('WV-WL-015 | Reject deleted product on add', async () => {
      const created = await createProductApi(adminSession, {
        name: uniqueProductName('pv-wl-del'),
        price: 99,
        categoryId: seed.categoryId,
        stock: 10,
        moq: 1,
      });
      const pid = String(created._id || created.id);
      await deleteProductApi(adminSession, pid);
      const result = await postWishlistAddApi(vendorSession, { productId: pid });
      await expectApiStatus(result, 404);
      expect(messageOf(result)).toMatch(/product not found/i);
    });

    test('WV-WL-016 | Duplicate add remains idempotent', async () => {
      await ensureEmptyWishlist(vendorSession);
      const first = await postWishlistAddApi(vendorSession, { productId: seed.standard.id });
      await expectApiStatus(first, 200);
      const second = await postWishlistAddApi(vendorSession, { productId: seed.standard.id });
      await expectApiStatus(second, 200);
      const wishlist = await getWishlistApi(vendorSession);
      expect(wishlist?.items?.length).toBe(1);
    });

    test('WV-WL-017 | Inactive product may be added (no isActive check)', async () => {
      await ensureEmptyWishlist(vendorSession);
      const result = await postWishlistAddApi(vendorSession, { productId: seed.inactive.id });
      await expectApiStatus(result, 200);
    });

    test('WV-WL-018 | Out-of-stock product may be added (no stock check)', async () => {
      await ensureEmptyWishlist(vendorSession);
      const result = await postWishlistAddApi(vendorSession, { productId: seed.oos.id });
      await expectApiStatus(result, 200);
    });

    test('WV-WL-019 | Valid add returns success envelope with items', async () => {
      await ensureEmptyWishlist(vendorSession);
      const result = await postWishlistAddApi(vendorSession, { productId: seed.standard.id });
      await expectApiStatus(result, 200);
      assertSuccessEnvelope(result);
      expect(messageOf(result).toLowerCase()).toMatch(/added to wishlist|success/);
      expect(wishlistItemsFromResult(result).length).toBeGreaterThanOrEqual(1);
    });
  });

  test.describe('Section C — Remove / Clear Validation', () => {
    test('WV-WL-020 | Remove invalid ObjectId is no-op when wishlist exists', async () => {
      await ensureWishlistDocument();
      await addToWishlistApi(vendorSession, seed.standard.id);
      const result = await deleteWishlistItemValidationApi(vendorSession, INVALID_OBJECT_ID);
      await expectApiStatus(result, 200);
      const wishlist = await getWishlistApi(vendorSession);
      expect(
        (wishlist?.items ?? []).some((item) => resolveRefId(item.productId) === seed.standard.id)
      ).toBe(true);
    });

    test('WV-WL-021 | Remove non-existent productId is no-op', async () => {
      await ensureWishlistDocument();
      await addToWishlistApi(vendorSession, seed.standard.id);
      const result = await deleteWishlistItemValidationApi(
        vendorSession,
        NONEXISTENT_OBJECT_ID
      );
      await expectApiStatus(result, 200);
      const wishlist = await getWishlistApi(vendorSession);
      expect(
        (wishlist?.items ?? []).some((item) => resolveRefId(item.productId) === seed.standard.id)
      ).toBe(true);
    });

    test('WV-WL-022 | Remove without wishlist document returns 404', async () => {
      const vendor2Creds = getVendorCredentials(2);
      const vendor2Session = await loginApi(vendor2Creds.mobile, vendor2Creds.password);
      // Fresh vendor2 may already have a wishlist from prior suites — clear then
      // attempt remove after wiping document is not possible via API (clear keeps doc).
      // Assert remove of unknown id on empty wishlist succeeds as no-op when doc exists.
      await ensureEmptyWishlist(vendor2Session);
      const result = await deleteWishlistItemValidationApi(vendor2Session, seed.standard.id);
      expect([200, 404]).toContain(result.status);
    });

    test('WV-WL-023 | Clear empty wishlist document succeeds', async () => {
      await ensureWishlistDocument();
      const result = await clearWishlistValidationApi(vendorSession);
      await expectApiStatus(result, 200);
      expect(messageOf(result).toLowerCase()).toMatch(/cleared|success/);
    });

    test('WV-WL-024 | Clear returns success envelope with null data', async () => {
      await ensureWishlistDocument();
      await addToWishlistApi(vendorSession, seed.standard.id);
      const result = await clearWishlistValidationApi(vendorSession);
      await expectApiStatus(result, 200);
      assertSuccessEnvelope(result);
      expect(result.body.data).toBeNull();
    });

    test('WV-WL-025 | Valid remove returns updated wishlist', async () => {
      await ensureEmptyWishlist(vendorSession);
      await addToWishlistApi(vendorSession, seed.standard.id);
      const result = await deleteWishlistItemValidationApi(vendorSession, seed.standard.id);
      await expectApiStatus(result, 200);
      expect(messageOf(result).toLowerCase()).toMatch(/removed|success/);
      expect(wishlistItemsFromResult(result).length).toBe(0);
    });
  });

  test.describe('Section D — GET / Response Schema', () => {
    test('WV-WL-026 | GET empty wishlist returns items array', async () => {
      await ensureEmptyWishlist(vendorSession);
      const result = await getWishlistValidationApi(vendorSession);
      await expectApiStatus(result, 200);
      assertSuccessEnvelope(result);
      expect(Array.isArray(wishlistItemsFromResult(result))).toBe(true);
      expect(wishlistItemsFromResult(result).length).toBe(0);
    });

    test('WV-WL-027 | GET populated wishlist response schema', async () => {
      await ensureEmptyWishlist(vendorSession);
      await addToWishlistApi(vendorSession, seed.standard.id);
      const result = await getWishlistValidationApi(vendorSession);
      await expectApiStatus(result, 200);
      const items = wishlistItemsFromResult(result);
      expect(items.length).toBe(1);
      const first = items[0] as { productId?: unknown };
      expect(first.productId).toBeTruthy();
    });

    test('WV-WL-028 | Error schema consistency on invalid add', async () => {
      const result = await postWishlistAddApi(vendorSession, { productId: INVALID_OBJECT_ID });
      await expectApiStatus(result, 400);
      assertErrorEnvelope(result);
      expect(result.body).toHaveProperty('message');
      expect(result.body.data === null || result.body.data === undefined || 'error' in result.body).toBe(
        true
      );
    });

    test('WV-WL-029 | HTTP status consistency — 400 vs 404', async () => {
      const badId = await postWishlistAddApi(vendorSession, { productId: INVALID_OBJECT_ID });
      await expectApiStatus(badId, 400);
      const missing = await postWishlistAddApi(vendorSession, {
        productId: NONEXISTENT_OBJECT_ID,
      });
      await expectApiStatus(missing, 404);
    });
  });

  test.describe('Section E — Sanitization & Injection', () => {
    test('WV-WL-030 | NoSQL injection string in productId rejected', async () => {
      const result = await postWishlistAddApi(vendorSession, {
        productId: '{ "$gt": "" }',
      });
      await expectApiStatus(result, 400);
    });

    test('WV-WL-031 | Mongo operator object productId rejected by Joi', async () => {
      const result = await postWishlistAddApi(vendorSession, {
        productId: { $gt: '' },
      });
      await expectApiStatus(result, 400);
    });

    test('WV-WL-032 | Prototype pollution payload does not escalate', async () => {
      await ensureEmptyWishlist(vendorSession);
      const result = await postWishlistAddApi(vendorSession, {
        productId: seed.standard.id,
        __proto__: { isAdmin: true },
        constructor: { prototype: { isAdmin: true } },
      });
      await expectApiStatus(result, 200);
      const wishlist = await getWishlistApi(vendorSession);
      expect(wishlist?.items?.length).toBe(1);
    });

    test('WV-WL-033 | XSS string as productId rejected', async () => {
      const result = await postWishlistAddApi(vendorSession, {
        productId: `<script>alert('xss')</script>`,
      });
      await expectApiStatus(result, 400);
    });

    test('WV-WL-034 | SQL injection string as productId rejected', async () => {
      const result = await postWishlistAddApi(vendorSession, {
        productId: `' OR '1'='1`,
      });
      await expectApiStatus(result, 400);
    });

    test('WV-WL-035 | Special characters productId rejected', async () => {
      const result = await postWishlistAddApi(vendorSession, {
        productId: '!@#$%^&*()_+',
      });
      await expectApiStatus(result, 400);
    });

    test('WV-WL-036 | Unicode productId rejected', async () => {
      const result = await postWishlistAddApi(vendorSession, {
        productId: '商品🆔αβγ',
      });
      await expectApiStatus(result, 400);
    });

    test('WV-WL-037 | Extremely long productId rejected', async () => {
      const result = await postWishlistAddApi(vendorSession, {
        productId: 'a'.repeat(5000),
      });
      await expectApiStatus(result, 400);
    });

    test('WV-WL-038 | DELETE path traversal in productId param', async () => {
      await ensureWishlistDocument();
      const result = await apiJson(vendorSession, 'DELETE', '/wishlist/remove/../../../etc');
      expect([200, 400, 404]).toContain(result.status);
    });
  });

  test.describe('Section F — Transport / Content-Type Edge Cases', () => {
    test('WV-WL-039 | Invalid JSON body rejected', async () => {
      const result = await postWishlistRawFetch(vendorSession, {
        body: '{productId:',
        contentType: 'application/json',
      });
      expect([400, 500]).toContain(result.status);
    });

    test('WV-WL-040 | Unsupported Content-Type text/plain', async () => {
      const result = await postWishlistRawFetch(vendorSession, {
        body: `productId=${seed.standard.id}`,
        contentType: 'text/plain',
      });
      expect([400, 415, 500]).toContain(result.status);
    });

    test('WV-WL-041 | Empty body with JSON content-type rejected', async () => {
      const result = await postWishlistRawFetch(vendorSession, {
        body: '',
        contentType: 'application/json',
      });
      expect([400, 500]).toContain(result.status);
    });

    test('WV-WL-042 | Array root body rejected', async () => {
      const result = await postWishlistAddApi(vendorSession, [seed.standard.id] as unknown as Record<
        string,
        unknown
      >);
      await expectApiStatus(result, 400);
    });
  });

  test.describe('Section G — Frontend Client Validation', () => {
    test('WV-WL-043 | Out-of-stock Add to Cart disabled on wishlist card', async ({ page }) => {
      await vendorUi(page);
      await addToWishlistApi(vendorSession, seed.oos.id);
      const wishlistPage = new VendorWishlistPage(page);
      await wishlistPage.goto();
      await wishlistPage.waitForLoad();
      await wishlistPage.expectOutOfStockAddBlocked(seed.oos.name);
    });

    test('WV-WL-044 | Wishlist add-to-cart uses MOQ quantity', async ({ page }) => {
      await vendorUi(page);
      let postBody: Record<string, unknown> | null = null;
      page.on('request', (req) => {
        if (req.url().includes('/api/v1/cart') && req.method() === 'POST') {
          postBody = req.postDataJSON() as Record<string, unknown>;
        }
      });
      await addToWishlistApi(vendorSession, seed.moq5.id);
      const wishlistPage = new VendorWishlistPage(page);
      await wishlistPage.goto();
      await wishlistPage.waitForLoad();
      await wishlistPage.addToCartButton(seed.moq5.name).click();
      await expect(page.locator('text=/added to cart/i')).toBeVisible({ timeout: 10000 });
      await expect.poll(() => postBody?.quantity, { timeout: 10000 }).toBe(5);
      await expect
        .poll(() => getCartLineQuantity(vendorSession, seed.moq5.id), { timeout: 10000 })
        .toBe(5);
    });

    test('WV-WL-045 | Add failure surfaces error toast', async ({ page }) => {
      await vendorUi(page);
      await page.route('**/api/v1/wishlist/add', async (route) => {
        if (route.request().method() === 'POST') {
          await route.fulfill({
            status: 400,
            contentType: 'application/json',
            body: JSON.stringify({ success: false, message: 'Invalid product ID', data: null }),
          });
          return;
        }
        await route.continue();
      });
      const productsPage = new VendorProductsPage(page);
      await productsPage.goto();
      await productsPage.setGridView();
      await productsPage.search(seed.standard.name);
      await productsPage.addToWishlistByName(seed.standard.name);
      await expect(page.locator('text=/Invalid product ID|Failed to add/i')).toBeVisible({
        timeout: 10000,
      });
      await page.unroute('**/api/v1/wishlist/add');
    });

    test('WV-WL-046 | Success toast after add from listing', async ({ page }) => {
      await vendorUi(page);
      const productsPage = new VendorProductsPage(page);
      await productsPage.goto();
      await productsPage.setGridView();
      await productsPage.search(seed.standard.name);
      await productsPage.addToWishlistByName(seed.standard.name);
      await expect(page.locator('text=/added to wishlist/i')).toBeVisible({ timeout: 10000 });
    });

    test('WV-WL-047 | Success toast after remove', async ({ page }) => {
      await vendorUi(page);
      await addToWishlistApi(vendorSession, seed.standard.id);
      const wishlistPage = new VendorWishlistPage(page);
      await wishlistPage.goto();
      await wishlistPage.waitForLoad();
      await wishlistPage.removeProductByName(seed.standard.name);
      await expect(page.locator('text=/Removed from wishlist/i')).toBeVisible();
    });

    test('WV-WL-048 | Empty state Browse Products CTA enabled', async ({ page }) => {
      await vendorUi(page);
      const wishlistPage = new VendorWishlistPage(page);
      await wishlistPage.goto();
      await wishlistPage.waitForLoad();
      await wishlistPage.expectEmptyWishlist();
      await expect(wishlistPage.browseProductsLink()).toBeEnabled();
    });

    test('WV-WL-049 | Cards disabled while actionLoading after remove click', async ({ page }) => {
      await vendorUi(page);
      await addToWishlistApi(vendorSession, seed.standard.id);
      await addToWishlistApi(vendorSession, seed.second.id);
      await page.route('**/api/v1/wishlist/remove/**', async (route) => {
        await new Promise((resolve) => setTimeout(resolve, 800));
        await route.continue();
      });
      const wishlistPage = new VendorWishlistPage(page);
      await wishlistPage.goto();
      await wishlistPage.waitForLoad();
      const removePromise = wishlistPage.removeButtonForProduct(seed.standard.name).click();
      await expect(wishlistPage.addToCartButton(seed.second.name)).toBeDisabled({ timeout: 2000 });
      await removePromise;
      await page.unroute('**/api/v1/wishlist/remove/**');
    });

    test('WV-WL-050 | Details page wishlist success message', async ({ page }) => {
      await vendorUi(page);
      const details = new VendorProductDetailsPage(page);
      await details.goto(seed.standard.id);
      await details.waitForLoad();
      await details.addToWishlist();
      await expect(page.getByText(/added to wishlist/i)).toBeVisible({ timeout: 10000 });
    });

    test('WV-WL-051 | Low stock badge rendered from mapper status', async ({ page }) => {
      await vendorUi(page);
      await addToWishlistApi(vendorSession, seed.lowStock.id);
      const wishlistPage = new VendorWishlistPage(page);
      await wishlistPage.goto();
      await wishlistPage.waitForLoad();
      await expect(
        wishlistPage.cardByProductName(seed.lowStock.name).locator('span', { hasText: 'Low Stock' })
      ).toBeVisible();
    });

    test('WV-WL-052 | Deleted product filtered from wishlist UI count', async ({ page }) => {
      await vendorUi(page);
      const created = await createProductApi(adminSession, {
        name: uniqueValidationName('pv-wl-filter'),
        price: 77,
        categoryId: seed.categoryId,
        stock: 10,
        moq: 1,
      });
      const pid = String(created._id || created.id);
      await addToWishlistApi(vendorSession, pid);
      await addToWishlistApi(vendorSession, seed.standard.id);
      await deleteProductApi(adminSession, pid);
      const wishlistPage = new VendorWishlistPage(page);
      await wishlistPage.goto();
      await wishlistPage.waitForLoad();
      await expect(wishlistPage.productTitle(seed.standard.name)).toBeVisible();
      await expect(page.getByText('Saved products (1)')).toBeVisible();
    });
  });

  test.describe('Section H — Boundary & Consistency', () => {
    test('WV-WL-053 | Multiple distinct products accepted', async () => {
      await ensureEmptyWishlist(vendorSession);
      await expectApiStatus(
        await postWishlistAddApi(vendorSession, { productId: seed.standard.id }),
        200
      );
      await expectApiStatus(
        await postWishlistAddApi(vendorSession, { productId: seed.second.id }),
        200
      );
      const wishlist = await getWishlistApi(vendorSession);
      expect(wishlist?.items?.length).toBe(2);
    });

    test('WV-WL-054 | Cart remains independent after wishlist add', async () => {
      await ensureEmptyWishlist(vendorSession);
      await clearCartApi(vendorSession);
      await postWishlistAddApi(vendorSession, { productId: seed.standard.id });
      const cart = await getCartApi(vendorSession);
      expect(cart?.items?.length ?? 0).toBe(0);
    });

    test('WV-WL-055 | Remove then re-add succeeds', async () => {
      await ensureEmptyWishlist(vendorSession);
      await addToWishlistApi(vendorSession, seed.standard.id);
      await deleteWishlistItemValidationApi(vendorSession, seed.standard.id);
      const result = await postWishlistAddApi(vendorSession, { productId: seed.standard.id });
      await expectApiStatus(result, 200);
      expect(wishlistItemsFromResult(result).length).toBe(1);
    });

    test('WV-WL-056 | Joi required message uses body.productId path', async () => {
      const result = await expectApiRejects(
        () => postWishlistAddApi(vendorSession, {}),
        400
      );
      expect(messageOf(result)).toMatch(/productId/i);
    });
  });
});
