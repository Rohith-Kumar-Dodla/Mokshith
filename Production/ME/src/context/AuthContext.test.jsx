import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AuthProvider, useAuth } from './AuthContext';
import authService from '../services/authService';
import {
  getAccessToken,
  getAuthSessionKey,
  getCsrfToken,
  getRefreshToken,
  getTabSessionId,
} from '../utils/authStorage';

vi.mock('../services/authService', () => ({
  default: {
    login: vi.fn(),
    logout: vi.fn(),
    register: vi.fn(),
    getCurrentUser: vi.fn(),
    refreshToken: vi.fn(),
    getCsrfToken: vi.fn(),
  },
}));

describe('AuthContext', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    vi.clearAllMocks();
    authService.getCurrentUser.mockRejectedValue(new Error('No session'));
  });

  it('provides default auth state when no session exists', async () => {
    const { result } = renderHook(() => useAuth(), {
      wrapper: AuthProvider,
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.user).toBeNull();
    expect(result.current.role).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
  });

  it('restores session from current user on mount', async () => {
    authService.getCurrentUser.mockResolvedValue({
      data: {
        _id: '123',
        name: 'Test User',
        mobile: '9876543210',
        role: 'ADMIN',
      },
    });

    localStorage.setItem('refreshToken', 'refresh-token');

    const { result } = renderHook(() => useAuth(), {
      wrapper: AuthProvider,
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.role).toBe('admin');
    expect(result.current.user.name).toBe('Test User');
    expect(getRefreshToken()).toBe('refresh-token');
    expect(localStorage.getItem(getAuthSessionKey())).toBeTruthy();
  });

  it('login stores tokens in the current tab session only', async () => {
    authService.login.mockResolvedValue({
      data: {
        user: {
          _id: '123',
          name: 'Test User',
          mobile: '9876543210',
          role: 'ADMIN',
        },
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        csrfToken: 'csrf-token',
      },
    });

    const { result } = renderHook(() => useAuth(), {
      wrapper: AuthProvider,
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.login('9876543210', 'Password123!');
    });

    expect(authService.login).toHaveBeenCalledWith({
      mobile: '9876543210',
      password: 'Password123!',
    });
    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.role).toBe('admin');
    expect(getAccessToken()).toBe('access-token');
    expect(getRefreshToken()).toBe('refresh-token');
    expect(getCsrfToken()).toBe('csrf-token');
    expect(localStorage.getItem('accessToken')).toBeNull();
    expect(sessionStorage.getItem('tabSessionId')).toBe(getTabSessionId());
  });

  it('login rejects with API error message', async () => {
    authService.login.mockRejectedValue({
      response: { data: { message: 'Invalid credentials' } },
    });

    const { result } = renderHook(() => useAuth(), {
      wrapper: AuthProvider,
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await expect(
      act(async () => {
        await result.current.login('9876543210', 'wrong');
      })
    ).rejects.toThrow('Invalid credentials');
  });

  it('register creates pending vendor via API', async () => {
    authService.register.mockResolvedValue({
      data: {
        user: {
          _id: 'vendor-1',
          name: 'Test Vendor',
          email: 'vendor@example.com',
          mobile: '9876543210',
          role: 'VENDOR',
          status: 'PENDING',
        },
      },
    });

    const { result } = renderHook(() => useAuth(), {
      wrapper: AuthProvider,
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const response = await act(async () => {
      return await result.current.register({
        businessName: 'Test Business',
        ownerName: 'Test Vendor',
        email: 'vendor@example.com',
        password: 'password',
        phone: '9876543210',
        address: {
          line1: '123 Street',
          area: 'Area',
          city: 'City',
          district: 'District',
          state: 'State',
          country: 'India',
          pincode: '500001',
        },
      });
    });

    expect(authService.register).toHaveBeenCalledWith({
      name: 'Test Vendor',
      businessName: 'Test Business',
      ownerName: 'Test Vendor',
      email: 'vendor@example.com',
      mobile: '9876543210',
      password: 'password',
      gstNumber: undefined,
      address: {
        line1: '123 Street',
        area: 'Area',
        city: 'City',
        district: 'District',
        state: 'State',
        country: 'India',
        pincode: '500001',
      },
    });
    expect(response.success).toBe(true);
    expect(response.status).toBe('PENDING');
    expect(response.role).toBe('vendor');
  });

  it('logout clears only the current tab session', async () => {
    authService.login.mockResolvedValue({
      data: {
        user: { _id: '123', name: 'Test User', role: 'ADMIN' },
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        csrfToken: 'csrf-token',
      },
    });
    authService.logout.mockResolvedValue({ success: true });

    const { result } = renderHook(() => useAuth(), {
      wrapper: AuthProvider,
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.login('9876543210', 'Password123!');
    });

    const sessionKey = getAuthSessionKey();

    await act(async () => {
      await result.current.logout();
    });

    expect(authService.logout).toHaveBeenCalledWith('refresh-token');
    expect(result.current.user).toBeNull();
    expect(result.current.role).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
    expect(localStorage.getItem(sessionKey)).toBeNull();
    expect(sessionStorage.getItem('tabSessionId')).toBeNull();
    // Creating a fresh tab id for reads after logout must not revive the old session.
    expect(getAccessToken()).toBeNull();
    expect(localStorage.getItem(sessionKey)).toBeNull();
  });
});
