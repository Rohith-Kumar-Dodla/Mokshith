import { describe, expect, it } from '@jest/globals';
import { completeDeliverySchema, updateLocationSchema } from '../../src/modules/logistics/logistics.validation.js';

describe('delivery operation validation', () => {
  it('accepts bounded notes and supported proof references', () => {
    const result = completeDeliverySchema.validate({
      params: { id: '507f1f77bcf86cd799439011' },
      body: { notes: 'Left with reception', proofImage: 'https://cdn.example.com/proof.webp' },
    });
    expect(result.error).toBeUndefined();
  });

  it('rejects malformed proof and oversized notes', () => {
    const result = completeDeliverySchema.validate({
      params: { id: '507f1f77bcf86cd799439011' },
      body: { notes: 'x'.repeat(501), proofImage: 'not-an-image' },
    });
    expect(result.error).toBeDefined();
  });

  it('bounds location coordinates', () => {
    const result = updateLocationSchema.validate({
      params: { id: '507f1f77bcf86cd799439011' },
      body: { lat: 91, lng: 77 },
    });
    expect(result.error).toBeDefined();
  });
});
