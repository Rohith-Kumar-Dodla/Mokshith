/**
 * Super Admin Functional Certification helpers (SF-SA).
 * Does not modify locked SS-SA / Admin / Notifications / Logistics / Payments / Inventory suites.
 */
import { expect, type Page } from '@playwright/test';
import { apiClient } from './apiClient';
import {
  authHeaders,
  loginApi,
  loginApiFresh,
  type ApiSession,
} from './auth.api.helper';
import { addToCartApi, clearCartApi } from './cart.api.helper';
import { clearValidationRateLimits } from './cart.validation.helper';
import {
  createProductApi,
  getAdminSession,
  getFirstCategoryId,
  resolveRefId,
} from './product.api.helper';
import {
  getSuperAdminCredentials,
  getVendorCredentials,
  uniqueProductName,
} from './product.credentials';
import { placeCodOrderApi, resolveOrderId } from './order.functional.helper';
import {
  placeBankTransferOrderApi,
  uploadPaymentProofRaw,
  unwrapProofId,
} from './payment.functional.helper';
import {
  establishSuperAdminUiSession,
  getSuperAdminStatsRaw,
  messageOf,
  refreshSuperAdminApiSession,
  unwrapData,
} from './superadmin.smoke.helper';
import { registerPendingVendor, approveUserApi } from './admin.functional.helper';

export type SuperAdminFunctionalSeed = {
  categoryId: string;
  product: { id: string; name: string };
  orderId: string;
  /** User Approvals tab — approve via admin-approvals */
  approvalApprove: { id: string; name: string; mobile: string };
  /** User Approvals tab — reject via admin-approvals */
  approvalReject: { id: string; name: string; mobile: string };
  /** Vendor Management tab */
  vendorApprove: { id: string; name: string };
  vendorReject: { id: string; name: string };
  vendorSuspend: { id: string; name: string };
  /** Disposable admin for deactivate/activate (never the seeded QA admin) */
  disposableAdmin: { id: string; name: string; email: string; mobile: string };
  /** Disposable delivery partner for deactivate/activate */
  disposablePartner: { id: string; name: string };
  /** Bank transfer proofs */
  approveProof: { id: string; orderId: string; utr: string };
  rejectProof: { id: string; orderId: string; utr: string };
};

function uniqueMobile(): string {
  const suffix = String(Date.now()).slice(-8);
  return `92${suffix}`.slice(0, 10);
}

function uniqueEmail(prefix: string): string {
  return `${prefix}.${Date.now()}.${Math.random().toString(36).slice(2, 6)}@example.com`;
}

function uniqueUtr(prefix: string): string {
  return `${prefix}${Date.now()}${Math.floor(Math.random() * 1000)}`.slice(0, 22);
}

export async function registerPendingUser(
  label: string,
  role: 'VENDOR' | 'ADMIN' | 'DELIVERY_PARTNER' = 'VENDOR'
): Promise<{ id: string; name: string; mobile: string; email: string }> {
  const mobile = uniqueMobile();
  const email = uniqueEmail(label);
  const name = `SF SA ${label} ${Date.now().toString(36).slice(-4)}`;
  const response = await apiClient.post(
    '/auth/register',
    {
      name,
      email,
      mobile,
      password: 'Qx7#mLp2!sRw9',
      role,
    },
    { validateStatus: () => true }
  );
  if (response.status !== 201 && response.status !== 200) {
    throw new Error(
      `Register pending ${role} failed (${response.status}): ${messageOf(response.data)}`
    );
  }
  const data = unwrapData(response.data) as {
    _id?: string;
    id?: string;
    user?: { _id?: string; id?: string };
  };
  const id = String(data.user?._id || data.user?.id || data._id || data.id || '');
  if (!id) {
    throw new Error(`Register succeeded but no user id: ${JSON.stringify(response.data)}`);
  }
  return { id, name, mobile, email };
}

export async function createDisposableAdminApi(
  saSession: ApiSession,
  label: string
): Promise<{ id: string; name: string; email: string; mobile: string }> {
  const mobile = uniqueMobile();
  const email = uniqueEmail(label);
  const name = `SF SA Admin ${label} ${Date.now().toString(36).slice(-4)}`;
  const response = await apiClient.post(
    '/super-admin/admins',
    {
      name,
      email,
      mobile,
      password: 'Qx7#mLp2!sRw9',
    },
    { headers: authHeaders(saSession), validateStatus: () => true }
  );
  if (response.status !== 201 && response.status !== 200) {
    throw new Error(
      `Create disposable admin failed (${response.status}): ${messageOf(response.data)}`
    );
  }
  const data = unwrapData(response.data) as { _id?: string; id?: string };
  const id = String(data._id || data.id || '');
  if (!id) {
    throw new Error(`Create admin succeeded but no id: ${JSON.stringify(response.data)}`);
  }
  return { id, name, email, mobile };
}

