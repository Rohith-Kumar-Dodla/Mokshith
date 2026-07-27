import { mapBackendOrderStatus, mapBackendOrder } from './orderMapper';

export function getOrderStatusLabel(status) {
  const normalized = String(status || '').toUpperCase();
  const labels = {
    CREATED: 'Order Placed',
    PENDING_PAYMENT: 'Pending Payment',
    PENDING: 'Pending',
    CONFIRMED: 'Confirmed',
    PROCESSING: 'Processing',
    PACKED: 'Packed',
    READY_TO_DISPATCH: 'Ready to Dispatch',
    SHIPPED: 'Shipped',
    ASSIGNED: 'Assigned',
    ACCEPTED: 'Accepted',
    OUT_FOR_PICKUP: 'Out For Pickup',
    PICKED_UP: 'Picked Up',
    OUT_FOR_DELIVERY: 'Out For Delivery',
    DELIVERED: 'Delivered',
    COMPLETED: 'Completed',
    CANCELLED: 'Cancelled',
    RETURNED: 'Returned',
    REFUNDED: 'Refunded',
    FAILED: 'Failed',
    DELIVERY_FAILED: 'Delivery Failed',
    CUSTOMER_UNAVAILABLE: 'Customer Unavailable',
    REJECTED: 'Rejected',
  };
  return labels[normalized] || normalized.replace(/_/g, ' ');
}

export function patchMappedOrderFromStatusEvent(order, event = {}) {
  if (!order || !event?.orderId) return order;

  const eventOrderId = String(event.orderId);
  const currentId = String(order.id || order.raw?._id || order.raw?.id || '');
  if (currentId !== eventOrderId) {
    return order;
  }

  const backendStatus = event.status || order.backendStatus;
  const updatedRaw = {
    ...(order.raw || order),
    status: backendStatus,
    statusHistory: event.statusHistory || order.raw?.statusHistory || order.statusHistory,
    logisticsStatus: event.logisticsStatus || order.logisticsStatus,
    updatedAt: event.updatedAt || order.updatedAt,
  };

  return mapBackendOrder(updatedRaw);
}
