import { describe, it, expect } from 'vitest';
import { mapAdminDeliveryQueue } from './adminDeliveryMapper';

describe('mapAdminDeliveryQueue — rejected assignment', () => {
  it('maps REJECTED logistics to Delivery Partner Rejected + Unassigned', () => {
    const mapped = mapAdminDeliveryQueue([
      {
        _id: 'ship-1',
        status: 'REJECTED',
        deliveryPartnerId: null,
        lastRejectedPartnerId: 'dp-1',
        rejectedAt: '2026-08-09T00:00:00.000Z',
        rejectionReason: 'Vehicle breakdown',
        address: 'Hyderabad',
        customerName: 'Shop A',
        orderId: {
          _id: 'ord-1',
          totalAmount: 500,
          items: [{}, {}],
          address: { city: 'Hyderabad' },
        },
        createdAt: '2026-08-09T00:00:00.000Z',
      },
    ]);

    expect(mapped).toHaveLength(1);
    expect(mapped[0].status).toBe('delivery_partner_rejected');
    expect(mapped[0].assignedPartnerLabel).toBe('Unassigned');
    expect(mapped[0].deliveryPartnerId).toBeNull();
    expect(mapped[0].isRejectedAssignment).toBe(true);
    expect(mapped[0].rejectionReason).toBe('Vehicle breakdown');
  });
});
