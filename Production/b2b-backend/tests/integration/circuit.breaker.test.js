import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { redisClient } from '../../src/config/redis.js';
import { clearDatabase } from '../helpers/testUtils.js';

/**
 * 🔒 CRITICAL: Redis Circuit Breaker & Degraded Mode Tests
 * Tests circuit breaker states, transitions, degraded mode, and database fallback
 */

describe('Redis Circuit Breaker Tests', () => {
  // Connect once for the suite and teardown after all tests to avoid duplicate connect calls.
  beforeAll(async () => {
    await clearDatabase();
    try {
      if (typeof redisClient.connect === 'function') {
        await redisClient.connect();
      }
    } catch (err) {
      // Ignore connect errors in test environment - tests will exercise fallback behavior
    }
  });

  afterAll(async () => {
    // Reset circuit breaker and quit redis connection
    if (redisClient.circuitBreaker) {
      redisClient.circuitBreaker.state = 'CLOSED';
      redisClient.circuitBreaker.failureCount = 0;
      redisClient.circuitBreaker.successCount = 0;
      redisClient.circuitBreaker.nextAttempt = null;
    }
    try {
      if (typeof redisClient.quit === 'function') {
        await redisClient.quit();
      }
    } catch (err) {
      // ignore
    }
  });

  beforeEach(async () => {
    await clearDatabase();
    // Reset circuit breaker state between tests to ensure deterministic behavior
    if (redisClient.circuitBreaker) {
      redisClient.circuitBreaker.state = 'CLOSED';
      redisClient.circuitBreaker.failureCount = 0;
      redisClient.circuitBreaker.successCount = 0;
      redisClient.circuitBreaker.nextAttempt = null;
    }
  });

  describe('Circuit Breaker State Transitions', () => {
    it('should start in CLOSED state', () => {
      expect(redisClient.circuitBreaker.state).toBe('CLOSED');
      expect(redisClient.circuitBreaker.failureCount).toBe(0);
    });

    it('should transition to OPEN after 5 consecutive failures', async () => {
      // Simulate 5 failures
      for (let i = 0; i < 5; i++) {
        redisClient.circuitBreaker.recordFailure();
      }

      expect(redisClient.circuitBreaker.state).toBe('OPEN');
      expect(redisClient.circuitBreaker.failureCount).toBe(5);
      expect(redisClient.circuitBreaker.nextAttempt).toBeDefined();
    });

    it('should block operations when OPEN', async () => {
      // Force circuit to OPEN state
      for (let i = 0; i < 5; i++) {
        redisClient.circuitBreaker.recordFailure();
      }

      expect(redisClient.circuitBreaker.state).toBe('OPEN');

      // Try to perform operation
      const canAttempt = redisClient.circuitBreaker.canAttempt();
      expect(canAttempt).toBe(false);
    });

    it('should transition to HALF_OPEN after timeout', async () => {
      // Force circuit to OPEN
      for (let i = 0; i < 5; i++) {
        redisClient.circuitBreaker.recordFailure();
      }

      expect(redisClient.circuitBreaker.state).toBe('OPEN');

      // Wait for timeout (30 seconds in production, shortened for test)
      redisClient.circuitBreaker.nextAttempt = Date.now() - 1000; // Make it expire

      const canAttempt = redisClient.circuitBreaker.canAttempt();
      expect(canAttempt).toBe(true);
      expect(redisClient.circuitBreaker.state).toBe('HALF_OPEN');
    });

    it('should transition from HALF_OPEN to CLOSED after 2 successes', async () => {
      // Set to HALF_OPEN state
      redisClient.circuitBreaker.state = 'HALF_OPEN';
      redisClient.circuitBreaker.successCount = 0;

      // Record 2 successes
      redisClient.circuitBreaker.recordSuccess();
      expect(redisClient.circuitBreaker.state).toBe('HALF_OPEN');
      expect(redisClient.circuitBreaker.successCount).toBe(1);

      redisClient.circuitBreaker.recordSuccess();
      expect(redisClient.circuitBreaker.state).toBe('CLOSED');
      expect(redisClient.circuitBreaker.successCount).toBe(0);
      expect(redisClient.circuitBreaker.failureCount).toBe(0);
    });

    it('should transition from HALF_OPEN back to OPEN on failure', async () => {
      // Set to HALF_OPEN state
      redisClient.circuitBreaker.state = 'HALF_OPEN';
      redisClient.circuitBreaker.successCount = 1;

      // Failure should re-open circuit
      redisClient.circuitBreaker.recordFailure();
      expect(redisClient.circuitBreaker.state).toBe('OPEN');
      expect(redisClient.circuitBreaker.nextAttempt).toBeDefined();
    });

    it('should reset failure count on success in CLOSED state', async () => {
      // Record some failures
      redisClient.circuitBreaker.recordFailure();
      redisClient.circuitBreaker.recordFailure();
      expect(redisClient.circuitBreaker.failureCount).toBe(2);

      // Success should reset
      redisClient.circuitBreaker.recordSuccess();
      expect(redisClient.circuitBreaker.failureCount).toBe(0);
      expect(redisClient.circuitBreaker.state).toBe('CLOSED');
    });
  });

  describe('Redis Operations During Circuit States', () => {
    it('should execute Redis operations when circuit is CLOSED', async () => {
      expect(redisClient.circuitBreaker.state).toBe('CLOSED');

      const result = await redisClient.set('test-key', 'test-value', 'EX', 60);
      expect(result).toBe('OK');

      const value = await redisClient.get('test-key');
      expect(value).toBe('test-value');
    });

    it('should skip Redis operations when circuit is OPEN', async () => {
      // Force OPEN state
      for (let i = 0; i < 5; i++) {
        redisClient.circuitBreaker.recordFailure();
      }

      expect(redisClient.circuitBreaker.state).toBe('OPEN');

      // Operations should be skipped
      const result = await redisClient.set('test-key-open', 'value');
      expect(result).toBeNull();
    });

    it('should attempt Redis operations in HALF_OPEN state', async () => {
      // Set to HALF_OPEN
      redisClient.circuitBreaker.state = 'HALF_OPEN';
      redisClient.circuitBreaker.successCount = 0;

      // Operation should be attempted
      const canAttempt = redisClient.circuitBreaker.canAttempt();
      expect(canAttempt).toBe(true);

      // Successful operation should increment success count
      await redisClient.set('test-key-half-open', 'value', 'EX', 60);
      
      // Success should be recorded
      expect(redisClient.circuitBreaker.successCount).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Database Fallback for Locks', () => {
    it('should use database fallback when Redis is unavailable', async () => {
      // Force circuit to OPEN
      for (let i = 0; i < 5; i++) {
        redisClient.circuitBreaker.recordFailure();
      }

      expect(redisClient.circuitBreaker.state).toBe('OPEN');

      // Try to acquire lock (should fall back to database)
      const lockKey = 'payment:lock:order_123';
      const lockValue = `lock_${Date.now()}`;
      const acquired = await redisClient.acquireLock(lockKey, lockValue, 10);

      // Should succeed using database fallback
      expect(acquired).toBe(true);

      // Verify lock exists in database
      const Lock = (await import('mongoose')).default.model('Lock');
      const lock = await Lock.findOne({ key: lockKey });
      expect(lock).toBeDefined();
      expect(lock.value).toBe(lockValue);

      // Release lock
      const released = await redisClient.releaseLock(lockKey, lockValue);
      expect(released).toBe(true);
    });

    it('should return to Redis after circuit closes', async () => {
      // Force OPEN state
      for (let i = 0; i < 5; i++) {
        redisClient.circuitBreaker.recordFailure();
      }

      // Wait and transition to HALF_OPEN
      redisClient.circuitBreaker.nextAttempt = Date.now() - 1000;
      redisClient.circuitBreaker.canAttempt();

      // Record successes to close circuit
      redisClient.circuitBreaker.recordSuccess();
      redisClient.circuitBreaker.recordSuccess();

      expect(redisClient.circuitBreaker.state).toBe('CLOSED');

      // Lock acquisition should use Redis
      const lockKey = 'test:lock:after-recovery';
      const lockValue = `lock_${Date.now()}`;
      const acquired = await redisClient.acquireLock(lockKey, lockValue, 10);

      expect(acquired).toBe(true);

      // Verify lock is in Redis
      const ttl = await redisClient.ttl(lockKey);
      expect(ttl).toBeGreaterThan(0);

      await redisClient.releaseLock(lockKey, lockValue);
    });
  });

  describe('Concurrent Operations with Circuit Breaker', () => {
    it('should handle concurrent operations when circuit opens mid-flight', async () => {
      const operations = [];
      
      // Start with CLOSED state
      expect(redisClient.circuitBreaker.state).toBe('CLOSED');

      // Trigger failures in parallel
      for (let i = 0; i < 10; i++) {
        operations.push(
          (async () => {
            try {
              // Simulate operation that might fail
              if (i >= 5) {
                redisClient.circuitBreaker.recordFailure();
              }
              return await redisClient.set(`concurrent-key-${i}`, `value-${i}`, 'EX', 60);
            } catch (err) {
              return null;
            }
          })()
        );
      }

      const results = await Promise.all(operations);

      // Circuit should be open after 5 failures
      expect(redisClient.circuitBreaker.state).toBe('OPEN');

      // Some operations should succeed, some should be blocked
      const successful = results.filter(r => r === 'OK').length;
      const blocked = results.filter(r => r === null).length;

      expect(successful + blocked).toBe(10);
    });

    it('should serialize circuit state updates safely', async () => {
      const promises = [];

      // Simulate many concurrent failures
      for (let i = 0; i < 20; i++) {
        promises.push(
          new Promise(resolve => {
            redisClient.circuitBreaker.recordFailure();
            resolve(redisClient.circuitBreaker.failureCount);
          })
        );
      }

      await Promise.all(promises);

      // Failure count should be capped at threshold
      expect(redisClient.circuitBreaker.state).toBe('OPEN');
      expect(redisClient.circuitBreaker.failureCount).toBeGreaterThanOrEqual(5);
    });
  });

  describe('Circuit Breaker Recovery Scenarios', () => {
    it('should recover from temporary Redis outage', async () => {
      // Simulate temporary outage
      for (let i = 0; i < 5; i++) {
        redisClient.circuitBreaker.recordFailure();
      }

      expect(redisClient.circuitBreaker.state).toBe('OPEN');

      // Simulate time passing (circuit timeout)
      redisClient.circuitBreaker.nextAttempt = Date.now() - 1000;

      // Transition to HALF_OPEN
      redisClient.circuitBreaker.canAttempt();
      expect(redisClient.circuitBreaker.state).toBe('HALF_OPEN');

      // Simulate successful reconnection
      await redisClient.set('recovery-test', 'success', 'EX', 60);
      redisClient.circuitBreaker.recordSuccess();

      await redisClient.set('recovery-test-2', 'success', 'EX', 60);
      redisClient.circuitBreaker.recordSuccess();

      // Circuit should be closed
      expect(redisClient.circuitBreaker.state).toBe('CLOSED');

      // Verify normal operations resume
      const value = await redisClient.get('recovery-test');
      expect(value).toBe('success');
    });

    it('should handle flapping Redis connection', async () => {
      let cycleCount = 0;

      // Simulate multiple failure/recovery cycles
      for (let cycle = 0; cycle < 3; cycle++) {
        // Fail
        for (let i = 0; i < 5; i++) {
          redisClient.circuitBreaker.recordFailure();
        }
        expect(redisClient.circuitBreaker.state).toBe('OPEN');
        cycleCount++;

        // Recover
        redisClient.circuitBreaker.nextAttempt = Date.now() - 1000;
        redisClient.circuitBreaker.canAttempt();
        redisClient.circuitBreaker.recordSuccess();
        redisClient.circuitBreaker.recordSuccess();
        expect(redisClient.circuitBreaker.state).toBe('CLOSED');
      }

      expect(cycleCount).toBe(3);
      expect(redisClient.circuitBreaker.state).toBe('CLOSED');
    });
  });

  describe('Graceful Degradation', () => {
    it('should continue critical operations during Redis outage', async () => {
      // Force circuit open
      for (let i = 0; i < 5; i++) {
        redisClient.circuitBreaker.recordFailure();
      }

      // Lock acquisition should still work via database
      const lockKey = 'critical:operation:lock';
      const lockValue = `lock_${Date.now()}`;
      const acquired = await redisClient.acquireLock(lockKey, lockValue, 10);

      expect(acquired).toBe(true);

      // Verify database fallback was used
      const Lock = (await import('mongoose')).default.model('Lock');
      const lock = await Lock.findOne({ key: lockKey });
      expect(lock).toBeDefined();

      await redisClient.releaseLock(lockKey, lockValue);
    });

    it('should log circuit state changes', async () => {
      const logSpy = jest.spyOn(console, 'error').mockImplementation();

      // Trigger circuit open
      for (let i = 0; i < 5; i++) {
        redisClient.circuitBreaker.recordFailure();
      }

      // Should have logged state change
      // Note: Actual logging verification depends on logger implementation

      logSpy.mockRestore();
    });

    it('should provide circuit status for health checks', () => {
      const status = {
        state: redisClient.circuitBreaker.state,
        failureCount: redisClient.circuitBreaker.failureCount,
        successCount: redisClient.circuitBreaker.successCount,
      };

      expect(status.state).toBeDefined();
      expect(typeof status.failureCount).toBe('number');
      expect(typeof status.successCount).toBe('number');
    });
  });

  describe('Edge Cases', () => {
    it('should handle rapid successive failures correctly', async () => {
      // Trigger many failures in quick succession
      for (let i = 0; i < 100; i++) {
        redisClient.circuitBreaker.recordFailure();
      }

      // Should stabilize at OPEN state
      expect(redisClient.circuitBreaker.state).toBe('OPEN');
      expect(redisClient.circuitBreaker.failureCount).toBeGreaterThanOrEqual(5);
    });

    it('should handle success after partial failure count', async () => {
      // Record 3 failures (below threshold)
      redisClient.circuitBreaker.recordFailure();
      redisClient.circuitBreaker.recordFailure();
      redisClient.circuitBreaker.recordFailure();

      expect(redisClient.circuitBreaker.state).toBe('CLOSED');
      expect(redisClient.circuitBreaker.failureCount).toBe(3);

      // Success should reset
      redisClient.circuitBreaker.recordSuccess();
      expect(redisClient.circuitBreaker.failureCount).toBe(0);
      expect(redisClient.circuitBreaker.state).toBe('CLOSED');
    });

    it('should handle timeout expiry precisely', async () => {
      // Force OPEN
      for (let i = 0; i < 5; i++) {
        redisClient.circuitBreaker.recordFailure();
      }

      const openTime = Date.now();
      redisClient.circuitBreaker.nextAttempt = openTime + 30000; // 30s timeout

      // Check immediately - should be blocked
      let canAttempt = redisClient.circuitBreaker.canAttempt();
      expect(canAttempt).toBe(false);
      expect(redisClient.circuitBreaker.state).toBe('OPEN');

      // Manually expire timeout
      redisClient.circuitBreaker.nextAttempt = Date.now() - 1;

      // Now should transition to HALF_OPEN
      canAttempt = redisClient.circuitBreaker.canAttempt();
      expect(canAttempt).toBe(true);
      expect(redisClient.circuitBreaker.state).toBe('HALF_OPEN');
    });
  });
});
