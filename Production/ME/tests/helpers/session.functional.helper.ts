import type { Page } from '@playwright/test';
import { restoreSessionWithTokens } from '../flows/authentication/sessionRestore.flow';
import { ensureLiveSession, loginApi, type ApiSession } from './auth.api.helper';
import { syncBrowserCsrf } from './csrf.helper';
import {
  getAdminCredentials,
  getCustomerCredentials,
  getDeliveryCredentials,
  getSuperAdminCredentials,
  getVendorCredentials,
} from './product.credentials';

export type FunctionalRole =
  | 'admin'
  | 'vendor'
  | 'vendor2'
  | 'superadmin'
  | 'customer'
  | 'delivery';

function roleCredentials(role: FunctionalRole): { mobile: string; password: string } {
  switch (role) {
    case 'admin':
      return getAdminCredentials();
    case 'vendor':
      return getVendorCredentials(1);
    case 'vendor2':
      return getVendorCredentials(2);
    case 'superadmin':
      return getSuperAdminCredentials();
    case 'customer':
      return getCustomerCredentials();
    case 'delivery':
      return getDeliveryCredentials();
    default:
      throw new Error(`Unknown functional role: ${role}`);
  }
}

/**
 * Root Cause A mitigation.
 *
 * Establishes an authenticated browser session WITHOUT performing a UI login.
 * A single API login per role is cached (see auth.api.helper) and the resulting
 * tokens are injected into the page via the certified session-restore flow
 * (the same mechanism Authentication Smoke uses). The frontend AuthContext then
 * calls fetchCurrentUser()/refresh-token to hydrate the session — neither of
 * which counts against the backend login fraud counter.
 *
 * Use loginFlow() ONLY for tests whose objective is verifying the login UI.
 */
export async function getRoleSession(role: FunctionalRole): Promise<ApiSession> {
  const c = roleCredentials(role);
  return loginApi(c.mobile, c.password);
}

export async function establishSession(page: Page, role: FunctionalRole): Promise<ApiSession> {
  const c = roleCredentials(role);
  let session = await loginApi(c.mobile, c.password);
  // Re-login/refresh in the API cache can invalidate a still-unexpired access JWT
  // (single active session). Probe and heal before injecting into the browser.
  session = await ensureLiveSession(c.mobile, c.password, session);
  await restoreSessionWithTokens(page, session.accessToken, session.refreshToken);
  // API-cached csrfToken is not paired with a browser httpOnly cookie.
  // Fetch a browser-bound token so UI mutations pass double-submit CSRF validation.
  await syncBrowserCsrf(page);
  return session;
}

export default { getRoleSession, establishSession };
