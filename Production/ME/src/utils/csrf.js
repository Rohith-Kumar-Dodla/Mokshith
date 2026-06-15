import { getCsrfToken, persistSession } from './authStorage';

let csrfRefreshPromise = null;

/**
 * Fetch a fresh CSRF token from the API (sets matching httpOnly cookie + header token).
 * @param {import('axios').AxiosInstance} apiClient
 * @param {boolean} force - bypass cache and fetch even if local token exists
 */
export async function fetchCsrfToken(apiClient, force = false) {
  if (!force && getCsrfToken()) {
    return getCsrfToken();
  }

  if (csrfRefreshPromise) {
    return csrfRefreshPromise;
  }

  csrfRefreshPromise = apiClient
    .get('/auth/csrf-token')
    .then((response) => {
      const payload = response.data?.data ?? response.data;
      const token = payload?.csrfToken;
      if (token) {
        persistSession({ csrfToken: token });
        return token;
      }
      return getCsrfToken();
    })
    .catch(() => getCsrfToken())
    .finally(() => {
      csrfRefreshPromise = null;
    });

  return csrfRefreshPromise;
}

export function isCsrfError(error) {
  const status = error?.response?.status;
  const message = String(error?.response?.data?.message || '').toLowerCase();
  return status === 403 && message.includes('csrf');
}
