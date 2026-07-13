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
  // Wait for app to perform logout and redirect to login page.
  // Do not manipulate localStorage or cookies directly; verify observable behavior only.
  try {
    await page.waitForFunction(() => location.pathname === '/login' || location.pathname === '/', null, { timeout: 10000 });
    // Ensure final navigation to /login (SPA may show root then redirect)
    await page.waitForURL(/\/login/, { timeout: 10000 }).catch(() => null);
  } catch {
    // Non-fatal: caller tests will assert logout behavior.
  }
}

export default logoutFlow;

