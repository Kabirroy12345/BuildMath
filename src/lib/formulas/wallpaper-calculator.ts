import { ceilUnits, computeCostRange, roundTo, sumMaterialCosts } from './units';
import type { CalculationResult, QuickReferenceRow } from './types';

export interface WallpaperCalculatorInput {
  wallPerimeter: number; // total wall length ft
  wallHeight: number; // ft
  doors: number; // 21 sq ft each
  windows: number; // 15 sq ft each
  usableSingleRollCoverage: number; // default 25 sq ft per single roll
  patternRepeatWastePercent: number; // 0 (random), 10 (small <12"), 20 (large 12-24")
  wastePercent: number; // additional cut waste default 10%
  pricePerDoubleRoll: number; // default $55 per double roll
}

/**
 * Wallpaper Calculator Formula:
 * net area = wall area − openings
 * single rolls = (net area ÷ usable roll coverage) × (1 + pattern-repeat waste + cut waste)
 * double rolls = ceil(single rolls ÷ 2)
 */
export function calculateWallpaper(input: WallpaperCalculatorInput): CalculationResult {
  const grossArea = Math.max(0, input.wallPerimeter) * Math.max(0, input.wallHeight);
  const openings =
    Math.max(0, Math.floor(input.doors)) * 21 + Math.max(0, Math.floor(input.windows)) * 15;
  const netWallArea = Math.max(0, grossArea - openings);

  const singleCoverage = Math.max(10, input.usableSingleRollCoverage || 25);
  const patternWaste = Math.max(0, input.patternRepeatWastePercent || 0) / 100;
  const cutWaste = Math.max(0, input.wastePercent ?? 10) / 100;
  const totalWasteMultiplier = 1 + patternWaste + cutWaste;

  const exactSingleRolls = (netWallArea / singleCoverage) * totalWasteMultiplier;
  const roundedSingleRolls = ceilUnits(exactSingleRolls);
  const exactDoubleRolls = exactSingleRolls / 2;
  const roundedDoubleRolls = ceilUnits(exactDoubleRolls);

  const rollCost = computeCostRange(roundedDoubleRolls, input.pricePerDoubleRoll || 55);
  const primerCost = computeCostRange(ceilUnits(netWallArea / 300), 26);

  const materials = [
    {
      id: 'wallpaper-double-rolls',
      name: 'Wallpaper Double Rolls (50 sq ft usable)',
      quantity: roundedDoubleRolls,
      exactQuantity: roundTo(exactDoubleRolls, 2),
      unit: 'double rolls',
      unitPrice: input.pricePerDoubleRoll || 55,
      totalLow: rollCost.low,
      totalTypical: rollCost.typical,
      totalHigh: rollCost.high,
      productId: 'prod-wallpaper-roll',
      note: `Equals ${roundedSingleRolls} single rolls (${singleCoverage} sq ft usable per single roll)`,
    },
    {
      id: 'wallpaper-primer-paste',
      name: 'Wallpaper Sizing Primer & Smoothing Kit',
      quantity: ceilUnits(netWallArea / 300),
      exactQuantity: roundTo(netWallArea / 300, 2),
      unit: 'gallons',
      unitPrice: 26,
      totalLow: primerCost.low,
      totalTypical: primerCost.typical,
      totalHigh: primerCost.high,
      productId: 'prod-wallpaper-tools',
      note: 'Wall sizing primer seals drywall for clean installation & future removal',
    },
  ];

  return {
    primaryResult: {
      label: 'Double Rolls to Buy',
      value: roundedDoubleRolls,
      exactValue: roundTo(exactDoubleRolls, 2),
      unit: 'double rolls',
      subtitle: `Equivalent to ${roundedSingleRolls} single rolls (${roundTo(exactSingleRolls, 2)} exact)`,
    },
    secondaryResults: [
      {
        label: 'Single Rolls Equivalent',
        value: roundedSingleRolls,
        exactValue: roundTo(exactSingleRolls, 2),
        unit: 'single rolls',
        highlight: true,
      },
      {
        label: 'Net Wall Area',
        value: roundTo(netWallArea, 1),
        unit: 'sq ft',
      },
      {
        label: 'Usable Coverage (Double Roll)',
        value: singleCoverage * 2,
        unit: 'sq ft',
      },
      {
        label: 'Total Waste Factor Applied',
        value: roundTo((patternWaste + cutWaste) * 100, 0),
        unit: '%',
      },
    ],
    materials,
    costEstimate: sumMaterialCosts(materials),
  };
}

export function getWallpaperQuickReference(): QuickReferenceRow[] {
  const walls = [
    { name: 'Accent Wall (12 ft wide × 8 ft high)', p: 12, h: 8, d: 0, w: 0 },
    { name: 'Powder Room (24 ft perimeter × 8 ft high)', p: 24, h: 8, d: 1, w: 0 },
    { name: 'Dining Room (48 ft perimeter × 9 ft high)', p: 48, h: 9, d: 2, w: 2 },
    { name: 'Standard Bedroom (48 ft perimeter × 8 ft high)', p: 48, h: 8, d: 2, w: 2 },
    { name: 'Primary Suite (60 ft perimeter × 9 ft high)', p: 60, h: 9, d: 2, w: 3 },
  ];
  return walls.map((w) => {
    const res = calculateWallpaper({
      wallPerimeter: w.p,
      wallHeight: w.h,
      doors: w.d,
      windows: w.w,
      usableSingleRollCoverage: 25,
      patternRepeatWastePercent: 10,
      wastePercent: 10,
      pricePerDoubleRoll: 55,
    });
    return {
      scenario: w.name,
      col1: `${res.secondaryResults[1].value} sq ft`,
      col2: `${res.secondaryResults[0].value} single rolls`,
      col3: `${res.primaryResult.value} double rolls`,
    };
  });
}
