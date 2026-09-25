import crypto from 'node:crypto';
import AppError from '../errors/AppError.js';

const DEFAULT_PROVIDER_URL = 'https://nominatim.openstreetmap.org/search';
const TIMEOUT_MS = Math.max(1000, Number(process.env.GEOCODING_TIMEOUT_MS || 8000));

export const formatGeocodingQuery = (address = {}) => [
  address.addressLine || address.line1,
  address.line2,
  address.area,
  address.city,
  address.district,
  address.state,
  address.pincode || address.postalCode,
  address.country || 'India',
].filter(Boolean).join(', ');

export const addressFingerprint = (address = {}) => crypto
  .createHash('sha256')
  .update(formatGeocodingQuery(address).trim().toLowerCase())
  .digest('hex');

export const hasValidCoordinates = (location) => {
  const latitude = Number(location?.latitude);
  const longitude = Number(location?.longitude);
  return Number.isFinite(latitude) && Number.isFinite(longitude)
    && latitude >= -90 && latitude <= 90 && longitude >= -180 && longitude <= 180;
};

const getGeocodingQueries = (address = {}) => {
  const fullQuery = formatGeocodingQuery(address);
  const localityQuery = [
    address.city,
    address.district,
    address.state,
    address.pincode || address.postalCode,
    address.country || 'India',
  ].filter(Boolean).join(', ');

  return [...new Set([fullQuery, localityQuery].filter((query) => query && query.length >= 8))];
};

export const geocodeAddress = async (address = {}) => {
  const queries = getGeocodingQueries(address);
  if (!queries.length) {
    throw new AppError('We could not locate this address. Please check your address details and try again.', 422, 'ADDRESS_GEOCODING_FAILED');
  }

  const providerUrl = process.env.GEOCODING_PROVIDER_URL || DEFAULT_PROVIDER_URL;

  for (const query of queries) {
    const url = new URL(providerUrl);
    url.searchParams.set('q', query);
    url.searchParams.set('format', 'jsonv2');
    url.searchParams.set('limit', '1');
    url.searchParams.set('addressdetails', '1');

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
    try {
      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          Accept: 'application/json',
          'User-Agent': process.env.GEOCODING_USER_AGENT || 'Mokshith-Enterprises-B2B/1.0',
        },
      });
      if (!response.ok) throw new Error(`Geocoding provider returned ${response.status}`);
      const results = await response.json();
      const first = Array.isArray(results) ? results[0] : null;
      const latitude = Number(first?.lat);
      const longitude = Number(first?.lon);
      if (!first || !hasValidCoordinates({ latitude, longitude })) throw new Error('No geocoding result');
      return {
        latitude,
        longitude,
        formattedAddress: first.display_name || query,
        addressHash: addressFingerprint(address),
      };
    } catch (error) {
      if (error?.code === 'ADDRESS_GEOCODING_FAILED') throw error;
    } finally {
      clearTimeout(timeout);
    }
  }

  throw new AppError('We could not locate this address. Please check your address details and try again.', 422, 'ADDRESS_GEOCODING_FAILED');
};
