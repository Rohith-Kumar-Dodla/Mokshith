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
  // Navigate to app origin before touching localStorage to avoid SecurityError.
  await page.goto('/');
  await page.waitForLoadState('domcontentloaded');

  if (accessToken) {
    await storage.setLocalStorage(page, 'accessToken', accessToken);
  }
  if (refreshToken) {
    await storage.setLocalStorage(page, 'refreshToken', refreshToken);
  }

  // Reload so application picks up stored tokens and initializes AuthContext.restoreSession
  await page.reload();
  // Avoid waiting for networkidle, which can hang when the app has long-polling/keepalive requests.
  await page.waitForLoadState('domcontentloaded');

  // AuthContext.restoreSession is async; wait until client storage reflects a hydrated session.
  await page.waitForFunction(
    () => {
      const user = localStorage.getItem('user');
      const isAuth = localStorage.getItem('isAuthenticated');
      return !!user && isAuth === 'true';
    },
    null,
    { timeout: 15000 }
  );
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
  // Ensure page is at app origin and reload to pick up new tokens
  await page.goto('/');
  await page.waitForLoadState('domcontentloaded');
  await page.reload();
  await page.waitForLoadState('domcontentloaded');
}

export default { restoreSessionWithTokens, restoreSessionViaRefreshApi };

