import { ceilUnits, computeCostRange, roundTo, sumMaterialCosts } from './units';
import type { CalculationResult, QuickReferenceRow } from './types';

export interface ExteriorPaintCalculatorInput {
  housePerimeter: number; // linear ft around house
  wallHeight: number; // ft (e.g., 10 for 1-story, 18-20 for 2-story)
  gableCount: number;
  gableWidth: number; // ft
  gableHeight: number; // ft
  doors: number; // 21 sq ft each
  windows: number; // 15 sq ft each
  garageDoors: number; // 112 sq ft each (single/double avg)
  coats: number;
  coveragePerGallon: number; // default 300 sq ft/gal (rough siding lowers it)
  wastePercent: number; // default 10%
  pricePerGallon: number; // default $54
}

/**
 * Exterior Paint Calculator Formula:
 * area = house perimeter × wall height + gable triangles (count × ½ × width × gable height) − openings.
 * Default coverage 300 sq ft/gal (rough siding lowers it).
 */
export function calculateExteriorPaint(input: ExteriorPaintCalculatorInput): CalculationResult {
  const perimeter = Math.max(0, input.housePerimeter);
  const height = Math.max(0, input.wallHeight);
  const gables = Math.max(0, Math.floor(input.gableCount));
  const gableW = Math.max(0, input.gableWidth);
  const gableH = Math.max(0, input.gableHeight);
  const doors = Math.max(0, Math.floor(input.doors));
  const windows = Math.max(0, Math.floor(input.windows));
  const garageDoors = Math.max(0, Math.floor(input.garageDoors || 0));
  const coats = Math.max(1, input.coats || 2);
  const coverage = Math.max(50, input.coveragePerGallon || 300);
  const wasteFactor = 1 + Math.max(0, input.wastePercent ?? 10) / 100;

  const mainWallArea = perimeter * height;
  const gableArea = gables * 0.5 * gableW * gableH;
  const openingsArea = doors * 21 + windows * 15 + garageDoors * 112;
  const netSidingArea = Math.max(0, mainWallArea + gableArea - openingsArea);

  const exactGallons = ((netSidingArea * coats) / coverage) * wasteFactor;
  const roundedGallons = ceilUnits(exactGallons);
  const fiveGalBuckets = Math.floor(roundedGallons / 5);
  const singleGallons = roundedGallons % 5;

  // Exterior trim rule of thumb: ~15% of siding paint
  const exactTrimGallons = Math.max(1, roundTo(exactGallons * 0.15, 2));
  const roundedTrimGallons = ceilUnits(exactTrimGallons);

  const paintCost = computeCostRange(roundedGallons, input.pricePerGallon || 54);
  const trimCost = computeCostRange(roundedTrimGallons, input.pricePerGallon || 54);

  const materials = [
    {
      id: 'exterior-siding-paint',
      name: '100% Acrylic Exterior Siding Paint (1-Gal equiv.)',
      quantity: roundedGallons,
      exactQuantity: roundTo(exactGallons, 2),
      unit: 'gallons',
      unitPrice: input.pricePerGallon || 54,
      totalLow: paintCost.low,
      totalTypical: paintCost.typical,
      totalHigh: paintCost.high,
      productId: 'prod-paint-exterior',
      note:
        fiveGalBuckets > 0
          ? `Buy ${fiveGalBuckets} × 5-gal bucket(s) + ${singleGallons} × 1-gal can(s)`
          : `${coats} coats at ${coverage} sq ft/gal`,
    },
    {
      id: 'exterior-trim-paint',
      name: 'Semi-Gloss Exterior Trim & Fascia Paint',
      quantity: roundedTrimGallons,
      exactQuantity: exactTrimGallons,
      unit: 'gallons',
      unitPrice: input.pricePerGallon || 54,
      totalLow: trimCost.low,
      totalTypical: trimCost.typical,
      totalHigh: trimCost.high,
      productId: 'prod-paint-exterior',
      note: 'For fascia, soffits, window trim & shutters',
    },
  ];

  return {
    primaryResult: {
      label: 'Exterior Siding Paint Needed',
      value: roundedGallons,
      exactValue: roundTo(exactGallons, 2),
      unit: 'gallons',
      subtitle:
        fiveGalBuckets > 0
          ? `${fiveGalBuckets} × 5-gal buckets + ${singleGallons} single gallons`
          : `Exact: ${roundTo(exactGallons, 2)} gallons`,
    },
    secondaryResults: [
      {
        label: 'Net Paintable Siding Area',
        value: roundTo(netSidingArea, 1),
        unit: 'sq ft',
        highlight: true,
      },
      {
        label: 'Gable Triangle Area',
        value: roundTo(gableArea, 1),
        unit: 'sq ft',
      },
      {
        label: 'Openings Deducted',
        value: roundTo(openingsArea, 1),
        unit: 'sq ft',
      },
      {
        label: 'Estimated Trim Paint',
        value: roundedTrimGallons,
        unit: 'gallons',
      },
    ],
    materials,
    costEstimate: sumMaterialCosts(materials),
  };
}

export function getExteriorPaintQuickReference(): QuickReferenceRow[] {
  const houses = [
    { name: '1,200 sq ft Ranch (140 ft perim, 9 ft walls)', p: 140, h: 9, g: 2, gw: 24, gh: 6, d: 2, w: 8 },
    { name: '1,600 sq ft Single-Story (165 ft perim, 10 ft walls)', p: 165, h: 10, g: 2, gw: 28, gh: 7, d: 2, w: 10 },
    { name: '2,000 sq ft Two-Story (150 ft perim, 18 ft walls)', p: 150, h: 18, g: 2, gw: 26, gh: 8, d: 2, w: 14 },
    { name: '2,500 sq ft Colonial (175 ft perim, 18 ft walls)', p: 175, h: 18, g: 3, gw: 28, gh: 8, d: 3, w: 16 },
    { name: '3,200 sq ft Two-Story (200 ft perim, 19 ft walls)', p: 200, h: 19, g: 4, gw: 30, gh: 9, d: 3, w: 20 },
  ];
  return houses.map((x) => {
    const res = calculateExteriorPaint({
      housePerimeter: x.p,
      wallHeight: x.h,
      gableCount: x.g,
      gableWidth: x.gw,
      gableHeight: x.gh,
      doors: x.d,
      windows: x.w,
      garageDoors: 1,
      coats: 2,
      coveragePerGallon: 300,
      wastePercent: 10,
      pricePerGallon: 54,
    });
    return {
      scenario: x.name,
      col1: `${res.secondaryResults[0].value} sq ft`,
      col2: `${res.primaryResult.exactValue} gal`,
      col3: `${res.primaryResult.value} gallons`,
    };
  });
}
