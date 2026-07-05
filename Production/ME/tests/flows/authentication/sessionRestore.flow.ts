import type { Page } from '@playwright/test';
import storage from '../../utils/storage.helper';
import { apiClient } from '../../helpers/apiClient';

/**
 * Session restore flow
 * - Option A: given tokens, write them to localStorage and navigate to app root
 * - Option B: attempt to call refresh-token endpoint via API client (server-side) and then set tokens in page
 *
 * Flow performs orchestration only.
 */
export async function restoreSessionWithTokens(page: Page, accessToken?: string, refreshToken?: string) {
  if (accessToken) {
    await storage.setLocalStorage(page, 'accessToken', accessToken);
  }
  if (refreshToken) {
    await storage.setLocalStorage(page, 'refreshToken', refreshToken);
  }
  // Trigger app initialization that runs AuthContext.restoreSession
  await page.goto('/');
  await page.waitForLoadState('networkidle');
}

export async function restoreSessionViaRefreshApi(page: Page, refreshToken: string) {
  // Call backend to rotate tokens and then persist them in page context
  const resp = await apiClient.post('/auth/refresh-token', { refreshToken });
  const payload = resp?.data?.data ?? resp?.data ?? resp;
  const accessToken = payload.accessToken || payload.data?.accessToken;
  const newRefresh = payload.refreshToken || payload.data?.refreshToken;
  if (accessToken) {
    await storage.setLocalStorage(page, 'accessToken', accessToken);
  }
  if (newRefresh) {
    await storage.setLocalStorage(page, 'refreshToken', newRefresh);
  }
  await page.goto('/');
  await page.waitForLoadState('networkidle');
}

export default { restoreSessionWithTokens, restoreSessionViaRefreshApi };

