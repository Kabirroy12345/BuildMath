import { ceilUnits, computeCostRange, roundTo, sumMaterialCosts } from './units';
import type { CalculationResult, QuickReferenceRow } from './types';

export interface DrywallCalculatorInput {
  roomLengthFeet: number; // ft
  roomWidthFeet: number; // ft
  wallHeightFeet: number; // ft (default 8 ft)
  includeCeiling: boolean; // default true
  doors: number; // 21 sq ft each
  windows: number; // 15 sq ft each
  sheetLengthFeet: number; // 8 or 12 ft (4x8 = 32 sq ft, 4x12 = 48 sq ft)
  wastePercent: number; // default 10%
  compoundGallonsPer100SqFt: number; // USG rule-of-thumb default 1.125 gal per 100 sq ft (0.01125 gal/sq ft, or one 4.5-gal pail per 400 sq ft)
  screwsPerSheet: number; // USG Sheetrock Handbook default 32 screws per 4x8 sheet
  pricePerSheet: number; // default $15.80 for 1/2" 4x8 sheet
}

/**
 * Drywall Calculator Formula:
 * net area = wall + ceiling area − openings
 * sheets = (net area ÷ sheet size (32 or 48 sq ft)) × (1 + waste%)
 * Joint compound, tape and screws using editable rule-of-thumb defaults (USG Sheetrock Handbook).
 */
export function calculateDrywall(input: DrywallCalculatorInput): CalculationResult {
  const L = Math.max(0, input.roomLengthFeet);
  const W = Math.max(0, input.roomWidthFeet);
  const H = Math.max(0, input.wallHeightFeet || 8);
  const doors = Math.max(0, Math.floor(input.doors || 0));
  const windows = Math.max(0, Math.floor(input.windows || 0));

  const wallArea = 2 * (L + W) * H;
  const ceilingArea = input.includeCeiling ? L * W : 0;
  const openingsArea = doors * 21 + windows * 15;
  const netArea = Math.max(0, wallArea + ceilingArea - openingsArea);

  const sheetLen = Number(input.sheetLengthFeet) === 12 ? 12 : 8;
  const sheetSqFt = 4 * sheetLen; // 32 or 48 sq ft
  const wasteFactor = 1 + Math.max(0, input.wastePercent ?? 10) / 100;

  const totalAreaWithWaste = netArea * wasteFactor;
  const exactSheets = totalAreaWithWaste / sheetSqFt;
  const roundedSheets = ceilUnits(exactSheets);

  // USG Sheetrock Handbook rule of thumb:
  // ~1.125 gal per 100 sq ft (0.01125 gal/sq ft, or one 4.5-gal pail per 400 sq ft) for 3-coat finish
  const mudRatePer100 = Math.max(0.5, input.compoundGallonsPer100SqFt || 1.125);
  const exactMudGallons = (netArea / 100) * mudRatePer100;
  const mudBuckets45Gal = Math.max(1, ceilUnits(exactMudGallons / 4.5));

  // Paper joint tape: ~370 linear ft per 1,000 sq ft (0.37 ft/sq ft), 250-ft rolls
  const tapeLinearFt = ceilUnits(netArea * 0.37);
  const tapeRolls = Math.max(1, ceilUnits(tapeLinearFt / 250));

  // Screws: ~32 per 4x8 sheet (or 48 per 4x12 sheet) per USG spec
  const screwRate = Math.max(20, input.screwsPerSheet || (sheetLen === 12 ? 48 : 32));
  const totalScrews = roundedSheets * screwRate;
  const screwBoxes5Lb = Math.max(1, ceilUnits(totalScrews / 1000)); // ~1,000 1-1/4" screws per 5-lb box

  const sheetCost = computeCostRange(roundedSheets, input.pricePerSheet || 15.8);
  const mudCost = computeCostRange(mudBuckets45Gal, 21.5);
  const tapeScrewCost = computeCostRange(tapeRolls + screwBoxes5Lb, 14);

  const materials = [
    {
      id: `drywall-sheets-4x${sheetLen}`,
      name: `1/2" Gypsum Drywall Panels (4×${sheetLen} ft = ${sheetSqFt} sq ft)`,
      quantity: roundedSheets,
      exactQuantity: roundTo(exactSheets, 2),
      unit: `sheets (4×${sheetLen})`,
      unitPrice: input.pricePerSheet || 15.8,
      totalLow: sheetCost.low,
      totalTypical: sheetCost.typical,
      totalHigh: sheetCost.high,
      productId: 'prod-drywall-sheets',
      note: `Covers ${roundTo(totalAreaWithWaste, 0)} sq ft (includes ${input.wastePercent ?? 10}% cut waste)`,
    },
    {
      id: 'joint-compound-bucket',
      name: 'All-Purpose Ready-Mixed Joint Compound (4.5-Gal Bucket)',
      quantity: mudBuckets45Gal,
      exactQuantity: roundTo(exactMudGallons / 4.5, 2),
      unit: 'buckets (4.5 gal)',
      unitPrice: 21.5,
      totalLow: mudCost.low,
      totalTypical: mudCost.typical,
      totalHigh: mudCost.high,
      productId: 'prod-drywall-mud',
      note: `${roundTo(exactMudGallons, 1)} gallons needed (USG Handbook spec: ${mudRatePer100} gal/100 sq ft)`,
    },
    {
      id: 'drywall-tape-and-screws',
      name: 'Paper Joint Tape (250-ft Roll) & 1-1/4" Coarse Drywall Screws',
      quantity: tapeRolls + screwBoxes5Lb,
      exactQuantity: tapeRolls + screwBoxes5Lb,
      unit: 'packs',
      unitPrice: 14,
      totalLow: tapeScrewCost.low,
      totalTypical: tapeScrewCost.typical,
      totalHigh: tapeScrewCost.high,
      productId: 'prod-drywall-screws',
      note: `${tapeRolls} roll(s) tape (${tapeLinearFt} ft) + ${totalScrews.toLocaleString()} screws (${screwBoxes5Lb} × 5-lb box)`,
    },
  ];

  return {
    primaryResult: {
      label: `4×${sheetLen} Drywall Sheets Needed`,
      value: roundedSheets,
      exactValue: roundTo(exactSheets, 2),
      unit: `sheets (4×${sheetLen})`,
      subtitle: `${roundTo(totalAreaWithWaste, 0)} sq ft w/ waste · ${mudBuckets45Gal} bucket(s) mud · ${totalScrews} screws`,
    },
    secondaryResults: [
      {
        label: 'Net Drywall Area',
        value: roundTo(netArea, 0),
        unit: 'sq ft',
        highlight: true,
      },
      {
        label: 'Joint Compound Needed',
        value: `${roundTo(exactMudGallons, 1)} gal (${mudBuckets45Gal} buckets)`,
        unit: '',
      },
      {
        label: 'Joint Tape Needed',
        value: `${tapeLinearFt} ft (${tapeRolls} rolls)`,
        unit: '',
      },
      {
        label: 'Drywall Screws (USG Spec)',
        value: totalScrews,
        unit: 'screws',
      },
    ],
    materials,
    costEstimate: sumMaterialCosts(materials),
  };
}

