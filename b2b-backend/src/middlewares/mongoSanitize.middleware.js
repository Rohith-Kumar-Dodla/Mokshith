import { logger } from '../config/logger.js';

/**
 * Recursively removes keys starting with $ or containing . from objects.
 * Mutations are performed in-place to support Express 5 req properties.
 * 
 * @param {any} target - The object or array to sanitize
 * @param {Object} req - Express request object for logging
 * @returns {any} Sanitized target
 */
const sanitizeObject = (target, req) => {
  if (!target || typeof target !== 'object') {
    return target;
  }

  if (Array.isArray(target)) {
    for (let i = 0; i < target.length; i++) {
      target[i] = sanitizeObject(target[i], req);
    }
    return target;
  }

  // Use a copy of keys to avoid issues when deleting during iteration
  const keys = Object.keys(target);
  
  for (const key of keys) {
    const value = target[key];

    // Check if key should be removed
    if (key.startsWith('$') || key.includes('.')) {
      if (req) {
        logger.warn('⚠️ Potential NoSQL injection attempt blocked', {
          ip: req.ip,
          path: req.originalUrl,
          key,
        });
      }
      delete target[key];
    } else {
      // Recurse into nested objects
      if (value && typeof value === 'object') {
        sanitizeObject(value, req);
      }
    }
  }

  return target;
};

/**
 * Custom MongoDB Sanitizer middleware for Express 5 compatibility.
 * Prevents NoSQL injection by stripping $ and . from req properties.
 * 
 * @param {import('express').Request} req 
 * @param {import('express').Response} res 
 * @param {import('express').NextFunction} next 
 */
export const mongoSanitizeMiddleware = (req, res, next) => {
  if (typeof next !== 'function') {
    logger.error('mongoSanitizeMiddleware: next is not a function. Check registration order in security.js/app.js');
    return;
  }

  // Use Object.getOwnPropertyDescriptor to check if property is configurable/writable
  const sanitize = (propName) => {
    if (!req[propName]) return;
    
    try {
      sanitizeObject(req[propName], req);
    } catch (err) {
      logger.error(`Error sanitizing req.${propName}:`, err);
    }
  };

  sanitize('body');
  sanitize('query');
  sanitize('params');

  next();
};
