/**
 * Sentry Configuration for Production Error Tracking
 * 
 * Environment Variables Required:
 * - VITE_SENTRY_DSN: Your Sentry DSN (Data Source Name)
 * - VITE_ENVIRONMENT: Deployment environment (production, staging, development)
 * - VITE_RELEASE: Application version for release tracking
 */

export const sentryConfig = {
  // Sentry DSN from environment variables
  dsn: import.meta.env.VITE_SENTRY_DSN,
  
  // Environment tracking
  environment: import.meta.env.VITE_ENVIRONMENT || 'production',
  
  // Release version for tracking
  release: import.meta.env.VITE_RELEASE || '1.0.0',
  
  // Sample rate for performance monitoring (0.0 to 1.0)
  tracesSampleRate: 1.0,
  
  // Sample rate for session replay (0.0 to 1.0)
  replaysSessionSampleRate: 0.1, // 10% of sessions
  
  // Sample rate for error session replay (0.0 to 1.0)
  replaysOnErrorSampleRate: 1.0, // 100% of error sessions
  
  // Enable debug mode in development
  debug: import.meta.env.DEV,
  
  // Integrations configuration
  integrations: (integrations) => {
    // Filter out console integration in production to avoid overhead
    return integrations.filter((integration) => {
      return integration.name !== 'Console';
    });
  },
  
  // Before send hook - filter sensitive data
  beforeSend(event, hint) {
    // Don't send events in development unless explicitly enabled
    if (import.meta.env.DEV && !import.meta.env.VITE_SENTRY_DEV) {
      return null;
    }
    
    // Remove sensitive data from breadcrumbs
    if (event.breadcrumbs) {
      event.breadcrumbs = event.breadcrumbs.map((breadcrumb) => {
        if (breadcrumb.data) {
          // Remove authorization headers
          delete breadcrumb.data.authorization;
          delete breadcrumb.data.token;
          delete breadcrumb.data.password;
          delete breadcrumb.data.apiKey;
        }
        return breadcrumb;
      });
    }
    
    // Remove sensitive data from request
    if (event.request) {
      delete event.request.cookies;
      
      if (event.request.headers) {
        delete event.request.headers.Authorization;
        delete event.request.headers.Cookie;
      }
    }
    
    return event;
  },
  
  // Ignore certain errors
  ignoreErrors: [
    // Network errors that are expected
    'NetworkError',
    'Network request failed',
    'Failed to fetch',
    
    // Browser extension errors
    'Extension context invalidated',
    'chrome-extension://',
    'moz-extension://',
    
    // Aborted operations
    'AbortError',
    'The operation was aborted',
    
    // ResizeObserver errors (harmless)
    'ResizeObserver loop limit exceeded',
    'ResizeObserver loop completed with undelivered notifications',
  ],
  
  // Deny URLs to avoid capturing errors from third-party scripts
  denyUrls: [
    /extensions\//i,
    /^chrome:\/\//i,
    /^moz-extension:\/\//i,
  ],
};

/**
 * Check if Sentry should be initialized
 * Only initialize in production or when explicitly enabled
 */
export const shouldInitializeSentry = () => {
  return (
    sentryConfig.dsn && 
    (import.meta.env.PROD || import.meta.env.VITE_SENTRY_DEV)
  );
};
