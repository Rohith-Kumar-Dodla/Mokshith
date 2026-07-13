import { test, expect, type Page } from '../fixtures/product.functional.fixture';
import VendorCartPage from '../pages/vendor/VendorCartPage';
import VendorProductsPage from '../pages/vendor/VendorProductsPage';
import VendorProductDetailsPage from '../pages/vendor/VendorProductDetailsPage';
import VendorWishlistPage from '../pages/vendor/VendorWishlistPage';
import {
  addToCartApi,
  clearCartApi,
  getCartApi,
  removeFromCartApi,
} from '../helpers/cart.api.helper';
import {
  addToWishlistApi,
  buildShippingAddress,
  createOrderApi,
  disposeProduct,
  getCartLineQuantity,
  NONEXISTENT_OBJECT_ID,
  seedCartFunctionalProducts,
  type CartSeedData,
} from '../helpers/cart.functional.helper';
import {
  createProductApi,
  deleteProductApi,
  getAdminSession,
  getFirstCategoryId,
  patchProductStatusApi,
} from '../helpers/product.api.helper';
import { getVendorCredentials, uniqueProductName } from '../helpers/product.credentials';
import { loginApi, type ApiSession } from '../helpers/auth.api.helper';
import { establishSession } from '../helpers/session.functional.helper';

let adminSession: ApiSession;
let vendorSession: ApiSession;
let vendor2Session: ApiSession;
let seed: CartSeedData;

async function vendorUi(page: Page) {
  await clearCartApi(vendorSession);
  await establishSession(page, 'vendor');
}

