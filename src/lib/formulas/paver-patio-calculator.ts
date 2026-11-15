import { ceilUnits, computeCostRange, roundTo, sumMaterialCosts } from './units';
import type { CalculationResult, QuickReferenceRow } from './types';

export interface PaverPatioCalculatorInput {
  patioLengthFeet: number; // ft
  patioWidthFeet: number; // ft
  paverLengthInches: number; // default 8 in (4x8 brick paver)
  paverWidthInches: number; // default 4 in
  gravelBaseDepthInches: number; // default 4 in (4-6" standard)
  sandDepthInches: number; // default 1 in bedding sand
  wastePercent: number; // default 10%
  pricePerPaver: number; // default $0.95
  gravelPricePerTon: number; // default $48/ton
  sandPricePerTon: number; // default $52/ton
}

/**
 * Paver Patio Calculator Formula:
 * pavers = area ÷ paver face area × (1 + 5–10% waste).
 * Base gravel at 4–6" depth and bedding sand at 1", both in cu yd and tons.
 */
export function calculatePaverPatio(input: PaverPatioCalculatorInput): CalculationResult {
  const areaSqFt = Math.max(0, input.patioLengthFeet) * Math.max(0, input.patioWidthFeet);
  const paverL = Math.max(1, input.paverLengthInches || 8);
  const paverW = Math.max(1, input.paverWidthInches || 4);
  const paverSqFt = (paverL * paverW) / 144;
  const wasteFactor = 1 + Math.max(0, input.wastePercent ?? 10) / 100;

  const exactPavers = (areaSqFt / paverSqFt) * wasteFactor;
  const roundedPavers = ceilUnits(exactPavers);

  const gravelDepthIn = Math.max(1, input.gravelBaseDepthInches || 4);
  const sandDepthIn = Math.max(0.5, input.sandDepthInches || 1);

  const gravelCuYd = (areaSqFt * (gravelDepthIn / 12)) / 27;
  const gravelTons = gravelCuYd * 1.4; // 1.4 tons/cu yd compacted crushed stone

  const sandCuYd = (areaSqFt * (sandDepthIn / 12)) / 27;
  const sandTons = sandCuYd * 1.35; // 1.35 tons/cu yd concrete bedding sand

  const polymericSandBags = ceilUnits(areaSqFt / 65); // 50-lb bag covers ~65 sq ft

  const paverCost = computeCostRange(roundedPavers, input.pricePerPaver || 0.95);
  const gravelCost = computeCostRange(roundTo(gravelTons, 2), input.gravelPricePerTon || 48);
  const sandCost = computeCostRange(roundTo(sandTons, 2), input.sandPricePerTon || 52);
  const polyCost = computeCostRange(polymericSandBags, 32);

  const materials = [
    {
      id: 'concrete-patio-pavers',
      name: `Concrete Patio Pavers (${paverW}" × ${paverL}")`,
      quantity: roundedPavers,
      exactQuantity: roundTo(exactPavers, 1),
      unit: 'pavers',
      unitPrice: input.pricePerPaver || 0.95,
      totalLow: paverCost.low,
      totalTypical: paverCost.typical,
      totalHigh: paverCost.high,
      productId: 'prod-patio-pavers',
      note: `${roundTo(1 / paverSqFt, 2)} pavers per sq ft (+${input.wastePercent ?? 10}% cut waste)`,
    },
    {
      id: 'crushed-stone-paver-base',
      name: `Crushed Stone Paver Base (${gravelDepthIn}" Depth)`,
      quantity: roundTo(gravelTons, 2),
      exactQuantity: roundTo(gravelTons, 2),
      unit: 'tons',
      unitPrice: input.gravelPricePerTon || 48,
      totalLow: gravelCost.low,
      totalTypical: gravelCost.typical,
      totalHigh: gravelCost.high,
      productId: 'prod-paver-base',
      note: `Equals ${roundTo(gravelCuYd, 2)} cubic yards of #411 / QP crushed aggregate`,
    },
    {
      id: 'coarse-bedding-sand',
      name: `Coarse C-33 Levelling Sand (${sandDepthIn}" Depth)`,
      quantity: roundTo(sandTons, 2),
      exactQuantity: roundTo(sandTons, 2),
      unit: 'tons',
      unitPrice: input.sandPricePerTon || 52,
      totalLow: sandCost.low,
      totalTypical: sandCost.typical,
      totalHigh: sandCost.high,
      productId: 'prod-paver-sand',
      note: `Equals ${roundTo(sandCuYd, 2)} cubic yards`,
    },
    {
      id: 'polymeric-joint-sand',
      name: 'Polymeric Locking Joint Sand (50-lb Bag)',
      quantity: polymericSandBags,
      exactQuantity: roundTo(areaSqFt / 65, 2),
      unit: 'bags',
      unitPrice: 32,
      totalLow: polyCost.low,
      totalTypical: polyCost.typical,
      totalHigh: polyCost.high,
      productId: 'prod-polymeric-sand',
      note: 'Locks paver joints and prevents weeds & ant hills',
    },
  ];

  return {
    primaryResult: {
      label: 'Total Pavers Needed',
      value: roundedPavers,
      exactValue: roundTo(exactPavers, 1),
      unit: 'pavers',
      subtitle: `For ${roundTo(areaSqFt, 1)} sq ft patio (${paverW}" × ${paverL}" pavers w/ ${input.wastePercent ?? 10}% waste)`,
    },
    secondaryResults: [
      {
        label: 'Gravel Base Needed',
        value: `${roundTo(gravelCuYd, 2)} yd³ (${roundTo(gravelTons, 2)} tons)`,
        unit: '',
        highlight: true,
      },
      {
        label: 'Bedding Sand Needed',
        value: `${roundTo(sandCuYd, 2)} yd³ (${roundTo(sandTons, 2)} tons)`,
        unit: '',
      },
      {
        label: 'Polymeric Sand (50-lb Bags)',
        value: polymericSandBags,
        unit: 'bags',
      },
      {
        label: 'Patio Surface Area',
        value: roundTo(areaSqFt, 1),
        unit: 'sq ft',
      },
    ],
    materials,
    costEstimate: sumMaterialCosts(materials),
  };
}

export function getPaverPatioQuickReference(): QuickReferenceRow[] {
  const patios = [
    { name: '8×10 ft Grill Pad (80 sq ft, 4×8" pavers)', l: 10, w: 8 },
    { name: '10×12 ft Bistro Patio (120 sq ft, 4×8" pavers)', l: 12, w: 10 },
    { name: '12×16 ft Dining Patio (192 sq ft, 4×8" pavers)', l: 16, w: 12 },
    { name: '16×20 ft Family Patio (320 sq ft, 4×8" pavers)', l: 20, w: 16 },
    { name: '20×25 ft Outdoor Living Space (500 sq ft, 4×8" pavers)', l: 25, w: 20 },
  ];
  return patios.map((p) => {
    const res = calculatePaverPatio({
      patioLengthFeet: p.l,
      patioWidthFeet: p.w,
      paverLengthInches: 8,
      paverWidthInches: 4,
      gravelBaseDepthInches: 4,
      sandDepthInches: 1,
      wastePercent: 10,
      pricePerPaver: 0.95,
      gravelPricePerTon: 48,
      sandPricePerTon: 52,
    });
    return {
      scenario: p.name,
      col1: `${res.primaryResult.value} pavers`,
      col2: `${res.secondaryResults[0].value}`,
      col3: `${res.secondaryResults[1].value}`,
    };
  });
}
