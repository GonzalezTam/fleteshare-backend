export const FLETESHARE_FEE = Number(process.env.FLETESHARE_FEE) || 0.1; // 10% fee
export const FIXED_VOLUME_PRICE = Number(process.env.FIXED_VOLUME_PRICE) || 10000;
export const FUEL_PRICE_PER_LITER = Number(process.env.FUEL_PRICE_PER_LITER) || 1500;
export const MARGIN_PERCENTAGE = Number(process.env.MARGIN_PERCENTAGE) || 0.2; // 20% margin
export const DISTANCE_PRICE_PER_KM = FUEL_PRICE_PER_LITER * 0.1;

export const FREIGHT_CONSTANTS = {
  MAX_PARTICIPANTS: 3,
  MAX_DISTANCE_RANGE_KM: 20,
  MIN_PACKAGE_DIMENSION_CM: 1,
  VOLUME_CONVERSION_FACTOR: 1000000, // cm³ a m³
} as const;
