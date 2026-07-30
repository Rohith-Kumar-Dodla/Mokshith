import { test, expect, type Page } from '../fixtures/product.functional.fixture';
import VendorWishlistPage from '../pages/vendor/VendorWishlistPage';
import VendorProductsPage from '../pages/vendor/VendorProductsPage';
import VendorProductDetailsPage from '../pages/vendor/VendorProductDetailsPage';
import {
  addToWishlistApi,
  ensureEmptyWishlist,
  getWishlistApi,
  removeFromWishlistApi,
} from '../helpers/wishlist.api.helper';
import {
  clearCartApi,
  getCartApi,
} from '../helpers/cart.api.helper';
import {
  createProductApi,
  deleteProductApi,
  getAdminSession,
  resolveRefId,
} from '../helpers/product.api.helper';
import { uniqueProductName } from '../helpers/product.credentials';
import { loginApi, type ApiSession } from '../helpers/auth.api.helper';
import { establishSession } from '../helpers/session.functional.helper';
import {
  duplicateAddWishlistApi,
  getWishlistItemCount,
  interceptWishlistLoad,
  interceptWishlistLoadFailure,
  seedWishlistFunctionalProducts,
  wishlistContainsProduct,
  type WishlistSeedData,
} from '../helpers/wishlist.functional.helper';
import { getCartLineQuantity } from '../helpers/cart.functional.helper';

let adminSession: ApiSession;
let vendorSession: ApiSession;
let seed: WishlistSeedData;

async function vendorUi(page: Page) {
  vendorSession = await establishSession(page, 'vendor');
  await ensureEmptyWishlist(vendorSession);
  await clearCartApi(vendorSession);
}

