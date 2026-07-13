import { test, expect } from '../fixtures/product.validation.fixture';
import AdminProductsPage from '../pages/admin/AdminProductsPage';
import AdminInventoryPage from '../pages/admin/AdminInventoryPage';
import VendorProductDetailsPage from '../pages/vendor/VendorProductDetailsPage';
import {
  addToCartApi,
  createProductApi,
  getAdminSession,
  getFirstCategoryId,
  patchProductStatusApi,
} from '../helpers/product.api.helper';
import { uniqueProductName } from '../helpers/product.credentials';
import { establishSession } from '../helpers/session.functional.helper';
import {
  apiJson,
  expectApiRejects,
  getVendorSession,
  INVALID_OBJECT_ID,
  NONEXISTENT_OBJECT_ID,
  uniqueValidationName,
} from '../helpers/validation/product.validation.helper';

test.describe('PV-PROD Section L | Cart & Consumer Validation', () => {
  test('PV-PROD-076 | Cart rejects invalid productId', async () => {
    const session = await getVendorSession();
    await expect(addToCartApi(session, INVALID_OBJECT_ID, 1)).rejects.toMatchObject({
      response: { status: 400 },
    });
  });

  test('PV-PROD-077 | Cart rejects quantity < 1', async () => {
    const session = await getVendorSession();
    const adminSession = await getAdminSession();
    const categoryId = await getFirstCategoryId(adminSession);
    const created = await createProductApi(adminSession, {
      name: uniqueValidationName('pv-cart-qty'),
      price: 100,
      categoryId,
      stock: 50,
      moq: 1,
    });
    const productId = String(created._id || created.id);
    await expect(addToCartApi(session, productId, 0)).rejects.toMatchObject({
      response: { status: 400 },
    });
  });

  test('PV-PROD-078 | Cart rejects quantity below MOQ', async () => {
    const session = await getVendorSession();
    const adminSession = await getAdminSession();
    const categoryId = await getFirstCategoryId(adminSession);
    const created = await createProductApi(adminSession, {
      name: uniqueValidationName('pv-cart-moq'),
      price: 100,
      categoryId,
      stock: 100,
      moq: 5,
    });
    const productId = String(created._id || created.id);
    await expect(addToCartApi(session, productId, 2)).rejects.toMatchObject({
      response: { status: 400 },
    });
  });

  test('PV-PROD-079 | Cart rejects inactive product', async () => {
    const session = await getVendorSession();
    const adminSession = await getAdminSession();
    const categoryId = await getFirstCategoryId(adminSession);
    const created = await createProductApi(adminSession, {
      name: uniqueValidationName('pv-cart-inactive'),
      price: 100,
      categoryId,
      stock: 50,
      moq: 1,
      isActive: false,
    });
    const productId = String(created._id || created.id);
    await patchProductStatusApi(adminSession, productId, false);
    await expect(addToCartApi(session, productId, 1)).rejects.toMatchObject({
      response: { status: 400 },
    });
  });

  test('PV-PROD-080 | Cart rejects non-existent product', async () => {
    const session = await getVendorSession();
    await expect(addToCartApi(session, NONEXISTENT_OBJECT_ID, 1)).rejects.toMatchObject({
      response: { status: 404 },
    });
  });

  test('PV-PROD-081 | Cart rejects insufficient stock', async () => {
    const session = await getVendorSession();
    const adminSession = await getAdminSession();
    const categoryId = await getFirstCategoryId(adminSession);
    const created = await createProductApi(adminSession, {
      name: uniqueValidationName('pv-cart-oos'),
      price: 100,
      categoryId,
      stock: 2,
      moq: 1,
    });
    const productId = String(created._id || created.id);
    await expect(addToCartApi(session, productId, 99999)).rejects.toMatchObject({
      response: { status: 400 },
    });
  });

  test('PV-PROD-082 | Wishlist rejects invalid productId', async () => {
    const session = await getVendorSession();
    await expectApiRejects(
      () => apiJson(session, 'POST', '/wishlist/add', { productId: INVALID_OBJECT_ID }),
      400
    );
  });

  test('PV-PROD-083 | Review rejects rating below 1', async () => {
    const session = await getVendorSession();
    const adminSession = await getAdminSession();
    const categoryId = await getFirstCategoryId(adminSession);
    const created = await createProductApi(adminSession, {
      name: uniqueValidationName('pv-review'),
      price: 100,
      categoryId,
      stock: 10,
    });
    const productId = String(created._id || created.id);
    await expectApiRejects(
      () =>
        apiJson(session, 'POST', '/reviews', {
          productId,
          rating: 0,
          comment: 'bad',
        }),
      400
    );
  });

  test('PV-PROD-084 | Review rejects rating above 5', async () => {
    const session = await getVendorSession();
    const adminSession = await getAdminSession();
    const categoryId = await getFirstCategoryId(adminSession);
    const created = await createProductApi(adminSession, {
      name: uniqueValidationName('pv-review-high'),
      price: 100,
      categoryId,
      stock: 10,
    });
    const productId = String(created._id || created.id);
    await expectApiRejects(
      () =>
        apiJson(session, 'POST', '/reviews', {
          productId,
          rating: 6,
        }),
      400
    );
  });

  test('PV-PROD-085 | Pricing API rejects quantity < 1', async () => {
    await expectApiRejects(() => apiJson(undefined, 'POST', '/pricing', { price: 100, quantity: 0 }), 400);
  });

  test('PV-PROD-086 | Pricing API rejects price <= 0', async () => {
    await expectApiRejects(() => apiJson(undefined, 'POST', '/pricing', { price: 0, quantity: 1 }), 400);
  });
});

