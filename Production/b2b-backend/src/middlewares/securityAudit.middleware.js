/**
 * Security Audit Logging Middleware
 * Logs security-sensitive operations for compliance and threat detection
 */

import { logger } from '../config/logger.js';
import { redisClient as redis } from '../config/redis.js';

// Security events that should be logged
const SECURITY_EVENTS = {
  LOGIN_SUCCESS: 'login_success',
  LOGIN_FAILED: 'login_failed',
  LOGOUT: 'logout',
  PASSWORD_CHANGE: 'password_change',
  PASSWORD_RESET: 'password_reset',
  TWO_FA_ENABLED: '2fa_enabled',
  TWO_FA_DISABLED: '2fa_disabled',
  TWO_FA_FAILED: '2fa_failed',
  TOKEN_REFRESH: 'token_refresh',
  TOKEN_REVOKED: 'token_revoked',
  PERMISSION_DENIED: 'permission_denied',
  ROLE_CHANGED: 'role_changed',
  ACCOUNT_LOCKED: 'account_locked',
  ACCOUNT_UNLOCKED: 'account_unlocked',
  SUSPICIOUS_ACTIVITY: 'suspicious_activity',
  FILE_UPLOAD: 'file_upload',
  SENSITIVE_DATA_ACCESS: 'sensitive_data_access',
  PAYMENT_INITIATED: 'payment_initiated',
  PAYMENT_COMPLETED: 'payment_completed',
  PAYMENT_FAILED: 'payment_failed'
};

/**
 * Log security event
 */
export const logSecurityEvent = (event, details = {}) => {
  const logEntry = {
    timestamp: new Date().toISOString(),
    event,
    ...details
  };

  logger.warn('Security Event', logEntry);

  // Store in Redis for real-time analysis (7 day retention)
  redis.lpush('security:events', JSON.stringify(logEntry))
    .then(() => redis.ltrim('security:events', 0, 9999)) // Keep last 10k events
    .catch(err => logger.error('Failed to store security event in Redis', err));
};

/**
 * Audit middleware - logs all authenticated requests
 */
export const auditMiddleware = (req, res, next) => {
  // Skip health checks and static files
  if (req.path === '/health' || req.path.startsWith('/uploads/')) {
    return next();
  }

  const startTime = Date.now();

  // Capture response
  const originalSend = res.send;
  res.send = function (data) {
    res.send = originalSend;

    const duration = Date.now() - startTime;
    const statusCode = res.statusCode;

    // Log if user is authenticated
    if (req.user) {
      const auditLog = {
        userId: req.user._id,
        userName: req.user.name,
        userRole: req.user.role,
        method: req.method,
        path: req.path,
        statusCode,
        duration,
        ip: req.ip,
        userAgent: req.get('user-agent'),
        correlationId: req.correlationId
      };

      // Log failed requests (4xx, 5xx)
      if (statusCode >= 400) {
        logger.warn('Audit - Failed Request', auditLog);
        
        // Track permission denials
        if (statusCode === 403) {
          logSecurityEvent(SECURITY_EVENTS.PERMISSION_DENIED, {
            userId: req.user._id,
            path: req.path,
            ip: req.ip
          });
        }
      }

      // Log sensitive operations
      if (isSensitiveOperation(req)) {
        logSecurityEvent(SECURITY_EVENTS.SENSITIVE_DATA_ACCESS, {
          userId: req.user._id,
          operation: `${req.method} ${req.path}`,
          ip: req.ip
        });
      }
    }

    return originalSend.call(this, data);
  };

  next();
};

/**
 * Check if operation is sensitive
 */
const isSensitiveOperation = (req) => {
  const sensitivePaths = [
    '/api/users',
    '/api/admin',
    '/api/orders',
    '/api/payments',
    '/api/vendors',
    '/api/settings'
  ];

  return sensitivePaths.some(path => req.path.startsWith(path));
};

/**
 * Track authentication attempts
 */
export const trackAuthAttempt = (userId, success, req) => {
  const event = success ? SECURITY_EVENTS.LOGIN_SUCCESS : SECURITY_EVENTS.LOGIN_FAILED;
  
  logSecurityEvent(event, {
    userId,
    ip: req.ip,
    userAgent: req.get('user-agent'),
    timestamp: new Date().toISOString()
  });

  // Track failed attempts in Redis for rate limiting
  if (!success) {
    const key = `auth:failed:${req.ip}`;
    redis.incr(key).then(() => redis.expire(key, 900)); // 15 min window
  }
};

/**
 * Track password changes
 */
export const trackPasswordChange = (userId, req) => {
  logSecurityEvent(SECURITY_EVENTS.PASSWORD_CHANGE, {
    userId,
    ip: req.ip,
    userAgent: req.get('user-agent'),
    timestamp: new Date().toISOString()
  });
};

/**
 * Track 2FA events
 */
export const track2FAEvent = (event, userId, req, success = true) => {
  logSecurityEvent(event, {
    userId,
    success,
    ip: req.ip,
    userAgent: req.get('user-agent'),
    timestamp: new Date().toISOString()
  });
};

/**
 * Track role/permission changes
 */
export const trackRoleChange = (targetUserId, oldRole, newRole, performedBy, req) => {
  logSecurityEvent(SECURITY_EVENTS.ROLE_CHANGED, {
    targetUserId,
    oldRole,
    newRole,
    performedBy,
    ip: req.ip,
    timestamp: new Date().toISOString()
  });
};

/**
 * Track file uploads
 */
export const trackFileUpload = (userId, fileName, fileType, req) => {
  logSecurityEvent(SECURITY_EVENTS.FILE_UPLOAD, {
    userId,
    fileName,
    fileType,
    ip: req.ip,
    timestamp: new Date().toISOString()
  });
};

/**
 * Track payment events
 */
export const trackPaymentEvent = (event, orderId, amount, userId, req) => {
  logSecurityEvent(event, {
    orderId,
    amount,
    userId,
    ip: req.ip,
    timestamp: new Date().toISOString()
  });
};

/**
 * Detect suspicious patterns
 */
export const detectSuspiciousActivity = async (userId, pattern) => {
  logSecurityEvent(SECURITY_EVENTS.SUSPICIOUS_ACTIVITY, {
    userId,
    pattern,
    timestamp: new Date().toISOString()
  });

  // Alert admin (could trigger webhook, email, etc.)
  logger.error('SUSPICIOUS ACTIVITY DETECTED', { userId, pattern });
};

/**
 * Get recent security events for user
 */
export const getRecentSecurityEvents = async (userId, limit = 50) => {
  try {
    const events = await redis.lrange('security:events', 0, 999);
    const userEvents = events
      .map(e => JSON.parse(e))
      .filter(e => e.userId === userId)
      .slice(0, limit);
    
    return userEvents;
  } catch (error) {
    logger.error('Failed to get security events', error);
    return [];
  }
};

export { SECURITY_EVENTS };
