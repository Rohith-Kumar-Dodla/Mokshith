import type { Page } from '@playwright/test';
import { AuthSelectors } from '../selectors/auth.selectors';

export async function uiLogin(page: Page, mobile: string, password: string) {
  await page.goto('/login');
  await page.fill(AuthSelectors.login.mobileInput, mobile);
  await page.fill(AuthSelectors.login.passwordInput, password);
  await Promise.all([
    page.waitForNavigation({ waitUntil: 'networkidle' }).catch(() => null),
    page.click(AuthSelectors.login.signInButton),
  ]);
}

export async function uiLogout(page: Page) {
  // Try header logout button first
  const logout = await page.$(AuthSelectors.navbar.logoutButton);
  if (logout) {
    await Promise.all([page.waitForNavigation().catch(() => null), logout.click()]);
    return;
  }

  // Fallback: call logout API via fetch in page context
  await page.evaluate(async () => {
    try {
      await fetch('/api/v1/auth/logout', { method: 'POST', credentials: 'include' });
    } catch {}
  });
}

export default { uiLogin, uiLogout };

