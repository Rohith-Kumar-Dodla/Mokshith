import mongoose from 'mongoose';
import User from '../user/user.model.js';
import { ROLES } from '../../constants/roles.js';
import { USER_STATUS } from '../../constants/userStatus.js';
import { logger } from '../../config/logger.js';
import { sendNotification } from './notification.service.js';

const EVENT_DEFINITIONS = {
  USER_REGISTERED: { category: 'USER', type: 'USER', title: 'New Account Registration', severity: 'INFO', route: () => '/super-admin/user-management?tab=approvals' },
  ADMIN_CREATED: { category: 'USER', type: 'USER', title: 'Admin Created', severity: 'SUCCESS', route: () => '/super-admin/user-management?tab=admins' },
  ADMIN_UPDATED: { category: 'USER', type: 'USER', title: 'Admin Updated', severity: 'INFO', route: () => '/super-admin/user-management?tab=admins' },
  DELIVERY_PARTNER_CREATED: { category: 'USER', type: 'USER', title: 'Delivery Partner Created', severity: 'SUCCESS', route: () => '/super-admin/user-management?tab=delivery' },
  DELIVERY_PARTNER_UPDATED: { category: 'USER', type: 'USER', title: 'Delivery Partner Updated', severity: 'INFO', route: () => '/super-admin/user-management?tab=delivery' },
  USER_APPROVED: { category: 'USER', type: 'USER', title: 'User Approved', severity: 'SUCCESS', route: () => '/super-admin/user-management?tab=approvals' },
  USER_REJECTED: { category: 'USER', type: 'USER', title: 'User Rejected', severity: 'WARNING', route: () => '/super-admin/user-management?tab=approvals' },
  CATEGORY_CREATED: { category: 'CATALOG', type: 'CATALOG', title: 'Category Created', severity: 'SUCCESS', route: () => '/super-admin/platform' },
  CATEGORY_UPDATED: { category: 'CATALOG', type: 'CATALOG', title: 'Category Updated', severity: 'INFO', route: () => '/super-admin/platform' },
  PRODUCT_CREATED: { category: 'CATALOG', type: 'CATALOG', title: 'Product Created', severity: 'SUCCESS', route: () => '/super-admin/platform' },
  PRODUCT_UPDATED: { category: 'CATALOG', type: 'CATALOG', title: 'Product Updated', severity: 'INFO', route: () => '/super-admin/platform' },
  PRODUCT_STATUS_CHANGED: { category: 'CATALOG', type: 'CATALOG', title: 'Product Status Changed', severity: 'WARNING', route: () => '/super-admin/platform' },
  PRODUCT_STOCK_CHANGED: { category: 'INVENTORY', type: 'INVENTORY', title: 'Product Stock Changed', severity: 'INFO', route: () => '/super-admin/platform' },
  INVENTORY_LOW_STOCK: { category: 'INVENTORY', type: 'INVENTORY', title: 'Low Stock Alert', severity: 'WARNING', route: () => '/super-admin/platform' },
  SUPPLIER_CREATED: { category: 'SUPPLIER', type: 'SUPPLIER', title: 'Supplier Created', severity: 'SUCCESS', route: ({ entityId }) => `/supplier-dashboard/suppliers/${entityId}` },
  SUPPLIER_UPDATED: { category: 'SUPPLIER', type: 'SUPPLIER', title: 'Supplier Updated', severity: 'INFO', route: ({ entityId }) => `/supplier-dashboard/suppliers/${entityId}` },
  SUPPLIER_STATUS_CHANGED: { category: 'SUPPLIER', type: 'SUPPLIER', title: 'Supplier Status Changed', severity: 'WARNING', route: ({ entityId }) => `/supplier-dashboard/suppliers/${entityId}` },
  SUPPLIER_CATEGORY_CHANGED: { category: 'SUPPLIER', type: 'SUPPLIER', title: 'Supplier Category Changed', severity: 'INFO', route: ({ supplierId }) => `/supplier-dashboard/suppliers/${supplierId}/categories` },
  SUPPLIER_PRODUCT_CHANGED: { category: 'SUPPLIER', type: 'SUPPLIER', title: 'Supplier Product Changed', severity: 'INFO', route: ({ supplierId }) => `/supplier-dashboard/suppliers/${supplierId}/products` },
  SUPPLIER_PRICE_CHANGED: { category: 'SUPPLIER', type: 'SUPPLIER', title: 'Supplier Price Changed', severity: 'WARNING', route: ({ supplierId }) => `/supplier-dashboard/suppliers/${supplierId}/products` },
  ORDER_CREATED: { category: 'ORDER', type: 'ORDER', title: 'New Order Created', severity: 'SUCCESS', route: () => '/super-admin/orders' },
  ORDER_STATUS_CHANGED: { category: 'ORDER', type: 'ORDER', title: 'Order Status Changed', severity: 'INFO', route: () => '/super-admin/orders' },
  ORDER_CANCELLED: { category: 'ORDER', type: 'ORDER', title: 'Order Cancelled', severity: 'WARNING', route: () => '/super-admin/orders' },
  ORDER_FAILED: { category: 'ORDER', type: 'ORDER', title: 'Order Failed', severity: 'ERROR', route: () => '/super-admin/orders' },
  PAYMENT_INITIATED: { category: 'PAYMENT', type: 'PAYMENT', title: 'Payment Initiated', severity: 'INFO', route: () => '/super-admin/payments' },
  PAYMENT_SUCCESS: { category: 'PAYMENT', type: 'PAYMENT', title: 'Payment Successful', severity: 'SUCCESS', route: () => '/super-admin/payments' },
  PAYMENT_FAILED: { category: 'PAYMENT', type: 'PAYMENT', title: 'Payment Failed', severity: 'ERROR', route: () => '/super-admin/payments' },
  BANK_TRANSFER_PROOF_SUBMITTED: { category: 'PAYMENT', type: 'PAYMENT', title: 'Bank Transfer Proof Submitted', severity: 'INFO', route: () => '/super-admin/orders' },
  BANK_TRANSFER_APPROVED: { category: 'PAYMENT', type: 'PAYMENT', title: 'Bank Transfer Approved', severity: 'SUCCESS', route: () => '/super-admin/orders' },
  BANK_TRANSFER_REJECTED: { category: 'PAYMENT', type: 'PAYMENT', title: 'Bank Transfer Rejected', severity: 'WARNING', route: () => '/super-admin/orders' },
  REFUND_INITIATED: { category: 'PAYMENT', type: 'PAYMENT', title: 'Refund Initiated', severity: 'INFO', route: () => '/super-admin/payments' },
  REFUND_COMPLETED: { category: 'PAYMENT', type: 'PAYMENT', title: 'Refund Completed', severity: 'SUCCESS', route: () => '/super-admin/payments' },
  REFUND_FAILED: { category: 'PAYMENT', type: 'PAYMENT', title: 'Refund Failed', severity: 'ERROR', route: () => '/super-admin/payments' },
  RETURN_REQUESTED: { category: 'ORDER', type: 'ORDER', title: 'New Return Request', severity: 'WARNING', route: ({ entityId }) => `/super-admin/returns/${entityId}` },
  RETURN_APPROVED: { category: 'ORDER', type: 'ORDER', title: 'Return Approved', severity: 'INFO', route: ({ entityId }) => `/super-admin/returns/${entityId}` },
  RETURN_INSPECTION_REQUIRED: { category: 'ORDER', type: 'ORDER', title: 'Return Inspection Required', severity: 'WARNING', route: ({ entityId }) => `/super-admin/returns/${entityId}` },
  RETURN_REFUND_ACTION: { category: 'PAYMENT', type: 'PAYMENT', title: 'Return Refund Action', severity: 'WARNING', route: ({ entityId }) => `/super-admin/returns/${entityId}` },
  RETURN_REPLACEMENT_CREATED: { category: 'ORDER', type: 'ORDER', title: 'Return Replacement Created', severity: 'SUCCESS', route: ({ entityId }) => `/super-admin/returns/${entityId}` },
  DELIVERY_ASSIGNED: { category: 'LOGISTICS', type: 'LOGISTICS', title: 'Delivery Assigned', severity: 'SUCCESS', route: () => '/super-admin/delivery-assignment' },
  DELIVERY_STATUS_CHANGED: { category: 'LOGISTICS', type: 'LOGISTICS', title: 'Delivery Status Changed', severity: 'INFO', route: () => '/super-admin/delivery-assignment' },
  DELIVERY_OFFER_CREATED: { category: 'LOGISTICS', type: 'LOGISTICS', title: 'Delivery Offer Created', severity: 'INFO', route: () => '/super-admin/delivery-assignment' },
  DELIVERY_OFFER_ACCEPTED: { category: 'LOGISTICS', type: 'LOGISTICS', title: 'Delivery Offer Accepted', severity: 'SUCCESS', route: () => '/super-admin/delivery-assignment' },
  DELIVERY_REASSIGNMENT_REQUIRED: { category: 'LOGISTICS', type: 'LOGISTICS', title: 'Delivery Reassignment Required', severity: 'WARNING', route: () => '/super-admin/delivery-assignment' },
  DELIVERY_COMPLETED: { category: 'LOGISTICS', type: 'LOGISTICS', title: 'Delivery Completed', severity: 'SUCCESS', route: () => '/super-admin/delivery-assignment' },
  SETTINGS_CHANGED: { category: 'SYSTEM', type: 'SYSTEM', title: 'Platform Settings Changed', severity: 'WARNING', route: () => '/super-admin/system-settings' },
};

