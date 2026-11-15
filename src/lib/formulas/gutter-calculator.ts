import { ceilUnits, computeCostRange, roundTo, sumMaterialCosts } from './units';
import type { CalculationResult, QuickReferenceRow } from './types';

export interface GutterCalculatorInput {
  eaveLengthFeet: number; // total linear ft of roof eaves receiving gutters
  gutterRunCount: number; // number of separate straight eave sections (for end caps)
  storyHeightFeet: number; // height from eave to ground for downspouts (e.g. 10 ft 1-story, 20 ft 2-story)
  feetPerDownspout: number; // default 35 ft (range 30-40 ft per downspout)
  hangerSpacingInches: number; // default 24 in on center
  wastePercent: number; // default 10%
  pricePerTenFootGutter: number; // default $18.50 per 10-ft K-style section
}

/**
 * Gutter Calculator Formula:
 * linear ft of eaves, downspouts (1 per 30–40 ft default),
 * hangers every 24" default, end caps, elbows.
 */
export function calculateGutter(input: GutterCalculatorInput): CalculationResult {
  const eaveFt = Math.max(0, input.eaveLengthFeet);
  const runs = Math.max(1, Math.floor(input.gutterRunCount || 2));
  const storyFt = Math.max(8, input.storyHeightFeet || 10);
  const dsSpacing = Math.max(15, input.feetPerDownspout || 35);
  const hangerIn = Math.max(12, input.hangerSpacingInches || 24);
  const wasteFactor = 1 + Math.max(0, input.wastePercent ?? 10) / 100;

  const totalGutterFeet = eaveFt * wasteFactor;
  const tenFootSections = ceilUnits(totalGutterFeet / 10);

  // Downspouts: at least 1 per run or 1 per 35 ft
  const downspouts = Math.max(runs, ceilUnits(eaveFt / dsSpacing));
  const downspoutTenFootPipes = ceilUnits((downspouts * storyFt) / 10);

  // Hangers every 24" (2 ft)
  const hangers = ceilUnits((eaveFt * 12) / hangerIn) + runs;

  // End caps: 2 per separate gutter run
  const endCaps = runs * 2;

  // Elbows: 3 per downspout (2 at soffit offset + 1 at bottom kickout)
  const elbows = downspouts * 3;

  const gutterCost = computeCostRange(tenFootSections, input.pricePerTenFootGutter || 18.5);
  const dsCost = computeCostRange(downspoutTenFootPipes, 16);
  const hardwareCost = computeCostRange(hangers, 2.25);
  const fittingsCost = computeCostRange(elbows + endCaps + downspouts, 5.5);

  const materials = [
    {
      id: 'k-style-gutter-10ft',
      name: '5" K-Style Aluminum Gutter Sections (10-ft)',
      quantity: tenFootSections,
      exactQuantity: roundTo(totalGutterFeet / 10, 2),
      unit: 'sections (10 ft)',
      unitPrice: input.pricePerTenFootGutter || 18.5,
      totalLow: gutterCost.low,
      totalTypical: gutterCost.typical,
      totalHigh: gutterCost.high,
      productId: 'prod-gutter-sections',
      note: `${roundTo(totalGutterFeet, 1)} linear ft total (includes ${input.wastePercent ?? 10}% overlap waste)`,
    },
    {
      id: 'aluminum-downspouts-10ft',
      name: '2"×3" Aluminum Downspout Pipes (10-ft)',
      quantity: downspoutTenFootPipes,
      exactQuantity: roundTo((downspouts * storyFt) / 10, 2),
      unit: 'pipes (10 ft)',
      unitPrice: 16,
      totalLow: dsCost.low,
      totalTypical: dsCost.typical,
      totalHigh: dsCost.high,
      productId: 'prod-gutter-downspout',
      note: `For ${downspouts} downspout drop locations (${storyFt} ft height each)`,
    },
    {
      id: 'hidden-gutter-hangers',
      name: `Hidden Screw-In Gutter Hangers (${hangerIn}" OC)`,
      quantity: hangers,
      exactQuantity: hangers,
      unit: 'hangers',
      unitPrice: 2.25,
      totalLow: hardwareCost.low,
      totalTypical: hardwareCost.typical,
      totalHigh: hardwareCost.high,
      productId: 'prod-gutter-hangers',
      note: `Spaced every ${hangerIn}" along fascia board`,
    },
    {
      id: 'gutter-elbows-endcaps-outlets',
      name: 'Elbows, End Caps, Drop Outlets & Seam Sealant',
      quantity: elbows + endCaps + downspouts,
      exactQuantity: elbows + endCaps + downspouts,
      unit: 'fittings',
      unitPrice: 5.5,
      totalLow: fittingsCost.low,
      totalTypical: fittingsCost.typical,
      totalHigh: fittingsCost.high,
      productId: 'prod-gutter-fittings',
      note: `${elbows} elbows, ${endCaps} end caps, and ${downspouts} drop outlets`,
    },
  ];

  return {
    primaryResult: {
      label: '10-ft Gutter Sections Needed',
      value: tenFootSections,
      exactValue: roundTo(totalGutterFeet / 10, 2),
      unit: 'sections (10 ft)',
      subtitle: `${roundTo(totalGutterFeet, 1)} linear ft + ${downspouts} downspouts & ${hangers} hangers`,
    },
    secondaryResults: [
      {
        label: 'Downspout Locations Needed',
        value: downspouts,
        unit: 'downspouts',
        highlight: true,
      },
      {
        label: '10-ft Downspout Pipes',
        value: downspoutTenFootPipes,
        unit: 'pipes',
      },
      {
        label: `Hidden Hangers (${hangerIn}" OC)`,
        value: hangers,
        unit: 'hangers',
      },
      {
        label: 'Elbows & End Caps',
        value: `${elbows} elbows, ${endCaps} end caps`,
        unit: '',
      },
    ],
    materials,
    costEstimate: sumMaterialCosts(materials),
  };
}

export function getGutterQuickReference(): QuickReferenceRow[] {
  const eaves = [
    { name: 'Detached Garage (48 ft eaves, 2 runs, 1-story)', e: 48, r: 2, h: 10 },
    { name: 'Small Ranch Home (90 ft eaves, 2 runs, 1-story)', e: 90, r: 2, h: 10 },
    { name: 'Mid-Size Home (130 ft eaves, 3 runs, 1-story)', e: 130, r: 3, h: 10 },
    { name: 'Two-Story Colonial (150 ft eaves, 4 runs, 2-story)', e: 150, r: 4, h: 20 },
    { name: 'Large Hip-Roof Home (200 ft eaves, 4 runs, 2-story)', e: 200, r: 4, h: 20 },
  ];
  return eaves.map((ev) => {
    const res = calculateGutter({
      eaveLengthFeet: ev.e,
      gutterRunCount: ev.r,
      storyHeightFeet: ev.h,
      feetPerDownspout: 35,
      hangerSpacingInches: 24,
      wastePercent: 10,
      pricePerTenFootGutter: 18.5,
    });
    return {
      scenario: ev.name,
      col1: `${res.primaryResult.value} × 10-ft gutters`,
      col2: `${res.secondaryResults[0].value} downspouts`,
      col3: `${res.secondaryResults[2].value} hangers`,
    };
  });
}
