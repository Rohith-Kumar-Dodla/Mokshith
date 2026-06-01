import helmet from 'helmet';
import { apiLimiter } from './rateLimiter.js';
import { mongoSanitizeMiddleware } from '../middlewares/mongoSanitize.middleware.js';
import { xssSanitizeMiddleware } from '../middlewares/xssSanitize.middleware.js';

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

  // 🔥 Prevent NoSQL injection (Custom middleware for Express 5 compatibility)
  app.use((req, res, next) => mongoSanitizeMiddleware(req, res, next));

  // 🔥 Prevent XSS attacks (Custom middleware for Express 5 compatibility)
  app.use((req, res, next) => xssSanitizeMiddleware(req, res, next));

  // 🔥 Rate limiting (applied globally)
  app.use('/api', apiLimiter);
};