import type { Page } from '@playwright/test';
import { decodeJwt } from '../helpers/jwt.helper';
import { findCookie } from '../helpers/cookie.helper';
import storage from '../utils/storage.helper';

export async function assertAccessTokenPresent(page: Page) {
  // Access token stored in localStorage in this app
  const token = await storage.getLocalStorage(page, 'accessToken') || await storage.getLocalStorage(page, 'token');
  if (!token) throw new Error('Validator(assertAccessTokenPresent): expected accessToken in localStorage but none found');
  return decodeJwt(token);
}

export async function assertRefreshTokenPresent(page: Page) {
  const token = await storage.getLocalStorage(page, 'refreshToken');
  if (!token) throw new Error('Validator(assertRefreshTokenPresent): expected refreshToken in localStorage but none found');
  return token;
}

export async function assertCsrfTokenPresent(page: Page) {
  const token = await storage.getLocalStorage(page, 'csrfToken');
  if (!token) throw new Error('Validator(assertCsrfTokenPresent): expected csrfToken in localStorage but none found');
  return token;
}

export async function assertCookieAttributes(page: Page, cookieName: string, options: { secure?: boolean; httpOnly?: boolean; sameSite?: 'Lax' | 'Strict' | 'None' } = {}) {
  const cookie = await findCookie(page, cookieName);
  if (!cookie) throw new Error(`Cookie ${cookieName} not found`);
  if (options.secure && !cookie.secure) throw new Error(`Cookie ${cookieName} not marked secure`);
  if (options.httpOnly && !cookie.httpOnly) throw new Error(`Cookie ${cookieName} not marked HttpOnly`);
  if (options.sameSite && cookie.sameSite !== options.sameSite) throw new Error(`Cookie ${cookieName} SameSite expected ${options.sameSite} found ${cookie.sameSite}`);
  return cookie;
}

export default { assertAccessTokenPresent, assertRefreshTokenPresent, assertCsrfTokenPresent, assertCookieAttributes };

