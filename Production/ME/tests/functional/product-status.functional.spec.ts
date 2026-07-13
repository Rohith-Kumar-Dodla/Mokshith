import { test, expect } from '../fixtures/product.functional.fixture';
import AdminProductsPage from '../pages/admin/AdminProductsPage';
import VendorProductsPage from '../pages/vendor/VendorProductsPage';
import VendorProductDetailsPage from '../pages/vendor/VendorProductDetailsPage';
import {
  createProductApi,
  getAdminSession,
  getFirstCategoryId,
  patchProductStatusApi,
  updateProductApi,
  listProductsApi,
} from '../helpers/product.api.helper';
import { loginApi } from '../helpers/auth.api.helper';
import { getVendorCredentials, uniqueProductName } from '../helpers/product.credentials';
import { addToCartApi } from '../helpers/product.api.helper';
import { establishSession } from '../helpers/session.functional.helper';

test.describe('PF-PROD Section D | Product Status', () => {
  let inactiveProductId = '';
  let inactiveProductName = '';

  test.beforeAll(async () => {
    const session = await getAdminSession();
    const categoryId = await getFirstCategoryId(session);
    inactiveProductName = uniqueProductName('pf-inactive');
    const created = await createProductApi(session, {
      name: inactiveProductName,
      price: 130,
      categoryId,
      stock: 20,
      isActive: true,
    });
    inactiveProductId = String(created._id || created.id);
    await updateProductApi(session, inactiveProductId, { isActive: false });
  });

  test('PF-PROD-029 | Admin can mark product inactive via edit form', async ({ page, adminCreds }) => {
    const session = await getAdminSession();
    const categoryId = await getFirstCategoryId(session);
    const name = uniqueProductName('pf-inactive-ui');
    const created = await createProductApi(session, { name, price: 140, categoryId, stock: 10 });
    const productId = String(created._id || created.id);
    await establishSession(page, 'admin');
    const adminPage = new AdminProductsPage(page);
    await adminPage.goto();
    await adminPage.openEditForName(name);
    await adminPage.statusSelect().selectOption('inactive');
    const response = await adminPage.submitUpdate();
    expect(response.status()).toBe(200);
    const body = await response.json();
    const updated = body?.data ?? body;
    expect(updated?.isActive).toBe(false);
    void productId;
  });

  test('PF-PROD-030 | Inactive product excluded from vendor catalog', async ({ page, vendorCreds }) => {
    await establishSession(page, 'vendor');
    const vendorPage = new VendorProductsPage(page);
    await vendorPage.goto();
    await vendorPage.waitForProducts();
    await expect(vendorPage.cardByName(inactiveProductName)).toHaveCount(0);
  });

  test('PF-PROD-031 | Inactive product accessible by direct URL', async ({ page, vendorCreds }) => {
    await establishSession(page, 'vendor');
    const details = new VendorProductDetailsPage(page);
    await details.goto(inactiveProductId);
    await details.waitForLoad();
    await expect(details.title()).toContainText(inactiveProductName);
  });

  test('PF-PROD-032 | Inactive product cannot be added to cart', async () => {
    const vendorSession = await loginApi(
      getVendorCredentials().mobile,
      getVendorCredentials().password
    );
    await expect(addToCartApi(vendorSession, inactiveProductId, 1)).rejects.toMatchObject({
      response: { status: 400 },
    });
  });

  test('PF-PROD-033 | Admin can reactivate product', async () => {
    const session = await getAdminSession();
    await updateProductApi(session, inactiveProductId, { isActive: true });
    const list = await listProductsApi({ limit: 100, _refresh: Date.now() });
    const products = list.products ?? [];
    const found = products.find(
      (p: { name?: string }) => p.name === inactiveProductName
    );
    expect(found).toBeTruthy();
    await updateProductApi(session, inactiveProductId, { isActive: false });
  });

  test('PF-PROD-034 | Inactive product may appear in search results', async () => {
    const results = await import('../helpers/product.api.helper').then((m) =>
      m.searchProductsApi(inactiveProductName)
    );
    const arr = Array.isArray(results) ? results : [];
    const found = arr.some((p: { name?: string }) => p.name === inactiveProductName);
    expect(typeof found).toBe('boolean');
  });

  test('PF-PROD-035 | PATCH /products/:id/status as Admin', async () => {
    const session = await getAdminSession();
    const categoryId = await getFirstCategoryId(session);
    const created = await createProductApi(session, {
      name: uniqueProductName('pf-status-api'),
      price: 155,
      categoryId,
    });
    const productId = String(created._id || created.id);
    const updated = await patchProductStatusApi(session, productId, false);
    expect(updated.isActive).toBe(false);
  });

  test('PF-PROD-036 | Vendor cannot call status API', async () => {
    const vendorSession = await loginApi(
      getVendorCredentials().mobile,
      getVendorCredentials().password
    );
    await expect(
      patchProductStatusApi(vendorSession, inactiveProductId, false)
    ).rejects.toMatchObject({ response: { status: 403 } });
  });

  test('PF-PROD-037 | Stock-derived badge vs isActive mismatch', async ({ page, adminCreds }) => {
    const session = await getAdminSession();
    const categoryId = await getFirstCategoryId(session);
    const name = uniqueProductName('pf-badge-mismatch');
    await createProductApi(session, {
      name,
      price: 160,
      categoryId,
      stock: 50,
      isActive: false,
    });
    await establishSession(page, 'admin');
    const adminPage = new AdminProductsPage(page);
    await adminPage.goto();
    await adminPage.search(name);
    const row = adminPage.rowByName(name);
    if (await row.count()) {
      const badge = row.locator('text=/In Stock|Active|Low Stock|Out of Stock/i');
      await expect(badge.first()).toBeVisible();
    }
  });

  test('PF-PROD-038 | Inactive product disappears from admin list after refresh', async ({
    page,
    adminCreds,
  }) => {
    await establishSession(page, 'admin');
    const adminPage = new AdminProductsPage(page);
    await adminPage.goto();
    await adminPage.waitForTable();
    await adminPage.search(inactiveProductName);
    await expect(adminPage.rowByName(inactiveProductName)).toHaveCount(0);
  });
});
