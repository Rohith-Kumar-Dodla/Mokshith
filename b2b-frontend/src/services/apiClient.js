import axios from "axios";
import { store } from "../app/store.js";
import { updateToken, logout } from "../modules/auth/authSlice.js";

const getBaseURL = () => {
  const envUrl = import.meta.env.VITE_API_URL || "http://localhost:5000";
  // Remove trailing slash
  const cleanUrl = envUrl.replace(/\/$/, '');
  
  // 🔥 Fix: If the URL already contains /api/v1, don't append it again
  if (cleanUrl.endsWith('/api/v1')) {
    return cleanUrl;
  }
  
  return `${cleanUrl}/api/v1`;
};

const API_V1_URL = getBaseURL();
const API_BASE_URL = API_V1_URL.replace(/\/api\/v1$/, '');

const apiClient = axios.create({
  baseURL: API_V1_URL,
  timeout: 30000,
  withCredentials: true, // 🔥 Fix: Send cookies with requests
  headers: {
    "Content-Type": "application/json",
  },
});

export { API_BASE_URL };

// Track if a refresh is already in progress to avoid multiple refresh calls
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Add a request interceptor to add the auth token to every request
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    const csrfToken = localStorage.getItem("csrfToken");
    if (csrfToken) {
      config.headers["x-csrf-token"] = csrfToken;
    }
    
    // 🔥 Fix: For FormData, we must ensure Content-Type is NOT set manually
    // This allows the browser to set it correctly with the boundary
    if (config.data instanceof FormData) {
      console.log('📡 Interceptor: FormData detected, removing Content-Type header');
      
      // Handle both uppercase and lowercase versions
      if (config.headers) {
        if (typeof config.headers.delete === 'function') {
          config.headers.delete("Content-Type");
          config.headers.delete("content-type");
        } else {
          delete config.headers["Content-Type"];
          delete config.headers["content-type"];
        }
      }
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle token refresh and common errors
apiClient.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    const originalRequest = error.config;

    // Handle 401 Unauthorized
    if (error.response?.status === 401 && !originalRequest._retry) {
      // If the request was to refresh token itself, don't retry!
      if (originalRequest.url.includes('/auth/refresh-token')) {
        store.dispatch(logout());
        window.location.href = "/login";
        return Promise.reject(error);
      }

      // If token refresh is already in progress, queue this request
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return apiClient(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = localStorage.getItem("refreshToken");

      if (!refreshToken) {
        // No refresh token, clear auth and redirect
        store.dispatch(logout());
        window.location.href = "/login";
        return Promise.reject(error);
      }

      // Try to refresh the token
      return apiClient
        .post("/auth/refresh-token", { token: refreshToken })
        .then((response) => {
          const newAccessToken = response.data?.accessToken || response.accessToken;

          if (newAccessToken) {
            store.dispatch(updateToken(newAccessToken));
            originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
            processQueue(null, newAccessToken);
            return apiClient(originalRequest);
          } else {
            throw new Error("No access token in response");
          }
        })
        .catch((err) => {
          processQueue(err, null);
          store.dispatch(logout());
          window.location.href = "/login";
          return Promise.reject(err);
        })
        .finally(() => {
          isRefreshing = false;
        });
    }

    // Handle other errors
    if (error.response?.status === 403) {
      console.warn('403 Forbidden - Access Denied', originalRequest.url);
    }

    // 🔥 Fix: Reject with the full error object so services can access status/data
    return Promise.reject(error);
  }
);

export default apiClient;
