import { ceilUnits, computeCostRange, roundTo, sumMaterialCosts } from './units';
import type { CalculationResult, QuickReferenceRow } from './types';

export interface ConcreteFootingCalculatorInput {
  shape: 'cylinder' | 'rectangular'; // default 'cylinder' (Sonotube)
  diameterInches: number; // for cylinder: e.g. 8, 10, 12, 16 in
  depthInches: number; // hole/tube depth in inches (e.g. 36 or 42 in)
  rectLengthInches: number; // for rectangular footing: inches
  rectWidthInches: number; // for rectangular footing: inches
  quantity: number; // number of footings/columns
  bagSizeLbs: number; // 80 or 60 lb
  wastePercent: number; // default 10%
  pricePerBag: number; // default $6.85
}

/**
 * Concrete Footing / Column / Sonotube Calculator Formula:
 * cylinder = π × r² × h; rectangular footing = L × W × D; multiplied by quantity.
 */
export function calculateConcreteFooting(input: ConcreteFootingCalculatorInput): CalculationResult {
  const qty = Math.max(1, Math.floor(input.quantity || 1));
  const depthFt = Math.max(1, input.depthInches || 42) / 12;
  const wasteFactor = 1 + Math.max(0, input.wastePercent ?? 10) / 100;

  let singleCuFt = 0;
  if (input.shape === 'rectangular') {
    const lFt = Math.max(1, input.rectLengthInches || 16) / 12;
    const wFt = Math.max(1, input.rectWidthInches || 16) / 12;
    singleCuFt = lFt * wFt * depthFt;
  } else {
    const radiusFt = Math.max(1, input.diameterInches || 12) / 2 / 12;
    singleCuFt = Math.PI * radiusFt * radiusFt * depthFt;
  }

  const netCuFt = singleCuFt * qty;
  const totalCuFt = netCuFt * wasteFactor;
  const totalCuYd = totalCuFt / 27;

  const bagSize = Number(input.bagSizeLbs) === 60 ? 60 : 80;
  const yieldCuFt = bagSize === 60 ? 0.45 : 0.6;
  const exactBags = totalCuFt / yieldCuFt;
  const roundedBags = ceilUnits(exactBags);
  const bagsPerHole = roundTo(exactBags / qty, 1);

  const bagCost = computeCostRange(roundedBags, input.pricePerBag || 6.85);
  const tubeCost = computeCostRange(qty, 14.5);

  const materials = [
    {
      id: 'footing-concrete-bags',
      name: `Concrete Mix (${bagSize}-lb Bags)`,
      quantity: roundedBags,
      exactQuantity: roundTo(exactBags, 2),
      unit: `bags (${bagSize} lb)`,
      unitPrice: input.pricePerBag || 6.85,
      totalLow: bagCost.low,
      totalTypical: bagCost.typical,
      totalHigh: bagCost.high,
      productId: 'prod-concrete-80lb',
      note: `~${bagsPerHole} bags per footing across ${qty} footings`,
    },
    ...(input.shape !== 'rectangular'
      ? [
          {
            id: 'sonotube-forms',
            name: `Concrete Forming Tubes (${input.diameterInches || 12}" Diameter)`,
            quantity: qty,
            exactQuantity: qty,
            unit: 'tubes',
            unitPrice: 14.5,
            totalLow: tubeCost.low,
            totalTypical: tubeCost.typical,
            totalHigh: tubeCost.high,
            productId: 'prod-sonotube',
            note: 'Weather-resistant cardboard concrete pier forms',
          },
        ]
      : []),
  ];

  return {
    primaryResult: {
      label: `Total ${bagSize}-lb Concrete Bags`,
      value: roundedBags,
      exactValue: roundTo(exactBags, 2),
      unit: `bags (${bagSize} lb)`,
      subtitle: `${roundTo(totalCuFt, 2)} cu ft (${roundTo(totalCuYd, 2)} cu yd) for ${qty} footing(s)`,
    },
    secondaryResults: [
      {
        label: 'Volume per Footing',
        value: roundTo(singleCuFt, 2),
        unit: 'cu ft',
        highlight: true,
      },
      {
        label: `Bags per Footing (${bagSize}-lb)`,
        value: bagsPerHole,
        unit: 'bags',
      },
      {
        label: 'Total Volume (w/ Waste)',
        value: roundTo(totalCuFt, 2),
        unit: 'cu ft',
      },
      {
        label: 'Total Cubic Yards',
        value: roundTo(totalCuYd, 2),
        unit: 'cu yd',
      },
    ],
    materials,
    costEstimate: sumMaterialCosts(materials),
  };
}

export function getConcreteFootingQuickReference(): QuickReferenceRow[] {
  const tubes = [
    { name: '8" Sonotube × 36" Deep (1 Pier)', d: 8, h: 36, q: 1 },
    { name: '10" Sonotube × 42" Deep (1 Pier)', d: 10, h: 42, q: 1 },
    { name: '12" Sonotube × 42" Deep (1 Pier)', d: 12, h: 42, q: 1 },
    { name: '12" Sonotube × 48" Deep (6 Deck Piers)', d: 12, h: 48, q: 6 },
    { name: '16" Sonotube × 48" Deep (4 Pergola Piers)', d: 16, h: 48, q: 4 },
  ];
  return tubes.map((t) => {
    const res = calculateConcreteFooting({
      shape: 'cylinder',
      diameterInches: t.d,
      depthInches: t.h,
      rectLengthInches: 16,
      rectWidthInches: 16,
      quantity: t.q,
      bagSizeLbs: 80,
      wastePercent: 10,
      pricePerBag: 6.85,
    });
    return {
      scenario: t.name,
      col1: `${res.secondaryResults[2].value} cu ft`,
      col2: `${res.secondaryResults[1].value} bags/pier`,
      col3: `${res.primaryResult.value} bags (80-lb total)`,
    };
  });
}
