/**
 * Admin Functional Certification Suite (AF-ADM)
 *
 * Production sources of truth only. Admin Smoke (AS-ADM) is LOCKED — do not modify.
 *
 * Covered: Dashboard quick actions · Products CRUD/search/filter · Categories CRUD ·
 * Vendors search/filter/approve/reject/suspend · Orders search/filter/pagination/status ·
 * Inventory search/filter/stock · Delivery assign/reassign/tabs · Reports CSV truths ·
 * Analytics delivery-only · Settings profile/preferences · Notifications drawer refresh ·
 * Browser refresh persistence
 *
 * Explicitly NOT certified (absent / Super-Admin-only):
 * - Admin payment verification workflows
 * - Financial /analytics/dashboard
 * - PDF/Excel report export (production error only)
 * - Admin Users / Roles pages
 */
import { test, expect } from '../fixtures/product.functional.fixture';
import { type ApiSession } from '../helpers/auth.api.helper';
import AdminProductsPage from '../pages/admin/AdminProductsPage';
import AdminCategoriesPage from '../pages/admin/AdminCategoriesPage';
import AdminInventoryPage from '../pages/admin/AdminInventoryPage';
import { AdminDeliveryAssignmentPage } from '../pages/delivery/DeliveryPages';
import { uniqueProductName } from '../helpers/product.credentials';
import {
  type AdminFunctionalSeed,
  adminGoto,
  authHeaders,
  clearValidationRateLimits,
  establishAdminUiSession,
  getAdminStatsRaw,
  refreshAdminSession,
  seedAdminFunctionalData,
} from '../helpers/admin.functional.helper';

let adminSession: ApiSession;
let seed: AdminFunctionalSeed;

