/**
 * Mirrors backend AUTH_STRICT_MODE for client-side validation messages.
 * Production builds default to strict unless VITE_AUTH_STRICT_MODE=false.
 */
export const isAuthStrictMode = () => {
  if (import.meta.env.VITE_AUTH_STRICT_MODE === 'true') {
    return true;
  }
  if (import.meta.env.VITE_AUTH_STRICT_MODE === 'false') {
    return false;
  }
  return import.meta.env.PROD;
};

export const getPasswordMinLength = () => (isAuthStrictMode() ? 12 : 6);

export const getPasswordRequirementsText = () =>
  isAuthStrictMode()
    ? 'Password must be at least 12 characters with uppercase, lowercase, numbers and symbols'
    : 'Password must be at least 6 characters';

export const validatePasswordLength = (password) => {
  const minLength = getPasswordMinLength();
  if (!password) {
    return 'Password is required';
  }
  if (password.length < minLength) {
    return `Password must be at least ${minLength} characters`;
  }
  return null;
};
