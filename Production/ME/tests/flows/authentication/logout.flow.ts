import type { Page } from '@playwright/test';
import { uiLogout } from '../../helpers/auth.helper';
import storage from '../../utils/storage.helper';

/**
 * Logout flow:
 * - Attempts UI logout via header button
 * - Falls back to clearing local storage and calling logout API via page context
 *
 * No assertions performed here; flow only orchestrates logout actions.
 */
export async function logoutFlow(page: Page) {
  await uiLogout(page);
  // Ensure local session cleared
  await storage.clearLocalStorage(page);
  // Optionally, navigate to login to ensure app reloads
  await page.goto('/login');
}

export default logoutFlow;

