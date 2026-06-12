function unwrapList(payload) {
  if (Array.isArray(payload)) return payload;
  return payload?.data ?? [];
}

function getOrderFromShipment(shipment) {
  const order = shipment?.orderId;
  return typeof order === 'object' && order !== null ? order : null;
}

function getPartnerId(partner) {
  if (!partner) return null;
  if (typeof partner === 'object') return partner._id || partner.id;
  return partner;
}

export function mapAdminDeliveryQueue(payload) {
  return unwrapList(payload).map((shipment) => {
    const order = getOrderFromShipment(shipment);
    const partner = shipment.deliveryPartnerId;

    return {
      id: shipment._id || shipment.id,
      orderId: order?._id || order?.id || shipment.orderId,
      vendor: order?.userId?.name || shipment.customerName || 'Customer',
      area: order?.address?.city || order?.shippingAddress?.city || shipment.address || '—',
      items: order?.items?.length || 0,
      amount: Number(order?.totalAmount || 0),
      status: String(shipment.status || 'ASSIGNED').toLowerCase(),
      deliveryPartnerId: getPartnerId(partner),
      deliveryPartnerName:
        typeof partner === 'object' ? partner.name : null,
      date: shipment.createdAt,
      needsShipment: false,
    };
  });
}

export function mapAdminDeliveryHistory(payload) {
  return mapAdminDeliveryQueue(payload).map((item) => ({
    ...item,
    status: 'delivered',
  }));
}

export function mapAdminDeliveryPartners(users, queue = []) {
  const workload = queue.reduce((acc, item) => {
    if (!item.deliveryPartnerId) return acc;
    const key = String(item.deliveryPartnerId);
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  return users.map((user) => ({
    id: user._id || user.id,
    name: user.name || 'Partner',
    vehicle: user.vehicleType || user.vehicleNumber || '—',
    status: String(user.status || 'ACTIVE').toLowerCase() === 'active' ? 'active' : 'inactive',
    currentDeliveries: workload[String(user._id || user.id)] || 0,
    rating: user.rating || 4.5,
    area: user.addresses?.[0]?.city || '—',
    totalDeliveries: user.completedDeliveries || 0,
  }));
}
