import AppError from '../../errors/AppError.js';

const toCoordinatePair = (value) => {
  if (!value || typeof value !== 'object') return null;
  const latitude = Number(value.latitude ?? value.lat);
  const longitude = Number(value.longitude ?? value.lng ?? value.lon);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
  if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) return null;
  return { latitude, longitude };
};

export const resolveOriginCoordinates = (warehouse) =>
  toCoordinatePair(warehouse?.location?.coordinates || warehouse?.location?.location || warehouse?.coordinates);

export const resolveDestinationCoordinates = (order) =>
  toCoordinatePair(order?.address?.location || order?.shippingAddress?.location || order?.deliveryLocation);

export const calculateRouteDistance = ({ warehouse, order }) => {
  const origin = resolveOriginCoordinates(warehouse);
  const destination = resolveDestinationCoordinates(order);
  if (!origin) throw new AppError('Distance unavailable: warehouse pickup location is not configured. Please configure it in Settings.', 422, 'WAREHOUSE_LOCATION_REQUIRED');
  if (!destination) throw new AppError('Distance unavailable: customer delivery address could not be located. Please update the delivery address.', 422, 'CUSTOMER_LOCATION_REQUIRED');

  const earthRadiusKm = 6371;
  const toRadians = (degrees) => degrees * (Math.PI / 180);
  const latitudeDelta = toRadians(destination.latitude - origin.latitude);
  const longitudeDelta = toRadians(destination.longitude - origin.longitude);
  const a = Math.sin(latitudeDelta / 2) ** 2
    + Math.cos(toRadians(origin.latitude))
    * Math.cos(toRadians(destination.latitude))
    * Math.sin(longitudeDelta / 2) ** 2;
  const distance = earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return {
    distance: Math.round(distance * 100) / 100,
    distanceUnit: 'KM',
    origin,
    destination,
  };
};
