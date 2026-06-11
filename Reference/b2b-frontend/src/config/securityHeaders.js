/**
 * Content Security Policy (CSP) Configuration
 * 
 * This file defines CSP directives for production deployment.
 * Implement these headers in your web server (Nginx, Apache, etc.) or CDN.
 * 
 * For Next.js/Vercel, add to next.config.js headers()
 * For Nginx, add to server block
 * For Apache, add to .htaccess or VirtualHost
 */

export const cspDirectives = {
  // Default source for all content types
  'default-src': ["'self'"],
  
  // Script sources - allow self and specific trusted domains
  'script-src': [
    "'self'",
    "'unsafe-inline'", // Required for React and inline scripts (consider using nonces in production)
    'https://checkout.razorpay.com',
    'https://cdn.razorpay.com',
  ],
  
  // Style sources
  'style-src': [
    "'self'",
    "'unsafe-inline'", // Required for styled-components, emotion, etc.
    'https://fonts.googleapis.com',
  ],
  
  // Font sources
  'font-src': [
    "'self'",
    'data:',
    'https://fonts.gstatic.com',
  ],
  
  // Image sources
  'img-src': [
    "'self'",
    'data:',
    'blob:',
    'https:', // Allow all HTTPS images (narrow down in production)
  ],
  
  // Connect sources (API calls, WebSockets)
  'connect-src': [
    "'self'",
    process.env.VITE_API_BASE_URL || 'http://localhost:5000',
    process.env.VITE_SOCKET_URL || 'ws://localhost:5000',
    'https://checkout.razorpay.com',
    'https://api.razorpay.com',
    'https://sentry.io', // For error reporting
    'https://*.sentry.io',
  ],
  
  // Frame sources (for embedding external content)
  'frame-src': [
    "'self'",
    'https://checkout.razorpay.com',
  ],
  
  // Object sources (for plugins like Flash)
  'object-src': ["'none'"],
  
  // Media sources (audio, video)
  'media-src': ["'self'"],
  
  // Base URI restriction
  'base-uri': ["'self'"],
  
  // Form action restriction
  'form-action': ["'self'"],
  
  // Frame ancestors (prevent clickjacking)
  'frame-ancestors': ["'none'"],
  
  // Upgrade insecure requests
  'upgrade-insecure-requests': [],
};

/**
 * Generate CSP header string
 */
export const generateCSPHeader = () => {
  return Object.entries(cspDirectives)
    .map(([directive, values]) => {
      if (values.length === 0) {
        return directive;
      }
      return `${directive} ${values.join(' ')}`;
    })
    .join('; ');
};

/**
 * Security headers for production deployment
 */
export const securityHeaders = {
  // Content Security Policy
  'Content-Security-Policy': generateCSPHeader(),
  
  // Prevent MIME type sniffing
  'X-Content-Type-Options': 'nosniff',
  
  // Clickjacking protection
  'X-Frame-Options': 'SAMEORIGIN',
  
  // XSS protection (legacy, but still useful)
  'X-XSS-Protection': '1; mode=block',
  
  // Referrer policy
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  
  // Permissions policy (formerly Feature Policy)
  'Permissions-Policy': 'geolocation=(), microphone=(), camera=(), payment=()',
  
  // Strict Transport Security (HSTS) - only enable if you have HTTPS
  // 'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
  
  // Cache control for HTML files
  'Cache-Control': 'no-cache, no-store, must-revalidate',
};

/**
 * Example Nginx configuration:
 * 
 * server {
 *   # ... other config
 *   
 *   # Security Headers
 *   add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' https://checkout.razorpay.com;";
 *   add_header X-Content-Type-Options "nosniff" always;
 *   add_header X-Frame-Options "SAMEORIGIN" always;
 *   add_header X-XSS-Protection "1; mode=block" always;
 *   add_header Referrer-Policy "strict-origin-when-cross-origin" always;
 *   
 *   # HSTS (uncomment only after testing with HTTPS)
 *   # add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
 * }
 */

/**
 * Example Vercel configuration (vercel.json):
 * 
 * {
 *   "headers": [
 *     {
 *       "source": "/(.*)",
 *       "headers": [
 *         {
 *           "key": "Content-Security-Policy",
 *           "value": "default-src 'self'; script-src 'self' 'unsafe-inline'"
 *         },
 *         {
 *           "key": "X-Content-Type-Options",
 *           "value": "nosniff"
 *         },
 *         {
 *           "key": "X-Frame-Options",
 *           "value": "SAMEORIGIN"
 *         }
 *       ]
 *     }
 *   ]
 * }
 */
