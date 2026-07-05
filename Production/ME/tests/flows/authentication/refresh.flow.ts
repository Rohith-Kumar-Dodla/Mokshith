import type { Page } from '@playwright/test';
import { apiClient } from '../../helpers/apiClient';
import storage from '../../utils/storage.helper';

/**
 * Refresh token flow orchestration:
 * - Call refresh-token endpoint via API client
 * - Persist new tokens into page localStorage
 *
 * No assertions are performed.
 */
export async function refreshTokenFlow(page: Page, refreshToken: string) {
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
}

export default refreshTokenFlow;