export function getDrywallQuickReference(): QuickReferenceRow[] {
  const rooms = [
    { name: 'Small Bathroom (6×8 ft, 8 ft ceiling + walls)', l: 8, w: 6, h: 8, d: 1, win: 0 },
    { name: '10×10 ft Bedroom (8 ft ceiling + walls)', l: 10, w: 10, h: 8, d: 1, win: 1 },
    { name: '12×12 ft Bedroom (8 ft ceiling + walls)', l: 12, w: 12, h: 8, d: 2, win: 2 },
    { name: '14×18 ft Primary Suite (9 ft ceiling + walls)', l: 18, w: 14, h: 9, d: 2, win: 3 },
    { name: '20×24 ft Garage / Basement (8 ft ceiling + walls)', l: 24, w: 20, h: 8, d: 2, win: 2 },
  ];
  return rooms.map((r) => {
    const res = calculateDrywall({
      roomLengthFeet: r.l,
      roomWidthFeet: r.w,
      wallHeightFeet: r.h,
      includeCeiling: true,
      doors: r.d,
      windows: r.win,
      sheetLengthFeet: 8,
      wastePercent: 10,
      compoundGallonsPer100SqFt: 1.125,
      screwsPerSheet: 32,
      pricePerSheet: 15.8,
    });
    return {
      scenario: r.name,
      col1: `${res.secondaryResults[0].value} sq ft`,
      col2: `${res.primaryResult.value} sheets (4×8)`,
      col3: `${res.secondaryResults[1].value}`,
    };
  });
}
