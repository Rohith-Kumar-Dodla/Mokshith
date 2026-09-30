export const LEGACY_GST_RATE = 18;

export const money = (value) => Math.round((Number(value || 0) + Number.EPSILON) * 100) / 100;

export const normalizeGstRate = (value, fallback = LEGACY_GST_RATE) => {
  if (value === undefined || value === null || value === '') return fallback;
  const rate = Number(value);
  return Number.isFinite(rate) ? rate : fallback;
};

export const calculateLineTax = (taxableAmount, gstRate) =>
  money(money(taxableAmount) * (normalizeGstRate(gstRate) / 100));
