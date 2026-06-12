import { describe, it, expect, beforeEach, vi } from 'vitest';
import settingsService from './settingsService';
import api from './api';

vi.mock('./api', () => ({
  default: {
    get: vi.fn(),
    put: vi.fn(),
  },
}));

describe('settingsService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches user settings', async () => {
    api.get.mockResolvedValue({
      data: {
        success: true,
        data: {
          notifications: { email: true, sms: false },
          preferences: { theme: 'dark' },
        },
      },
    });

    const result = await settingsService.getSettings();

    expect(api.get).toHaveBeenCalledWith('/settings');
    expect(result.data.preferences.theme).toBe('dark');
  });

  it('updates user settings', async () => {
    api.put.mockResolvedValue({
      data: {
        success: true,
        data: { preferences: { theme: 'light' } },
      },
    });

    const payload = { preferences: { theme: 'light' } };
    await settingsService.updateSettings(payload);

    expect(api.put).toHaveBeenCalledWith('/settings', payload);
  });
});
