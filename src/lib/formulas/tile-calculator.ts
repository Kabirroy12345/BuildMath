import { ceilUnits, computeCostRange, roundTo, sumMaterialCosts } from './units';
import type { CalculationResult, QuickReferenceRow } from './types';

export interface TileCalculatorInput {
  areaLength: number; // ft
  areaWidth: number; // ft
  tileWidthInches: number; // inches, e.g. 12
  tileLengthInches: number; // inches, e.g. 24
  groutJointInches: number; // inches, e.g. 0.125 (1/8")
  tilesPerBox: number; // default 10
  thinsetCoverageSqFt: number; // default 60 sq ft per 50-lb bag
  wastePercent: number; // default 10% (15% for diagonal/herringbone)
  pricePerTile: number; // default $3.25
  thinsetBagPrice: number; // default $24
}

/**
 * Tile Calculator Formula:
 * tiles = ceil(area_in² ÷ ((tile W + grout) × (tile L + grout)) × (1 + waste)).
 * Boxes, thinset bags (editable coverage per bag), grout.
 */
export function calculateTile(input: TileCalculatorInput): CalculationResult {
  const areaSqFt = Math.max(0, input.areaLength) * Math.max(0, input.areaWidth);
  const areaSqIn = areaSqFt * 144;

  const tileW = Math.max(0.5, input.tileWidthInches || 12);
  const tileL = Math.max(0.5, input.tileLengthInches || 24);
  const grout = Math.max(0, input.groutJointInches ?? 0.125);
  const wasteFactor = 1 + Math.max(0, input.wastePercent ?? 10) / 100;

  const effectiveTileAreaSqIn = (tileW + grout) * (tileL + grout);
  const exactTiles = (areaSqIn / effectiveTileAreaSqIn) * wasteFactor;
  const roundedTiles = ceilUnits(exactTiles);

  const tilesPerBox = Math.max(1, Math.floor(input.tilesPerBox || 10));
  const exactBoxes = roundedTiles / tilesPerBox;
  const roundedBoxes = ceilUnits(exactBoxes);

  const thinsetCov = Math.max(15, input.thinsetCoverageSqFt || 60);
  const exactThinsetBags = areaSqFt / thinsetCov;
  const roundedThinsetBags = ceilUnits(exactThinsetBags);

  // Grout estimate (25-lb bags cover ~100 sq ft at 1/8" joint)
  const exactGroutBags = Math.max(0, (areaSqFt * (grout / 0.125)) / 100);
  const roundedGroutBags = areaSqFt > 0 ? Math.max(1, ceilUnits(exactGroutBags)) : 0;

  const tileCost = computeCostRange(roundedTiles, input.pricePerTile || 3.25);
  const thinsetCost = computeCostRange(roundedThinsetBags, input.thinsetBagPrice || 24);
  const groutCost = computeCostRange(roundedGroutBags, 22);

  const materials = [
    {
      id: 'ceramic-porcelain-tiles',
      name: `Porcelain/Ceramic Tile (${tileW}" × ${tileL}")`,
      quantity: roundedBoxes,
      exactQuantity: roundTo(exactBoxes, 2),
      unit: `boxes (${roundedTiles} tiles)`,
      unitPrice: roundTo((input.pricePerTile || 3.25) * tilesPerBox, 2),
      totalLow: tileCost.low,
      totalTypical: tileCost.typical,
      totalHigh: tileCost.high,
      productId: 'prod-tile-porcelain',
      note: `${roundedTiles} tiles total (${tilesPerBox} tiles/box, includes ${input.wastePercent ?? 10}% waste)`,
    },
    {
      id: 'thinset-mortar-50lb',
      name: 'Polymer-Modified Thinset Mortar (50-lb Bag)',
      quantity: roundedThinsetBags,
      exactQuantity: roundTo(exactThinsetBags, 2),
      unit: 'bags',
      unitPrice: input.thinsetBagPrice || 24,
      totalLow: thinsetCost.low,
      totalTypical: thinsetCost.typical,
      totalHigh: thinsetCost.high,
      productId: 'prod-thinset-mortar',
      note: `Covers ~${thinsetCov} sq ft per 50-lb bag with 1/2" × 1/2" notched trowel`,
    },
    {
      id: 'tile-grout-25lb',
      name: 'Sanded/Unsanded Tile Grout (25-lb Bag)',
      quantity: roundedGroutBags,
      exactQuantity: roundTo(exactGroutBags, 2),
      unit: 'bags',
      unitPrice: 22,
      totalLow: groutCost.low,
      totalTypical: groutCost.typical,
      totalHigh: groutCost.high,
      productId: 'prod-tile-grout',
      note: `For ${grout}" grout joints`,
    },
  ];

  return {
    primaryResult: {
      label: 'Total Tiles Needed',
      value: roundedTiles,
      exactValue: roundTo(exactTiles, 2),
      unit: 'tiles',
      subtitle: `${roundedBoxes} boxes (${tilesPerBox} tiles per box) for ${roundTo(areaSqFt, 1)} sq ft`,
    },
    secondaryResults: [
      {
        label: 'Boxes to Purchase',
        value: roundedBoxes,
        exactValue: roundTo(exactBoxes, 2),
        unit: 'boxes',
        highlight: true,
      },
      {
        label: 'Net Tiled Area',
        value: roundTo(areaSqFt, 1),
        unit: 'sq ft',
      },
      {
        label: 'Thinset Mortar (50-lb Bags)',
        value: roundedThinsetBags,
        exactValue: roundTo(exactThinsetBags, 2),
        unit: 'bags',
      },
      {
        label: 'Grout (25-lb Bags)',
        value: roundedGroutBags,
        unit: 'bags',
      },
    ],
    materials,
    costEstimate: sumMaterialCosts(materials),
  };
}

export function getTileQuickReference(): QuickReferenceRow[] {
  const configs = [
    { name: 'Kitchen Backsplash (30 sq ft) w/ 3×6" Subway Tile', l: 15, w: 2, tw: 3, tl: 6, b: 44 },
    { name: 'Small Bath Floor (40 sq ft) w/ 12×12" Tile', l: 8, w: 5, tw: 12, tl: 12, b: 15 },
    { name: 'Shower Walls (90 sq ft) w/ 12×24" Tile', l: 10, w: 9, tw: 12, tl: 24, b: 8 },
    { name: 'Primary Bathroom (120 sq ft) w/ 12×24" Tile', l: 12, w: 10, tw: 12, tl: 24, b: 8 },
    { name: 'Kitchen Floor (200 sq ft) w/ 18×18" Tile', l: 20, w: 10, tw: 18, tl: 18, b: 6 },
  ];
  return configs.map((c) => {
    const res = calculateTile({
      areaLength: c.l,
      areaWidth: c.w,
      tileWidthInches: c.tw,
      tileLengthInches: c.tl,
      groutJointInches: 0.125,
      tilesPerBox: c.b,
      thinsetCoverageSqFt: 60,
      wastePercent: 10,
      pricePerTile: 3.25,
      thinsetBagPrice: 24,
    });
    return {
      scenario: c.name,
      col1: `${res.primaryResult.value} tiles`,
      col2: `${res.secondaryResults[0].value} boxes`,
      col3: `${res.secondaryResults[2].value} bag(s) thinset`,
    };
  });
}
