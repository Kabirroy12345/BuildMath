/**
 * Unit conversion and rounding utilities for DIY calculators.
 * Pure functions used across all calculator modules.
 */

/**
 * Converts feet and inches to decimal feet.
 * @param feet Whole or decimal feet
 * @param inches Additional inches (0-11.99+)
 */
export function feetInchesToFeet(feet: number, inches: number = 0): number {
  const safeFeet = Math.max(0, Number(feet) || 0);
  const safeInches = Math.max(0, Number(inches) || 0);
  return safeFeet + safeInches / 12;
}

/**
 * Rounds a number to a fixed number of decimal places.
 */
export function roundTo(value: number, decimals: number = 2): number {
  const factor = Math.pow(10, decimals);
  return Math.round((value + Number.EPSILON) * factor) / factor;
}

/**
 * Rounds up to the nearest whole purchasable unit (min 0).
 */
export function ceilUnits(value: number): number {
  if (value <= 0 || Number.isNaN(value)) return 0;
  return Math.ceil(roundTo(value, 6));
}

/**
 * Computes low (-15%), typical, and high (+20%) cost estimates from a base total.
 */
export function computeCostRange(
  quantity: number,
  unitPrice: number,
  lowFactor: number = 0.85,
  highFactor: number = 1.2
): { low: number; typical: number; high: number } {
  const typical = roundTo(quantity * unitPrice, 2);
  return {
    low: roundTo(typical * lowFactor, 2),
    typical,
    high: roundTo(typical * highFactor, 2),
  };
}

/**
 * Sums low, typical, and high across multiple material line items.
 */
export function sumMaterialCosts(
  items: Array<{ totalLow: number; totalTypical: number; totalHigh: number }>
): { low: number; typical: number; high: number } {
  return items.reduce(
    (acc, item) => ({
      low: roundTo(acc.low + item.totalLow, 2),
      typical: roundTo(acc.typical + item.totalTypical, 2),
      high: roundTo(acc.high + item.totalHigh, 2),
    }),
    { low: 0, typical: 0, high: 0 }
  );
}

/**
 * Metric <-> Imperial conversion helpers
 */
export const METERS_TO_FEET = 3.28084;
export const FEET_TO_METERS = 0.3048;
export const SQM_TO_SQFT = 10.7639;
export const SQFT_TO_SQM = 0.092903;
export const CUYD_TO_CUM = 0.764555;
export const GALLON_TO_LITERS = 3.78541;
export const LBS_TO_KG = 0.453592;

export const feetInchesToDecimalFeet = feetInchesToFeet;

export function metersToFeet(meters: number): number {
  return (Number(meters) || 0) * METERS_TO_FEET;
}

export function sqMetersToSqFeet(sqMeters: number): number {
  return (Number(sqMeters) || 0) * SQM_TO_SQFT;
}

