import { apiClient } from './apiClient';
import storage from '../utils/storage.helper';
import type { Page } from '@playwright/test';

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

export default { fetchCsrfTokenApi, attachCsrfToPage, validateCsrfAvailable, clearCsrf };

