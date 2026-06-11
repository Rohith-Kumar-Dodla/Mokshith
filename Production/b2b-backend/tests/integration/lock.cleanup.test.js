import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import mongoose from 'mongoose';
import { redisClient } from '../../src/config/redis.js';
import { clearDatabase } from '../helpers/testUtils.js';

/**
 * 🔒 CRITICAL: Distributed Lock Cleanup & Stale Lock Detection Tests
 * Tests lock acquisition, release, stale detection, timeout, extension, and database fallback
 */

describe('Lock Cleanup & Management Tests', () => {
  beforeEach(async () => {
    await clearDatabase();
    await redisClient.flushdb();

    // Reset circuit breaker
    if (redisClient.circuitBreaker) {
      redisClient.circuitBreaker.state = 'CLOSED';
      redisClient.circuitBreaker.failureCount = 0;
    }
  });

  afterEach(async () => {
    await redisClient.flushdb();

    // Clear database locks
    const Lock = mongoose.model('Lock');
    await Lock.deleteMany({});
  });

  describe('Lock Acquisition & Release', () => {
    it('should acquire lock successfully', async () => {
      const lockKey = 'payment:lock:order_123';
      const lockValue = `lock_${Date.now()}`;

      const acquired = await redisClient.acquireLock(lockKey, lockValue, 10);
      expect(acquired).toBe(true);

      // Verify lock exists in Redis
      const storedValue = await redisClient.get(lockKey);
      expect(storedValue).toBe(lockValue);

      // Verify TTL is set
      const ttl = await redisClient.ttl(lockKey);
      expect(ttl).toBeGreaterThan(0);
      expect(ttl).toBeLessThanOrEqual(10);

      // Cleanup
      await redisClient.releaseLock(lockKey, lockValue);
    });

    it('should release lock successfully', async () => {
      const lockKey = 'test:lock:release';
      const lockValue = `lock_${Date.now()}`;

      await redisClient.acquireLock(lockKey, lockValue, 10);

      const released = await redisClient.releaseLock(lockKey, lockValue);
      expect(released).toBe(true);

      // Verify lock deleted
      const storedValue = await redisClient.get(lockKey);
      expect(storedValue).toBeNull();
    });

    it('should prevent releasing lock with wrong value', async () => {
      const lockKey = 'test:lock:wrong-value';
      const lockValue = `lock_${Date.now()}`;
      const wrongValue = 'wrong_lock_value';

      await redisClient.acquireLock(lockKey, lockValue, 10);

      // Try to release with wrong value
      const released = await redisClient.releaseLock(lockKey, wrongValue);
      expect(released).toBe(false);

      // Lock should still exist
      const storedValue = await redisClient.get(lockKey);
      expect(storedValue).toBe(lockValue);

      // Cleanup with correct value
      await redisClient.releaseLock(lockKey, lockValue);
    });

    it('should prevent acquiring already-held lock', async () => {
      const lockKey = 'test:lock:concurrent';
      const lockValue1 = `lock_${Date.now()}_1`;
      const lockValue2 = `lock_${Date.now()}_2`;

      // First acquisition
      const acquired1 = await redisClient.acquireLock(lockKey, lockValue1, 10);
      expect(acquired1).toBe(true);

      // Second acquisition (should fail)
      const acquired2 = await redisClient.acquireLock(lockKey, lockValue2, 10);
      expect(acquired2).toBe(false);

      // Cleanup
      await redisClient.releaseLock(lockKey, lockValue1);
    });
  });

  describe('Stale Lock Detection', () => {
    it('should detect stale locks with no TTL', async () => {
      const lockKey = 'test:lock:stale';
      const lockValue = `lock_${Date.now()}`;

      // Create lock
      await redisClient.set(lockKey, lockValue);

      // Remove TTL to make it stale
      await redisClient.persist(lockKey);

      // Detect stale lock
      const isStale = await redisClient.detectStaleLock(lockKey);
      expect(isStale).toBe(true);

      // Verify lock was deleted
      const exists = await redisClient.get(lockKey);
      expect(exists).toBeNull();
    });

    it('should not detect valid locks as stale', async () => {
      const lockKey = 'test:lock:valid';
      const lockValue = `lock_${Date.now()}`;

      await redisClient.acquireLock(lockKey, lockValue, 10);

      const isStale = await redisClient.detectStaleLock(lockKey);
      expect(isStale).toBe(false);

      // Lock should still exist
      const exists = await redisClient.get(lockKey);
      expect(exists).toBe(lockValue);

      await redisClient.releaseLock(lockKey, lockValue);
    });

    it('should handle detection of non-existent locks', async () => {
      const lockKey = 'test:lock:nonexistent';

      const isStale = await redisClient.detectStaleLock(lockKey);
      expect(isStale).toBe(false);
    });

    it('should auto-detect and remove stale locks before acquisition', async () => {
      const lockKey = 'test:lock:auto-cleanup';
      const lockValue1 = `lock_${Date.now()}_1`;
      const lockValue2 = `lock_${Date.now()}_2`;

      // Create stale lock (no TTL)
      await redisClient.set(lockKey, lockValue1);
      await redisClient.persist(lockKey);

      // Detect stale lock
      await redisClient.detectStaleLock(lockKey);

      // Should be able to acquire now
      const acquired = await redisClient.acquireLock(lockKey, lockValue2, 10);
      expect(acquired).toBe(true);

      await redisClient.releaseLock(lockKey, lockValue2);
    });
  });

  describe('Lock Extension', () => {
    it('should extend lock TTL', async () => {
      const lockKey = 'test:lock:extend';
      const lockValue = `lock_${Date.now()}`;

      await redisClient.acquireLock(lockKey, lockValue, 5);

      const initialTTL = await redisClient.ttl(lockKey);
      expect(initialTTL).toBeLessThanOrEqual(5);

      // Extend lock by 10 more seconds
      const extended = await redisClient.extendLock(lockKey, lockValue, 10);
      expect(extended).toBe(true);

      const newTTL = await redisClient.ttl(lockKey);
      expect(newTTL).toBeGreaterThan(initialTTL);
      expect(newTTL).toBeLessThanOrEqual(10);

      await redisClient.releaseLock(lockKey, lockValue);
    });

    it('should prevent extending lock with wrong value', async () => {
      const lockKey = 'test:lock:extend-wrong';
      const lockValue = `lock_${Date.now()}`;
      const wrongValue = 'wrong_value';

      await redisClient.acquireLock(lockKey, lockValue, 5);

      const extended = await redisClient.extendLock(lockKey, wrongValue, 10);
      expect(extended).toBe(false);

      await redisClient.releaseLock(lockKey, lockValue);
    });

    it('should support long-running operations via extension', async () => {
      const lockKey = 'test:lock:long-operation';
      const lockValue = `lock_${Date.now()}`;

      await redisClient.acquireLock(lockKey, lockValue, 3);

      // Simulate long operation with periodic extension
      for (let i = 0; i < 3; i++) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        await redisClient.extendLock(lockKey, lockValue, 3);
      }

      // Lock should still be held
      const exists = await redisClient.get(lockKey);
      expect(exists).toBe(lockValue);

      await redisClient.releaseLock(lockKey, lockValue);
    }, 5000);
  });

  describe('Lock Timeout & Expiry', () => {
    it('should auto-expire lock after TTL', async () => {
      const lockKey = 'test:lock:expire';
      const lockValue = `lock_${Date.now()}`;

      await redisClient.acquireLock(lockKey, lockValue, 2); // 2 second TTL

      // Verify lock exists
      let exists = await redisClient.get(lockKey);
      expect(exists).toBe(lockValue);

      // Wait for expiry
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Lock should be auto-deleted
      exists = await redisClient.get(lockKey);
      expect(exists).toBeNull();
    }, 5000);

    it('should allow re-acquisition after expiry', async () => {
      const lockKey = 'test:lock:reacquire';
      const lockValue1 = `lock_${Date.now()}_1`;
      const lockValue2 = `lock_${Date.now()}_2`;

      await redisClient.acquireLock(lockKey, lockValue1, 1);

      // Wait for expiry
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Should be able to acquire with new value
      const acquired = await redisClient.acquireLock(lockKey, lockValue2, 10);
      expect(acquired).toBe(true);

      await redisClient.releaseLock(lockKey, lockValue2);
    }, 5000);
  });

  describe('Database Fallback for Locks', () => {
    it('should use database fallback when Redis circuit is open', async () => {
      // Force circuit breaker to OPEN
      for (let i = 0; i < 5; i++) {
        redisClient.circuitBreaker.recordFailure();
      }

      expect(redisClient.circuitBreaker.state).toBe('OPEN');

      const lockKey = 'test:lock:db-fallback';
      const lockValue = `lock_${Date.now()}`;

      // Should acquire lock via database
      const acquired = await redisClient.acquireLock(lockKey, lockValue, 10);
      expect(acquired).toBe(true);

      // Verify lock in database
      const Lock = mongoose.model('Lock');
      const lock = await Lock.findOne({ key: lockKey });
      expect(lock).toBeDefined();
      expect(lock.value).toBe(lockValue);

      // Release should also use database
      const released = await redisClient.releaseLock(lockKey, lockValue);
      expect(released).toBe(true);

      // Verify lock deleted from database
      const lockAfter = await Lock.findOne({ key: lockKey });
      expect(lockAfter).toBeNull();
    });

    it('should prevent duplicate database locks', async () => {
      // Force circuit open
      for (let i = 0; i < 5; i++) {
        redisClient.circuitBreaker.recordFailure();
      }

      const lockKey = 'test:lock:db-duplicate';
      const lockValue1 = `lock_${Date.now()}_1`;
      const lockValue2 = `lock_${Date.now()}_2`;

      // First acquisition
      const acquired1 = await redisClient.acquireLock(lockKey, lockValue1, 10);
      expect(acquired1).toBe(true);

      // Second acquisition (should fail due to unique index)
      const acquired2 = await redisClient.acquireLock(lockKey, lockValue2, 10);
      expect(acquired2).toBe(false);

      // Cleanup
      await redisClient.releaseLock(lockKey, lockValue1);
    });

    it('should cleanup expired database locks', async () => {
      const Lock = mongoose.model('Lock');

      // Create expired lock
      const expiredLock = await Lock.create({
        key: 'test:lock:expired',
        value: 'expired_value',
        expiresAt: new Date(Date.now() - 10000), // 10 seconds ago
      });

      // Trigger cleanup
      await redisClient.cleanupExpiredLocks();

      // Verify expired lock deleted
      const lock = await Lock.findById(expiredLock._id);
      expect(lock).toBeNull();
    });

    it('should preserve valid database locks during cleanup', async () => {
      const Lock = mongoose.model('Lock');

      // Create valid lock
      const validLock = await Lock.create({
        key: 'test:lock:valid',
        value: 'valid_value',
        expiresAt: new Date(Date.now() + 10000), // 10 seconds from now
      });

      // Trigger cleanup
      await redisClient.cleanupExpiredLocks();

      // Verify valid lock still exists
      const lock = await Lock.findById(validLock._id);
      expect(lock).toBeDefined();

      // Cleanup
      await Lock.deleteOne({ _id: validLock._id });
    });
  });

  describe('Concurrent Lock Operations', () => {
    it('should handle concurrent lock acquisitions', async () => {
      const lockKey = 'test:lock:concurrent-acq';
      const promises = [];

      // 10 concurrent acquisition attempts
      for (let i = 0; i < 10; i++) {
        const lockValue = `lock_${Date.now()}_${i}`;
        promises.push(redisClient.acquireLock(lockKey, lockValue, 10));
      }

      const results = await Promise.all(promises);

      // Only one should succeed
      const successes = results.filter(r => r === true).length;
      expect(successes).toBe(1);

      // Find the successful lock value and cleanup
      const storedValue = await redisClient.get(lockKey);
      if (storedValue) {
        await redisClient.releaseLock(lockKey, storedValue);
      }
    });

    it('should handle concurrent releases safely', async () => {
      const lockKey = 'test:lock:concurrent-release';
      const lockValue = `lock_${Date.now()}`;

      await redisClient.acquireLock(lockKey, lockValue, 10);

      // Multiple concurrent release attempts
      const promises = Array(5).fill(null).map(() =>
        redisClient.releaseLock(lockKey, lockValue)
      );

      const results = await Promise.all(promises);

      // First should succeed, rest should return false
      const successes = results.filter(r => r === true).length;
      expect(successes).toBe(1);

      // Lock should be gone
      const exists = await redisClient.get(lockKey);
      expect(exists).toBeNull();
    });

    it('should handle lock contention with retries', async () => {
      const lockKey = 'test:lock:contention';
      const lockValue1 = `lock_${Date.now()}_1`;
      const lockValue2 = `lock_${Date.now()}_2`;

      // Acquire first lock with short TTL
      await redisClient.acquireLock(lockKey, lockValue1, 2);

      // Try to acquire second lock with retry
      let acquired = false;
      for (let i = 0; i < 5; i++) {
        acquired = await redisClient.acquireLock(lockKey, lockValue2, 10);
        if (acquired) break;
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      // Should eventually succeed after first lock expires
      expect(acquired).toBe(true);

      await redisClient.releaseLock(lockKey, lockValue2);
    }, 5000);
  });

  describe('Lock Cleanup Automation', () => {
    it('should run periodic cleanup for expired database locks', async () => {
      const Lock = mongoose.model('Lock');

      // Create multiple expired locks
      await Lock.create([
        {
          key: 'test:lock:expired_1',
          value: 'value1',
          expiresAt: new Date(Date.now() - 5000),
        },
        {
          key: 'test:lock:expired_2',
          value: 'value2',
          expiresAt: new Date(Date.now() - 3000),
        },
        {
          key: 'test:lock:valid',
          value: 'value3',
          expiresAt: new Date(Date.now() + 10000),
        },
      ]);

      // Run cleanup
      await redisClient.cleanupExpiredLocks();

      // Verify only valid lock remains
      const locks = await Lock.find({});
      expect(locks.length).toBe(1);
      expect(locks[0].key).toBe('test:lock:valid');

      // Cleanup
      await Lock.deleteMany({});
    });

    it('should handle cleanup with no expired locks', async () => {
      const Lock = mongoose.model('Lock');

      // Create only valid locks
      await Lock.create([
        {
          key: 'test:lock:valid_1',
          value: 'value1',
          expiresAt: new Date(Date.now() + 10000),
        },
        {
          key: 'test:lock:valid_2',
          value: 'value2',
          expiresAt: new Date(Date.now() + 20000),
        },
      ]);

      const initialCount = await Lock.countDocuments();

      // Run cleanup
      await redisClient.cleanupExpiredLocks();

      // Verify no locks deleted
      const finalCount = await Lock.countDocuments();
      expect(finalCount).toBe(initialCount);

      await Lock.deleteMany({});
    });
  });

  describe('Edge Cases & Error Handling', () => {
    it('should handle lock acquisition with zero TTL', async () => {
      const lockKey = 'test:lock:zero-ttl';
      const lockValue = `lock_${Date.now()}`;

      await expect(
        redisClient.acquireLock(lockKey, lockValue, 0)
      ).rejects.toThrow(/invalid ttl|ttl must be positive/i);
    });

    it('should handle lock acquisition with negative TTL', async () => {
      const lockKey = 'test:lock:negative-ttl';
      const lockValue = `lock_${Date.now()}`;

      await expect(
        redisClient.acquireLock(lockKey, lockValue, -5)
      ).rejects.toThrow(/invalid ttl|negative/i);
    });

    it('should handle releasing non-existent lock', async () => {
      const lockKey = 'test:lock:nonexistent-release';
      const lockValue = `lock_${Date.now()}`;

      const released = await redisClient.releaseLock(lockKey, lockValue);
      expect(released).toBe(false);
    });

    it('should handle extending non-existent lock', async () => {
      const lockKey = 'test:lock:nonexistent-extend';
      const lockValue = `lock_${Date.now()}`;

      const extended = await redisClient.extendLock(lockKey, lockValue, 10);
      expect(extended).toBe(false);
    });

    it('should handle database connection errors gracefully', async () => {
      // Force circuit open to use database
      for (let i = 0; i < 5; i++) {
        redisClient.circuitBreaker.recordFailure();
      }

      // Temporarily close mongoose connection
      await mongoose.connection.close();

      const lockKey = 'test:lock:db-error';
      const lockValue = `lock_${Date.now()}`;

      // Should throw error
      await expect(
        redisClient.acquireLock(lockKey, lockValue, 10)
      ).rejects.toThrow();

      // Reconnect mongoose
      await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/test');
    });
  });
});
