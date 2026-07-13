import type { Page } from '@playwright/test';
import { restoreSessionWithTokens } from '../flows/authentication/sessionRestore.flow';
import { loginApi, type ApiSession } from './auth.api.helper';
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
  switch (role) {
    case 'admin': {
      const c = getAdminCredentials();
      return loginApi(c.mobile, c.password);
    }
    case 'vendor': {
      const c = getVendorCredentials(1);
      return loginApi(c.mobile, c.password);
    }
    case 'vendor2': {
      const c = getVendorCredentials(2);
      return loginApi(c.mobile, c.password);
    }
    case 'superadmin': {
      const c = getSuperAdminCredentials();
      return loginApi(c.mobile, c.password);
    }
    case 'customer': {
      const c = getCustomerCredentials();
      return loginApi(c.mobile, c.password);
    }
    case 'delivery': {
      const c = getDeliveryCredentials();
      return loginApi(c.mobile, c.password);
    }
    default:
      throw new Error(`Unknown functional role: ${role}`);
  }
}

export async function establishSession(page: Page, role: FunctionalRole): Promise<ApiSession> {
  const session = await getRoleSession(role);
  await restoreSessionWithTokens(page, session.accessToken, session.refreshToken);
  // API-cached csrfToken is not paired with a browser httpOnly cookie.
  // Fetch a browser-bound token so UI mutations pass double-submit CSRF validation.
  await syncBrowserCsrf(page);
  return session;
}

export default { getRoleSession, establishSession };
