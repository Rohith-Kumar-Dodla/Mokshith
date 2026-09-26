import AppError from '../../errors/AppError.js';

const numberFromEnv = (name, fallback) => {
  const value = Number(process.env[name]);
  return Number.isFinite(value) && value >= 0 ? value : fallback;
};

// Phase 2 assumption: INR 40 base + INR 12/km, rounded up to the next INR 10.
// Operators can change the suggestion without changing the offer contract.
export const suggestDeliveryAmount = (distanceKm) => {
  const baseAmount = numberFromEnv('DELIVERY_AMOUNT_BASE_INR', 40);
  const perKmAmount = numberFromEnv('DELIVERY_AMOUNT_PER_KM_INR', 12);
  const minimumAmount = numberFromEnv('DELIVERY_AMOUNT_MIN_INR', 40);
  const rawAmount = Math.max(minimumAmount, baseAmount + Number(distanceKm || 0) * perKmAmount);
  return Math.ceil(rawAmount / 10) * 10;
};

export const validateDeliveryAmount = (amount) => {
  const parsed = Number(amount);
  if (!Number.isFinite(parsed) || parsed <= 0 || parsed > 1000000 || Math.round(parsed * 100) !== parsed * 100) {
    throw new AppError('Delivery amount must be a positive INR amount with at most two decimal places.', 400, 'INVALID_DELIVERY_AMOUNT');
  }
  return parsed;
};
