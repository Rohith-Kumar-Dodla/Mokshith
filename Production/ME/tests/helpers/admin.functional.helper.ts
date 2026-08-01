/**
 * Admin Functional Certification helpers (AF-ADM).
 * Seeds disposable fixtures — never mutates locked suite seeds permanently where avoidable.
 */
import { apiClient } from './apiClient';
import {
  authHeaders,
  loginApi,
  loginApiFresh,
  type ApiSession,
} from './auth.api.helper';
import {
  createProductApi,
  getAdminSession,
  getFirstCategoryId,
  resolveRefId,
} from './product.api.helper';
import {
  getAdminCredentials,
  getDeliveryCredentials,
  getVendorCredentials,
  uniqueProductName,
} from './product.credentials';
import { clearValidationRateLimits } from './cart.validation.helper';
import { addToCartApi, clearCartApi } from './cart.api.helper';
import {
  placeCodOrderApi,
  resolveOrderId,
} from './order.functional.helper';
import {
  createPendingShipment,
  createAssignedShipment,
  partnerIdFromSession,
} from './logistics.functional.helper';
import { setInventoryStockApi, findInventoryRowForProduct } from './inventory.smoke.helper';
import {
  establishAdminUiSession,
  getAdminStatsRaw,
  messageOf,
  unwrapData,
} from './admin.smoke.helper';
import { expect, type Page } from '@playwright/test';

export type AdminFunctionalSeed = {
  categoryId: string;
  product: { id: string; name: string; price: number; stock: number };
  inventoryProduct: { id: string; name: string; stock: number };
  orderId: string;
  pendingVendor: { id: string; name: string; mobile: string; email: string };
  rejectVendor: { id: string; name: string; mobile: string };
  suspendVendor: { id: string; name: string; mobile: string };
  pendingShipment: { orderId: string; shipmentId: string };
  assignedShipment: { orderId: string; shipmentId: string; deliveryPartnerId: string };
};

function uniqueMobile(): string {
  // 10-digit QA range numbers in 91xxxxxxxx range (avoid colliding with seeded 9000...)
  const suffix = String(Date.now()).slice(-8);
  return `91${suffix}`.slice(0, 10);
}

function uniqueEmail(prefix: string): string {
  return `${prefix}.${Date.now()}.${Math.random().toString(36).slice(2, 6)}@example.com`;
}

export async function registerPendingVendor(
  label: string
): Promise<{ id: string; name: string; mobile: string; email: string }> {
  const mobile = uniqueMobile();
  const email = uniqueEmail(label);
  const name = `AF Partner ${label} ${Date.now().toString(36).slice(-4)}`;
  const response = await apiClient.post(
    '/auth/register',
    {
      name,
      email,
      mobile,
      // Meets AUTH_STRICT password policy (no name fragments, no sequences)
      password: 'Qx7#mLp2!sRw9',
      role: 'VENDOR',
    },
    { validateStatus: () => true }
  );
  if (response.status !== 201 && response.status !== 200) {
    throw new Error(`Register pending vendor failed (${response.status}): ${messageOf(response.data)}`);
  }
  const data = unwrapData(response.data) as {
    _id?: string;
    id?: string;
    user?: { _id?: string; id?: string };
  };
  const id = String(
    data.user?._id || data.user?.id || data._id || data.id || ''
  );
  if (!id) {
    throw new Error(`Register succeeded but no user id: ${JSON.stringify(response.data)}`);
  }
  return { id, name, mobile, email };
}

export async function approveUserApi(session: ApiSession, userId: string) {
  const response = await apiClient.post(`/admin/approve/${userId}`, {}, {
    headers: authHeaders(session),
    validateStatus: () => true,
  });
  if (response.status !== 200) {
    throw new Error(`Approve failed (${response.status}): ${messageOf(response.data)}`);
  }
  return unwrapData(response.data);
}

export async function postCategoryApi(
  session: ApiSession,
  payload: { name: string; description?: string; isActive?: boolean }
) {
  const response = await apiClient.post('/categories', payload, {
    headers: authHeaders(session),
    validateStatus: () => true,
  });
  if (response.status !== 200 && response.status !== 201) {
    throw new Error(`Create category failed (${response.status}): ${messageOf(response.data)}`);
  }
  return unwrapData(response.data);
}

