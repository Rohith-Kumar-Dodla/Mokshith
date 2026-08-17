/**
 * Enhanced RBAC Permissions System
 * Granular permissions for each resource with CRUD operations
 */

// Resource-based permissions (CRUD pattern)
export const PERMISSIONS = {
  // User Management
  USERS_CREATE: 'users:create',
  USERS_READ: 'users:read',
  USERS_UPDATE: 'users:update',
  USERS_DELETE: 'users:delete',
  USERS_LIST: 'users:list',

  // Product Management
  PRODUCTS_CREATE: 'products:create',
  PRODUCTS_READ: 'products:read',
  PRODUCTS_UPDATE: 'products:update',
  PRODUCTS_DELETE: 'products:delete',
  PRODUCTS_LIST: 'products:list',
  PRODUCTS_APPROVE: 'products:approve',

  // Category Management
  CATEGORIES_CREATE: 'categories:create',
  CATEGORIES_READ: 'categories:read',
  CATEGORIES_UPDATE: 'categories:update',
  CATEGORIES_DELETE: 'categories:delete',
  CATEGORIES_LIST: 'categories:list',

  // Order Management
  ORDERS_CREATE: 'orders:create',
  ORDERS_READ: 'orders:read',
  ORDERS_UPDATE: 'orders:update',
  ORDERS_DELETE: 'orders:delete',
  ORDERS_LIST: 'orders:list',
  ORDERS_CANCEL: 'orders:cancel',
  ORDERS_APPROVE: 'orders:approve',

  // Payment Management
  PAYMENTS_CREATE: 'payments:create',
  PAYMENTS_READ: 'payments:read',
  PAYMENTS_UPDATE: 'payments:update',
  PAYMENTS_LIST: 'payments:list',
  PAYMENTS_REFUND: 'payments:refund',
  PAYMENTS_RECONCILE: 'payments:reconcile',

  // Vendor Management
  VENDORS_CREATE: 'vendors:create',
  VENDORS_READ: 'vendors:read',
  VENDORS_UPDATE: 'vendors:update',
  VENDORS_DELETE: 'vendors:delete',
  VENDORS_LIST: 'vendors:list',
  VENDORS_APPROVE: 'vendors:approve',

  // Inventory Management
  INVENTORY_CREATE: 'inventory:create',
  INVENTORY_READ: 'inventory:read',
  INVENTORY_UPDATE: 'inventory:update',
  INVENTORY_DELETE: 'inventory:delete',
  INVENTORY_LIST: 'inventory:list',

  // Analytics & Reports
  ANALYTICS_VIEW: 'analytics:view',
  REPORTS_GENERATE: 'reports:generate',
  REPORTS_EXPORT: 'reports:export',

  // Settings & Configuration
  SETTINGS_READ: 'settings:read',
  SETTINGS_UPDATE: 'settings:update',
  FEATURE_FLAGS_MANAGE: 'feature_flags:manage',

  // Audit Logs
  AUDIT_LOGS_READ: 'audit_logs:read',
  AUDIT_LOGS_EXPORT: 'audit_logs:export',

  // Credit Management
  CREDITS_CREATE: 'credits:create',
  CREDITS_READ: 'credits:read',
  CREDITS_UPDATE: 'credits:update',
  CREDITS_APPROVE: 'credits:approve',

  // Delivery Management
  DELIVERIES_CREATE: 'deliveries:create',
  DELIVERIES_READ: 'deliveries:read',
  DELIVERIES_UPDATE: 'deliveries:update',
  DELIVERIES_ASSIGN: 'deliveries:assign',

  // Notification Management
  NOTIFICATIONS_SEND: 'notifications:send',
  NOTIFICATIONS_READ: 'notifications:read',

  // Admin Operations
  ADMIN_ACCESS: 'admin:access',
  ADMIN_IMPERSONATE: 'admin:impersonate',
  SYSTEM_CONFIGURE: 'system:configure',
};

