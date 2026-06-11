import validator from 'validator';
import { logger } from '../config/logger.js';

/**
 * Recursively sanitizes object/array values to prevent XSS.
 * Mutates the target in-place to maintain Express 5 compatibility.
 * 
 * @param {any} target - The object or array to sanitize
 * @param {Object} req - Express request object for logging
 * @returns {any} Sanitized target
 */
const sanitizeXSS = (target, req) => {
  if (!target || typeof target !== 'object') {
    if (typeof target === 'string') {
      // Basic escape for strings
      return validator.escape(target);
    }
    return target;
  }

  if (Array.isArray(target)) {
    for (let i = 0; i < target.length; i++) {
      if (typeof target[i] === 'string') {
        target[i] = validator.escape(target[i]);
      } else if (typeof target[i] === 'object') {
        sanitizeXSS(target[i], req);
      }
    }
    return target;
  }

  const keys = Object.keys(target);
  for (const key of keys) {
    const value = target[key];

    if (typeof value === 'string') {
      const sanitized = validator.escape(value);
      if (sanitized !== value) {
        logger.debug('🛡️ XSS attempt sanitized', {
          ip: req.ip,
          path: req.originalUrl,
          key,
        });
        target[key] = sanitized;
      }
    } else if (value && typeof value === 'object') {
      sanitizeXSS(value, req);
    }
  }

  return target;
};

/**
 * Express 5 compatible XSS sanitization middleware.
 * Uses validator.js to escape HTML special characters.
 * 
 * @param {import('express').Request} req 
 * @param {import('express').Response} res 
 * @param {import('express').NextFunction} next 
 */
export const xssSanitizeMiddleware = (req, res, next) => {
  if (typeof next !== 'function') {
    logger.error('xssSanitizeMiddleware: next is not a function. Check registration order in security.js/app.js');
    return;
  }

  const sanitize = (propName) => {
    if (!req[propName]) return;
    
    try {
      // We only want to sanitize the VALUES, not the keys (mongoSanitize handles keys)
      sanitizeXSS(req[propName], req);
    } catch (err) {
      logger.error(`Error XSS sanitizing req.${propName}:`, err);
    }
  };

  sanitize('body');
  sanitize('query');
  sanitize('params');

  next();
};
