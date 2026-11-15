import { ceilUnits, computeCostRange, roundTo, sumMaterialCosts } from './units';
import type { CalculationResult, QuickReferenceRow } from './types';

export interface RoofingCalculatorInput {
  footprintLengthFeet: number; // ft (including eaves/overhang)
  footprintWidthFeet: number; // ft (including eaves/overhang)
  pitchRise: number; // rise per 12" run (e.g. 4, 6, 8, 12)
  bundlesPerSquare: number; // default 3 bundles per roofing square (100 sq ft)
  ridgeLengthFeet: number; // default = footprintLengthFeet
  wastePercent: number; // 10% gable roof, 15% hip/valley roof
  pricePerBundle: number; // default $42 per bundle ($126/square)
  underlaymentRollSqFt: number; // default 1000 sq ft per synthetic roll
}

/**
 * Roofing Calculator Formula:
 * pitch factor = √(1 + (rise ÷ 12)²)
 * roof area = footprint × pitch factor
 * squares = area ÷ 100
 * bundles = squares × bundlesPerSquare × (1 + waste%)
 */
export function calculateRoofing(input: RoofingCalculatorInput): CalculationResult {
  const L = Math.max(0, input.footprintLengthFeet);
  const W = Math.max(0, input.footprintWidthFeet);
  const rise = Math.max(0, Math.min(24, input.pitchRise ?? 6));
  const bundlesPerSq = Math.max(1, input.bundlesPerSquare || 3);
  const wasteFactor = 1 + Math.max(0, input.wastePercent ?? 10) / 100;

  const footprintArea = L * W;
  const pitchFactor = Math.sqrt(1 + Math.pow(rise / 12, 2));
  const netRoofArea = footprintArea * pitchFactor;
  const totalRoofArea = netRoofArea * wasteFactor;

  const netSquares = netRoofArea / 100;
  const totalSquares = totalRoofArea / 100;

  const exactBundles = totalSquares * bundlesPerSq;
  const roundedBundles = ceilUnits(exactBundles);

  // Underlayment rolls (1000 sq ft synthetic roll w/ 10% overlap)
  const rollCoverage = Math.max(200, input.underlaymentRollSqFt || 1000);
  const underlaymentRolls = ceilUnits(totalRoofArea / rollCoverage);

  // Drip edge (perimeter divided by 10-ft pieces, +10% overlap)
  const rakeSideLength = W * pitchFactor;
  const roofPerimeter = 2 * L + 2 * rakeSideLength;
  const dripEdgePieces = ceilUnits((roofPerimeter * 1.05) / 10);

  // Ridge cap bundles (~30 linear ft per bundle)
  const ridgeLen = Math.max(0, input.ridgeLengthFeet || L);
  const ridgeCapBundles = ceilUnits(ridgeLen / 30);

  // Starter strip bundles (~105 linear ft per bundle along eaves + rakes)
  const starterBundles = ceilUnits((2 * L) / 105);

  // Roofing nails (~320 nails per square at 4 nails/shingle; 7,200 nails per coil box)
  const nailBoxes = Math.max(1, ceilUnits((totalSquares * 320) / 7200));

  const bundleCost = computeCostRange(roundedBundles, input.pricePerBundle || 42);
  const underlayCost = computeCostRange(underlaymentRolls, 95);
  const dripCost = computeCostRange(dripEdgePieces, 8.5);
  const ridgeCost = computeCostRange(ridgeCapBundles + starterBundles, 48);

  const materials = [
    {
      id: 'architectural-shingle-bundles',
      name: 'Architectural Asphalt Roof Shingles (Bundles)',
      quantity: roundedBundles,
      exactQuantity: roundTo(exactBundles, 2),
      unit: 'bundles',
      unitPrice: input.pricePerBundle || 42,
      totalLow: bundleCost.low,
      totalTypical: bundleCost.typical,
      totalHigh: bundleCost.high,
      productId: 'prod-roof-shingles',
      note: `${roundTo(totalSquares, 2)} roofing squares (${bundlesPerSq} bundles/square, includes ${input.wastePercent ?? 10}% waste)`,
    },
    {
      id: 'synthetic-roof-underlayment',
      name: `Synthetic Roof Underlayment (${rollCoverage} sq ft Roll)`,
      quantity: underlaymentRolls,
      exactQuantity: roundTo(totalRoofArea / rollCoverage, 2),
      unit: 'rolls',
      unitPrice: 95,
      totalLow: underlayCost.low,
      totalTypical: underlayCost.typical,
      totalHigh: underlayCost.high,
      productId: 'prod-roof-underlayment',
      note: 'Breathable tear-resistant deck protection',
    },
    {
      id: 'aluminum-drip-edge-10ft',
      name: 'Aluminum Roof Drip Edge Flashing (10-ft Pieces)',
      quantity: dripEdgePieces,
      exactQuantity: roundTo((roofPerimeter * 1.05) / 10, 2),
      unit: 'pieces',
      unitPrice: 8.5,
      totalLow: dripCost.low,
      totalTypical: dripCost.typical,
      totalHigh: dripCost.high,
      productId: 'prod-roof-dripedge',
      note: `Covers ${roundTo(roofPerimeter, 0)} linear ft of eaves and rakes`,
    },
    {
      id: 'ridge-cap-starter-bundles',
      name: 'Hip & Ridge Cap + Starter Strip Bundles',
      quantity: ridgeCapBundles + starterBundles,
      exactQuantity: ridgeCapBundles + starterBundles,
      unit: 'bundles',
      unitPrice: 48,
      totalLow: ridgeCost.low,
      totalTypical: ridgeCost.typical,
      totalHigh: ridgeCost.high,
      productId: 'prod-roof-ridgecap',
      note: `${ridgeCapBundles} ridge cap bundle(s) + ${starterBundles} starter strip bundle(s) + ${nailBoxes} coil nail box(es)`,
    },
  ];

  return {
    primaryResult: {
      label: 'Shingle Bundles Needed',
      value: roundedBundles,
      exactValue: roundTo(exactBundles, 2),
      unit: 'bundles',
      subtitle: `${roundTo(totalSquares, 2)} squares (${roundTo(totalRoofArea, 0)} sq ft w/ ${rise}/12 pitch factor ${roundTo(pitchFactor, 3)})`,
    },
    secondaryResults: [
      {
        label: 'Roofing Squares (w/ Waste)',
        value: roundTo(totalSquares, 2),
        exactValue: roundTo(netSquares, 2),
        unit: 'squares',
        highlight: true,
      },
      {
        label: 'Actual Sloped Roof Area',
        value: roundTo(netRoofArea, 0),
        unit: 'sq ft',
      },
      {
        label: `Pitch Multiplier (${rise}/12)`,
        value: roundTo(pitchFactor, 3),
        unit: '×',
      },
      {
        label: 'Drip Edge (10-ft Pieces)',
        value: dripEdgePieces,
        unit: 'pieces',
      },
      {
        label: 'Underlayment + Ridge/Starter',
        value: `${underlaymentRolls} rolls, ${ridgeCapBundles + starterBundles} bundles`,
        unit: '',
      },
    ],
    materials,
    costEstimate: sumMaterialCosts(materials),
    diagramData: {
      type: 'roof-pitch',
      rise,
      run: 12,
      pitchFactor: roundTo(pitchFactor, 3),
    },
  };
}

