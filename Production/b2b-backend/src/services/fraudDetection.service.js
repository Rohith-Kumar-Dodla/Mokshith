import { redisClient } from '../config/redis.js';
import { logger } from '../config/logger.js';
import AppError from '../errors/AppError.js';
import { isAuthStrictMode } from '../config/authStrictMode.js';

/**
 * Fraud Detection Service
 * Detects and prevents payment/authentication abuse
 */

class FraudDetectionService {
  constructor() {
    this.thresholds = {
      // Authentication abuse
      maxLoginAttempts: 5,
      loginAttemptWindow: 900, // 15 minutes
      maxOtpAttempts: 3,
      otpAttemptWindow: 600, // 10 minutes
      
      // Payment abuse
      maxPaymentAttempts: 3,
      paymentAttemptWindow: 3600, // 1 hour
      maxDailyPayments: 20,
      maxPaymentAmount: 1000000, // 10 lakhs
      
      // Account creation abuse
      maxRegistrationsPerIP: 3,
      registrationWindow: 86400, // 24 hours
      
      // API abuse
      maxAPICallsPerMinute: 100,
      apiCallWindow: 60
    };
  }

  /**
   * Track login attempt
   */
  async trackLoginAttempt(identifier, ip, success = false) {
    // RE-ENABLE BEFORE PRODUCTION: fraud login limits disabled when AUTH_STRICT_MODE=false
    if (!isAuthStrictMode()) {
      return { attempts: 0, remaining: this.thresholds.maxLoginAttempts };
    }

    const key = `fraud:login:${identifier}`;
    const ipKey = `fraud:login:ip:${ip}`;

    try {
      // Increment attempt counter
      await redisClient.incr(key);
      await redisClient.incr(ipKey);
      
      // Set expiry on first attempt
      await redisClient.expire(key, this.thresholds.loginAttemptWindow);
      await redisClient.expire(ipKey, this.thresholds.loginAttemptWindow);

      // Get current count
      const attempts = await redisClient.get(key);
      const ipAttempts = await redisClient.get(ipKey);

      // Check if exceeded threshold
      if (attempts > this.thresholds.maxLoginAttempts) {
        logger.warn('Login attempt threshold exceeded', {
          identifier,
          ip,
          attempts
        });

        throw new AppError(
          `Too many login attempts. Please try again in ${Math.floor(this.thresholds.loginAttemptWindow / 60)} minutes`,
          429
        );
      }

      // Check IP-based threshold
      if (ipAttempts > this.thresholds.maxLoginAttempts * 3) {
        logger.error('Suspicious login activity from IP', {
          ip,
          attempts: ipAttempts
        });

        throw new AppError('Too many requests from this IP address', 429);
      }

      // Clear on successful login
      if (success) {
        await redisClient.del(key);
      }

      return {
        attempts: parseInt(attempts),
        remaining: this.thresholds.maxLoginAttempts - parseInt(attempts)
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Login tracking error:', error);
      return { attempts: 0, remaining: this.thresholds.maxLoginAttempts };
    }
  }

  /**
   * Track OTP attempts
   */
  async trackOTPAttempt(identifier, success = false) {
    const key = `fraud:otp:${identifier}`;

    try {
      await redisClient.incr(key);
      await redisClient.expire(key, this.thresholds.otpAttemptWindow);

      const attempts = await redisClient.get(key);

      if (attempts > this.thresholds.maxOtpAttempts) {
        logger.warn('OTP attempt threshold exceeded', {
          identifier,
          attempts
        });

        throw new AppError(
          `Too many OTP attempts. Please request a new OTP in ${Math.floor(this.thresholds.otpAttemptWindow / 60)} minutes`,
          429
        );
      }

      if (success) {
        await redisClient.del(key);
      }

      return {
        attempts: parseInt(attempts),
        remaining: this.thresholds.maxOtpAttempts - parseInt(attempts)
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('OTP tracking error:', error);
      return { attempts: 0, remaining: this.thresholds.maxOtpAttempts };
    }
  }

  /**
   * Track payment attempt
   */
  async trackPaymentAttempt(userId, amount, ip, options = {}) {
    const key = `fraud:payment:${userId}`;
    const dailyKey = `fraud:payment:daily:${userId}`;
    const skipAmountCheck =
      options.skipAmountCheck === true || options.paymentMethod === 'BANK_TRANSFER';

    try {
      // Check amount threshold (skipped for bank transfer — any amount allowed)
      if (!skipAmountCheck && amount > this.thresholds.maxPaymentAmount) {
        logger.warn('Suspicious payment amount', {
          userId,
          amount,
          threshold: this.thresholds.maxPaymentAmount
        });

        throw new AppError(
          'Payment amount exceeds security threshold. Please contact support for large transactions',
          400
        );
      }

      // Track hourly attempts
      await redisClient.incr(key);
      await redisClient.expire(key, this.thresholds.paymentAttemptWindow);

      const hourlyAttempts = await redisClient.get(key);

      if (hourlyAttempts > this.thresholds.maxPaymentAttempts) {
        logger.error('Payment attempt threshold exceeded', {
          userId,
          attempts: hourlyAttempts,
          ip
        });

        throw new AppError(
          'Too many payment attempts. Please try again later or contact support',
          429
        );
      }

      // Track daily payments
      await redisClient.incr(dailyKey);
      await redisClient.expire(dailyKey, 86400); // 24 hours

      const dailyPayments = await redisClient.get(dailyKey);

      if (dailyPayments > this.thresholds.maxDailyPayments) {
        logger.error('Daily payment limit exceeded', {
          userId,
          dailyPayments
        });

        throw new AppError(
          'Daily payment limit reached. Please try again tomorrow or contact support',
          429
        );
      }

      return {
        hourlyAttempts: parseInt(hourlyAttempts),
        dailyPayments: parseInt(dailyPayments)
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Payment tracking error:', error);
      return { hourlyAttempts: 0, dailyPayments: 0 };
    }
  }

  /**
   * Track registration attempts per IP
   */
  async trackRegistration(ip, email) {
    // RE-ENABLE BEFORE PRODUCTION: registration IP limits disabled when AUTH_STRICT_MODE=false
    if (!isAuthStrictMode()) {
      return { attempts: 0, remaining: this.thresholds.maxRegistrationsPerIP };
    }

    const key = `fraud:register:ip:${ip}`;

    try {
      await redisClient.incr(key);
      await redisClient.expire(key, this.thresholds.registrationWindow);

      const attempts = await redisClient.get(key);

      if (attempts > this.thresholds.maxRegistrationsPerIP) {
        logger.error('Registration abuse detected', {
          ip,
          attempts,
          email
        });

        throw new AppError(
          'Too many registrations from this IP address. Please try again tomorrow',
          429
        );
      }

      return {
        attempts: parseInt(attempts),
        remaining: this.thresholds.maxRegistrationsPerIP - parseInt(attempts)
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Registration tracking error:', error);
      return { attempts: 0, remaining: this.thresholds.maxRegistrationsPerIP };
    }
  }

  /**
   * Detect velocity abuse (rapid successive actions)
   */
  async detectVelocityAbuse(userId, action, maxCount = 10, windowSeconds = 60) {
    const key = `fraud:velocity:${action}:${userId}`;

    try {
      const count = await redisClient.incr(key);
      await redisClient.expire(key, windowSeconds);

      if (count > maxCount) {
        logger.warn('Velocity abuse detected', {
          userId,
          action,
          count,
          window: windowSeconds
        });

        throw new AppError(
          'Action performed too quickly. Please slow down and try again',
          429
        );
      }

      return { count, allowed: true };
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Velocity check error:', error);
      return { count: 0, allowed: true };
    }
  }

  /**
   * Detect suspicious patterns
   */
  async analyzeSuspiciousPatterns(userId, data = {}) {
    const flags = [];

    // Check for multiple failed attempts
    const loginKey = `fraud:login:${userId}`;
    const loginAttempts = await redisClient.get(loginKey);
    
    if (loginAttempts && parseInt(loginAttempts) >= 3) {
      flags.push('multiple_failed_logins');
    }

    // Check for unusual payment patterns
    if (data.paymentAmount) {
      // Very small or very large amounts
      if (data.paymentAmount < 100 || data.paymentAmount > 500000) {
        flags.push('unusual_payment_amount');
      }
    }

    // Check for rapid account changes
    if (data.accountChange) {
      const changeKey = `fraud:account_change:${userId}`;
      const changes = await redisClient.incr(changeKey);
      await redisClient.expire(changeKey, 3600); // 1 hour

      if (changes > 5) {
        flags.push('rapid_account_changes');
      }
    }

    // Log if suspicious
    if (flags.length > 0) {
      logger.warn('Suspicious activity detected', {
        userId,
        flags,
        data
      });
    }

    return {
      suspicious: flags.length > 0,
      flags,
      riskScore: flags.length * 20 // Simple risk scoring
    };
  }

  /**
   * Block user temporarily
   */
  async blockUser(userId, reason, durationSeconds = 3600) {
    const key = `fraud:blocked:${userId}`;
    
    await redisClient.set(key, JSON.stringify({
      reason,
      blockedAt: new Date().toISOString()
    }), 'EX', durationSeconds);

    logger.error('User temporarily blocked', {
      userId,
      reason,
      duration: durationSeconds
    });
  }

  /**
   * Check if user is blocked
   */
  async isUserBlocked(userId) {
    // RE-ENABLE BEFORE PRODUCTION: temporary blocks ignored when AUTH_STRICT_MODE=false
    if (!isAuthStrictMode()) {
      return { blocked: false };
    }

    const key = `fraud:blocked:${userId}`;
    const blocked = await redisClient.get(key);

    if (blocked) {
      const data = JSON.parse(blocked);
      return {
        blocked: true,
        reason: data.reason,
        blockedAt: data.blockedAt
      };
    }

    return { blocked: false };
  }

  /**
   * Clear user fraud tracking (after verification, support intervention)
   */
  async clearUserTracking(userId) {
    const patterns = [
      `fraud:login:${userId}`,
      `fraud:otp:${userId}`,
      `fraud:payment:${userId}`,
      `fraud:payment:daily:${userId}`,
      `fraud:velocity:*:${userId}`,
      `fraud:blocked:${userId}`
    ];

    for (const pattern of patterns) {
      if (pattern.includes('*')) {
        const keys = await redisClient.keys(pattern);
        if (keys.length > 0) {
          await redisClient.del(...keys);
        }
      } else {
        await redisClient.del(pattern);
      }
    }

    logger.info('Fraud tracking cleared for user', { userId });
  }
}

// Export singleton
export const fraudDetection = new FraudDetectionService();
export default fraudDetection;
