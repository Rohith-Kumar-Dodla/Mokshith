import { describe, expect, it } from '@jest/globals';
import AppError from '../../src/errors/AppError.js';
import { calculateRouteDistance } from '../../src/modules/logistics/deliveryDistance.service.js';
import { suggestDeliveryAmount, validateDeliveryAmount } from '../../src/modules/logistics/deliveryAmount.service.js';

describe('delivery offer distance and amount rules', () => {
  it('calculates a deterministic warehouse-to-drop Haversine distance', () => {
    const result = calculateRouteDistance({
      warehouse: { location: { coordinates: { latitude: 17.385, longitude: 78.4867 } } },
      order: { address: { location: { latitude: 17.395, longitude: 78.4967 } } },
    });

    expect(result.distanceUnit).toBe('KM');
    expect(result.distance).toBeGreaterThan(1);
    expect(result.distance).toBeLessThan(2);
  });

  it('rejects missing or invalid coordinates instead of fabricating distance', () => {
    expect(() => calculateRouteDistance({ warehouse: {}, order: {} })).toThrow(AppError);
    expect(() => calculateRouteDistance({
      warehouse: { location: { coordinates: { latitude: 200, longitude: 78 } } },
      order: { address: { location: { latitude: 17, longitude: 78 } } },
    })).toThrow('Distance unavailable');
  });

  it('uses the documented deterministic delivery amount suggestion', () => {
    expect(suggestDeliveryAmount(5.2)).toBe(110);
    expect(validateDeliveryAmount(140)).toBe(140);
    expect(() => validateDeliveryAmount(0)).toThrow('positive INR amount');
    expect(() => validateDeliveryAmount(10.123)).toThrow('positive INR amount');
  });
});