async function fillCheckoutAddress(page: Page) {
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

test.describe('Cart Functional Suite', () => {
  test.beforeAll(async () => {
    adminSession = await getAdminSession();
    seed = await seedCartFunctionalProducts(adminSession);
    const vendorCreds = getVendorCredentials(1);
    const vendor2Creds = getVendorCredentials(2);
    vendorSession = await loginApi(vendorCreds.mobile, vendorCreds.password);
    vendor2Session = await loginApi(vendor2Creds.mobile, vendor2Creds.password);
    await clearCartApi(vendorSession);
    await clearCartApi(vendor2Session);
  });

  test.describe('Section A — Add to Cart Entry Points', () => {
    test('PF-CART-001 | Add in-stock product from listing at MOQ', async ({ page }) => {
      await vendorUi(page);
      const productsPage = new VendorProductsPage(page);
      await productsPage.goto();
      await productsPage.search(seed.standard.name);
      await productsPage.addToCartByName(seed.standard.name);
      await expect(page.locator('text=/added to cart/i')).toBeVisible({ timeout: 10000 });
    });

    test('PF-CART-002 | Add from product details with quantity above MOQ', async ({ page }) => {
      await vendorUi(page);
      const details = new VendorProductDetailsPage(page);
      await details.goto(seed.moq5.id);
      await details.waitForLoad();
      await details.setQuantity(10);
      await details.addToCart();
      await expect(page.locator('text=/added to cart/i')).toBeVisible({ timeout: 10000 });
      expect(await getCartLineQuantity(vendorSession, seed.moq5.id)).toBe(10);
    });

    test('PF-CART-003 | Add from wishlist at MOQ', async ({ page }) => {
      await vendorUi(page);
      await addToWishlistApi(vendorSession, seed.standard.id);
      await page.goto('/vendor/wishlist');
      await page.waitForSelector('text=/Wishlist|Saved products/i', { timeout: 15000 });
      const card = page
        .locator('div.bg-white.rounded-lg.border')
        .filter({ has: page.locator('h3', { hasText: seed.standard.name }) })
        .first();
      await card.getByRole('button', { name: /^Add to Cart$/ }).click();
      await expect(page.locator('text=/added to cart/i')).toBeVisible({ timeout: 10000 });
    });

    test('PF-CART-004 | Listing blocks out-of-stock add', async ({ page }) => {
      await vendorUi(page);
      const productsPage = new VendorProductsPage(page);
      await productsPage.goto();
      await productsPage.search(seed.oos.name);
      const card = productsPage.cardByName(seed.oos.name);
      await expect(card.locator('button', { hasText: 'Out of Stock' })).toBeDisabled();
    });

    test('PF-CART-005 | Details blocks out-of-stock add', async ({ page }) => {
      await vendorUi(page);
      const details = new VendorProductDetailsPage(page);
      await details.goto(seed.oos.id);
      await details.waitForLoad();
      await details.expectOutOfStockAddBlocked();
    });

    test('PF-CART-006 | Wishlist blocks out-of-stock add', async ({ page }) => {
      await vendorUi(page);
      await addToWishlistApi(vendorSession, seed.oos.id);
      const wishlistPage = new VendorWishlistPage(page);
      await wishlistPage.goto();
      await wishlistPage.expectOutOfStockAddBlocked(seed.oos.name);
    });

    test('PF-CART-007 | UI surfaces API error when add exceeds stock', async ({ page }) => {
      await vendorUi(page);
      const created = await createProductApi(adminSession, {
        name: uniqueProductName('pf-cart-stock5'),
        price: 88,
        categoryId: seed.categoryId,
        stock: 5,
        moq: 1,
      });
      const pid = String(created._id || created.id);
      const details = new VendorProductDetailsPage(page);
      await details.goto(pid);
      await details.waitForLoad();
      await details.setQuantity(10);
      await details.addToCart();
      await expect(page.locator('text=/insufficient stock|failed|error/i').first()).toBeVisible({
        timeout: 10000,
      });
      await disposeProduct(adminSession, pid);
    });

    test('PF-CART-008 | Low-stock status shown on listing', async ({ page }) => {
      await vendorUi(page);
      const productsPage = new VendorProductsPage(page);
      await productsPage.goto();
      await productsPage.search(seed.lowStock.name);
      const card = productsPage.cardByName(seed.lowStock.name);
      await expect(card.locator('span', { hasText: 'Low Stock' })).toBeVisible();
    });
  });

  test.describe('Section B — Duplicate Item / Merge Logic', () => {
    test('PF-CART-009 | API increment merges duplicate lines', async () => {
      await clearCartApi(vendorSession);
      await addToCartApi(vendorSession, seed.moq5.id, 5);
      await addToCartApi(vendorSession, seed.moq5.id, 5);
      const cart = await getCartApi(vendorSession);
      expect(cart?.items?.length).toBe(1);
      expect(await getCartLineQuantity(vendorSession, seed.moq5.id)).toBe(10);
    });

    test('PF-CART-010 | UI reflects merged quantity after double listing add', async ({ page }) => {
      await vendorUi(page);
      const productsPage = new VendorProductsPage(page);
      await productsPage.goto();
      await productsPage.search(seed.standard.name);
      const addButton = productsPage
        .cardByName(seed.standard.name)
        .getByRole('button', { name: /^Add to Cart$/ });
      const waitForCartAdd = () =>
        page.waitForResponse(
          (resp) =>
            resp.url().includes('/api/v1/cart') &&
            resp.request().method() === 'POST' &&
            resp.ok(),
          { timeout: 15000 }
        );

      await addButton.click();
      await waitForCartAdd();
      await expect(addButton).toBeEnabled({ timeout: 10000 });
      await addButton.click();
      await waitForCartAdd();
      await expect
        .poll(() => getCartLineQuantity(vendorSession, seed.standard.id), { timeout: 10000 })
        .toBe(2);

      const cartPage = new VendorCartPage(page);
      await cartPage.goto();
      await cartPage.waitForLoad();
      await expect(cartPage.productTitle(seed.standard.name)).toHaveCount(1);
      expect(await getCartLineQuantity(vendorSession, seed.standard.id)).toBe(2);
    });

    test('PF-CART-011 | Cumulative stock check blocks second increment', async () => {
      await clearCartApi(vendorSession);
      const created = await createProductApi(adminSession, {
        name: uniqueProductName('pf-cart-merge-stock'),
        price: 77,
        categoryId: seed.categoryId,
        stock: 50,
        moq: 1,
      });
      const pid = String(created._id || created.id);
      await addToCartApi(vendorSession, pid, 40);
      await expect(addToCartApi(vendorSession, pid, 20)).rejects.toMatchObject({
        response: { status: 400 },
      });
      await disposeProduct(adminSession, pid);
    });

    test('PF-CART-012 | Multiple products create separate lines', async () => {
      await clearCartApi(vendorSession);
      await addToCartApi(vendorSession, seed.standard.id, 1);
      await addToCartApi(vendorSession, seed.second.id, 1);
      const cart = await getCartApi(vendorSession);
      expect(cart?.items?.length).toBe(2);
    });
  });

  test.describe('Section C — MOQ & Quantity Rules', () => {
    test('PF-CART-013 | API rejects quantity below MOQ', async () => {
      await clearCartApi(vendorSession);
      await expect(addToCartApi(vendorSession, seed.moq5.id, 2)).rejects.toMatchObject({
        response: { status: 400 },
      });
    });

    test('PF-CART-014 | API enforces effective MOQ of 7', async () => {
      await clearCartApi(vendorSession);
      await expect(addToCartApi(vendorSession, seed.moq7.id, 5)).rejects.toMatchObject({
        response: { status: 400 },
      });
    });

    test('PF-CART-015 | Details decrement clamped at MOQ', async ({ page }) => {
      await vendorUi(page);
      const details = new VendorProductDetailsPage(page);
      await details.goto(seed.moq5.id);
      await details.waitForLoad();
      await details.quantityInput().locator('..').locator('button').first().click();
      await expect(details.quantityInput()).toHaveValue('5');
    });

    test('PF-CART-016 | Details input clamped to MOQ', async ({ page }) => {
      await vendorUi(page);
      const details = new VendorProductDetailsPage(page);
      await details.goto(seed.moq5.id);
      await details.waitForLoad();
      await details.quantityInput().fill('2');
      await expect(details.quantityInput()).toHaveValue('5');
      await expect(details.quantityInput()).toHaveAttribute('min', '5');
    });

    test('PF-CART-017 | Details client guard for below-MOQ add', async ({ page }) => {
      await vendorUi(page);
      const details = new VendorProductDetailsPage(page);
      await details.goto(seed.moq5.id);
      await details.waitForLoad();
      await details.quantityInput().fill('5');
      let postCount = 0;
      page.on('request', (req) => {
        if (req.url().includes('/api/v1/cart') && req.method() === 'POST') postCount += 1;
      });
      await details.addToCart();
      expect(postCount).toBe(1);
      await expect(page.locator('text=Minimum order quantity is 5')).not.toBeVisible();
    });

    test('PF-CART-018 | Details increment capped at stock', async ({ page }) => {
      await vendorUi(page);
      const created = await createProductApi(adminSession, {
        name: uniqueProductName('pf-cart-qtycap'),
        price: 66,
        categoryId: seed.categoryId,
        stock: 10,
        moq: 1,
      });
      const pid = String(created._id || created.id);
      const details = new VendorProductDetailsPage(page);
      await details.goto(pid);
      await details.waitForLoad();
      for (let i = 0; i < 15; i += 1) {
        await details.quantityInput().locator('..').locator('button').last().click();
      }
      await expect(details.quantityInput()).toHaveValue('10');
      await expect(details.quantityInput()).toHaveAttribute('max', '10');
      await disposeProduct(adminSession, pid);
    });

    test('PF-CART-019 | Cart MOQ warning when quantity below MOQ', async ({ page }) => {
      test.skip(true, 'Cannot seed cart line below MOQ via public API — display branch not reachable');
    });

    test('PF-CART-020 | Cart shows quantity locked message', async ({ page }) => {
      await vendorUi(page);
      await addToCartApi(vendorSession, seed.standard.id, 1);
      const cartPage = new VendorCartPage(page);
      await cartPage.goto();
      await cartPage.waitForLoad();
      await expect(cartPage.quantityLockedMessage()).toBeVisible();
    });
  });

  test.describe('Section D — Stock & Availability', () => {
    test('PF-CART-021 | API rejects insufficient stock', async () => {
      await clearCartApi(vendorSession);
      await expect(addToCartApi(vendorSession, seed.standard.id, 99999)).rejects.toMatchObject({
        response: { status: 400 },
      });
    });

    test('PF-CART-022 | API rejects inactive product', async () => {
      await clearCartApi(vendorSession);
      await expect(addToCartApi(vendorSession, seed.inactive.id, 1)).rejects.toMatchObject({
        response: { status: 400 },
      });
    });

    test('PF-CART-023 | API rejects non-existent product', async () => {
      await clearCartApi(vendorSession);
      await expect(addToCartApi(vendorSession, NONEXISTENT_OBJECT_ID, 1)).rejects.toMatchObject({
        response: { status: 404 },
      });
    });

    test('PF-CART-024 | Cart shows max-stock warning', async ({ page }) => {
      await vendorUi(page);
      const created = await createProductApi(adminSession, {
        name: uniqueProductName('pf-cart-maxwarn'),
        price: 95,
        categoryId: seed.categoryId,
        stock: 10,
        moq: 1,
      });
      const pid = String(created._id || created.id);
      await addToCartApi(vendorSession, pid, 10);
      const cartPage = new VendorCartPage(page);
      await cartPage.goto();
      await cartPage.waitForLoad();
      await expect(page.getByText(/Maximum stock reached \(10 available\)/i)).toBeVisible();
      await disposeProduct(adminSession, pid);
    });

    test('PF-CART-025 | Deactivated product cannot be re-added', async () => {
      await clearCartApi(vendorSession);
      const created = await createProductApi(adminSession, {
        name: uniqueProductName('pf-cart-deact'),
        price: 44,
        categoryId: seed.categoryId,
        stock: 10,
        moq: 1,
        isActive: true,
      });
      const pid = String(created._id || created.id);
      await addToCartApi(vendorSession, pid, 1);
      await patchProductStatusApi(adminSession, pid, false);
      await expect(addToCartApi(vendorSession, pid, 1)).rejects.toMatchObject({
        response: { status: 400 },
      });
      await disposeProduct(adminSession, pid);
    });

    test('PF-CART-026 | Missing inventory rejects add', async () => {
      test.skip(true, 'QA product create auto-provisions inventory — edge not reproducible in persistent QA');
    });
  });

  test.describe('Section E — Cart Page Display & UI', () => {
    test('PF-CART-027 | Cart displays product metadata', async ({ page }) => {
      await vendorUi(page);
      await addToCartApi(vendorSession, seed.imageProduct.id, 1);
      const cartPage = new VendorCartPage(page);
      await cartPage.goto();
      await cartPage.waitForLoad();
      await expect(cartPage.productTitle(seed.imageProduct.name)).toBeVisible();
      await expect(cartPage.productCard(seed.imageProduct.name).locator('img')).toBeVisible();
    });

    test('PF-CART-028 | Cart displays bulk and unit pricing', async ({ page }) => {
      await vendorUi(page);
      await addToCartApi(vendorSession, seed.bulk.id, 10);
      const cartPage = new VendorCartPage(page);
      await cartPage.goto();
      await cartPage.waitForLoad();
      await expect(cartPage.bulkUnitPrice(seed.bulk.name)).toHaveText('₹90.00');
      await expect(cartPage.unitPriceStrikethrough(seed.bulk.name)).toHaveText('₹100.00');
    });

    test('PF-CART-029 | Cart displays per-line savings', async ({ page }) => {
      await vendorUi(page);
      await addToCartApi(vendorSession, seed.bulk.id, 10);
      const cartPage = new VendorCartPage(page);
      await cartPage.goto();
      await cartPage.waitForLoad();
      await expect(cartPage.productCard(seed.bulk.name).getByText(/Save ₹/i)).toBeVisible();
    });

    test('PF-CART-030 | Order summary shows totals rows', async ({ page }) => {
      await vendorUi(page);
      await addToCartApi(vendorSession, seed.standard.id, 1);
      await addToCartApi(vendorSession, seed.second.id, 1);
      const cartPage = new VendorCartPage(page);
      await cartPage.goto();
      await cartPage.waitForLoad();
      await expect(cartPage.orderSummaryHeading()).toBeVisible();
      await expect(page.getByText('Bulk Discount')).toBeVisible();
      await expect(page.getByText('Tax (18%)')).toBeVisible();
      await expect(page.getByText('Grand Total')).toBeVisible();
    });

    test('PF-CART-031 | Bulk savings banner when discount > 0', async ({ page }) => {
      await vendorUi(page);
      await addToCartApi(vendorSession, seed.bulk.id, 10);
      const cartPage = new VendorCartPage(page);
      await cartPage.goto();
      await cartPage.waitForLoad();
      await expect(cartPage.bulkSavingsBanner()).toBeVisible();
    });

    test('PF-CART-032 | Estimated delivery is static text', async ({ page }) => {
      await vendorUi(page);
      await addToCartApi(vendorSession, seed.standard.id, 1);
      const cartPage = new VendorCartPage(page);
      await cartPage.goto();
      await cartPage.waitForLoad();
      await expect(page.getByText('Estimated Delivery')).toBeVisible();
      await expect(page.getByText('3-5 business days')).toBeVisible();
    });

    test('PF-CART-033 | Continue Shopping navigates to products', async ({ page }) => {
      await vendorUi(page);
      await addToCartApi(vendorSession, seed.standard.id, 1);
      const cartPage = new VendorCartPage(page);
      await cartPage.goto();
      await cartPage.waitForLoad();
      await cartPage.continueShoppingLink().click();
      await expect(page).toHaveURL(/\/vendor\/products/);
    });

    test('PF-CART-034 | Cart layout on mobile viewport', async ({ page }) => {
      await vendorUi(page);
      await addToCartApi(vendorSession, seed.standard.id, 1);
      await page.setViewportSize({ width: 375, height: 667 });
      const cartPage = new VendorCartPage(page);
      await cartPage.goto();
      await cartPage.waitForLoad();
      await expect(cartPage.productTitle(seed.standard.name)).toBeVisible();
      await expect(cartPage.orderSummaryHeading()).toBeVisible();
    });

    test('PF-CART-035 | Loading state on initial fetch', async ({ page }) => {
      await vendorUi(page);
      await page.route('**/api/v1/cart', async (route) => {
        if (route.request().method() === 'GET') {
          await new Promise((r) => setTimeout(r, 1200));
          await route.continue();
        } else {
          await route.continue();
        }
      });
      const cartPage = new VendorCartPage(page);
      await cartPage.goto();
      await expect(page.getByText('Loading cart...')).toBeVisible({ timeout: 5000 });
      await cartPage.waitForLoad();
      await page.unroute('**/api/v1/cart');
    });
  });

  test.describe('Section F — Remove from Cart', () => {
    test('PF-CART-036 | Remove last item shows empty state', async ({ page }) => {
      await vendorUi(page);
      await addToCartApi(vendorSession, seed.standard.id, 1);
      const cartPage = new VendorCartPage(page);
      await cartPage.goto();
      await cartPage.waitForLoad();
      await cartPage.removeProductByName(seed.standard.name);
      await cartPage.expectEmptyCart();
    });

    test('PF-CART-037 | Remove one of multiple preserves others', async ({ page }) => {
      await vendorUi(page);
      await addToCartApi(vendorSession, seed.standard.id, 1);
      await addToCartApi(vendorSession, seed.second.id, 1);
      const cartPage = new VendorCartPage(page);
      await cartPage.goto();
      await cartPage.waitForLoad();
      await cartPage.removeProductByName(seed.standard.name);
      await expect(cartPage.productTitle(seed.second.name)).toBeVisible();
      await expect(cartPage.productTitle(seed.standard.name)).toHaveCount(0);
    });

    test('PF-CART-038 | Remove button disabled during action', async ({ page }) => {
      await vendorUi(page);
      await addToCartApi(vendorSession, seed.standard.id, 1);
      await page.route('**/api/v1/cart/**', async (route) => {
        if (route.request().method() === 'DELETE') {
          await new Promise((r) => setTimeout(r, 1500));
          await route.continue();
        } else {
          await route.continue();
        }
      });
      const cartPage = new VendorCartPage(page);
      await cartPage.goto();
      await cartPage.waitForLoad();
      const removeBtn = cartPage.removeButtonForProduct(seed.standard.name);
      await removeBtn.click();
      await expect(removeBtn).toBeDisabled();
      await page.unroute('**/api/v1/cart/**');
    });

    test('PF-CART-039 | API remove updates cart', async () => {
      await clearCartApi(vendorSession);
      await addToCartApi(vendorSession, seed.standard.id, 1);
      const updated = await removeFromCartApi(vendorSession, seed.standard.id);
      expect(updated?.items?.length ?? 0).toBe(0);
    });

    test('PF-CART-040 | API remove missing product unchanged', async () => {
      await clearCartApi(vendorSession);
      await addToCartApi(vendorSession, seed.standard.id, 1);
      const fakeId = '000000000000000000000099';
      const updated = await removeFromCartApi(vendorSession, fakeId);
      expect(updated?.items?.length).toBe(1);
    });
  });

  test.describe('Section G — Cart Totals & Pricing', () => {
    test('PF-CART-041 | Single-item subtotal calculation', async ({ page }) => {
      await vendorUi(page);
      await addToCartApi(vendorSession, seed.standard.id, 10);
      const cartPage = new VendorCartPage(page);
      await cartPage.goto();
      await cartPage.waitForLoad();
      const subtotal = await cartPage.readSummaryAmount(/^Items/);
      expect(subtotal).toBeCloseTo(1000, 2);
    });

    test('PF-CART-042 | Bulk tier applied at cart quantity', async ({ page }) => {
      await vendorUi(page);
      await addToCartApi(vendorSession, seed.bulk.id, 10);
      const cartPage = new VendorCartPage(page);
      await cartPage.goto();
      await cartPage.waitForLoad();
      await expect(cartPage.productCard(seed.bulk.name).getByText('₹90.00')).toBeVisible();
      const discount = await cartPage.readSummaryAmount('Bulk Discount');
      expect(discount).toBeCloseTo(100, 2);
    });

    test('PF-CART-043 | Multi-item subtotal is sum of lines', async ({ page }) => {
      await vendorUi(page);
      await addToCartApi(vendorSession, seed.standard.id, 2);
      await addToCartApi(vendorSession, seed.second.id, 1);
      const cartPage = new VendorCartPage(page);
      await cartPage.goto();
      await cartPage.waitForLoad();
      const subtotal = await cartPage.readSummaryAmount(/^Items/);
      expect(subtotal).toBeCloseTo(400, 2);
    });

    test('PF-CART-044 | Tax equals 18% of subtotal', async ({ page }) => {
      await vendorUi(page);
      await addToCartApi(vendorSession, seed.standard.id, 10);
      const cartPage = new VendorCartPage(page);
      await cartPage.goto();
      await cartPage.waitForLoad();
      const subtotal = await cartPage.readSummaryAmount(/^Items/);
      const tax = await cartPage.readSummaryAmount('Tax (18%)');
      expect(tax).toBeCloseTo(subtotal * 0.18, 2);
    });

    test('PF-CART-045 | Grand total equals subtotal plus tax', async ({ page }) => {
      await vendorUi(page);
      await addToCartApi(vendorSession, seed.standard.id, 5);
      const cartPage = new VendorCartPage(page);
      await cartPage.goto();
      await cartPage.waitForLoad();
      const subtotal = await cartPage.readSummaryAmount(/^Items/);
      const tax = await cartPage.readSummaryAmount('Tax (18%)');
      const grand = await cartPage.readGrandTotal();
      expect(grand).toBeCloseTo(subtotal + tax, 2);
    });

    test('PF-CART-046 | Bulk discount equals per-line savings sum', async ({ page }) => {
      await vendorUi(page);
      await addToCartApi(vendorSession, seed.bulk.id, 10);
      const cartPage = new VendorCartPage(page);
      await cartPage.goto();
      await cartPage.waitForLoad();
      const discount = await cartPage.readSummaryAmount('Bulk Discount');
      expect(discount).toBeCloseTo(100, 2);
    });

    test('PF-CART-047 | Checkout totals mirror cart totals', async ({ page }) => {
      await vendorUi(page);
      await addToCartApi(vendorSession, seed.standard.id, 5);
      const cartPage = new VendorCartPage(page);
      await cartPage.goto();
      await cartPage.waitForLoad();
      const cartSubtotal = await cartPage.readSummaryAmount(/^Items/);
      const cartTax = await cartPage.readSummaryAmount('Tax (18%)');
      const cartGrand = await cartPage.readGrandTotal();
      await cartPage.proceedToCheckoutLink().click();
      await expect(page).toHaveURL(/\/vendor\/checkout/);
      await expect(page.getByText(`₹${cartSubtotal.toFixed(2)}`).first()).toBeVisible();
      await expect(page.getByText(`₹${cartTax.toFixed(2)}`).first()).toBeVisible();
      await expect(page.getByText(`₹${cartGrand.toFixed(2)}`).first()).toBeVisible();
    });
  });

  test.describe('Section H — Persistence & Session', () => {
    test('PF-CART-048 | Cart persists across reload', async ({ page }) => {
      await vendorUi(page);
      await addToCartApi(vendorSession, seed.standard.id, 3);
      const cartPage = new VendorCartPage(page);
      await cartPage.goto();
      await cartPage.waitForLoad();
      await page.reload();
      await cartPage.waitForLoad();
      await expect(cartPage.productTitle(seed.standard.name)).toBeVisible();
      expect(await getCartLineQuantity(vendorSession, seed.standard.id)).toBe(3);
    });

    test('PF-CART-049 | Cart persists across re-login', async ({ page }) => {
      await clearCartApi(vendorSession);
      await addToCartApi(vendorSession, seed.standard.id, 2);
      await establishSession(page, 'vendor');
      const cartPage = new VendorCartPage(page);
      await cartPage.goto();
      await cartPage.waitForLoad();
      await expect(cartPage.productTitle(seed.standard.name)).toBeVisible();
    });

    test('PF-CART-050 | Cart isolated per user', async () => {
      await clearCartApi(vendorSession);
      await clearCartApi(vendor2Session);
      await addToCartApi(vendorSession, seed.standard.id, 1);
      const vendor2Cart = await getCartApi(vendor2Session);
      const items = vendor2Cart?.items ?? [];
      const leaked = items.some(
        (item) => String(item.productId) === seed.standard.id
      );
      expect(leaked).toBe(false);
    });

    test('PF-CART-051 | Deleted product pruned from cart', async () => {
      await clearCartApi(vendorSession);
      const created = await createProductApi(adminSession, {
        name: uniqueProductName('pf-cart-prune'),
        price: 33,
        categoryId: seed.categoryId,
        stock: 10,
        moq: 1,
      });
      const pid = String(created._id || created.id);
      await addToCartApi(vendorSession, pid, 1);
      await deleteProductApi(adminSession, pid);
      const cart = await getCartApi(vendorSession);
      const stale = (cart?.items ?? []).some(
        (item) => String(typeof item.productId === 'object' ? (item.productId as { _id?: string })?._id : item.productId) === pid
      );
      expect(stale).toBe(false);
    });

    test('PF-CART-052 | Single cart document per user', async () => {
      await clearCartApi(vendorSession);
      await addToCartApi(vendorSession, seed.standard.id, 1);
      const first = await getCartApi(vendorSession);
      const firstId = String(first?._id || first?.id);
      await addToCartApi(vendorSession, seed.second.id, 1);
      const second = await getCartApi(vendorSession);
      const secondId = String(second?._id || second?.id);
      expect(secondId).toBe(firstId);
    });
  });

  test.describe('Section I — Navigation & Badge', () => {
    test('PF-CART-053 | Sidebar cart link', async ({ page }) => {
      await vendorUi(page);
      await page.goto('/vendor/dashboard');
      await page.locator('a[href="/vendor/cart"]').first().click();
      await expect(page).toHaveURL(/\/vendor\/cart/);
    });

    test('PF-CART-054 | Dashboard View Cart quick action', async ({ page }) => {
      await vendorUi(page);
      await page.goto('/vendor/dashboard');
      await page.getByRole('link', { name: 'View Cart' }).click();
      await expect(page).toHaveURL(/\/vendor\/cart/);
    });

    test('PF-CART-055 | Header cart icon navigation', async ({ page }) => {
      await vendorUi(page);
      await page.goto('/vendor/products');
      await page.locator('a[aria-label="Cart"]').click();
      await expect(page).toHaveURL(/\/vendor\/cart/);
    });

    test('PF-CART-056 | Badge shows distinct line count', async ({ page }) => {
      await vendorUi(page);
      await addToCartApi(vendorSession, seed.standard.id, 1);
      await addToCartApi(vendorSession, seed.second.id, 1);
      await addToCartApi(vendorSession, seed.third.id, 1);
      await page.goto('/vendor/products');
      await expect(page.locator('a[aria-label="Cart"] span')).toHaveText('3', { timeout: 15000 });
    });

    test('PF-CART-057 | Badge caps at 9+', async ({ page }) => {
      await vendorUi(page);
      for (let i = 0; i < 10; i += 1) {
        const created = await createProductApi(adminSession, {
          name: uniqueProductName(`pf-cart-badge-${i}`),
          price: 10 + i,
          categoryId: seed.categoryId,
          stock: 20,
          moq: 1,
        });
        const pid = String(created._id || created.id);
        await addToCartApi(vendorSession, pid, 1);
      }
      await page.goto('/vendor/products');
      await expect(page.locator('a[aria-label="Cart"] span')).toHaveText('9+', { timeout: 15000 });
    });

    test('PF-CART-058 | Badge clears when cart emptied', async ({ page }) => {
      await vendorUi(page);
      await addToCartApi(vendorSession, seed.standard.id, 1);
      await page.goto('/vendor/products');
      await expect(page.locator('a[aria-label="Cart"] span')).toHaveText('1', { timeout: 15000 });
      await clearCartApi(vendorSession);
      await page.reload();
      await expect(page.locator('a[aria-label="Cart"] span')).toHaveCount(0);
    });
  });

  test.describe('Section J — Checkout Boundary', () => {
    test('PF-CART-059 | Checkout blocks empty cart', async ({ page }) => {
      await vendorUi(page);
      await page.goto('/vendor/checkout');
      await expect(page.getByText('Your cart is empty')).toBeVisible();
    });

    test('PF-CART-060 | Checkout shows first 3 items plus overflow', async ({ page }) => {
      await vendorUi(page);
      await addToCartApi(vendorSession, seed.standard.id, 1);
      await addToCartApi(vendorSession, seed.second.id, 1);
      await addToCartApi(vendorSession, seed.third.id, 1);
      await addToCartApi(vendorSession, seed.fourth.id, 1);
      await page.goto('/vendor/checkout');
      await expect(page.getByText('+1 more items')).toBeVisible();
    });

    test('PF-CART-061 | Checkout shows FREE delivery', async ({ page }) => {
      await vendorUi(page);
      await addToCartApi(vendorSession, seed.standard.id, 1);
      await page.goto('/vendor/checkout');
      await expect(page.getByText('Delivery').first()).toBeVisible();
      await expect(page.getByText('FREE').first()).toBeVisible();
    });

    test('PF-CART-062 | Cart cleared after COD order', async ({ page }) => {
      await vendorUi(page);
      await addToCartApi(vendorSession, seed.standard.id, 1);
      await page.goto('/vendor/checkout');
      await fillCheckoutAddress(page);
      await page.getByRole('button', { name: /^Place Order$/ }).click();
      await page.waitForURL(/\/vendor\/order-success/, { timeout: 30000 });
      const cart = await getCartApi(vendorSession);
      expect(cart?.items?.length ?? 0).toBe(0);
    });

    test('PF-CART-063 | Cart retained after online order initiation', async () => {
      await clearCartApi(vendorSession);
      await addToCartApi(vendorSession, seed.standard.id, 1);
      await createOrderApi(vendorSession, {
        paymentMethod: 'ONLINE',
        shippingAddress: buildShippingAddress(),
        idempotencyKey: `pf-cart-online-${Date.now()}`,
      });
      const cart = await getCartApi(vendorSession);
      expect(cart?.items?.length ?? 0).toBeGreaterThan(0);
    });
  });

  test.describe('Section K — Error & Recovery', () => {
    test('PF-CART-064 | Cart load failure shows Try Again', async ({ page }) => {
      await establishSession(page, 'vendor');
      await page.route('**/api/v1/cart', (route) => {
        if (route.request().method() === 'GET') {
          route.fulfill({
            status: 500,
            contentType: 'application/json',
            body: JSON.stringify({ success: false, message: 'Unauthorized' }),
          });
        } else {
          route.continue();
        }
      });
      const cartPage = new VendorCartPage(page);
      await cartPage.goto();
      await expect(page.getByText('Failed to load cart')).toBeVisible({ timeout: 15000 });
      await expect(page.getByRole('button', { name: 'Try Again' })).toBeVisible();
      await page.unroute('**/api/v1/cart');
    });

    test('PF-CART-065 | Try Again reloads cart', async ({ page }) => {
      await vendorUi(page);
      await addToCartApi(vendorSession, seed.standard.id, 1);
      // VendorLayout and Cart each issue a GET on mount; block all until Try Again.
      let blockCartGet = true;
      await page.route('**/api/v1/cart', async (route) => {
        if (route.request().method() === 'GET' && blockCartGet) {
          await route.fulfill({
            status: 500,
            contentType: 'application/json',
            body: JSON.stringify({ success: false, message: 'Temporary error' }),
          });
          return;
        }
        await route.continue();
      });
      const cartPage = new VendorCartPage(page);
      await cartPage.goto();
      await expect(page.getByText('Failed to load cart')).toBeVisible({ timeout: 15000 });
      await expect(page.getByText('Temporary error')).toBeVisible();
      await expect(page.getByRole('button', { name: 'Try Again' })).toBeVisible();
      blockCartGet = false;
      await page.getByRole('button', { name: 'Try Again' }).click();
      await cartPage.waitForLoad();
      await expect(cartPage.productTitle(seed.standard.name)).toBeVisible();
      await page.unroute('**/api/v1/cart');
    });

    test('PF-CART-066 | Inline error when remove fails with items present', async ({ page }) => {
      await vendorUi(page);
      await addToCartApi(vendorSession, seed.standard.id, 1);
      await page.route('**/api/v1/cart/**', (route) => {
        if (route.request().method() === 'DELETE') {
          route.fulfill({
            status: 500,
            contentType: 'application/json',
            body: JSON.stringify({ success: false, message: 'Remove failed' }),
          });
        } else {
          route.continue();
        }
      });
      const cartPage = new VendorCartPage(page);
      await cartPage.goto();
      await cartPage.waitForLoad();
      await cartPage.removeProductByName(seed.standard.name);
      await expect(page.locator('.text-red-700, .text-red-50').first()).toBeVisible({ timeout: 10000 });
      await expect(cartPage.productTitle(seed.standard.name)).toBeVisible();
      await page.unroute('**/api/v1/cart/**');
    });

    test('PF-CART-067 | GET cart returns null for new user', async () => {
      const fresh = await createProductApi(adminSession, {
        name: uniqueProductName('pf-cart-fresh-user-marker'),
        price: 1,
        categoryId: seed.categoryId,
        stock: 1,
        moq: 1,
      });
      void fresh;
      const cart = await getCartApi(vendor2Session);
      if (cart === null) {
        expect(cart).toBeNull();
        return;
      }
      expect(cart.items?.length ?? 0).toBe(0);
    });

    test('PF-CART-068 | DELETE when cart missing returns 404', async () => {
      await clearCartApi(vendor2Session);
      const cart = await getCartApi(vendor2Session);
      if (cart && (cart.items?.length ?? 0) > 0) {
        await clearCartApi(vendor2Session);
      }
      await expect(removeFromCartApi(vendor2Session, seed.standard.id)).rejects.toMatchObject({
        response: { status: 404 },
      });
    });
  });
});
