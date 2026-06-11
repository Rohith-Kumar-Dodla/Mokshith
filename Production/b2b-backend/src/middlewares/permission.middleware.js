import AppError from '../errors/AppError.js';
import PermissionError from '../errors/PermissionError.js';
import { hasPermission, hasAnyPermission, hasAllPermissions } from '../constants/permissions.js';
import { ROLES } from '../constants/roles.js';
import { logSecurityEvent, SECURITY_EVENTS } from './securityAudit.middleware.js';

/**
 * Check if user has required permission
 */
export const requirePermission = (permission) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError('Authentication required', 401));
    }

    // Super Admin bypasses all permission checks
    if (req.user.role === ROLES.SUPER_ADMIN) {
      return next();
    }

    if (!hasPermission(req.user.role, permission)) {
      logSecurityEvent(SECURITY_EVENTS.PERMISSION_DENIED, {
        userId: req.user._id,
        role: req.user.role,
        requiredPermission: permission,
        path: req.path,
        method: req.method,
        ip: req.ip
      });

      return next(new PermissionError(`Permission denied: ${permission}`));
    }

    next();
  };
};

/**
 * Check if user has any of the required permissions
 */
export const requireAnyPermission = (...permissions) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError('Authentication required', 401));
    }

    // Super Admin bypasses all permission checks
    if (req.user.role === ROLES.SUPER_ADMIN) {
      return next();
    }

    if (!hasAnyPermission(req.user.role, permissions)) {
      logSecurityEvent(SECURITY_EVENTS.PERMISSION_DENIED, {
        userId: req.user._id,
        role: req.user.role,
        requiredPermissions: permissions,
        path: req.path,
        method: req.method,
        ip: req.ip
      });

      return next(new PermissionError(`Permission denied. Required any of: ${permissions.join(', ')}`));
    }

    next();
  };
};

/**
 * Check if user has all of the required permissions
 */
export const requireAllPermissions = (...permissions) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError('Authentication required', 401));
    }

    // Super Admin bypasses all permission checks
    if (req.user.role === ROLES.SUPER_ADMIN) {
      return next();
    }

    if (!hasAllPermissions(req.user.role, permissions)) {
      logSecurityEvent(SECURITY_EVENTS.PERMISSION_DENIED, {
        userId: req.user._id,
        role: req.user.role,
        requiredPermissions: permissions,
        path: req.path,
        method: req.method,
        ip: req.ip
      });

      return next(new PermissionError(`Permission denied. Required all of: ${permissions.join(', ')}`));
    }

    next();
  };
};

/**
 * Check if user is resource owner or has permission
 * @param {string} resourceField - Field name in req object containing resource (e.g., 'product', 'order')
 * @param {string} ownerField - Field name in resource containing owner ID (e.g., 'userId', 'vendorId')
 * @param {string} fallbackPermission - Permission required if not owner
 */
export const requireOwnershipOr = (resourceField, ownerField, fallbackPermission) => {
  return async (req, res, next) => {
    if (!req.user) {
      return next(new AppError('Authentication required', 401));
    }

    // Super Admin bypasses all checks
    if (req.user.role === ROLES.SUPER_ADMIN) {
      return next();
    }

    const resource = req[resourceField];
    
    if (!resource) {
      return next(new AppError(`Resource not found: ${resourceField}`, 404));
    }

    // Check ownership
    const ownerId = resource[ownerField]?.toString() || resource[ownerField];
    const userId = req.user._id?.toString() || req.user._id;

    if (ownerId === userId) {
      // User owns the resource
      return next();
    }

    // Check fallback permission
    if (fallbackPermission && hasPermission(req.user.role, fallbackPermission)) {
      return next();
    }

    logSecurityEvent(SECURITY_EVENTS.PERMISSION_DENIED, {
      userId: req.user._id,
      role: req.user.role,
      reason: 'Not resource owner and missing fallback permission',
      resourceField,
      ownerField,
      fallbackPermission,
      path: req.path,
      ip: req.ip
    });

    return next(new PermissionError('Access denied. You do not own this resource.'));
  };
};

/**
 * Require specific role(s)
 */
export const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError('Authentication required', 401));
    }

    if (!roles.includes(req.user.role)) {
      logSecurityEvent(SECURITY_EVENTS.PERMISSION_DENIED, {
        userId: req.user._id,
        role: req.user.role,
        requiredRoles: roles,
        path: req.path,
        ip: req.ip
      });

      return next(new PermissionError(`Access denied. Required role: ${roles.join(' or ')}`));
    }

    next();
  };
};

/**
 * Check if user is vendor and owns the vendor account
 */
export const requireVendorOwnership = async (req, res, next) => {
  if (!req.user) {
    return next(new AppError('Authentication required', 401));
  }

  // Super Admin bypasses
  if (req.user.role === ROLES.SUPER_ADMIN) {
    return next();
  }

  // Must be vendor role
  if (req.user.role !== ROLES.VENDOR) {
    return next(new PermissionError('Only vendors can access this resource'));
  }

  // Check if vendorId in params matches user's vendorId
  const paramVendorId = req.params.vendorId || req.body.vendorId;
  const userVendorId = req.user.vendorId?.toString();

  if (paramVendorId && paramVendorId !== userVendorId) {
    logSecurityEvent(SECURITY_EVENTS.PERMISSION_DENIED, {
      userId: req.user._id,
      reason: 'Vendor accessing another vendor\'s data',
      requestedVendorId: paramVendorId,
      userVendorId,
      path: req.path,
      ip: req.ip
    });

    return next(new PermissionError('You can only access your own vendor data'));
  }

  next();
};

/**
 * Admin or resource owner middleware
 */
export const requireAdminOrOwner = (resourceField = 'user', ownerField = '_id') => {
  return async (req, res, next) => {
    if (!req.user) {
      return next(new AppError('Authentication required', 401));
    }

    // Admin/Super Admin can access
    if (req.user.role === ROLES.SUPER_ADMIN || req.user.role === ROLES.ADMIN) {
      return next();
    }

    // Check ownership
    const resource = req[resourceField];
    if (!resource) {
      return next(new AppError('Resource not found', 404));
    }

    const ownerId = resource[ownerField]?.toString();
    const userId = req.user._id?.toString();

    if (ownerId !== userId) {
      return next(new PermissionError('Access denied'));
    }

    next();
  };
};

/**
 * Check resource quota/limits based on role
 */
export const checkResourceQuota = (resourceType, limitField) => {
  const ROLE_LIMITS = {
    [ROLES.VENDOR]: {
      products: 1000,
      orders_per_day: 500,
      images_per_product: 10
    },
    [ROLES.B2B_CUSTOMER]: {
      orders_per_day: 100,
      cart_items: 500
    },
    [ROLES.B2C_CUSTOMER]: {
      orders_per_day: 10,
      cart_items: 50
    }
  };

  return async (req, res, next) => {
    if (!req.user) {
      return next(new AppError('Authentication required', 401));
    }

    // Super Admin bypasses quotas
    if (req.user.role === ROLES.SUPER_ADMIN) {
      return next();
    }

    const limits = ROLE_LIMITS[req.user.role];
    if (!limits || !limits[limitField]) {
      return next(); // No limit defined
    }

    const limit = limits[limitField];
    const currentCount = req.body[resourceType + 'Count'] || 0;

    if (currentCount >= limit) {
      return next(new PermissionError(`${resourceType} limit exceeded. Maximum: ${limit}`));
    }

    next();
  };
};

// Backwards compatibility
export const checkPermission = requirePermission;