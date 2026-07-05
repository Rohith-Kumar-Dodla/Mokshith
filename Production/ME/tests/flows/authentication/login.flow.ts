import type { Page } from '@playwright/test';
import LoginPage from '../../pages/auth/LoginPage';
import { AuthSelectors } from '../../selectors/auth.selectors';

/**
 * Login flow using UI page objects.
 * - Navigates to login page
 * - Fills mobile & password
 * - Submits and handles optional 2FA if verifier becomes visible
 *
 * NOTE: This flow orchestrates page object actions only. No assertions.
 */
export async function loginFlow(page: Page, mobile: string, password: string, twoFACode?: string) {
  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.fillMobile(mobile);
  await loginPage.fillPassword(password);
  await loginPage.submit();

  // If 2FA input appears, perform verification using provided code
  const twoFALocator = page.locator(AuthSelectors.login.twoFAVerifyInput);
  if (await twoFALocator.count() > 0 && twoFACode) {
    await loginPage.startTwoFAVerify(twoFACode);
  }
}

export default loginFlow;

