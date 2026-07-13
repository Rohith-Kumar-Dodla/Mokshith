import { test, expect } from '../fixtures/product.functional.fixture';
import AdminCategoriesPage from '../pages/admin/AdminCategoriesPage';
import VendorProductsPage from '../pages/vendor/VendorProductsPage';
import {
  createCategoryApi,
  createProductApi,
  deleteCategoryApi,
  getAdminSession,
  getFirstCategoryId,
  listCategories,
} from '../helpers/product.api.helper';
import { uniqueProductName } from '../helpers/product.credentials';
import { VALID_PNG_PATH } from '../helpers/product.test-data.paths';
import { establishSession } from '../helpers/session.functional.helper';

test.describe('PF-PROD Section H | Categories', () => {
  test('PF-PROD-061 | Admin can create category', async ({ page, adminCreds }) => {
    await establishSession(page, 'admin');
    const categoriesPage = new AdminCategoriesPage(page);
    await categoriesPage.goto();
    await categoriesPage.waitForTable();
    await categoriesPage.openCreateModal();
    const name = uniqueProductName('pf-cat');
    await categoriesPage.fillAndSave(name);
    await expect(categoriesPage.rowByName(name)).toBeVisible({ timeout: 10000 });
  });

  test('PF-PROD-062 | Category required for product create', async ({ page, adminCreds }) => {
    await establishSession(page, 'admin');
    const { default: AdminProductsPage } = await import('../pages/admin/AdminProductsPage');
    const adminPage = new AdminProductsPage(page);
    await adminPage.goto();
    await adminPage.openCreateModal();
    await adminPage.nameInput().fill(uniqueProductName('pf-no-cat2'));
    await adminPage.priceInput().fill('50');
    await adminPage.saveButton().click();
    await expect.poll(async () => adminPage.categorySelect().evaluate((el: HTMLSelectElement) => el.validity.valueMissing)).toBe(true);
  });

  test('PF-PROD-063 | Admin can edit category', async ({ page, adminCreds }) => {
    const session = await getAdminSession();
    const name = uniqueProductName('pf-cat-edit');
    const created = await createCategoryApi(session, { name });
    const categoryId = String(created._id || created.id);
    await establishSession(page, 'admin');
    const categoriesPage = new AdminCategoriesPage(page);
    await categoriesPage.goto();
    const row = categoriesPage.rowByName(name);
    await row.locator('button[title="Edit"]').click();
    const newName = `${name}-updated`;
    await categoriesPage.nameInput().fill(newName);
    await categoriesPage.saveButton().click();
    await expect(categoriesPage.rowByName(newName)).toBeVisible({ timeout: 10000 });
    void categoryId;
  });

  test('PF-PROD-064 | Admin can mark category inactive', async () => {
    const session = await getAdminSession();
    const name = uniqueProductName('pf-cat-inactive');
    const created = await createCategoryApi(session, { name, isActive: false });
    expect(created.isActive).toBe(false);
  });

  test('PF-PROD-065 | Duplicate category name rejected', async () => {
    const session = await getAdminSession();
    const name = uniqueProductName('pf-cat-dup');
    await createCategoryApi(session, { name });
    await expect(createCategoryApi(session, { name })).rejects.toMatchObject({
      response: { status: 400 },
    });
  });

  test('PF-PROD-066 | Category delete with linked products', async () => {
    const session = await getAdminSession();
    const name = uniqueProductName('pf-cat-del');
    const category = await createCategoryApi(session, { name });
    const categoryId = String(category._id || category.id);
    await createProductApi(session, {
      name: uniqueProductName('pf-cat-product'),
      price: 50,
      categoryId,
    });
    await deleteCategoryApi(session, categoryId);
    const categories = await listCategories(session);
    const found = (categories as { name?: string }[]).some((c) => c.name === name);
    expect(found).toBe(false);
  });

  test('PF-PROD-067 | Vendor category page links to filtered products', async ({
    page,
    vendorCreds,
  }) => {
    const session = await getAdminSession();
    const categoryId = await getFirstCategoryId(session);
    await establishSession(page, 'vendor');
    await page.goto('/vendor/categories');
    await page.waitForSelector('a[href*="categoryId"]', { timeout: 15000 });
    await page.goto(`/vendor/products?categoryId=${categoryId}`);
    const vendorPage = new VendorProductsPage(page);
    await vendorPage.waitForProducts();
    await expect(page).toHaveURL(new RegExp(`categoryId=${categoryId}`));
  });

  test('PF-PROD-068 | Category image upload on create', async ({ page, adminCreds }) => {
    const session = await getAdminSession();
    const API_BASE = process.env.TEST_API_BASE_URL || 'http://localhost:5000/api/v1';
    const form = new FormData();
    form.append('name', uniqueProductName('pf-cat-img'));
    const buffer = await import('fs').then((fs) =>
      fs.readFileSync(VALID_PNG_PATH)
    );
    form.append('image', new Blob([buffer], { type: 'image/png' }), 'cat.png');
    const { authHeaders } = await import('../helpers/auth.api.helper');
    const response = await fetch(`${API_BASE}/categories`, {
      method: 'POST',
      headers: authHeaders(session),
      body: form,
    });
    expect(response.status).toBe(200);
    void page;
    void adminCreds;
  });
});