export function getRoofingQuickReference(): QuickReferenceRow[] {
  const roofs = [
    { name: '1,000 sq ft Footprint (4/12 Pitch)', l: 40, w: 25, r: 4 },
    { name: '1,500 sq ft Ranch (6/12 Pitch)', l: 50, w: 30, r: 6 },
    { name: '2,000 sq ft Home (6/12 Pitch)', l: 50, w: 40, r: 6 },
    { name: '2,000 sq ft Steep Roof (8/12 Pitch)', l: 50, w: 40, r: 8 },
    { name: '2,500 sq ft Large Roof (6/12 Pitch)', l: 62.5, w: 40, r: 6 },
    { name: '3,000 sq ft Estate Roof (8/12 Pitch)', l: 60, w: 50, r: 8 },
  ];
  return roofs.map((rf) => {
    const res = calculateRoofing({
      footprintLengthFeet: rf.l,
      footprintWidthFeet: rf.w,
      pitchRise: rf.r,
      bundlesPerSquare: 3,
      ridgeLengthFeet: rf.l,
      wastePercent: 10,
      pricePerBundle: 42,
      underlaymentRollSqFt: 1000,
    });
    return {
      scenario: rf.name,
      col1: `${res.secondaryResults[1].value} sq ft`,
      col2: `${res.secondaryResults[0].value} squares`,
      col3: `${res.primaryResult.value} bundles`,
    };
  });
}
