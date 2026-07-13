// Centralized selectors for Authentication module (based on actual frontend sources)
export const AuthSelectors = {
  // Login page
  login: {
    mobileInput: 'input[name="mobile"], input[placeholder*="mobile"], input[type="tel"]',
    passwordInput: 'input[name="password"], input[placeholder*="password"], .input-field[type="password"]',
    signInButton: 'button[type="submit"]',
    forgotPasswordLink: 'a[href="/forgot-password"]',
    errorBanner: '.bg-danger, .bg-danger.bg-opacity-10, .bg-danger, .text-danger',
    twoFAVerifyInput: 'input[placeholder*="code"], input[placeholder*="code"], input[type="text"][maxlength]',
    twoFASubmit: 'form button[type="submit"]',
  },

  // Forgot / Reset
  forgot: {
    identifierInput: 'input[placeholder*="email"], input[placeholder*="mobile"], .input-field',
    sendResetButton: 'button[type="submit"]',
    successBanner: '.bg-green-50, .text-green-700',
  },
  reset: {
    newPasswordInput: 'input[placeholder*="new password"], input[placeholder*="password"], .input-field',
    confirmPasswordInput: 'input[placeholder*="Confirm new password"], .input-field',
    resetButton: 'button[type="submit"]',
    successBanner: '.bg-green-50, .text-green-700',
  },

  // Global / session
  navbar: {
    profileMenu: 'nav .profile, .avatar, [data-testid="profile-menu"]',
    logoutButton: 'button[aria-label="Logout"], button:has-text("Logout")',
  },
};

export default AuthSelectors;

