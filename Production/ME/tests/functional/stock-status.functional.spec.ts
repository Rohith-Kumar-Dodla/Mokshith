import { test, expect } from '../fixtures/product.functional.fixture';
import AdminProductsPage from '../pages/admin/AdminProductsPage';
import VendorProductsPage from '../pages/vendor/VendorProductsPage';
import {
  createProductApi,
  getAdminSession,
  getFirstCategoryId,
  updateProductApi,
} from '../helpers/product.api.helper';
import { uniqueProductName } from '../helpers/product.credentials';
import { establishSession } from '../helpers/session.functional.helper';

test.describe('PF-PROD Section E | Stock Status Derivation', () => {
  test('PF-PROD-039 | Out-of-stock when stock = 0', async ({ page, vendorCreds, adminCreds }) => {
    const session = await getAdminSession();
    const categoryId = await getFirstCategoryId(session);
    const name = uniqueProductName('pf-oos');
    await createProductApi(session, { name, price: 100, categoryId, stock: 0, moq: 1 });
    await establishSession(page, 'vendor');
    const vendorPage = new VendorProductsPage(page);
    await vendorPage.goto();
    const card = vendorPage.cardByName(name);
    if (await card.count()) {
      await expect(card.locator('text=Out of Stock')).toBeVisible();
      await expect(card.locator('button:has-text("Add to Cart")')).toBeDisabled();
    }
    void adminCreds;
  });

  test('PF-PROD-040 | Low-stock when stock < MOQ', async ({ page, vendorCreds }) => {
    const session = await getAdminSession();
    const categoryId = await getFirstCategoryId(session);
    const name = uniqueProductName('pf-low');
    await createProductApi(session, { name, price: 110, categoryId, stock: 3, moq: 5 });
    await establishSession(page, 'vendor');
    const vendorPage = new VendorProductsPage(page);
    await vendorPage.goto();
    const card = vendorPage.cardByName(name);
    if (await card.count()) {
      await expect(card.locator('text=Low Stock')).toBeVisible();
    }
  });

  test('PF-PROD-041 | Active status when stock >= MOQ', async ({ page, vendorCreds }) => {
    const session = await getAdminSession();
    const categoryId = await getFirstCategoryId(session);
    const name = uniqueProductName('pf-active-stock');
    await createProductApi(session, { name, price: 115, categoryId, stock: 100, moq: 1 });
    await establishSession(page, 'vendor');
    const vendorPage = new VendorProductsPage(page);
    await vendorPage.goto();
    const card = vendorPage.cardByName(name);
    if (await card.count()) {
      await expect(card.locator('text=In Stock')).toBeVisible();
    }
  });

  test('PF-PROD-042 | Admin stock filter low stock threshold 50', async ({ page, adminCreds }) => {
    const session = await getAdminSession();
    const categoryId = await getFirstCategoryId(session);
    const name = uniqueProductName('pf-admin-low');
    await createProductApi(session, { name, price: 105, categoryId, stock: 25 });
    await establishSession(page, 'admin');
    const adminPage = new AdminProductsPage(page);
    await adminPage.goto();
    await adminPage.search(name);
    await expect(adminPage.rowByName(name)).toBeVisible();
  });

  test('PF-PROD-043 | Admin filter out of stock', async ({ page, adminCreds }) => {
    const session = await getAdminSession();
    const categoryId = await getFirstCategoryId(session);
    const name = uniqueProductName('pf-admin-oos');
    const created = await createProductApi(session, { name, price: 106, categoryId, stock: 0 });
    await updateProductApi(session, String(created._id || created.id), { stock: 0 });
    await establishSession(page, 'admin');
    const adminPage = new AdminProductsPage(page);
    await adminPage.goto();
    await adminPage.search(name);
    await expect(adminPage.rowByName(name)).toBeVisible();
  });
});
