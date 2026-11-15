import { computeCostRange, roundTo, SQFT_TO_SQM } from './units';
import type { CalculationResult, QuickReferenceRow } from './types';

export interface SquareFootageCalculatorInput {
  shape: 'rectangle' | 'triangle' | 'circle' | 'l-shape' | 'trapezoid';
  lengthFeet: number; // ft (or base 1 for trapezoid / triangle base)
  widthFeet: number; // ft (or height for triangle / trapezoid height)
  secondLengthFeet: number; // ft (for L-shape leg 2 length, or trapezoid base 2)
  secondWidthFeet: number; // ft (for L-shape leg 2 width)
  diameterFeet: number; // ft (for circle)
  wastePercent: number; // default 0% (or 10% for material ordering)
  pricePerSqFt: number; // optional unit cost per sq ft (default $3.50)
}

/**
 * Square Footage Calculator Formula:
 * Supports rectangle, triangle, circle, L-shape, trapezoid.
 */
export function calculateSquareFootage(input: SquareFootageCalculatorInput): CalculationResult {
  const L = Math.max(0, input.lengthFeet);
  const W = Math.max(0, input.widthFeet);
  const L2 = Math.max(0, input.secondLengthFeet || 0);
  const W2 = Math.max(0, input.secondWidthFeet || 0);
  const D = Math.max(0, input.diameterFeet || L);

  let netSqFt = 0;
  switch (input.shape) {
    case 'triangle':
      netSqFt = 0.5 * L * W;
      break;
    case 'circle':
      netSqFt = Math.PI * Math.pow(D / 2, 2);
      break;
    case 'l-shape':
      netSqFt = L * W + L2 * W2;
      break;
    case 'trapezoid':
      netSqFt = ((L + L2) / 2) * W;
      break;
    case 'rectangle':
    default:
      netSqFt = L * W;
      break;
  }

  const wasteFactor = 1 + Math.max(0, input.wastePercent ?? 0) / 100;
  const totalSqFt = netSqFt * wasteFactor;
  const sqYards = totalSqFt / 9;
  const sqMeters = totalSqFt * SQFT_TO_SQM;
  const acres = totalSqFt / 43560;

  const cost = computeCostRange(roundTo(totalSqFt, 2), input.pricePerSqFt || 3.5);

  return {
    primaryResult: {
      label: 'Total Square Footage',
      value: roundTo(totalSqFt, 2),
      exactValue: roundTo(netSqFt, 2),
      unit: 'sq ft',
      subtitle: `${roundTo(sqYards, 2)} sq yd · ${roundTo(sqMeters, 2)} sq meters`,
    },
    secondaryResults: [
      {
        label: 'Square Yards (sq ft ÷ 9)',
        value: roundTo(sqYards, 2),
        unit: 'sq yd',
        highlight: true,
      },
      {
        label: 'Square Meters (m²)',
        value: roundTo(sqMeters, 2),
        unit: 'm²',
      },
      {
        label: 'Square Inches',
        value: Math.round(totalSqFt * 144).toLocaleString(),
        unit: 'sq in',
      },
      {
        label: 'Acres (sq ft ÷ 43,560)',
        value: roundTo(acres, 4),
        unit: 'acres',
      },
    ],
    materials: [],
    costEstimate: cost,
  };
}

export function getSquareFootageQuickReference(): QuickReferenceRow[] {
  const dims = [
    { name: '10 × 10 ft Room', l: 10, w: 10 },
    { name: '12 × 12 ft Bedroom', l: 12, w: 12 },
    { name: '12 × 15 ft Room', l: 15, w: 12 },
    { name: '15 × 20 ft Living Room', l: 20, w: 15 },
    { name: '20 × 20 ft Two-Car Garage', l: 20, w: 20 },
    { name: '50 × 100 ft Residential Lot', l: 100, w: 50 },
  ];
  return dims.map((d) => {
    const res = calculateSquareFootage({
      shape: 'rectangle',
      lengthFeet: d.l,
      widthFeet: d.w,
      secondLengthFeet: 0,
      secondWidthFeet: 0,
      diameterFeet: 0,
      wastePercent: 10,
      pricePerSqFt: 3.5,
    });
    return {
      scenario: d.name,
      col1: `${res.primaryResult.exactValue} sq ft (Net)`,
      col2: `${res.primaryResult.value} sq ft (+10% Waste)`,
      col3: `${res.secondaryResults[0].value} sq yd`,
    };
  });
}
