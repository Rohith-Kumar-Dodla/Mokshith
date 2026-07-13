import type { Page } from '@playwright/test';

export async function getLocalStorage(page: Page, key: string) {
  return await page.evaluate((k) => localStorage.getItem(k), key);
}

export async function setLocalStorage(page: Page, key: string, value: string) {
  return await page.evaluate(
    ([k, v]) => {
      localStorage.setItem(k, v);
    },
    [key, value]
  );
}

export async function clearLocalStorage(page: Page) {
  return await page.evaluate(() => localStorage.clear());
}

export default { getLocalStorage, setLocalStorage, clearLocalStorage };

