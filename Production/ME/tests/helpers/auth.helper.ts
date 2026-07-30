import type { Page } from '@playwright/test';
import { AuthSelectors } from '../selectors/auth.selectors';

export async function uiLogin(page: Page, mobile: string, password: string) {
  await page.goto('/login');
  await page.fill(AuthSelectors.login.mobileInput, mobile);
  await page.fill(AuthSelectors.login.passwordInput, password);
  // SPA navigation is client-side; click and let the calling flow wait deterministically.
  await page.click(AuthSelectors.login.signInButton);
}

export async function uiLogout(page: Page) {
  // Try header logout button first
  const logoutLocator = page.locator(AuthSelectors.navbar.logoutButton);
  try {
    await logoutLocator.waitFor({ state: 'visible', timeout: 5000 });
  } catch {
    throw new Error('Logout button not found in UI');
  }
  // Click logout button
  await logoutLocator.click();

  // Confirm dialog must appear
    const dialog = page.locator('role=dialog[name="Confirm Logout"]');
    try {
      await dialog.waitFor({ state: 'visible', timeout: 5000 });
    } catch {
      throw new Error('Logout dialog never appeared');
    }

    const confirmButton = dialog.locator('button:has-text("Logout")');
    if ((await confirmButton.count()) === 0) {
      throw new Error('Logout confirmation failed');
    }

    // Register response waiter before click to avoid missing a fast logout response.
    const respPromise = page.waitForResponse(
      (res) => res.url().includes('/auth/logout') && res.request().method() === 'POST',
      { timeout: 10000 }
    );
    await confirmButton.click();

    const resp = await respPromise.catch(() => null);
    if (!resp) throw new Error('Logout API not called');
    if (resp.status() !== 200) {
      const body = await resp.text().catch(() => '');
      throw new Error(`Logout API returned ${resp.status()}: ${body}`);
    }

    // Wait for redirect to login
    await page.waitForURL(/\/login/, { timeout: 10000 });
    return;
}

export default { uiLogin, uiLogout };

