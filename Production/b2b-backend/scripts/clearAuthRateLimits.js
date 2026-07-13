/**
 * Clears Redis auth rate-limit and fraud-tracking keys.
 * Use during UAT when locked out after repeated login/register attempts.
 *
 * Usage: node scripts/clearAuthRateLimits.js
 */
import dotenv from 'dotenv';
import redis from '../src/config/redis.js';

dotenv.config();

const patterns = [
  'auth:*',
  'fraud:login:*',
  'fraud:login:ip:*',
  'fraud:register:ip:*',
  'fraud:blocked:*',
  // Playwright suites create multiple orders per worker; clear stale counters between runs.
  'order:*',
  'payment:*',
];

// Use centralized redis client
await redis.connect();

const clearPattern = async (pattern) => {
  let cursor = '0';
  let deleted = 0;

  do {
    const [nextCursor, keys] = await redis.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
    cursor = nextCursor;

    if (keys.length > 0) {
      deleted += await redis.del(...keys);
    }
  } while (cursor !== '0');

  return deleted;
};

try {
  let total = 0;

  for (const pattern of patterns) {
    const count = await clearPattern(pattern);
    total += count;
    console.log(`Cleared ${count} key(s) matching ${pattern}`);
  }

  console.log(`Done. Removed ${total} test rate-limit key(s).`);
  console.log(`AUTH_STRICT_MODE=${process.env.AUTH_STRICT_MODE ?? '(unset, defaults to strict)'}`);
} catch (error) {
  console.error('Failed to clear auth rate limits:', error.message);
  process.exitCode = 1;
} finally {
  await redis.quit();
}
