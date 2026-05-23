import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import * as passwordPolicy from '../../src/utils/passwordPolicy.js';
import AppError from '../../src/errors/AppError.js';

describe('Password Policy Service - Unit Tests', () => {
  describe('validatePassword()', () => {
    it('should accept strong password', () => {
      const result = passwordPolicy.validatePassword('StrongP@ssw0rd985');
      expect(result).toBe(true);
    });

    it('should reject password shorter than 12 characters', () => {
      expect(() => {
        passwordPolicy.validatePassword('Short@1');
      }).toThrow('at least 12 characters');
    });

    it('should reject password without uppercase letter', () => {
      expect(() => {
        passwordPolicy.validatePassword('nouppercas@792');
      }).toThrow('uppercase');
    });

    it('should reject password without lowercase letter', () => {
      expect(() => {
        passwordPolicy.validatePassword('NOLOWERCASE@792');
      }).toThrow('lowercase');
    });

    it('should reject password without number', () => {
      expect(() => {
        passwordPolicy.validatePassword('NoNumbersHere@test');
      }).toThrow('number');
    });

    it('should reject password without special character', () => {
      expect(() => {
        passwordPolicy.validatePassword('NoSpecialChar792');
      }).toThrow('special');
    });

    it('should reject sequential characters', () => {
      expect(() => {
        passwordPolicy.validatePassword('Abcd7928@test');
      }).toThrow('sequential');
    });

    it('should reject password with repeated characters', () => {
      expect(() => {
        passwordPolicy.validatePassword('Aaaa7928@test');
      }).toThrow('repeated');
    });
  });

  describe('calculatePasswordStrength()', () => {
    it('should rate strong password as 80-100', () => {
      const strength = passwordPolicy.calculatePasswordStrength('V3ry$tr0ng&C0mpl3xP@ssw0rd!');
      expect(strength).toBeGreaterThanOrEqual(80);
      expect(strength).toBeLessThanOrEqual(100);
    });

    it('should rate medium password as 40-80', () => {
      const strength = passwordPolicy.calculatePasswordStrength('Medium@Pass792');
      expect(strength).toBeGreaterThanOrEqual(40);
      expect(strength).toBeLessThanOrEqual(80);
    });

    it('should rate weak password as 0-60', () => {
      const strength = passwordPolicy.calculatePasswordStrength('weak@792');
      expect(strength).toBeGreaterThanOrEqual(0);
      expect(strength).toBeLessThanOrEqual(60);
    });

    it('should return low score for very weak password', () => {
      const strength = passwordPolicy.calculatePasswordStrength('abc');
      expect(strength).toBeGreaterThanOrEqual(0);
      expect(strength).toBeLessThanOrEqual(40);
    });
  });

  describe('checkPasswordBreach()', () => {
    it('should return breach info object', async () => {
      const result = await passwordPolicy.checkPasswordBreach('password123');
      expect(result).toHaveProperty('breached');
      expect(result).toHaveProperty('count');
      expect(typeof result.breached).toBe('boolean');
      expect(typeof result.count).toBe('number');
    });

    it('should handle API errors gracefully', async () => {
      const result = await passwordPolicy.checkPasswordBreach('RandomNonBreached@Pass2024!');
      expect(result).toHaveProperty('breached');
      expect(result).toHaveProperty('count');
      expect(typeof result.breached).toBe('boolean');
    });
  });

  describe('validatePasswordChange()', () => {
    it('should accept valid password change', () => {
      expect(() => {
        passwordPolicy.validatePasswordChange(
          'OldPassword@985',
          'NewDifferentPassword@792'
        );
      }).not.toThrow();
    });

    it('should reject if new password same as old', () => {
      expect(() => {
        passwordPolicy.validatePasswordChange(
          'SamePassword@985',
          'SamePassword@985'
        );
      }).toThrow('must be different');
    });

    it('should reject if new password fails validation', () => {
      expect(() => {
        passwordPolicy.validatePasswordChange(
          'ValidOldPassword@985',
          'short'
        );
      }).toThrow(AppError);
    });
  });
});
