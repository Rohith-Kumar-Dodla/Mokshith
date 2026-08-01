import fs from 'fs';
import path from 'path';
import { apiClient } from './apiClient';
import { authHeaders, loginApiFresh, type ApiSession } from './auth.api.helper';
import {
  createProductApi,
  getAdminSession,
  getFirstCategoryId,
} from './product.api.helper';
import {
  getSuperAdminCredentials,
  getVendorCredentials,
  uniqueProductName,
} from './product.credentials';
import { addToCartApi, clearCartApi } from './cart.api.helper';
import { clearValidationRateLimits } from './cart.validation.helper';
import {
  placeBankTransferOrderApi,
  placeCodOrderApi,
  placeOnlineOrderApi,
  resolveOrderId,
  MINI_PNG,
  messageOf,
  postPaymentsCreateOrderRaw,
  postPaymentsFailRaw,
  postPaymentsInitiateRaw,
  postPaymentsRefundRaw,
  postPaymentsVerifyRaw,
  postPaymentsWebhookRawFetch,
  getBankDetailsRaw,
  getRefundHistoryRaw,
  getPendingPaymentProofsRaw,
  approvePaymentProofRaw,
  rejectPaymentProofRaw,
  uploadPaymentProofRaw,
  getOrderByIdApi,
  probeServerWebhookConfigured,
  getRazorpayWebhookSecret,
  signWebhookBody,
} from './payment.functional.helper';

export type PaymentsAuthorizationSeed = {
  productId: string;
  productName: string;
  vendor1OnlineOrderId: string;
  vendor1BankOrderId: string;
  vendor1CodOrderId: string;
  vendor2OnlineOrderId: string;
  webhookConfigured: boolean;
};

export async function seedPaymentsAuthorizationData(
  vendor1Session: ApiSession,
  vendor2Session: ApiSession
): Promise<PaymentsAuthorizationSeed> {
  clearValidationRateLimits();
  const adminSession = await getAdminSession();
  const categoryId = await getFirstCategoryId(adminSession);
  const created = await createProductApi(adminSession, {
    name: uniqueProductName('pa-pay'),
    price: 140,
    categoryId,
    stock: 200,
    moq: 1,
  });
  const productId = String(created._id || created.id);
  const productName = String(created.name);

  await clearCartApi(vendor1Session);
  await addToCartApi(vendor1Session, productId, 1);
  const v1Online = await placeOnlineOrderApi(vendor1Session, {
    idempotencyKey: `pa-pay-v1-on-${Date.now()}`,
  });

  await clearCartApi(vendor1Session);
  await addToCartApi(vendor1Session, productId, 1);
  const v1Bank = await placeBankTransferOrderApi(vendor1Session, {
    idempotencyKey: `pa-pay-v1-bank-${Date.now()}`,
  });

  await clearCartApi(vendor1Session);
  await addToCartApi(vendor1Session, productId, 1);
  const v1Cod = await placeCodOrderApi(vendor1Session, {
    idempotencyKey: `pa-pay-v1-cod-${Date.now()}`,
  });

  await clearCartApi(vendor2Session);
  await addToCartApi(vendor2Session, productId, 1);
  const v2Online = await placeOnlineOrderApi(vendor2Session, {
    idempotencyKey: `pa-pay-v2-on-${Date.now()}`,
  });

  return {
    productId,
    productName,
    vendor1OnlineOrderId: resolveOrderId(v1Online),
    vendor1BankOrderId: resolveOrderId(v1Bank),
    vendor1CodOrderId: resolveOrderId(v1Cod),
    vendor2OnlineOrderId: resolveOrderId(v2Online),
    webhookConfigured: await probeServerWebhookConfigured(),
  };
}

export async function getRefundByIdRaw(
  refundId: string,
  headers: Record<string, string> = {}
) {
  return apiClient.get(`/payments/refund/${refundId}`, {
    headers,
    validateStatus: () => true,
  });
}

export async function getPaymentProofByOrderRaw(
  orderId: string,
  headers: Record<string, string> = {}
) {
  return apiClient.get(`/payments/bank-transfer/order/${orderId}`, {
    headers,
    validateStatus: () => true,
  });
}

export function readBackendFile(relativePath: string): string {
  const filePath = path.resolve(process.cwd(), '..', 'b2b-backend', relativePath);
  return fs.readFileSync(filePath, 'utf8');
}

export function bearerOnly(accessToken: string) {
  return { Authorization: `Bearer ${accessToken}` };
}

export function authBearerOnly(session: ApiSession) {
  return { Authorization: `Bearer ${session.accessToken}` };
}

export async function refreshVendorApiSession(vendorIndex = 1): Promise<ApiSession> {
  const creds = getVendorCredentials(vendorIndex);
  return loginApiFresh(creds.mobile, creds.password);
}

export async function getSuperAdminFreshSession(): Promise<ApiSession> {
  const creds = getSuperAdminCredentials();
  return loginApiFresh(creds.mobile, creds.password);
}

export {
  authHeaders,
  clearValidationRateLimits,
  addToCartApi,
  clearCartApi,
  messageOf,
  MINI_PNG,
  resolveOrderId,
  postPaymentsCreateOrderRaw,
  postPaymentsFailRaw,
  postPaymentsInitiateRaw,
  postPaymentsRefundRaw,
  postPaymentsVerifyRaw,
  postPaymentsWebhookRawFetch,
  getBankDetailsRaw,
  getRefundHistoryRaw,
  getPendingPaymentProofsRaw,
  approvePaymentProofRaw,
  rejectPaymentProofRaw,
  uploadPaymentProofRaw,
  getOrderByIdApi,
  getRazorpayWebhookSecret,
  signWebhookBody,
  placeOnlineOrderApi,
  placeBankTransferOrderApi,
};
