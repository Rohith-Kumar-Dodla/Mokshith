import axios from 'axios';
import { clearAuthStorage, getAccessToken, getCsrfToken, getRefreshToken, persistSession } from '../utils/authStorage';
import { fetchCsrfToken, isCsrfError } from '../utils/csrf';

const CSRF_HEADER = 'x-csrf-token';
const STATE_CHANGING_METHODS = ['post', 'put', 'patch', 'delete'];

const configuredApiBaseUrl = import.meta.env.VITE_API_BASE_URL;
// Support runtime-injected global (window.__BACKEND_URL__) for platforms where build-time env is unavailable
const runtimeBackendUrl = typeof window !== 'undefined' ? window.__BACKEND_URL__ : undefined;
const API_BASE_URL =
  configuredApiBaseUrl || runtimeBackendUrl || (import.meta.env.PROD ? '' : 'http://localhost:5000/api/v1');

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((promise) => {
    if (error) {
      promise.reject(error);
    } else {
      promise.resolve(token);
    }
  });
  failedQueue = [];
};

const PUBLIC_PATHS = ['/', '/login', '/register', '/forgot-password', '/reset-password'];

const isPublicPath = (pathname) => PUBLIC_PATHS.includes(pathname);

const redirectToLogin = () => {
  clearAuthStorage();
  const { pathname } = window.location;
  if (isPublicPath(pathname) || pathname === '/login') {
    return;
  }
  window.location.href = '/login';
};

api.interceptors.request.use(
  async (config) => {
    if (import.meta.env.PROD && !configuredApiBaseUrl && !runtimeBackendUrl) {
      // Provide a clearer runtime error to help ops/debugging in production
      console.error('API base URL not configured. Set VITE_API_BASE_URL at build-time or window.__BACKEND_URL__ at runtime.');
      return Promise.reject(new Error('VITE_API_BASE_URL is not configured for this deployment'));
    }

    const token = getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }

    const method = config.method?.toLowerCase();
    const isStateChanging = method && STATE_CHANGING_METHODS.includes(method);
    const isCsrfEndpoint = config.url?.includes('/auth/csrf-token');

    if (isStateChanging && !isCsrfEndpoint) {
      const csrfToken = await fetchCsrfToken(api, !getCsrfToken());
      if (csrfToken) {
        config.headers[CSRF_HEADER] = csrfToken;
      }
    }

    if (config.data instanceof FormData) {
      config.timeout = Math.max(config.timeout || 0, 60000);
    }

    // TEMP LOG: trace outgoing requests for duplicate detection (only in non-production)
    if (import.meta.env.DEV) {
      try {
        console.debug('API request', {
          url: config.url,
          method: config.method,
          headers: config.headers,
          data: config.data,
        });
      } catch (e) {
        // ignore
      }
    }

    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const status = error.response?.status;
    const requestUrl = originalRequest?.url || '';

    const backendCode = error.response?.data?.error?.code;
    if (backendCode === 'SESSION_REPLACED') {
      localStorage.setItem('session_replaced', JSON.stringify({
        message: error.response?.data?.message || 'Your account was logged in from another device. Please sign in again.',
        ts: Date.now()
      }));
      clearAuthStorage();
      redirectToLogin();
      return Promise.reject(error);
    }

    if (isCsrfError(error) && originalRequest && !originalRequest._csrfRetry) {
      originalRequest._csrfRetry = true;
      const csrfToken = await fetchCsrfToken(api, true);
      if (csrfToken) {
        originalRequest.headers[CSRF_HEADER] = csrfToken;
        return api(originalRequest);
      }
    }

    if (
      status !== 401 ||
      !originalRequest ||
      originalRequest._retry ||
      requestUrl.includes('/auth/login') ||
      requestUrl.includes('/auth/refresh-token')
    ) {
      // If this is a 403 to analytics or payment-finance endpoints, return neutral response instead of throwing
      if (status === 403 && originalRequest && (
        requestUrl.includes('/analytics') ||
        requestUrl.includes('/payments/bank-transfer') ||
        requestUrl.includes('/payments/bank-transfer') // duplicate intentionally safe
      )) {
        return Promise.resolve({ data: null, status: 200 });
      }
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      }).then((token) => {
        originalRequest.headers.Authorization = `Bearer ${token}`;
        return api(originalRequest);
      });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    const refreshToken = getRefreshToken();
    if (!refreshToken) {
      processQueue(error, null);
      isRefreshing = false;
      redirectToLogin();
      return Promise.reject(error);
    }

    try {
      const response = await api.post('/auth/refresh-token', { refreshToken });
      const payload = response.data?.data ?? {};
      const { accessToken, refreshToken: newRefreshToken } = payload;

      persistSession({
        accessToken,
        refreshToken: newRefreshToken,
      });

      await fetchCsrfToken(api, true);

      processQueue(null, accessToken);
      originalRequest.headers.Authorization = `Bearer ${accessToken}`;
      return api(originalRequest);
    } catch (refreshError) {
      processQueue(refreshError, null);
      redirectToLogin();
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

export default api;
