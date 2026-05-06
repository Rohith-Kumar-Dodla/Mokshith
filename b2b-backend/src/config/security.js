import helmet from 'helmet';
import { corsConfig } from './cors.js';
import { apiLimiter } from './rateLimiter.js';

export const securityMiddleware = (app) => {
  // 🔥 Fix: Configure Helmet to allow cross-origin images
  app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    crossOriginEmbedderPolicy: false,
    contentSecurityPolicy: false, // Disable CSP temporarily to rule it out
  }));
  // app.use(corsConfig); // Redundant if already handled in app.js
  app.use('/api', apiLimiter);
};