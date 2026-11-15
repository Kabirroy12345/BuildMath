import { ceilUnits, computeCostRange, roundTo, sumMaterialCosts } from './units';
import type { CalculationResult, QuickReferenceRow } from './types';

export interface ConcreteStepsCalculatorInput {
  stepCount: number; // number of steps (risers)
  riserHeightInches: number; // default 7.5 in
  treadDepthInches: number; // default 11 in
  stairWidthFeet: number; // default 4 ft
  landingDepthFeet: number; // top platform depth in ft (default 3 ft, 0 if none)
  wastePercent: number; // default 10%
  pricePerBag80Lb: number; // default $6.85
}

/**
 * Concrete Steps Calculator Formula:
 * sum of stepped volumes + top landing volume.
 * Step i (1..N) has height (i × riserHeight) and depth treadDepth.
 * Landing has height (N × riserHeight) and depth landingDepthFeet.
 */
export function calculateConcreteSteps(input: ConcreteStepsCalculatorInput): CalculationResult {
  const N = Math.max(1, Math.min(30, Math.floor(input.stepCount || 3)));
  const riseFt = Math.max(1, input.riserHeightInches || 7.5) / 12;
  const runFt = Math.max(1, input.treadDepthInches || 11) / 12;
  const widthFt = Math.max(1, input.stairWidthFeet || 4);
  const landingFt = Math.max(0, input.landingDepthFeet ?? 3);
  const wasteFactor = 1 + Math.max(0, input.wastePercent ?? 10) / 100;

  // Sum of 1 + 2 + ... + N = N * (N + 1) / 2
  const stepsSumFactor = (N * (N + 1)) / 2;
  const stepsVolumeCuFt = widthFt * riseFt * runFt * stepsSumFactor;
  const landingVolumeCuFt = widthFt * (N * riseFt) * landingFt;

  const netCuFt = stepsVolumeCuFt + landingVolumeCuFt;
  const totalCuFt = netCuFt * wasteFactor;
  const totalCuYd = totalCuFt / 27;

  const exactBags80 = totalCuFt / 0.6;
  const roundedBags80 = ceilUnits(exactBags80);

  const bagCost = computeCostRange(roundedBags80, input.pricePerBag80Lb || 6.85);

  const materials = [
    {
      id: 'steps-concrete-80lb',
      name: 'High-Strength Concrete Mix (80-lb Bags)',
      quantity: roundedBags80,
      exactQuantity: roundTo(exactBags80, 2),
      unit: 'bags (80 lb)',
      unitPrice: input.pricePerBag80Lb || 6.85,
      totalLow: bagCost.low,
      totalTypical: bagCost.typical,
      totalHigh: bagCost.high,
      productId: 'prod-concrete-80lb',
      note: `Or order ${roundTo(totalCuYd, 2)} cubic yards of ready-mix concrete`,
    },
  ];

  return {
    primaryResult: {
      label: 'Total Concrete Volume',
      value: roundTo(totalCuYd, 2),
      exactValue: roundTo(netCuFt / 27, 2),
      unit: 'cubic yards',
      subtitle: `${roundedBags80} × 80-lb bags (${roundTo(totalCuFt, 1)} cu ft w/ waste)`,
    },
    secondaryResults: [
      {
        label: '80-lb Concrete Bags Needed',
        value: roundedBags80,
        exactValue: roundTo(exactBags80, 1),
        unit: 'bags',
        highlight: true,
      },
      {
        label: 'Steps Section Volume',
        value: roundTo(stepsVolumeCuFt, 1),
        unit: 'cu ft',
      },
      {
        label: 'Top Landing Volume',
        value: roundTo(landingVolumeCuFt, 1),
        unit: 'cu ft',
      },
      {
        label: 'Total Rise Height',
        value: roundTo(N * (input.riserHeightInches || 7.5), 1),
        unit: 'inches',
      },
    ],
    materials,
    costEstimate: sumMaterialCosts(materials),
  };
}

export function getConcreteStepsQuickReference(): QuickReferenceRow[] {
  const configs = [
    { name: '2 Steps, 4 ft Wide, No Landing', n: 2, w: 4, l: 0 },
    { name: '3 Steps, 4 ft Wide + 3 ft Landing', n: 3, w: 4, l: 3 },
    { name: '4 Steps, 4 ft Wide + 4 ft Landing', n: 4, w: 4, l: 4 },
    { name: '5 Steps, 5 ft Wide + 4 ft Landing', n: 5, w: 5, l: 4 },
    { name: '6 Steps, 6 ft Wide + 4 ft Landing', n: 6, w: 6, l: 4 },
  ];
  return configs.map((c) => {
    const res = calculateConcreteSteps({
      stepCount: c.n,
      riserHeightInches: 7.5,
      treadDepthInches: 11,
      stairWidthFeet: c.w,
      landingDepthFeet: c.l,
      wastePercent: 10,
      pricePerBag80Lb: 6.85,
    });
    return {
      scenario: c.name,
      col1: `${roundTo(Number(res.secondaryResults[1].value) + Number(res.secondaryResults[2].value), 1)} cu ft`,
      col2: `${res.primaryResult.value} cu yd`,
      col3: `${res.secondaryResults[0].value} bags (80-lb)`,
    };
  });
}
