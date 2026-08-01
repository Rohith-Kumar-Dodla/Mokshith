import type { Page } from '@playwright/test';
import { decodeJwt } from './jwt.helper';
import storage from '../utils/storage.helper';
import { findCookie } from './cookie.helper';
import { apiClient } from './apiClient';

async function readCurrentTabSession(page: Page) {
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

async function writeCurrentTabSession(page: Page, partial: Record<string, unknown>) {
  await page.evaluate((sessionPartial) => {
    const tabSessionId = sessionStorage.getItem('tabSessionId') || `tab_${Date.now().toString(36)}`;
    sessionStorage.setItem('tabSessionId', tabSessionId);
    const key = `auth_session_${tabSessionId}`;
    let current = {};
    try {
      current = JSON.parse(localStorage.getItem(key) || '{}');
    } catch {
      current = {};
    }
    localStorage.setItem(key, JSON.stringify({
      ...current,
      ...sessionPartial,
      isAuthenticated: true,
    }));
  }, partial);
}

/**
 * Session helper responsibilities:
 * - restore session (via tokens)
 * - validate session state
 * - detect expired session
 * - clear session
 * - read authenticated user
 */

export async function restoreSession(page: Page, accessToken?: string, refreshToken?: string) {
  await writeCurrentTabSession(page, {
    ...(accessToken ? { accessToken } : {}),
    ...(refreshToken ? { refreshToken } : {}),
  });
  await page.goto('/');
  await page.waitForLoadState('networkidle');
}

export async function validateSessionState(page: Page) {
  const session = await readCurrentTabSession(page);
  const token = session?.accessToken || await storage.getLocalStorage(page, 'accessToken');
  if (!token) return null;
  return decodeJwt(token);
}

export async function isSessionExpired(page: Page) {
  const session = await readCurrentTabSession(page);
  const token = session?.accessToken || await storage.getLocalStorage(page, 'accessToken');
  if (!token) return true;
  const decoded = decodeJwt(token);
  if (!decoded || !decoded.exp) return true;
  const now = Math.floor(Date.now() / 1000);
  return decoded.exp <= now;
}

export async function clearSession(page: Page) {
  await page.evaluate(() => {
    const tabId = sessionStorage.getItem('tabSessionId');
    if (tabId) {
      localStorage.removeItem(`auth_session_${tabId}`);
    }
    sessionStorage.removeItem('tabSessionId');
    [
      'accessToken',
      'refreshToken',
      'csrfToken',
      'user',
      'role',
      'isAuthenticated',
      'token',
      'logout',
      'session_replaced',
    ].forEach((key) => localStorage.removeItem(key));
  });
  const context = page.context();
  const cookies = await context.cookies();
  if (cookies && cookies.length) {
    await context.clearCookies();
  }
}

export async function getAuthenticatedUser(page: Page) {
  const session = await readCurrentTabSession(page);
  if (session?.user) return session.user;
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
