import { ceilUnits, computeCostRange, roundTo, sumMaterialCosts } from './units';
import type { CalculationResult, QuickReferenceRow } from './types';

export interface CarpetCalculatorInput {
  roomLength: number; // ft
  roomWidth: number; // ft
  rollWidthFeet: number; // default 12 ft standard roll width
  wastePercent: number; // default 10%
  pricePerSqYd: number; // default $27 per sq yd ($3.00/sq ft)
  padPricePerSqYd: number; // default $6.50 per sq yd
}

/**
 * Carpet Calculator Formula:
 * area in sq ft and sq yd (÷ 9), 12-ft-roll layout length, padding.
 */
export function calculateCarpet(input: CarpetCalculatorInput): CalculationResult {
  const L = Math.max(0, input.roomLength);
  const W = Math.max(0, input.roomWidth);
  const rollWidth = Math.max(6, input.rollWidthFeet || 12);
  const wasteFactor = 1 + Math.max(0, input.wastePercent ?? 10) / 100;

  const netSqFt = L * W;
  const totalSqFt = netSqFt * wasteFactor;
  const exactSqYd = totalSqFt / 9;
  const roundedSqYd = ceilUnits(exactSqYd);

  // Linear feet needed off a 12-ft (or custom) roll
  const exactRollLinearFt = totalSqFt / rollWidth;
  const roundedRollLinearFt = ceilUnits(exactRollLinearFt);

  // Tack strip perimeter
  const perimeterFt = 2 * (L + W);
  const tackStripPieces = ceilUnits(perimeterFt / 4); // 4-ft strips

  const carpetCost = computeCostRange(roundedSqYd, input.pricePerSqYd || 27);
  const padCost = computeCostRange(roundedSqYd, input.padPricePerSqYd || 6.5);

  const materials = [
    {
      id: 'carpet-roll-sqyd',
      name: `Residential Plush/Berber Carpet (${rollWidth}-ft Roll)`,
      quantity: roundedSqYd,
      exactQuantity: roundTo(exactSqYd, 2),
      unit: 'sq yd',
      unitPrice: input.pricePerSqYd || 27,
      totalLow: carpetCost.low,
      totalTypical: carpetCost.typical,
      totalHigh: carpetCost.high,
      productId: 'prod-carpet-roll',
      note: `${roundTo(totalSqFt, 1)} sq ft (${roundedRollLinearFt} linear ft off a ${rollWidth}-ft roll)`,
    },
    {
      id: 'carpet-padding-sqyd',
      name: '8-lb Rebond Memory Foam Carpet Pad (7/16")',
      quantity: roundedSqYd,
      exactQuantity: roundTo(exactSqYd, 2),
      unit: 'sq yd',
      unitPrice: input.padPricePerSqYd || 6.5,
      totalLow: padCost.low,
      totalTypical: padCost.typical,
      totalHigh: padCost.high,
      productId: 'prod-carpet-pad',
      note: `${tackStripPieces} × 4-ft tack strips recommended for ${roundTo(perimeterFt, 0)} ft perimeter`,
    },
  ];

  return {
    primaryResult: {
      label: 'Total Carpet Needed',
      value: roundedSqYd,
      exactValue: roundTo(exactSqYd, 2),
      unit: 'sq yd',
      subtitle: `${roundTo(totalSqFt, 1)} sq ft (includes ${input.wastePercent ?? 10}% waste)`,
    },
    secondaryResults: [
      {
        label: 'Total Area (w/ Waste)',
        value: roundTo(totalSqFt, 1),
        unit: 'sq ft',
        highlight: true,
      },
      {
        label: `${rollWidth}-ft Roll Length Needed`,
        value: roundedRollLinearFt,
        exactValue: roundTo(exactRollLinearFt, 1),
        unit: 'linear ft',
      },
      {
        label: 'Carpet Padding Needed',
        value: roundedSqYd,
        unit: 'sq yd',
      },
      {
        label: 'Tack Strips (4-ft pieces)',
        value: tackStripPieces,
        unit: 'strips',
      },
    ],
    materials,
    costEstimate: sumMaterialCosts(materials),
  };
}

export function getCarpetQuickReference(): QuickReferenceRow[] {
  const rooms = [
    { name: '10×10 ft Nursery / Office', l: 10, w: 10 },
    { name: '12×12 ft Standard Bedroom', l: 12, w: 12 },
    { name: '12×15 ft Medium Bedroom', l: 15, w: 12 },
    { name: '14×18 ft Primary Bedroom', l: 18, w: 14 },
    { name: '16×20 ft Family / Living Room', l: 20, w: 16 },
    { name: '20×25 ft Basement Rec Room', l: 25, w: 20 },
  ];
  return rooms.map((r) => {
    const res = calculateCarpet({
      roomLength: r.l,
      roomWidth: r.w,
      rollWidthFeet: 12,
      wastePercent: 10,
      pricePerSqYd: 27,
      padPricePerSqYd: 6.5,
    });
    return {
      scenario: r.name,
      col1: `${res.secondaryResults[0].value} sq ft`,
      col2: `${res.primaryResult.value} sq yd`,
      col3: `${res.secondaryResults[1].value} linear ft (12' roll)`,
    };
  });
}
