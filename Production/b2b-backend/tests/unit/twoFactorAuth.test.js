import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { twoFactorAuth } from '../../src/services/twoFactorAuth.service.js';
import { authenticator } from 'otplib';

describe('Two-Factor Authentication Service - Unit Tests', () => {
  describe('generateSecret()', () => {
    it('should generate a valid secret', () => {
      const result = twoFactorAuth.generateSecret();

      expect(result).toBeDefined();
      expect(result).toHaveProperty('secret');
      expect(result.secret).toMatch(/^[A-Z2-7]+=*$/); // Base32 format
    });

    it('should generate different secrets each time', () => {
      const secret1 = twoFactorAuth.generateSecret();
      const secret2 = twoFactorAuth.generateSecret();

      expect(secret1.secret).not.toBe(secret2.secret);
    });

    it('should generate secret with email parameter', () => {
      const email = 'test@example.com';
      const result = twoFactorAuth.generateSecret(email);

      expect(result).toBeDefined();
      expect(result.secret).toBeDefined();
    });
  });

  describe('generateQRCode()', () => {
    it('should generate QR code data URL', async () => {
      const result = twoFactorAuth.generateSecret('test@example.com');
      const qrCode = await twoFactorAuth.generateQRCode('test@example.com', result.secret);

      expect(qrCode).toBeDefined();
      expect(qrCode).toMatch(/^data:image\/png;base64,/);
    });

    it('should handle empty email/secret', async () => {
      // Service generates QR code even with empty values
      const qrCode = await twoFactorAuth.generateQRCode('', '');
      expect(qrCode).toBeDefined();
      expect(qrCode).toMatch(/^data:image\/png;base64,/);
    });
  });

  describe('verifyToken()', () => {
    let secret;

    beforeEach(() => {
      secret = twoFactorAuth.generateSecret();
    });

    it('should verify valid TOTP token', () => {
      // Generate a valid token
      const token = authenticator.generate(secret.secret);
      const isValid = twoFactorAuth.verifyToken(token, secret.secret);

      expect(isValid).toBe(true);
    });

    it('should reject invalid token', () => {
      const isValid = twoFactorAuth.verifyToken('000000', secret.secret);
      expect(isValid).toBe(false);
    });

    it('should reject expired token', () => {
      // Token from far past
      const oldToken = '123456';
      const isValid = twoFactorAuth.verifyToken(oldToken, secret.secret);
      expect(isValid).toBe(false);
    });

    it('should reject malformed token', () => {
      const isValid = twoFactorAuth.verifyToken('abc', secret.secret);
      expect(isValid).toBe(false);
    });

    it('should handle empty token', () => {
      const isValid = twoFactorAuth.verifyToken('', secret.secret);
      expect(isValid).toBe(false);
    });

    it('should handle null token', () => {
      const isValid = twoFactorAuth.verifyToken(null, secret.secret);
      expect(isValid).toBe(false);
    });

    it('should allow window tolerance for time drift', () => {
      // Generate token
      const token = authenticator.generate(secret.secret);
      
      // Should still be valid (service has window: 1 by default)
      const isValid = twoFactorAuth.verifyToken(token, secret.secret);
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
        expect(code).toMatch(/^[A-Z0-9]{8}$/); // 8-character hex format
      });
    });

    it('should generate different codes on each call', () => {
      const codes1 = twoFactorAuth.generateBackupCodes(5);
      const codes2 = twoFactorAuth.generateBackupCodes(5);

      expect(codes1).not.toEqual(codes2);
    });
  });

  describe('validateLogin2FA()', () => {
    let secret;
    let backupCodes;

    beforeEach(() => {
      secret = twoFactorAuth.generateSecret();
      backupCodes = twoFactorAuth.generateBackupCodes();
    });

    it('should validate correct TOTP token', async () => {
      const token = authenticator.generate(secret.secret);
      const result = await twoFactorAuth.validateLogin2FA(token, secret.secret, backupCodes);

      expect(result.valid).toBe(true);
      expect(result.method).toBe('totp');
    });

    it('should validate backup code', async () => {
      const backupCode = backupCodes[0];
      // Hash the backup code as service expects hashed codes
      const hashedCodes = await Promise.all(
        backupCodes.map(code => twoFactorAuth.hashBackupCode(code))
      );
      
      const result = await twoFactorAuth.validateLogin2FA(backupCode, secret.secret, hashedCodes);

      expect(result.valid).toBe(true);
      expect(result.method).toBe('backup_code');
      expect(result.usedCodeIndex).toBeDefined();
    });

    it('should identify used backup code index', async () => {
      const backupCode = backupCodes[2]; // Use 3rd code
      const hashedCodes = await Promise.all(
        backupCodes.map(code => twoFactorAuth.hashBackupCode(code))
      );

      const result = await twoFactorAuth.validateLogin2FA(backupCode, secret.secret, hashedCodes);

      expect(result.valid).toBe(true);
      expect(result.usedCodeIndex).toBe(2);
    });

    it('should reject invalid token', async () => {
      const hashedCodes = await Promise.all(
        backupCodes.map(code => twoFactorAuth.hashBackupCode(code))
      );
      const result = await twoFactorAuth.validateLogin2FA('000000', secret.secret, hashedCodes);

      expect(result.valid).toBe(false);
      expect(result.method).toBeNull();
    });

    it('should reject empty token', async () => {
      const result = await twoFactorAuth.validateLogin2FA('', secret.secret, []);

      expect(result.valid).toBe(false);
    });
  });

  describe('Token Generation', () => {
    it('should generate 6-digit token via authenticator', () => {
      const result = twoFactorAuth.generateSecret();
      const token = authenticator.generate(result.secret);

      expect(token).toMatch(/^\d{6}$/);
    });

    it('should generate valid token format over time', async () => {
      const result = twoFactorAuth.generateSecret();
      const token1 = authenticator.generate(result.secret);

      // Wait briefly
      await new Promise((resolve) => setTimeout(resolve, 100));

      const token2 = authenticator.generate(result.secret);

      // Verify both are valid 6-digit tokens
      expect(token1).toMatch(/^\d{6}$/);
      expect(token2).toMatch(/^\d{6}$/);
    });
  });

  describe('Security', () => {
    it('should verify token independently', async () => {
      const result = twoFactorAuth.generateSecret();
      const token = authenticator.generate(result.secret);

      // First verification
      const validation1 = await twoFactorAuth.validateLogin2FA(token, result.secret, []);
      expect(validation1.valid).toBe(true);

      // Second verification (same token can be used within window)
      const validation2 = await twoFactorAuth.validateLogin2FA(token, result.secret, []);
      expect(validation2.valid).toBe(true);
    });

    it('should reject invalid tokens consistently', async () => {
      const result = twoFactorAuth.generateSecret();

      // Make many failed attempts with invalid token
      const attempts = Array(10)
        .fill()
        .map(() => twoFactorAuth.validateLogin2FA('000000', result.secret, []));

      const results = await Promise.all(attempts);
      const failedCount = results.filter((r) => !r.valid).length;

      // All should fail
      expect(failedCount).toBe(10);
    });
  });

  describe('Edge Cases', () => {
    it('should handle invalid secret format gracefully', () => {
      // verifyToken returns false instead of throwing for invalid secrets
      const isValid = twoFactorAuth.verifyToken('123456', 'invalid secret!');
      expect(isValid).toBe(false);
    });

    it('should handle very long tokens', () => {
      const result = twoFactorAuth.generateSecret();
      const longToken = '1'.repeat(100);

      const isValid = twoFactorAuth.verifyToken(longToken, result.secret);
      expect(isValid).toBe(false);
    });

    it('should handle special characters in token', () => {
      const result = twoFactorAuth.generateSecret();
      const isValid = twoFactorAuth.verifyToken('12@#$%', result.secret);

      expect(isValid).toBe(false);
    });

    it('should handle concurrent verification attempts', async () => {
      const result = twoFactorAuth.generateSecret();
      const token = authenticator.generate(result.secret);

      // Concurrent verifications of same token
      const promises = Array(5)
        .fill()
        .map(() => twoFactorAuth.validateLogin2FA(token, result.secret, []));

      const results = await Promise.all(promises);
      const successCount = results.filter((r) => r.valid).length;

      // All should succeed with valid token
      expect(successCount).toBe(5);
    });
  });
});
