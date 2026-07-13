import { test, expect } from '../fixtures/product.functional.fixture';
import AdminProductsPage from '../pages/admin/AdminProductsPage';
import VendorProductsPage from '../pages/vendor/VendorProductsPage';
import {
  bearerOnly,
  createProductApi,
  createVendorOwnedProduct,
  deleteProductApi,
  deleteProductRaw,
  expectApiStatus,
  getAdminSession,
  getDeliverySession,
  getFirstCategoryId,
  getProductApi,
  getProductRaw,
  getProductsRaw,
  getSuperAdminSession,
  listProductsApi,
  patchProductStockApi,
  patchProductStatusApi,
  patchStatusRaw,
  patchStockRaw,
  postProductRaw,
  putProductRaw,
  safeDeleteProduct,
  updateProductApi,
} from '../helpers/rbac.api.helper';
import {
  getCustomerCredentials,
  getInactiveVendorCredentials,
  getSuperAdminCredentials,
  getVendorCredentials,
  uniqueProductName,
} from '../helpers/product.credentials';
import { authHeaders, loginApi, loginApiFresh } from '../helpers/auth.api.helper';
import { apiClient } from '../helpers/apiClient';
import { establishSession } from '../helpers/session.functional.helper';
import {
  decodeJwtPayload,
  signEscalatedRoleToken,
  signTestJwt,
  tamperTokenSignature,
} from '../helpers/token.test.helper';

