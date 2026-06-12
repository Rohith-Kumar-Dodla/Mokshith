/**
 * Mirrors backend AUTH_STRICT_MODE for client-side validation messages.
 *
 * RE-ENABLE BEFORE PRODUCTION: set VITE_AUTH_STRICT_MODE=true in .env
 */
export const isAuthStrictMode = () => import.meta.env.VITE_AUTH_STRICT_MODE === 'true';

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
