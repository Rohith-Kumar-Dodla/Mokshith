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
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https:"],
        imgSrc: ["'self'", "data:", "https:", "blob:", "*.razorpay.com"],
        connectSrc: ["'self'", "https:", "wss:", "*.razorpay.com"],
        fontSrc: ["'self'", "https:", "data:"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'", "https:"],
        frameSrc: ["'self'", "https://checkout.razorpay.com", "https://api.razorpay.com"],
        upgradeInsecureRequests: process.env.NODE_ENV === 'production' ? [] : null
      }
    },
    hsts: {
      maxAge: 31536000, // 1 year
      includeSubDomains: true,
      preload: true
    },
    frameguard: { action: 'sameorigin' }, // Allow SAMEORIGIN for Razorpay integration if needed, or deny if strict
    noSniff: true, // Prevent MIME sniffing
    xssFilter: true, // Enable XSS filter
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    hidePoweredBy: true, // Hide X-Powered-By header
    permittedCrossDomainPolicies: { permittedPolicies: "none" },
    dnsPrefetchControl: { allow: false }
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