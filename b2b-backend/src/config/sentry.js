import * as Sentry from '@sentry/node';
import { ProfilingIntegration } from '@sentry/profiling-node';
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
        // Express integration
        new Sentry.Integrations.Http({ tracing: true }),
        new Sentry.Integrations.Express({ app }),
        new ProfilingIntegration(),
        // MongoDB integration
        new Sentry.Integrations.Mongo({
          useMongoose: true
        })
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

// Request handler (must be first middleware)
export const sentryRequestHandler = () => {
  return Sentry.Handlers.requestHandler({
    user: ['id', 'email', 'role'],
    ip: true,
    transaction: 'methodPath'
  });
};

// Tracing handler
export const sentryTracingHandler = () => {
  return Sentry.Handlers.tracingHandler();
};

// Error handler (must be after all routes)
export const sentryErrorHandler = () => {
  return Sentry.Handlers.errorHandler({
    shouldHandleError(error) {
      // Capture all errors with status code >= 500
      return !error.statusCode || error.statusCode >= 500;
    }
  });
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