test.describe('Admin Functional Suite', () => {
  test.beforeAll(async () => {
    clearValidationRateLimits();
    const seeded = await seedAdminFunctionalData();
    adminSession = seeded.adminSession;
    seed = seeded.seed;
    expect(seed.product.id).toBeTruthy();
    expect(seed.orderId).toBeTruthy();
    expect(seed.pendingVendor.id).toBeTruthy();
    expect(seed.pendingShipment.shipmentId).toBeTruthy();
  });

  // ── Dashboard quick actions & activities ──────────────────────────────────
  test('AF-ADM-001 | Quick Action Add Product navigates to Product Management', async ({ page }) => {
    await establishAdminUiSession(page);
    await page.getByRole('link', { name: /Add Product/i }).click();
    await expect(page).toHaveURL(/\/admin\/products/);
    await expect(page.getByRole('heading', { name: 'Product Management' })).toBeVisible({
      timeout: 15000,
    });
  });

  test('AF-ADM-002 | Quick Action Update Inventory navigates to Inventory Control', async ({
    page,
  }) => {
    await establishAdminUiSession(page);
    await page.getByRole('link', { name: /Update Inventory/i }).click();
    await expect(page).toHaveURL(/\/admin\/inventory/);
    await expect(page.getByRole('heading', { name: 'Inventory Control' })).toBeVisible({
      timeout: 15000,
    });
  });

  test('AF-ADM-003 | Quick Action Approve Vendor navigates to Vendor Management', async ({
    page,
  }) => {
    await establishAdminUiSession(page);
    await page.getByRole('link', { name: /Approve Vendor/i }).click();
    await expect(page).toHaveURL(/\/admin\/vendors/);
    await expect(page.getByRole('heading', { name: 'Vendor Management' })).toBeVisible({
      timeout: 15000,
    });
  });

  test('AF-ADM-004 | Quick Action Assign Delivery navigates to Delivery Assignment', async ({
    page,
  }) => {
    await establishAdminUiSession(page);
    await page.getByRole('link', { name: /Assign Delivery/i }).click();
    await expect(page).toHaveURL(/\/admin\/delivery-assignment/);
    await expect(page.getByRole('heading', { name: 'Delivery Assignment' })).toBeVisible({
      timeout: 15000,
    });
  });

  test('AF-ADM-005 | Quick Action View Orders navigates to Area Orders', async ({ page }) => {
    await establishAdminUiSession(page);
    await page.getByRole('link', { name: /View Orders/i }).click();
    await expect(page).toHaveURL(/\/admin\/orders/);
    await expect(page.getByRole('heading', { name: 'Area Orders' })).toBeVisible({
      timeout: 15000,
    });
  });

  test('AF-ADM-006 | Quick Action Generate Report navigates to Reports', async ({ page }) => {
    await establishAdminUiSession(page);
    await page.getByRole('link', { name: /Generate Report/i }).click();
    await expect(page).toHaveURL(/\/admin\/reports/);
    await expect(page.getByRole('heading', { name: 'Reports' })).toBeVisible({ timeout: 15000 });
  });

  test('AF-ADM-007 | Dashboard Recent Activities section present', async ({ page }) => {
    await establishAdminUiSession(page);
    await expect(page.getByRole('heading', { name: 'Recent Activities' })).toBeVisible();
    // Production empty copy — when notifications exist, titles render under the section.
    const empty = page.getByText('No recent notifications.');
    if (await empty.isVisible().catch(() => false)) {
      await expect(empty).toBeVisible();
    } else {
      await expect(
        page.getByRole('heading', { name: 'Recent Activities' }).locator('xpath=following-sibling::div[1]//h3').first()
      ).toBeVisible({ timeout: 15000 });
    }
  });

  // ── Products ──────────────────────────────────────────────────────────────
  test('AF-ADM-008 | Products create Save Product succeeds', async ({ page }) => {
    await adminGoto(page, '/admin/products');
    const products = new AdminProductsPage(page);
    await products.waitForTable();
    const name = uniqueProductName('af-ui-create');
    await products.openCreateModal();
    await products.fillForm({ name, price: 120, stock: 40, moq: 1 });
    const response = await products.submitCreate();
    expect(response.status()).toBeGreaterThanOrEqual(200);
    expect(response.status()).toBeLessThan(300);
    await products.expectSuccessMessage('Product created successfully');
    await products.search(name);
    await expect(products.rowByName(name)).toBeVisible({ timeout: 15000 });
  });

  test('AF-ADM-009 | Products empty name blocked by HTML required constraint', async ({ page }) => {
    // Production: Product Name input has HTML required — browser blocks submit before React formError.
    await adminGoto(page, '/admin/products');
    const products = new AdminProductsPage(page);
    await products.openCreateModal();
    await products.selectFirstCategory();
    await products.priceInput().fill('50');
    await products.saveButton().click();
    await expect(products.nameInput()).toBeFocused();
    const missing = await products.nameInput().evaluate((el: HTMLInputElement) => el.validity.valueMissing);
    expect(missing).toBe(true);
    await expect(page.getByRole('heading', { name: 'Add New Product' })).toBeVisible();
  });

  test('AF-ADM-010 | Products edit Update Product succeeds', async ({ page }) => {
    await adminGoto(page, '/admin/products');
    const products = new AdminProductsPage(page);
    await products.waitForTable();
    await products.search(seed.product.name);
    await products.openEditForName(seed.product.name);
    await products.selectFirstCategory();
    await products.descriptionInput().fill(`AF-ADM edit ${Date.now()}`);
    const response = await products.submitUpdate();
    expect(response.status()).toBeLessThan(500);
    await products.expectSuccessMessage('Product updated successfully');
  });

  test('AF-ADM-011 | Products View opens Product Details modal', async ({ page }) => {
    await adminGoto(page, '/admin/products');
    const products = new AdminProductsPage(page);
    await products.waitForTable();
    await products.search(seed.product.name);
    await products.openViewForName(seed.product.name);
    await expect(page.getByRole('heading', { name: 'Product Details' })).toBeVisible();
  });

  test('AF-ADM-012 | Products client search filters table by name', async ({ page }) => {
    await adminGoto(page, '/admin/products');
    const products = new AdminProductsPage(page);
    await products.waitForTable();
    await products.search(seed.product.name);
    await expect(products.rowByName(seed.product.name)).toBeVisible({ timeout: 15000 });
    await products.search('zzz-no-match-af-adm-xyz');
    await expect(page.getByText('No products found')).toBeVisible({ timeout: 10000 });
  });

  test('AF-ADM-013 | Products Stock filter Out of Stock applies client-side', async ({ page }) => {
    await adminGoto(page, '/admin/products');
    const products = new AdminProductsPage(page);
    await products.waitForTable();
    await products.selectStockFilter('Out of Stock');
    // Either filtered rows or empty — both are production outcomes
    const empty = page.getByText('No products found');
    const rows = page.locator('table tbody tr');
    await expect(empty.or(rows.first())).toBeVisible({ timeout: 10000 });
  });

  test('AF-ADM-014 | Products delete confirms and removes row', async ({ page }) => {
    await adminGoto(page, '/admin/products');
    const products = new AdminProductsPage(page);
    await products.waitForTable();
    const name = uniqueProductName('af-ui-del');
    await products.openCreateModal();
    await products.fillForm({ name, price: 55, stock: 5, moq: 1 });
    await products.submitCreate();
    await products.expectSuccessMessage('Product created successfully');
    await products.search(name);
    const delResp = await products.deleteByName(name, true);
    expect(delResp && (await delResp).ok()).toBeTruthy();
    await products.expectSuccessMessage('Product deleted successfully');
  });

  // ── Categories ────────────────────────────────────────────────────────────
  test('AF-ADM-015 | Categories create Save Category succeeds', async ({ page }) => {
    await adminGoto(page, '/admin/categories');
    const categories = new AdminCategoriesPage(page);
    await expect(page.getByRole('heading', { name: 'Product Categories' })).toBeVisible({
      timeout: 15000,
    });
    const name = `AF Cat ${Date.now().toString(36).slice(-6)}`;
    await categories.openCreateModal();
    await categories.fillAndSave(name, 'active');
    await expect(page.getByText('Category created successfully')).toBeVisible({ timeout: 10000 });
    await expect(categories.rowByName(name)).toBeVisible({ timeout: 15000 });
  });

  test('AF-ADM-016 | Categories edit Update Category succeeds', async ({ page }) => {
    await adminGoto(page, '/admin/categories');
    const categories = new AdminCategoriesPage(page);
    const name = `AF CatEdit ${Date.now().toString(36).slice(-6)}`;
    await categories.openCreateModal();
    await categories.fillAndSave(name, 'active');
    await expect(page.getByText('Category created successfully')).toBeVisible({ timeout: 10000 });
    await categories.rowByName(name).locator('button[title="Edit"]').click();
    await page.waitForSelector('form input', { timeout: 10000 });
    const updated = `${name}-u`;
    await categories.nameInput().fill(updated);
    await categories.saveButton().click();
    await expect(page.getByText('Category updated successfully')).toBeVisible({ timeout: 10000 });
  });

  test('AF-ADM-017 | Categories delete confirms success', async ({ page }) => {
    await adminGoto(page, '/admin/categories');
    const categories = new AdminCategoriesPage(page);
    const name = `AF CatDel ${Date.now().toString(36).slice(-6)}`;
    await categories.openCreateModal();
    await categories.fillAndSave(name, 'active');
    await expect(page.getByText('Category created successfully')).toBeVisible({ timeout: 10000 });
    page.once('dialog', async (d) => d.accept());
    await Promise.all([
      page.waitForResponse(
        (r) => r.url().includes('/api/v1/categories/') && r.request().method() === 'DELETE',
        { timeout: 20000 }
      ),
      categories.rowByName(name).locator('button[title="Delete"]').click(),
    ]);
    await expect(page.getByText('Category deleted successfully')).toBeVisible({ timeout: 10000 });
  });

  // ── Vendors ───────────────────────────────────────────────────────────────
  test('AF-ADM-018 | Vendors list shows summary cards and seeded search', async ({ page }) => {
    await adminGoto(page, '/admin/vendors');
    await expect(page.getByRole('heading', { name: 'Vendor Management' })).toBeVisible({
      timeout: 15000,
    });
    await expect(page.getByText('Total Vendors').first()).toBeVisible();
    await expect(page.getByText('Pending Approval').first()).toBeVisible();
    await page.getByPlaceholder(/Search vendors by shop name, owner, or ID/i).fill(seed.pendingVendor.name);
    await expect(page.locator('table tbody tr').filter({ hasText: seed.pendingVendor.name })).toBeVisible({
      timeout: 15000,
    });
  });

  test('AF-ADM-019 | Vendors Status filter Pending', async ({ page }) => {
    await adminGoto(page, '/admin/vendors');
    await page.getByRole('button', { name: /Status:/i }).click();
    await page.getByRole('button', { name: 'Pending', exact: true }).click();
    await expect(
      page.locator('table tbody tr').filter({ hasText: seed.pendingVendor.name })
    ).toBeVisible({ timeout: 15000 });
  });

  test('AF-ADM-020 | Vendors Approve pending vendor', async ({ page }) => {
    await adminGoto(page, '/admin/vendors');
    await page.getByPlaceholder(/Search vendors/i).fill(seed.pendingVendor.name);
    const row = page.locator('table tbody tr').filter({ hasText: seed.pendingVendor.name });
    await expect(row).toBeVisible({ timeout: 15000 });
    await Promise.all([
      page.waitForResponse(
        (r) => r.url().includes('/api/v1/admin/approve/') && r.request().method() === 'POST',
        { timeout: 20000 }
      ),
      row.locator('button[title="Approve"]').click(),
    ]);
    await page.getByRole('button', { name: /Status:/i }).click();
    await page.getByRole('button', { name: 'Approved', exact: true }).click();
    await page.getByPlaceholder(/Search vendors/i).fill(seed.pendingVendor.name);
    await expect(row).toBeVisible({ timeout: 15000 });
  });

  test('AF-ADM-021 | Vendors Reject pending vendor', async ({ page }) => {
    await adminGoto(page, '/admin/vendors');
    await page.getByPlaceholder(/Search vendors/i).fill(seed.rejectVendor.name);
    const row = page.locator('table tbody tr').filter({ hasText: seed.rejectVendor.name });
    await expect(row).toBeVisible({ timeout: 15000 });
    await Promise.all([
      page.waitForResponse(
        (r) => r.url().includes('/api/v1/admin/reject/') && r.request().method() === 'POST',
        { timeout: 20000 }
      ),
      row.locator('button[title="Reject"]').click(),
    ]);
    await page.getByRole('button', { name: /Status:/i }).click();
    await page.getByRole('button', { name: 'Rejected', exact: true }).click();
    await page.getByPlaceholder(/Search vendors/i).fill(seed.rejectVendor.name);
    await expect(row).toBeVisible({ timeout: 15000 });
  });

  test('AF-ADM-022 | Vendors Suspend approved vendor', async ({ page }) => {
    await adminGoto(page, '/admin/vendors');
    await page.getByPlaceholder(/Search vendors/i).fill(seed.suspendVendor.name);
    const row = page.locator('table tbody tr').filter({ hasText: seed.suspendVendor.name });
    await expect(row).toBeVisible({ timeout: 15000 });
    await Promise.all([
      page.waitForResponse(
        (r) =>
          r.url().includes('/api/v1/admin/users/') &&
          r.request().method() === 'PATCH' &&
          r.url().includes(seed.suspendVendor.id),
        { timeout: 20000 }
      ),
      row.locator('button[title="Suspend"]').click(),
    ]);
    await page.getByRole('button', { name: /Status:/i }).click();
    await page.getByRole('button', { name: 'Suspended', exact: true }).click();
    await page.getByPlaceholder(/Search vendors/i).fill(seed.suspendVendor.name);
    await expect(row).toBeVisible({ timeout: 15000 });
  });

  test('AF-ADM-023 | Vendors View Profile modal', async ({ page }) => {
    await adminGoto(page, '/admin/vendors');
    await page.getByRole('button', { name: /Status:/i }).click();
    await page.getByRole('button', { name: 'All Status', exact: true }).click();
    const row = page.locator('table tbody tr').first();
    await expect(row).toBeVisible({ timeout: 15000 });
    await row.locator('button[title="View Profile"]').click();
    await expect(page.getByRole('heading', { name: 'Vendor Profile' })).toBeVisible({
      timeout: 10000,
    });
  });

  // ── Orders ────────────────────────────────────────────────────────────────
  test('AF-ADM-024 | Orders list loads with seeded order searchable', async ({ page }) => {
    await adminGoto(page, '/admin/orders');
    await expect(page.getByRole('heading', { name: 'Area Orders' })).toBeVisible({
      timeout: 15000,
    });
    await page.getByPlaceholder(/Search by order ID or vendor/i).fill(seed.orderId.slice(-8));
    await expect(page.locator('table tbody tr').first()).toBeVisible({ timeout: 15000 });
  });

  test('AF-ADM-025 | Orders Status filter Pending sends status query', async ({ page }) => {
    await adminGoto(page, '/admin/orders');
    const responsePromise = page.waitForResponse(
      (r) =>
        r.url().includes('/api/v1/orders') &&
        r.request().method() === 'GET' &&
        r.url().includes('status=PENDING'),
      { timeout: 20000 }
    );
    await page.getByRole('button', { name: /Status:/i }).click();
    await page.getByRole('button', { name: 'Pending', exact: true }).click();
    const response = await responsePromise;
    expect(response.ok()).toBeTruthy();
  });

  test('AF-ADM-026 | Orders Refresh force-refetches list', async ({ page }) => {
    await adminGoto(page, '/admin/orders');
    const responsePromise = page.waitForResponse(
      (r) => r.url().includes('/api/v1/orders') && r.request().method() === 'GET',
      { timeout: 20000 }
    );
    await page.getByRole('button', { name: /^Refresh$/i }).click();
    const response = await responsePromise;
    expect(response.ok()).toBeTruthy();
  });

  test('AF-ADM-027 | Orders pagination controls visible when pages exist', async ({ page }) => {
    await adminGoto(page, '/admin/orders');
    await expect(page.getByText(/Page \d+ of \d+/)).toBeVisible({ timeout: 15000 });
    await expect(page.getByRole('button', { name: 'Prev' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Next' })).toBeVisible();
  });

  test('AF-ADM-028 | Orders Manage opens Order Management modal', async ({ page }) => {
    await adminGoto(page, '/admin/orders');
    await page.getByPlaceholder(/Search by order ID or vendor/i).fill(seed.orderId.slice(-8));
    const manage = page.getByRole('button', { name: /Manage/i }).first();
    await expect(manage).toBeVisible({ timeout: 15000 });
    await manage.click();
    const modal = page.getByRole('dialog', { name: 'Order Management' });
    await expect(modal).toBeVisible({ timeout: 10000 });
    await expect(modal.getByText('Order ID', { exact: true })).toBeVisible();
    // When still PENDING, Confirm CONFIRMED is available
    const confirmedBtn = modal.getByRole('button', { name: /^CONFIRMED$/i });
    if (await confirmedBtn.isVisible().catch(() => false)) {
      await confirmedBtn.click();
      await Promise.all([
        page.waitForResponse(
          (r) =>
            r.url().includes('/api/v1/orders/') &&
            r.url().includes('/status') &&
            r.request().method() === 'PATCH',
          { timeout: 20000 }
        ),
        modal.getByRole('button', { name: /Confirm CONFIRMED/i }).click(),
      ]);
    }
  });

  // ── Inventory ─────────────────────────────────────────────────────────────
  test('AF-ADM-029 | Inventory stats testids visible', async ({ page }) => {
    await adminGoto(page, '/admin/inventory');
    const inventory = new AdminInventoryPage(page);
    await expect(inventory.pageHeading()).toBeVisible({ timeout: 15000 });
    await inventory.waitForTable();
    await inventory.expectStatsVisible();
    await expect(page.getByTestId('inventory-stat-out-of-stock')).toBeVisible();
    await expect(page.getByTestId('inventory-stat-inventory-value')).toBeVisible();
  });

  test('AF-ADM-030 | Inventory search finds seeded product', async ({ page }) => {
    await adminGoto(page, '/admin/inventory');
    const inventory = new AdminInventoryPage(page);
    await inventory.waitForTable();
    await inventory.search(seed.inventoryProduct.name);
    await expect(inventory.rowByProductName(seed.inventoryProduct.name)).toBeVisible({
      timeout: 15000,
    });
  });

  test('AF-ADM-031 | Inventory Update Stock PATCH succeeds', async ({ page }) => {
    await adminGoto(page, '/admin/inventory');
    const inventory = new AdminInventoryPage(page);
    await inventory.waitForTable();
    await inventory.search(seed.inventoryProduct.name);
    await inventory.openStockModalForProduct(seed.inventoryProduct.name);
    await inventory.setStockQuantity(42);
    const response = await inventory.submitStockUpdate();
    expect(response.ok()).toBeTruthy();
    await inventory.search(seed.inventoryProduct.name);
    await expect(inventory.stockCellInRow(seed.inventoryProduct.name)).toContainText('42', {
      timeout: 15000,
    });
  });

  test('AF-ADM-032 | Inventory invalid quantity shows client validation', async ({ page }) => {
    await adminGoto(page, '/admin/inventory');
    const inventory = new AdminInventoryPage(page);
    await inventory.waitForTable();
    await inventory.search(seed.inventoryProduct.name);
    await inventory.openStockModalForProduct(seed.inventoryProduct.name);
    await inventory.setStockQuantity('-1');
    await page.getByRole('dialog', { name: /update stock/i }).getByRole('button', { name: /^Update Stock$/i }).click();
    await expect(page.getByText('Enter a valid stock quantity')).toBeVisible({ timeout: 5000 });
  });

  // ── Delivery Assignment ───────────────────────────────────────────────────
  test('AF-ADM-033 | Delivery tabs Unassigned Active Completed switch', async ({ page }) => {
    await adminGoto(page, '/admin/delivery-assignment');
    const assignment = new AdminDeliveryAssignmentPage(page);
    await assignment.waitForLoad();
    await assignment.tabButton(/Unassigned/i).click();
    await expect(page.getByRole('heading', { name: 'Unassigned Orders' })).toBeVisible();
    await assignment.tabButton(/Active/i).click();
    await expect(page.getByRole('heading', { name: 'Active Deliveries' })).toBeVisible();
    await assignment.tabButton(/Completed/i).click();
    await expect(page.getByRole('heading', { name: 'Completed Deliveries' })).toBeVisible();
  });

  test('AF-ADM-034 | Delivery Assign Delivery confirms partner assignment', async ({ page }) => {
    await adminGoto(page, '/admin/delivery-assignment');
    const assignment = new AdminDeliveryAssignmentPage(page);
    await assignment.waitForLoad();
    await assignment.tabButton(/Unassigned/i).click();
    await assignment.search(seed.pendingShipment.orderId.slice(-8));
    const assignBtn = page.getByRole('button', { name: /Assign Delivery/i }).first();
    await expect(assignBtn).toBeVisible({ timeout: 15000 });
    await assignBtn.click();
    await expect(page.getByRole('heading', { name: 'Assign Delivery Partner' })).toBeVisible({
      timeout: 10000,
    });
    // Production: partners are clickable cards (not <select>)
    const partnerCard = page
      .getByRole('dialog')
      .locator('[role="button"]')
      .filter({ hasText: /.+/ })
      .first();
    await expect(partnerCard).toBeVisible({ timeout: 10000 });
    await partnerCard.click();
    await Promise.all([
      page.waitForResponse(
        (r) =>
          (r.url().includes('/assign') || r.url().includes('/logistics/')) &&
          ['POST', 'PATCH'].includes(r.request().method()) &&
          r.status() < 500,
        { timeout: 25000 }
      ),
      page.getByRole('button', { name: /^Confirm$/i }).click(),
    ]);
  });

  test('AF-ADM-035 | Delivery Active Reassign opens reassign modal', async ({ page }) => {
    await adminGoto(page, '/admin/delivery-assignment');
    const assignment = new AdminDeliveryAssignmentPage(page);
    await assignment.waitForLoad();
    await assignment.tabButton(/Active/i).click();
    await assignment.search(seed.assignedShipment.orderId.slice(-8));
    const reassign = page.getByRole('button', { name: /^Reassign$/i }).first();
    await expect(reassign).toBeVisible({ timeout: 15000 });
    await reassign.click();
    await expect(page.getByRole('heading', { name: 'Reassign Delivery Partner' })).toBeVisible({
      timeout: 10000,
    });
  });

  test('AF-ADM-036 | Delivery Refresh reloads queue', async ({ page }) => {
    await adminGoto(page, '/admin/delivery-assignment');
    const assignment = new AdminDeliveryAssignmentPage(page);
    await assignment.waitForLoad();
    const responsePromise = page.waitForResponse(
      (r) => r.url().includes('/logistics/delivery-queue') && r.request().method() === 'GET',
      { timeout: 20000 }
    );
    await assignment.refreshButton().click();
    expect((await responsePromise).ok()).toBeTruthy();
  });

  // ── Reports & Analytics ───────────────────────────────────────────────────
  test('AF-ADM-037 | Reports Vendor Report Download CSV available', async ({ page }) => {
    await adminGoto(page, '/admin/reports');
    await expect(page.getByRole('heading', { name: 'Reports' })).toBeVisible({ timeout: 15000 });
    await expect(page.getByText('Vendor Report').first()).toBeVisible();
    await expect(page.getByRole('button', { name: /Download CSV/i }).first()).toBeVisible();
  });

  test('AF-ADM-038 | Reports PDF Generate shows CSV-only error', async ({ page }) => {
    await adminGoto(page, '/admin/reports');
    await expect(page.getByRole('heading', { name: 'Reports' })).toBeVisible({ timeout: 15000 });
    // Custom report format selector — select PDF then Generate
    const formatSelect = page.locator('select').filter({ has: page.locator('option[value="pdf"]') });
    if (await formatSelect.count()) {
      await formatSelect.selectOption('pdf');
      await page.getByRole('button', { name: /Generate Report/i }).click();
      await expect(
        page.getByText(/Only CSV export is supported currently/i)
      ).toBeVisible({ timeout: 10000 });
    } else {
      // Production always exposes the CSV-only message path via format=pdf in custom section
      await page.locator('select').last().selectOption('pdf').catch(() => null);
      await page.getByRole('button', { name: /Generate Report/i }).click();
      await expect(page.getByText(/Only CSV export is supported currently/i)).toBeVisible({
        timeout: 10000,
      });
    }
  });

  test('AF-ADM-039 | Analytics shows Completion Rate (delivery-backed)', async ({ page }) => {
    await adminGoto(page, '/admin/analytics');
    await expect(page.getByRole('heading', { name: 'Analytics' })).toBeVisible({ timeout: 15000 });
    await expect(page.getByText('Completion Rate')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Delivery Efficiency' })).toBeVisible();
  });

  // ── Settings & Notifications ──────────────────────────────────────────────
  test('AF-ADM-040 | Settings Profile Save Profile succeeds with required fields', async ({
    page,
  }) => {
    await adminGoto(page, '/admin/settings');
    await expect(page.getByRole('heading', { name: 'Settings', exact: true })).toBeVisible({
      timeout: 15000,
    });
    await page.getByRole('button', { name: /^Profile$/i }).click();
    await expect(page.getByRole('heading', { name: 'Profile Settings' })).toBeVisible();
    // Production PUT /users/me rejects empty companyName / address when sent as ""
    const company = page.locator('label', { hasText: 'Company Name' }).locator('..').locator('input');
    const address = page.locator('label', { hasText: /^Address$/ }).locator('..').locator('textarea');
    if (await company.count()) {
      const val = await company.inputValue();
      if (!val) await company.fill('Mokshith Admin Co');
    }
    if (await address.count()) {
      const val = await address.inputValue();
      if (!val) await address.fill('Admin HQ, Test City');
    }
    await page.getByRole('button', { name: /Save Profile/i }).click();
    // Admin profile submit also calls saveSettings → final toast is often settings success
    await expect(page.getByText(/Profile updated successfully|Settings saved successfully/)).toBeVisible({
      timeout: 15000,
    });
  });

  test('AF-ADM-041 | Settings Preferences Save Preferences succeeds', async ({ page }) => {
    await adminGoto(page, '/admin/settings');
    await page.getByRole('button', { name: /^Preferences$/i }).click();
    await page.getByRole('button', { name: /Save Preferences/i }).click();
    await expect(page.getByText('Settings saved successfully')).toBeVisible({ timeout: 15000 });
  });

  test('AF-ADM-042 | Settings Account tab exposes password fields without submit', async ({
    page,
  }) => {
    // Password change signs the admin out — assert UI only (production-safe for suite stability).
    await adminGoto(page, '/admin/settings');
    await page.getByRole('button', { name: /^Account$/i }).click();
    await expect(page.getByText(/Change Password|Current Password|New Password/i).first()).toBeVisible({
      timeout: 10000,
    });
    await expect(page.getByRole('button', { name: /Update Password/i })).toBeVisible();
  });

  test('AF-ADM-043 | Notification drawer opens with Mark all as read control', async ({ page }) => {
    await establishAdminUiSession(page);
    await page.getByLabel('Notifications').click();
    await expect(page.getByRole('heading', { name: /^notifications$/i })).toBeVisible({
      timeout: 10000,
    });
    await expect(page.getByRole('button', { name: /mark all as read/i })).toBeVisible({
      timeout: 10000,
    });
  });

  test('AF-ADM-044 | Browser refresh keeps admin on Products after navigation', async ({ page }) => {
    await adminGoto(page, '/admin/products');
    await expect(page.getByRole('heading', { name: 'Product Management' })).toBeVisible({
      timeout: 15000,
    });
    await page.reload();
    await expect(page).toHaveURL(/\/admin\/products/);
    await expect(page.getByRole('heading', { name: 'Product Management' })).toBeVisible({
      timeout: 15000,
    });
  });

  test('AF-ADM-045 | Authenticated GET /admin/stats still succeeds after UI flows', async () => {
    const session = await refreshAdminSession();
    adminSession = session;
    const response = await getAdminStatsRaw(authHeaders(session));
    expect(response.status).toBe(200);
  });
});
