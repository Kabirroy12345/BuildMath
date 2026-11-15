import { ceilUnits, computeCostRange, roundTo, sumMaterialCosts } from './units';
import type { CalculationResult, QuickReferenceRow } from './types';

export interface MulchCalculatorInput {
  bedShape: 'rectangle' | 'circle';
  lengthFeet: number; // ft (for rectangle)
  widthFeet: number; // ft (for rectangle)
  diameterFeet: number; // ft (for circle bed)
  depthInches: number; // default 3 in (2-4" standard)
  bagSizeCuFt: number; // default 2 cu ft per bag (13.5 bags per cu yd)
  wastePercent: number; // default 5%
  pricePerBag: number; // default $4.25 per 2 cu ft bag
  bulkPricePerCuYd: number; // default $38 per cu yd
}

/**
 * Mulch Calculator Formula:
 * cu yd = area × depth in ÷ 12 ÷ 27.
 * Bags (2 cu ft default; 13.5 bags per cu yd). Support circle and rectangle beds.
 */
export function calculateMulch(input: MulchCalculatorInput): CalculationResult {
  const areaSqFt =
    input.bedShape === 'circle'
      ? Math.PI * Math.pow(Math.max(0, input.diameterFeet) / 2, 2)
      : Math.max(0, input.lengthFeet) * Math.max(0, input.widthFeet);

  const depthIn = Math.max(0.5, input.depthInches || 3);
  const bagCuFt = Math.max(0.5, input.bagSizeCuFt || 2);
  const wasteFactor = 1 + Math.max(0, input.wastePercent ?? 5) / 100;

  const netCuFt = areaSqFt * (depthIn / 12);
  const totalCuFt = netCuFt * wasteFactor;
  const netCuYd = netCuFt / 27;
  const totalCuYd = totalCuFt / 27;

  const exactBags = totalCuFt / bagCuFt;
  const roundedBags = ceilUnits(exactBags);

  const bagCost = computeCostRange(roundedBags, input.pricePerBag || 4.25);
  const bulkCost = computeCostRange(roundTo(Math.max(1, totalCuYd), 2), input.bulkPricePerCuYd || 38);

  const materials = [
    {
      id: 'hardwood-mulch-bags',
      name: `Shredded Hardwood / Bark Mulch (${bagCuFt} cu ft Bags)`,
      quantity: roundedBags,
      exactQuantity: roundTo(exactBags, 2),
      unit: `bags (${bagCuFt} cu ft)`,
      unitPrice: input.pricePerBag || 4.25,
      totalLow: bagCost.low,
      totalTypical: bagCost.typical,
      totalHigh: bagCost.high,
      productId: 'prod-mulch-bags',
      note: `${roundTo(27 / bagCuFt, 1)} bags per cubic yard (or order ${roundTo(totalCuYd, 2)} cu yd bulk @ ~$${bulkCost.typical})`,
    },
  ];

  return {
    primaryResult: {
      label: 'Total Mulch Volume',
      value: roundTo(totalCuYd, 2),
      exactValue: roundTo(netCuYd, 2),
      unit: 'cubic yards',
      subtitle: `Or ${roundedBags} × ${bagCuFt} cu ft bags (${roundTo(totalCuFt, 1)} cu ft total)`,
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
        label: 'Bed Surface Area',
        value: roundTo(areaSqFt, 1),
        unit: 'sq ft',
      },
      {
        label: 'Total Volume (Cubic Feet)',
        value: roundTo(totalCuFt, 1),
        unit: 'cu ft',
      },
      {
        label: 'Bulk Delivery Estimate',
        value: `$${bulkCost.typical}`,
        unit: `(@ $${input.bulkPricePerCuYd || 38}/yd³)`,
      },
    ],
    materials,
    costEstimate: sumMaterialCosts(materials),
  };
}

export function getMulchQuickReference(): QuickReferenceRow[] {
  const beds = [
    { name: 'Tree Ring (6 ft diameter circle, 3" deep)', shape: 'circle' as const, l: 0, w: 0, d: 6, depth: 3 },
    { name: 'Front Walkway Bed (4×20 ft = 80 sq ft, 3" deep)', shape: 'rectangle' as const, l: 20, w: 4, d: 0, depth: 3 },
    { name: 'Foundation Garden Bed (5×40 ft = 200 sq ft, 3" deep)', shape: 'rectangle' as const, l: 40, w: 5, d: 0, depth: 3 },
    { name: 'Side Yard Border (6×60 ft = 360 sq ft, 3" deep)', shape: 'rectangle' as const, l: 60, w: 6, d: 0, depth: 3 },
    { name: 'Full Property Beds (500 sq ft, 3" deep)', shape: 'rectangle' as const, l: 50, w: 10, d: 0, depth: 3 },
    { name: 'Large Landscape Project (1,000 sq ft, 3" deep)', shape: 'rectangle' as const, l: 100, w: 10, d: 0, depth: 3 },
  ];
  return beds.map((b) => {
    const res = calculateMulch({
      bedShape: b.shape,
      lengthFeet: b.l,
      widthFeet: b.w,
      diameterFeet: b.d,
      depthInches: b.depth,
      bagSizeCuFt: 2,
      wastePercent: 5,
      pricePerBag: 4.25,
      bulkPricePerCuYd: 38,
    });
    return {
      scenario: b.name,
      col1: `${res.secondaryResults[2].value} cu ft`,
      col2: `${res.primaryResult.value} cu yd`,
      col3: `${res.secondaryResults[0].value} bags (2 cu ft)`,
    };
  });
}
