import { test, expect } from '../fixtures/product.functional.fixture';
import VendorProductDetailsPage from '../pages/vendor/VendorProductDetailsPage';
import VendorProductsPage from '../pages/vendor/VendorProductsPage';
import {
  createProductApi,
  getAdminSession,
  getFirstCategoryId,
} from '../helpers/product.api.helper';
import { uniqueProductName } from '../helpers/product.credentials';
import { establishSession } from '../helpers/session.functional.helper';

test.describe('PF-PROD Section L | Vendor Product Details', () => {
  let productId = '';
  let productName = '';
  let moqProductId = '';

  test.beforeAll(async () => {
    const session = await getAdminSession();
    const categoryId = await getFirstCategoryId(session);
    productName = uniqueProductName('pf-details');
    const created = await createProductApi(session, {
      name: productName,
      description: 'Functional details test product',
      price: 300,
      categoryId,
      stock: 50,
      moq: 1,
    });
    productId = String(created._id || created.id);
    const moqProduct = await createProductApi(session, {
      name: uniqueProductName('pf-moq-detail'),
      price: 310,
      categoryId,
      stock: 20,
      moq: 5,
    });
    moqProductId = String(moqProduct._id || moqProduct.id);
  });

  test('PF-PROD-094 | Product details page loads', async ({ page, vendorCreds }) => {
    await establishSession(page, 'vendor');
    const details = new VendorProductDetailsPage(page);
    await details.goto(productId);
    await details.waitForLoad();
    await expect(details.title()).toContainText(productName);
    await expect(details.priceDisplay()).toBeVisible();
  });

  test('PF-PROD-095 | Breadcrumb and back navigation', async ({ page, vendorCreds }) => {
    await establishSession(page, 'vendor');
    const details = new VendorProductDetailsPage(page);
    await details.goto(productId);
    await page.locator('text=Back to Products').click();
    await expect(page).toHaveURL(/\/vendor\/products/);
  });

  test('PF-PROD-096 | Quantity defaults to MOQ', async ({ page, vendorCreds }) => {
    await establishSession(page, 'vendor');
    const details = new VendorProductDetailsPage(page);
    await details.goto(moqProductId);
    await details.waitForLoad();
    await expect(details.quantityInput()).toHaveValue('5');
  });

  test('PF-PROD-097 | Quantity below MOQ blocked in UI', async ({ page, vendorCreds }) => {
    await establishSession(page, 'vendor');
    const details = new VendorProductDetailsPage(page);
    await details.goto(moqProductId);
    await details.waitForLoad();
    await details.setQuantity(1);
    await expect(details.quantityInput()).toHaveValue('5');
  });

  test('PF-PROD-098 | Quantity capped at stock max', async ({ page, vendorCreds }) => {
    const session = await getAdminSession();
    const categoryId = await getFirstCategoryId(session);
    const limited = await createProductApi(session, {
      name: uniqueProductName('pf-limited'),
      price: 320,
      categoryId,
      stock: 10,
      moq: 1,
    });
    const limitedId = String(limited._id || limited.id);
    await establishSession(page, 'vendor');
    const details = new VendorProductDetailsPage(page);
    await details.goto(limitedId);
    await details.waitForLoad();
    const max = await details.quantityInput().getAttribute('max');
    expect(Number(max)).toBeLessThanOrEqual(10);
  });

  test('PF-PROD-099 | Related products section', async ({ page, vendorCreds }) => {
    await establishSession(page, 'vendor');
    const details = new VendorProductDetailsPage(page);
    await details.goto(productId);
    await details.waitForLoad();
    await expect(page.locator('text=/Related|You may also/i').first()).toBeVisible({ timeout: 10000 });
  });

  test('PF-PROD-100 | Invalid product ID shows not found', async ({ page, vendorCreds }) => {
    await establishSession(page, 'vendor');
    const details = new VendorProductDetailsPage(page);
    await details.goto('000000000000000000000000');
    await details.expectNotFound();
  });

  test('PF-PROD-101 | Product details tabs', async ({ page, vendorCreds }) => {
    await establishSession(page, 'vendor');
    const details = new VendorProductDetailsPage(page);
    await details.goto(productId);
    await details.waitForLoad();
    await details.switchTab('Description');
    const descriptionPanel = page
      .locator('div')
      .filter({ has: page.getByRole('heading', { name: 'Product Description' }) })
      .first();
    await expect(descriptionPanel.getByText('Functional details test product').first()).toBeVisible();
    await details.switchTab('Reviews');
    await expect(page.locator('text=/review|rating/i').first()).toBeVisible();
  });
});
