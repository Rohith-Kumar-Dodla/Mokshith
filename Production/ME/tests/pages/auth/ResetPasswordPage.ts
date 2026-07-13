import type { Page } from '@playwright/test';
import { AuthSelectors } from '../../selectors/auth.selectors';

export class ResetPasswordPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async goto(token?: string) {
    if (token) {
      await this.page.goto(`/reset-password?token=${encodeURIComponent(token)}`);
    } else {
      await this.page.goto('/reset-password');
    }
  }

  async fillNewPassword(password: string) {
    await this.page.fill(AuthSelectors.reset.newPasswordInput, password);
  }

  async fillConfirmPassword(password: string) {
    await this.page.fill(AuthSelectors.reset.confirmPasswordInput, password);
  }

  async submit() {
    await Promise.all([
      this.page.waitForResponse((r) => r.url().includes('/auth/reset-password') && r.status() < 500).catch(() => null),
      this.page.click(AuthSelectors.reset.resetButton),
    ]);
  }

  async getSuccessText() {
    const el = await this.page.$(AuthSelectors.reset.successBanner);
    if (!el) return '';
    return (await el.textContent())?.trim() ?? '';
  }
}

export default ResetPasswordPage;

