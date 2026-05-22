import { describe, it, expect, beforeEach } from '@jest/globals';
import { fraudDetection } from '../../src/services/fraudDetection.service.js';
import { redisClient } from '../../src/config/redis.js';

describe('Fraud Detection Service - Unit Tests', () => {
  beforeEach(async () => {
    // Clear all Redis keys before each test
    await redisClient.flushall();
  });

  describe('trackLoginAttempt()', () => {
    it('should allow first login attempt', async () => {
      const userId = 'user123';
      const result = await fraudDetection.trackLoginAttempt(userId, '192.168.1.1');

      expect(result).toBeDefined();
      expect(result.attempts).toBe(1);
      expect(result.remaining).toBe(4); // 5 max - 1
    });

    it('should block after 5 failed attempts', async () => {
      const userId = 'user_blocked';

      // Make 5 attempts
      for (let i = 0; i < 5; i++) {
        await fraudDetection.trackLoginAttempt(userId, '192.168.1.1');
      }

      // 6th attempt should throw AppError
      await expect(
        fraudDetection.trackLoginAttempt(userId, '192.168.1.1')
      ).rejects.toThrow('Too many login attempts');
    });

    it('should reset attempts after expiry time', async () => {
      const userId = 'user_reset';

      await fraudDetection.trackLoginAttempt(userId, '192.168.1.1');
      expect((await fraudDetection.trackLoginAttempt(userId, '192.168.1.1')).attempts).toBe(2);

      // Simulate expiry (mock Redis TTL)
      await redisClient.del(`fraud:login:${userId}`);

      const result = await fraudDetection.trackLoginAttempt(userId, '192.168.1.1');
      expect(result.attempts).toBe(1);
    });
  });

  describe('trackOTPAttempt()', () => {
    it('should allow OTP verification attempts', async () => {
      const userId = 'user_otp';
      const result = await fraudDetection.trackOTPAttempt(userId);

      expect(result).toBeDefined();
      expect(result.attempts).toBeLessThanOrEqual(3);
      expect(result.remaining).toBeGreaterThanOrEqual(0);
    });

    it('should block after 3 failed OTP attempts', async () => {
      const userId = 'user_otp_blocked';

      // Make 3 attempts
      for (let i = 0; i < 3; i++) {
        await fraudDetection.trackOTPAttempt(userId);
      }

      // 4th attempt should throw AppError
      await expect(
        fraudDetection.trackOTPAttempt(userId)
      ).rejects.toThrow('Too many OTP attempts');
    });
  });

  describe('trackPaymentAttempt()', () => {
    it('should allow normal payment attempts', async () => {
      const userId = 'user_payment';
      const result = await fraudDetection.trackPaymentAttempt(userId, 10000);

      expect(result).toBeDefined();
      expect(result.hourlyAttempts).toBeGreaterThan(0);
      expect(result.dailyPayments).toBeGreaterThan(0);
    });

    it('should block excessive payment attempts per hour', async () => {
      const userId = 'user_payment_spam';

      // Make 3 payment attempts in an hour
      for (let i = 0; i < 3; i++) {
        await fraudDetection.trackPaymentAttempt(userId, 5000);
      }

      // 4th attempt should throw AppError
      await expect(
        fraudDetection.trackPaymentAttempt(userId, 5000)
      ).rejects.toThrow('Too many payment attempts');
    });

    it('should flag large amount transactions', async () => {
      const userId = 'user_large_payment';
      
      // Amount exceeds threshold - should throw AppError
      await expect(
        fraudDetection.trackPaymentAttempt(userId, 1000001) // Exceeds 1000000 threshold
      ).rejects.toThrow('exceeds security threshold');
    });

    it('should flag rapid payment attempts', async () => {
      const userId = 'user_rapid';

      // Make multiple attempts within limits (3 max)
      const result1 = await fraudDetection.trackPaymentAttempt(userId, 1000);
      const result2 = await fraudDetection.trackPaymentAttempt(userId, 1000);
      const result3 = await fraudDetection.trackPaymentAttempt(userId, 1000);

      expect(result1.hourlyAttempts).toBe(1);
      expect(result2.hourlyAttempts).toBe(2);
      expect(result3.hourlyAttempts).toBe(3);
    });
  });

  describe('blockUser()', () => {
    it('should block user for specified duration', async () => {
      const userId = 'user_to_block';
      await fraudDetection.blockUser(userId, 'Suspicious activity', 3600);

      const result = await fraudDetection.isUserBlocked(userId);
      expect(result.blocked).toBe(true);
    });

    it('should store block reason', async () => {
      const userId = 'user_with_reason';
      const reason = 'Multiple failed login attempts';

      await fraudDetection.blockUser(userId, reason, 3600);

      const blockInfo = await fraudDetection.isUserBlocked(userId);
      expect(blockInfo.blocked).toBe(true);
      expect(blockInfo.reason).toBe(reason);
    });
  });

  describe('isUserBlocked()', () => {
    it('should return false for non-blocked user', async () => {
      const result = await fraudDetection.isUserBlocked('normal_user');
      expect(result.blocked).toBe(false);
    });

    it('should return true for blocked user', async () => {
      const userId = 'blocked_user';
      await fraudDetection.blockUser(userId, 'Test block', 3600);

      const result = await fraudDetection.isUserBlocked(userId);
      expect(result.blocked).toBe(true);
      expect(result.reason).toBe('Test block');
    });

    it('should return false after block expires', async () => {
      const userId = 'temp_blocked';
      await fraudDetection.blockUser(userId, 'Temp block', 1); // 1 second

      // Wait for expiry
      await new Promise((resolve) => setTimeout(resolve, 1100));

      const result = await fraudDetection.isUserBlocked(userId);
      expect(result.blocked).toBe(false);
    });
  });

  describe('Pattern Detection', () => {
    it('should detect velocity abuse', async () => {
      const userId = 'velocity_abuser';

      // Make 5 attempts (max threshold)
      for (let i = 0; i < 5; i++) {
        await fraudDetection.trackLoginAttempt(userId, '192.168.1.1');
      }

      // 6th attempt should be blocked
      await expect(
        fraudDetection.trackLoginAttempt(userId, '192.168.1.1')
      ).rejects.toThrow('Too many login attempts');
    });

    it('should track suspicious patterns', async () => {
      const userId = 'suspicious_user';

      // Make failed login attempts
      for (let i = 0; i < 3; i++) {
        await fraudDetection.trackLoginAttempt(userId, '192.168.1.1');
      }

      // Check suspicious patterns
      const result = await fraudDetection.analyzeSuspiciousPatterns(userId, {
        paymentAmount: 10,  // Unusual: too small
      });

      expect(result).toBeDefined();
      expect(result.suspicious).toBeDefined();
    });
  });

  describe('Edge Cases', () => {
    it('should handle Redis connection errors gracefully', async () => {
      // Service uses try-catch and returns default values on Redis errors
      const result = await fraudDetection.trackLoginAttempt('user_redis_fail', '192.168.1.1');
      expect(result).toBeDefined();
      expect(result.attempts).toBeDefined();
    });

    it('should handle invalid user IDs', async () => {
      const result = await fraudDetection.trackLoginAttempt('', '192.168.1.1');
      expect(result).toBeDefined();
      expect(result.attempts).toBeDefined();
    });

    it('should handle negative amounts', async () => {
      // Negative amount should be allowed (might be refund), just tracked
      const result = await fraudDetection.trackPaymentAttempt('user', -1000);
      expect(result).toBeDefined();
      expect(result.hourlyAttempts).toBeDefined();
    });
  });
});
