import helmet from 'helmet';
import mongoSanitize from 'express-mongo-sanitize';
import xss from 'xss-clean';
import { apiLimiter } from './rateLimiter.js';
import { logger } from './logger.js';

export const securityMiddleware = (app) => {
  // 🔥 Helmet: Secure HTTP headers with production-ready configuration
  app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    crossOriginEmbedderPolicy: false,
    contentSecurityPolicy: false, // Disable CSP for API-only backend
    hsts: {
      maxAge: 31536000, // 1 year
      includeSubDomains: true,
      preload: true
    },
    frameguard: { action: 'deny' }, // Prevent clickjacking
    noSniff: true, // Prevent MIME sniffing
    xssFilter: true, // Enable XSS filter
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    hidePoweredBy: true, // Hide X-Powered-By header
  }));

  // 🔥 Prevent NoSQL injection with enhanced logging
  app.use(mongoSanitize({
    replaceWith: '_',
    onSanitize: ({ req, key }) => {
      logger.warn('⚠️ Potential NoSQL injection attempt blocked', {
        ip: req.ip,
        path: req.originalUrl,
        key,
      });
    },
  }));

  // 🔥 Prevent XSS attacks
  app.use(xss());

  // 🔥 Rate limiting (applied globally)
  app.use('/api', apiLimiter);
};