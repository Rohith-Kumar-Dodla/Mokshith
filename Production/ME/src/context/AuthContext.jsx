import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import authService from '../services/authService';
import api from '../services/api';
import { mapLoginError } from '../utils/loginErrorMapper';
import { getUserFacingErrorMessage } from '../utils/apiResponse';
import { clearAuthStorage, getCsrfToken, getRefreshToken, persistSession } from '../utils/authStorage';
import { fetchCsrfToken } from '../utils/csrf';
import { mapBackendRoleToFrontend } from '../utils/roleMap';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

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

  /** Single-flight CSRF via shared csrf.js (never a parallel authService fetch). */
  const ensureCsrfToken = useCallback(async (force = false) => {
    await fetchCsrfToken(api, force);
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
        await ensureCsrfToken(true);
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

  // Listen for forced session replacement (another device). Do not broadcast local logout.
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key !== 'session_replaced') return;
      clearSession();
      try {
        const payload = JSON.parse(localStorage.getItem('session_replaced'));
        const message =
          payload?.message ||
          'Your account was signed in from another device. Please sign in again.';
        window.alert(message);
      } catch {
        window.alert('Your account was signed in from another device. Please sign in again.');
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
        return { requires2FA: true, userId: payload.userId, message: payload.message };
      }

      const { user: sessionUser, accessToken, refreshToken, csrfToken } = payload;
      return applyUserSession(sessionUser, { accessToken, refreshToken, csrfToken });
    } catch (error) {
      throw new Error(mapLoginError(error));
    }
  };

  const verify2FALogin = async (userId, code) => {
    try {
      const response = await authService.verify2FALogin({ userId, code });
      const payload = response.data;
      const { user: sessionUser, accessToken, refreshToken, csrfToken } = payload;
      return applyUserSession(sessionUser, { accessToken, refreshToken, csrfToken });
    } catch (error) {
      throw new Error(getUserFacingErrorMessage(error, 'Invalid verification code'));
    }
  };

  const register = async (userData) => {
    try {
      const mobile = (userData.phone || userData.mobile || '').replace(/\D/g, '');

      const response = await authService.register({
        name: userData.ownerName || userData.name,
        businessName: userData.businessName,
        ownerName: userData.ownerName || userData.name,
        email: userData.email,
        mobile,
        password: userData.password,
        gstNumber: userData.gstNumber || undefined,
        address: userData.address,
      });

      const payload = response.data ?? response;
      const registeredUser = payload.user ?? payload;

      return {
        success: true,
        user: registeredUser,
        status: registeredUser?.status,
        role: 'vendor',
      };
    } catch (error) {
      throw new Error(
        getUserFacingErrorMessage(error, 'Unable to create your account. Please try again.')
      );
    }
  };

  const logout = async () => {
    const refreshToken = getRefreshToken();

    try {
      if (refreshToken) {
        if (!getCsrfToken()) {
          await ensureCsrfToken(true);
        }
        await authService.logout(refreshToken);
      }
    } catch {
      // Always clear local session even if API logout fails.
    } finally {
      // Current tab only — never signal or clear other tabs.
      clearSession();
    }
  };

  const value = {
    user,
    role,
    isAuthenticated,
    loading,
    login,
    verify2FALogin,
    logout,
    register,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
