import type { Page } from '@playwright/test';
import storage from '../../utils/storage.helper';
import { apiClient } from '../../helpers/apiClient';

async function writeTabSession(page: Page, partial: Record<string, unknown>) {
  await page.evaluate((sessionPartial) => {
    const tabSessionId = sessionStorage.getItem('tabSessionId') || `tab_${Date.now().toString(36)}`;
    sessionStorage.setItem('tabSessionId', tabSessionId);
    const key = `auth_session_${tabSessionId}`;
    const current = (() => {
      try {
        return JSON.parse(localStorage.getItem(key) || '{}');
      } catch {
        return {};
      }
    })();
    localStorage.setItem(key, JSON.stringify({
      ...current,
      ...sessionPartial,
      isAuthenticated: true,
    }));
  }, partial);
}

async function readTabSession(page: Page) {
  return page.evaluate(() => {
    const tabId = sessionStorage.getItem('tabSessionId');
    if (!tabId) return null;
    try {
      return JSON.parse(localStorage.getItem(`auth_session_${tabId}`) || 'null');
    } catch {
      return null;
    }
  });
}

/**
 * Session restore flow
 * - Option A: given tokens, write them to the current tab session and navigate to app root
 * - Option B: attempt to call refresh-token endpoint via API client and then set tokens in page
 *
 * Flow performs orchestration only.
 */
export async function restoreSessionWithTokens(page: Page, accessToken?: string, refreshToken?: string) {
  // Navigate to app origin before touching localStorage to avoid SecurityError.
  await page.goto('/');
  await page.waitForLoadState('domcontentloaded');

  await writeTabSession(page, {
    ...(accessToken ? { accessToken } : {}),
    ...(refreshToken ? { refreshToken } : {}),
  });

  // Reload so application picks up stored tokens and initializes AuthContext.restoreSession
  await page.reload();
  // Avoid waiting for networkidle, which can hang when the app has long-polling/keepalive requests.
  await page.waitForLoadState('domcontentloaded');

  // AuthContext.restoreSession is async; wait until client storage reflects a hydrated session.
  await page.waitForFunction(
    () => {
      const tabId = sessionStorage.getItem('tabSessionId');
      if (!tabId) return false;
      try {
        const session = JSON.parse(localStorage.getItem(`auth_session_${tabId}`) || 'null');
        return Boolean(session?.user) && session?.isAuthenticated === true;
      } catch {
        return false;
      }
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
  if (accessToken || newRefresh) {
    await writeTabSession(page, {
      ...(accessToken ? { accessToken } : {}),
      ...(newRefresh ? { refreshToken: newRefresh } : {}),
    });
  }
  await page.goto('/');
  await page.waitForLoadState('domcontentloaded');
  return readTabSession(page);
}

export default {
  restoreSessionWithTokens,
  restoreSessionViaRefreshApi,
};
