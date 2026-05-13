import { redisClient } from '../config/redis.js';
import { logger } from '../config/logger.js';

const IDEMPOTENCY_TTL = 86400; // 24 hours in seconds

export const idempotencyMiddleware = async (req, res, next) => {
  const key = req.headers['idempotency-key'];

  // Skip if no idempotency key provided
  if (!key) return next();

  // Validate key format (prevent injection)
  if (!/^[a-zA-Z0-9_-]{1,255}$/.test(key)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid idempotency key format',
    });
  }

  const redisKey = `idempotency:${key}`;

  try {
    // Check if this key was already processed
    const cached = await redisClient.get(redisKey);
    
    if (cached) {
      logger.info(`Idempotency hit for key: ${key}`);
      return res.json(JSON.parse(cached));
    }

    // Store original send function
    const originalSend = res.json.bind(res);

    // Override send to cache successful responses
    res.json = function(body) {
      // Only cache successful responses (2xx status codes)
      if (res.statusCode >= 200 && res.statusCode < 300) {
        redisClient.setex(redisKey, IDEMPOTENCY_TTL, JSON.stringify(body))
          .catch(err => logger.error('Failed to cache idempotency response:', err));
      }
      return originalSend(body);
    };

    next();
  } catch (error) {
    // If Redis fails, log but continue (graceful degradation)
    logger.error('Idempotency middleware error:', error);
    next();
  }
};