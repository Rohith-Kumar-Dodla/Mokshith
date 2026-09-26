import { describe, expect, it } from 'vitest';
import {
  buildEarningsSeries,
  mapDeliveryOffer,
  mapHistoryItem,
  mapShipmentToDeliveryOrder,
} from './deliveryMapper';

describe('delivery mapper authority rules', () => {
  it('uses persisted Logistics distance and amount without estimating from ETA or order value', () => {
    const mapped = mapShipmentToDeliveryOrder({
      _id: 'logistics-1',
      status: 'ACCEPTED',
      etaMinutes: 90,
      distanceKm: 6.4,
      distanceUnit: 'KM',
      deliveryAmount: 120,
      orderId: { _id: 'order-1', totalAmount: 5000, items: [] },
    });

    expect(mapped.distanceKm).toBe(6.4);
    expect(mapped.distance).toBe(6.4);
    expect(mapped.deliveryAmount).toBe(120);
    expect(mapped.earnings).toBe(120);
  });

  it('keeps unavailable distance and payout explicit', () => {
    const mapped = mapHistoryItem({
      _id: 'logistics-2',
      status: 'COMPLETED',
      etaMinutes: 90,
      orderId: { _id: 'order-2', totalAmount: 5000, items: [] },
    });

    expect(mapped.distanceKm).toBeNull();
    expect(mapped.earnings).toBeNull();
    expect(buildEarningsSeries([mapped])).toEqual([]);
  });

  it('normalizes offer and Logistics identifiers together', () => {
    const mapped = mapDeliveryOffer({
      _id: 'offer-1',
      logisticsId: { _id: 'logistics-1', status: 'ASSIGNED', distanceKm: 4 },
      orderId: { _id: 'order-1', totalAmount: 900 },
      deliveryPartnerId: 'partner-1',
      status: 'OFFERED',
      version: 2,
      distance: 4.2,
      distanceUnit: 'KM',
      deliveryAmount: 80,
    });

    expect(mapped.offerId).toBe('offer-1');
    expect(mapped.logisticsId).toBe('logistics-1');
    expect(mapped.offerStatus).toBe('OFFERED');
    expect(mapped.distanceKm).toBe(4.2);
    expect(mapped.deliveryAmount).toBe(80);
  });
});