export async function deleteCategoryApi(session: ApiSession, categoryId: string) {
  return apiClient.delete(`/categories/${categoryId}`, {
    headers: authHeaders(session),
    validateStatus: () => true,
  });
}

export async function seedAdminFunctionalData(): Promise<{
  adminSession: ApiSession;
  vendorSession: ApiSession;
  deliverySession: ApiSession;
  seed: AdminFunctionalSeed;
}> {
  clearValidationRateLimits();
  const adminSession = await getAdminSession();
  const vendorCreds = getVendorCredentials(1);
  const vendorSession = await loginApi(vendorCreds.mobile, vendorCreds.password);
  const deliveryCreds = getDeliveryCredentials(1);
  const deliverySession = await loginApi(deliveryCreds.mobile, deliveryCreds.password);
  const deliveryPartnerId = partnerIdFromSession(deliverySession);

  const categoryId = await getFirstCategoryId(adminSession);

  const productName = uniqueProductName('af-adm-prod');
  const productRaw = await createProductApi(adminSession, {
    name: productName,
    description: 'Admin functional product',
    price: 150,
    stock: 80,
    categoryId,
    moq: 1,
    isActive: true,
  });
  const productId = String(resolveRefId(productRaw as { _id?: string; id?: string }) || '');

  const invName = uniqueProductName('af-adm-inv');
  const invRaw = await createProductApi(adminSession, {
    name: invName,
    description: 'Admin functional inventory product',
    price: 99,
    stock: 25,
    categoryId,
    moq: 1,
    isActive: true,
  });
  const invId = String(resolveRefId(invRaw as { _id?: string; id?: string }) || '');
  const invRow = await findInventoryRowForProduct(adminSession, invId);
  if (invRow) {
    await setInventoryStockApi(adminSession, { id: invId, warehouseId: invRow.warehouseId }, 25);
  }

  await clearCartApi(vendorSession);
  await addToCartApi(vendorSession, productId, 1);
  const order = await placeCodOrderApi(vendorSession, {
    idempotencyKey: `af-adm-order-${Date.now()}`,
  });
  const orderId = resolveOrderId(order);

  const pendingVendor = await registerPendingVendor('approve');
  const rejectVendor = await registerPendingVendor('reject');
  const suspendVendor = await registerPendingVendor('suspend');
  await approveUserApi(adminSession, suspendVendor.id);

  const pendingShipment = await createPendingShipment(
    adminSession,
    vendorSession,
    productId,
    'af-adm-pend'
  );
  const assignedShipment = await createAssignedShipment(
    adminSession,
    vendorSession,
    productId,
    deliveryPartnerId,
    'af-adm-asgn'
  );

  return {
    adminSession,
    vendorSession,
    deliverySession,
    seed: {
      categoryId,
      product: { id: productId, name: productName, price: 150, stock: 80 },
      inventoryProduct: { id: invId, name: invName, stock: 25 },
      orderId,
      pendingVendor,
      rejectVendor,
      suspendVendor,
      pendingShipment: {
        orderId: pendingShipment.orderId,
        shipmentId: pendingShipment.shipmentId,
      },
      assignedShipment: {
        orderId: assignedShipment.orderId,
        shipmentId: assignedShipment.shipmentId,
        deliveryPartnerId,
      },
    },
  };
}

export async function refreshAdminSession(): Promise<ApiSession> {
  const { mobile, password } = getAdminCredentials();
  return loginApiFresh(mobile, password);
}

export {
  authHeaders,
  clearValidationRateLimits,
  establishAdminUiSession,
  getAdminStatsRaw,
  messageOf,
  unwrapData,
  loginApi,
};

/** Navigate Admin UI after session hydrate (dashboard gate). */
export async function adminGoto(page: Page, path: string) {
  await establishAdminUiSession(page);
  await page.goto(path);
}

export async function expectAdminHeading(page: Page, name: string | RegExp) {
  await expect(page.getByRole('heading', { name, exact: typeof name === 'string' })).toBeVisible({
    timeout: 15000,
  });
}
