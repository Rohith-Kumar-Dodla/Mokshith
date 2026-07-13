import { test, expect } from '../fixtures/product.functional.fixture';
import VendorCartPage from '../pages/vendor/VendorCartPage';
import VendorProductsPage from '../pages/vendor/VendorProductsPage';
import {
  addToCartApi,
  clearCartApi,
  getCartApi,
  removeFromCartApi,
} from '../helpers/cart.api.helper';
import {
  createProductApi,
  getAdminSession,
  getFirstCategoryId,
} from '../helpers/product.api.helper';
import { getVendorCredentials, uniqueProductName } from '../helpers/product.credentials';
import { loginApi, type ApiSession } from '../helpers/auth.api.helper';
import { establishSession } from '../helpers/session.functional.helper';

test.describe('Cart Smoke Suite', () => {
  let smokeProductId = '';
  let smokeProductName = '';
  let vendorSession: ApiSession;

  test.beforeAll(async () => {
    const adminSession = await getAdminSession();
    const categoryId = await getFirstCategoryId(adminSession);
    smokeProductName = uniqueProductName('ps-cart');
    const created = await createProductApi(adminSession, {
      name: smokeProductName,
      price: 250,
      categoryId,
      stock: 100,
      moq: 1,
    });
    smokeProductId = String(created._id || created.id);

    const vendorCreds = getVendorCredentials();
    vendorSession = await loginApi(vendorCreds.mobile, vendorCreds.password);
    await clearCartApi(vendorSession);
  });

  test('PS-CART-001 | Vendor navigates to cart page', async ({ page }) => {
    await clearCartApi(vendorSession);
    await establishSession(page, 'vendor');

    const cartPage = new VendorCartPage(page);
    await cartPage.goto();
    await cartPage.waitForLoad();

    await expect(cartPage.pageHeading()).toBeVisible();
    await expect(page.getByText('Review your items and proceed to checkout.')).toBeVisible();
  });

  test('PS-CART-002 | Empty cart shows empty state', async ({ page }) => {
    await clearCartApi(vendorSession);
    await establishSession(page, 'vendor');

    const cartPage = new VendorCartPage(page);
    await cartPage.goto();
    await cartPage.waitForLoad();
    await cartPage.expectEmptyCart();
  });

  test('PS-CART-003 | Add in-stock product from listing at MOQ', async ({ page }) => {
    await clearCartApi(vendorSession);
    await establishSession(page, 'vendor');

    const productsPage = new VendorProductsPage(page);
    await productsPage.goto();
    await productsPage.search(smokeProductName);
    await productsPage.addToCartByName(smokeProductName);

    await expect(page.locator('text=/added to cart/i')).toBeVisible({ timeout: 10000 });
  });

  test('PS-CART-004 | Cart page displays added product', async ({ page }) => {
    await clearCartApi(vendorSession);
    await addToCartApi(vendorSession, smokeProductId, 1);
    await establishSession(page, 'vendor');

    const cartPage = new VendorCartPage(page);
    await cartPage.goto();
    await cartPage.waitForLoad();

    await expect(cartPage.productTitle(smokeProductName)).toBeVisible({ timeout: 10000 });
    await expect(cartPage.orderSummaryHeading()).toBeVisible();
  });

  test('PS-CART-005 | Navbar cart badge shows item count', async ({ page }) => {
    await clearCartApi(vendorSession);
    await addToCartApi(vendorSession, smokeProductId, 1);
    await establishSession(page, 'vendor');

    await page.goto('/vendor/products');
    await expect(page.locator('a[aria-label="Cart"] span')).toHaveText('1', { timeout: 15000 });
  });

  test('PS-CART-006 | Remove item from cart', async ({ page }) => {
    await clearCartApi(vendorSession);
    await addToCartApi(vendorSession, smokeProductId, 1);
    await establishSession(page, 'vendor');

    const cartPage = new VendorCartPage(page);
    await cartPage.goto();
    await cartPage.waitForLoad();
    await expect(cartPage.productTitle(smokeProductName)).toBeVisible();

    await cartPage.removeProductByName(smokeProductName);
    await cartPage.expectEmptyCart();
  });

  test('PS-CART-007 | Proceed to Checkout navigates to checkout', async ({ page }) => {
    await clearCartApi(vendorSession);
    await addToCartApi(vendorSession, smokeProductId, 1);
    await establishSession(page, 'vendor');

    const cartPage = new VendorCartPage(page);
    await cartPage.goto();
    await cartPage.waitForLoad();
    await cartPage.proceedToCheckoutLink().click();

    await expect(page).toHaveURL(/\/vendor\/checkout/, { timeout: 15000 });
    await expect(page.getByRole('heading', { name: 'Order Checkout' })).toBeVisible();
  });

  test('PS-CART-008 | GET /cart returns cart for authenticated vendor', async () => {
    await clearCartApi(vendorSession);
    await addToCartApi(vendorSession, smokeProductId, 1);

    const cart = await getCartApi(vendorSession);
    expect(cart).toBeTruthy();
    expect(cart?.items?.length).toBe(1);
  });

  test('PS-CART-009 | POST /cart adds product successfully', async () => {
    await clearCartApi(vendorSession);

    const cart = await addToCartApi(vendorSession, smokeProductId, 1);
    expect(cart?.items?.length).toBe(1);
    expect(String(cart?.items?.[0]?.quantity ?? 0)).toBe('1');
  });

  test('PS-CART-010 | DELETE /cart/:productId removes product', async () => {
    await clearCartApi(vendorSession);
    await addToCartApi(vendorSession, smokeProductId, 1);

    const updated = await removeFromCartApi(vendorSession, smokeProductId);
    const remaining = updated?.items ?? [];
    expect(remaining.length).toBe(0);
  });
});
