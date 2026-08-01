const STATUS_RANK = {
  CREATED: 0,
  PENDING_PAYMENT: 0,
  PENDING: 0,
  CONFIRMED: 1,
  PROCESSING: 2,
  PACKED: 3,
  READY_TO_DISPATCH: 4,
  SHIPPED: 5,
  ASSIGNED: 6,
  ACCEPTED: 7,
  OUT_FOR_PICKUP: 8,
  PICKED_UP: 9,
  OUT_FOR_DELIVERY: 10,
  DELIVERED: 11,
  COMPLETED: 12,
  RETURNED: 13,
  REFUNDED: 14,
  CANCELLED: -1,
  FAILED: -1,
  DELIVERY_FAILED: -1,
  CUSTOMER_UNAVAILABLE: -1,
  REJECTED: -1,
};

export function mapBackendOrderStatus(status) {
  const normalized = String(status || '').toUpperCase();
  const statusMap = {
    CREATED: 'pending',
    PENDING_PAYMENT: 'pending',
    PENDING: 'pending',
    CONFIRMED: 'confirmed',
    PROCESSING: 'processing',
    PACKED: 'packed',
    READY_TO_DISPATCH: 'ready_to_dispatch',
    SHIPPED: 'shipped',
    ASSIGNED: 'assigned',
    ACCEPTED: 'accepted',
    OUT_FOR_PICKUP: 'out_for_pickup',
    PICKED_UP: 'picked_up',
    OUT_FOR_DELIVERY: 'dispatched',
    DELIVERED: 'delivered',
    COMPLETED: 'completed',
    RETURNED: 'returned',
    REFUNDED: 'refunded',
    CANCELLED: 'cancelled',
    FAILED: 'cancelled',
    DELIVERY_FAILED: 'delivery_failed',
    CUSTOMER_UNAVAILABLE: 'customer_unavailable',
    REJECTED: 'rejected',
  };
  return statusMap[normalized] || 'pending';
}

export function mapBackendPaymentStatus(status) {
  const normalized = String(status || '').toUpperCase();
  const paymentMap = {
    PENDING: 'pending',
    PAID: 'paid',
    FAILED: 'failed',
    REJECTED: 'rejected',
  };
  return paymentMap[normalized] || String(status || 'pending').toLowerCase();
}

export function formatOrderDate(value) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function formatShippingAddress(address) {
  if (!address) return '—';
  if (typeof address === 'string') return address;

  const parts = [
    address.name,
    address.addressLine,
    address.city,
    address.state,
    address.pincode,
  ].filter(Boolean);

  return parts.join(', ');
}

export function buildOrderTimeline(orderStatus, createdAt) {
  const currentRank = STATUS_RANK[String(orderStatus || '').toUpperCase()] ?? 0;
  const placedDate = formatOrderDate(createdAt);

  const steps = [
    { status: 'Order Placed', rank: 0 },
    { status: 'Order Confirmed', rank: 1 },
    { status: 'Packed', rank: 3 },
    { status: 'Assigned', rank: 6 },
    { status: 'Accepted', rank: 7 },
    { status: 'Picked Up', rank: 9 },
    { status: 'Out For Delivery', rank: 10 },
    { status: 'Delivered', rank: 11 },
    { status: 'Completed', rank: 12 },
  ];

  if (currentRank < 0) {
    return steps.map((step) => ({
      status: step.status,
      completed: step.rank === 0,
      date: step.rank === 0 ? placedDate : null,
    }));
  }

  return steps.map((step) => ({
    status: step.status,
    completed: currentRank >= step.rank,
    date: step.rank === 0 ? placedDate : null,
  }));
}

export function mapBackendOrderItem(item) {
  if (!item) return null;

  const quantity = Number(item.quantity ?? 1);
  const unitPrice = Number(item.finalPrice ?? item.price ?? 0);
  const productName =
    item.name ||
    item.productId?.name ||
    (typeof item.productId === 'object' ? item.productId.name : 'Product');

  return {
    productId: item.productId?._id || item.productId || null,
    productName,
    quantity,
    unitPrice,
    subtotal: unitPrice * quantity,
  };
}

function resolveDeliveryPartnerName(order) {
  const partner =
    order?.deliveryPartner ||
    order?.shipmentId?.deliveryPartnerId ||
    order?.assignedDeliveryPartner;

  if (!partner) return null;
  if (typeof partner === 'object') {
    return partner.name || partner.email || null;
  }
  return null;
}