// Role-to-Permission Mappings
export const ROLE_PERMISSIONS = {
  SUPER_ADMIN: Object.values(PERMISSIONS), // All permissions

  ADMIN: [
    // Users
    PERMISSIONS.USERS_READ,
    PERMISSIONS.USERS_UPDATE,
    PERMISSIONS.USERS_LIST,

    // Products
    PERMISSIONS.PRODUCTS_CREATE,
    PERMISSIONS.PRODUCTS_READ,
    PERMISSIONS.PRODUCTS_UPDATE,
    PERMISSIONS.PRODUCTS_DELETE,
    PERMISSIONS.PRODUCTS_LIST,
    PERMISSIONS.PRODUCTS_APPROVE,

    // Categories
    PERMISSIONS.CATEGORIES_CREATE,
    PERMISSIONS.CATEGORIES_READ,
    PERMISSIONS.CATEGORIES_UPDATE,
    PERMISSIONS.CATEGORIES_DELETE,
    PERMISSIONS.CATEGORIES_LIST,

    // Orders
    PERMISSIONS.ORDERS_READ,
    PERMISSIONS.ORDERS_UPDATE,
    PERMISSIONS.ORDERS_LIST,
    PERMISSIONS.ORDERS_CANCEL,
    PERMISSIONS.ORDERS_APPROVE,

    // Payments
    PERMISSIONS.PAYMENTS_READ,
    PERMISSIONS.PAYMENTS_LIST,
    PERMISSIONS.PAYMENTS_REFUND,
    PERMISSIONS.PAYMENTS_RECONCILE,

    // Vendors
    PERMISSIONS.VENDORS_READ,
    PERMISSIONS.VENDORS_UPDATE,
    PERMISSIONS.VENDORS_LIST,
    PERMISSIONS.VENDORS_APPROVE,

    // Inventory
    PERMISSIONS.INVENTORY_READ,
    PERMISSIONS.INVENTORY_UPDATE,
    PERMISSIONS.INVENTORY_LIST,

    // Analytics
    PERMISSIONS.ANALYTICS_VIEW,
    PERMISSIONS.REPORTS_GENERATE,
    PERMISSIONS.REPORTS_EXPORT,

    // Settings
    PERMISSIONS.SETTINGS_READ,
    PERMISSIONS.SETTINGS_UPDATE,
    PERMISSIONS.FEATURE_FLAGS_MANAGE,

    // Audit
    PERMISSIONS.AUDIT_LOGS_READ,
    PERMISSIONS.AUDIT_LOGS_EXPORT,

    // Credits
    PERMISSIONS.CREDITS_READ,
    PERMISSIONS.CREDITS_UPDATE,
    PERMISSIONS.CREDITS_APPROVE,

    // Deliveries
    PERMISSIONS.DELIVERIES_READ,
    PERMISSIONS.DELIVERIES_UPDATE,
    PERMISSIONS.DELIVERIES_ASSIGN,

    // Notifications
    PERMISSIONS.NOTIFICATIONS_SEND,
    PERMISSIONS.NOTIFICATIONS_READ,

    // Admin
    PERMISSIONS.ADMIN_ACCESS,
  ],

  VENDOR: [
    // Own products only
    PERMISSIONS.PRODUCTS_CREATE,
    PERMISSIONS.PRODUCTS_READ,
    PERMISSIONS.PRODUCTS_UPDATE,
    PERMISSIONS.PRODUCTS_LIST,

    // Own inventory only
    PERMISSIONS.INVENTORY_CREATE,
    PERMISSIONS.INVENTORY_READ,
    PERMISSIONS.INVENTORY_UPDATE,
    PERMISSIONS.INVENTORY_LIST,

    // Orders related to vendor
    PERMISSIONS.ORDERS_READ,
    PERMISSIONS.ORDERS_UPDATE,
    PERMISSIONS.ORDERS_LIST,

    // Payments for vendor
    PERMISSIONS.PAYMENTS_READ,
    PERMISSIONS.PAYMENTS_LIST,

    // Analytics for own data
    PERMISSIONS.ANALYTICS_VIEW,
    PERMISSIONS.REPORTS_GENERATE,

    // Notifications
    PERMISSIONS.NOTIFICATIONS_READ,

    // Deliveries
    PERMISSIONS.DELIVERIES_READ,
    PERMISSIONS.DELIVERIES_UPDATE,
  ],

  B2B_CUSTOMER: [
    // Products
    PERMISSIONS.PRODUCTS_READ,
    PERMISSIONS.PRODUCTS_LIST,

    // Categories
    PERMISSIONS.CATEGORIES_READ,
    PERMISSIONS.CATEGORIES_LIST,

    // Own orders
    PERMISSIONS.ORDERS_CREATE,
    PERMISSIONS.ORDERS_READ,
    PERMISSIONS.ORDERS_LIST,
    PERMISSIONS.ORDERS_CANCEL,

    // Own payments
    PERMISSIONS.PAYMENTS_CREATE,
    PERMISSIONS.PAYMENTS_READ,
    PERMISSIONS.PAYMENTS_LIST,

    // Own credits
    PERMISSIONS.CREDITS_READ,

    // Deliveries
    PERMISSIONS.DELIVERIES_READ,

    // Notifications
    PERMISSIONS.NOTIFICATIONS_READ,
  ],

  B2C_CUSTOMER: [
    // Products
    PERMISSIONS.PRODUCTS_READ,
    PERMISSIONS.PRODUCTS_LIST,

    // Categories
    PERMISSIONS.CATEGORIES_READ,
    PERMISSIONS.CATEGORIES_LIST,

    // Own orders
    PERMISSIONS.ORDERS_CREATE,
    PERMISSIONS.ORDERS_READ,
    PERMISSIONS.ORDERS_LIST,
    PERMISSIONS.ORDERS_CANCEL,

    // Own payments
    PERMISSIONS.PAYMENTS_CREATE,
    PERMISSIONS.PAYMENTS_READ,
    PERMISSIONS.PAYMENTS_LIST,

    // Deliveries
    PERMISSIONS.DELIVERIES_READ,

    // Notifications
    PERMISSIONS.NOTIFICATIONS_READ,
  ],

  DELIVERY_PARTNER: [
    // Deliveries
    PERMISSIONS.DELIVERIES_READ,
    PERMISSIONS.DELIVERIES_UPDATE,
    PERMISSIONS.DELIVERIES_LIST,

    // Orders (read-only for delivery info)
    PERMISSIONS.ORDERS_READ,
    PERMISSIONS.ORDERS_LIST,

    // Notifications
    PERMISSIONS.NOTIFICATIONS_READ,
  ],

  // Phase 1.1: role foundation only. No Admin/Vendor/Delivery permissions.
  SUPPLIER: [],
};

/**
 * Check if role has specific permission
 */
export const hasPermission = (role, permission) => {
  const rolePermissions = ROLE_PERMISSIONS[role] || [];
  return rolePermissions.includes(permission);
};

/**
 * Get all permissions for a role
 */
export const getPermissionsForRole = (role) => {
  return ROLE_PERMISSIONS[role] || [];
};

/**
 * Check if role has any of the given permissions
 */
export const hasAnyPermission = (role, permissions) => {
  const rolePermissions = ROLE_PERMISSIONS[role] || [];
  return permissions.some((permission) => rolePermissions.includes(permission));
};

/**
 * Check if role has all of the given permissions
 */
export const hasAllPermissions = (role, permissions) => {
  const rolePermissions = ROLE_PERMISSIONS[role] || [];
  return permissions.every((permission) => rolePermissions.includes(permission));
};