import { test, expect } from '../fixtures/product.functional.fixture';
import VendorWishlistPage from '../pages/vendor/VendorWishlistPage';
import VendorProductsPage from '../pages/vendor/VendorProductsPage';
import {
  addToWishlistApi,
  ensureEmptyWishlist,
  getWishlistApi,
  removeFromWishlistApi,
} from '../helpers/wishlist.api.helper';
import {
  createProductApi,
  getAdminSession,
  getFirstCategoryId,
} from '../helpers/product.api.helper';
import { getVendorCredentials, uniqueProductName } from '../helpers/product.credentials';
import { loginApi, type ApiSession } from '../helpers/auth.api.helper';
import { establishSession } from '../helpers/session.functional.helper';

test.describe('Wishlist Smoke Suite', () => {
  let smokeProductId = '';
  let smokeProductName = '';
  let vendorSession: ApiSession;

  test.beforeAll(async () => {
    const adminSession = await getAdminSession();
    const categoryId = await getFirstCategoryId(adminSession);
    smokeProductName = uniqueProductName('ps-wl');
    const created = await createProductApi(adminSession, {
      name: smokeProductName,
      price: 350,
      categoryId,
      stock: 100,
      moq: 1,
    });
    smokeProductId = String(created._id || created.id);

    const vendorCreds = getVendorCredentials();
    vendorSession = await loginApi(vendorCreds.mobile, vendorCreds.password);
    await ensureEmptyWishlist(vendorSession);
  });

  test('PS-WL-001 | Vendor navigates to wishlist page', async ({ page }) => {
    await ensureEmptyWishlist(vendorSession);
    await establishSession(page, 'vendor');

    const wishlistPage = new VendorWishlistPage(page);
    await wishlistPage.goto();
    await wishlistPage.waitForLoad();

    await expect(wishlistPage.pageHeading()).toBeVisible();
    await expect(page.getByText(/Saved products/i)).toBeVisible();
  });

  test('PS-WL-002 | Empty wishlist shows empty state', async ({ page }) => {
    await ensureEmptyWishlist(vendorSession);
    await establishSession(page, 'vendor');

    const wishlistPage = new VendorWishlistPage(page);
    await wishlistPage.goto();
    await wishlistPage.waitForLoad();
    await wishlistPage.expectEmptyWishlist();
  });

  test('PS-WL-003 | Add in-stock product from listing', async ({ page }) => {
    await ensureEmptyWishlist(vendorSession);
    await establishSession(page, 'vendor');

    const productsPage = new VendorProductsPage(page);
    await productsPage.goto();
    await productsPage.setGridView();
    await productsPage.search(smokeProductName);
    await productsPage.addToWishlistByName(smokeProductName);

    await expect(page.locator('text=/added to wishlist/i')).toBeVisible({ timeout: 10000 });
  });

  test('PS-WL-004 | Wishlist page displays added product', async ({ page }) => {
    await ensureEmptyWishlist(vendorSession);
    await addToWishlistApi(vendorSession, smokeProductId);
    await establishSession(page, 'vendor');

    const wishlistPage = new VendorWishlistPage(page);
    await wishlistPage.goto();
    await wishlistPage.waitForLoad();

    await expect(wishlistPage.productTitle(smokeProductName)).toBeVisible({ timeout: 10000 });
    await expect(wishlistPage.addToCartButton(smokeProductName)).toBeVisible();
  });

  test('PS-WL-005 | Navbar wishlist badge shows item count', async ({ page }) => {
    await ensureEmptyWishlist(vendorSession);
    await addToWishlistApi(vendorSession, smokeProductId);
    await establishSession(page, 'vendor');

    await page.goto('/vendor/products');
    await expect(page.locator('a[aria-label="Wishlist"] span')).toHaveText('1', { timeout: 15000 });
  });

  test('PS-WL-006 | Remove item from wishlist', async ({ page }) => {
    await ensureEmptyWishlist(vendorSession);
    await addToWishlistApi(vendorSession, smokeProductId);
    await establishSession(page, 'vendor');

    const wishlistPage = new VendorWishlistPage(page);
    await wishlistPage.goto();
    await wishlistPage.waitForLoad();
    await expect(wishlistPage.productTitle(smokeProductName)).toBeVisible();

    await wishlistPage.removeProductByName(smokeProductName);
    await wishlistPage.expectEmptyWishlist();
  });

  test('PS-WL-007 | Wishlist persists after page refresh', async ({ page }) => {
    await ensureEmptyWishlist(vendorSession);
    await addToWishlistApi(vendorSession, smokeProductId);
    await establishSession(page, 'vendor');

    const wishlistPage = new VendorWishlistPage(page);
    await wishlistPage.goto();
    await wishlistPage.waitForLoad();
    await expect(wishlistPage.productTitle(smokeProductName)).toBeVisible();

    await page.reload();
    await wishlistPage.waitForLoad();
    await expect(wishlistPage.productTitle(smokeProductName)).toBeVisible({ timeout: 10000 });
  });

  test('PS-WL-008 | Sidebar navigation to wishlist works', async ({ page }) => {
    await ensureEmptyWishlist(vendorSession);
    await establishSession(page, 'vendor');

    await page.goto('/vendor/dashboard');
    await page.getByLabel('Main navigation').getByRole('link', { name: 'Wishlist' }).click();

    await expect(page).toHaveURL(/\/vendor\/wishlist/, { timeout: 15000 });
    await expect(page.getByRole('heading', { name: 'Wishlist' })).toBeVisible();
  });

  test('PS-WL-009 | GET /wishlist returns wishlist for authenticated vendor', async () => {
    await ensureEmptyWishlist(vendorSession);
    await addToWishlistApi(vendorSession, smokeProductId);

    const wishlist = await getWishlistApi(vendorSession);
    expect(wishlist).toBeTruthy();
    expect(wishlist?.items?.length).toBe(1);
  });

  test('PS-WL-010 | POST /wishlist/add adds product successfully', async () => {
    await ensureEmptyWishlist(vendorSession);

    const wishlist = await addToWishlistApi(vendorSession, smokeProductId);
    expect(wishlist?.items?.length).toBe(1);
  });

  test('PS-WL-011 | DELETE /wishlist/remove/:productId removes product', async () => {
    await ensureEmptyWishlist(vendorSession);
    await addToWishlistApi(vendorSession, smokeProductId);

    const updated = await removeFromWishlistApi(vendorSession, smokeProductId);
    const remaining = updated?.items ?? [];
    expect(remaining.length).toBe(0);
  });
});