test.describe('PF-PROD Section O | RBAC & Authorization', () => {
  test.describe('A — Frontend Route Protection', () => {
    test('PF-PROD-117 | Vendor blocked from admin products', async ({ page }) => {
      await establishSession(page, 'vendor');
      await page.goto('/admin/products');
      await expect(page).toHaveURL(/\/vendor\/dashboard/);
    });

    test('PF-PROD-118 | Vendor blocked from admin inventory', async ({ page }) => {
      await establishSession(page, 'vendor');
      await page.goto('/admin/inventory');
      await expect(page).toHaveURL(/\/vendor\/dashboard/);
    });

    test('PF-PROD-119 | Vendor blocked from admin categories', async ({ page }) => {
      await establishSession(page, 'vendor');
      await page.goto('/admin/categories');
      await expect(page).toHaveURL(/\/vendor\/dashboard/);
    });

    test('PF-PROD-120 | Unauthenticated blocked from vendor products', async ({ page }) => {
      await page.goto('/vendor/products');
      await expect(page).toHaveURL(/\/login/);
    });

    test('PF-PROD-142 | Admin blocked from vendor products', async ({ page }) => {
      await establishSession(page, 'admin');
      await page.goto('/vendor/products');
      await expect(page).toHaveURL(/\/admin\/dashboard/);
    });

    test('PF-PROD-143 | SuperAdmin blocked from admin products', async ({ page }) => {
      await establishSession(page, 'superadmin');
      await page.goto('/admin/products');
      await expect(page).toHaveURL(/\/super-admin\/dashboard/);
    });

    test('PF-PROD-144 | SuperAdmin blocked from admin inventory', async ({ page }) => {
      await establishSession(page, 'superadmin');
      await page.goto('/admin/inventory');
      await expect(page).toHaveURL(/\/super-admin\/dashboard/);
    });

    test('PF-PROD-145 | Delivery partner blocked from admin products', async ({ page }) => {
      await establishSession(page, 'delivery');
      await page.goto('/admin/products');
      await expect(page).toHaveURL(/\/delivery\/dashboard/);
    });

    test('PF-PROD-146 | Delivery partner blocked from vendor products', async ({ page }) => {
      await establishSession(page, 'delivery');
      await page.goto('/vendor/products');
      await expect(page).toHaveURL(/\/delivery\/dashboard/);
    });

    test('PF-PROD-147 | B2B customer can browse vendor catalog', async ({ page }) => {
      await establishSession(page, 'customer');
      await page.goto('/vendor/products');
      await expect(page).toHaveURL(/\/vendor\/products/);
    });

    test('PF-PROD-148 | Unauthenticated blocked from admin products', async ({ page }) => {
      await page.goto('/admin/products');
      await expect(page).toHaveURL(/\/login/);
    });

    test('PF-PROD-149 | Unauthenticated blocked from admin inventory', async ({ page }) => {
      await page.goto('/admin/inventory');
      await expect(page).toHaveURL(/\/login/);
    });

    test('PF-PROD-150 | Vendor blocked from SuperAdmin portal', async ({ page }) => {
      await establishSession(page, 'vendor');
      await page.goto('/super-admin/dashboard');
      await expect(page).toHaveURL(/\/vendor\/dashboard/);
    });

    test('PF-PROD-151 | Admin blocked from SuperAdmin portal', async ({ page }) => {
      await establishSession(page, 'admin');
      await page.goto('/super-admin/dashboard');
      await expect(page).toHaveURL(/\/admin\/dashboard/);
    });

    test('PF-PROD-210 | B2B customer blocked from admin products', async ({ page }) => {
      await establishSession(page, 'customer');
      await page.goto('/admin/products');
      await expect(page).toHaveURL(/\/vendor\/dashboard/);
    });
  });

  test.describe('B — Hidden UI & Navigation', () => {
    test('PF-PROD-126 | SuperAdmin has no product management UI', async ({ page }) => {
      await establishSession(page, 'superadmin');
      await page.goto('/super-admin/dashboard');
      await expect(page).toHaveURL(/\/super-admin\/dashboard/);
      await expect(page.locator('a[href="/super-admin/products"]')).toHaveCount(0);
    });

    test('PF-PROD-152 | Admin sidebar exposes product management links', async ({ page }) => {
      await establishSession(page, 'admin');
      await page.goto('/admin/dashboard');
      const sidebarNav = page.locator('#admin-sidebar nav');
      await expect(sidebarNav.locator('a[href="/admin/products"]')).toBeVisible();
      await expect(sidebarNav.locator('a[href="/admin/categories"]')).toBeVisible();
      await expect(sidebarNav.locator('a[href="/admin/inventory"]')).toBeVisible();
    });

    test('PF-PROD-153 | Vendor sidebar shows browse-only product nav', async ({ page }) => {
      await establishSession(page, 'vendor');
      await page.goto('/vendor/dashboard');
      await expect(page.locator('a[href="/vendor/products"]')).toBeVisible();
      await expect(page.locator('a[href="/admin/products"]')).toHaveCount(0);
    });

    test('PF-PROD-154 | Vendor portal hides product CRUD controls', async ({ page }) => {
      await establishSession(page, 'vendor');
      const vendorPage = new VendorProductsPage(page);
      await vendorPage.goto();
      await vendorPage.waitForProducts();
      await expect(page.locator('button:has-text("Add Product")')).toHaveCount(0);
      await expect(page.locator('button[title="Edit"]')).toHaveCount(0);
      await expect(page.locator('button[title="Delete"]')).toHaveCount(0);
    });

    test('PF-PROD-155 | Delivery portal has no product navigation', async ({ page }) => {
      await establishSession(page, 'delivery');
      await page.goto('/delivery/dashboard');
      await expect(page.locator('a[href*="/products"]')).toHaveCount(0);
    });

    test('PF-PROD-156 | Admin dashboard exposes Add Product quick action', async ({ page }) => {
      await establishSession(page, 'admin');
      await page.goto('/admin/dashboard');
      await expect(page.locator('text=Add Product').first()).toBeVisible();
    });

    test('PF-PROD-157 | SuperAdmin sidebar excludes product management', async ({ page }) => {
      await establishSession(page, 'superadmin');
      await page.goto('/super-admin/dashboard');
      await expect(page.locator('a[href="/admin/products"]')).toHaveCount(0);
      await expect(page.locator('a[href="/admin/inventory"]')).toHaveCount(0);
      await expect(page.locator('a[href="/admin/categories"]')).toHaveCount(0);
    });

    test('PF-PROD-211 | Admin products page shows unconditional CRUD actions', async ({ page }) => {
      await establishSession(page, 'admin');
      const adminPage = new AdminProductsPage(page);
      await adminPage.goto();
      await adminPage.waitForTable();
      await expect(page.locator('button:has-text("Add Product")')).toBeVisible();
      await expect(page.locator('button[title="Edit"]').first()).toBeVisible();
      await expect(page.locator('button[title="Delete"]').first()).toBeVisible();
    });
  });

  test.describe('C — Admin API Authorization', () => {
    test('PF-PROD-121 | Admin can update any vendor product', async () => {
      const { productId } = await createVendorOwnedProduct(1, { price: 500 });
      try {
        const adminSession = await getAdminSession();
        const updated = await updateProductApi(adminSession, productId, { price: 510 });
        expect(Number(updated.price)).toBe(510);
      } finally {
        await safeDeleteProduct(productId);
      }
    });

    test('PF-PROD-158 | Admin can create products', async () => {
      const adminSession = await getAdminSession();
      const categoryId = await getFirstCategoryId(adminSession);
      const created = await createProductApi(adminSession, {
        name: uniqueProductName('pf-admin-create'),
        price: 100,
        categoryId,
      });
      const productId = String(created._id || created.id);
      expect(productId).toBeTruthy();
      await safeDeleteProduct(productId);
    });

    test('PF-PROD-159 | Admin can delete any vendor product', async () => {
      const { productId } = await createVendorOwnedProduct(1);
      const adminSession = await getAdminSession();
      await deleteProductApi(adminSession, productId);
      await expectApiStatus(() => getProductApi(productId), 404);
    });

    test('PF-PROD-160 | Admin can update stock on any product', async () => {
      const { productId } = await createVendorOwnedProduct(1, { stock: 10 });
      try {
        const adminSession = await getAdminSession();
        const updated = await patchProductStockApi(adminSession, productId, 25);
        expect(Number(updated.stock)).toBe(25);
      } finally {
        await safeDeleteProduct(productId);
      }
    });

    test('PF-PROD-161 | Admin can toggle product active status', async () => {
      const { productId } = await createVendorOwnedProduct(1);
      try {
        const adminSession = await getAdminSession();
        const updated = await patchProductStatusApi(adminSession, productId, false);
        expect(updated.isActive).toBe(false);
      } finally {
        await safeDeleteProduct(productId);
      }
    });

    test('PF-PROD-204 | Admin override via fallback permission on non-owned product', async () => {
      const { productId } = await createVendorOwnedProduct(2, { price: 600 });
      try {
        const adminSession = await getAdminSession();
        const updated = await updateProductApi(adminSession, productId, { price: 605 });
        expect(Number(updated.price)).toBe(605);
      } finally {
        await safeDeleteProduct(productId);
      }
    });
  });

  test.describe('D — SuperAdmin API Authorization', () => {
    test('PF-PROD-162 | SuperAdmin can create products', async () => {
      const session = await getSuperAdminSession();
      const categoryId = await getFirstCategoryId(session);
      const created = await createProductApi(session, {
        name: uniqueProductName('pf-sa-create'),
        price: 110,
        categoryId,
      });
      const productId = String(created._id || created.id);
      await safeDeleteProduct(productId);
      expect(productId).toBeTruthy();
    });

    test('PF-PROD-163 | SuperAdmin can update any product', async () => {
      const { productId } = await createVendorOwnedProduct(1, { price: 700 });
      try {
        const session = await getSuperAdminSession();
        const updated = await updateProductApi(session, productId, { price: 705 });
        expect(Number(updated.price)).toBe(705);
      } finally {
        await safeDeleteProduct(productId);
      }
    });

    test('PF-PROD-164 | SuperAdmin can delete any product', async () => {
      const { productId } = await createVendorOwnedProduct(1);
      const session = await getSuperAdminSession();
      await deleteProductApi(session, productId);
      await expectApiStatus(() => getProductApi(productId), 404);
    });

    test('PF-PROD-165 | SuperAdmin can update stock on any product', async () => {
      const { productId } = await createVendorOwnedProduct(1, { stock: 8 });
      try {
        const session = await getSuperAdminSession();
        const updated = await patchProductStockApi(session, productId, 18);
        expect(Number(updated.stock)).toBe(18);
      } finally {
        await safeDeleteProduct(productId);
      }
    });

    test('PF-PROD-166 | SuperAdmin can toggle product status', async () => {
      const { productId } = await createVendorOwnedProduct(1);
      try {
        const session = await getSuperAdminSession();
        const updated = await patchProductStatusApi(session, productId, false);
        expect(updated.isActive).toBe(false);
      } finally {
        await safeDeleteProduct(productId);
      }
    });

    test('PF-PROD-209 | SuperAdmin bypasses ownership middleware', async () => {
      const { productId } = await createVendorOwnedProduct(2, { price: 800 });
      try {
        const session = await getSuperAdminSession();
        const updated = await updateProductApi(session, productId, { price: 808 });
        expect(Number(updated.price)).toBe(808);
      } finally {
        await safeDeleteProduct(productId);
      }
    });
  });

  test.describe('E — Vendor Ownership', () => {
    test('PF-PROD-123 | Vendor can update own product', async () => {
      const { vendor, productId } = await createVendorOwnedProduct(1, { price: 530 });
      try {
        const updated = await updateProductApi(vendor, productId, { price: 535 });
        expect(Number(updated.price)).toBe(535);
      } finally {
        await safeDeleteProduct(productId);
      }
    });

    test('PF-PROD-122 | Vendor cannot update another vendor product', async () => {
      const { productId } = await createVendorOwnedProduct(1, { price: 520 });
      try {
        const vendor2 = await loginApi(
          getVendorCredentials(2).mobile,
          getVendorCredentials(2).password
        );
        await expectApiStatus(() => updateProductApi(vendor2, productId, { price: 521 }), 403);
      } finally {
        await safeDeleteProduct(productId);
      }
    });

    test('PF-PROD-167 | Vendor can create product via API', async () => {
      const vendor = await loginApi(
        getVendorCredentials(1).mobile,
        getVendorCredentials(1).password
      );
      const categoryId = await getFirstCategoryId(vendor);
      const created = await createProductApi(vendor, {
        name: uniqueProductName('pf-vendor-create'),
        price: 540,
        categoryId,
        vendorId: String(vendor.user._id || vendor.user.id),
      });
      const productId = String(created._id || created.id);
      await safeDeleteProduct(productId);
      expect(productId).toBeTruthy();
    });

    test('PF-PROD-168 | Vendor cannot delete another vendor product', async () => {
      const { productId } = await createVendorOwnedProduct(1);
      try {
        const vendor2 = await loginApi(
          getVendorCredentials(2).mobile,
          getVendorCredentials(2).password
        );
        await expectApiStatus(() => deleteProductApi(vendor2, productId), 403);
      } finally {
        await safeDeleteProduct(productId);
      }
    });

    test('PF-PROD-169 | Vendor can delete own product', async () => {
      const { vendor, productId } = await createVendorOwnedProduct(1);
      await deleteProductApi(vendor, productId);
      await expectApiStatus(() => getProductApi(productId), 404);
    });

    test('PF-PROD-170 | Vendor cannot update stock on another vendor product', async () => {
      const { productId } = await createVendorOwnedProduct(1, { stock: 12 });
      try {
        const vendor2 = await loginApi(
          getVendorCredentials(2).mobile,
          getVendorCredentials(2).password
        );
        await expectApiStatus(() => patchProductStockApi(vendor2, productId, 20), 403);
      } finally {
        await safeDeleteProduct(productId);
      }
    });

    test('PF-PROD-171 | Vendor can update stock on own product', async () => {
      const { vendor, productId } = await createVendorOwnedProduct(1, { stock: 15 });
      try {
        const updated = await patchProductStockApi(vendor, productId, 22);
        expect(Number(updated.stock)).toBe(22);
      } finally {
        await safeDeleteProduct(productId);
      }
    });

    test('PF-PROD-172 | Vendor cannot toggle product status', async () => {
      const { vendor, productId } = await createVendorOwnedProduct(1);
      try {
        await expectApiStatus(() => patchProductStatusApi(vendor, productId, false), 403);
      } finally {
        await safeDeleteProduct(productId);
      }
    });

    test('PF-PROD-173 | Vendor2 cannot delete vendor1 product', async () => {
      const { productId } = await createVendorOwnedProduct(1);
      try {
        const vendor2 = await loginApi(
          getVendorCredentials(2).mobile,
          getVendorCredentials(2).password
        );
        await expectApiStatus(() => deleteProductApi(vendor2, productId), 403);
      } finally {
        await safeDeleteProduct(productId);
      }
    });

    test('PF-PROD-207 | Vendor deletes own product without products:delete permission', async () => {
      const { vendor, productId } = await createVendorOwnedProduct(1);
      await deleteProductApi(vendor, productId);
      await expectApiStatus(() => getProductApi(productId), 404);
    });

    test('PF-PROD-203 | Orphan product blocks vendor but allows admin', async () => {
      const adminSession = await getAdminSession();
      const categoryId = await getFirstCategoryId(adminSession);
      const created = await createProductApi(adminSession, {
        name: uniqueProductName('pf-orphan'),
        price: 450,
        categoryId,
      });
      const productId = String(created._id || created.id);
      try {
        const vendor = await loginApi(
          getVendorCredentials(1).mobile,
          getVendorCredentials(1).password
        );
        await expectApiStatus(() => updateProductApi(vendor, productId, { price: 451 }), 403);
        const updated = await updateProductApi(adminSession, productId, { price: 452 });
        expect(Number(updated.price)).toBe(452);
      } finally {
        await safeDeleteProduct(productId);
      }
    });
  });

  test.describe('F — B2B Customer Authorization', () => {
    test('PF-PROD-124 | B2B customer cannot create product', async () => {
      const customerSession = await loginApi(
        getCustomerCredentials().mobile,
        getCustomerCredentials().password
      );
      const categoryId = await getFirstCategoryId(customerSession);
      await expectApiStatus(
        () =>
          createProductApi(customerSession, {
            name: uniqueProductName('pf-customer-create'),
            price: 100,
            categoryId,
          }),
        403
      );
    });

    test('PF-PROD-174 | B2B customer cannot update products', async () => {
      const { productId } = await createVendorOwnedProduct(1);
      try {
        const customer = await loginApi(
          getCustomerCredentials().mobile,
          getCustomerCredentials().password
        );
        await expectApiStatus(() => updateProductApi(customer, productId, { price: 101 }), 403);
      } finally {
        await safeDeleteProduct(productId);
      }
    });

    test('PF-PROD-175 | B2B customer cannot delete products', async () => {
      const { productId } = await createVendorOwnedProduct(1);
      try {
        const customer = await loginApi(
          getCustomerCredentials().mobile,
          getCustomerCredentials().password
        );
        await expectApiStatus(() => deleteProductApi(customer, productId), 403);
      } finally {
        await safeDeleteProduct(productId);
      }
    });

    test('PF-PROD-176 | B2B customer cannot update stock', async () => {
      const { productId } = await createVendorOwnedProduct(1, { stock: 5 });
      try {
        const customer = await loginApi(
          getCustomerCredentials().mobile,
          getCustomerCredentials().password
        );
        await expectApiStatus(() => patchProductStockApi(customer, productId, 10), 403);
      } finally {
        await safeDeleteProduct(productId);
      }
    });

    test('PF-PROD-177 | B2B customer cannot toggle product status', async () => {
      const { productId } = await createVendorOwnedProduct(1);
      try {
        const customer = await loginApi(
          getCustomerCredentials().mobile,
          getCustomerCredentials().password
        );
        await expectApiStatus(() => patchProductStatusApi(customer, productId, false), 403);
      } finally {
        await safeDeleteProduct(productId);
      }
    });

    test('PF-PROD-178 | B2B customer can read product catalog', async () => {
      const { productId } = await createVendorOwnedProduct(1);
      try {
        const customer = await loginApi(
          getCustomerCredentials().mobile,
          getCustomerCredentials().password
        );
        const list = await listProductsApi({}, customer);
        expect(list).toBeTruthy();
        const detail = await getProductApi(productId);
        expect(String(detail._id || detail.id)).toBe(productId);
      } finally {
        await safeDeleteProduct(productId);
      }
    });

    test('PF-PROD-179 | B2B customer UI blocked from admin product management', async ({ page }) => {
      await establishSession(page, 'customer');
      await page.goto('/admin/products');
      await expect(page).toHaveURL(/\/vendor\/dashboard/);
    });
  });

  test.describe('G — Delivery Partner Authorization', () => {
    test('PF-PROD-180 | Delivery partner cannot create products', async () => {
      const session = await getDeliverySession();
      const categoryId = await getFirstCategoryId(await getAdminSession());
      await expectApiStatus(
        () =>
          createProductApi(session, {
            name: uniqueProductName('pf-delivery-create'),
            price: 100,
            categoryId,
          }),
        403
      );
    });

    test('PF-PROD-181 | Delivery partner cannot update products', async () => {
      const { productId } = await createVendorOwnedProduct(1);
      try {
        const session = await getDeliverySession();
        await expectApiStatus(() => updateProductApi(session, productId, { price: 101 }), 403);
      } finally {
        await safeDeleteProduct(productId);
      }
    });

    test('PF-PROD-182 | Delivery partner cannot delete products', async () => {
      const { productId } = await createVendorOwnedProduct(1);
      try {
        const session = await getDeliverySession();
        await expectApiStatus(() => deleteProductApi(session, productId), 403);
      } finally {
        await safeDeleteProduct(productId);
      }
    });

    test('PF-PROD-183 | Delivery partner cannot update stock', async () => {
      const { productId } = await createVendorOwnedProduct(1, { stock: 5 });
      try {
        const session = await getDeliverySession();
        await expectApiStatus(() => patchProductStockApi(session, productId, 10), 403);
      } finally {
        await safeDeleteProduct(productId);
      }
    });

    test('PF-PROD-184 | Delivery partner cannot toggle product status', async () => {
      const { productId } = await createVendorOwnedProduct(1);
      try {
        const session = await getDeliverySession();
        await expectApiStatus(() => patchProductStatusApi(session, productId, false), 403);
      } finally {
        await safeDeleteProduct(productId);
      }
    });
  });

  test.describe('H — Unauthenticated API Access', () => {
    test('PF-PROD-190 | Product listing is publicly readable', async () => {
      const response = await getProductsRaw();
      expect(response.status).toBe(200);
    });

    test('PF-PROD-191 | Product detail is publicly readable', async () => {
      const { productId } = await createVendorOwnedProduct(1);
      try {
        const response = await getProductRaw(productId);
        expect(response.status).toBe(200);
      } finally {
        await safeDeleteProduct(productId);
      }
    });

    test('PF-PROD-185 | Unauthenticated cannot create products', async () => {
      const categoryId = await getFirstCategoryId(await getAdminSession());
      await expectApiStatus(
        () =>
          postProductRaw({
            name: uniqueProductName('pf-unauth-create'),
            price: 100,
            categoryId,
          }),
        401
      );
    });

    test('PF-PROD-186 | Unauthenticated cannot update products', async () => {
      const { productId } = await createVendorOwnedProduct(1);
      try {
        await expectApiStatus(() => putProductRaw(productId, { price: 101 }), 401);
      } finally {
        await safeDeleteProduct(productId);
      }
    });

    test('PF-PROD-187 | Unauthenticated cannot delete products', async () => {
      const { productId } = await createVendorOwnedProduct(1);
      try {
        await expectApiStatus(() => deleteProductRaw(productId), 401);
      } finally {
        await safeDeleteProduct(productId);
      }
    });

    test('PF-PROD-188 | Unauthenticated cannot update stock', async () => {
      const { productId } = await createVendorOwnedProduct(1, { stock: 5 });
      try {
        await expectApiStatus(() => patchStockRaw(productId, 10), 401);
      } finally {
        await safeDeleteProduct(productId);
      }
    });

    test('PF-PROD-189 | Unauthenticated cannot toggle product status', async () => {
      const { productId } = await createVendorOwnedProduct(1);
      try {
        await expectApiStatus(() => patchStatusRaw(productId, false), 401);
      } finally {
        await safeDeleteProduct(productId);
      }
    });
  });

  test.describe('I — Token Security', () => {
    test('PF-PROD-192 | Expired token rejected', async () => {
      const vendor = await loginApi(
        getVendorCredentials(1).mobile,
        getVendorCredentials(1).password
      );
      const payload = decodeJwtPayload(vendor.accessToken);
      const expiredToken = signTestJwt(
        {
          id: payload.id,
          role: payload.role,
          sessionId: payload.sessionId,
        },
        { expired: true }
      );
      const categoryId = await getFirstCategoryId(await getAdminSession());
      await expectApiStatus(
        () =>
          postProductRaw(
            { name: uniqueProductName('pf-expired'), price: 100, categoryId },
            bearerOnly(expiredToken)
          ),
        401
      );
    });

    test('PF-PROD-193 | Malformed token rejected', async () => {
      const categoryId = await getFirstCategoryId(await getAdminSession());
      await expectApiStatus(
        () =>
          postProductRaw(
            { name: uniqueProductName('pf-bad-jwt'), price: 100, categoryId },
            bearerOnly('not-a-jwt')
          ),
        401
      );
    });

    test('PF-PROD-194 | Tampered token rejected', async () => {
      const admin = await getAdminSession();
      const tampered = tamperTokenSignature(admin.accessToken);
      const categoryId = await getFirstCategoryId(admin);
      await expectApiStatus(
        () =>
          postProductRaw(
            { name: uniqueProductName('pf-tampered'), price: 100, categoryId },
            bearerOnly(tampered)
          ),
        401
      );
    });

    test('PF-PROD-195 | Literal null token rejected', async () => {
      const categoryId = await getFirstCategoryId(await getAdminSession());
      await expectApiStatus(
        () =>
          postProductRaw(
            { name: uniqueProductName('pf-null-token'), price: 100, categoryId },
            bearerOnly('null')
          ),
        401
      );
    });

    test('PF-PROD-196 | Missing token rejected', async () => {
      const categoryId = await getFirstCategoryId(await getAdminSession());
      await expectApiStatus(
        () =>
          postProductRaw({
            name: uniqueProductName('pf-no-token'),
            price: 100,
            categoryId,
          }),
        401
      );
    });

    test('PF-PROD-197 | Session replacement invalidates prior token', async () => {
      const creds = getVendorCredentials(1);
      const first = await loginApiFresh(creds.mobile, creds.password);
      const second = await loginApiFresh(creds.mobile, creds.password);
      expect(second.accessToken).not.toBe(first.accessToken);
      const categoryId = await getFirstCategoryId(await getAdminSession());
      await expectApiStatus(
        () =>
          postProductRaw(
            { name: uniqueProductName('pf-session-replaced'), price: 100, categoryId },
            bearerOnly(first.accessToken)
          ),
        401
      );
    });

    test('PF-PROD-206 | Escalated JWT role claim does not bypass DB role', async () => {
      const vendor = await loginApi(
        getVendorCredentials(1).mobile,
        getVendorCredentials(1).password
      );
      const escalated = signEscalatedRoleToken(vendor.accessToken, 'ADMIN');
      const { productId } = await createVendorOwnedProduct(1);
      try {
        await expectApiStatus(() => patchStatusRaw(productId, false, bearerOnly(escalated)), 403);
      } finally {
        await safeDeleteProduct(productId);
      }
    });
  });

  test.describe('J — CSRF Protection', () => {
    test('PF-PROD-125 | CSRF required on product create', async () => {
      const session = await getAdminSession();
      const categoryId = await getFirstCategoryId(session);
      await expectApiStatus(
        () =>
          apiClient.post(
            '/products',
            { name: uniqueProductName('pf-no-csrf'), price: 100, categoryId },
            { headers: { Authorization: `Bearer ${session.accessToken}` } }
          ),
        403
      );
    });

    test('PF-PROD-198 | CSRF required on product update', async () => {
      const { productId } = await createVendorOwnedProduct(1);
      try {
        const session = await getAdminSession();
        await expectApiStatus(
          () =>
            apiClient.put(
              `/products/${productId}`,
              { price: 501 },
              { headers: { Authorization: `Bearer ${session.accessToken}` } }
            ),
          403
        );
      } finally {
        await safeDeleteProduct(productId);
      }
    });

    test('PF-PROD-199 | CSRF required on product delete', async () => {
      const { productId } = await createVendorOwnedProduct(1);
      try {
        const session = await getAdminSession();
        await expectApiStatus(
          () =>
            apiClient.delete(`/products/${productId}`, {
              headers: { Authorization: `Bearer ${session.accessToken}` },
            }),
          403
        );
      } finally {
        await safeDeleteProduct(productId);
      }
    });

    test('PF-PROD-200 | CSRF required on stock update', async () => {
      const { productId } = await createVendorOwnedProduct(1, { stock: 5 });
      try {
        const session = await getAdminSession();
        await expectApiStatus(
          () =>
            apiClient.patch(
              `/products/${productId}/stock`,
              { stock: 10 },
              { headers: { Authorization: `Bearer ${session.accessToken}` } }
            ),
          403
        );
      } finally {
        await safeDeleteProduct(productId);
      }
    });

    test('PF-PROD-201 | Status patch CSRF behavior per implementation', async () => {
      const { productId } = await createVendorOwnedProduct(1);
      try {
        const session = await getAdminSession();
        const response = await apiClient.patch(
          `/products/${productId}/status`,
          { isActive: false },
          { headers: { Authorization: `Bearer ${session.accessToken}` } }
        );
        expect(response.status).toBe(200);
      } finally {
        await safeDeleteProduct(productId);
      }
    });
  });

  test.describe('K — Permission Inheritance', () => {
    test('PF-PROD-208 | SuperAdmin bypasses requirePermission on create', async () => {
      const session = await getSuperAdminSession();
      const categoryId = await getFirstCategoryId(session);
      const created = await createProductApi(session, {
        name: uniqueProductName('pf-sa-bypass'),
        price: 120,
        categoryId,
      });
      const productId = String(created._id || created.id);
      await safeDeleteProduct(productId);
      expect(productId).toBeTruthy();
    });

    test('PF-PROD-202 | Inactive account cannot mutate products', async () => {
      const creds = getInactiveVendorCredentials();
      await expect(loginApiFresh(creds.mobile, creds.password)).rejects.toMatchObject({
        response: { status: 403 },
      });

      const adminSession = await getAdminSession();
      const usersResponse = await apiClient.get('/users', {
        params: { search: creds.mobile },
        headers: authHeaders(adminSession),
      });
      const body = usersResponse.data?.data ?? usersResponse.data ?? {};
      const users = Array.isArray(body) ? body : body.users ?? [];
      const inactiveUser = users.find(
        (user: { mobile?: string }) => String(user.mobile) === creds.mobile
      );
      expect(inactiveUser).toBeTruthy();
      const userId = String(inactiveUser._id || inactiveUser.id);

      const inactiveToken = signTestJwt({ id: userId, role: 'VENDOR' });
      const categoryId = await getFirstCategoryId(adminSession);
      await expectApiStatus(
        () =>
          postProductRaw(
            { name: uniqueProductName('pf-inactive'), price: 100, categoryId },
            bearerOnly(inactiveToken)
          ),
        403
      );
    });
  });
});
