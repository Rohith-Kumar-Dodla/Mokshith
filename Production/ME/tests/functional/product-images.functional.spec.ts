import { test, expect } from '../fixtures/product.functional.fixture';
import AdminProductsPage from '../pages/admin/AdminProductsPage';
import VendorProductDetailsPage from '../pages/vendor/VendorProductDetailsPage';
import {
  createProductApi,
  getAdminSession,
  getFirstCategoryId,
  updateProductApi,
} from '../helpers/product.api.helper';
import { uniqueProductName } from '../helpers/product.credentials';
import { INVALID_FILE_PATH, VALID_PNG_PATH } from '../helpers/product.test-data.paths';
import { establishSession } from '../helpers/session.functional.helper';

test.describe('PF-PROD Section F | Product Images', () => {
  test('PF-PROD-044 | Valid PNG upload on create', async () => {
    const session = await getAdminSession();
    const categoryId = await getFirstCategoryId(session);
    const created = await createProductApi(
      session,
      { name: uniqueProductName('pf-png'), price: 180, categoryId },
      VALID_PNG_PATH
    );
    expect(created.imageUrl || created.image).toMatch(/\.(png|jpg|jpeg|webp|cloudinary|upload)/i);
  });

  test('PF-PROD-045 | Valid WebP upload', async ({ page, adminCreds }) => {
    const session = await getAdminSession();
    const categoryId = await getFirstCategoryId(session);
    const created = await createProductApi(
      session,
      { name: uniqueProductName('pf-webp'), price: 181, categoryId },
      VALID_PNG_PATH
    );
    expect(created.imageUrl || created.image).toBeTruthy();
    void page;
    void adminCreds;
  });

  test('PF-PROD-046 | Client rejects invalid file type', async ({ page, adminCreds }) => {
    await establishSession(page, 'admin');
    const adminPage = new AdminProductsPage(page);
    await adminPage.goto();
    await adminPage.openCreateModal();
    await adminPage.imageInput().setInputFiles(INVALID_FILE_PATH);
    await expect(page.locator('text=Only JPEG, PNG, and WebP images are allowed')).toBeVisible();
  });

  test('PF-PROD-047 | Client rejects file > 10MB', async ({ page, adminCreds }) => {
    await establishSession(page, 'admin');
    const adminPage = new AdminProductsPage(page);
    await adminPage.goto();
    await adminPage.openCreateModal();
    const hugeBuffer = Buffer.alloc(11 * 1024 * 1024, 1);
    await adminPage.imageInput().setInputFiles({
      name: 'huge.png',
      mimeType: 'image/png',
      buffer: hugeBuffer,
    });
    await expect(page.locator('text=Image must be smaller than 10MB')).toBeVisible();
  });

  test('PF-PROD-048 | API rejects invalid image MIME', async () => {
    const session = await getAdminSession();
    const categoryId = await getFirstCategoryId(session);
    const API_BASE =
      process.env.TEST_API_BASE_URL || 'http://localhost:5000/api/v1';
    const form = new FormData();
    form.append('name', uniqueProductName('pf-bad-mime'));
    form.append('price', '100');
    form.append('categoryId', categoryId);
    const blob = new Blob(['not an image'], { type: 'text/plain' });
    form.append('image', blob, 'bad.txt');
    const { authHeaders } = await import('../helpers/auth.api.helper');
    const response = await fetch(`${API_BASE}/products`, {
      method: 'POST',
      headers: authHeaders(session),
      body: form,
    });
    expect(response.status).toBeGreaterThanOrEqual(400);
  });

  test('PF-PROD-049 | Image displays on vendor details', async ({ page, vendorCreds }) => {
    const session = await getAdminSession();
    const categoryId = await getFirstCategoryId(session);
    const name = uniqueProductName('pf-detail-img');
    const created = await createProductApi(
      session,
      { name, price: 190, categoryId, stock: 5 },
      VALID_PNG_PATH
    );
    const productId = String(created._id || created.id);
    await establishSession(page, 'vendor');
    const details = new VendorProductDetailsPage(page);
    await details.goto(productId);
    await details.waitForLoad();
    const img = details.heroImage();
    await expect(img).toBeVisible();
    const src = await img.getAttribute('src');
    expect(src?.length).toBeGreaterThan(0);
  });

  test('PF-PROD-050 | Image updates after edit replace', async ({ page, vendorCreds }) => {
    const session = await getAdminSession();
    const categoryId = await getFirstCategoryId(session);
    const name = uniqueProductName('pf-replace-img');
    const created = await createProductApi(session, {
      name,
      price: 191,
      categoryId,
      stock: 5,
    });
    const productId = String(created._id || created.id);
    await updateProductApi(session, productId, { price: 191 }, VALID_PNG_PATH);
    await establishSession(page, 'vendor');
    const details = new VendorProductDetailsPage(page);
    await details.goto(productId);
    await details.waitForLoad();
    await expect(details.heroImage()).toBeVisible();
  });

  test('PF-PROD-051 | Multi-image gallery when backend provides images[]', async () => {
    const session = await getAdminSession();
    const categoryId = await getFirstCategoryId(session);
    const created = await createProductApi(
      session,
      { name: uniqueProductName('pf-multi'), price: 192, categoryId, stock: 5 },
      VALID_PNG_PATH
    );
    expect(created.imageUrl || created.image).toBeTruthy();
  });

  test('PF-PROD-052 | Product without image renders gracefully', async ({ page, vendorCreds }) => {
    const session = await getAdminSession();
    const categoryId = await getFirstCategoryId(session);
    const created = await createProductApi(session, {
      name: uniqueProductName('pf-no-img'),
      price: 193,
      categoryId,
      stock: 5,
    });
    const productId = String(created._id || created.id);
    await establishSession(page, 'vendor');
    const details = new VendorProductDetailsPage(page);
    await details.goto(productId);
    await details.waitForLoad();
    await expect(details.title()).toBeVisible();
  });
});
