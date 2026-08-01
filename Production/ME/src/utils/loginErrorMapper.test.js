import { describe, it, expect } from 'vitest';
import {
  mapLoginError,
  mapMaintenanceError,
} from './loginErrorMapper';

describe('loginErrorMapper', () => {
  it('maps unknown users to invalid credentials', () => {
    const message = mapLoginError({
      response: { status: 401, data: { error: { code: 'INVALID_CREDENTIALS' } } },
    });
    expect(message).toBe('Invalid credentials');
  });

  it('surfaces pending approval message after correct password', () => {
    const pendingMessage =
      'Your account has been registered successfully. Your account is currently awaiting administrator approval.';
    const message = mapLoginError({
      response: {
        status: 403,
        data: {
          message: pendingMessage,
          error: { code: 'ACCOUNT_PENDING_APPROVAL' },
        },
      },
    });
    expect(message).toBe(pendingMessage);
  });

  it('maps maintenance responses to friendly message', () => {
    const message = mapMaintenanceError({
      response: {
        status: 503,
        data: {
          message: 'The platform is currently under maintenance. Please try again later.',
          error: { code: 'MAINTENANCE_MODE' },
        },
      },
    });
    expect(message).toMatch(/maintenance/i);
  });
});
