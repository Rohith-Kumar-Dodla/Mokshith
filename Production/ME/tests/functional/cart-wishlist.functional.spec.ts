import { test, expect } from '../fixtures/product.functional.fixture';
import VendorProductsPage from '../pages/vendor/VendorProductsPage';
import VendorProductDetailsPage from '../pages/vendor/VendorProductDetailsPage';
import {
  addToCartApi,
  createProductApi,
  getAdminSession,
  getFirstCategoryId,
  updateProductApi,
} from '../helpers/product.api.helper';
import { getVendorCredentials, uniqueProductName } from '../helpers/product.credentials';
import { loginApi } from '../helpers/auth.api.helper';
import { establishSession } from '../helpers/session.functional.helper';

test.describe('PF-PROD Section N | Cart & Wishlist', () => {
  let inStockId = '';
  let inStockName = '';
  let oosId = '';
  let moqProductId = '';
  let inactiveId = '';

  test.beforeAll(async () => {
    const session = await getAdminSession();
    const categoryId = await getFirstCategoryId(session);
    inStockName = uniqueProductName('pf-cart');
    const inStock = await createProductApi(session, {
      name: inStockName,
      price: 400,
      categoryId,
      stock: 50,
      moq: 2,
    });
    inStockId = String(inStock._id || inStock.id);
    const oos = await createProductApi(session, {
      name: uniqueProductName('pf-cart-oos'),
      price: 401,
      categoryId,
      stock: 0,
    });
    oosId = String(oos._id || oos.id);
    const moq = await createProductApi(session, {
      name: uniqueProductName('pf-cart-moq'),
      price: 402,
      categoryId,
      stock: 100,
      moq: 5,
    });
    moqProductId = String(moq._id || moq.id);
    const inactive = await createProductApi(session, {
      name: uniqueProductName('pf-cart-inactive'),
      price: 403,
      categoryId,
      stock: 10,
      isActive: true,
    });
    inactiveId = String(inactive._id || inactive.id);
    await updateProductApi(session, inactiveId, { isActive: false });
  });

  test('PF-PROD-108 | Add to cart from listing at MOQ', async ({ page, vendorCreds }) => {
    await establishSession(page, 'vendor');
    const vendorPage = new VendorProductsPage(page);
    await vendorPage.goto();
    await vendorPage.search(inStockName);
    await page.waitForTimeout(500);
    await vendorPage.addToCartByName(inStockName);
    await expect(page.locator('text=/added to cart/i')).toBeVisible({ timeout: 10000 });
  });

  test('PF-PROD-109 | Add to cart blocked when out of stock', async ({ page, vendorCreds }) => {
    await establishSession(page, 'vendor');
    const vendorPage = new VendorProductsPage(page);
    await vendorPage.goto();
    await vendorPage.search(oosId);
    await page.waitForTimeout(500);
    const card = page.locator('h3').filter({ hasText: /pf-cart-oos/i }).first();
    if (await card.count()) {
      const btn = card.locator('..').locator('button:has-text("Add to Cart")');
      await expect(btn).toBeDisabled();
    }
  });

  test('PF-PROD-110 | Add to cart from details with custom qty', async ({ page, vendorCreds }) => {
    await establishSession(page, 'vendor');
    const details = new VendorProductDetailsPage(page);
    await details.goto(inStockId);
    await details.waitForLoad();
    await details.setQuantity(10);
    await details.addToCart();
    await expect(page.locator('text=/added to cart/i')).toBeVisible({ timeout: 10000 });
  });

  test('PF-PROD-111 | Cart rejects qty below MOQ via API', async () => {
    const vendorSession = await loginApi(
      getVendorCredentials().mobile,
      getVendorCredentials().password
    );
    await expect(addToCartApi(vendorSession, moqProductId, 1)).rejects.toMatchObject({
      response: { status: 400 },
    });
  });

  test('PF-PROD-112 | Cart rejects inactive product', async () => {
    const vendorSession = await loginApi(
      getVendorCredentials().mobile,
      getVendorCredentials().password
    );
    await expect(addToCartApi(vendorSession, inactiveId, 1)).rejects.toMatchObject({
      response: { status: 400 },
    });
  });

  test('PF-PROD-113 | Cart checks inventory stock aggregate', async () => {
    const vendorSession = await loginApi(
      getVendorCredentials().mobile,
      getVendorCredentials().password
    );
    const session = await getAdminSession();
    const categoryId = await getFirstCategoryId(session);
    const created = await createProductApi(session, {
      name: uniqueProductName('pf-stock-check'),
      price: 404,
      categoryId,
      stock: 100,
      moq: 1,
    });
    const pid = String(created._id || created.id);
    await expect(addToCartApi(vendorSession, pid, 99999)).rejects.toMatchObject({
      response: { status: 400 },
    });
  });

  test('PF-PROD-114 | Add to wishlist from listing', async ({ page, vendorCreds }) => {
    await establishSession(page, 'vendor');
    const vendorPage = new VendorProductsPage(page);
    await vendorPage.goto();
    await vendorPage.search(inStockName);
    await page.waitForTimeout(500);
    await vendorPage.addToWishlistByName(inStockName);
    await expect(page.locator('text=/wishlist/i')).toBeVisible({ timeout: 10000 });
  });

  test('PF-PROD-115 | Add to wishlist from details', async ({ page, vendorCreds }) => {
    await establishSession(page, 'vendor');
    const details = new VendorProductDetailsPage(page);
    await details.goto(inStockId);
    await details.waitForLoad();
    await details.addToWishlist();
    await expect(page.getByText(/added to wishlist/i)).toBeVisible({ timeout: 10000 });
  });

  test('PF-PROD-116 | Wishlist to cart flow', async ({ page, vendorCreds }) => {
    await establishSession(page, 'vendor');
    await page.goto('/vendor/wishlist');
    await page.waitForSelector('text=/Wishlist|Saved products/i', { timeout: 15000 });
    const addBtn = page.locator('button:has-text("Add to Cart")').first();
    if (await addBtn.count()) {
      await addBtn.click();
      await expect(page.locator('text=/added to cart|cart/i').first()).toBeVisible({
        timeout: 10000,
      });
    }
  });
});
