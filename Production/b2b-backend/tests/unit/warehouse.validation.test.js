import { createWarehouseSchema, updateWarehouseSchema } from '../../src/modules/warehouse/warehouse.validation.js';

describe('warehouse origin validation', () => {
  it('accepts valid delivery-origin coordinates', () => {
    const { error } = createWarehouseSchema.validate({ body: { name: 'Central', isActive: true, isDeliveryOrigin: true, location: { address: 'Main Road', coordinates: { latitude: 17.4, longitude: 78.4 } } } });
    expect(error).toBeUndefined();
  });

  it('rejects coordinates outside the valid ranges', () => {
    const { error } = updateWarehouseSchema.validate({ params: { id: '507f1f77bcf86cd799439011' }, body: { location: { coordinates: { latitude: 91, longitude: 181 } } } });
    expect(error).toBeDefined();
  });
});
