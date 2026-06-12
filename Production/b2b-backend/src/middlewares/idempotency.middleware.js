import { redisClient } from '../config/redis.js';
import { logger } from '../config/logger.js';

const IDEMPOTENCY_TTL = 86400; // 24 hours in seconds

/**
 * Core idempotency middleware
 * Prevents duplicate processing of state-changing operations
 */
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
      logger.info(`Idempotency hit for key: ${key}`, { method: req.method, path: req.path });
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

/**
 * Operation-specific idempotency middleware
 * Automatically generates key based on operation type and request data
 */
export const operationIdempotency = (operationType) => {
  return async (req, res, next) => {
    // Generate operation-specific key from request data
    let autoKey;
    
    switch (operationType) {
      case 'order:create': {
        // Include payment method so COD vs bank transfer vs online are not conflated
        const cartSignature =
          req.body.items?.map((i) => `${i.productId}:${i.quantity}`).join('|') || 'cart';
        const paymentMethod = String(req.body.paymentMethod || 'COD').toUpperCase();
        autoKey = `order:create:${req.user?.id}:${paymentMethod}:${cartSignature}`;
        break;
      }
        
      case 'inventory:add':
        // Use productId + quantity + warehouseId for stock addition
        const addData = req.body;
        autoKey = `inventory:add:${addData.productId}:${addData.warehouseId}:${addData.stock}`;
        break;
        
      case 'inventory:update':
        // Use productId + adjustment type for stock update
        const updateData = req.body;
        autoKey = `inventory:update:${updateData.productId}:${updateData.operation}:${Date.now()}`;
        break;
        
      case 'payment:refund':
        // Use orderId + refund amount
        autoKey = `refund:${req.params.orderId || req.body.orderId}:${req.body.amount || 'full'}`;
        break;
        
      default:
        // Fallback to generic key
        autoKey = `${operationType}:${req.user?.id}:${Date.now()}`;
    }

    // Allow manual override via header or request body
    const manualKey = req.headers['idempotency-key'] || req.body?.idempotencyKey;
    const key = manualKey || autoKey;

    // Validate key format
    if (!/^[a-zA-Z0-9_:-]{1,255}$/.test(key)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid idempotency key format',
      });
    }

    const redisKey = `idempotency:${key}`;

    try {
      // Check for in-progress operation (concurrent request detection)
      const lockKey = `${redisKey}:lock`;
      const locked = await redisClient.set(lockKey, '1', 'EX', 10, 'NX');
      
      if (!locked) {
        logger.warn(`Concurrent ${operationType} detected, rejecting duplicate`, { key });
        return res.status(409).json({
          success: false,
          message: 'Duplicate operation in progress, please retry after a moment',
        });
      }

      // Check if operation was already completed
      const cached = await redisClient.get(redisKey);
      
      if (cached) {
        // Release lock
        await redisClient.del(lockKey);
        
        logger.info(`${operationType} idempotency hit`, { key });
        return res.json(JSON.parse(cached));
      }

      // Store original send function
      const originalSend = res.json.bind(res);
      let responseSent = false;
      let responseBody = null;

      // 🔒 CRITICAL FIX: Release lock ONLY after response fully completes
      // This prevents race conditions where duplicate requests slip through
      const releaseLockSafely = () => {
        if (responseSent) return; // Already released
        responseSent = true;
        
        redisClient.del(lockKey).catch(err => 
          logger.error('Failed to release idempotency lock:', err)
        );
        
        logger.debug('Idempotency lock released after response completion', { operationType, key });
      };
      
      // Listen to response lifecycle events
      res.on('finish', releaseLockSafely); // Response fully sent
      res.on('close', releaseLockSafely);  // Connection closed (aborted or complete)
      
      // Handle request abortion
      req.on('aborted', () => {
        logger.warn('Request aborted during idempotent operation', { operationType, key });
        releaseLockSafely();
      });

      // Override send to cache successful responses (but don't release lock yet)
      res.json = function(body) {
        responseBody = body;
        
        // Only cache successful responses
        if (res.statusCode >= 200 && res.statusCode < 300) {
          redisClient.setex(redisKey, IDEMPOTENCY_TTL, JSON.stringify(body))
            .catch(err => logger.error('Failed to cache idempotency response:', err));
        }
        
        return originalSend(body);
      };

      // Handle error responses - still wait for response completion
      const originalStatus = res.status.bind(res);
      res.status = function(code) {
        if (code >= 400) {
          logger.debug('Error response during idempotent operation', { operationType, code, key });
        }
        return originalStatus(code);
      };

      next();
    } catch (error) {
      // If Redis fails, log but continue (graceful degradation)
      logger.error(`${operationType} idempotency middleware error:`, error);
      next();
    }
  };
};