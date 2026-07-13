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

  // 1) Prepare to capture the login API response before submitting
  const loginResponsePromise = page.waitForResponse(
    (res) => res.url().includes('/auth/login') && res.request().method() === 'POST',
    { timeout: 15000 }
  );

  // 2) Submit the login form (trigger network request)
  await loginPage.submit();

  // 3) Await login response and validate
  const loginResponse = await loginResponsePromise;
  if (loginResponse.status() !== 200) {
    const body = await loginResponse.text().catch(() => '');
    throw new Error(`Login API returned status ${loginResponse.status()}: ${body}`);
  }

  // 4) If server indicates 2FA required, handle verification deterministically
  const loginBody = await loginResponse.json().catch(() => null);
  const loginPayload = loginBody?.data ?? loginBody ?? {};
  if (loginPayload?.requires2FA) {
    if (!twoFACode) {
      throw new Error('Login requires 2FA but no twoFACode was provided to loginFlow');
    }

    await page.waitForSelector(AuthSelectors.login.twoFAVerifyInput, { timeout: 5000 });
    // Prepare to capture verify response
    const verifyResponsePromise = page.waitForResponse(
      (res) => res.url().includes('/auth/2fa/verify') && res.request().method() === 'POST',
      { timeout: 15000 }
    );
    await loginPage.startTwoFAVerify(twoFACode);
    const verifyResponse = await verifyResponsePromise;
    if (verifyResponse.status() !== 200) {
      const body = await verifyResponse.text().catch(() => '');
      throw new Error(`2FA verify API returned status ${verifyResponse.status()}: ${body}`);
    }
  }

  // 5) Wait for the app to navigate to an authenticated dashboard route
  await page.waitForFunction(
    () =>
      location.pathname.startsWith('/vendor') ||
      location.pathname.startsWith('/admin') ||
      location.pathname.startsWith('/super-admin') ||
      location.pathname.startsWith('/delivery'),
    null,
    { timeout: 15000 }
  );

  // 6) Only after navigation, assert accessToken exists in localStorage
  await page.waitForFunction(() => !!localStorage.getItem('accessToken'), null, { timeout: 15000 });
}

export default loginFlow;

