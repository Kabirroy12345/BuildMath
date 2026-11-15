import { ceilUnits, computeCostRange, CUYD_TO_CUM, roundTo } from './units';
import type { CalculationResult, QuickReferenceRow } from './types';

export interface CubicYardCalculatorInput {
  shape: 'rectangle' | 'triangle' | 'circle' | 'trapezoid';
  lengthFeet: number; // ft
  widthFeet: number; // ft
  secondLengthFeet: number; // ft (for trapezoid base 2)
  diameterFeet: number; // ft (for circle)
  depthInches: number; // depth in inches
  densityTonsPerCuYd: number; // default 1.4 tons/cu yd (gravel/soil weight conversion)
  wastePercent: number; // default 5%
  pricePerCuYd: number; // default $45/cu yd
}

/**
 * Cubic Yard Calculator Formula:
 * cu ft = area(sq ft) × (depth(in) ÷ 12)
 * cu yd = cu ft ÷ 27
 */
export function calculateCubicYard(input: CubicYardCalculatorInput): CalculationResult {
  const L = Math.max(0, input.lengthFeet);
  const W = Math.max(0, input.widthFeet);
  const L2 = Math.max(0, input.secondLengthFeet || 0);
  const D = Math.max(0, input.diameterFeet || L);
  const depthFt = Math.max(0.1, input.depthInches || 4) / 12;

  let areaSqFt = 0;
  switch (input.shape) {
    case 'triangle':
      areaSqFt = 0.5 * L * W;
      break;
    case 'circle':
      areaSqFt = Math.PI * Math.pow(D / 2, 2);
      break;
    case 'trapezoid':
      areaSqFt = ((L + L2) / 2) * W;
      break;
    case 'rectangle':
    default:
      areaSqFt = L * W;
      break;
  }

  const wasteFactor = 1 + Math.max(0, input.wastePercent ?? 5) / 100;
  const netCuFt = areaSqFt * depthFt;
  const totalCuFt = netCuFt * wasteFactor;
  const netCuYd = netCuFt / 27;
  const totalCuYd = totalCuFt / 27;
  const cubicMeters = totalCuYd * CUYD_TO_CUM;
  const estimatedTons = totalCuYd * Math.max(0.5, input.densityTonsPerCuYd || 1.4);

  const cost = computeCostRange(roundTo(totalCuYd, 2), input.pricePerCuYd || 45);

  return {
    primaryResult: {
      label: 'Volume in Cubic Yards',
      value: roundTo(totalCuYd, 2),
      exactValue: roundTo(netCuYd, 2),
      unit: 'cubic yards',
      subtitle: `${roundTo(totalCuFt, 1)} cubic feet · ~${roundTo(estimatedTons, 2)} tons`,
    },
    secondaryResults: [
      {
        label: 'Volume in Cubic Feet',
        value: roundTo(totalCuFt, 1),
        exactValue: roundTo(netCuFt, 1),
        unit: 'cu ft',
        highlight: true,
      },
      {
        label: 'Estimated Weight (Tons)',
        value: roundTo(estimatedTons, 2),
        unit: 'tons',
      },
      {
        label: 'Volume in Cubic Meters',
        value: roundTo(cubicMeters, 2),
        unit: 'm³',
      },
      {
        label: '2 cu ft Bags Equivalent',
        value: ceilUnits(totalCuFt / 2),
        unit: 'bags',
      },
    ],
    materials: [],
    costEstimate: cost,
  };
}

export function getCubicYardQuickReference(): QuickReferenceRow[] {
  const cases = [
    { name: '100 sq ft Area @ 2" Deep', l: 10, w: 10, d: 2 },
    { name: '100 sq ft Area @ 3" Deep', l: 10, w: 10, d: 3 },
    { name: '100 sq ft Area @ 4" Deep', l: 10, w: 10, d: 4 },
    { name: '250 sq ft Area @ 4" Deep', l: 25, w: 10, d: 4 },
    { name: '500 sq ft Area @ 4" Deep', l: 25, w: 20, d: 4 },
    { name: '1,000 sq ft Area @ 6" Deep', l: 50, w: 20, d: 6 },
  ];
  return cases.map((c) => {
    const res = calculateCubicYard({
      shape: 'rectangle',
      lengthFeet: c.l,
      widthFeet: c.w,
      secondLengthFeet: 0,
      diameterFeet: 0,
      depthInches: c.d,
      densityTonsPerCuYd: 1.4,
      wastePercent: 0,
      pricePerCuYd: 45,
    });
    return {
      scenario: c.name,
      col1: `${res.secondaryResults[0].value} cu ft`,
      col2: `${res.primaryResult.value} cu yd`,
      col3: `${res.secondaryResults[1].value} tons (@ 1.4 t/yd³)`,
    };
  });
}
