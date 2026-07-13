import { test, expect } from '../fixtures/product.functional.fixture';
import AdminProductsPage from '../pages/admin/AdminProductsPage';
import {
  createProductApi,
  deleteProductApi,
  getAdminSession,
  getFirstCategoryId,
  getProductApi,
} from '../helpers/product.api.helper';
import { uniqueProductName } from '../helpers/product.credentials';
import { establishSession } from '../helpers/session.functional.helper';

test.describe('PF-PROD Section C | Admin Delete & Lifecycle', () => {
  test('PF-PROD-024 | Admin can hard-delete a product', async ({ page, adminCreds }) => {
    const session = await getAdminSession();
    const categoryId = await getFirstCategoryId(session);
    const name = uniqueProductName('pf-delete');
    await createProductApi(session, { name, price: 90, categoryId, stock: 1 });
    await establishSession(page, 'admin');
    const adminPage = new AdminProductsPage(page);
    await adminPage.goto();
    await adminPage.waitForTable();
    const response = await adminPage.deleteByName(name, true);
    expect((await response)?.status()).toBe(200);
    await adminPage.expectSuccessMessage('Product deleted successfully');
  });

  test('PF-PROD-025 | Delete confirmation cancel preserves product', async ({ page, adminCreds }) => {
    const session = await getAdminSession();
    const categoryId = await getFirstCategoryId(session);
    const name = uniqueProductName('pf-delete-cancel');
    await createProductApi(session, { name, price: 95, categoryId });
    await establishSession(page, 'admin');
    const adminPage = new AdminProductsPage(page);
    await adminPage.goto();
    await adminPage.waitForTable();
    await adminPage.search(name);
    await expect(adminPage.rowByName(name)).toBeVisible({ timeout: 15000 });

    // Verify confirmation dialog opens and Cancel is actually executed.
    let dialogOpened = false;
    let dialogMessage = '';
    page.once('dialog', async (dialog) => {
      dialogOpened = true;
      dialogMessage = dialog.message();
      await dialog.dismiss();
    });

    // Ensure no DELETE request is sent when Cancel is pressed.
    const deleteRequest = page
      .waitForResponse(
        (resp) => resp.url().includes('/api/v1/products/') && resp.request().method() === 'DELETE',
        { timeout: 2000 }
      )
      .then(() => true)
      .catch(() => false);

    await adminPage.rowByName(name).locator('button[title="Delete"]').click();
    expect(dialogOpened).toBe(true);
    expect(dialogMessage.length).toBeGreaterThan(0);
    await expect(deleteRequest).resolves.toBe(false);
    await expect(adminPage.rowByName(name)).toBeVisible();
  });

  test('PF-PROD-026 | Deleted product returns 404 by ID', async () => {
    const session = await getAdminSession();
    const categoryId = await getFirstCategoryId(session);
    const created = await createProductApi(session, {
      name: uniqueProductName('pf-deleted-404'),
      price: 80,
      categoryId,
    });
    const productId = String(created._id || created.id);
    await deleteProductApi(session, productId);
    await expect(getProductApi(productId)).rejects.toMatchObject({ response: { status: 404 } });
  });

  test('PF-PROD-027 | No restore capability exists', async () => {
    const session = await getAdminSession();
    const categoryId = await getFirstCategoryId(session);
    const created = await createProductApi(session, {
      name: uniqueProductName('pf-no-restore'),
      price: 70,
      categoryId,
    });
    const productId = String(created._id || created.id);
    await deleteProductApi(session, productId);
    const { apiClient } = await import('../helpers/apiClient');
    const { authHeaders } = await import('../helpers/auth.api.helper');
    const response = await apiClient
      .post(`/products/${productId}/restore`, {}, { headers: authHeaders(session) })
      .catch((err) => err);
    expect(response?.response?.status ?? response?.status ?? 404).toBeGreaterThanOrEqual(404);
  });

  test('PF-PROD-028 | Duplicate product names are allowed', async () => {
    const session = await getAdminSession();
    const categoryId = await getFirstCategoryId(session);
    const name = uniqueProductName('pf-dup');
    const first = await createProductApi(session, { name, price: 60, categoryId });
    const second = await createProductApi(session, { name, price: 61, categoryId });
    expect(first._id || first.id).not.toBe(second._id || second.id);
  });
});
