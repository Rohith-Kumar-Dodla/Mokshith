const LOGISTICS_STATUS_MAP = {
  PENDING: 'assigned',
  ASSIGNED: 'assigned',
  ACCEPTED: 'accepted',
  PICKED: 'picked_up',
  PICKED_UP: 'picked_up',
  OUT_FOR_DELIVERY: 'out_for_delivery',
  DELIVERED: 'delivered',
  COMPLETED: 'completed',
  CANCELLED: 'failed',
  FAILED: 'failed',
};

function unwrapList(payload) {
  if (Array.isArray(payload)) return payload;
  return payload?.data ?? [];
}

function getOrderFromShipment(shipment) {
  const order = shipment?.orderId;
  return typeof order === 'object' && order !== null ? order : null;
}

function derivePriority(shipment) {
  if (!shipment?.estimatedDelivery) return 'medium';
  const eta = new Date(shipment.estimatedDelivery).getTime();
  const hoursUntilEta = (eta - Date.now()) / (1000 * 60 * 60);
  if (hoursUntilEta <= 2) return 'high';
  if (hoursUntilEta <= 6) return 'medium';
  return 'low';
}

export function mapLogisticsStatus(status) {
  const normalized = String(status || 'ASSIGNED').toUpperCase();
  return LOGISTICS_STATUS_MAP[normalized] || 'assigned';
}

export function mapShipmentToDeliveryOrder(shipment) {
  if (!shipment) return null;

  const order = getOrderFromShipment(shipment);
  const items = order?.items ?? [];
  const warehouse = shipment.warehouseId;

  return {
    id: shipment._id || shipment.id,
    shipmentId: shipment._id || shipment.id,
    orderRef: order?._id || order?.id || shipment.orderId,
    vendor: order?.userId?.name || shipment.customerName || 'Customer Order',
    vendorId: order?.userId?._id || order?.userId || null,
    pickupLocation:
      typeof warehouse === 'object'
        ? `${warehouse.name || 'Warehouse'}${warehouse.location ? `, ${warehouse.location}` : ''}`
        : 'Warehouse',
    deliveryLocation: shipment.address || '—',
    orderAmount: Number(order?.totalAmount ?? 0),
    itemsCount: items.length,
    status: mapLogisticsStatus(shipment.status),
    backendStatus: shipment.status,
    priority: derivePriority(shipment),
    assignedTime: shipment.createdAt || shipment.updatedAt,
    estimatedDelivery: shipment.estimatedDelivery,
    distance: Number(shipment.etaMinutes || 0) / 10 || 0,
    customerName: shipment.customerName || order?.userId?.name || 'Customer',
    customerPhone: shipment.phone || order?.address?.phone || order?.userId?.mobile || '—',
    specialInstructions: order?.notes || '',
    products: items.map((item) => ({
      id: item.productId?._id || item.productId,
      name: item.name || item.productId?.name || 'Product',
      quantity: item.quantity,
      price: Number(item.finalPrice ?? item.price ?? 0),
    })),
    trackingNumber: shipment.trackingNumber,
    raw: shipment,
  };
}

export function mapShipmentsToDeliveryOrders(payload) {
  return unwrapList(payload).map(mapShipmentToDeliveryOrder).filter(Boolean);
}

export function mapHistoryItem(shipment) {
  const mapped = mapShipmentToDeliveryOrder(shipment);
  if (!mapped) return null;

  const deliveredAt = shipment.deliveredAt || shipment.updatedAt || shipment.createdAt;
  const earnings = Math.round(mapped.orderAmount * 0.05);

  return {
    id: mapped.id,
    vendor: mapped.vendor,
    deliveryLocation: mapped.deliveryLocation,
    status: ['delivered', 'completed'].includes(mapped.status) ? 'delivered' : mapped.status,
    completedAt: deliveredAt,
    date: deliveredAt,
    earnings,
    orderAmount: mapped.orderAmount,
    distance: mapped.distance,
    rating: mapped.status === 'delivered' ? 5 : null,
  };
}

export function mapDeliveryHistory(payload) {
  return unwrapList(payload).map(mapHistoryItem).filter(Boolean);
}

