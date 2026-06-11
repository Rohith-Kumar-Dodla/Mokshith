import React from 'react';
import { vi } from 'vitest';

// Mock useAuth hook
export const mockUseAuth = vi.fn();

export const AuthContext = React.createContext({
  user: null,
  login: vi.fn(),
  logout: vi.fn(),
  register: vi.fn(),
  loading: false,
});

export const MockAuthProvider = ({ children, value = {} }) => {
  const defaultValue = {
    user: null,
    login: vi.fn(),
    logout: vi.fn(),
    register: vi.fn(),
    loading: false,
    ...value,
  };

  return <AuthContext.Provider value={defaultValue}>{children}</AuthContext.Provider>;
};

export const useAuth = () => React.useContext(AuthContext);

export const mockAuthContext = (user = null) => ({
  user,
  login: vi.fn(),
  logout: vi.fn(),
  register: vi.fn(),
  loading: false,
});
