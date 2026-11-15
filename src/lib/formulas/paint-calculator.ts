import { ceilUnits, computeCostRange, roundTo, sumMaterialCosts } from './units';
import type { CalculationResult, QuickReferenceRow } from './types';

export interface PaintCalculatorInput {
  roomLength: number; // ft
  roomWidth: number; // ft
  wallHeight: number; // ft
  customWallArea?: number; // optional direct wall perimeter * height override if > 0
  doors: number;
  windows: number;
  includeCeiling: boolean;
  coats: number;
  coveragePerGallon: number; // default 350 sq ft/gal (range 250-400)
  includePrimer: boolean;
  primerCoveragePerGallon: number; // default 250 sq ft/gal
  wastePercent: number; // default 5%
  pricePerGallon: number; // default $42
  primerPricePerGallon: number; // default $28
}

/**
 * Paint Calculator Formula:
 * wall area = Σ(wall length × height) − doors × 21 sq ft − windows × 15 sq ft (+ ceiling optional = L × W).
 * Gallons = area × coats ÷ coverage (default 350 sq ft/gal; range 250–400).
 * Add primer option (default coverage 250 sq ft/gal). Round to gallons + quarts.
 */
export function calculatePaint(input: PaintCalculatorInput): CalculationResult {
  const L = Math.max(0, input.roomLength);
  const W = Math.max(0, input.roomWidth);
  const H = Math.max(0, input.wallHeight);
  const doors = Math.max(0, Math.floor(input.doors));
  const windows = Math.max(0, Math.floor(input.windows));
  const coats = Math.max(1, input.coats || 2);
  const coverage = Math.max(50, input.coveragePerGallon || 350);
  const primerCoverage = Math.max(50, input.primerCoveragePerGallon || 250);
  const wasteFactor = 1 + Math.max(0, input.wastePercent ?? 5) / 100;

  const grossWallArea =
    input.customWallArea && input.customWallArea > 0
      ? input.customWallArea
      : 2 * (L + W) * H;
  const openingsArea = doors * 21 + windows * 15;
  const netWallArea = Math.max(0, grossWallArea - openingsArea);
  const ceilingArea = input.includeCeiling ? L * W : 0;
  const paintableArea = netWallArea + ceilingArea;

  const exactPaintGallons = ((paintableArea * coats) / coverage) * wasteFactor;
  const roundedPaintGallons = ceilUnits(exactPaintGallons);

  // Gallons + Quarts breakdown (1 gal = 4 quarts)
  const totalQuartsNeeded = ceilUnits(exactPaintGallons * 4);
  const comboGallons = Math.floor(totalQuartsNeeded / 4);
  const comboQuarts = totalQuartsNeeded % 4;

  const exactPrimerGallons = input.includePrimer
    ? (paintableArea / primerCoverage) * wasteFactor
    : 0;
  const roundedPrimerGallons = input.includePrimer ? ceilUnits(exactPrimerGallons) : 0;

  const paintCost = computeCostRange(roundedPaintGallons, input.pricePerGallon || 42);
  const primerCost = computeCostRange(roundedPrimerGallons, input.primerPricePerGallon || 28);
  const suppliesCost = computeCostRange(1, 35); // Rollers, tape, tray

  const materials = [
    {
      id: 'interior-paint-gallon',
      name: 'Interior Wall & Ceiling Paint (1-Gal)',
      quantity: roundedPaintGallons,
      exactQuantity: roundTo(exactPaintGallons, 2),
      unit: 'gallons',
      unitPrice: input.pricePerGallon || 42,
      totalLow: paintCost.low,
      totalTypical: paintCost.typical,
      totalHigh: paintCost.high,
      productId: 'prod-paint-interior',
      note:
        comboQuarts > 0
          ? `Or buy ${comboGallons} gal + ${comboQuarts} qt (${roundTo(exactPaintGallons, 2)} gal exact)`
          : `${ coats } coats at ${coverage} sq ft/gal`,
    },
  ];

  if (input.includePrimer && roundedPrimerGallons > 0) {
    materials.push({
      id: 'interior-primer-gallon',
      name: 'Multi-Surface Interior Primer (1-Gal)',
      quantity: roundedPrimerGallons,
      exactQuantity: roundTo(exactPrimerGallons, 2),
      unit: 'gallons',
      unitPrice: input.primerPricePerGallon || 28,
      totalLow: primerCost.low,
      totalTypical: primerCost.typical,
      totalHigh: primerCost.high,
      productId: 'prod-primer-interior',
      note: `1 coat at ${primerCoverage} sq ft/gal`,
    });
  }

  materials.push({
    id: 'paint-roller-kit',
    name: 'Painter’s Tape, Roller & Tray Kit',
    quantity: 1,
    exactQuantity: 1,
    unit: 'kit',
    unitPrice: 35,
    totalLow: suppliesCost.low,
    totalTypical: suppliesCost.typical,
    totalHigh: suppliesCost.high,
    productId: 'prod-paint-supplies',
    note: '9" microfiber roller covers, tray, 2" angled brush & blue tape',
  });

  return {
    primaryResult: {
      label: 'Total Paint Needed',
      value: roundedPaintGallons,
      exactValue: roundTo(exactPaintGallons, 2),
      unit: 'gallons',
      subtitle:
        comboQuarts > 0
          ? `Exact: ${roundTo(exactPaintGallons, 2)} gal (or ${comboGallons} gal + ${comboQuarts} qt)`
          : `Exact: ${roundTo(exactPaintGallons, 2)} gal (${coats} coats)`,
    },
    secondaryResults: [
      {
        label: 'Net Paintable Area',
        value: roundTo(paintableArea, 1),
        exactValue: paintableArea,
        unit: 'sq ft',
        highlight: true,
      },
      {
        label: 'Net Wall Area',
        value: roundTo(netWallArea, 1),
        unit: 'sq ft',
      },
      {
        label: 'Openings Deducted',
        value: roundTo(openingsArea, 1),
        unit: 'sq ft',
      },
      {
        label: 'Gallons + Quarts Option',
        value: `${comboGallons} gal, ${comboQuarts} qt`,
        unit: '',
      },
      ...(input.includePrimer
        ? [
            {
              label: 'Primer Needed',
              value: roundedPrimerGallons,
              exactValue: roundTo(exactPrimerGallons, 2),
              unit: 'gallons',
            },
          ]
        : []),
    ],
    materials,
    costEstimate: sumMaterialCosts(materials),
    diagramData: {
      type: 'room-walls',
      length: L,
      width: W,
      height: H,
      doors,
      windows,
      paintableArea: roundTo(paintableArea, 0),
    },
  };
}

