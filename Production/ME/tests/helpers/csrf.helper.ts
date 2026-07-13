import { apiClient } from './apiClient';
import storage from '../utils/storage.helper';
import type { Page } from '@playwright/test';

const API_BASE =
  process.env.TEST_API_BASE_URL || process.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1';

/**
 * CSRF helper uses the real backend endpoint /auth/csrf-token to obtain tokens.
 * It can persist token into page localStorage to simulate frontend behavior.
 */

export async function fetchCsrfTokenApi() {
  const resp = await apiClient.get('/auth/csrf-token');
  const payload = resp?.data?.data ?? resp?.data ?? resp;
  const token = payload.csrfToken || payload.data?.csrfToken || payload?.csrfToken;
  return token;
}

/**
 * Pair a browser session with a CSRF token that matches the httpOnly cookie.
 *
 * API login caches a csrfToken in localStorage via establishSession, but that token
 * is not paired with a browser cookie. Backend double-submit validation requires
 * both x-csrf-token header and csrf-token cookie to match — UI mutations 403 without this.
 */
export async function syncBrowserCsrf(page: Page): Promise<string> {
  let lastError: unknown = null;

  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      const response = await page.request.get(`${API_BASE}/auth/csrf-token`);
      if (!response.ok()) {
        throw new Error(`syncBrowserCsrf failed: ${response.status()} ${await response.text()}`);
      }

      const body = await response.json();
      const token = body?.data?.csrfToken ?? body?.csrfToken;
      if (!token) {
        throw new Error('syncBrowserCsrf failed: no csrfToken in response');
      }

      await storage.setLocalStorage(page, 'csrfToken', token);
      return token;
    } catch (err) {
      lastError = err;
      // Transient network resets can happen under load; retry.
      await page.waitForTimeout(250 * attempt);
    }
  }

  throw lastError;
}

export async function attachCsrfToPage(page: Page, token?: string) {
  const t = token || (await fetchCsrfTokenApi());
  if (!t) return null;
  await storage.setLocalStorage(page, 'csrfToken', t);
  return t;
}

export async function validateCsrfAvailable(page: Page) {
  const token = await storage.getLocalStorage(page, 'csrfToken');
  return !!token;
}

export async function clearCsrf(page: Page) {
  await storage.setLocalStorage(page, 'csrfToken', '');
}

export default { fetchCsrfTokenApi, syncBrowserCsrf, attachCsrfToPage, validateCsrfAvailable, clearCsrf };

