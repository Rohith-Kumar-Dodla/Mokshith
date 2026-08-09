import { describe, it, expect } from 'vitest';
import { getUserFacingErrorMessage } from './apiResponse';
import { mapLoginError } from './loginErrorMapper';

describe('getUserFacingErrorMessage', () => {
  it('never surfaces Axios timeout internals', () => {
    const error = { message: 'timeout of 10000ms exceeded', code: 'ECONNABORTED' };
    expect(getUserFacingErrorMessage(error)).toMatch(/took too long/i);
    expect(getUserFacingErrorMessage(error)).not.toMatch(/timeout of/i);
  });

  it('never surfaces Mongo-looking backend messages', () => {
    const error = {
      response: {
        status: 500,
        data: { message: 'MongoServerSelectionError: connection timed out' },
        headers: { 'x-correlation-id': 'abc-123' },
      },
    };
    const msg = getUserFacingErrorMessage(error);
    expect(msg).not.toMatch(/Mongo/i);
    expect(msg).toMatch(/Reference ID: abc-123|Something went wrong/i);
  });

  it('maps 403 CSRF to a safe refresh message', () => {
    const error = {
      response: {
        status: 403,
        data: { message: 'CSRF token missing' },
      },
    };
    expect(getUserFacingErrorMessage(error)).toMatch(/security session/i);
    expect(getUserFacingErrorMessage(error)).not.toMatch(/CSRF token missing/i);
  });

  it('maps permission 403 without CSRF', () => {
    const error = {
      response: {
        status: 403,
        data: { message: 'Forbidden' },
      },
    };
    expect(getUserFacingErrorMessage(error)).toMatch(/permission/i);
  });
});

describe('mapLoginError', () => {
  it('keeps account-not-found distinct', () => {
    expect(
      mapLoginError({ response: { status: 404, data: { error: { code: 'ACCOUNT_NOT_FOUND' } } } })
    ).toBe('No account found');
  });

  it('does not disguise outages as invalid credentials', () => {
    expect(mapLoginError({ message: 'Network Error' })).toMatch(/reach the server/i);
    expect(mapLoginError({ response: { status: 503, data: { message: 'down' } } })).toMatch(
      /trouble signing you in/i
    );
  });
});
