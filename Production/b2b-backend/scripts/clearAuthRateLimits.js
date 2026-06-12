/**
 * Clears Redis auth rate-limit and fraud-tracking keys.
 * Use during UAT when locked out after repeated login/register attempts.
 *
 * Usage: node scripts/clearAuthRateLimits.js
 */
import dotenv from 'dotenv';
import Redis from 'ioredis';

dotenv.config();

const patterns = [
  'auth:*',
  'fraud:login:*',
  'fraud:register:ip:*',
  'fraud:blocked:*',
];

const redis = new Redis({
  host: process.env.REDIS_HOST || '127.0.0.1',
  port: Number(process.env.REDIS_PORT || 6379),
  password: process.env.REDIS_PASSWORD || undefined,
  db: Number(process.env.REDIS_DB || 0),
});

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

  console.log(`Done. Removed ${total} auth rate-limit key(s).`);
  console.log(`AUTH_STRICT_MODE=${process.env.AUTH_STRICT_MODE ?? '(unset, defaults to strict)'}`);
} catch (error) {
  console.error('Failed to clear auth rate limits:', error.message);
  process.exitCode = 1;
} finally {
  await redis.quit();
}
