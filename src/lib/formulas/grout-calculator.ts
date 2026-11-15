import { ceilUnits, computeCostRange, roundTo, sumMaterialCosts } from './units';
import type { CalculationResult, QuickReferenceRow } from './types';

export interface GroutCalculatorInput {
  areaSqFt: number; // total tiled area in sq ft
  tileLengthInches: number; // L in inches
  tileWidthInches: number; // W in inches
  jointWidthInches: number; // joint width in inches (e.g. 0.125 for 1/8", 0.25 for 1/4")
  jointDepthInches: number; // tile thickness in inches (e.g. 0.375 for 3/8")
  groutDensityLbPerCuFt: number; // default 100 lb/cu ft
  bagSizeLbs: number; // default 25 lb (or 10 lb)
  wastePercent: number; // default 10%
  pricePerBag: number; // default $22
}

/**
 * Grout Calculator Formula:
 * volume (cu in per sq ft) = ((L + W) ÷ (L × W)) × joint width × joint depth × 144
 * total volume (cu ft) = (volume_cu_in_per_sq_ft × area) ÷ 1728
 * lbs = total volume (cu ft) × density (lb/cu ft) × (1 + waste)
 */
export function calculateGrout(input: GroutCalculatorInput): CalculationResult {
  const area = Math.max(0, input.areaSqFt);
  const L = Math.max(0.25, input.tileLengthInches || 12);
  const W = Math.max(0.25, input.tileWidthInches || 12);
  const jWidth = Math.max(0.03125, input.jointWidthInches || 0.125);
  const jDepth = Math.max(0.125, input.jointDepthInches || 0.375);
  const density = Math.max(50, input.groutDensityLbPerCuFt || 100);
  const bagSize = Math.max(1, input.bagSizeLbs || 25);
  const wasteFactor = 1 + Math.max(0, input.wastePercent ?? 10) / 100;

  // Joint ratio per linear inch of tile
  const jointRatio = (L + W) / (L * W);
  // Cubic inches of grout per sq ft (144 sq in) of tile
  const cuInPerSqFt = jointRatio * jWidth * jDepth * 144;
  const totalCuFt = (cuInPerSqFt * area) / 1728;

  const exactLbs = totalCuFt * density * wasteFactor;
  const roundedLbs = ceilUnits(exactLbs);

  const exactBags = exactLbs / bagSize;
  const roundedBags = ceilUnits(exactBags);
  const tenLbBags = ceilUnits(exactLbs / 10);

  const groutCost = computeCostRange(roundedBags, input.pricePerBag || 22);
  const sealerCost = computeCostRange(1, 19);

  const materials = [
    {
      id: 'tile-grout-bags',
      name: `Cementitious Tile Grout (${bagSize}-lb Bag)`,
      quantity: roundedBags,
      exactQuantity: roundTo(exactBags, 2),
      unit: 'bags',
      unitPrice: input.pricePerBag || 22,
      totalLow: groutCost.low,
      totalTypical: groutCost.typical,
      totalHigh: groutCost.high,
      productId: 'prod-tile-grout',
      note:
        jWidth >= 0.125
          ? 'Use sanded grout for joints 1/8" and wider'
          : 'Use unsanded grout for joints narrower than 1/8"',
    },
    {
      id: 'grout-sealer-bottle',
      name: 'Penetrating Grout Sealer + Sponge Float Kit',
      quantity: 1,
      exactQuantity: 1,
      unit: 'kit',
      unitPrice: 19,
      totalLow: sealerCost.low,
      totalTypical: sealerCost.typical,
      totalHigh: sealerCost.high,
      productId: 'prod-grout-sealer',
      note: 'Rubber grout float, microfiber sponge & penetrating sealer',
    },
  ];

  return {
    primaryResult: {
      label: 'Grout Weight Needed',
      value: roundedLbs,
      exactValue: roundTo(exactLbs, 2),
      unit: 'lbs',
      subtitle: `${roundedBags} × ${bagSize}-lb bag(s) (or ${tenLbBags} × 10-lb bags)`,
    },
    secondaryResults: [
      {
        label: `Bags Needed (${bagSize}-lb)`,
        value: roundedBags,
        exactValue: roundTo(exactBags, 2),
        unit: 'bags',
        highlight: true,
      },
      {
        label: '10-lb Bags Equivalent',
        value: tenLbBags,
        unit: 'bags',
      },
      {
        label: 'Grout Volume',
        value: roundTo(totalCuFt, 3),
        unit: 'cu ft',
      },
      {
        label: 'Recommended Grout Type',
        value: jWidth >= 0.125 ? 'Sanded Grout' : 'Unsanded Grout',
        unit: '',
      },
    ],
    materials,
    costEstimate: sumMaterialCosts(materials),
  };
}

export function getGroutQuickReference(): QuickReferenceRow[] {
  const rows = [
    { name: '2×2" Mosaic Tile (1/8" joint, 3/8" thick, 100 sq ft)', l: 2, w: 2, j: 0.125 },
    { name: '3×6" Subway Tile (1/8" joint, 3/8" thick, 100 sq ft)', l: 6, w: 3, j: 0.125 },
    { name: '12×12" Floor Tile (1/8" joint, 3/8" thick, 100 sq ft)', l: 12, w: 12, j: 0.125 },
    { name: '12×24" Large Format (1/8" joint, 3/8" thick, 100 sq ft)', l: 24, w: 12, j: 0.125 },
    { name: '12×24" Large Format (1/4" joint, 3/8" thick, 100 sq ft)', l: 24, w: 12, j: 0.25 },
  ];
  return rows.map((r) => {
    const res = calculateGrout({
      areaSqFt: 100,
      tileLengthInches: r.l,
      tileWidthInches: r.w,
      jointWidthInches: r.j,
      jointDepthInches: 0.375,
      groutDensityLbPerCuFt: 100,
      bagSizeLbs: 25,
      wastePercent: 10,
      pricePerBag: 22,
    });
    return {
      scenario: r.name,
      col1: `${res.primaryResult.exactValue} lbs`,
      col2: `${res.secondaryResults[1].value} × 10-lb bags`,
      col3: `${res.secondaryResults[0].value} × 25-lb bag(s)`,
    };
  });
}
