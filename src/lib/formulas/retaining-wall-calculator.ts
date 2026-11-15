import { ceilUnits, computeCostRange, roundTo, sumMaterialCosts } from './units';
import type { CalculationResult, QuickReferenceRow } from './types';

export interface RetainingWallCalculatorInput {
  wallLengthFeet: number; // ft
  wallHeightFeet: number; // exposed height in ft
  blockLengthInches: number; // default 16 in
  blockHeightInches: number; // default 6 in
  includeBuriedRow: boolean; // default true (+1 buried base course)
  wastePercent: number; // default 5%
  pricePerBlock: number; // default $5.25
  pricePerCapBlock: number; // default $4.50
}

/**
 * Retaining Wall Block Calculator Formula:
 * blocks per row = length ÷ block length;
 * rows = height ÷ block height (+1 buried row option);
 * cap blocks; drainage gravel (12" wide backfill × wall height × length).
 */
export function calculateRetainingWall(input: RetainingWallCalculatorInput): CalculationResult {
  const lengthIn = Math.max(0, input.wallLengthFeet) * 12;
  const heightIn = Math.max(0, input.wallHeightFeet) * 12;
  const bLen = Math.max(4, input.blockLengthInches || 16);
  const bHeight = Math.max(2, input.blockHeightInches || 6);
  const wasteFactor = 1 + Math.max(0, input.wastePercent ?? 5) / 100;

  const blocksPerRow = ceilUnits(lengthIn / bLen);
  const exposedRows = ceilUnits(heightIn / bHeight);
  const totalRows = exposedRows + (input.includeBuriedRow ? 1 : 0);

  const exactWallBlocks = blocksPerRow * totalRows * wasteFactor;
  const roundedWallBlocks = ceilUnits(exactWallBlocks);

  const exactCapBlocks = blocksPerRow * wasteFactor;
  const roundedCapBlocks = ceilUnits(exactCapBlocks);

  // Drainage gravel: 1 ft wide × wallLengthFeet × totalHeightFeet
  const totalHeightFt = (totalRows * bHeight) / 12;
  const drainageGravelCuYd = (Math.max(0, input.wallLengthFeet) * totalHeightFt * 1) / 27;
  const drainageGravelTons = drainageGravelCuYd * 1.4;
  const adhesiveTubes = ceilUnits(roundedCapBlocks / 15);

  const blockCost = computeCostRange(roundedWallBlocks, input.pricePerBlock || 5.25);
  const capCost = computeCostRange(roundedCapBlocks, input.pricePerCapBlock || 4.5);
  const gravelCost = computeCostRange(roundTo(drainageGravelTons, 2), 50);

  const materials = [
    {
      id: 'retaining-wall-blocks',
      name: `Interlocking Retaining Wall Blocks (${bHeight}" H × ${bLen}" L)`,
      quantity: roundedWallBlocks,
      exactQuantity: roundTo(exactWallBlocks, 1),
      unit: 'blocks',
      unitPrice: input.pricePerBlock || 5.25,
      totalLow: blockCost.low,
      totalTypical: blockCost.typical,
      totalHigh: blockCost.high,
      productId: 'prod-retaining-block',
      note: `${totalRows} courses × ${blocksPerRow} blocks/row (${input.includeBuriedRow ? 'includes 1 buried base row' : 'exposed rows only'})`,
    },
    {
      id: 'retaining-wall-caps',
      name: 'Retaining Wall Cap Blocks',
      quantity: roundedCapBlocks,
      exactQuantity: roundTo(exactCapBlocks, 1),
      unit: 'caps',
      unitPrice: input.pricePerCapBlock || 4.5,
      totalLow: capCost.low,
      totalTypical: capCost.typical,
      totalHigh: capCost.high,
      productId: 'prod-retaining-cap',
      note: `Plus ${adhesiveTubes} tubes of heavy-duty landscape block adhesive`,
    },
    {
      id: 'drainage-backfill-gravel',
      name: '#57 Washed Drainage Gravel (12" Backfill Zone)',
      quantity: roundTo(drainageGravelTons, 2),
      exactQuantity: roundTo(drainageGravelTons, 2),
      unit: 'tons',
      unitPrice: 50,
      totalLow: gravelCost.low,
      totalTypical: gravelCost.typical,
      totalHigh: gravelCost.high,
      productId: 'prod-drainage-gravel',
      note: `${roundTo(drainageGravelCuYd, 2)} cu yd + 4" perforated drain pipe recommended`,
    },
  ];

  return {
    primaryResult: {
      label: 'Retaining Wall Blocks Needed',
      value: roundedWallBlocks,
      exactValue: roundTo(exactWallBlocks, 1),
      unit: 'blocks',
      subtitle: `Plus ${roundedCapBlocks} cap blocks (${totalRows} courses × ${blocksPerRow} blocks/course)`,
    },
    secondaryResults: [
      {
        label: 'Cap Blocks Needed',
        value: roundedCapBlocks,
        unit: 'caps',
        highlight: true,
      },
      {
        label: 'Blocks per Row (Course)',
        value: blocksPerRow,
        unit: 'blocks',
      },
      {
        label: 'Total Courses (Rows)',
        value: totalRows,
        unit: 'rows',
      },
      {
        label: 'Backfill Drainage Gravel',
        value: `${roundTo(drainageGravelCuYd, 2)} yd³ (${roundTo(drainageGravelTons, 2)} tons)`,
        unit: '',
      },
    ],
    materials,
    costEstimate: sumMaterialCosts(materials),
  };
}

export function getRetainingWallQuickReference(): QuickReferenceRow[] {
  const walls = [
    { name: '15 ft Long × 2 ft High Garden Wall (6×16" blocks)', l: 15, h: 2 },
    { name: '20 ft Long × 2.5 ft High Planter Wall (6×16" blocks)', l: 20, h: 2.5 },
    { name: '25 ft Long × 3 ft High Slope Wall (6×16" blocks)', l: 25, h: 3 },
    { name: '40 ft Long × 3.5 ft High Retaining Wall (6×16" blocks)', l: 40, h: 3.5 },
    { name: '50 ft Long × 4 ft High Terrace Wall (6×16" blocks)', l: 50, h: 4 },
  ];
  return walls.map((w) => {
    const res = calculateRetainingWall({
      wallLengthFeet: w.l,
      wallHeightFeet: w.h,
      blockLengthInches: 16,
      blockHeightInches: 6,
      includeBuriedRow: true,
      wastePercent: 5,
      pricePerBlock: 5.25,
      pricePerCapBlock: 4.5,
    });
    return {
      scenario: w.name,
      col1: `${res.secondaryResults[2].value} rows`,
      col2: `${res.primaryResult.value} wall blocks`,
      col3: `${res.secondaryResults[0].value} cap blocks`,
    };
  });
}
