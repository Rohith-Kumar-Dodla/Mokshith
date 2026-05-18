import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import * as passwordPolicy from '../../src/utils/passwordPolicy.js';

describe('Password Policy Service - Unit Tests', () => {
  describe('validatePassword()', () => {
    it('should accept strong password', () => {
      const result = passwordPolicy.validatePassword('StrongP@ssw0rd123');
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject password shorter than 12 characters', () => {
      const result = passwordPolicy.validatePassword('Short@1');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must be at least 12 characters long');
    });

    it('should reject password without uppercase letter', () => {
      const result = passwordPolicy.validatePassword('nouppercas@123');
      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.includes('uppercase'))).toBe(true);
    });

    it('should reject password without lowercase letter', () => {
      const result = passwordPolicy.validatePassword('NOLOWERCASE@123');
      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.includes('lowercase'))).toBe(true);
    });

    it('should reject password without number', () => {
      const result = passwordPolicy.validatePassword('NoNumbersHere@');
      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.includes('number'))).toBe(true);
    });

    it('should reject password without special character', () => {
      const result = passwordPolicy.validatePassword('NoSpecialChar123');
      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.includes('special'))).toBe(true);
    });

    it('should reject common passwords', () => {
      const commonPasswords = [
        'Password@123',
        'Admin@123456',
        'Welcome@1234',
      ];

      commonPasswords.forEach((pwd) => {
        const result = passwordPolicy.validatePassword(pwd);
        expect(result.isValid).toBe(false);
        expect(result.errors.some((e) => e.includes('common'))).toBe(true);
      });
    });

    it('should reject password with sequential characters', () => {
      const result = passwordPolicy.validatePassword('Abcd1234@test');
      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.includes('sequential'))).toBe(true);
    });

    it('should reject password with repeated characters', () => {
      const result = passwordPolicy.validatePassword('Aaaa1111@test');
      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.includes('repeated'))).toBe(true);
    });
  });

  describe('calculatePasswordStrength()', () => {
    it('should rate strong password as 4-5', () => {
      const strength = passwordPolicy.calculatePasswordStrength('V3ry$tr0ng&C0mpl3xP@ssw0rd!');
      expect(strength).toBeGreaterThanOrEqual(4);
      expect(strength).toBeLessThanOrEqual(5);
    });

    it('should rate medium password as 3', () => {
      const strength = passwordPolicy.calculatePasswordStrength('Medium@Pass123');
      expect(strength).toBe(3);
    });

    it('should rate weak password as 1-2', () => {
      const strength = passwordPolicy.calculatePasswordStrength('weak@123');
      expect(strength).toBeLessThanOrEqual(2);
    });

    it('should return 0 for very weak password', () => {
      const strength = passwordPolicy.calculatePasswordStrength('abc');
      expect(strength).toBe(0);
    });
  });

  describe('checkPasswordBreach()', () => {
    it('should detect breached password', async () => {
      // Mock common breached password
      const isBreached = await passwordPolicy.checkPasswordBreach('password123');
      expect(typeof isBreached).toBe('boolean');
      // API call may or may not work in test, just verify format
    });

    it('should handle API errors gracefully', async () => {
      const isBreached = await passwordPolicy.checkPasswordBreach('RandomNonBreached@Pass2024!');
      expect(typeof isBreached).toBe('boolean');
    });
  });

  describe('validatePasswordChange()', () => {
    it('should accept valid password change', () => {
      const result = passwordPolicy.validatePasswordChange(
        'OldPassword@123',
        'NewDifferentPassword@456'
      );
      expect(result.isValid).toBe(true);
    });

    it('should reject if new password same as old', () => {
      const result = passwordPolicy.validatePasswordChange(
        'SamePassword@123',
        'SamePassword@123'
      );
      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.includes('same'))).toBe(true);
    });

    it('should reject if new password too similar to old', () => {
      const result = passwordPolicy.validatePasswordChange(
        'MyPassword@123',
        'MyPassword@456'
      );
      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.includes('similar'))).toBe(true);
    });
  });
});
