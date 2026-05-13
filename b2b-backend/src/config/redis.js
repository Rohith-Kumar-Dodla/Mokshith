import Redis from 'ioredis';
import { env } from './env.js';
import { logger } from './logger.js';

const redis = new Redis({
  host: env.REDIS_HOST,
  port: env.REDIS_PORT,
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
  lazyConnect: true,
  showFriendlyErrorStack: env.NODE_ENV === 'development',
  retryStrategy(times) {
    if (times > 3) {
      logger.error('Redis connection failed after 3 retries');
      return null;
    }
    const delay = Math.min(times * 1000, 3000);
    return delay;
  },
  reconnectOnError(err) {
    const targetError = 'READONLY';
    if (err.message.includes(targetError)) {
      return true;
    }
    return false;
  },
});

redis.on('connect', () => logger.info('✅ Redis connected'));
redis.on('ready', () => logger.info('✅ Redis ready'));
redis.on('error', (err) => {
  if (err.code === 'ECONNREFUSED') {
    logger.warn('⚠️ Redis connection refused - running without cache');
    return;
  }
  logger.error('❌ Redis error:', err.message);
});
redis.on('close', () => logger.warn('⚠️ Redis connection closed'));
redis.on('reconnecting', () => logger.info('🔄 Redis reconnecting...'));

// Graceful error handling wrapper
export const redisClient = {
  async get(key) {
    try {
      return await redis.get(key);
    } catch (error) {
      logger.error(`Redis GET error for key ${key}:`, error.message);
      return null;
    }
  },
  async set(...args) {
    try {
      return await redis.set(...args);
    } catch (error) {
      logger.error('Redis SET error:', error.message);
      return null;
    }
  },
  async setex(key, ttl, value) {
    try {
      return await redis.setex(key, ttl, value);
    } catch (error) {
      logger.error(`Redis SETEX error for key ${key}:`, error.message);
      return null;
    }
  },
  async del(key) {
    try {
      return await redis.del(key);
    } catch (error) {
      logger.error(`Redis DEL error for key ${key}:`, error.message);
      return null;
    }
  },
  async incr(key) {
    try {
      return await redis.incr(key);
    } catch (error) {
      logger.error(`Redis INCR error for key ${key}:`, error.message);
      return 0;
    }
  },
  async decr(key) {
    try {
      return await redis.decr(key);
    } catch (error) {
      logger.error(`Redis DECR error for key ${key}:`, error.message);
      return 0;
    }
  },
  async expire(key, seconds) {
    try {
      return await redis.expire(key, seconds);
    } catch (error) {
      logger.error(`Redis EXPIRE error for key ${key}:`, error.message);
      return 0;
    }
  },
};

export default redis;