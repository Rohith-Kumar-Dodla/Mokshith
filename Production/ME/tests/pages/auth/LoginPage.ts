import type { Page } from '@playwright/test';
import { AuthSelectors } from '../../selectors/auth.selectors';

export class LoginPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async goto() {
    await this.page.goto('/login');
  }

  async fillMobile(mobile: string) {
    await this.page.fill(AuthSelectors.login.mobileInput, mobile);
  }

  async fillPassword(password: string) {
    await this.page.fill(AuthSelectors.login.passwordInput, password);
  }

  async submit() {
    // SPA navigation is client-side; click the submit button and let callers wait deterministically.
    await this.page.click(AuthSelectors.login.signInButton);
  }

  async submitExpectingNoNavigation() {
    await this.page.click(AuthSelectors.login.signInButton);
  }

  async startTwoFAVerify(code: string) {
    await this.page.fill(AuthSelectors.login.twoFAVerifyInput, code);
    await Promise.all([
      this.page.waitForNavigation({ waitUntil: 'networkidle' }).catch(() => null),
      this.page.click(AuthSelectors.login.twoFASubmit),
    ]);
  }

  async getErrorText() {
    const el = await this.page.$(AuthSelectors.login.errorBanner);
    if (!el) return '';
    return (await el.textContent())?.trim() ?? '';
  }
}

export default LoginPage;

