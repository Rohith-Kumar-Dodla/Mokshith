import AppError from '../errors/AppError.js';
import { logger } from '../config/logger.js';
import {
  isAuthStrictMode,
  AUTH_TESTING_PASSWORD_MIN_LENGTH,
  AUTH_STRICT_PASSWORD_MIN_LENGTH,
} from '../config/authStrictMode.js';

/**
 * Strong Password Policy Validator
 * Follows OWASP password guidelines
 */

// RE-ENABLE BEFORE PRODUCTION: strict policy config used when AUTH_STRICT_MODE=true
const PASSWORD_CONFIG = {
  minLength: AUTH_STRICT_PASSWORD_MIN_LENGTH,
  maxLength: 128,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: true,
  preventCommonPasswords: true,
  preventSequentialChars: true,
  preventRepeatedChars: true
};

// Common weak passwords (top 100 from breach databases)
const COMMON_PASSWORDS = new Set([
  'password', '123456', '12345678', 'qwerty', 'abc123', 'monkey', '1234567',
  'letmein', 'trustno1', 'dragon', 'baseball', 'iloveyou', 'master', 'sunshine',
  'ashley', 'bailey', 'passw0rd', 'shadow', '123123', '654321', 'superman',
  'qazwsx', 'michael', 'football', 'welcome', 'jesus', 'ninja', 'mustang',
  'password1', '123456789', '12345', '1234', '111111', '1234567890', '000000',
  'admin', 'root', 'administrator', 'user', 'test', 'guest', 'demo'
]);

/**
 * UAT/testing-only password validation (AUTH_STRICT_MODE=false).
 * RE-ENABLE BEFORE PRODUCTION: set AUTH_STRICT_MODE=true to use validatePasswordStrict().
 */
const validatePasswordRelaxed = (password) => {
  if (!password) {
    throw new AppError('Password is required', 400);
  }

  if (typeof password !== 'string') {
    throw new AppError('Password must be a string', 400);
  }

  if (password.length < AUTH_TESTING_PASSWORD_MIN_LENGTH) {
    throw new AppError(
      `Password must be at least ${AUTH_TESTING_PASSWORD_MIN_LENGTH} characters long`,
      400
    );
  }

  return true;
};

/**
 * Production password validation (AUTH_STRICT_MODE=true).
 * RE-ENABLE BEFORE PRODUCTION: this is the full policy — do not remove.
 */
const validatePasswordStrict = (password, userData = {}) => {
  if (!password) {
    throw new AppError('Password is required', 400);
  }

  if (typeof password !== 'string') {
    throw new AppError('Password must be a string', 400);
  }

  if (password.length < PASSWORD_CONFIG.minLength) {
    throw new AppError(
      `Password must be at least ${PASSWORD_CONFIG.minLength} characters long`,
      400
    );
  }

  if (password.length > PASSWORD_CONFIG.maxLength) {
    throw new AppError(
      `Password must not exceed ${PASSWORD_CONFIG.maxLength} characters`,
      400
    );
  }

  if (PASSWORD_CONFIG.requireUppercase && !/[A-Z]/.test(password)) {
    throw new AppError('Password must contain at least one uppercase letter', 400);
  }

  if (PASSWORD_CONFIG.requireLowercase && !/[a-z]/.test(password)) {
    throw new AppError('Password must contain at least one lowercase letter', 400);
  }

  if (PASSWORD_CONFIG.requireNumbers && !/\d/.test(password)) {
    throw new AppError('Password must contain at least one number', 400);
  }

  if (PASSWORD_CONFIG.requireSpecialChars && !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    throw new AppError('Password must contain at least one special character', 400);
  }

  if (PASSWORD_CONFIG.preventCommonPasswords) {
    const lowerPassword = password.toLowerCase();
    if (COMMON_PASSWORDS.has(lowerPassword)) {
      throw new AppError('This password is too common. Please choose a stronger password', 400);
    }
  }

  if (PASSWORD_CONFIG.preventSequentialChars) {
    const sequentialPattern = /(?:abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz|012|123|234|345|456|567|678|789)/i;
    if (sequentialPattern.test(password)) {
      throw new AppError('Password should not contain sequential characters', 400);
    }
  }

  if (PASSWORD_CONFIG.preventRepeatedChars) {
    const repeatedPattern = /(.)\1{2,}/;
    if (repeatedPattern.test(password)) {
      throw new AppError('Password should not contain repeated characters', 400);
    }
  }

  if (userData.name) {
    const nameParts = userData.name.toLowerCase().split(' ');
    const lowerPassword = password.toLowerCase();

    for (const part of nameParts) {
      if (part.length >= 3 && lowerPassword.includes(part)) {
        throw new AppError('Password should not contain your name', 400);
      }
    }
  }

  if (userData.email) {
    const emailName = userData.email.split('@')[0].toLowerCase();
    if (emailName.length >= 3 && password.toLowerCase().includes(emailName)) {
      throw new AppError('Password should not contain your email', 400);
    }
  }

  if (userData.mobile) {
    const mobile = userData.mobile.replace(/\D/g, '');
    if (mobile.length >= 4 && password.includes(mobile.slice(-4))) {
      throw new AppError('Password should not contain your phone number', 400);
    }
  }

  return true;
};

