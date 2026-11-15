import { ceilUnits, computeCostRange, roundTo, sumMaterialCosts } from './units';
import type { CalculationResult, QuickReferenceRow } from './types';

export interface SidingCalculatorInput {
  wallPerimeterFeet: number; // total linear ft around home
  wallHeightFeet: number; // ft
  gableCount: number;
  gableWidthFeet: number; // ft
  gableHeightFeet: number; // ft
  doors: number; // 21 sq ft each
  windows: number; // 15 sq ft each
  garageDoors: number; // 112 sq ft each
  outsideCorners: number; // default 4
  wastePercent: number; // default 10%
  pricePerSquare: number; // default $145 per square (100 sq ft)
}

/**
 * Siding Calculator Formula:
 * wall area + gable triangles − openings → squares (÷ 100), + 10% waste;
 * J-channel and corner posts.
 */
export function calculateSiding(input: SidingCalculatorInput): CalculationResult {
  const perim = Math.max(0, input.wallPerimeterFeet);
  const height = Math.max(0, input.wallHeightFeet);
  const gables = Math.max(0, Math.floor(input.gableCount || 0));
  const gableW = Math.max(0, input.gableWidthFeet || 0);
  const gableH = Math.max(0, input.gableHeightFeet || 0);
  const doors = Math.max(0, Math.floor(input.doors || 0));
  const windows = Math.max(0, Math.floor(input.windows || 0));
  const garageDoors = Math.max(0, Math.floor(input.garageDoors || 0));
  const corners = Math.max(0, Math.floor(input.outsideCorners ?? 4));
  const wasteFactor = 1 + Math.max(0, input.wastePercent ?? 10) / 100;

  const mainWallArea = perim * height;
  const gableArea = gables * 0.5 * gableW * gableH;
  const openingsArea = doors * 21 + windows * 15 + garageDoors * 112;
  const netWallArea = Math.max(0, mainWallArea + gableArea - openingsArea);
  const totalAreaWithWaste = netWallArea * wasteFactor;

  const exactSquares = totalAreaWithWaste / 100;
  const roundedSquares = ceilUnits(exactSquares);

  // Corner posts (10-ft standard lengths)
  const cornerPostPieces = ceilUnits((corners * height) / 10);

  // J-channel: ~14 ft per window + ~17 ft per door + ~32 ft per garage door + gable rakes
  const jChannelLinearFt = windows * 14 + doors * 17 + garageDoors * 32 + gables * gableW * 1.15;
  const jChannelPieces = ceilUnits(jChannelLinearFt / 12.5); // 12.5-ft standard J-channel

  // Housewrap rolls (9 ft × 100 ft = 900 sq ft per roll)
  const housewrapRolls = ceilUnits((mainWallArea + gableArea) / 800);

  const sidingCost = computeCostRange(roundedSquares, input.pricePerSquare || 145);
  const cornerCost = computeCostRange(cornerPostPieces, 28);
  const jCost = computeCostRange(jChannelPieces, 9.5);
  const wrapCost = computeCostRange(housewrapRolls, 165);

  const materials = [
    {
      id: 'vinyl-fiber-siding-squares',
      name: 'Exterior Siding Panels (Squares = 100 sq ft)',
      quantity: roundedSquares,
      exactQuantity: roundTo(exactSquares, 2),
      unit: 'squares',
      unitPrice: input.pricePerSquare || 145,
      totalLow: sidingCost.low,
      totalTypical: sidingCost.typical,
      totalHigh: sidingCost.high,
      productId: 'prod-vinyl-siding',
      note: `Covers ${roundTo(totalAreaWithWaste, 0)} sq ft (includes ${input.wastePercent ?? 10}% cutting waste)`,
    },
    {
      id: 'outside-corner-posts-10ft',
      name: 'Outside Corner Posts (10-ft Lengths)',
      quantity: cornerPostPieces,
      exactQuantity: roundTo((corners * height) / 10, 2),
      unit: 'posts',
      unitPrice: 28,
      totalLow: cornerCost.low,
      totalTypical: cornerCost.typical,
      totalHigh: cornerCost.high,
      productId: 'prod-siding-corners',
      note: `For ${corners} outside corners at ${height} ft wall height`,
    },
    {
      id: 'siding-j-channel',
      name: 'J-Channel Trim Around Windows, Doors & Rakes (12.5-ft)',
      quantity: jChannelPieces,
      exactQuantity: roundTo(jChannelLinearFt / 12.5, 2),
      unit: 'lengths',
      unitPrice: 9.5,
      totalLow: jCost.low,
      totalTypical: jCost.typical,
      totalHigh: jCost.high,
      productId: 'prod-siding-jchannel',
      note: `${roundTo(jChannelLinearFt, 0)} total linear ft around openings and rakes`,
    },
    {
      id: 'weather-barrier-housewrap',
      name: 'Breathable Housewrap Roll (9 ft × 100 ft)',
      quantity: housewrapRolls,
      exactQuantity: roundTo((mainWallArea + gableArea) / 800, 2),
      unit: 'rolls',
      unitPrice: 165,
      totalLow: wrapCost.low,
      totalTypical: wrapCost.typical,
      totalHigh: wrapCost.high,
      productId: 'prod-housewrap',
      note: 'Weather-resistant barrier under siding',
    },
  ];

  return {
    primaryResult: {
      label: 'Siding Squares Needed',
      value: roundedSquares,
      exactValue: roundTo(exactSquares, 2),
      unit: 'squares',
      subtitle: `${roundTo(totalAreaWithWaste, 0)} sq ft w/ waste (1 square = 100 sq ft)`,
    },
    secondaryResults: [
      {
        label: 'Total Siding Area (w/ Waste)',
        value: roundTo(totalAreaWithWaste, 0),
        unit: 'sq ft',
        highlight: true,
      },
      {
        label: 'Net Wall + Gable Area',
        value: roundTo(netWallArea, 0),
        unit: 'sq ft',
      },
      {
        label: 'Outside Corner Posts (10-ft)',
        value: cornerPostPieces,
        unit: 'posts',
      },
      {
        label: 'J-Channel Trim (12.5-ft)',
        value: jChannelPieces,
        unit: 'pieces',
      },
    ],
    materials,
    costEstimate: sumMaterialCosts(materials),
  };
}

