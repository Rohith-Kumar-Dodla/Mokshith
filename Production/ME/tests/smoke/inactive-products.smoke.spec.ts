import { test, expect } from '@playwright/test';

import loginFlow from '../flows/authentication/login.flow';

import AdminProductsPage from '../pages/admin/AdminProductsPage';

import {

  createProductApi,

  getAdminSession,

  getFirstCategoryId,

} from '../helpers/product.api.helper';



test.describe('P-PROD-09 | Inactive Products smoke', () => {

  test('P-PROD-09 | Admin can mark product inactive and status badge updates', async ({ page }) => {

    const session = await getAdminSession();

    const categoryId = await getFirstCategoryId(session);

    const productName = `smoke-inactive-${Date.now()}-${Math.floor(Math.random() * 10000)}`;



    await createProductApi(session, {

      name: productName,

      price: 100,

      categoryId,

      stock: 50,

      isActive: true,

    });



    const seededAdminMobile = process.env.TEST_SEEDED_ADMIN_MOBILE || '9000000002';

    const seededAdminPassword = process.env.TEST_SEEDED_ADMIN_PASSWORD || 'Admin@123';

    await loginFlow(page, seededAdminMobile, seededAdminPassword);



    const adminPage = new AdminProductsPage(page);

    await adminPage.goto();

    await adminPage.waitForTable();

    await adminPage.search(productName);



    const targetRow = adminPage.rowByName(productName);

    await expect(targetRow).toBeVisible({ timeout: 15000 });

    await adminPage.openEditForName(productName);



    const statusSelect = page.locator('form select:has(option[value="inactive"])');

    await statusSelect.waitFor({ state: 'visible', timeout: 10000 });

    await statusSelect.selectOption('inactive');



    const [updateResponse] = await Promise.all([

      page.waitForResponse(

        (resp) => resp.url().includes('/api/v1/products/') && resp.request().method() === 'PUT',

        { timeout: 15000 }

      ),

      page.click('form button:has-text("Update Product"), form button:has-text("Save Product")'),

    ]);



    expect(updateResponse.status(), 'Update product API should return 200').toBe(200);

    const responseBody = await updateResponse.json().catch(() => null);

    const updatedProduct = responseBody?.data ?? responseBody;

    expect(updatedProduct?.isActive, 'Product should be persisted as inactive').toBe(false);



    await expect(page.locator('text=Product updated successfully')).toBeVisible({ timeout: 5000 });



    await adminPage.search(productName);

    const updatedRow = adminPage.rowByName(productName);

    await expect(updatedRow).toBeVisible({ timeout: 15000 });
    await expect(updatedRow.getByText('Inactive', { exact: true })).toBeVisible({ timeout: 10000 });

  });

});


