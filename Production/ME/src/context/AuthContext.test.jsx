import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AuthProvider, useAuth } from './AuthContext';
import authService from '../services/authService';

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
  });

  it('login stores tokens and mapped role', async () => {
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
    expect(localStorage.getItem('accessToken')).toBe('access-token');
    expect(localStorage.getItem('refreshToken')).toBe('refresh-token');
    expect(localStorage.getItem('csrfToken')).toBe('csrf-token');
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
    ).rejects.toThrow('Unable to sign in. Please check your credentials and try again.');
  });

  it('register creates pending admin via API', async () => {
    authService.register.mockResolvedValue({
      data: {
        user: {
          _id: 'admin-1',
          name: 'Test Admin',
          email: 'admin@example.com',
          mobile: '9876543210',
          role: 'ADMIN',
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
        name: 'Test Admin',
        email: 'admin@example.com',
        password: 'password',
        phone: '9876543210',
        role: 'admin',
      });
    });

    expect(authService.register).toHaveBeenCalledWith({
      name: 'Test Admin',
      email: 'admin@example.com',
      mobile: '9876543210',
      password: 'password',
      role: 'ADMIN',
    });
    expect(response.success).toBe(true);
    expect(response.status).toBe('PENDING');
  });

  it('logout clears auth state and calls API', async () => {
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

    await act(async () => {
      await result.current.logout();
    });

    expect(authService.logout).toHaveBeenCalledWith('refresh-token');
    expect(result.current.user).toBeNull();
    expect(result.current.role).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
    expect(localStorage.getItem('accessToken')).toBeNull();
  });
});