export function getSidingQuickReference(): QuickReferenceRow[] {
  const homes = [
    { name: 'Detached 2-Car Garage (96 ft perim, 9 ft walls)', p: 96, h: 9, g: 2, gw: 24, gh: 6, w: 2 },
    { name: '1,200 sq ft Ranch (140 ft perim, 9 ft walls)', p: 140, h: 9, g: 2, gw: 26, gh: 6, w: 8 },
    { name: '1,800 sq ft Single-Story (170 ft perim, 10 ft walls)', p: 170, h: 10, g: 2, gw: 28, gh: 7, w: 12 },
    { name: '2,200 sq ft Two-Story (155 ft perim, 18 ft walls)', p: 155, h: 18, g: 2, gw: 28, gh: 8, w: 16 },
    { name: '3,000 sq ft Two-Story (190 ft perim, 18 ft walls)', p: 190, h: 18, g: 3, gw: 30, gh: 8, w: 20 },
  ];
  return homes.map((hm) => {
    const res = calculateSiding({
      wallPerimeterFeet: hm.p,
      wallHeightFeet: hm.h,
      gableCount: hm.g,
      gableWidthFeet: hm.gw,
      gableHeightFeet: hm.gh,
      doors: 2,
      windows: hm.w,
      garageDoors: 1,
      outsideCorners: 4,
      wastePercent: 10,
      pricePerSquare: 145,
    });
    return {
      scenario: hm.name,
      col1: `${res.secondaryResults[1].value} sq ft`,
      col2: `${res.primaryResult.exactValue} squares`,
      col3: `${res.primaryResult.value} squares to order`,
    };
  });
}
