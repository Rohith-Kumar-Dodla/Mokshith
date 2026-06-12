import { describe, it, expect, beforeEach, vi } from 'vitest';
import authService from './authService';
import api from './api';

vi.mock('./api', () => ({
  default: {
    post: vi.fn(),
    get: vi.fn(),
  },
}));

describe('authService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls login endpoint with mobile and password', async () => {
    api.post.mockResolvedValue({ data: { success: true, data: {} } });

    await authService.login({ mobile: '9876543210', password: 'Password123!' });

    expect(api.post).toHaveBeenCalledWith('/auth/login', {
      mobile: '9876543210',
      password: 'Password123!',
    });
  });

  it('calls refresh-token endpoint', async () => {
    api.post.mockResolvedValue({ data: { success: true, data: {} } });

    await authService.refreshToken('refresh-token');

    expect(api.post).toHaveBeenCalledWith('/auth/refresh-token', {
      refreshToken: 'refresh-token',
    });
  });

  it('calls current user endpoint', async () => {
    api.get.mockResolvedValue({ data: { success: true, data: { _id: '1' } } });

    await authService.getCurrentUser();

    expect(api.get).toHaveBeenCalledWith('/users/me');
  });

  it('calls logout endpoint with refresh token', async () => {
    api.post.mockResolvedValue({ data: { success: true, data: {} } });

    await authService.logout('refresh-token');

    expect(api.post).toHaveBeenCalledWith('/auth/logout', {
      refreshToken: 'refresh-token',
    });
  });

  it('calls register endpoint with user payload', async () => {
    api.post.mockResolvedValue({ data: { success: true, data: { user: { status: 'PENDING' } } } });

    await authService.register({
      name: 'Test Admin',
      email: 'admin@example.com',
      mobile: '9876543210',
      password: 'Password123!',
      role: 'ADMIN',
    });

    expect(api.post).toHaveBeenCalledWith('/auth/register', {
      name: 'Test Admin',
      email: 'admin@example.com',
      mobile: '9876543210',
      password: 'Password123!',
      role: 'ADMIN',
    });
  });
});
