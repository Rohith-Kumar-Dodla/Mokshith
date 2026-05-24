import rateLimit from 'express-rate-limit';
import { redisClient } from './redis.js';
import { logger } from './logger.js';

// Redis-backed rate limiter store for distributed systems
class RedisStore {
  constructor(options = {}) {
    this.prefix = options.prefix || 'rl:';
    this.windowMs = options.windowMs || 60000;
  }

  async increment(key) {
    const redisKey = `${this.prefix}${key}`;
    try {
      const current = await redisClient.incr(redisKey);
      if (current === 1) {
        await redisClient.expire(redisKey, Math.ceil(this.windowMs / 1000));
      }
      return { totalHits: current, resetTime: new Date(Date.now() + this.windowMs) };
    } catch (error) {
      logger.error('Redis rate limiter error:', error);
      // Fallback to allow request if Redis fails
      return { totalHits: 1, resetTime: new Date(Date.now() + this.windowMs) };
    }
  }

  async decrement(key) {
    try {
      await redisClient.decr(`${this.prefix}${key}`);
    } catch (error) {
      logger.error('Redis decrement error:', error);
    }
  }

  async resetKey(key) {
    try {
      await redisClient.del(`${this.prefix}${key}`);
    } catch (error) {
      logger.error('Redis resetKey error:', error);
    }
  }
}

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000, // Reduced from 5000 for better protection
  standardHeaders: true,
  legacyHeaders: false,
  store: new RedisStore({ prefix: 'api:', windowMs: 15 * 60 * 1000 }),
  message: {
    success: false,
    message: 'Too many requests, try again later',
  },
  skip: (req) => {
    // Skip rate limiting for health checks
    return req.path === '/health';
  },
});

export const paymentLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Reduced from 10 for stricter payment protection
  standardHeaders: true,
  legacyHeaders: false,
  store: new RedisStore({ prefix: 'payment:', windowMs: 15 * 60 * 1000 }),
  message: {
    success: false,
    message: 'Too many payment attempts, please try again after 15 minutes',
  },
  skipSuccessfulRequests: true, // Don't count successful requests
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes  
  max: 5, // Max 5 failed login attempts
  standardHeaders: true,
  legacyHeaders: false,
  store: new RedisStore({ prefix: 'auth:', windowMs: 15 * 60 * 1000 }),
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again after 15 minutes',
  },
  skipSuccessfulRequests: true,
});