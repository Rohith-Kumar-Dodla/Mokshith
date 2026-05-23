import { logger } from '../config/logger.js';

/**
 * Monitoring middleware - tracks request metrics
 */
export const monitoringMiddleware = (req, res, next) => {
  const startTime = Date.now();
  const startMemory = process.memoryUsage().heapUsed;

  // Original end function
  const originalEnd = res.end;

  // Override end function to capture metrics
  res.end = function (...args) {
    const duration = Date.now() - startTime;
    const memoryUsed = process.memoryUsage().heapUsed - startMemory;

    // Log performance metrics
    const perfLogger = req.logger || logger;
    
    perfLogger.info('Request metrics', {
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      memoryDelta: `${(memoryUsed / 1024 / 1024).toFixed(2)} MB`,
      contentLength: res.get('content-length') || 0,
      userAgent: req.get('user-agent'),
      ip: req.ip
    });

    // Alert on slow requests (> 3 seconds)
    if (duration > 3000) {
      perfLogger.warn('Slow request detected', {
        method: req.method,
        path: req.path,
        duration: `${duration}ms`,
        query: req.query,
        params: req.params
      });
    }

    // Alert on errors
    if (res.statusCode >= 500) {
      perfLogger.error('Server error response', {
        method: req.method,
        path: req.path,
        statusCode: res.statusCode,
        duration: `${duration}ms`
      });
    }

    // Call original end
    originalEnd.apply(res, args);
  };

  next();
};

/**
 * Track error rates (for alerting)
 */
export const errorRateTracker = () => {
  const errorCounts = new Map();
  const TIME_WINDOW = 60000; // 1 minute

  return (req, res, next) => {
    const originalEnd = res.end;

    res.end = function (...args) {
      if (res.statusCode >= 400) {
        const key = `${req.method}:${req.path}`;
        const now = Date.now();
        
        if (!errorCounts.has(key)) {
          errorCounts.set(key, []);
        }

        const errors = errorCounts.get(key);
        errors.push(now);

        // Remove old errors outside time window
        const recentErrors = errors.filter(time => now - time < TIME_WINDOW);
        errorCounts.set(key, recentErrors);

        // Alert if error rate is high (> 10 errors per minute)
        if (recentErrors.length > 10) {
          logger.error('High error rate detected', {
            endpoint: key,
            errorCount: recentErrors.length,
            timeWindow: '1 minute',
            statusCode: res.statusCode
          });
        }
      }

      originalEnd.apply(res, args);
    };

    next();
  };
};
