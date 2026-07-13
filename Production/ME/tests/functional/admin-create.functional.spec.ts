import { test, expect } from '../fixtures/product.functional.fixture';
import AdminProductsPage from '../pages/admin/AdminProductsPage';
import {
  createProductApi,
  getAdminSession,
  getFirstCategoryId,
  getProductApi,
  listInventoryApi,
} from '../helpers/product.api.helper';
import { uniqueProductName } from '../helpers/product.credentials';
import { VALID_PNG_PATH } from '../helpers/product.test-data.paths';
import { establishSession } from '../helpers/session.functional.helper';

test.describe('PF-PROD Section A | Admin Product Create', () => {
  test('PF-PROD-001 | Admin can create product with required fields', async ({ page, adminCreds }) => {
    const categoryId = await getFirstCategoryId(await getAdminSession());
    await establishSession(page, 'admin');
    const adminPage = new AdminProductsPage(page);
    await adminPage.goto();
    await adminPage.waitForTable();
    await adminPage.openCreateModal();
    const name = uniqueProductName('pf-create');
    await adminPage.fillForm({ name, price: 150, categoryValue: categoryId });
    const response = await adminPage.submitCreate();
    expect(response.status()).toBe(200);
    await adminPage.expectSuccessMessage('Product created successfully');
    await expect(adminPage.rowByName(name)).toBeVisible();
  });

  test('PF-PROD-002 | Optional fields persist on create', async ({ page, adminCreds }) => {
    const session = await getAdminSession();
    const categoryId = await getFirstCategoryId(session);
    const name = uniqueProductName('pf-optional');
    const created = await createProductApi(session, {
      name,
      description: 'Functional optional fields test',
      price: 220,
      stock: 50,
      moq: 5,
      categoryId,
    });
    const productId = String(created._id || created.id);
    const fetched = await getProductApi(productId);
    expect(fetched.description).toBe('Functional optional fields test');
    expect(Number(fetched.stock)).toBe(50);
    expect(Number(fetched.moq)).toBe(5);
  });

  test('PF-PROD-003 | Default values when optional fields omitted', async ({ page, adminCreds }) => {
    const session = await getAdminSession();
    const categoryId = await getFirstCategoryId(session);
    const name = uniqueProductName('pf-defaults');
    const created = await createProductApi(session, { name, price: 99, categoryId });
    expect(Number(created.stock ?? 0)).toBe(0);
    expect(Number(created.moq ?? 1)).toBe(1);
    expect(created.isActive).not.toBe(false);
  });

  test('PF-PROD-004 | Create product with valid image upload', async ({ page, adminCreds }) => {
    const session = await getAdminSession();
    const categoryId = await getFirstCategoryId(session);
    const name = uniqueProductName('pf-image');
    const created = await createProductApi(
      session,
      { name, price: 175, categoryId, stock: 10 },
      VALID_PNG_PATH
    );
    expect(created.imageUrl || created.image).toBeTruthy();
  });

  test('PF-PROD-005 | Client rejects missing product name', async ({ page, adminCreds }) => {
    await establishSession(page, 'admin');
    const adminPage = new AdminProductsPage(page);
    await adminPage.goto();
    await adminPage.openCreateModal();
    await adminPage.priceInput().fill('100');
    await adminPage.selectFirstCategory();
    await adminPage.saveButton().click();
    // UI uses native required validation for empty Product Name (no custom error).
    await expect(adminPage.nameInput()).toBeVisible();
    await expect.poll(async () => adminPage.nameInput().evaluate((el: HTMLInputElement) => el.validity.valueMissing)).toBe(true);
  });

  test('PF-PROD-006 | Client rejects missing category', async ({ page, adminCreds }) => {
    await establishSession(page, 'admin');
    const adminPage = new AdminProductsPage(page);
    await adminPage.goto();
    await adminPage.openCreateModal();
    await adminPage.nameInput().fill(uniqueProductName('pf-no-cat'));
    await adminPage.priceInput().fill('100');
    await adminPage.saveButton().click();
    await expect.poll(async () => adminPage.categorySelect().evaluate((el: HTMLSelectElement) => el.validity.valueMissing)).toBe(true);
  });

  test('PF-PROD-007 | Client rejects price <= 0', async ({ page, adminCreds }) => {
    await establishSession(page, 'admin');
    const adminPage = new AdminProductsPage(page);
    await adminPage.goto();
    await adminPage.openCreateModal();
    await adminPage.fillForm({ name: uniqueProductName('pf-price'), price: 0 });
    await adminPage.saveButton().click();
    // Price input has min=1, so browser constraint validation blocks submit for 0.
    await expect.poll(async () => adminPage.priceInput().evaluate((el: HTMLInputElement) => el.validity.rangeUnderflow)).toBe(true);
  });

  test('PF-PROD-008 | API rejects missing required fields', async () => {
    const session = await getAdminSession();
    await expect(
      createProductApi(session, { name: '', price: 0, categoryId: '' } as never)
    ).rejects.toMatchObject({ response: { status: 400 } });
  });

  test('PF-PROD-009 | API rejects price = 0', async () => {
    const session = await getAdminSession();
    const categoryId = await getFirstCategoryId(session);
    await expect(
      createProductApi(session, { name: uniqueProductName('pf-zero'), price: 0, categoryId })
    ).rejects.toMatchObject({ response: { status: 400 } });
  });

  test('PF-PROD-010 | API rejects negative stock', async () => {
    const session = await getAdminSession();
    const categoryId = await getFirstCategoryId(session);
    await expect(
      createProductApi(session, {
        name: uniqueProductName('pf-neg-stock'),
        price: 100,
        stock: -10,
        categoryId,
      })
    ).rejects.toMatchObject({ response: { status: 400 } });
  });

  test('PF-PROD-011 | API rejects MOQ < 1', async () => {
    const session = await getAdminSession();
    const categoryId = await getFirstCategoryId(session);
    await expect(
      createProductApi(session, {
        name: uniqueProductName('pf-moq'),
        price: 100,
        moq: 0,
        categoryId,
      })
    ).rejects.toMatchObject({ response: { status: 400 } });
  });

  test('PF-PROD-012 | Created product persists after page refresh', async ({ page, adminCreds }) => {
    const session = await getAdminSession();
    const categoryId = await getFirstCategoryId(session);
    const name = uniqueProductName('pf-persist');
    await createProductApi(session, { name, price: 111, categoryId, stock: 5 });
    await establishSession(page, 'admin');
    const adminPage = new AdminProductsPage(page);
    await adminPage.goto();
    await adminPage.waitForTable();
    await page.reload();
    await adminPage.waitForTable();
    await expect(adminPage.rowByName(name)).toBeVisible();
  });

  test('PF-PROD-013 | Inventory auto-provisioned on create', async () => {
    const session = await getAdminSession();
    const categoryId = await getFirstCategoryId(session);
    const name = uniqueProductName('pf-inv');
    const created = await createProductApi(session, {
      name,
      price: 120,
      categoryId,
      stock: 25,
    });
    const productId = String(created._id || created.id);
    const inventory = await listInventoryApi(session);
    const rows = Array.isArray(inventory) ? inventory : (inventory as { data?: unknown[] })?.data ?? [];
    const match = rows.find((row: { productId?: { _id?: string } | string }) => {
      const pid = typeof row.productId === 'object' ? row.productId?._id : row.productId;
      return String(pid) === productId;
    });
    expect(match).toBeTruthy();
  });
});