const cleanText = (value, max = 500) => String(value || '').replace(/[<>]/g, '').slice(0, max);
const safeId = (value) => mongoose.isValidObjectId(value) ? value : null;

export const SUPER_ADMIN_EVENT_TYPES = Object.freeze(Object.keys(EVENT_DEFINITIONS));

export async function publishSuperAdminEvent(eventType, details = {}) {
  const definition = EVENT_DEFINITIONS[eventType];
  if (!definition) {
    logger.warn('Ignored unknown Super Admin business event', { eventType });
    return [];
  }
  try {
    const recipients = await User.find({ role: ROLES.SUPER_ADMIN, status: USER_STATUS.ACTIVE, isDeleted: { $ne: true } }).select('_id').lean();
    const entityId = safeId(details.entityId);
    const businessKey = cleanText(details.businessKey || details.version || '1', 100);
    const actionUrl = definition.route({ ...details, entityId: entityId ? String(entityId) : '' });
    if (!actionUrl.startsWith('/') || actionUrl.startsWith('//')) throw new Error('Unsafe notification action URL');
    return await Promise.all(recipients.map(({ _id }) => sendNotification({
      force: true,
      userId: _id,
      category: definition.category,
      type: definition.type,
      eventType,
      title: cleanText(details.title || definition.title, 160),
      message: cleanText(details.message || definition.title),
      entityType: cleanText(details.entityType || definition.category, 50),
      entityId,
      actorId: safeId(details.actorId),
      actionUrl,
      severity: details.severity || definition.severity,
      eventKey: `${eventType}:${details.entityType || definition.category}:${entityId || cleanText(details.entityKey || 'global', 100)}:${businessKey}`,
      metadata: { status: cleanText(details.status, 50), reference: cleanText(details.reference, 100) },
    })));
  } catch (error) {
    logger.error('Super Admin business notification failed', { eventType, entityId: details.entityId, error: error?.message || String(error) });
    return [];
  }
}
