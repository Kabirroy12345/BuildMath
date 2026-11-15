import { ceilUnits, computeCostRange, roundTo, sumMaterialCosts } from './units';
import type { CalculationResult, QuickReferenceRow } from './types';

export interface SodCalculatorInput {
  lawnLengthFeet: number; // ft
  lawnWidthFeet: number; // ft
  additionalSqFt: number; // extra irregular area sq ft
  rollSqFt: number; // default 10 sq ft per roll (2 ft × 5 ft) or 9 sq ft (1.5 ft × 6 ft)
  sqFtPerPallet: number; // default 450 sq ft per pallet
  wastePercent: number; // default 5%
  pricePerSqFt: number; // default $0.65 per sq ft ($292.50/pallet)
}

/**
 * Sod Calculator Formula:
 * area + 5% waste, pieces (editable piece size), pallets (default 450 sq ft per pallet, editable).
 */
export function calculateSod(input: SodCalculatorInput): CalculationResult {
  const baseArea =
    Math.max(0, input.lawnLengthFeet) * Math.max(0, input.lawnWidthFeet) +
    Math.max(0, input.additionalSqFt || 0);
  const wasteFactor = 1 + Math.max(0, input.wastePercent ?? 5) / 100;
  const totalSqFt = baseArea * wasteFactor;

  const pieceSize = Math.max(1, input.rollSqFt || 10);
  const palletSize = Math.max(100, input.sqFtPerPallet || 450);

  const exactRolls = totalSqFt / pieceSize;
  const roundedRolls = ceilUnits(exactRolls);

  const exactPallets = totalSqFt / palletSize;
  const roundedPallets = ceilUnits(exactPallets);

  const unitPalletPrice = roundTo((input.pricePerSqFt || 0.65) * palletSize, 2);
  const sodCost = computeCostRange(roundTo(totalSqFt, 1), input.pricePerSqFt || 0.65);
  const fertilizerBags = Math.max(1, ceilUnits(totalSqFt / 5000));
  const fertCost = computeCostRange(fertilizerBags, 28);

  const materials = [
    {
      id: 'fresh-turfgrass-sod',
      name: `Fresh Cut Turfgrass Sod (${palletSize} sq ft/pallet)`,
      quantity: roundedRolls,
      exactQuantity: roundTo(exactRolls, 1),
      unit: `rolls (${pieceSize} sq ft)`,
      unitPrice: roundTo((input.pricePerSqFt || 0.65) * pieceSize, 2),
      totalLow: sodCost.low,
      totalTypical: sodCost.typical,
      totalHigh: sodCost.high,
      productId: 'prod-sod-starter',
      note: `Equals ${roundTo(exactPallets, 2)} pallets (${roundedPallets} full pallets @ ~$${unitPalletPrice}/pallet)`,
    },
    {
      id: 'new-lawn-starter-fertilizer',
      name: 'High-Phosphorus New Sod Starter Fertilizer (5,000 sq ft Bag)',
      quantity: fertilizerBags,
      exactQuantity: roundTo(totalSqFt / 5000, 2),
      unit: 'bags',
      unitPrice: 28,
      totalLow: fertCost.low,
      totalTypical: fertCost.typical,
      totalHigh: fertCost.high,
      productId: 'prod-starter-fertilizer',
      note: 'Promotes rapid root establishment during first 14 days',
    },
  ];

  return {
    primaryResult: {
      label: 'Sod Rolls / Pieces Needed',
      value: roundedRolls,
      exactValue: roundTo(exactRolls, 1),
      unit: `rolls (${pieceSize} sq ft)`,
      subtitle: `${roundTo(exactPallets, 2)} pallets (${roundTo(totalSqFt, 0)} sq ft w/ ${input.wastePercent ?? 5}% waste)`,
    },
    secondaryResults: [
      {
        label: `Pallets Needed (${palletSize} sq ft/pallet)`,
        value: roundTo(exactPallets, 2),
        exactValue: exactPallets,
        unit: `pallets (${roundedPallets} full)`,
        highlight: true,
      },
      {
        label: 'Total Sod Area (w/ Waste)',
        value: roundTo(totalSqFt, 0),
        unit: 'sq ft',
      },
      {
        label: 'Net Lawn Footprint',
        value: roundTo(baseArea, 0),
        unit: 'sq ft',
      },
      {
        label: 'Starter Fertilizer Bags',
        value: fertilizerBags,
        unit: 'bags',
      },
    ],
    materials,
    costEstimate: sumMaterialCosts(materials),
  };
}

export function getSodQuickReference(): QuickReferenceRow[] {
  const lawns = [
    { name: 'Small Patch / Side Yard (250 sq ft)', l: 25, w: 10 },
    { name: 'Townhouse Courtyard (500 sq ft)', l: 25, w: 20 },
    { name: 'Front Yard Lawn (1,000 sq ft)', l: 40, w: 25 },
    { name: 'Suburban Backyard (2,500 sq ft)', l: 50, w: 50 },
    { name: 'Quarter-Acre Lawn Area (5,000 sq ft)', l: 100, w: 50 },
  ];
  return lawns.map((lw) => {
    const res = calculateSod({
      lawnLengthFeet: lw.l,
      lawnWidthFeet: lw.w,
      additionalSqFt: 0,
      rollSqFt: 10,
      sqFtPerPallet: 450,
      wastePercent: 5,
      pricePerSqFt: 0.65,
    });
    return {
      scenario: lw.name,
      col1: `${res.secondaryResults[1].value} sq ft`,
      col2: `${res.primaryResult.value} rolls (10 sq ft)`,
      col3: `${res.secondaryResults[0].value}`,
    };
  });
}
