import type { Page } from '@playwright/test';
import ForgotPasswordPage from '../../pages/auth/ForgotPasswordPage';
import ResetPasswordPage from '../../pages/auth/ResetPasswordPage';

/**
 * Forgot + Reset password flow orchestration
 * - Request reset (forgot)
 * - Optionally navigate to reset URL with token and submit new password
 *
 * No assertions here.
 */
export async function forgotPasswordFlow(page: Page, identifier: string) {
  const forgot = new ForgotPasswordPage(page);
  await forgot.goto();
  await forgot.fillIdentifier(identifier);
  await forgot.submit();
}

export async function resetPasswordFlow(page: Page, token: string, newPassword: string) {
  const reset = new ResetPasswordPage(page);
  await reset.goto(token);
  await reset.fillNewPassword(newPassword);
  await reset.fillConfirmPassword(newPassword);
  await reset.submit();
}

export default { forgotPasswordFlow, resetPasswordFlow };

