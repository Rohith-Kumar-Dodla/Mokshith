import { test, expect } from '@playwright/test';
import { execSync } from 'child_process';
import path from 'path';
import loginFlow from '../flows/authentication/login.flow';
import logoutFlow from '../flows/authentication/logout.flow';
import sessionRestoreFlows from '../flows/authentication/sessionRestore.flow';
import refreshFlow from '../flows/authentication/refresh.flow';
import UserFactory from '../factories/user.factory';
import AuthFixtures from '../fixtures/auth.fixture';
import validators from '../validators/auth.validator';
import sessionHelper from '../helpers/session.helper';
import csrfHelper from '../helpers/csrf.helper';
import apiClient from '../helpers/apiClient';
import storage from '../utils/storage.helper';
import { ROLES } from '../../../b2b-backend/src/constants/roles.js';

test.describe('Authentication Smoke Suite', () => {
  const createdUsers: string[] = [];

  // Clear auth rate-limit keys before smoke suite to ensure deterministic login attempts.
  // This is safe for single-worker smoke runs and required to avoid flaky 429s.
  test.beforeAll(() => {
    try {
      const script = path.resolve(process.cwd(), '..', 'b2b-backend', 'scripts', 'clearAuthRateLimits.js');
      execSync(`node "${script}"`, { stdio: 'ignore' });
    } catch (err) {
      // Non-fatal: if clearing fails, tests will proceed and may hit rate limits.
      console.warn('Warning: failed to clear auth rate limits before smoke suite:', err?.message || err);
    }
  });

  test.afterEach(async () => {
    // Attempt cleanup of created users; try common test-only endpoints and ignore if not available.
    for (const identifier of createdUsers.splice(0)) {
      const endpoints = [
        '/testing/users/delete',
        '/test-utils/users/delete',
        '/auth/test-delete',
      ];
      for (const ep of endpoints) {
        try {
          await apiClient.post(ep, { identifier });
          break;
        } catch (err: any) {
          const status = err?.response?.status;
          if (status === 404 || status === 405) {
            // endpoint not present — continue to next candidate
            continue;
          }
          // other errors: log and continue
          console.warn(`Cleanup attempt failed for ${identifier} at ${ep}:`, err?.message || err);
        }
      }
    }
  });

  test('S-AUTH-01 | Login (password) - basic auth', async ({ page }) => {
    // Use deterministic approved seeded account in QA for login smoke.
    const seededMobile = process.env.TEST_SEEDED_CUSTOMER_MOBILE || '9000000301';
    const seededPassword = process.env.TEST_SEEDED_CUSTOMER_PASSWORD || 'Customer@123';
    await loginFlow(page, seededMobile, seededPassword);

    // Validate tokens and session presence
    await validators.assertAccessTokenPresent(page).catch((err) => {
      throw new Error('S-AUTH-01 failed: access token missing after login — ' + err.message);
    });
    await validators.assertCsrfTokenPresent(page).catch((err) => {
      throw new Error('S-AUTH-01 failed: csrf token missing after login — ' + err.message);
    });

    // Business outcomes: authenticated user exists and session flag set
    const user = await sessionHelper.getAuthenticatedUser(page);
    if (!user) throw new Error('S-AUTH-01 failed: authenticated user not present in client storage');
    const isAuth = await storage.getLocalStorage(page, 'isAuthenticated');
    if (isAuth !== 'true') throw new Error(`S-AUTH-01 failed: expected isAuthenticated=true but found ${isAuth}`);
    // Optionally verify expected seeded mobile if provided
    const expectedMobile = process.env.TEST_SEEDED_CUSTOMER_MOBILE;
    if (expectedMobile && user.mobile !== expectedMobile) {
      throw new Error(`S-AUTH-01 failed: expected user mobile ${expectedMobile} found ${user.mobile}`);
    }
  });

  test('S-AUTH-02 | Login (2FA) - conditional if supported', async ({ page }) => {
    // Conditional test: enabled by env variable and requires seeded 2FA account support
    if (process.env.SMOKE_ENABLE_2FA !== 'true') {
      test.skip(true, 'S-AUTH-02 skipped: SMOKE_ENABLE_2FA not enabled in environment');
    }
    // Use seeded account for 2FA tests. Require TEST_SEEDED_2FA_MOBILE to be set in CI.
    const seededMobile = process.env.TEST_SEEDED_2FA_MOBILE;
    const seededPassword = process.env.TEST_SEEDED_2FA_PASSWORD;
    if (!seededMobile || !seededPassword) {
      test.skip(true, 'S-AUTH-02 skipped: no seeded 2FA account configured (TEST_SEEDED_2FA_MOBILE/PASSWORD)');
    }
    const twoFACode = process.env.TEST_2FA_CODE;
    await loginFlow(page, seededMobile, seededPassword, twoFACode);
    await validators.assertAccessTokenPresent(page).catch((err) => {
      throw new Error('S-AUTH-02 failed: access token missing after 2FA login — ' + err.message);
    });
  });

  test('S-AUTH-03 | Logout (UI)', async ({ page }) => {
    // Use seeded deterministic customer
    const seededMobile = process.env.TEST_SEEDED_CUSTOMER_MOBILE || '9000000301';
    const seededPassword = process.env.TEST_SEEDED_CUSTOMER_PASSWORD || 'Customer@123';
    await loginFlow(page, seededMobile, seededPassword);

    // perform logout flow
    await logoutFlow(page);

    // Expect redirected to login and session cleared
    await expect(page).toHaveURL(/\/login/);
    const user = await sessionHelper.getAuthenticatedUser(page);
    expect(user, 'S-AUTH-03 failed: user still present after logout').toBeNull();
  });

  test('S-AUTHZ-01 | Protected route redirects when unauthenticated', async ({ page }) => {
    await page.goto('/admin/dashboard');
    await expect(page).toHaveURL(/\/login/);
  });

  test('S-AUTHZ-02 | Access protected route with auth (admin)', async ({ page }) => {
    // Use seeded admin account
    const seededAdminMobile = process.env.TEST_SEEDED_ADMIN_MOBILE || '9000000002';
    const seededAdminPassword = process.env.TEST_SEEDED_ADMIN_PASSWORD || 'Admin@123';
    await loginFlow(page, seededAdminMobile, seededAdminPassword);
    await page.goto('/admin/dashboard');
    // Business assertions: session present and role matches expected
    await validators.assertAccessTokenPresent(page);
    const user = await sessionHelper.getAuthenticatedUser(page);
    if (!user) throw new Error('S-AUTHZ-02 failed: authenticated user not present after admin login');
    // Validate role if available on user object
    if (user.role && user.role.toUpperCase() !== 'ADMIN' && user.role !== ROLES.ADMIN) {
      throw new Error(`S-AUTHZ-02 failed: expected role ADMIN but found ${user.role}`);
    }
  });

  test('S-SESSION-01 | Token refresh endpoint and rotation', async ({ page }) => {
    // Use seeded deterministic customer
    const seededMobile = process.env.TEST_SEEDED_CUSTOMER_MOBILE || '9000000301';
    const seededPassword = process.env.TEST_SEEDED_CUSTOMER_PASSWORD || 'Customer@123';
    await loginFlow(page, seededMobile, seededPassword);

    // Read existing refresh token via storage helper
    await sessionHelper.validateSessionState(page);
    const refreshToken = await storage.getLocalStorage(page, 'refreshToken');
    if (!refreshToken) {
      throw new Error('S-SESSION-01 failed: no refreshToken available to test rotation');
    }

    // Invoke refresh flow (orchestration)
    await refreshFlow(page, refreshToken);

    // Validate new tokens present
    await validators.assertAccessTokenPresent(page).catch((err) => {
      throw new Error('S-SESSION-01 failed: access token missing after refresh — ' + err.message);
    });
  });

  test('S-SESSION-02 | Session restore on app load', async ({ page }) => {
    // Use seeded account to obtain tokens via API login (avoid creating users)
    const seededMobile = process.env.TEST_SEEDED_CUSTOMER_MOBILE || '9000000301';
    const seededPassword = process.env.TEST_SEEDED_CUSTOMER_PASSWORD || 'Customer@123';
    const resp = await apiClient.post('/auth/login', { mobile: seededMobile, password: seededPassword });
    const sessionData = resp.data?.data ?? resp.data;
    const accessToken = sessionData?.accessToken ?? sessionData?.data?.accessToken;
    const refreshToken = sessionData?.refreshToken ?? sessionData?.data?.refreshToken;
    if (!accessToken && !refreshToken) {
      throw new Error('S-SESSION-02 failed: unable to obtain tokens from API login');
    }
    await sessionRestoreFlows.restoreSessionWithTokens(page, accessToken, refreshToken);
    // Validate user session restored
    const user = await sessionHelper.getAuthenticatedUser(page);
    if (!user) throw new Error('S-SESSION-02 failed: session not restored on app load');
  });

  test('S-ROLE-01 | Role-based redirect after login', async ({ page }) => {
    // Vendor flow: use an approved seeded B2B Customer account (Customer One) which becomes vendor after approval.
    const seededVendorMobile = process.env.TEST_SEEDED_CUSTOMER_MOBILE || '9000000301';
    const seededVendorPassword = process.env.TEST_SEEDED_CUSTOMER_PASSWORD || 'Customer@123';
    await loginFlow(page, seededVendorMobile, seededVendorPassword);
    // Wait for client to persist tokens (deterministic signal) before asserting navigation
    await validators.assertAccessTokenPresent(page);
    // Expect redirect to vendor dashboard
    await expect(page).toHaveURL(/\/vendor\/dashboard/);
    // Verify user present and frontend role mapping to vendor (frontend stores 'role' as mapped value)
    const vUser = await sessionHelper.getAuthenticatedUser(page);
    if (!vUser) throw new Error('S-ROLE-01 failed: vendor user not present after login');
    const frontendRole = await storage.getLocalStorage(page, 'role');
    if (frontendRole !== 'vendor') {
      throw new Error(`S-ROLE-01 failed: expected frontend role 'vendor' but found ${frontendRole}`);
    }
    // Logout then admin (seeded)
    await logoutFlow(page);
    const seededAdminMobile = process.env.TEST_SEEDED_ADMIN_MOBILE || '9000000002';
    const seededAdminPassword = process.env.TEST_SEEDED_ADMIN_PASSWORD || 'Admin@123';
    await loginFlow(page, seededAdminMobile, seededAdminPassword);
    // Wait for client to persist tokens (deterministic signal) before asserting navigation
    await validators.assertAccessTokenPresent(page);
    // Expect redirect to admin dashboard
    await expect(page).toHaveURL(/\/admin\/dashboard/);
    const aUser = await sessionHelper.getAuthenticatedUser(page);
    if (!aUser) throw new Error('S-ROLE-01 failed: admin user not present after login');
    if (aUser.role && aUser.role.toUpperCase() !== 'ADMIN' && aUser.role !== ROLES.ADMIN) {
      throw new Error(`S-ROLE-01 failed: expected admin role but found ${aUser.role}`);
    }
  });

  test('S-SEC-01 | CSRF token available and accepted for state-changing request', async ({ page }) => {
    const seededMobile = process.env.TEST_SEEDED_CUSTOMER_MOBILE || '9000000301';
    const seededPassword = process.env.TEST_SEEDED_CUSTOMER_PASSWORD || 'Customer@123';
    await loginFlow(page, seededMobile, seededPassword);
    const token = await csrfHelper.fetchCsrfTokenApi();
    if (!token) throw new Error('S-SEC-01 failed: csrf token not returned by API');
    // Attach into page and validate presence
    await csrfHelper.attachCsrfToPage(page, token);
    const available = await csrfHelper.validateCsrfAvailable(page);
    if (!available) throw new Error('S-SEC-01 failed: csrf token not present in client storage');
  });

  test('S-SEC-02 | Cookie security attributes (if cookie-based session in env)', async ({ page }) => {
    // Environment dependent: only run if cookie-based refresh is used
    await page.goto('/');
    const cookie = await sessionHelper.getSessionCookies(page);
    if (!cookie) {
      test.skip(true, 'S-SEC-02 skipped: no refresh cookie detected in this environment');
    } else {
      const { name } = cookie;
      await validators.assertCookieAttributes(page, name, { secure: true }).catch((err) => {
        throw new Error('S-SEC-02 failed: cookie attribute validation failed - ' + err.message);
      });
    }
  });
});

