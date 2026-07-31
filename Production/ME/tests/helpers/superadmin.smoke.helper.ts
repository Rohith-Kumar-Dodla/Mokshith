/**
 * Super Admin Smoke Certification helpers (SS-SA).
 * Does not modify locked Admin / Notifications / Logistics / Payments / Inventory suites.
 */
import { expect, type Page } from '@playwright/test';
import { apiClient } from './apiClient';
import { authHeaders, loginApiFresh, type ApiSession } from './auth.api.helper';
import { clearValidationRateLimits } from './cart.validation.helper';
import { getSuperAdminCredentials } from './product.credentials';
import { establishSession } from './session.functional.helper';

export function messageOf(payload: unknown): string {
  if (payload && typeof payload === 'object') {
    const msg = (payload as { message?: unknown }).message;
    if (typeof msg === 'string') return msg;
  }
  return JSON.stringify(payload ?? {});
}

export function unwrapData(payload: unknown): Record<string, unknown> {
  if (payload && typeof payload === 'object') {
    const body = payload as { data?: unknown };
    if (body.data && typeof body.data === 'object' && !Array.isArray(body.data)) {
      return body.data as Record<string, unknown>;
    }
    return payload as Record<string, unknown>;
  }
  return {};
}

export async function getSuperAdminStatsRaw(headers: Record<string, string> = {}) {
  return apiClient.get('/super-admin/stats', { headers, validateStatus: () => true });
}

export async function getSuperAdminMetricsRaw(headers: Record<string, string> = {}) {
  return apiClient.get('/super-admin/metrics', { headers, validateStatus: () => true });
}

export async function getAnalyticsDashboardRaw(headers: Record<string, string> = {}) {
  return apiClient.get('/analytics/dashboard', { headers, validateStatus: () => true });
}

export async function getBankTransferPendingRaw(headers: Record<string, string> = {}) {
  return apiClient.get('/payments/bank-transfer/pending', {
    headers,
    validateStatus: () => true,
  });
}

export async function refreshSuperAdminApiSession(): Promise<ApiSession> {
  const creds = getSuperAdminCredentials();
  return loginApiFresh(creds.mobile, creds.password);
}

/** Hydrate SA UI session and confirm ProtectedRoute grants /super-admin/dashboard. */
export async function establishSuperAdminUiSession(page: Page): Promise<void> {
  await establishSession(page, 'superadmin');
  await page.goto('/super-admin/dashboard');
  await expect(page.getByRole('heading', { name: 'Super Admin Dashboard' })).toBeVisible({
    timeout: 15000,
  });
}

export { authHeaders, clearValidationRateLimits };
