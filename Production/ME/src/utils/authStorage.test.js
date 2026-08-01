import { describe, it, expect, beforeEach } from 'vitest';
import {
  clearAuthStorage,
  getAccessToken,
  getAuthSessionKey,
  getCsrfToken,
  getRefreshToken,
  getTabSessionId,
  persistSession,
} from './authStorage';

describe('authStorage tab isolation', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  it('creates a tab session id and stores auth under an isolated key', () => {
    const tabId = getTabSessionId();
    persistSession({
      accessToken: 'access-a',
      refreshToken: 'refresh-a',
      csrfToken: 'csrf-a',
      user: { name: 'Admin' },
      role: 'admin',
    });

    expect(tabId).toMatch(/^tab_/);
    expect(sessionStorage.getItem('tabSessionId')).toBe(tabId);
    expect(localStorage.getItem(getAuthSessionKey(tabId))).toBeTruthy();
    expect(getAccessToken()).toBe('access-a');
    expect(getRefreshToken()).toBe('refresh-a');
    expect(getCsrfToken()).toBe('csrf-a');
    expect(localStorage.getItem('accessToken')).toBeNull();
  });

  it('does not overwrite another tab session when a new tab id is used', () => {
    sessionStorage.setItem('tabSessionId', 'tab_one');
    persistSession({
      accessToken: 'admin-token',
      refreshToken: 'admin-refresh',
      role: 'admin',
    });

    sessionStorage.setItem('tabSessionId', 'tab_two');
    persistSession({
      accessToken: 'vendor-token',
      refreshToken: 'vendor-refresh',
      role: 'vendor',
    });

    expect(JSON.parse(localStorage.getItem('auth_session_tab_one')).accessToken).toBe('admin-token');
    expect(JSON.parse(localStorage.getItem('auth_session_tab_two')).accessToken).toBe('vendor-token');
    expect(getAccessToken()).toBe('vendor-token');
  });

  it('clears only the current tab session on logout', () => {
    sessionStorage.setItem('tabSessionId', 'tab_one');
    persistSession({ accessToken: 'admin-token', refreshToken: 'admin-refresh' });

    sessionStorage.setItem('tabSessionId', 'tab_two');
    persistSession({ accessToken: 'vendor-token', refreshToken: 'vendor-refresh' });

    clearAuthStorage();

    expect(localStorage.getItem('auth_session_tab_two')).toBeNull();
    expect(localStorage.getItem('auth_session_tab_one')).toBeTruthy();
    expect(sessionStorage.getItem('tabSessionId')).toBeNull();
  });

  it('migrates legacy global auth keys into the current tab session once', () => {
    localStorage.setItem('accessToken', 'legacy-access');
    localStorage.setItem('refreshToken', 'legacy-refresh');
    localStorage.setItem('csrfToken', 'legacy-csrf');
    localStorage.setItem('role', 'admin');
    localStorage.setItem('isAuthenticated', 'true');

    expect(getAccessToken()).toBe('legacy-access');
    expect(getRefreshToken()).toBe('legacy-refresh');
    expect(getCsrfToken()).toBe('legacy-csrf');
    expect(localStorage.getItem('accessToken')).toBeNull();
    expect(localStorage.getItem(getAuthSessionKey())).toBeTruthy();
  });
});
