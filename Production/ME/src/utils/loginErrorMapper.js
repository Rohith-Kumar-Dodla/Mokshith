import { getUserFacingErrorMessage } from './apiResponse';

/**
 * Map login failures to safe user-facing auth messages.
 * Distinguishes network/outage from invalid credentials without leaking internals.
 */
export function mapLoginError(error) {
  const code = error?.response?.data?.error?.code || error?.response?.data?.code;
  const status = error?.response?.status;

  if (code === 'ACCOUNT_NOT_FOUND' || status === 404) {
    return 'No account found';
  }

  if (!error?.response) {
    return "We couldn't reach the server. Please check your connection and try again.";
  }

  if (status === 429) {
    return 'Too many sign-in attempts. Please wait a moment and try again.';
  }

  if (status >= 500) {
    return "We're having trouble signing you in right now. Please try again shortly.";
  }

  if (status === 401 || status === 400) {
    return 'Unable to sign in. Please check your credentials and try again.';
  }

  return getUserFacingErrorMessage(error, 'Unable to sign in. Please check your credentials and try again.');
}