test.describe('Wishlist Functional Suite', () => {
  test.beforeAll(async () => {
    adminSession = await getAdminSession();
    seed = await seedWishlistFunctionalProducts(adminSession);
    const vendorCreds = (await import('../helpers/product.credentials')).getVendorCredentials(1);
    vendorSession = await loginApi(vendorCreds.mobile, vendorCreds.password);
    await ensureEmptyWishlist(vendorSession);
    await clearCartApi(vendorSession);
  });

  test.describe('Section A — Add Entry Points', () => {
    test('WF-WL-001 | Add product from Product Listing', async ({ page }) => {
      await vendorUi(page);
      const productsPage = new VendorProductsPage(page);
      await productsPage.goto();
      await productsPage.setGridView();
      await productsPage.search(seed.standard.name);
      await productsPage.addToWishlistByName(seed.standard.name);
      await expect(page.locator('text=/added to wishlist/i')).toBeVisible({ timeout: 10000 });
      expect(await wishlistContainsProduct(vendorSession, seed.standard.id)).toBe(true);
    });

    test('WF-WL-002 | Add product from Product Details', async ({ page }) => {
      await vendorUi(page);
      const details = new VendorProductDetailsPage(page);
      await details.goto(seed.standard.id);
      await details.waitForLoad();
      await details.addToWishlist();
      await expect(page.getByText(/added to wishlist/i)).toBeVisible({ timeout: 10000 });
      expect(await wishlistContainsProduct(vendorSession, seed.standard.id)).toBe(true);
    });

    test('WF-WL-003 | Out-of-stock product can be added to wishlist', async ({ page }) => {
      await vendorUi(page);
      const productsPage = new VendorProductsPage(page);
      await productsPage.goto();
      await productsPage.setGridView();
      await productsPage.search(seed.oos.name);
      await productsPage.addToWishlistByName(seed.oos.name);
      await expect(page.locator('text=/added to wishlist/i')).toBeVisible({ timeout: 10000 });
      expect(await wishlistContainsProduct(vendorSession, seed.oos.id)).toBe(true);
    });
  });

  test.describe('Section B — Duplicate / Idempotency', () => {
    test('WF-WL-004 | API duplicate add remains idempotent', async () => {
      await ensureEmptyWishlist(vendorSession);
      const wishlist = await duplicateAddWishlistApi(vendorSession, seed.standard.id);
      expect(wishlist?.items?.length).toBe(1);
      expect(await getWishlistItemCount(vendorSession)).toBe(1);
    });

    test('WF-WL-005 | Rapid duplicate UI clicks stay idempotent', async ({ page }) => {
      await vendorUi(page);
      const productsPage = new VendorProductsPage(page);
      await productsPage.goto();
      await productsPage.setGridView();
      await productsPage.search(seed.standard.name);
      const heart = productsPage
        .cardByName(seed.standard.name)
        .locator('button[title="Add to Wishlist"]');
      const waitForWishlistAdd = () =>
        page.waitForResponse(
          (resp) =>
            resp.url().includes('/api/v1/wishlist/add') &&
            resp.request().method() === 'POST' &&
            resp.ok(),
          { timeout: 15000 }
        );

      await heart.click();
      await waitForWishlistAdd();
      await heart.click();
      await waitForWishlistAdd();
      expect(await getWishlistItemCount(vendorSession)).toBe(1);
    });
  });

  test.describe('Section C — Remove', () => {
    test('WF-WL-006 | Remove product via UI', async ({ page }) => {
      await vendorUi(page);
      await addToWishlistApi(vendorSession, seed.standard.id);
      const wishlistPage = new VendorWishlistPage(page);
      await wishlistPage.goto();
      await wishlistPage.waitForLoad();
      await wishlistPage.removeProductByName(seed.standard.name);
      await wishlistPage.expectEmptyWishlist();
    });

    test('WF-WL-007 | Remove synchronizes with API', async () => {
      await ensureEmptyWishlist(vendorSession);
      await addToWishlistApi(vendorSession, seed.standard.id);
      await removeFromWishlistApi(vendorSession, seed.standard.id);
      expect(await getWishlistItemCount(vendorSession)).toBe(0);
    });

    test('WF-WL-008 | Refresh after remove shows empty state', async ({ page }) => {
      await vendorUi(page);
      await addToWishlistApi(vendorSession, seed.standard.id);
      await removeFromWishlistApi(vendorSession, seed.standard.id);
      const wishlistPage = new VendorWishlistPage(page);
      await wishlistPage.goto();
      await wishlistPage.waitForLoad();
      await page.reload();
      await wishlistPage.waitForLoad();
      await wishlistPage.expectEmptyWishlist();
    });
  });

  test.describe('Section D — Persistence', () => {
    test('WF-WL-009 | Wishlist survives page refresh', async ({ page }) => {
      await vendorUi(page);
      await addToWishlistApi(vendorSession, seed.standard.id);
      const wishlistPage = new VendorWishlistPage(page);
      await wishlistPage.goto();
      await wishlistPage.waitForLoad();
      await page.reload();
      await wishlistPage.waitForLoad();
      await expect(wishlistPage.productTitle(seed.standard.name)).toBeVisible();
    });

    test('WF-WL-010 | Wishlist survives new browser session', async ({ page }) => {
      await ensureEmptyWishlist(vendorSession);
      await addToWishlistApi(vendorSession, seed.standard.id);
      await addToWishlistApi(vendorSession, seed.second.id);
      await establishSession(page, 'vendor');
      const wishlistPage = new VendorWishlistPage(page);
      await wishlistPage.goto();
      await wishlistPage.waitForLoad();
      await expect(wishlistPage.productTitle(seed.standard.name)).toBeVisible();
      await expect(wishlistPage.productTitle(seed.second.name)).toBeVisible();
    });

    test('WF-WL-011 | Refresh after add shows product', async ({ page }) => {
      await vendorUi(page);
      const productsPage = new VendorProductsPage(page);
      await productsPage.goto();
      await productsPage.setGridView();
      await productsPage.search(seed.standard.name);
      await productsPage.addToWishlistByName(seed.standard.name);
      await expect(page.locator('text=/added to wishlist/i')).toBeVisible({ timeout: 10000 });
      const wishlistPage = new VendorWishlistPage(page);
      await wishlistPage.goto();
      await wishlistPage.waitForLoad();
      await page.reload();
      await wishlistPage.waitForLoad();
      await expect(wishlistPage.productTitle(seed.standard.name)).toBeVisible();
    });
  });

  test.describe('Section E — Badge & Dashboard Count', () => {
    test('WF-WL-012 | Header wishlist badge shows item count', async ({ page }) => {
      await vendorUi(page);
      await addToWishlistApi(vendorSession, seed.standard.id);
      await addToWishlistApi(vendorSession, seed.second.id);
      await page.goto('/vendor/products');
      await expect(page.locator('a[aria-label="Wishlist"] span')).toHaveText('2', {
        timeout: 15000,
      });
    });

    test('WF-WL-013 | Header badge caps at 9+', async ({ page }) => {
      await vendorUi(page);
      for (let i = 0; i < 10; i += 1) {
        const created = await createProductApi(adminSession, {
          name: uniqueProductName(`pf-wl-badge-${i}`),
          price: 10 + i,
          categoryId: seed.categoryId,
          stock: 20,
          moq: 1,
        });
        await addToWishlistApi(vendorSession, String(created._id || created.id));
      }
      await page.goto('/vendor/products');
      await expect(page.locator('a[aria-label="Wishlist"] span')).toHaveText('9+', {
        timeout: 15000,
      });
    });

    test('WF-WL-014 | Dashboard wishlist count updates', async ({ page }) => {
      await vendorUi(page);
      await addToWishlistApi(vendorSession, seed.standard.id);
      await addToWishlistApi(vendorSession, seed.second.id);
      await addToWishlistApi(vendorSession, seed.third.id);
      await page.goto('/vendor/dashboard');
      await expect(page.getByText('Wishlist Products').locator('..').getByText('3')).toBeVisible({
        timeout: 15000,
      });
    });

    test('WF-WL-015 | Page subtitle shows Saved products count', async ({ page }) => {
      await vendorUi(page);
      await addToWishlistApi(vendorSession, seed.standard.id);
      await addToWishlistApi(vendorSession, seed.second.id);
      const wishlistPage = new VendorWishlistPage(page);
      await wishlistPage.goto();
      await wishlistPage.waitForLoad();
      await expect(page.getByText('Saved products (2)')).toBeVisible();
    });
  });

  test.describe('Section F — Navigation', () => {
    test('WF-WL-016 | Sidebar navigation to wishlist', async ({ page }) => {
      await vendorUi(page);
      await page.goto('/vendor/dashboard');
      await page.getByLabel('Main navigation').getByRole('link', { name: 'Wishlist' }).click();
      await expect(page).toHaveURL(/\/vendor\/wishlist/);
      await expect(page.getByRole('heading', { name: 'Wishlist' })).toBeVisible();
    });

    test('WF-WL-017 | Header heart icon navigation', async ({ page }) => {
      await vendorUi(page);
      await page.goto('/vendor/products');
      await page.locator('a[aria-label="Wishlist"]').click();
      await expect(page).toHaveURL(/\/vendor\/wishlist/);
      await expect(page.getByRole('heading', { name: 'Wishlist' })).toBeVisible();
    });

    test('WF-WL-018 | Empty state Browse Products link navigates', async ({ page }) => {
      await vendorUi(page);
      const wishlistPage = new VendorWishlistPage(page);
      await wishlistPage.goto();
      await wishlistPage.waitForLoad();
      await wishlistPage.browseProductsLink().click();
      await expect(page).toHaveURL(/\/vendor\/products/);
    });
  });

  test.describe('Section G — Mapper & Product States', () => {
    test('WF-WL-019 | Deleted products filtered from UI', async ({ page }) => {
      await vendorUi(page);
      const created = await createProductApi(adminSession, {
        name: uniqueProductName('pf-wl-delete'),
        price: 99,
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
      await expect(wishlistPage.productTitle(String(created.name))).toHaveCount(0);
      await expect(page.getByText('Saved products (1)')).toBeVisible();
    });

    test('WF-WL-020 | Inactive product appears on wishlist', async ({ page }) => {
      await vendorUi(page);
      await addToWishlistApi(vendorSession, seed.inactive.id);
      const wishlistPage = new VendorWishlistPage(page);
      await wishlistPage.goto();
      await wishlistPage.waitForLoad();
      await expect(wishlistPage.productTitle(seed.inactive.name)).toBeVisible();
    });

    test('WF-WL-021 | Low stock status badge on wishlist card', async ({ page }) => {
      await vendorUi(page);
      await addToWishlistApi(vendorSession, seed.lowStock.id);
      const wishlistPage = new VendorWishlistPage(page);
      await wishlistPage.goto();
      await wishlistPage.waitForLoad();
      const card = wishlistPage.cardByProductName(seed.lowStock.name);
      await expect(card.locator('span', { hasText: 'Low Stock' })).toBeVisible();
    });
  });

  test.describe('Section H — Cart Bridge', () => {
    test('WF-WL-022 | Out-of-stock Add to Cart disabled on wishlist', async ({ page }) => {
      await vendorUi(page);
      await addToWishlistApi(vendorSession, seed.oos.id);
      const wishlistPage = new VendorWishlistPage(page);
      await wishlistPage.goto();
      await wishlistPage.waitForLoad();
      await wishlistPage.expectOutOfStockAddBlocked(seed.oos.name);
    });

    test('WF-WL-023 | MOQ quantity passed to cart from wishlist', async ({ page }) => {
      await vendorUi(page);
      await addToWishlistApi(vendorSession, seed.moq5.id);
      const wishlistPage = new VendorWishlistPage(page);
      await wishlistPage.goto();
      await wishlistPage.waitForLoad();
      await wishlistPage.addToCartButton(seed.moq5.name).click();
      await expect(page.locator('text=/added to cart/i')).toBeVisible({ timeout: 10000 });
      expect(await getCartLineQuantity(vendorSession, seed.moq5.id)).toBe(5);
    });

    test('WF-WL-024 | Item remains on wishlist after add to cart', async ({ page }) => {
      await vendorUi(page);
      await addToWishlistApi(vendorSession, seed.standard.id);
      const wishlistPage = new VendorWishlistPage(page);
      await wishlistPage.goto();
      await wishlistPage.waitForLoad();
      await wishlistPage.addToCartButton(seed.standard.name).click();
      await expect(page.locator('text=/added to cart/i')).toBeVisible({ timeout: 10000 });
      await expect(wishlistPage.productTitle(seed.standard.name)).toBeVisible();
      expect(await wishlistContainsProduct(vendorSession, seed.standard.id)).toBe(true);
    });
  });

  test.describe('Section I — Rendering & States', () => {
    test('WF-WL-025 | Multiple products render in grid', async ({ page }) => {
      await vendorUi(page);
      await addToWishlistApi(vendorSession, seed.standard.id);
      await addToWishlistApi(vendorSession, seed.second.id);
      await addToWishlistApi(vendorSession, seed.third.id);
      const wishlistPage = new VendorWishlistPage(page);
      await wishlistPage.goto();
      await wishlistPage.waitForLoad();
      await expect(wishlistPage.productTitle(seed.standard.name)).toBeVisible();
      await expect(wishlistPage.productTitle(seed.second.name)).toBeVisible();
      await expect(wishlistPage.productTitle(seed.third.name)).toBeVisible();
    });

    test('WF-WL-026 | Loading state shown while fetching', async ({ page }) => {
      await vendorUi(page);
      await interceptWishlistLoad(page, async (route) => {
        if (route.request().method() === 'GET' && route.request().url().endsWith('/wishlist')) {
          await new Promise((resolve) => setTimeout(resolve, 1200));
          await route.continue();
          return;
        }
        await route.continue();
      });
      const wishlistPage = new VendorWishlistPage(page);
      await wishlistPage.goto();
      await expect(page.getByText('Loading wishlist...')).toBeVisible({ timeout: 5000 });
      await wishlistPage.waitForLoad();
      await page.unroute('**/api/v1/wishlist**');
    });

    test('WF-WL-027 | Error banner shown when load fails', async ({ page }) => {
      await vendorUi(page);
      await interceptWishlistLoadFailure(page);
      const wishlistPage = new VendorWishlistPage(page);
      await wishlistPage.goto();
      await expect(page.locator('text=/Wishlist unavailable|Failed to load wishlist/i')).toBeVisible({
        timeout: 15000,
      });
      await wishlistPage.expectEmptyWishlist();
      await page.unroute('**/api/v1/wishlist');
    });

    test('WF-WL-028 | Empty state when no items', async ({ page }) => {
      await vendorUi(page);
      const wishlistPage = new VendorWishlistPage(page);
      await wishlistPage.goto();
      await wishlistPage.waitForLoad();
      await wishlistPage.expectEmptyWishlist();
    });
  });

  test.describe('Section J — Concurrent Updates', () => {
    test('WF-WL-029 | API add reflected after page refresh', async ({ page }) => {
      await vendorUi(page);
      const wishlistPage = new VendorWishlistPage(page);
      await wishlistPage.goto();
      await wishlistPage.waitForLoad();
      await wishlistPage.expectEmptyWishlist();
      await addToWishlistApi(vendorSession, seed.standard.id);
      await page.reload();
      await wishlistPage.waitForLoad();
      await expect(wishlistPage.productTitle(seed.standard.name)).toBeVisible();
    });

    test('WF-WL-030 | API remove reflected after page refresh', async ({ page }) => {
      await vendorUi(page);
      await addToWishlistApi(vendorSession, seed.standard.id);
      const wishlistPage = new VendorWishlistPage(page);
      await wishlistPage.goto();
      await wishlistPage.waitForLoad();
      await removeFromWishlistApi(vendorSession, seed.standard.id);
      await page.reload();
      await wishlistPage.waitForLoad();
      await wishlistPage.expectEmptyWishlist();
    });

    test('WF-WL-031 | Wishlist API item count matches UI cards', async ({ page }) => {
      await vendorUi(page);
      await addToWishlistApi(vendorSession, seed.standard.id);
      await addToWishlistApi(vendorSession, seed.second.id);
      const wishlist = await getWishlistApi(vendorSession);
      const apiCount = (wishlist?.items ?? []).filter((item) =>
        Boolean(resolveRefId(item.productId))
      ).length;
      const wishlistPage = new VendorWishlistPage(page);
      await wishlistPage.goto();
      await wishlistPage.waitForLoad();
      await expect(page.locator('div.bg-white.rounded-lg.border').filter({ has: page.locator('h3') })).toHaveCount(
        apiCount
      );
    });
  });
});
