import type { Page } from '@playwright/test';

export async function getCookiesForUrl(page: Page, url = '') {
  // Playwright's context cookies getter expects a URL or will return all cookies
  const context = page.context();
  if (url) {
    return await context.cookies(url);
  }
  return await context.cookies();
}

export async function findCookie(page: Page, name: string, url = '') {
  const cookies = await getCookiesForUrl(page, url);
  return cookies.find((c) => c.name === name) ?? null;
}

export default { getCookiesForUrl, findCookie };

