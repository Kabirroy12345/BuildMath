import { ceilUnits, computeCostRange, roundTo, sumMaterialCosts } from './units';
import type { CalculationResult, QuickReferenceRow } from './types';

export interface TopsoilCalculatorInput {
  lengthFeet: number; // ft
  widthFeet: number; // ft
  depthInches: number; // default 4 in (2" topdressing, 4-6" new lawn, 12" raised bed)
  bagSizeCuFt: number; // default 0.75 cu ft (standard 40-lb topsoil bag)
  densityTonsPerCuYd: number; // default 1.1 tons/cu yd for screened topsoil
  wastePercent: number; // default 10% settling
  pricePerBag: number; // default $3.48 per 0.75 cu ft bag
  bulkPricePerCuYd: number; // default $42 per cu yd
}

/**
 * Topsoil Calculator Formula:
 * cu yd = area × (depth in ÷ 12) ÷ 27 × (1 + waste%)
 * bags (editable), tons (editable density).
 */
export function calculateTopsoil(input: TopsoilCalculatorInput): CalculationResult {
  const areaSqFt = Math.max(0, input.lengthFeet) * Math.max(0, input.widthFeet);
  const depthIn = Math.max(0.25, input.depthInches || 4);
  const bagCuFt = Math.max(0.25, input.bagSizeCuFt || 0.75);
  const density = Math.max(0.6, input.densityTonsPerCuYd || 1.1);
  const wasteFactor = 1 + Math.max(0, input.wastePercent ?? 10) / 100;

  const netCuFt = areaSqFt * (depthIn / 12);
  const totalCuFt = netCuFt * wasteFactor;
  const totalCuYd = totalCuFt / 27;
  const totalTons = totalCuYd * density;

  const exactBags = totalCuFt / bagCuFt;
  const roundedBags = ceilUnits(exactBags);

  const bulkCost = computeCostRange(roundTo(Math.max(1, totalCuYd), 2), input.bulkPricePerCuYd || 42);
  const bagCost = computeCostRange(roundedBags, input.pricePerBag || 3.48);

  const materials = [
    {
      id: 'screened-topsoil-bags',
      name: `Screened Topsoil / Garden Soil (${bagCuFt} cu ft Bags)`,
      quantity: roundedBags,
      exactQuantity: roundTo(exactBags, 2),
      unit: `bags (${bagCuFt} cu ft)`,
      unitPrice: input.pricePerBag || 3.48,
      totalLow: bagCost.low,
      totalTypical: bagCost.typical,
      totalHigh: bagCost.high,
      productId: 'prod-topsoil-bags',
      note: `Or order ${roundTo(totalCuYd, 2)} cubic yards bulk (~$${bulkCost.typical} before delivery)`,
    },
  ];

  return {
    primaryResult: {
      label: 'Topsoil Volume Needed',
      value: roundTo(totalCuYd, 2),
      exactValue: roundTo(netCuFt / 27, 2),
      unit: 'cubic yards',
      subtitle: `${roundedBags} × ${bagCuFt} cu ft bags · ${roundTo(totalTons, 2)} tons estimated weight`,
    },
    secondaryResults: [
      {
        label: `Bags Needed (${bagCuFt} cu ft)`,
        value: roundedBags,
        exactValue: roundTo(exactBags, 1),
        unit: 'bags',
        highlight: true,
      },
      {
        label: 'Estimated Weight in Tons',
        value: roundTo(totalTons, 2),
        unit: 'tons',
      },
      {
        label: 'Volume in Cubic Feet',
        value: roundTo(totalCuFt, 1),
        unit: 'cu ft',
      },
      {
        label: 'Bulk Delivery Estimate',
        value: `$${bulkCost.typical}`,
        unit: `(@ $${input.bulkPricePerCuYd || 42}/yd³)`,
      },
    ],
    materials,
    costEstimate: sumMaterialCosts(materials),
  };
}

export function getTopsoilQuickReference(): QuickReferenceRow[] {
  const beds = [
    { name: '4×8 ft Raised Garden Bed (12" deep)', l: 8, w: 4, d: 12 },
    { name: '10×20 ft Vegetable Garden (6" deep)', l: 20, w: 10, d: 6 },
    { name: '500 sq ft Lawn Topdressing (1" deep)', l: 25, w: 20, d: 1 },
    { name: '1,000 sq ft New Lawn Bed (4" deep)', l: 50, w: 20, d: 4 },
    { name: '2,500 sq ft Yard Grading (4" deep)', l: 50, w: 50, d: 4 },
  ];
  return beds.map((b) => {
    const res = calculateTopsoil({
      lengthFeet: b.l,
      widthFeet: b.w,
      depthInches: b.d,
      bagSizeCuFt: 0.75,
      densityTonsPerCuYd: 1.1,
      wastePercent: 10,
      pricePerBag: 3.48,
      bulkPricePerCuYd: 42,
    });
    return {
      scenario: b.name,
      col1: `${res.primaryResult.value} cu yd`,
      col2: `${res.secondaryResults[1].value} tons`,
      col3: `${res.secondaryResults[0].value} bags (0.75 cu ft)`,
    };
  });
}
