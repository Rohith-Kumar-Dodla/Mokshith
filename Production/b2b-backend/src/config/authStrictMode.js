/**
 * AUTH_STRICT_MODE controls production vs UAT/testing password validation.
 *
 * - true  → full production password policy (default when unset)
 * - false → relaxed policy for UAT/testing only
 *
 * RE-ENABLE BEFORE PRODUCTION: set AUTH_STRICT_MODE=true in .env
 */
export const isAuthStrictMode = () => {
  const value = process.env.AUTH_STRICT_MODE;

  if (value === undefined || value === '') {
    return true;
  }

  return value === 'true' || value === '1';
};

export const AUTH_TESTING_PASSWORD_MIN_LENGTH = 6;
export const AUTH_STRICT_PASSWORD_MIN_LENGTH = 12;

export default { isAuthStrictMode, AUTH_TESTING_PASSWORD_MIN_LENGTH, AUTH_STRICT_PASSWORD_MIN_LENGTH };
