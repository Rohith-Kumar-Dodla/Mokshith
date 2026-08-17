import { ORDER_STATUS } from './orderStatus.js';

/**
 * Statuses that do not represent procureable customer demand.
 *
 * Aligns with existing Order.getOrders customer visibility, which already hides
 * CREATED / PENDING_PAYMENT / FAILED, plus terminal negative outcomes.
 * Do not treat this as a rewrite of Order workflow.
 */
export const PROCUREMENT_DEMAND_EXCLUDED_STATUSES = [
  ORDER_STATUS.CREATED,
  ORDER_STATUS.PENDING_PAYMENT,
  ORDER_STATUS.FAILED,
  ORDER_STATUS.CANCELLED,
  ORDER_STATUS.REJECTED,
  ORDER_STATUS.RETURNED,
  ORDER_STATUS.REFUNDED,
];

export const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
