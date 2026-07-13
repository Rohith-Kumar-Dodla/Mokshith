import { test, expect } from '../fixtures/product.functional.fixture';
import AdminProductsPage from '../pages/admin/AdminProductsPage';
import {
  createProductApi,
  getAdminSession,
  getFirstCategoryId,
  getProductApi,
  updateProductApi,
} from '../helpers/product.api.helper';
import { uniqueProductName } from '../helpers/product.credentials';
import { VALID_PNG_PATH } from '../helpers/product.test-data.paths';
import { establishSession } from '../helpers/session.functional.helper';

test.describe('PF-PROD Section B | Admin Product Edit', () => {
  let productId = '';
  let productName = '';

  test.beforeAll(async () => {
    const session = await getAdminSession();
    const categoryId = await getFirstCategoryId(session);
    productName = uniqueProductName('pf-edit');
    const created = await createProductApi(session, {
      name: productName,
      description: 'Original description',
      price: 200,
      stock: 30,
      moq: 2,
      categoryId,
    });
    productId = String(created._id || created.id);
  });

  test('PF-PROD-014 | Admin can edit product name', async ({ page, adminCreds }) => {
    await establishSession(page, 'admin');
    const adminPage = new AdminProductsPage(page);
    await adminPage.goto();
    await adminPage.waitForTable();
    const newName = `${productName}-edited`;
    await adminPage.openEditForName(productName);
    await adminPage.nameInput().fill(newName);
    const response = await adminPage.submitUpdate();
    expect(response.status()).toBe(200);
    await adminPage.expectSuccessMessage('Product updated successfully');
    productName = newName;
  });

  test('PF-PROD-015 | Admin can edit price', async ({ page, adminCreds }) => {
    await establishSession(page, 'admin');
    const adminPage = new AdminProductsPage(page);
    await adminPage.goto();
    await adminPage.openEditForName(productName);
    await adminPage.priceInput().fill('275');
    await adminPage.submitUpdate();
    const fetched = await getProductApi(productId);
    expect(Number(fetched.price)).toBe(275);
  });

  test('PF-PROD-016 | Admin can change category', async () => {
    const session = await getAdminSession();
    const categories = await getFirstCategoryId(session);
    const all = await import('../helpers/product.api.helper').then((m) => m.listCategories(session));
    const second = (all[1] as { _id?: string; id?: string })?._id || (all[1] as { id?: string })?.id;
    if (!second) {
      test.skip();
      return;
    }
    await updateProductApi(session, productId, { categoryId: String(second) });
    const fetched = await getProductApi(productId);
    const catId =
      typeof fetched.categoryId === 'object' ? fetched.categoryId._id : fetched.categoryId;
    expect(String(catId)).toBe(String(second));
    void categories;
  });

  test('PF-PROD-017 | Admin can edit description', async () => {
    const session = await getAdminSession();
    await updateProductApi(session, productId, { description: 'Updated functional description' });
    const fetched = await getProductApi(productId);
    expect(fetched.description).toBe('Updated functional description');
  });

  test('PF-PROD-018 | Admin can update stock via product form', async ({ page, adminCreds }) => {
    await establishSession(page, 'admin');
    const adminPage = new AdminProductsPage(page);
    await adminPage.goto();
    await adminPage.openEditForName(productName);
    await adminPage.stockInput().fill('45');
    await adminPage.submitUpdate();
    const fetched = await getProductApi(productId);
    expect(Number(fetched.stock)).toBe(45);
  });

  test('PF-PROD-019 | Admin can update MOQ', async () => {
    const session = await getAdminSession();
    await updateProductApi(session, productId, { moq: 7 });
    const fetched = await getProductApi(productId);
    expect(Number(fetched.moq)).toBe(7);
  });

  test('PF-PROD-020 | Admin can replace product image', async () => {
    const session = await getAdminSession();
    const updated = await updateProductApi(session, productId, { price: 275 }, VALID_PNG_PATH);
    expect(updated.imageUrl || updated.image).toBeTruthy();
  });

  test('PF-PROD-021 | View modal shows read-only product data', async ({ page, adminCreds }) => {
    await establishSession(page, 'admin');
    const adminPage = new AdminProductsPage(page);
    await adminPage.goto();
    await adminPage.search(productName);
    await adminPage.openViewForName(productName);
    await expect(adminPage.viewModal().locator('h3').first()).toContainText(productName);
  });

  test('PF-PROD-022 | Edit form pre-populates existing values', async ({ page, adminCreds }) => {
    const fetched = await getProductApi(productId);
    const expectedPrice = String(Number(fetched.price));

    await establishSession(page, 'admin');
    const adminPage = new AdminProductsPage(page);
    await adminPage.goto();
    await adminPage.search(productName);
    await adminPage.waitForTable();
    await adminPage.openEditForName(productName);
    await expect(adminPage.nameInput()).toHaveValue(productName);
    await expect(adminPage.priceInput()).toHaveValue(expectedPrice);
  });

  test('PF-PROD-023 | Cancel modal discards unsaved changes', async ({ page, adminCreds }) => {
    await establishSession(page, 'admin');
    const adminPage = new AdminProductsPage(page);
    await adminPage.goto();
    await adminPage.openEditForName(productName);
    await adminPage.nameInput().fill('should-not-save-name');
    await adminPage.cancelButton().click();
    await adminPage.openEditForName(productName);
    await expect(adminPage.nameInput()).toHaveValue(productName);
  });
});
