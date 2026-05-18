import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import * as fraudDetection from '../../src/services/fraudDetection.service.js';
import { setupRedis, teardownRedis } from '../helpers/testUtils.js';

describe('Fraud Detection Service - Unit Tests', () => {
  let redisClient;

  beforeEach(() => {
    redisClient = setupRedis();
  });

  afterEach(async () => {
    await teardownRedis();
  });

  describe('trackLoginAttempt()', () => {
    it('should allow first login attempt', async () => {
      const userId = 'user123';
      const result = await fraudDetection.trackLoginAttempt(userId);

      expect(result.blocked).toBe(false);
      expect(result.attempts).toBe(1);
      expect(result.remaining).toBe(4); // 5 max - 1
    });

    it('should block after 5 failed attempts', async () => {
      const userId = 'user_blocked';

      // Make 5 attempts
      for (let i = 0; i < 5; i++) {
        await fraudDetection.trackLoginAttempt(userId);
      }

      // 6th attempt should be blocked
      const result = await fraudDetection.trackLoginAttempt(userId);
      expect(result.blocked).toBe(true);
      expect(result.attempts).toBe(5);
    });

    it('should reset attempts after expiry time', async () => {
      const userId = 'user_reset';

      await fraudDetection.trackLoginAttempt(userId);
      expect((await fraudDetection.trackLoginAttempt(userId)).attempts).toBe(2);

      // Simulate expiry (mock Redis TTL)
      await redisClient.del(`fraud:login:${userId}`);

      const result = await fraudDetection.trackLoginAttempt(userId);
      expect(result.attempts).toBe(1);
    });
  });

  describe('trackOTPAttempt()', () => {
    it('should allow OTP verification attempts', async () => {
      const userId = 'user_otp';
      const result = await fraudDetection.trackOTPAttempt(userId);

      expect(result.blocked).toBe(false);
      expect(result.attempts).toBeLessThanOrEqual(3);
    });

    it('should block after 3 failed OTP attempts', async () => {
      const userId = 'user_otp_blocked';

      // Make 3 attempts
      for (let i = 0; i < 3; i++) {
        await fraudDetection.trackOTPAttempt(userId);
      }

      // 4th attempt should be blocked
      const result = await fraudDetection.trackOTPAttempt(userId);
      expect(result.blocked).toBe(true);
    });
  });

  describe('trackPaymentAttempt()', () => {
    it('should allow normal payment attempts', async () => {
      const userId = 'user_payment';
      const result = await fraudDetection.trackPaymentAttempt(userId, 10000);

      expect(result.blocked).toBe(false);
      expect(result.hourlyAttempts).toBe(1);
    });

    it('should block excessive payment attempts per hour', async () => {
      const userId = 'user_payment_spam';

      // Make 3 payment attempts in an hour
      for (let i = 0; i < 3; i++) {
        await fraudDetection.trackPaymentAttempt(userId, 5000);
      }

      // 4th attempt should be blocked
      const result = await fraudDetection.trackPaymentAttempt(userId, 5000);
      expect(result.blocked).toBe(true);
    });

    it('should flag large amount transactions', async () => {
      const userId = 'user_large_payment';
      const result = await fraudDetection.trackPaymentAttempt(userId, 1000000); // Large amount

      expect(result.flagged).toBe(true);
      expect(result.reason).toContain('large amount');
    });

    it('should flag rapid payment attempts', async () => {
      const userId = 'user_rapid';

      // Make rapid payment attempts
      const promises = [];
      for (let i = 0; i < 5; i++) {
        promises.push(fraudDetection.trackPaymentAttempt(userId, 10000));
      }
      const results = await Promise.all(promises);

      const flaggedCount = results.filter((r) => r.flagged).length;
      expect(flaggedCount).toBeGreaterThan(0);
    });
  });

  describe('blockUser()', () => {
    it('should block user for specified duration', async () => {
      const userId = 'user_to_block';
      await fraudDetection.blockUser(userId, 'Suspicious activity', 3600);

      const isBlocked = await fraudDetection.isUserBlocked(userId);
      expect(isBlocked).toBe(true);
    });

    it('should store block reason', async () => {
      const userId = 'user_with_reason';
      const reason = 'Multiple failed login attempts';

      await fraudDetection.blockUser(userId, reason, 3600);

      const blockInfo = await fraudDetection.getBlockInfo(userId);
      expect(blockInfo.reason).toBe(reason);
    });
  });

  describe('isUserBlocked()', () => {
    it('should return false for non-blocked user', async () => {
      const isBlocked = await fraudDetection.isUserBlocked('normal_user');
      expect(isBlocked).toBe(false);
    });

    it('should return true for blocked user', async () => {
      const userId = 'blocked_user';
      await fraudDetection.blockUser(userId, 'Test block', 3600);

      const isBlocked = await fraudDetection.isUserBlocked(userId);
      expect(isBlocked).toBe(true);
    });

    it('should return false after block expires', async () => {
      const userId = 'temp_blocked';
      await fraudDetection.blockUser(userId, 'Temp block', 1); // 1 second

      // Wait for expiry
      await new Promise((resolve) => setTimeout(resolve, 1100));

      const isBlocked = await fraudDetection.isUserBlocked(userId);
      expect(isBlocked).toBe(false);
    });
  });

  describe('Pattern Detection', () => {
    it('should detect velocity abuse', async () => {
      const userId = 'velocity_abuser';

      // Rapid fire requests
      const results = await Promise.all(
        Array(20)
          .fill()
          .map(() => fraudDetection.trackLoginAttempt(userId))
      );

      const blocked = results.some((r) => r.blocked);
      expect(blocked).toBe(true);
    });

    it('should detect distributed attack patterns', async () => {
      // Multiple users from same IP
      const ip = '192.168.1.100';
      const userIds = Array(10)
        .fill()
        .map((_, i) => `user${i}`);

      for (const userId of userIds) {
        await fraudDetection.trackLoginAttempt(userId, ip);
      }

      const result = await fraudDetection.checkIPReputation(ip);
      expect(result.suspicious).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should handle Redis connection errors gracefully', async () => {
      // Simulate Redis failure
      await teardownRedis();

      const result = await fraudDetection.trackLoginAttempt('user_redis_fail');
      expect(result).toBeDefined();
      // Should fail open (allow) on Redis errors for availability
      expect(result.blocked).toBe(false);
    });

    it('should handle invalid user IDs', async () => {
      const result = await fraudDetection.trackLoginAttempt('');
      expect(result).toBeDefined();
      expect(result.blocked).toBe(false);
    });

    it('should handle negative amounts', async () => {
      const result = await fraudDetection.trackPaymentAttempt('user', -1000);
      expect(result.blocked).toBe(true);
      expect(result.reason).toContain('Invalid');
    });
  });
});