test.describe('PV-PROD Section M | Frontend UI Validation', () => {
  test('PV-PROD-087 | UI rejects missing product name', async ({ page }) => {
    await establishSession(page, 'admin');
    const adminPage = new AdminProductsPage(page);
    await adminPage.goto();
    await adminPage.openCreateModal();
    await adminPage.priceInput().fill('100');
    await adminPage.selectFirstCategory();
    await adminPage.saveButton().click();
    await expect.poll(async () =>
      adminPage.nameInput().evaluate((el: HTMLInputElement) => el.validity.valueMissing)
    ).toBe(true);
  });

  test('PV-PROD-088 | UI rejects missing category', async ({ page }) => {
    await establishSession(page, 'admin');
    const adminPage = new AdminProductsPage(page);
    await adminPage.goto();
    await adminPage.openCreateModal();
    await adminPage.nameInput().fill(uniqueProductName('pv-ui-cat'));
    await adminPage.priceInput().fill('100');
    await adminPage.saveButton().click();
    await expect.poll(async () =>
      adminPage.categorySelect().evaluate((el: HTMLSelectElement) => el.validity.valueMissing)
    ).toBe(true);
  });

  test('PV-PROD-089 | UI HTML5 blocks price <= 0', async ({ page }) => {
    await establishSession(page, 'admin');
    const adminPage = new AdminProductsPage(page);
    await adminPage.goto();
    await adminPage.openCreateModal();
    await adminPage.fillForm({ name: uniqueProductName('pv-ui-price'), price: 0 });
    await adminPage.saveButton().click();
    await expect.poll(async () =>
      adminPage.priceInput().evaluate((el: HTMLInputElement) => el.validity.rangeUnderflow)
    ).toBe(true);
  });

  test('PV-PROD-090 | UI custom validation for empty name on trim', async ({ page }) => {
    await establishSession(page, 'admin');
    const adminPage = new AdminProductsPage(page);
    await adminPage.goto();
    await adminPage.openCreateModal();
    await adminPage.nameInput().fill('   ');
    await adminPage.priceInput().fill('100');
    await adminPage.selectFirstCategory();
    await adminPage.saveButton().click();
    await adminPage.expectFormError('Product name is required');
  });

  test('PV-PROD-091 | UI inventory rejects negative stock', async ({ page }) => {
    await establishSession(page, 'admin');
    const adminSession = await getAdminSession();
    const categoryId = await getFirstCategoryId(adminSession);
    const name = uniqueValidationName('pv-ui-inv');
    await createProductApi(adminSession, { name, price: 100, categoryId, stock: 10 });
    const inventoryPage = new AdminInventoryPage(page);
    await inventoryPage.goto();
    await inventoryPage.waitForTable();
    await inventoryPage.search(name);
    await inventoryPage.openStockModalForProduct(name);
    await inventoryPage.setStockQuantity(-5);
    await page.locator('form button:has-text("Update"), form button:has-text("Save")').first().click();
    await expect(page.locator('text=Enter a valid stock quantity')).toBeVisible();
  });

  test('PV-PROD-092 | Vendor details enforces MOQ via HTML min and input clamping', async ({ page }) => {
    const adminSession = await getAdminSession();
    const categoryId = await getFirstCategoryId(adminSession);
    const created = await createProductApi(adminSession, {
      name: uniqueValidationName('pv-vendor-moq'),
      price: 100,
      categoryId,
      stock: 50,
      moq: 5,
    });
    const productId = String(created._id || created.id);
    await establishSession(page, 'vendor');
    const details = new VendorProductDetailsPage(page);
    await details.goto(productId);
    await details.waitForLoad();

    const moq = 5;
    await expect(details.quantityInput()).toHaveAttribute('min', String(moq));
    await expect(details.quantityInput()).toHaveValue(String(moq));

    await details.quantityInput().fill('2');
    await expect(details.quantityInput()).toHaveValue(String(moq));

    const validity = await details.quantityInput().evaluate((el: HTMLInputElement) => ({
      rangeUnderflow: el.validity.rangeUnderflow,
      valid: el.checkValidity(),
    }));
    expect(validity.rangeUnderflow, 'Clamped value should not be under MOQ min').toBe(false);
    expect(validity.valid, 'Quantity input should be valid after MOQ clamping').toBe(true);

    let cartPostCount = 0;
    page.on('request', (request) => {
      if (request.url().includes('/api/v1/cart') && request.method() === 'POST') {
        cartPostCount += 1;
      }
    });
    await details.addToCart();
    expect(cartPostCount, 'Add to cart should use clamped MOQ quantity').toBe(1);
    await expect(page.locator('text=Minimum order quantity is 5')).not.toBeVisible();
  });

  test('PV-PROD-093 | UI HTML5 blocks negative stock before API request', async ({ page }) => {
    await establishSession(page, 'admin');
    const adminPage = new AdminProductsPage(page);
    await adminPage.goto();
    await adminPage.openCreateModal();
    const name = uniqueValidationName('pv-ui-neg-stock');
    await adminPage.fillForm({ name, price: 100, stock: -10, moq: 1 });

    let productPostCount = 0;
    page.on('request', (request) => {
      if (request.url().includes('/api/v1/products') && request.method() === 'POST') {
        productPostCount += 1;
      }
    });

    await adminPage.saveButton().click();
    await expect.poll(async () =>
      adminPage.stockInput().evaluate((el: HTMLInputElement) => el.validity.rangeUnderflow)
    ).toBe(true);
    expect(productPostCount, 'Browser validation should prevent product create POST').toBe(0);
    await expect(adminPage.nameInput()).toBeVisible();
  });
});
