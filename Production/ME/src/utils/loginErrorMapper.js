import { getUserFacingErrorMessage } from './apiResponse';

const DEFAULT_MAINTENANCE_MESSAGE =
  'The platform is currently under maintenance. Please try again later.';

const FRIENDLY_MAINTENANCE_MESSAGE =
  'The platform is currently under maintenance.\n\nBrowsing is available, but changes are temporarily disabled.\n\nPlease try again later.';

/**
 * Map login failures to safe user-facing auth messages.
 * Distinguishes network/outage from invalid credentials without leaking internals.
 */
export function mapLoginError(error) {
  const message = error?.response?.data?.message;
  const code = error?.response?.data?.error?.code || error?.response?.data?.code;
  const status = error?.response?.status;

  if (code === 'ACCOUNT_PENDING_APPROVAL' || code === 'ACCOUNT_REJECTED' || code === 'ACCOUNT_INACTIVE') {
    return message || 'Your account is not active yet.';
  }

  if (message && status === 403) {
    return message;
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

  if (code === 'INVALID_CREDENTIALS' || status === 401 || status === 404) {
    return 'Invalid credentials';
  }

  if (status === 400) {
    return 'Unable to sign in. Please check your credentials and try again.';
  }

  return getUserFacingErrorMessage(error, 'Invalid credentials');
}

export function mapMaintenanceError(error) {
  const code = error?.response?.data?.error?.code;
  const status = error?.response?.status;
  const message = error?.response?.data?.message;

  if (status === 503 || code === 'MAINTENANCE_MODE') {
    return message || FRIENDLY_MAINTENANCE_MESSAGE;
  }

  return null;
}

export function getFriendlyMaintenanceMessage(customMessage) {
  if (customMessage?.trim()) {
    return customMessage.trim();
  }
  return FRIENDLY_MAINTENANCE_MESSAGE;
}

export { DEFAULT_MAINTENANCE_MESSAGE, FRIENDLY_MAINTENANCE_MESSAGE };