function resolveDeliveryPartnerPhone(order) {
  const partner =
    order?.deliveryPartner ||
    order?.shipmentId?.deliveryPartnerId ||
    order?.assignedDeliveryPartner;

  if (!partner || typeof partner !== 'object') return null;
  return partner.mobile || partner.phone || null;
}

export function mapBackendOrder(order) {
  if (!order) return null;

  const items = (order.items ?? []).map(mapBackendOrderItem).filter(Boolean);
  const shippingAddress = order.shippingAddress || order.address || null;
  const backendStatus = order.status;

  return {
    id: order._id || order.id,
    orderNumber: order.orderNumber || order._id || order.id,
    items,
    amount: Number(order.totalAmount ?? 0),
    status: mapBackendOrderStatus(backendStatus),
    backendStatus,
    paymentMethod: order.paymentMethod || '—',
    paymentStatus: mapBackendPaymentStatus(order.paymentStatus),
    collectionMode: order.collectionMode || null,
    paymentCollectedAt: order.paymentCollectedAt || null,
    paymentCollectedBy:
      order.paymentCollector?.name ||
      order.paymentCollectedBy?.name ||
      null,
    cashCollectionProof: order.cashCollectionProof || null,
    orderDate: formatOrderDate(order.createdAt),
    createdAt: order.createdAt ?? null,
    updatedAt: order.updatedAt ?? null,
    deliveryDate: backendStatus === 'DELIVERED' ? formatOrderDate(order.updatedAt) : null,
    estimatedDelivery: backendStatus === 'DELIVERED' ? null : 'Processing',
    deliveryPartner: resolveDeliveryPartnerName(order),
    deliveryPartnerPhone: resolveDeliveryPartnerPhone(order),
    logisticsStatus: order.logisticsStatus || order.shipmentId?.status || null,
    address: formatShippingAddress(shippingAddress),
    shippingAddress,
    invoiceId: order.invoiceId || order._id || order.id,
    timeline: buildOrderTimeline(backendStatus, order.createdAt),
    raw: order,
  };
}

export function mapAdminOrderView(order) {
  const mapped = mapBackendOrder(order);
  if (!mapped) return null;

  const user = order?.userId;

  return {
    ...mapped,
    id: mapped.orderNumber || mapped.id,
    vendor: typeof user === 'object' ? user.name || user.email || 'Vendor' : 'Vendor',
    vendorId: typeof user === 'object' ? user._id : user,
    area: mapped.address,
    items: mapped.items.length,
    amount: mapped.amount,
    date: mapped.orderDate,
    deliveryPartner: mapped.deliveryPartner || 'Not Assigned',
    products: mapped.items,
  };
}

export function mapAdminOrders(payload) {
  const list = Array.isArray(payload)
    ? payload
    : payload?.orders ?? payload?.data?.orders ?? payload?.data ?? [];
  return list.map((order) => mapAdminOrderView(order)).filter(Boolean);
}

export function extractAdminOrdersResponse(response) {
  const payload = response?.data ?? response;
  if (Array.isArray(payload)) {
    return { orders: mapAdminOrders(payload), pagination: null };
  }
  const orders = mapAdminOrders(payload?.orders ?? payload);
  return {
    orders,
    pagination: payload?.pagination ?? null,
  };
}

export function computeOrderStats(orders = []) {
  const counts = {
    all: orders.length,
    pending: 0,
    confirmed: 0,
    processing: 0,
    dispatched: 0,
    delivered: 0,
    completed: 0,
    cancelled: 0,
    cod: 0,
  };

  orders.forEach((order) => {
    const status = order.status;
    if (counts[status] !== undefined) {
      counts[status] += 1;
    }
    if (order.paymentMethod === 'COD' || order.paymentMethod === 'cod') {
      counts.cod += 1;
    }
  });

  return {
    totalOrders: orders.length,
    pendingOrders: counts.pending,
    confirmedOrders: counts.confirmed,
    processingOrders: counts.processing,
    dispatchedOrders: counts.dispatched,
    deliveredOrders: counts.delivered + counts.completed,
    completedOrders: counts.completed,
    cancelledOrders: counts.cancelled,
    codOrders: counts.cod,
    totalSpending: orders.reduce((sum, order) => sum + Number(order.amount || 0), 0),
  };
}