/**
 * Validate password against security policy
 */
export const validatePassword = (password, userData = {}) => {
  if (isAuthStrictMode()) {
    return validatePasswordStrict(password, userData);
  }

  return validatePasswordRelaxed(password);
};

/**
 * Calculate password strength score (0-100)
 */
export const calculatePasswordStrength = (password) => {
  let score = 0;

  // Length score (max 25)
  score += Math.min(password.length * 2, 25);

  // Character variety (max 40)
  if (/[a-z]/.test(password)) score += 10;
  if (/[A-Z]/.test(password)) score += 10;
  if (/\d/.test(password)) score += 10;
  if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) score += 10;

  // Entropy bonus (max 20)
  const uniqueChars = new Set(password).size;
  score += Math.min(uniqueChars, 20);

  // Penalties
  if (COMMON_PASSWORDS.has(password.toLowerCase())) score -= 30;
  if (/(.)\1{2,}/.test(password)) score -= 10;
  if (/(?:abc|bcd|cde|123|234|345)/i.test(password)) score -= 10;

  return Math.max(0, Math.min(100, score));
};

/**
 * Get password strength label
 */
export const getPasswordStrengthLabel = (score) => {
  if (score < 40) return 'Weak';
  if (score < 60) return 'Fair';
  if (score < 80) return 'Good';
  return 'Strong';
};

/**
 * Validate password change request
 */
export const validatePasswordChange = (oldPassword, newPassword, userData) => {
  // Validate new password
  validatePassword(newPassword, userData);

  // Ensure new password is different from old
  if (oldPassword === newPassword) {
    throw new AppError('New password must be different from the old password', 400);
  }

  return true;
};

/**
 * Check if password has been pwned (breached)
 * Uses k-anonymity model with haveibeenpwned.com API
 */
export const checkPasswordBreach = async (password) => {
  try {
    const crypto = await import('crypto');
    const hash = crypto.createHash('sha1').update(password).digest('hex').toUpperCase();
    const prefix = hash.slice(0, 5);
    const suffix = hash.slice(5);

    // 🔒 Timeout protection: 5 second timeout for HIBP API
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`, {
      headers: { 'User-Agent': 'B2B-Platform-Security-Check' },
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);

    if (!response.ok) {
      // If API fails, skip check but log warning
      logger.warn('Password breach check API unavailable');
      return { breached: false, count: 0 };
    }

    const text = await response.text();
    const hashes = text.split('\n');

    for (const line of hashes) {
      const [hashSuffix, count] = line.split(':');
      if (hashSuffix === suffix) {
        return { breached: true, count: parseInt(count) };
      }
    }

    return { breached: false, count: 0 };
  } catch (error) {
    if (error.name === 'AbortError') {
      logger.warn('Password breach check timed out after 5s');
    } else {
      logger.error('Password breach check failed:', error);
    }
    return { breached: false, count: 0 };
  }
};

export default {
  validatePassword,
  calculatePasswordStrength,
  getPasswordStrengthLabel,
  validatePasswordChange,
  checkPasswordBreach,
  PASSWORD_CONFIG
};
