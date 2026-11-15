import { roundTo } from './units';

export interface StateCostInput {
  nationalLowPerUnit: number;
  nationalTypicalPerUnit: number;
  nationalHighPerUnit: number;
  typicalProjectSize: number;
  laborShare: number; // e.g. 0.60 for 60% labor
  stateTradeWage: number; // BLS OEWS median hourly wage for trade in state
  nationalTradeWage: number; // BLS OEWS national median hourly wage for trade
  stateRpp: number; // BEA Regional Price Parity index (100 = national avg)
}

export interface StateCostResult {
  multiplier: number;
  laborMultiplier: number;
  materialMultiplier: number;
  percentDiffFromNational: number;
  perUnit: {
    low: number;
    typical: number;
    high: number;
  };
  totalProject: {
    low: number;
    typical: number;
    high: number;
    laborShareDollars: number;
    materialsShareDollars: number;
  };
  nationalTotalTypical: number;
}

export interface JobCostData {
  slug: string;
  name: string;
  unit: string;
  unitPlural: string;
  nationalLowPerUnit: number;
  nationalTypicalPerUnit: number;
  nationalHighPerUnit: number;
  typicalProjectSize: number;
  laborShare: number;
  socCode: string;
  tradeName: string;
  nationalTradeWage: number;
  materialsBreakdown: { item: string; sharePercent: number }[];
  costFactors: string[];
  relatedCalculatorSlug: string;
  diySavingsNote: string;
  bestSeason: string;
  sources: string[];
  verified: boolean;
  lastReviewed: string;
}

export interface StateCostData {
  slug: string;
  name: string;
  abbr: string;
  rpp: number;
  wages: Record<string, number>;
  climateZone: string;
  climateConsiderations: string;
  licensingBoardName: string;
  licensingBoardUrl: string;
  permitNote: string;
  neighbors: string[];
}

/**
 * Computes state-adjusted project and unit costs using the official BuildMath methodology:
 * state cost = national cost × [labor share × (state trade wage ÷ national trade wage) + (1 − labor share) × (state RPP ÷ 100)]
 */
export function calculateStateCost(input: StateCostInput): StateCostResult {
  const laborShare = Math.min(1, Math.max(0, input.laborShare));
  const materialShare = 1 - laborShare;

  const laborMultiplier =
    input.nationalTradeWage > 0 ? input.stateTradeWage / input.nationalTradeWage : 1;
  const materialMultiplier = input.stateRpp > 0 ? input.stateRpp / 100 : 1;

  const multiplier = laborShare * laborMultiplier + materialShare * materialMultiplier;
  const percentDiffFromNational = roundTo((multiplier - 1) * 100, 1);

  const perUnitLow = roundTo(input.nationalLowPerUnit * multiplier, 2);
  const perUnitTypical = roundTo(input.nationalTypicalPerUnit * multiplier, 2);
  const perUnitHigh = roundTo(input.nationalHighPerUnit * multiplier, 2);

  const size = Math.max(1, input.typicalProjectSize);
  const totalLow = Math.round(perUnitLow * size);
  const totalTypical = Math.round(perUnitTypical * size);
  const totalHigh = Math.round(perUnitHigh * size);
  const nationalTotalTypical = Math.round(input.nationalTypicalPerUnit * size);

  const rawLaborWeighted = laborShare * laborMultiplier;
  const effectiveLaborShare = multiplier > 0 ? rawLaborWeighted / multiplier : laborShare;
  const laborShareDollars = Math.round(totalTypical * effectiveLaborShare);
  const materialsShareDollars = totalTypical - laborShareDollars;

  return {
    multiplier: roundTo(multiplier, 4),
    laborMultiplier: roundTo(laborMultiplier, 4),
    materialMultiplier: roundTo(materialMultiplier, 4),
    percentDiffFromNational,
    perUnit: {
      low: perUnitLow,
      typical: perUnitTypical,
      high: perUnitHigh,
    },
    totalProject: {
      low: totalLow,
      typical: totalTypical,
      high: totalHigh,
      laborShareDollars,
      materialsShareDollars,
    },
    nationalTotalTypical,
  };
}

/**
 * High-level helper that computes state cost directly from JobCostData and StateCostData objects.
 */
export function calculateStateJobCost(
  job: JobCostData,
  state: StateCostData,
  customSize?: number
) {
  const size = customSize !== undefined && customSize > 0 ? customSize : job.typicalProjectSize;
  const stateTradeWage = state.wages?.[job.socCode] || job.nationalTradeWage;
  const res = calculateStateCost({
    nationalLowPerUnit: job.nationalLowPerUnit,
    nationalTypicalPerUnit: job.nationalTypicalPerUnit,
    nationalHighPerUnit: job.nationalHighPerUnit,
    typicalProjectSize: size,
    laborShare: job.laborShare,
    stateTradeWage,
    nationalTradeWage: job.nationalTradeWage,
    stateRpp: state.rpp || 100,
  });

  return {
    low: res.totalProject.low,
    typical: res.totalProject.typical,
    high: res.totalProject.high,
    lowPerUnit: res.perUnit.low,
    typicalPerUnit: res.perUnit.typical,
    highPerUnit: res.perUnit.high,
    laborCost: res.totalProject.laborShareDollars,
    materialCost: res.totalProject.materialsShareDollars,
    compositeMultiplier: res.multiplier,
    laborMultiplier: res.laborMultiplier,
    materialMultiplier: res.materialMultiplier,
    percentDiffVsNational: res.percentDiffFromNational,
    nationalTotalTypical: res.nationalTotalTypical,
    stateTradeWage,
  };
}
