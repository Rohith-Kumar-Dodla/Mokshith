import crypto from 'crypto';
import { createLogger } from '../config/logger.js';

/**
 * Correlation ID middleware
 * Adds unique request ID for tracing and logging
 */
export const correlationMiddleware = (req, res, next) => {
  // Try to get correlation ID from header or generate new one
  const correlationId = 
    req.headers['x-correlation-id'] || 
    req.headers['x-request-id'] || 
    crypto.randomUUID();

  // Attach to request
  req.correlationId = correlationId;
  req.logger = createLogger(correlationId);

  // Add to response headers
  res.setHeader('X-Correlation-ID', correlationId);

  // Log request
  req.logger.info('Incoming request', {
    method: req.method,
    path: req.path,
    ip: req.ip,
    userAgent: req.get('user-agent')
  });

  // Track response time
  const startTime = Date.now();

  // Hook into response finish
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const logLevel = res.statusCode >= 400 ? 'error' : 'info';

    req.logger.log(logLevel, 'Request completed', {
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      contentLength: res.get('content-length')
    });
  });

  next();
};