export function mapUserToDeliveryProfile(user) {
  if (!user) return null;

  const defaultAddress = user.addresses?.find((address) => address.isDefault) || user.addresses?.[0];

  const emergencyContact = user.emergencyContact
    ? {
        name: user.emergencyContact.name || '—',
        phone: user.emergencyContact.phone || '—',
        relation: user.emergencyContact.relation || '—',
      }
    : { name: '—', phone: '—', relation: '—' };

  return {
    id: user._id || user.id,
    name: user.name || 'Delivery Partner',
    phone: user.mobile || user.phone || '—',
    email: user.email || '—',
    vehicleType: user.vehicleType || '—',
    vehicleNumber: user.vehicleNumber || '—',
    drivingLicense: user.drivingLicense || user.licenseNumber || '—',
    joiningDate: user.createdAt ? new Date(user.createdAt).toISOString().slice(0, 10) : '—',
    accountStatus: String(user.status || 'ACTIVE').toLowerCase(),
    profileImage: user.profileImage || null,
    assignedArea: user.assignedArea || defaultAddress?.city || '—',
    address: defaultAddress?.addressLine || user.address || '—',
    city: defaultAddress?.city || '—',
    state: defaultAddress?.state || '—',
    pincode: defaultAddress?.pincode || '—',
    emergencyContact,
    bankDetails: user.bankDetails || null,
    documents: user.documents || {},
    raw: user,
  };
}

export function mapNotifications(payload) {
  const list = unwrapList(payload);
  return list.map((notification) => ({
    id: notification._id || notification.id,
    title: notification.title,
    message: notification.message,
    type: notification.type || 'info',
    isRead: Boolean(notification.isRead),
    read: Boolean(notification.isRead),
    time: notification.createdAt
      ? new Date(notification.createdAt).toLocaleString('en-IN')
      : '—',
    createdAt: notification.createdAt,
    raw: notification,
  }));
}

export function computeDeliveryAnalytics(assignments = [], history = []) {
  const active = assignments.filter((order) => order.status !== 'delivered');
  const completedToday = history.filter((item) => {
    if (!item.completedAt) return false;
    const date = new Date(item.completedAt);
    const today = new Date();
    return date.toDateString() === today.toDateString();
  });

  const todaysEarnings = completedToday.reduce((sum, item) => sum + Number(item.earnings || 0), 0);
  const monthlyEarnings = history.reduce((sum, item) => {
    const date = new Date(item.completedAt || item.date);
    const now = new Date();
    if (date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear()) {
      return sum + Number(item.earnings || 0);
    }
    return sum;
  }, 0);

  const deliveredCount = history.filter((item) => item.status === 'delivered').length;
  const failedCount = history.filter((item) => item.status === 'failed').length;
  const totalAttempts = deliveredCount + failedCount;
  const successRate = totalAttempts > 0 ? Math.round((deliveredCount / totalAttempts) * 100) : 100;

  return {
    today: {
      assignedOrders: assignments.length,
      pendingDeliveries: active.length,
      completedDeliveries: completedToday.length,
      todaysEarnings,
      monthlyEarnings,
      averageRating: deliveredCount > 0 ? 4.8 : 0,
      successRate,
    },
    activityTimeline: history.slice(0, 6).map((item) => ({
      id: item.id,
      type: item.status === 'delivered' ? 'delivery_completed' : 'status_update',
      title: item.status === 'delivered' ? 'Delivery Completed' : 'Delivery Updated',
      description: `${item.vendor} — ${item.deliveryLocation}`,
      timestamp: item.completedAt || item.date,
    })),
  };
}

export function buildEarningsSeries(history = []) {
  const grouped = history.reduce((acc, item) => {
    const key = new Date(item.completedAt || item.date).toISOString().slice(0, 10);
    if (!acc[key]) {
      acc[key] = { date: key, total: 0, earnings: 0, bonus: 0, deliveries: 0 };
    }
    acc[key].total += Number(item.earnings || 0);
    acc[key].earnings += Number(item.earnings || 0);
    acc[key].deliveries += 1;
    return acc;
  }, {});

  return Object.values(grouped).sort((a, b) => a.date.localeCompare(b.date));
}

export function buildPerformanceMetrics(assignments = [], history = []) {
  const delivered = history.filter((item) => item.status === 'delivered');
  const cancelled = history.filter((item) => item.status === 'failed');
  const total = delivered.length + cancelled.length;

  return {
    successRate: total > 0 ? Math.round((delivered.length / total) * 100) : 100,
    averageRating: delivered.length > 0 ? 4.8 : 0,
    onTimeDeliveries: delivered.length > 0 ? 92 : 0,
    completedDeliveries: delivered.length,
    cancelledDeliveries: cancelled.length,
    customerSatisfaction: delivered.length > 0 ? 96 : 0,
    activeAssignments: assignments.length,
  };
}
