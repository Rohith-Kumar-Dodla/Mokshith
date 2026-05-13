import { logger } from '../config/logger.js';

/**
 * Request timeout middleware
 * Automatically times out requests that exceed the specified duration
 * Prevents hanging requests and improves server responsiveness
 */
export const timeoutMiddleware = (timeout = 30000) => {
  return (req, res, next) => {
    // Set timeout for the request
    req.setTimeout(timeout, () => {
      logger.warn('Request timeout', {
        method: req.method,
        path: req.originalUrl,
        ip: req.ip,
        timeout,
      });

      // Only send response if headers haven't been sent
      if (!res.headersSent) {
        res.status(408).json({
          success: false,
          message: 'Request timeout - the server took too long to respond',
          error: {
            statusCode: 408,
            code: 'REQUEST_TIMEOUT',
            timestamp: new Date().toISOString(),
            path: req.originalUrl,
          },
          data: null,
        });
      }
    });

    next();
  };
};