import { ceilUnits, computeCostRange, roundTo, sumMaterialCosts } from './units';
import type { CalculationResult, QuickReferenceRow } from './types';

export interface BrickCalculatorInput {
  wallLengthFeet: number; // ft
  wallHeightFeet: number; // ft
  openingsSqFt: number; // doors/windows sq ft deduction
  bricksPerSqFt: number; // default 6.75 (standard modular brick with 3/8" mortar joint)
  bricksPerMortarBag: number; // default 35 bricks per 80-lb Type N mortar bag
  wastePercent: number; // default 5%
  pricePerBrick: number; // default $0.85
  pricePerMortarBag: number; // default $11.50
}

/**
 * Brick Calculator Formula:
 * net area = wall area − openings
 * bricks = net area × bricksPerSqFt (default 6.75 modular brick w/ 3/8" mortar) × (1 + waste%)
 * mortar bags = ceil(bricks ÷ bricksPerMortarBag)
 */
export function calculateBrick(input: BrickCalculatorInput): CalculationResult {
  const grossArea = Math.max(0, input.wallLengthFeet) * Math.max(0, input.wallHeightFeet);
  const netArea = Math.max(0, grossArea - Math.max(0, input.openingsSqFt || 0));
  const rate = Math.max(1, input.bricksPerSqFt || 6.75);
  const wasteFactor = 1 + Math.max(0, input.wastePercent ?? 5) / 100;

  const exactBricks = netArea * rate * wasteFactor;
  const roundedBricks = ceilUnits(exactBricks);

  const mortarRate = Math.max(10, input.bricksPerMortarBag || 35);
  const exactMortarBags = roundedBricks / mortarRate;
  const roundedMortarBags = ceilUnits(exactMortarBags);

  // Wall ties (1 per 2.67 sq ft per IRC code for veneer)
  const wallTies = ceilUnits(netArea / 2.67);

  const brickCost = computeCostRange(roundedBricks, input.pricePerBrick || 0.85);
  const mortarCost = computeCostRange(roundedMortarBags, input.pricePerMortarBag || 11.5);

  const materials = [
    {
      id: 'modular-clay-bricks',
      name: 'Standard Modular Clay Bricks (3-5/8" × 2-1/4" × 7-5/8")',
      quantity: roundedBricks,
      exactQuantity: roundTo(exactBricks, 1),
      unit: 'bricks',
      unitPrice: input.pricePerBrick || 0.85,
      totalLow: brickCost.low,
      totalTypical: brickCost.typical,
      totalHigh: brickCost.high,
      productId: 'prod-masonry-brick',
      note: `${rate} bricks/sq ft with 3/8" mortar joint (+${input.wastePercent ?? 5}% breakage waste)`,
    },
    {
      id: 'type-n-mortar-mix',
      name: 'Type N Pre-Blended Masonry Mortar Mix (80-lb Bag)',
      quantity: roundedMortarBags,
      exactQuantity: roundTo(exactMortarBags, 2),
      unit: 'bags',
      unitPrice: input.pricePerMortarBag || 11.5,
      totalLow: mortarCost.low,
      totalTypical: mortarCost.typical,
      totalHigh: mortarCost.high,
      productId: 'prod-mortar-mix',
      note: `1 bag lays ~${mortarRate} modular bricks`,
    },
  ];

  return {
    primaryResult: {
      label: 'Total Bricks Needed',
      value: roundedBricks,
      exactValue: roundTo(exactBricks, 1),
      unit: 'bricks',
      subtitle: `Plus ${roundedMortarBags} bags of 80-lb mortar for ${roundTo(netArea, 1)} sq ft`,
    },
    secondaryResults: [
      {
        label: 'Mortar Mix (80-lb Bags)',
        value: roundedMortarBags,
        exactValue: roundTo(exactMortarBags, 2),
        unit: 'bags',
        highlight: true,
      },
      {
        label: 'Net Brick Wall Area',
        value: roundTo(netArea, 1),
        unit: 'sq ft',
      },
      {
        label: 'Corrugated Wall Ties (IRC Code)',
        value: wallTies,
        unit: 'ties',
      },
      {
        label: 'Pallets (approx. 500 bricks/pallet)',
        value: roundTo(roundedBricks / 500, 2),
        unit: 'pallets',
      },
    ],
    materials,
    costEstimate: sumMaterialCosts(materials),
  };
}

export function getBrickQuickReference(): QuickReferenceRow[] {
  const walls = [
    { name: 'Mailbox / Pillar Column (30 sq ft)', l: 10, h: 3 },
    { name: 'Garden Knee Wall (20 ft × 3 ft = 60 sq ft)', l: 20, h: 3 },
    { name: 'Outdoor Kitchen Surround (100 sq ft)', l: 25, h: 4 },
    { name: 'Front Porch Skirt / Accent Wall (200 sq ft)', l: 25, h: 8 },
    { name: 'Full Home Wall Side (40 ft × 10 ft = 400 sq ft)', l: 40, h: 10 },
  ];
  return walls.map((w) => {
    const res = calculateBrick({
      wallLengthFeet: w.l,
      wallHeightFeet: w.h,
      openingsSqFt: 0,
      bricksPerSqFt: 6.75,
      bricksPerMortarBag: 35,
      wastePercent: 5,
      pricePerBrick: 0.85,
      pricePerMortarBag: 11.5,
    });
    return {
      scenario: w.name,
      col1: `${w.l * w.h} sq ft`,
      col2: `${res.primaryResult.value} bricks`,
      col3: `${res.secondaryResults[0].value} bags mortar`,
    };
  });
}
