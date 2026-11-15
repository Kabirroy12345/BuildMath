import { ceilUnits, computeCostRange, roundTo, sumMaterialCosts } from './units';
import type { CalculationResult, QuickReferenceRow } from './types';

export interface RebarCalculatorInput {
  slabLengthFeet: number; // ft
  slabWidthFeet: number; // ft
  gridSpacingInches: number; // default 18" OC (or 12" OC)
  edgeClearanceInches: number; // default 3" concrete cover from slab edge
  barLengthFeet: number; // default 20 ft standard rebar sticks
  overlapWastePercent: number; // default 10% for lap splices
  pricePerBar: number; // default $13.50 per 20-ft #4 bar
}

/**
 * Rebar Calculator Formula:
 * grid spacing (default 12" or 18" on center), slab dimensions, minus edge cover
 * → total linear ft and 20-ft bars, + overlap %.
 */
export function calculateRebar(input: RebarCalculatorInput): CalculationResult {
  const L = Math.max(0, input.slabLengthFeet);
  const W = Math.max(0, input.slabWidthFeet);
  const spacingFt = Math.max(4, input.gridSpacingInches || 18) / 12;
  const clearanceFt = Math.max(0, input.edgeClearanceInches ?? 3) / 12;
  const barLen = Math.max(10, input.barLengthFeet || 20);
  const overlapFactor = 1 + Math.max(0, input.overlapWastePercent ?? 10) / 100;

  const netLength = Math.max(0, L - 2 * clearanceFt);
  const netWidth = Math.max(0, W - 2 * clearanceFt);

  // Number of bars running lengthwise (spaced across netWidth)
  const lengthwiseRows = netWidth > 0 ? Math.floor(netWidth / spacingFt) + 1 : 0;
  // Number of bars running widthwise (spaced across netLength)
  const widthwiseRows = netLength > 0 ? Math.floor(netLength / spacingFt) + 1 : 0;

  const netLinearFeet = lengthwiseRows * netLength + widthwiseRows * netWidth;
  const totalLinearFeet = netLinearFeet * overlapFactor;

  const exactBars = totalLinearFeet / barLen;
  const roundedBars = ceilUnits(exactBars);

  const gridIntersections = lengthwiseRows * widthwiseRows;
  const rebarChairs = ceilUnits(gridIntersections / 2); // Support every other intersection

  const barCost = computeCostRange(roundedBars, input.pricePerBar || 13.5);
  const accessoriesCost = computeCostRange(ceilUnits(rebarChairs / 50), 24);

  const materials = [
    {
      id: 'rebar-grade60-bars',
      name: `#4 (1/2") Grade 60 Steel Rebar (${barLen}-ft Bars)`,
      quantity: roundedBars,
      exactQuantity: roundTo(exactBars, 2),
      unit: `bars (${barLen} ft)`,
      unitPrice: input.pricePerBar || 13.5,
      totalLow: barCost.low,
      totalTypical: barCost.typical,
      totalHigh: barCost.high,
      productId: 'prod-rebar-bars',
      note: `${roundTo(totalLinearFeet, 1)} linear ft total (${lengthwiseRows} lengthwise + ${widthwiseRows} widthwise runs)`,
    },
    {
      id: 'rebar-chairs-tie-wire',
      name: 'Rebar Support Chairs & Annealed Tie Wire (50-Pack)',
      quantity: Math.max(1, ceilUnits(rebarChairs / 50)),
      exactQuantity: roundTo(rebarChairs / 50, 2),
      unit: 'packs',
      unitPrice: 24,
      totalLow: accessoriesCost.low,
      totalTypical: accessoriesCost.typical,
      totalHigh: accessoriesCost.high,
      productId: 'prod-rebar-chairs',
      note: `${gridIntersections} tie intersections (${rebarChairs} support chairs recommended)`,
    },
  ];

  return {
    primaryResult: {
      label: `${barLen}-ft Rebar Bars Needed`,
      value: roundedBars,
      exactValue: roundTo(exactBars, 2),
      unit: `bars (${barLen} ft)`,
      subtitle: `${roundTo(totalLinearFeet, 1)} total linear ft (includes ${input.overlapWastePercent ?? 10}% lap splice overlap)`,
    },
    secondaryResults: [
      {
        label: 'Total Rebar Linear Footage',
        value: roundTo(totalLinearFeet, 1),
        unit: 'linear ft',
        highlight: true,
      },
      {
        label: 'Lengthwise & Widthwise Runs',
        value: `${lengthwiseRows} × ${widthwiseRows} bars`,
        unit: '',
      },
      {
        label: 'Tie Wire Intersections',
        value: gridIntersections,
        unit: 'ties',
      },
      {
        label: 'Rebar Support Chairs',
        value: rebarChairs,
        unit: 'chairs',
      },
    ],
    materials,
    costEstimate: sumMaterialCosts(materials),
  };
}

export function getRebarQuickReference(): QuickReferenceRow[] {
  const slabs = [
    { name: '10×10 ft Patio Slab (18" OC grid)', l: 10, w: 10, s: 18 },
    { name: '12×20 ft Driveway Slab (18" OC grid)', l: 20, w: 12, s: 18 },
    { name: '12×20 ft Heavy Driveway (12" OC grid)', l: 20, w: 12, s: 12 },
    { name: '20×20 ft Two-Car Garage (18" OC grid)', l: 20, w: 20, s: 18 },
    { name: '24×30 ft Pole Barn Slab (18" OC grid)', l: 30, w: 24, s: 18 },
  ];
  return slabs.map((s) => {
    const res = calculateRebar({
      slabLengthFeet: s.l,
      slabWidthFeet: s.w,
      gridSpacingInches: s.s,
      edgeClearanceInches: 3,
      barLengthFeet: 20,
      overlapWastePercent: 10,
      pricePerBar: 13.5,
    });
    return {
      scenario: s.name,
      col1: `${res.secondaryResults[0].value} linear ft`,
      col2: `${res.primaryResult.value} bars (20-ft)`,
      col3: `${res.secondaryResults[2].value} tie intersections`,
    };
  });
}
