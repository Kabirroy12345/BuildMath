import { ceilUnits, computeCostRange, roundTo, sumMaterialCosts } from './units';
import type { CalculationResult, QuickReferenceRow } from './types';

export interface GrassSeedCalculatorInput {
  lawnLengthFeet: number; // ft
  lawnWidthFeet: number; // ft
  seedRatePer1000SqFt: number; // lbs per 1,000 sq ft (default 8 lbs new Tall Fescue; 4 lbs overseeding)
  bagSizeLbs: number; // default 20 lb bag (or 7 lb, 40 lb)
  wastePercent: number; // default 5%
  pricePerLb: number; // default $3.80/lb
}

/**
 * Grass Seed Calculator Formula:
 * lbs = (area ÷ 1,000) × rate × (1 + waste%)
 */
export function calculateGrassSeed(input: GrassSeedCalculatorInput): CalculationResult {
  const areaSqFt = Math.max(0, input.lawnLengthFeet) * Math.max(0, input.lawnWidthFeet);
  const rate = Math.max(0.5, input.seedRatePer1000SqFt || 8);
  const bagSize = Math.max(1, input.bagSizeLbs || 20);
  const wasteFactor = 1 + Math.max(0, input.wastePercent ?? 5) / 100;

  const netLbs = (areaSqFt / 1000) * rate;
  const exactLbs = netLbs * wasteFactor;
  const roundedLbs = ceilUnits(exactLbs);

  const exactBags = exactLbs / bagSize;
  const roundedBags = ceilUnits(exactBags);

  const starterFertBags = Math.max(1, ceilUnits(areaSqFt / 5000));
  const strawBales = ceilUnits(areaSqFt / 500); // 1 bale per 500 sq ft new lawn

  const seedCost = computeCostRange(roundedLbs, input.pricePerLb || 3.8);
  const fertCost = computeCostRange(starterFertBags, 28);

  const materials = [
    {
      id: 'turf-grass-seed',
      name: `Certified Turfgrass Seed Blend (${bagSize}-lb Bags)`,
      quantity: roundedBags,
      exactQuantity: roundTo(exactBags, 2),
      unit: `bags (${bagSize} lb)`,
      unitPrice: roundTo((input.pricePerLb || 3.8) * bagSize, 2),
      totalLow: seedCost.low,
      totalTypical: seedCost.typical,
      totalHigh: seedCost.high,
      productId: 'prod-grass-seed',
      note: `${roundedLbs} lbs total at ${rate} lbs per 1,000 sq ft`,
    },
    {
      id: 'seed-starter-fertilizer',
      name: 'Lawn Starter Fertilizer (5,000 sq ft Coverage)',
      quantity: starterFertBags,
      exactQuantity: roundTo(areaSqFt / 5000, 2),
      unit: 'bags',
      unitPrice: 28,
      totalLow: fertCost.low,
      totalTypical: fertCost.typical,
      totalHigh: fertCost.high,
      productId: 'prod-starter-fertilizer',
      note: `Optional: ${strawBales} bales of tackified seeding straw for moisture retention`,
    },
  ];

  return {
    primaryResult: {
      label: 'Grass Seed Needed',
      value: roundedLbs,
      exactValue: roundTo(exactLbs, 2),
      unit: 'lbs',
      subtitle: `${roundedBags} × ${bagSize}-lb bag(s) for ${roundTo(areaSqFt, 0)} sq ft (@ ${rate} lbs/1,000 sq ft)`,
    },
    secondaryResults: [
      {
        label: `Seed Bags (${bagSize}-lb)`,
        value: roundedBags,
        exactValue: roundTo(exactBags, 2),
        unit: 'bags',
        highlight: true,
      },
      {
        label: 'Total Lawn Area',
        value: roundTo(areaSqFt, 0),
        unit: 'sq ft',
      },
      {
        label: 'Overseeding Rate (50% Rate)',
        value: roundTo(exactLbs * 0.5, 1),
        unit: 'lbs',
      },
      {
        label: 'Seeding Straw Mulch Bales',
        value: strawBales,
        unit: 'bales',
      },
    ],
    materials,
    costEstimate: sumMaterialCosts(materials),
  };
}

export function getGrassSeedQuickReference(): QuickReferenceRow[] {
  const types = [
    { name: 'Tall Fescue (5,000 sq ft Lawn)', newRate: 8, overRate: 4 },
    { name: 'Kentucky Bluegrass (5,000 sq ft Lawn)', newRate: 3, overRate: 1.5 },
    { name: 'Perennial Ryegrass (5,000 sq ft Lawn)', newRate: 7, overRate: 3.5 },
    { name: 'Fine Fescue Shade Mix (5,000 sq ft Lawn)', newRate: 5, overRate: 2.5 },
    { name: 'Bermuda Grass (5,000 sq ft Lawn)', newRate: 2, overRate: 1 },
    { name: 'Zoysia / Centipede (5,000 sq ft Lawn)', newRate: 2, overRate: 1 },
  ];
  return types.map((t) => {
    const newRes = calculateGrassSeed({
      lawnLengthFeet: 100,
      lawnWidthFeet: 50,
      seedRatePer1000SqFt: t.newRate,
      bagSizeLbs: 20,
      wastePercent: 5,
      pricePerLb: 3.8,
    });
    const overRes = calculateGrassSeed({
      lawnLengthFeet: 100,
      lawnWidthFeet: 50,
      seedRatePer1000SqFt: t.overRate,
      bagSizeLbs: 20,
      wastePercent: 5,
      pricePerLb: 3.8,
    });
    return {
      scenario: t.name,
      col1: `${t.newRate} lbs / ${t.overRate} lbs per 1k sq ft`,
      col2: `${newRes.primaryResult.value} lbs (New Lawn)`,
      col3: `${overRes.primaryResult.value} lbs (Overseed)`,
    };
  });
}
