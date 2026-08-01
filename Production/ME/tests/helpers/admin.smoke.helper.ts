import { authHeaders, loginApiFresh, type ApiSession } from './auth.api.helper';
import { getAdminCredentials } from './product.credentials';
import { clearValidationRateLimits } from './cart.validation.helper';
import { apiClient } from './apiClient';
import { establishSession } from './session.functional.helper';
import { expect, type Page } from '@playwright/test';

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

export async function getAdminStatsRaw(headers: Record<string, string> = {}) {
  return apiClient.get('/admin/stats', { headers, validateStatus: () => true });
}

export async function getAdminUsersRaw(headers: Record<string, string> = {}) {
  return apiClient.get('/admin/users', { headers, validateStatus: () => true });
}

export async function refreshAdminApiSession(): Promise<ApiSession> {
  const creds = getAdminCredentials();
  return loginApiFresh(creds.mobile, creds.password);
}

/** Hydrate admin UI session and confirm ProtectedRoute grants /admin/dashboard. */
export async function establishAdminUiSession(page: Page): Promise<void> {
  await establishSession(page, 'admin');
  await page.goto('/admin/dashboard');
  await expect(
    page.getByRole('heading', { name: 'Marketplace Operations Dashboard.' })
  ).toBeVisible({ timeout: 15000 });
}

export {
  authHeaders,
  clearValidationRateLimits,
};
