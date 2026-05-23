import { redisClient } from '../config/redis.js';
import { logger } from '../config/logger.js';

/**
 * Cache invalidation utilities
 */

/**
 * Invalidate cache by pattern
 */
export const invalidateCache = async (pattern) => {
  try {
    const keys = await redisClient.keys(pattern);
    if (keys.length > 0) {
      await redisClient.del(...keys);
      logger.info(`Cache invalidated: ${keys.length} keys deleted`, { pattern });
    }
  } catch (error) {
    logger.error('Cache invalidation error:', error);
  }
};

/**
 * Invalidate product cache
 */
export const invalidateProductCache = async (productId) => {
  const patterns = [
    `cache:products:*`, // All product lists
    `cache:product:${productId}`, // Specific product
    `cache:categories:*`, // Category listings (products are nested)
    `cache:search:*` // Search results
  ];

  for (const pattern of patterns) {
    await invalidateCache(pattern);
  }
};

/**
 * Invalidate category cache
 */
export const invalidateCategoryCache = async (categoryId) => {
  const patterns = [
    `cache:categories:*`,
    `cache:category:${categoryId}`,
    `cache:products:*` // Products are often filtered by category
  ];

  for (const pattern of patterns) {
    await invalidateCache(pattern);
  }
};

/**
 * Invalidate order cache
 */
export const invalidateOrderCache = async (userId) => {
  const patterns = [
    `cache:orders:user:${userId}`,
    `cache:orders:*`, // Admin order listings
    `cache:analytics:*` // Order analytics
  ];

  for (const pattern of patterns) {
    await invalidateCache(pattern);
  }
};

/**
 * Invalidate user cache
 */
export const invalidateUserCache = async (userId) => {
  const patterns = [
    `cache:user:${userId}`,
    `cache:users:*`
  ];

  for (const pattern of patterns) {
    await invalidateCache(pattern);
  }
};

/**
 * Clear all cache (use sparingly)
 */
export const clearAllCache = async () => {
  try {
    await redisClient.flushdb();
    logger.warn('⚠️ All cache cleared');
  } catch (error) {
    logger.error('Clear all cache error:', error);
  }
};

/**
 * Middleware to auto-invalidate cache on mutations
 */
export const autoInvalidateCache = (type) => {
  return async (req, res, next) => {
    const originalSend = res.send;

    res.send = async function (data) {
      // Only invalidate on successful mutations (POST, PUT, PATCH, DELETE)
      if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method) && res.statusCode < 400) {
        try {
          switch (type) {
            case 'product':
              await invalidateProductCache(req.params.id || req.body.productId);
              break;
            case 'category':
              await invalidateCategoryCache(req.params.id || req.body.categoryId);
              break;
            case 'order':
              await invalidateOrderCache(req.user?.id || req.body.userId);
              break;
            case 'user':
              await invalidateUserCache(req.params.id || req.user?.id);
              break;
          }
        } catch (error) {
          logger.error('Auto-invalidation error:', error);
        }
      }

      originalSend.call(this, data);
    };

    next();
  };
};
