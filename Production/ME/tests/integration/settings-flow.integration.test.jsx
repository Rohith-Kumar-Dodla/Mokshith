import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useSettings } from '../../src/hooks/useSettings';
import authService from '../../src/services/authService';
import settingsService from '../../src/services/settingsService';

vi.mock('../../src/services/authService', () => ({
  default: {
    getCurrentUser: vi.fn(),
    getSessions: vi.fn(),
    updateProfile: vi.fn(),
    changePassword: vi.fn(),
  },
}));

vi.mock('../../src/services/settingsService', () => ({
  default: {
    getSettings: vi.fn(),
    updateSettings: vi.fn(),
  },
}));

describe('Settings Flow Integration', () => {
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
    settingsService.updateSettings.mockResolvedValue({
      data: { preferences: { theme: 'dark' } },
    });
  });

  it('loads and updates notification preferences', async () => {
    const { result } = renderHook(() => useSettings());

    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.saveSettings({
        notifications: { email: false, sms: true, push: true, orders: true },
        preferences: result.current.settings.preferences,
      });
    });

    expect(settingsService.updateSettings).toHaveBeenCalledWith(
      expect.objectContaining({
        notifications: expect.objectContaining({ email: false }),
      })
    );
  });

  it('updates profile through auth service', async () => {
    authService.updateProfile.mockResolvedValue({
      data: { name: 'Updated Vendor', email: 'vendor@test.com' },
    });

    const { result } = renderHook(() => useSettings());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.saveProfile({
        name: 'Updated Vendor',
        email: 'vendor@test.com',
        mobile: '9876543210',
        companyName: 'Fresh Mart',
        address: '12 Market Road',
        ownerName: 'Updated Vendor',
      });
    });

    expect(authService.updateProfile).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Updated Vendor' })
    );
  });
});
