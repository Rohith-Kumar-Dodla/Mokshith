import type { Page } from '@playwright/test';
import { decodeJwt } from './jwt.helper';
import storage from '../utils/storage.helper';
import { findCookie } from './cookie.helper';
import { apiClient } from './apiClient';

/**
 * Session helper responsibilities:
 * - restore session (via tokens)
 * - validate session state
 * - detect expired session
 * - clear session
 * - read authenticated user
 */

export async function restoreSession(page: Page, accessToken?: string, refreshToken?: string) {
  if (accessToken) {
    await storage.setLocalStorage(page, 'accessToken', accessToken);
  }
  if (refreshToken) {
    await storage.setLocalStorage(page, 'refreshToken', refreshToken);
  }
  await page.goto('/');
  await page.waitForLoadState('networkidle');
}

export async function validateSessionState(page: Page) {
  const token = await storage.getLocalStorage(page, 'accessToken');
  if (!token) return null;
  return decodeJwt(token);
}

export async function isSessionExpired(page: Page) {
  const token = await storage.getLocalStorage(page, 'accessToken');
  if (!token) return true;
  const decoded = decodeJwt(token);
  if (!decoded || !decoded.exp) return true;
  const now = Math.floor(Date.now() / 1000);
  return decoded.exp <= now;
}

export async function clearSession(page: Page) {
  // Clear client storage
  await storage.clearLocalStorage(page);
  // Clear cookies for current context
  const context = page.context();
  const cookies = await context.cookies();
  if (cookies && cookies.length) {
    await context.clearCookies();
  }
  // Optionally notify other tabs like frontend does
  await page.evaluate(() => {
    try {
      localStorage.setItem('logout', Date.now().toString());
    } catch {}
  });
}

export async function getAuthenticatedUser(page: Page) {
  const raw = await storage.getLocalStorage(page, 'user');
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export async function getSessionCookies(page: Page) {
  return await findCookie(page, 'refreshToken') || null;
}

export async function refreshSessionViaApi(refreshToken: string) {
  const resp = await apiClient.post('/auth/refresh-token', { refreshToken });
  return resp?.data?.data ?? resp?.data ?? resp;
}

export default {
  restoreSession,
  validateSessionState,
  isSessionExpired,
  clearSession,
  getAuthenticatedUser,
  getSessionCookies,
  refreshSessionViaApi,
};

