import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import authService from '../services/authService';
import { clearAuthStorage, getCsrfToken, getRefreshToken, persistSession } from '../utils/authStorage';
import { mapBackendRoleToFrontend, mapFrontendRoleToBackend } from '../utils/roleMap';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

const getErrorMessage = (error, fallback) =>
  error?.response?.data?.message || error?.message || fallback;

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  const applyUserSession = useCallback((sessionUser, tokens = {}) => {
    const frontendRole = mapBackendRoleToFrontend(sessionUser?.role);

    if (!frontendRole) {
      throw new Error('Unsupported user role');
    }

    persistSession({
      ...tokens,
      user: sessionUser,
      role: frontendRole,
    });

    setUser(sessionUser);
    setRole(frontendRole);
    setIsAuthenticated(true);

    return { user: sessionUser, role: frontendRole };
  }, []);

  const clearSession = useCallback(() => {
    clearAuthStorage();
    setUser(null);
    setRole(null);
    setIsAuthenticated(false);
  }, []);

  const fetchCurrentUser = useCallback(async () => {
    const response = await authService.getCurrentUser();
    return response.data;
  }, []);

  const ensureCsrfToken = useCallback(async () => {
    if (getCsrfToken()) {
      return;
    }

    try {
      const response = await authService.getCsrfToken();
      const token = response?.data?.csrfToken ?? response?.csrfToken;
      if (token) {
        persistSession({ csrfToken: token });
      }
    } catch {
      // CSRF will be required again on next login.
    }
  }, []);

  const restoreSession = useCallback(async () => {
    const refreshToken = getRefreshToken();
    if (!refreshToken) {
      clearSession();
      return;
    }

    try {
      const currentUser = await fetchCurrentUser();
      applyUserSession(currentUser);
      await ensureCsrfToken();
    } catch {
      try {
        const refreshResponse = await authService.refreshToken(refreshToken);
        const { accessToken, refreshToken: newRefreshToken, user: refreshedUser } =
          refreshResponse.data;

        persistSession({ accessToken, refreshToken: newRefreshToken });

        const currentUser = refreshedUser || (await fetchCurrentUser());
        applyUserSession(currentUser, { accessToken, refreshToken: newRefreshToken });
        await ensureCsrfToken();
      } catch {
        clearSession();
      }
    }
  }, [applyUserSession, clearSession, ensureCsrfToken, fetchCurrentUser]);

  useEffect(() => {
    const initializeAuth = async () => {
      await restoreSession();
      setLoading(false);
    };

    initializeAuth();
  }, [restoreSession]);

  // Multi-tab synchronization: listen for logout or session replacement events
  useEffect(() => {
    const onStorage = (e) => {
      if (!e.key) return;
      if (e.key === 'logout') {
        clearSession();
      } else if (e.key === 'session_replaced') {
        // Clear session and inform user
        clearSession();
        try {
          const payload = JSON.parse(localStorage.getItem('session_replaced'));
          const message = payload?.message || 'Your account was logged in from another device. Please sign in again.';
          // Use a simple alert to notify (no UI changes requested)
          window.alert(message);
        } catch {
          window.alert('Your account was logged in from another device. Please sign in again.');
        }
      }
    };

    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [clearSession]);

  const login = async (mobile, password) => {
    try {
      const response = await authService.login({ mobile, password });
      const payload = response.data;

      if (payload.requires2FA) {
        throw new Error(payload.message || '2FA verification required');
      }

      const { user: sessionUser, accessToken, refreshToken, csrfToken } = payload;
      return applyUserSession(sessionUser, { accessToken, refreshToken, csrfToken });
    } catch (error) {
      throw new Error(getErrorMessage(error, 'Invalid credentials'));
    }
  };

  const register = async (userData) => {
    try {
      const backendRole = mapFrontendRoleToBackend(userData.role);
      const mobile = (userData.phone || userData.mobile || '').replace(/\D/g, '');

      const response = await authService.register({
        name: userData.name,
        email: userData.email,
        mobile,
        password: userData.password,
        role: backendRole,
      });

      const payload = response.data ?? response;
      const registeredUser = payload.user ?? payload;

      return {
        success: true,
        user: registeredUser,
        status: registeredUser?.status,
        role: userData.role,
      };
    } catch (error) {
      throw new Error(getErrorMessage(error, 'Registration failed'));
    }
  };

  const logout = async () => {
    const refreshToken = getRefreshToken();

    try {
      if (refreshToken) {
        if (!getCsrfToken()) {
          try {
            const csrfResponse = await authService.getCsrfToken();
            const csrfPayload = csrfResponse.data ?? csrfResponse;
            if (csrfPayload?.csrfToken) {
              persistSession({ csrfToken: csrfPayload.csrfToken });
            }
          } catch {
            // Continue with local logout if CSRF refresh fails.
          }
        }
        await authService.logout(refreshToken);
      }
    } catch {
      // Always clear local session even if API logout fails.
    } finally {
      // Notify other tabs
      try {
        localStorage.setItem('logout', Date.now().toString());
      } catch {}
      clearSession();
    }
  };

  const value = {
    user,
    role,
    isAuthenticated,
    loading,
    login,
    logout,
    register,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
