import { ceilUnits, computeCostRange, roundTo, sumMaterialCosts } from './units';
import type { CalculationResult, QuickReferenceRow } from './types';

export interface ConcreteSlabCalculatorInput {
  lengthFeet: number; // ft
  widthFeet: number; // ft
  thicknessInches: number; // inches (default 4")
  bagSizeLbs: number; // 80, 60, or 40 lb bag
  wastePercent: number; // default 10%
  pricePerBag: number; // default $6.85 for 80-lb bag
  readyMixPricePerCuYd: number; // default $165/cu yd
}

/**
 * Concrete Slab Calculator Formula:
 * cu ft = L × W × (thickness in ÷ 12).
 * cu yd = cu ft ÷ 27.
 * +10% waste default.
 * Bags: 80 lb ≈ 0.60 cu ft, 60 lb ≈ 0.45 cu ft, 40 lb ≈ 0.30 cu ft.
 * Shows both "bags" and "ready-mix truck yards".
 */
export function calculateConcreteSlab(input: ConcreteSlabCalculatorInput): CalculationResult {
  const L = Math.max(0, input.lengthFeet);
  const W = Math.max(0, input.widthFeet);
  const thickIn = Math.max(0.5, input.thicknessInches || 4);
  const wasteFactor = 1 + Math.max(0, input.wastePercent ?? 10) / 100;

  const netCuFt = L * W * (thickIn / 12);
  const totalCuFt = netCuFt * wasteFactor;
  const netCuYd = netCuFt / 27;
  const totalCuYd = totalCuFt / 27;

  const bagSize = [40, 60, 80].includes(Number(input.bagSizeLbs))
    ? Number(input.bagSizeLbs)
    : 80;
  const yieldCuFt = bagSize === 40 ? 0.3 : bagSize === 60 ? 0.45 : 0.6;

  const exactSelectedBags = totalCuFt / yieldCuFt;
  const roundedSelectedBags = ceilUnits(exactSelectedBags);

  const bags80 = ceilUnits(totalCuFt / 0.6);
  const bags60 = ceilUnits(totalCuFt / 0.45);
  const bags40 = ceilUnits(totalCuFt / 0.3);

  const bagPrice = input.pricePerBag || (bagSize === 80 ? 6.85 : bagSize === 60 ? 5.45 : 4.25);
  const readyMixPrice = input.readyMixPricePerCuYd || 165;

  const bagsCost = computeCostRange(roundedSelectedBags, bagPrice);
  const readyMixCost = computeCostRange(roundTo(Math.max(1, totalCuYd), 2), readyMixPrice);

  const materials = [
    {
      id: `concrete-bags-${bagSize}lb`,
      name: `High-Strength Concrete Mix (${bagSize}-lb Bags)`,
      quantity: roundedSelectedBags,
      exactQuantity: roundTo(exactSelectedBags, 2),
      unit: `bags (${bagSize} lb)`,
      unitPrice: bagPrice,
      totalLow: bagsCost.low,
      totalTypical: bagsCost.typical,
      totalHigh: bagsCost.high,
      productId: 'prod-concrete-80lb',
      note: `${yieldCuFt} cu ft yield per ${bagSize}-lb bag (total weight: ${(roundedSelectedBags * bagSize).toLocaleString()} lbs)`,
    },
  ];

  return {
    primaryResult: {
      label: 'Ready-Mix Concrete Volume',
      value: roundTo(totalCuYd, 2),
      exactValue: roundTo(netCuYd, 2),
      unit: 'cubic yards',
      subtitle: `Or ${roundedSelectedBags} × ${bagSize}-lb bags (${roundTo(totalCuFt, 1)} cu ft w/ ${input.wastePercent ?? 10}% waste)`,
    },
    secondaryResults: [
      {
        label: '80-lb Bags Needed (0.60 cu ft)',
        value: bags80,
        exactValue: roundTo(totalCuFt / 0.6, 1),
        unit: 'bags',
        highlight: true,
      },
      {
        label: '60-lb Bags Needed (0.45 cu ft)',
        value: bags60,
        unit: 'bags',
      },
      {
        label: '40-lb Bags Needed (0.30 cu ft)',
        value: bags40,
        unit: 'bags',
      },
      {
        label: 'Total Volume (Cubic Feet)',
        value: roundTo(totalCuFt, 1),
        exactValue: roundTo(netCuFt, 1),
        unit: 'cu ft',
      },
      {
        label: 'Ready-Mix Truck Estimate',
        value: `$${readyMixCost.typical.toLocaleString()}`,
        unit: `(@ $${readyMixPrice}/yd³)`,
      },
    ],
    materials,
    costEstimate: sumMaterialCosts(materials),
  };
}

export function getConcreteSlabQuickReference(): QuickReferenceRow[] {
  const slabs = [
    { name: '4×4 ft AC Condenser Pad (4" thick)', l: 4, w: 4, t: 4 },
    { name: '8×10 ft Shed Slab (4" thick)', l: 10, w: 8, t: 4 },
    { name: '10×12 ft Backyard Patio (4" thick)', l: 12, w: 10, t: 4 },
    { name: '12×20 ft Single Car Slab (4" thick)', l: 20, w: 12, t: 4 },
    { name: '20×20 ft Two-Car Garage (4" thick)', l: 20, w: 20, t: 4 },
    { name: '20×24 ft Heavy Driveway (6" thick)', l: 24, w: 20, t: 6 },
  ];
  return slabs.map((s) => {
    const res = calculateConcreteSlab({
      lengthFeet: s.l,
      widthFeet: s.w,
      thicknessInches: s.t,
      bagSizeLbs: 80,
      wastePercent: 10,
      pricePerBag: 6.85,
      readyMixPricePerCuYd: 165,
    });
    return {
      scenario: s.name,
      col1: `${res.secondaryResults[3].value} cu ft`,
      col2: `${res.primaryResult.value} cu yd`,
      col3: `${res.secondaryResults[0].value} bags (80-lb)`,
    };
  });
}
