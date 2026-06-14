import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useSettings } from './useSettings';
import authService from '../services/authService';
import settingsService from '../services/settingsService';

vi.mock('../services/authService', () => ({
  default: {
    getCurrentUser: vi.fn(),
    getSessions: vi.fn(),
    updateProfile: vi.fn(),
    changePassword: vi.fn(),
  },
}));

vi.mock('../services/settingsService', () => ({
  default: {
    getSettings: vi.fn(),
    updateSettings: vi.fn(),
  },
}));

describe('useSettings', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authService.getCurrentUser.mockResolvedValue({
      data: { name: 'Vendor User', email: 'vendor@test.com', mobile: '9876543210' },
    });
    authService.getSessions.mockResolvedValue({ data: [] });
    settingsService.getSettings.mockResolvedValue({
      data: {
        notifications: { email: true, sms: true, push: true, orders: true },
        preferences: { language: 'en', theme: 'light', dashboardLayout: 'default' },
      },
    });
  });

  it('loads profile and settings on mount', async () => {
    const { result } = renderHook(() => useSettings());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.profile?.name).toBe('Vendor User');
    expect(result.current.settings?.preferences.theme).toBe('light');
    expect(authService.getCurrentUser).toHaveBeenCalled();
    expect(settingsService.getSettings).toHaveBeenCalled();
  });

  it('surfaces load errors', async () => {
    settingsService.getSettings.mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useSettings());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toMatch(/network error/i);
  });
});
