import { redisClient } from '../config/redis.js';
import { logger } from '../config/logger.js';

/**
 * Cache middleware for GET requests
 * Caches response data in Redis for specified duration
 * @param {number} duration - Cache duration in seconds (default: 60)
 */
export const cacheMiddleware = (duration = 60) => {
  return async (req, res, next) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }

    // Generate cache key from URL and query params
    const cacheKey = `cache:${req.originalUrl}`;

    try {
      // Try to get cached response
      const cachedResponse = await redisClient.get(cacheKey);

      if (cachedResponse) {
        logger.debug(`Cache HIT: ${cacheKey}`);
        const data = JSON.parse(cachedResponse);
        return res.status(200).json(data);
      }

      logger.debug(`Cache MISS: ${cacheKey}`);

      // Store original res.json function
      const originalJson = res.json.bind(res);

      // Override res.json to cache the response
      res.json = (data) => {
        // Only cache successful responses
        if (res.statusCode === 200 && data.success !== false) {
          redisClient.setex(cacheKey, duration, JSON.stringify(data))
            .catch(err => logger.error('Cache set error:', err));
        }
        return originalJson(data);
      };

      next();
    } catch (error) {
      logger.error('Cache middleware error:', error);
      // Continue without cache on error
      next();
    }
  };
};

/**
 * Clear cache by pattern
 * @param {string} pattern - Redis key pattern to delete
 */
export const clearCache = async (pattern) => {
  try {
    // Note: In production with Redis cluster, use SCAN instead of KEYS
    const keys = await redisClient.keys(pattern);
    if (keys.length > 0) {
      await redisClient.del(...keys);
      logger.info(`Cleared ${keys.length} cache keys matching: ${pattern}`);
    }
  } catch (error) {
    logger.error('Clear cache error:', error);
  }
};

/**
 * Middleware to clear cache after mutations (POST, PUT, PATCH, DELETE)
 * Usage: Add after mutation endpoints to invalidate related caches
 */
export const clearCacheMiddleware = (patterns) => {
  return async (req, res, next) => {
    // Store original res.json
    const originalJson = res.json.bind(res);

    res.json = async (data) => {
      // Clear cache only for successful mutations
      if (res.statusCode >= 200 && res.statusCode < 300) {
        for (const pattern of patterns) {
          await clearCache(pattern);
        }
      }
      return originalJson(data);
    };

    next();
  };
};