export function getPaintQuickReference(): QuickReferenceRow[] {
  const sizes = [
    { name: 'Small Bathroom (6×8 ft, 8 ft ceiling)', l: 8, w: 6, h: 8, d: 1, win: 0 },
    { name: 'Home Office (10×10 ft, 8 ft ceiling)', l: 10, w: 10, h: 8, d: 1, win: 1 },
    { name: 'Standard Bedroom (12×12 ft, 8 ft ceiling)', l: 12, w: 12, h: 8, d: 2, win: 2 },
    { name: 'Primary Bedroom (14×16 ft, 9 ft ceiling)', l: 16, w: 14, h: 9, d: 2, win: 2 },
    { name: 'Living Room (16×20 ft, 9 ft ceiling)', l: 20, w: 16, h: 9, d: 2, win: 4 },
    { name: 'Open Great Room (20×24 ft, 10 ft ceiling)', l: 24, w: 20, h: 10, d: 3, win: 5 },
  ];
  return sizes.map((s) => {
    const res = calculatePaint({
      roomLength: s.l,
      roomWidth: s.w,
      wallHeight: s.h,
      doors: s.d,
      windows: s.win,
      includeCeiling: false,
      coats: 2,
      coveragePerGallon: 350,
      includePrimer: false,
      primerCoveragePerGallon: 250,
      wastePercent: 5,
      pricePerGallon: 42,
      primerPricePerGallon: 28,
    });
    return {
      scenario: s.name,
      col1: `${res.secondaryResults[0].value} sq ft`,
      col2: `${res.primaryResult.exactValue} gal`,
      col3: `${res.primaryResult.value} gallons`,
    };
  });
}
