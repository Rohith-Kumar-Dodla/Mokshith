import { addressFingerprint, formatGeocodingQuery, geocodeAddress } from '../../src/services/geocoding.service.js';

describe('geocoding service', () => {
  const address = { addressLine: 'C Block 302', city: 'Hyderabad', state: 'Telangana', pincode: '500038', country: 'India' };

  test('builds a stable server-side query without requiring coordinates', () => {
    expect(formatGeocodingQuery(address)).toContain('C Block 302');
    expect(addressFingerprint(address)).toHaveLength(64);
  });

  test('maps a provider result to internal coordinates', async () => {
    const originalFetch = global.fetch;
    global.fetch = async () => ({ ok: true, json: async () => [{ lat: '17.385', lon: '78.4867', display_name: 'Hyderabad, India' }] });
    await expect(geocodeAddress(address)).resolves.toMatchObject({ latitude: 17.385, longitude: 78.4867 });
    global.fetch = originalFetch;
  });

  test('rejects an unresolvable address', async () => {
    const originalFetch = global.fetch;
    global.fetch = async () => ({ ok: true, json: async () => [] });
    await expect(geocodeAddress(address)).rejects.toMatchObject({ code: 'ADDRESS_GEOCODING_FAILED' });
    global.fetch = originalFetch;
  });
});
