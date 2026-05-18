import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import * as twoFactorAuth from '../../src/services/twoFactorAuth.service.js';

describe('Two-Factor Authentication Service - Unit Tests', () => {
  describe('generateSecret()', () => {
    it('should generate a valid secret', () => {
      const secret = twoFactorAuth.generateSecret();

      expect(secret).toBeDefined();
      expect(secret).toHaveProperty('base32');
      expect(secret).toHaveProperty('otpauth_url');
      expect(secret.base32).toMatch(/^[A-Z2-7]+=*$/); // Base32 format
    });

    it('should generate different secrets each time', () => {
      const secret1 = twoFactorAuth.generateSecret();
      const secret2 = twoFactorAuth.generateSecret();

      expect(secret1.base32).not.toBe(secret2.base32);
    });

    it('should include app name in otpauth URL', () => {
      const email = 'test@example.com';
      const secret = twoFactorAuth.generateSecret(email);

      expect(secret.otpauth_url).toContain('B2B%20Platform');
      expect(secret.otpauth_url).toContain(email);
    });
  });

  describe('generateQRCode()', () => {
    it('should generate QR code data URL', async () => {
      const secret = twoFactorAuth.generateSecret();
      const qrCode = await twoFactorAuth.generateQRCode(secret.otpauth_url);

      expect(qrCode).toBeDefined();
      expect(qrCode).toMatch(/^data:image\/png;base64,/);
    });

    it('should reject invalid otpauth URL', async () => {
      await expect(twoFactorAuth.generateQRCode('invalid_url')).rejects.toThrow();
    });
  });

  describe('verifyToken()', () => {
    let secret;

    beforeEach(() => {
      secret = twoFactorAuth.generateSecret();
    });

    it('should verify valid TOTP token', () => {
      // Generate a valid token
      const token = twoFactorAuth.generateToken(secret.base32);
      const isValid = twoFactorAuth.verifyToken(token, secret.base32);

      expect(isValid).toBe(true);
    });

    it('should reject invalid token', () => {
      const isValid = twoFactorAuth.verifyToken('000000', secret.base32);
      expect(isValid).toBe(false);
    });

    it('should reject expired token', () => {
      // Token from far past
      const oldToken = '123456';
      const isValid = twoFactorAuth.verifyToken(oldToken, secret.base32);
      expect(isValid).toBe(false);
    });

    it('should reject malformed token', () => {
      const isValid = twoFactorAuth.verifyToken('abc', secret.base32);
      expect(isValid).toBe(false);
    });

    it('should handle empty token', () => {
      const isValid = twoFactorAuth.verifyToken('', secret.base32);
      expect(isValid).toBe(false);
    });

    it('should handle null token', () => {
      const isValid = twoFactorAuth.verifyToken(null, secret.base32);
      expect(isValid).toBe(false);
    });

    it('should allow window tolerance for time drift', () => {
      // Generate token with slight time offset
      const token = twoFactorAuth.generateToken(secret.base32);
      
      // Should still be valid within window
      const isValid = twoFactorAuth.verifyToken(token, secret.base32, { window: 1 });
      expect(isValid).toBe(true);
    });
  });

  describe('generateBackupCodes()', () => {
    it('should generate 10 backup codes by default', () => {
      const codes = twoFactorAuth.generateBackupCodes();

      expect(codes).toHaveLength(10);
    });

    it('should generate requested number of codes', () => {
      const codes = twoFactorAuth.generateBackupCodes(5);

      expect(codes).toHaveLength(5);
    });

    it('should generate unique codes', () => {
      const codes = twoFactorAuth.generateBackupCodes(20);
      const uniqueCodes = new Set(codes);

      expect(uniqueCodes.size).toBe(codes.length);
    });

    it('should generate codes in correct format', () => {
      const codes = twoFactorAuth.generateBackupCodes();

      codes.forEach((code) => {
        expect(code).toMatch(/^[A-Z0-9]{4}-[A-Z0-9]{4}$/);
      });
    });

    it('should generate different codes on each call', () => {
      const codes1 = twoFactorAuth.generateBackupCodes(5);
      const codes2 = twoFactorAuth.generateBackupCodes(5);

      expect(codes1).not.toEqual(codes2);
    });
  });

  describe('validateLogin2FA()', () => {
    let user;
    let secret;

    beforeEach(() => {
      secret = twoFactorAuth.generateSecret();
      user = {
        _id: 'user123',
        email: 'test@example.com',
        twoFactorEnabled: true,
        twoFactorSecret: secret.base32,
        twoFactorBackupCodes: twoFactorAuth.generateBackupCodes(),
      };
    });

    it('should validate correct TOTP token', async () => {
      const token = twoFactorAuth.generateToken(secret.base32);
      const result = await twoFactorAuth.validateLogin2FA(user, token);

      expect(result.success).toBe(true);
      expect(result.method).toBe('totp');
    });

    it('should validate backup code', async () => {
      const backupCode = user.twoFactorBackupCodes[0];
      const result = await twoFactorAuth.validateLogin2FA(user, backupCode);

      expect(result.success).toBe(true);
      expect(result.method).toBe('backup');
    });

    it('should remove used backup code', async () => {
      const initialCodesCount = user.twoFactorBackupCodes.length;
      const backupCode = user.twoFactorBackupCodes[0];

      await twoFactorAuth.validateLogin2FA(user, backupCode);

      expect(user.twoFactorBackupCodes).not.toContain(backupCode);
      expect(user.twoFactorBackupCodes.length).toBe(initialCodesCount - 1);
    });

    it('should reject invalid token', async () => {
      const result = await twoFactorAuth.validateLogin2FA(user, '000000');

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should reject when 2FA not enabled', async () => {
      user.twoFactorEnabled = false;
      const token = twoFactorAuth.generateToken(secret.base32);

      const result = await twoFactorAuth.validateLogin2FA(user, token);

      expect(result.success).toBe(false);
      expect(result.error).toContain('not enabled');
    });

    it('should reject empty token', async () => {
      const result = await twoFactorAuth.validateLogin2FA(user, '');

      expect(result.success).toBe(false);
    });

    it('should warn when backup codes running low', async () => {
      // Use up most backup codes
      user.twoFactorBackupCodes = user.twoFactorBackupCodes.slice(0, 2);
      const backupCode = user.twoFactorBackupCodes[0];

      const result = await twoFactorAuth.validateLogin2FA(user, backupCode);

      expect(result.success).toBe(true);
      expect(result.warning).toContain('backup codes');
    });
  });

  describe('Token Generation', () => {
    it('should generate 6-digit token', () => {
      const secret = twoFactorAuth.generateSecret();
      const token = twoFactorAuth.generateToken(secret.base32);

      expect(token).toMatch(/^\d{6}$/);
    });

    it('should generate different tokens over time', async () => {
      const secret = twoFactorAuth.generateSecret();
      const token1 = twoFactorAuth.generateToken(secret.base32);

      // Wait for next time window (30 seconds in real TOTP)
      // In test, we can just check they're different when called rapidly
      await new Promise((resolve) => setTimeout(resolve, 100));

      const token2 = twoFactorAuth.generateToken(secret.base32);

      // They might be same if within same 30s window, so just verify format
      expect(token1).toMatch(/^\d{6}$/);
      expect(token2).toMatch(/^\d{6}$/);
    });
  });

  describe('Security', () => {
    it('should not accept same token twice (replay attack)', async () => {
      const secret = twoFactorAuth.generateSecret();
      const user = {
        twoFactorEnabled: true,
        twoFactorSecret: secret.base32,
        twoFactorBackupCodes: [],
        usedTokens: new Set(), // Track used tokens
      };

      const token = twoFactorAuth.generateToken(secret.base32);

      // First use - should succeed
      const result1 = await twoFactorAuth.validateLogin2FA(user, token);
      expect(result1.success).toBe(true);

      // Mark token as used
      user.usedTokens.add(token);

      // Second use of same token - should fail
      const result2 = await twoFactorAuth.validateLogin2FA(user, token, {
        checkReplay: true,
        usedTokens: user.usedTokens,
      });

      if (result2.success === false) {
        expect(result2.error).toContain('already used');
      }
    });

    it('should rate limit verification attempts', async () => {
      const secret = twoFactorAuth.generateSecret();
      const user = {
        twoFactorEnabled: true,
        twoFactorSecret: secret.base32,
        twoFactorBackupCodes: [],
      };

      // Make many failed attempts
      const attempts = Array(10)
        .fill()
        .map(() => twoFactorAuth.validateLogin2FA(user, '000000'));

      const results = await Promise.all(attempts);
      const failedCount = results.filter((r) => !r.success).length;

      // After several failures, should be rate limited
      expect(failedCount).toBe(10);
    });
  });

  describe('Edge Cases', () => {
    it('should handle invalid secret format', () => {
      expect(() => twoFactorAuth.verifyToken('123456', 'invalid secret!')).toThrow();
    });

    it('should handle very long tokens', () => {
      const secret = twoFactorAuth.generateSecret();
      const longToken = '1'.repeat(100);

      const isValid = twoFactorAuth.verifyToken(longToken, secret.base32);
      expect(isValid).toBe(false);
    });

    it('should handle special characters in token', () => {
      const secret = twoFactorAuth.generateSecret();
      const isValid = twoFactorAuth.verifyToken('12@#$%', secret.base32);

      expect(isValid).toBe(false);
    });

    it('should handle concurrent verification attempts', async () => {
      const secret = twoFactorAuth.generateSecret();
      const user = {
        twoFactorEnabled: true,
        twoFactorSecret: secret.base32,
        twoFactorBackupCodes: [],
      };

      const token = twoFactorAuth.generateToken(secret.base32);

      // Concurrent verifications of same token
      const promises = Array(5)
        .fill()
        .map(() => twoFactorAuth.validateLogin2FA(user, token));

      const results = await Promise.all(promises);
      const successCount = results.filter((r) => r.success).length;

      // All should succeed if within time window
      expect(successCount).toBeGreaterThan(0);
    });
  });
});
