import * as Sentry from '@sentry/node';
import { nodeProfilingIntegration } from '@sentry/profiling-node';
import { logger } from './logger.js';

export const initializeSentry = (app) => {
  // Only initialize Sentry if DSN is provided
  if (!process.env.SENTRY_DSN) {
    logger.warn('Sentry DSN not configured - error tracking disabled');
    return;
  }

  try {
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      environment: process.env.NODE_ENV || 'development',
      release: process.env.npm_package_version || '1.0.0',
      
      // Performance monitoring
      tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
      profilesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

      integrations: [
        nodeProfilingIntegration(),
      ],

      // Filter sensitive data
      beforeSend(event, hint) {
        // Remove sensitive headers
        if (event.request) {
          delete event.request.cookies;
          if (event.request.headers) {
            delete event.request.headers.authorization;
            delete event.request.headers.cookie;
          }
        }

        // Remove sensitive data from context
        if (event.extra) {
          delete event.extra.password;
          delete event.extra.token;
          delete event.extra.secret;
        }

        return event;
      },

      // Ignore specific errors
      ignoreErrors: [
        'CastError',
        'ValidationError',
        'UnauthorizedError',
        'NotFoundError',
        /Rate limit/i,
        /ECONNREFUSED/
      ],

      // Set context
      initialScope: {
        tags: {
          service: 'b2b-backend'
        }
      }
    });

    logger.info('✅ Sentry initialized successfully');
  } catch (error) {
    logger.error('❌ Failed to initialize Sentry:', error);
  }
};

// Request handler (no longer needed in Sentry v8 but kept for compatibility)
export const sentryRequestHandler = () => {
  return (req, res, next) => next();
};

// Tracing handler (no longer needed in Sentry v8 but kept for compatibility)
export const sentryTracingHandler = () => {
  return (req, res, next) => next();
};

// Error handler (must be after all routes)
export const sentryErrorHandler = () => {
  return (error, req, res, next) => next(error);
};

// Manual error capture
export const captureSentryException = (error, context = {}) => {
  if (process.env.SENTRY_DSN) {
    Sentry.captureException(error, {
      extra: context
    });
  }
};

// Set user context
export const setSentryUser = (user) => {
  if (process.env.SENTRY_DSN && user) {
    Sentry.setUser({
      id: user.id || user._id,
      email: user.email,
      role: user.role
    });
  }
};

export { Sentry };