export async function seedBankTransferProof(
  vendorSession: ApiSession,
  productId: string,
  label: string
): Promise<{ id: string; orderId: string; utr: string }> {
  await clearCartApi(vendorSession);
  await addToCartApi(vendorSession, productId, 1);
  const order = await placeBankTransferOrderApi(vendorSession, {
    idempotencyKey: `sf-sa-bank-${label}-${Date.now()}`,
  });
  const orderId = resolveOrderId(order);
  const utr = uniqueUtr(`SF${label}`);
  const upload = await uploadPaymentProofRaw(vendorSession, {
    orderId,
    utrNumber: utr,
  });
  if (upload.status !== 200 && upload.status !== 201) {
    throw new Error(
      `Upload proof failed (${upload.status}): ${messageOf(upload.body)}`
    );
  }
  const id = unwrapProofId(upload.body);
  if (!id) {
    throw new Error(`Upload succeeded but no proof id: ${JSON.stringify(upload.body)}`);
  }
  return { id, orderId, utr };
}

/** Open User Management and switch to a production tab. */
export async function openUserManagementTab(
  page: Page,
  tab: RegExp
): Promise<void> {
  await page.goto('/super-admin/user-management');
  await expect(page.getByRole('heading', { name: 'User Management' })).toBeVisible({
    timeout: 15000,
  });
  await page.getByRole('button', { name: tab }).first().click();
}

export async function saGoto(page: Page, path: string): Promise<void> {
  await establishSuperAdminUiSession(page);
  await page.goto(path);
}

export async function seedSuperAdminFunctionalData(): Promise<{
  saSession: ApiSession;
  vendorSession: ApiSession;
  seed: SuperAdminFunctionalSeed;
}> {
  clearValidationRateLimits();
  const saSession = await refreshSuperAdminApiSession();
  const adminSession = await getAdminSession();
  const vendorCreds = getVendorCredentials(1);
  const vendorSession = await loginApi(vendorCreds.mobile, vendorCreds.password);

  const categoryId = await getFirstCategoryId(adminSession);
  const productName = uniqueProductName('sf-sa-prod');
  const productRaw = await createProductApi(adminSession, {
    name: productName,
    description: 'Super Admin functional product',
    price: 175,
    stock: 80,
    categoryId,
    moq: 1,
    isActive: true,
  });
  const productId = String(resolveRefId(productRaw as { _id?: string; id?: string }) || '');

  await clearCartApi(vendorSession);
  await addToCartApi(vendorSession, productId, 1);
  const order = await placeCodOrderApi(vendorSession, {
    idempotencyKey: `sf-sa-order-${Date.now()}`,
  });
  const orderId = resolveOrderId(order);

  const approvalApprove = await registerPendingUser('appr', 'VENDOR');
  const approvalReject = await registerPendingUser('rej', 'VENDOR');

  const vendorApprove = await registerPendingVendor('sf-v-appr');
  const vendorReject = await registerPendingVendor('sf-v-rej');
  const vendorSuspend = await registerPendingVendor('sf-v-sus');
  await approveUserApi(adminSession, vendorSuspend.id);

  const disposableAdmin = await createDisposableAdminApi(saSession, 'disp');

  const disposablePartnerRaw = await registerPendingUser('dp', 'DELIVERY_PARTNER');
  await approveUserApi(adminSession, disposablePartnerRaw.id);

  const bankProductName = uniqueProductName('sf-sa-bank');
  const bankProductRaw = await createProductApi(adminSession, {
    name: bankProductName,
    description: 'SA bank transfer product',
    price: 120,
    stock: 60,
    categoryId,
    moq: 1,
    isActive: true,
  });
  const bankProductId = String(
    resolveRefId(bankProductRaw as { _id?: string; id?: string }) || ''
  );
  const approveProof = await seedBankTransferProof(vendorSession, bankProductId, 'ap');
  const rejectProof = await seedBankTransferProof(vendorSession, bankProductId, 'rj');

  return {
    saSession,
    vendorSession,
    seed: {
      categoryId,
      product: { id: productId, name: productName },
      orderId,
      approvalApprove,
      approvalReject,
      vendorApprove: { id: vendorApprove.id, name: vendorApprove.name },
      vendorReject: { id: vendorReject.id, name: vendorReject.name },
      vendorSuspend: { id: vendorSuspend.id, name: vendorSuspend.name },
      disposableAdmin,
      disposablePartner: {
        id: disposablePartnerRaw.id,
        name: disposablePartnerRaw.name,
      },
      approveProof,
      rejectProof,
    },
  };
}

export {
  authHeaders,
  clearValidationRateLimits,
  establishSuperAdminUiSession,
  getSuperAdminStatsRaw,
  loginApiFresh,
  messageOf,
  refreshSuperAdminApiSession,
  unwrapData,
};
