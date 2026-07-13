import { test, expect } from '../fixtures/product.validation.fixture';
import AdminProductsPage from '../pages/admin/AdminProductsPage';
import {
  createProductApi,
  getAdminSession,
  getFirstCategoryId,
} from '../helpers/product.api.helper';
import { establishSession } from '../helpers/session.functional.helper';
import { INVALID_FILE_PATH, VALID_PNG_PATH } from '../helpers/product.test-data.paths';
import {
  apiMultipart,
  expectApiRejects,
  expectApiStatus,
  uniqueValidationName,
} from '../helpers/validation/product.validation.helper';

test.describe('PV-PROD Section G | Image & Upload Validation', () => {
  test('PV-PROD-045 | Valid PNG upload accepted on create', async () => {
    const session = await getAdminSession();
    const categoryId = await getFirstCategoryId(session);
    const created = await createProductApi(
      session,
      { name: uniqueValidationName('pv-png'), price: 100, categoryId },
      VALID_PNG_PATH
    );
    expect(created.imageUrl || created.image).toBeTruthy();
  });

  test('PV-PROD-046 | Missing image allowed on create', async () => {
    const session = await getAdminSession();
    const categoryId = await getFirstCategoryId(session);
    const created = await createProductApi(session, {
      name: uniqueValidationName('pv-no-img'),
      price: 100,
      categoryId,
    });
    expect(created.name).toBeTruthy();
  });

  test('PV-PROD-047 | API rejects invalid image MIME type', async () => {
    const session = await getAdminSession();
    const categoryId = await getFirstCategoryId(session);
    const result = await apiMultipart(
      session,
      'POST',
      '/products',
      {
        name: uniqueValidationName('pv-bad-mime'),
        price: '100',
        categoryId,
      },
      'image',
      { name: 'bad.txt', mimeType: 'text/plain', buffer: Buffer.from('not an image') }
    );
    expect(result.status).toBeGreaterThanOrEqual(400);
  });

  test('PV-PROD-048 | API rejects empty image file', async () => {
    const session = await getAdminSession();
    const categoryId = await getFirstCategoryId(session);
    const result = await apiMultipart(
      session,
      'POST',
      '/products',
      {
        name: uniqueValidationName('pv-empty-file'),
        price: '100',
        categoryId,
      },
      'image',
      { name: 'empty.png', mimeType: 'image/png', buffer: Buffer.alloc(0) }
    );
    expect(result.status).toBeGreaterThanOrEqual(400);
  });

  test('PV-PROD-049 | API rejects oversized image (>10MB)', async () => {
    const session = await getAdminSession();
    const categoryId = await getFirstCategoryId(session);
    const huge = Buffer.alloc(11 * 1024 * 1024, 1);
    const result = await apiMultipart(
      session,
      'POST',
      '/products',
      {
        name: uniqueValidationName('pv-huge'),
        price: '100',
        categoryId,
      },
      'image',
      { name: 'huge.png', mimeType: 'image/png', buffer: huge }
    );
    expect(result.status).toBeGreaterThanOrEqual(400);
  });

  test('PV-PROD-050 | API rejects wrong magic bytes (PNG header mismatch)', async () => {
    const session = await getAdminSession();
    const categoryId = await getFirstCategoryId(session);
    const result = await apiMultipart(
      session,
      'POST',
      '/products',
      {
        name: uniqueValidationName('pv-fake-png'),
        price: '100',
        categoryId,
      },
      'image',
      { name: 'fake.png', mimeType: 'image/png', buffer: Buffer.from('not-a-png-file') }
    );
    expect(result.status).toBeGreaterThanOrEqual(400);
  });

  test('PV-PROD-051 | API rejects executable disguised as image', async () => {
    const session = await getAdminSession();
    const categoryId = await getFirstCategoryId(session);
    const result = await apiMultipart(
      session,
      'POST',
      '/products',
      {
        name: uniqueValidationName('pv-exe'),
        price: '100',
        categoryId,
      },
      'image',
      { name: 'malware.exe', mimeType: 'application/octet-stream', buffer: Buffer.from('MZ') }
    );
    expect(result.status).toBeGreaterThanOrEqual(400);
  });

  test('PV-PROD-052 | Client rejects invalid file type in UI', async ({ page }) => {
    await establishSession(page, 'admin');
    const adminPage = new AdminProductsPage(page);
    await adminPage.goto();
    await adminPage.openCreateModal();
    await adminPage.imageInput().setInputFiles(INVALID_FILE_PATH);
    await expect(page.locator('text=Only JPEG, PNG, and WebP images are allowed')).toBeVisible();
  });

  test('PV-PROD-053 | Client rejects file > 10MB in UI', async ({ page }) => {
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

  test('PV-PROD-054 | imageUrl arbitrary string accepted without URL validation (gap)', async () => {
    const session = await getAdminSession();
    const categoryId = await getFirstCategoryId(session);
    const result = await apiMultipart(
      session,
      'POST',
      '/products',
      {
        name: uniqueValidationName('pv-bad-url'),
        price: '100',
        categoryId,
        imageUrl: 'not-a-valid-url',
      }
    );
    await expectApiStatus(result, 200);
  });

  test('PV-PROD-055 | GIF rejected by multer but allowed in fileValidation service (gap)', async () => {
    const session = await getAdminSession();
    const categoryId = await getFirstCategoryId(session);
    const gifHeader = Buffer.from('GIF89a', 'ascii');
    const result = await apiMultipart(
      session,
      'POST',
      '/products',
      {
        name: uniqueValidationName('pv-gif'),
        price: '100',
        categoryId,
      },
      'image',
      { name: 'test.gif', mimeType: 'image/gif', buffer: gifHeader }
    );
    expect(result.status).toBeGreaterThanOrEqual(400);
  });
});
