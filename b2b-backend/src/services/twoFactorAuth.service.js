import crypto from 'crypto';
import { authenticator } from 'otplib';
import QRCode from 'qrcode';
import AppError from '../errors/AppError.js';
import { logger } from '../config/logger.js';

/**
 * Two-Factor Authentication (2FA) Service
 * Implements TOTP (Time-based One-Time Password) using otplib
 */

class TwoFactorAuthService {
  constructor() {
    // Configure TOTP settings
    authenticator.options = {
      window: 1, // Allow 1 step before/after for time sync issues
      step: 30   // 30 second time step
    };

    this.appName = process.env.APP_NAME || 'B2B Platform';
  }

  /**
   * Generate 2FA secret for user
   */
  generateSecret(userEmail) {
    const secret = authenticator.generateSecret();
    
    return {
      secret,
      qrCode: null // Will be generated separately
    };
  }

  /**
   * Generate QR code for secret
   */
  async generateQRCode(userEmail, secret) {
    try {
      const otpauth = authenticator.keyuri(userEmail, this.appName, secret);
      const qrCodeDataURL = await QRCode.toDataURL(otpauth);
      
      return qrCodeDataURL;
    } catch (error) {
      logger.error('QR code generation failed:', error);
      throw new AppError('Failed to generate QR code', 500);
    }
  }

  /**
   * Verify TOTP token
   */
  verifyToken(token, secret) {
    try {
      const isValid = authenticator.verify({
        token: token.replace(/\s/g, ''), // Remove spaces
        secret
      });

      return isValid;
    } catch (error) {
      logger.error('Token verification error:', error);
      return false;
    }
  }

  /**
   * Generate backup codes for 2FA recovery
   */
  generateBackupCodes(count = 10) {
    const codes = [];
    
    for (let i = 0; i < count; i++) {
      // Generate 8-character alphanumeric code
      const code = crypto.randomBytes(4).toString('hex').toUpperCase();
      codes.push(code);
    }

    return codes;
  }

  /**
   * Hash backup code for storage
   */
  async hashBackupCode(code) {
    const bcrypt = await import('bcryptjs');
    return bcrypt.hash(code, 10);
  }

  /**
   * Verify backup code
   */
  async verifyBackupCode(code, hashedCode) {
    const bcrypt = await import('bcryptjs');
    return bcrypt.compare(code, hashedCode);
  }

  /**
   * Enable 2FA for user
   */
  async enable2FA(user) {
    const { secret } = this.generateSecret(user.email);
    const qrCode = await this.generateQRCode(user.email, secret);
    const backupCodes = this.generateBackupCodes();

    // Hash backup codes before storage
    const hashedBackupCodes = await Promise.all(
      backupCodes.map(code => this.hashBackupCode(code))
    );

    return {
      secret,
      qrCode,
      backupCodes,
      hashedBackupCodes
    };
  }

  /**
   * Verify 2FA setup
   */
  async verifySetup(token, secret) {
    const isValid = this.verifyToken(token, secret);

    if (!isValid) {
      throw new AppError('Invalid verification code. Please try again', 400);
    }

    return true;
  }

  /**
   * Validate 2FA token during login
   */
  async validateLogin2FA(token, secret, backupCodes = []) {
    // First try TOTP
    if (this.verifyToken(token, secret)) {
      return {
        valid: true,
        method: 'totp'
      };
    }

    // Try backup codes
    for (let i = 0; i < backupCodes.length; i++) {
      const isBackupCodeValid = await this.verifyBackupCode(token, backupCodes[i]);
      
      if (isBackupCodeValid) {
        logger.info('Login with backup code');
        return {
          valid: true,
          method: 'backup_code',
          usedCodeIndex: i // To mark code as used
        };
      }
    }

    // Invalid
    return {
      valid: false,
      method: null
    };
  }

  /**
   * Generate temporary bypass code (for support)
   */
  generateBypassCode() {
    return crypto.randomBytes(6).toString('hex').toUpperCase();
  }

  /**
   * Check if 2FA is required based on risk level
   */
  shouldRequire2FA(user, context = {}) {
    // Always require if user has 2FA enabled
    if (user.twoFactorEnabled) {
      return true;
    }

    // Check risk factors
    const riskFactors = [];

    // New device
    if (context.isNewDevice) {
      riskFactors.push('new_device');
    }

    // Suspicious IP/location
    if (context.suspiciousLocation) {
      riskFactors.push('suspicious_location');
    }

    // High-value action
    if (context.highValueAction) {
      riskFactors.push('high_value_action');
    }

    // Require 2FA if 2+ risk factors
    return riskFactors.length >= 2;
  }

  /**
   * Generate SMS OTP (for SMS-based 2FA)
   */
  generateSMSOTP() {
    return crypto.randomInt(100000, 999999).toString();
  }

  /**
   * Generate email OTP
   */
  generateEmailOTP() {
    return crypto.randomInt(100000, 999999).toString();
  }
}

// Export singleton
export const twoFactorAuth = new TwoFactorAuthService();
export default twoFactorAuth;
