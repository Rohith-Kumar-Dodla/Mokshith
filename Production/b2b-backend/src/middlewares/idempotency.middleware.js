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
  if (!key) {
    logger.debug('Global idempotency middleware: no idempotency key present on request', { method: req.method, path: req.path });
    return next();
  }

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
          req.body.items?.map((i) => `${i.productId}:${i.quantity}`).join('_') || 'cart';
        const paymentMethod = String(req.body.paymentMethod || 'COD').toUpperCase();
        autoKey = `order:create:${req.user?.id}:${paymentMethod}:${cartSignature}`;
        break;
      }
        
      case 'inventory:add':
        // Use productId + quantity + warehouseId for stock addition
        const addData = req.body;
        autoKey = `inventory:add:${addData.productId}:${addData.warehouseId}:${addData.stock}`;
        break;
        
      case 'inventory:update': {
        // Include warehouse + target stock so repeated SET operations are not replayed incorrectly.
        const updateData = req.body;
        const warehouseKey = updateData.warehouseId ?? 'default';
        autoKey = `inventory:update:${updateData.productId}:${warehouseKey}:${updateData.stock}:${updateData.type || updateData.operation || 'SET'}`;
        break;
      }
        
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

    // --- TEMP LOGGING: record the keys used for idempotency to aid debugging ---
    logger.debug('operationIdempotency - computed keys', { operationType, manualKey, autoKey, finalKey: key, path: req.path, method: req.method });

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
      // Use a unique lock value so release can verify ownership
      const lockValue = `${req.user?.id || 'anon'}-${Date.now()}-${Math.random().toString(36).slice(2,8)}`;
      let lockAcquired = false;
      try {
        // Prefer redisClient.acquireLock (with DB fallback) for robustness
        logger.debug('operationIdempotency - attempting lock acquisition', { lockKey });
        lockAcquired = await redisClient.acquireLock(lockKey, lockValue, 15); // 15s TTL
        logger.debug('operationIdempotency - lock acquisition result', { lockKey, lockValue, lockAcquired });
      } catch (err) {
        logger.error('operationIdempotency - lock acquisition threw', { lockKey, error: err?.message || String(err) });
        lockAcquired = false;
      }

      if (!lockAcquired) {
        logger.warn(`Concurrent ${operationType} detected, lock busy`, { key, lockKey });

        const findExistingOrder = async () => {
          if (operationType !== 'order:create') return null;
          try {
            const mongoose = await import('mongoose');
            const OrderModel = mongoose.default.models.Order || mongoose.default.model('Order');
            const userId = req.user?.id;
            if (!userId) return null;
            return OrderModel.findOne({ idempotencyKey: key, userId }).lean();
          } catch (checkErr) {
            logger.error('operationIdempotency - fallback completion check failed', {
              error: checkErr?.message || String(checkErr),
            });
            return null;
          }
        };

        // Align wait with lock TTL so a concurrent request can observe the completed order
        // instead of failing after 1s while createOrder is still running.
        const waitTimeout = operationType === 'order:create' ? 15000 : 1000;
        const pollInterval = 250;
        const start = Date.now();

        while (Date.now() - start < waitTimeout) {
          const cachedNow = await redisClient.get(redisKey);
          if (cachedNow) {
            logger.info('operationIdempotency - cached response found during wait', { key });
            return res.json(JSON.parse(cachedNow));
          }

          const existingOrder = await findExistingOrder();
          if (existingOrder) {
            logger.info('operationIdempotency - found existing order for idempotency key', {
              key,
              orderId: existingOrder._id,
            });
            return res.status(200).json({
              success: true,
              message: 'Order already created',
              data: existingOrder,
            });
          }

          await new Promise((r) => setTimeout(r, pollInterval));
        }

        // Still locked — reject as duplicate in progress
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
      const releaseLockSafely = async () => {
        if (responseSent) return; // Already released
        responseSent = true;
        try {
          const released = await redisClient.releaseLock(lockKey, lockValue);
          if (!released) {
            logger.warn('operationIdempotency - lock release returned false', { lockKey, lockValue, operationType, key });
          } else {
            logger.debug('operationIdempotency - lock released after response completion', { lockKey, lockValue, operationType, key });
          }
        } catch (err) {
          logger.error('Failed to release idempotency lock safely:', { lockKey, lockValue, error: err?.message || String(err) });
        }
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