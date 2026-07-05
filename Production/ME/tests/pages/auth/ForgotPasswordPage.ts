import type { Page } from '@playwright/test';
import { AuthSelectors } from '../../selectors/auth.selectors';

export class ForgotPasswordPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async goto() {
    await this.page.goto('/forgot-password');
  }

  async fillIdentifier(identifier: string) {
    await this.page.fill(AuthSelectors.forgot.identifierInput, identifier);
  }

  async submit() {
    await Promise.all([
      this.page.waitForResponse((r) => r.url().includes('/auth/forgot-password') && r.status() < 500).catch(() => null),
      this.page.click(AuthSelectors.forgot.sendResetButton),
    ]);
  }

  async getSuccessText() {
    const el = await this.page.$(AuthSelectors.forgot.successBanner);
    if (!el) return '';
    return (await el.textContent())?.trim() ?? '';
  }
}

export default ForgotPasswordPage;

