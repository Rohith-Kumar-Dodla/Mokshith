import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AuthProvider, useAuth } from './AuthContext';

describe('AuthContext', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('provides default auth state and loads from localStorage', async () => {
    const { result } = renderHook(() => useAuth(), {
      wrapper: AuthProvider,
    });

    expect(result.current.user).toBeNull();
    expect(result.current.role).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
  });

  it('loads user from localStorage on mount', async () => {
    const mockUser = { id: '123', email: 'test@example.com', name: 'test', role: 'admin' };
    localStorage.setItem('user', JSON.stringify(mockUser));
    localStorage.setItem('role', 'admin');
    localStorage.setItem('isAuthenticated', 'true');

    const { result } = renderHook(() => useAuth(), {
      wrapper: AuthProvider,
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.user).toEqual(mockUser);
    expect(result.current.role).toBe('admin');
    expect(result.current.isAuthenticated).toBe(true);
  });

  it('login with valid credentials', async () => {
    const { result } = renderHook(() => useAuth(), {
      wrapper: AuthProvider,
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.login('test@example.com', 'password', 'admin');
    });

    expect(result.current.user).not.toBeNull();
    expect(result.current.user.email).toBe('test@example.com');
    expect(result.current.user.name).toBe('test');
    expect(result.current.role).toBe('admin');
    expect(result.current.isAuthenticated).toBe(true);
    expect(localStorage.getItem('user')).toBeTruthy();
    expect(localStorage.getItem('role')).toBe('admin');
    expect(localStorage.getItem('isAuthenticated')).toBe('true');
  });

  it('login rejects with invalid credentials', async () => {
    const { result } = renderHook(() => useAuth(), {
      wrapper: AuthProvider,
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await expect(
      act(async () => {
        await result.current.login('', '', '');
      })
    ).rejects.toEqual({ success: false, message: 'Invalid credentials' });

    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
  });

  it('register with valid data', async () => {
    const { result } = renderHook(() => useAuth(), {
      wrapper: AuthProvider,
    });

    const userData = {
      name: 'Test User',
      email: 'test@example.com',
      password: 'password',
      phone: '1234567890',
      role: 'vendor',
    };

    const response = await act(async () => {
      return await result.current.register(userData);
    });

    expect(response.success).toBe(true);
    expect(response.user).not.toBeNull();
    expect(response.user.name).toBe('Test User');
    expect(response.user.email).toBe('test@example.com');
  });

  it('register rejects with invalid data', async () => {
    const { result } = renderHook(() => useAuth(), {
      wrapper: AuthProvider,
    });

    await expect(
      act(async () => {
        await result.current.register({});
      })
    ).rejects.toEqual({ success: false, message: 'Invalid registration data' });
  });

  it('logout clears auth state', async () => {
    const { result } = renderHook(() => useAuth(), {
      wrapper: AuthProvider,
    });

    act(() => {
      result.current.logout();
    });

    expect(result.current.user).toBeNull();
    expect(result.current.role).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
    expect(localStorage.getItem('user')).toBeNull();
    expect(localStorage.getItem('role')).toBeNull();
    expect(localStorage.getItem('isAuthenticated')).toBeNull();
  });
});
