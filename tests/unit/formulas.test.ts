import { describe, expect, it } from 'vitest';
import {
  calculatePaint,
  calculateExteriorPaint,
  calculateDeckStain,
  calculateWallpaper,
  calculateFlooring,
  calculateTile,
  calculateGrout,
  calculateCarpet,
  calculateBaseboardTrim,
  calculateConcreteSlab,
  calculateConcreteFooting,
  calculateConcreteSteps,
  calculateBrick,
  calculatePaverPatio,
  calculateRetainingWall,
  calculateRebar,
  calculateRoofing,
  calculateRoofPitch,
  calculateGutter,
  calculateSiding,
  calculateMulch,
  calculateGravel,
  calculateTopsoil,
  calculateSod,
  calculateGrassSeed,
  calculateFence,
  calculateDeck,
  calculateDrywall,
  calculateStair,
  calculateSquareFootage,
  calculateCubicYard,
  calculateBoardFoot,
  calculateStateCost,
  feetInchesToFeet,
} from '../../src/lib/formulas';

describe('Unit Conversion Helpers', () => {
  it('converts feet and inches accurately', () => {
    expect(feetInchesToFeet(10, 6)).toBe(10.5);
    expect(feetInchesToFeet(12, 3)).toBe(12.25);
    expect(feetInchesToFeet(0, 9)).toBe(0.75);
  });
});

describe('1. Paint Calculator Formula', () => {
  it('Case 1: 12x12 room, 8ft walls, 2 doors, 2 windows, 2 coats, no ceiling, 0% waste', () => {
    // Gross wall = 2*(12+12)*8 = 384 sq ft. Openings = 2*21 + 2*15 = 72 sq ft. Net = 312 sq ft.
    // 2 coats @ 350 sq ft/gal = 624 / 350 = 1.7828 -> 1.78 exact, 2 gal rounded.
    const res = calculatePaint({
      roomLength: 12,
      roomWidth: 12,
      wallHeight: 8,
      doors: 2,
      windows: 2,
      includeCeiling: false,
      coats: 2,
      coveragePerGallon: 350,
      includePrimer: false,
      primerCoveragePerGallon: 250,
      wastePercent: 0,
      pricePerGallon: 42,
      primerPricePerGallon: 28,
    });
    expect(res.secondaryResults[0].value).toBe(312);
    expect(res.primaryResult.exactValue).toBe(1.78);
    expect(res.primaryResult.value).toBe(2);
  });

  it('Case 2: 15x20 room, 9ft walls + ceiling, 1 door, 3 windows, 2 coats + primer, 5% waste', () => {
    // Wall = 2*(15+20)*9 = 630. Openings = 21 + 45 = 66. Net wall = 564. Ceiling = 300. Total = 864 sq ft.
    // Paint = (864 * 2 / 350) * 1.05 = 5.184 -> 6 gal.
    // Primer = (864 / 250) * 1.05 = 3.6288 -> 4 gal.
    const res = calculatePaint({
      roomLength: 20,
      roomWidth: 15,
      wallHeight: 9,
      doors: 1,
      windows: 3,
      includeCeiling: true,
      coats: 2,
      coveragePerGallon: 350,
      includePrimer: true,
      primerCoveragePerGallon: 250,
      wastePercent: 5,
      pricePerGallon: 40,
      primerPricePerGallon: 25,
    });
    expect(res.secondaryResults[0].value).toBe(864);
    expect(res.primaryResult.exactValue).toBe(5.18);
    expect(res.primaryResult.value).toBe(6);
    expect(res.materials[1].quantity).toBe(4);
  });

  it('Case 3: Small bathroom where openings exceed wall area clamps safely at 0', () => {
    const res = calculatePaint({
      roomLength: 3,
      roomWidth: 3,
      wallHeight: 5,
      doors: 4,
      windows: 4,
      includeCeiling: false,
      coats: 2,
      coveragePerGallon: 350,
      includePrimer: false,
      primerCoveragePerGallon: 250,
      wastePercent: 0,
      pricePerGallon: 42,
      primerPricePerGallon: 28,
    });
    expect(res.primaryResult.value).toBe(0);
  });
});

describe('2. Exterior Paint Calculator Formula', () => {
  it('Case 1: 160ft perimeter, 10ft walls, 2 gables (24x6), 2 doors, 10 windows, 1 garage, 0% waste', () => {
    // Walls = 1600. Gables = 2 * 0.5 * 24 * 6 = 144. Openings = 42 + 150 + 112 = 304.
    // Net = 1600 + 144 - 304 = 1440 sq ft. 2 coats @ 300 = 2880/300 = 9.6 gal -> 10 gal.
    const res = calculateExteriorPaint({
      housePerimeter: 160,
      wallHeight: 10,
      gableCount: 2,
      gableWidth: 24,
      gableHeight: 6,
      doors: 2,
      windows: 10,
      garageDoors: 1,
      coats: 2,
      coveragePerGallon: 300,
      wastePercent: 0,
      pricePerGallon: 54,
    });
    expect(res.secondaryResults[0].value).toBe(1440);
    expect(res.primaryResult.exactValue).toBe(9.6);
    expect(res.primaryResult.value).toBe(10);
  });

  it('Case 2: Rough stucco siding with 225 sq ft/gal coverage and 10% waste', () => {
    const res = calculateExteriorPaint({
      housePerimeter: 150,
      wallHeight: 10,
      gableCount: 0,
      gableWidth: 0,
      gableHeight: 0,
      doors: 2,
      windows: 6,
      garageDoors: 0,
      coats: 2,
      coveragePerGallon: 225,
      wastePercent: 10,
      pricePerGallon: 54,
    });
    // Net = 1500 - 132 = 1368. (1368 * 2 / 225) * 1.1 = 13.376 -> 14 gal
    expect(res.primaryResult.value).toBe(14);
  });

  it('Case 3: Two-story colonial (180ft perim, 18ft walls)', () => {
    const res = calculateExteriorPaint({
      housePerimeter: 180,
      wallHeight: 18,
      gableCount: 2,
      gableWidth: 30,
      gableHeight: 8,
      doors: 2,
      windows: 16,
      garageDoors: 1,
      coats: 2,
      coveragePerGallon: 300,
      wastePercent: 10,
      pricePerGallon: 54,
    });
    expect(res.primaryResult.value).toBe(23);
  });
});

describe('3. Deck Stain Calculator Formula', () => {
  it('Case 1: 12x16 deck, 28ft railing (3ft high), 4 steps (4ft wide), 2 coats, 0% waste', () => {
    // Deck = 192. Railing = 28 * 3 * 2 = 168. Stairs = 4 * 4 * 1.5 = 24. Total = 384 sq ft.
    // Coat 1 @ 200 = 1.92 gal. Coat 2 @ 300 = 1.28 gal. Sum = 3.20 gal -> 4 gal.
    const res = calculateDeckStain({
      deckLength: 16,
      deckWidth: 12,
      railingLength: 28,
      railingHeight: 3,
      stairSteps: 4,
      stairWidth: 4,
      coats: 2,
      firstCoatCoverage: 200,
      secondCoatCoverage: 300,
      wastePercent: 0,
      pricePerGallon: 48,
    });
    expect(res.secondaryResults[0].value).toBe(384);
    expect(res.primaryResult.exactValue).toBe(3.2);
    expect(res.primaryResult.value).toBe(4);
  });

  it('Case 2: 10x10 ground deck, no railings or stairs, 1 coat @ 200 sq ft/gal, 0% waste', () => {
    const res = calculateDeckStain({
      deckLength: 10,
      deckWidth: 10,
      railingLength: 0,
      railingHeight: 3,
      stairSteps: 0,
      stairWidth: 4,
      coats: 1,
      firstCoatCoverage: 200,
      secondCoatCoverage: 300,
      wastePercent: 0,
      pricePerGallon: 48,
    });
    expect(res.primaryResult.exactValue).toBe(0.5);
    expect(res.primaryResult.value).toBe(1);
  });

  it('Case 3: 20x20 deck with 5% waste and 2 coats', () => {
    const res = calculateDeckStain({
      deckLength: 20,
      deckWidth: 20,
      railingLength: 40,
      railingHeight: 3,
      stairSteps: 6,
      stairWidth: 4,
      coats: 2,
      firstCoatCoverage: 200,
      secondCoatCoverage: 300,
      wastePercent: 5,
      pricePerGallon: 48,
    });
    // Area = 400 + 240 + 36 = 676. (676/200 + 676/300)*1.05 = 5.915 -> 6 gal
    expect(res.primaryResult.value).toBe(6);
  });
});

describe('4. Wallpaper Calculator Formula', () => {
  it('Case 1: 48ft perimeter, 8ft height, 2 doors, 2 windows, 0% repeat, 0% cut waste', () => {
    // Area = 384 - 72 = 312 sq ft. Single rolls @ 25 = 12.48 -> 13 single, 7 double rolls.
    const res = calculateWallpaper({
      wallPerimeter: 48,
      wallHeight: 8,
      doors: 2,
      windows: 2,
      usableSingleRollCoverage: 25,
      patternRepeatWastePercent: 0,
      wastePercent: 0,
      pricePerDoubleRoll: 55,
    });
    expect(res.secondaryResults[0].value).toBe(13);
    expect(res.primaryResult.value).toBe(7);
  });

  it('Case 2: Accent wall 12x9 (108 sq ft) with 10% repeat + 10% cut waste', () => {
    // 108 / 25 * 1.20 = 5.184 single rolls -> 2.592 double rolls -> 3 double rolls
    const res = calculateWallpaper({
      wallPerimeter: 12,
      wallHeight: 9,
      doors: 0,
      windows: 0,
      usableSingleRollCoverage: 25,
      patternRepeatWastePercent: 10,
      wastePercent: 10,
      pricePerDoubleRoll: 55,
    });
    expect(res.primaryResult.exactValue).toBe(2.59);
    expect(res.primaryResult.value).toBe(3);
  });

  it('Case 3: Large pattern repeat (20%) on 40x8 room', () => {
    const res = calculateWallpaper({
      wallPerimeter: 40,
      wallHeight: 8,
      doors: 1,
      windows: 1,
      usableSingleRollCoverage: 25,
      patternRepeatWastePercent: 20,
      wastePercent: 10,
      pricePerDoubleRoll: 55,
    });
    expect(res.primaryResult.value).toBe(8);
  });
});

describe('5. Flooring Calculator Formula', () => {
  it('Case 1: 12x15 rectangle (180 sq ft) + 10% straight waste, 20 sq ft/box', () => {
    // 180 * 1.1 = 198 sq ft -> 198 / 20 = 9.9 -> 10 boxes
    const res = calculateFlooring({
      roomLength: 15,
      roomWidth: 12,
      secondAreaLength: 0,
      secondAreaWidth: 0,
      sqFtPerBox: 20,
      wastePercent: 10,
      underlaymentRollSqFt: 100,
      pricePerSqFt: 3.5,
      underlaymentPricePerRoll: 45,
    });
    expect(res.secondaryResults[0].value).toBe(198);
    expect(res.primaryResult.exactValue).toBe(9.9);
    expect(res.primaryResult.value).toBe(10);
  });

  it('Case 2: L-shaped room (10x12 + 6x8 = 168 sq ft) + 15% diagonal waste, 24 sq ft/box', () => {
    // 168 * 1.15 = 193.2 sq ft -> 193.2 / 24 = 8.05 -> 9 boxes
    const res = calculateFlooring({
      roomLength: 12,
      roomWidth: 10,
      secondAreaLength: 8,
      secondAreaWidth: 6,
      sqFtPerBox: 24,
      wastePercent: 15,
      underlaymentRollSqFt: 100,
      pricePerSqFt: 4.0,
      underlaymentPricePerRoll: 45,
    });
    expect(res.primaryResult.exactValue).toBe(8.05);
    expect(res.primaryResult.value).toBe(9);
  });

  it('Case 3: Exact 200 sq ft room with 0% waste and 20 sq ft/box = 10 boxes', () => {
    const res = calculateFlooring({
      roomLength: 20,
      roomWidth: 10,
      secondAreaLength: 0,
      secondAreaWidth: 0,
      sqFtPerBox: 20,
      wastePercent: 0,
      underlaymentRollSqFt: 100,
      pricePerSqFt: 3.0,
      underlaymentPricePerRoll: 45,
    });
    expect(res.primaryResult.value).toBe(10);
  });
});

describe('6. Tile Calculator Formula', () => {
  it('Case 1: 10x10 area (100 sq ft = 14,400 sq in), 12x12 tile, 0" grout, 10% waste', () => {
    // 14400 / 144 * 1.1 = 110 tiles
    const res = calculateTile({
      areaLength: 10,
      areaWidth: 10,
      tileWidthInches: 12,
      tileLengthInches: 12,
      groutJointInches: 0,
      tilesPerBox: 10,
      thinsetCoverageSqFt: 50,
      wastePercent: 10,
      pricePerTile: 3,
      thinsetBagPrice: 24,
    });
    expect(res.primaryResult.value).toBe(110);
    expect(res.secondaryResults[0].value).toBe(11);
    expect(res.secondaryResults[2].value).toBe(2);
  });

  it('Case 2: 10x12 room (120 sq ft), 12x24 tile, 0.125" grout, 10% waste', () => {
    // 120 * 144 = 17,280 sq in. Tile w/ grout = 12.125 * 24.125 = 292.515625.
    // Raw = 59.0737 * 1.1 = 64.98 -> 65 tiles
    const res = calculateTile({
      areaLength: 12,
      areaWidth: 10,
      tileWidthInches: 12,
      tileLengthInches: 24,
      groutJointInches: 0.125,
      tilesPerBox: 8,
      thinsetCoverageSqFt: 60,
      wastePercent: 10,
      pricePerTile: 4,
      thinsetBagPrice: 24,
    });
    expect(res.primaryResult.value).toBe(65);
    expect(res.secondaryResults[0].value).toBe(9);
  });

  it('Case 3: Backsplash 15x2 (30 sq ft) with 3x6 subway tile, 0.125" joint, 10% waste', () => {
    const res = calculateTile({
      areaLength: 15,
      areaWidth: 2,
      tileWidthInches: 3,
      tileLengthInches: 6,
      groutJointInches: 0.125,
      tilesPerBox: 44,
      thinsetCoverageSqFt: 60,
      wastePercent: 10,
      pricePerTile: 0.75,
      thinsetBagPrice: 24,
    });
    expect(res.primaryResult.value).toBe(249);
  });
});

describe('7. Grout Calculator Formula', () => {
  it('Case 1: 100 sq ft of 12x12 tile, 1/8" joint, 3/8" depth, 100 lb/cu ft, 10% waste', () => {
    const res = calculateGrout({
      areaSqFt: 100,
      tileLengthInches: 12,
      tileWidthInches: 12,
      jointWidthInches: 0.125,
      jointDepthInches: 0.375,
      groutDensityLbPerCuFt: 100,
      bagSizeLbs: 25,
      wastePercent: 10,
      pricePerBag: 22,
    });
    // Ratio = 24/144 = 0.16667. cuIn/sqft = 0.16667 * 0.125 * 0.375 * 144 = 1.125.
    // cuFt = 112.5 / 1728 = 0.0651. Lbs = 6.51 * 1.1 = 7.16 -> 8 lbs, 1 bag.
    expect(res.primaryResult.exactValue).toBe(7.16);
    expect(res.primaryResult.value).toBe(8);
    expect(res.secondaryResults[0].value).toBe(1);
  });

  it('Case 2: 2x2 mosaic tile requires significantly more grout per 100 sq ft', () => {
    const res = calculateGrout({
      areaSqFt: 100,
      tileLengthInches: 2,
      tileWidthInches: 2,
      jointWidthInches: 0.125,
      jointDepthInches: 0.375,
      groutDensityLbPerCuFt: 100,
      bagSizeLbs: 25,
      wastePercent: 10,
      pricePerBag: 22,
    });
    expect(res.primaryResult.value).toBe(43);
    expect(res.secondaryResults[0].value).toBe(2);
  });

  it('Case 3: Recommends Unsanded Grout when joint is narrower than 1/8"', () => {
    const res = calculateGrout({
      areaSqFt: 100,
      tileLengthInches: 12,
      tileWidthInches: 24,
      jointWidthInches: 0.0625,
      jointDepthInches: 0.375,
      groutDensityLbPerCuFt: 100,
      bagSizeLbs: 25,
      wastePercent: 10,
      pricePerBag: 22,
    });
    expect(res.secondaryResults[3].value).toBe('Unsanded Grout');
  });
});

describe('8. Carpet Calculator Formula', () => {
  it('Case 1: 12x15 room (180 sq ft = 20 sq yd), 0% waste', () => {
    const res = calculateCarpet({
      roomLength: 15,
      roomWidth: 12,
      rollWidthFeet: 12,
      wastePercent: 0,
      pricePerSqYd: 27,
      padPricePerSqYd: 6.5,
    });
    expect(res.primaryResult.value).toBe(20);
    expect(res.secondaryResults[1].value).toBe(15);
  });

  it('Case 2: 12x12 room (144 sq ft) with 10% waste = 158.4 sq ft = 17.6 sq yd -> 18 sq yd', () => {
    const res = calculateCarpet({
      roomLength: 12,
      roomWidth: 12,
      rollWidthFeet: 12,
      wastePercent: 10,
      pricePerSqYd: 27,
      padPricePerSqYd: 6.5,
    });
    expect(res.primaryResult.exactValue).toBe(17.6);
    expect(res.primaryResult.value).toBe(18);
  });

  it('Case 3: 15x20 room (300 sq ft) with 10% waste = 330 sq ft -> 37 sq yd', () => {
    const res = calculateCarpet({
      roomLength: 20,
      roomWidth: 15,
      rollWidthFeet: 12,
      wastePercent: 10,
      pricePerSqYd: 27,
      padPricePerSqYd: 6.5,
    });
    expect(res.primaryResult.value).toBe(37);
  });
});

describe('9. Baseboard / Trim Calculator Formula', () => {
  it('Case 1: 50ft perimeter, 2 doors (3ft each), 10% waste, 8ft boards', () => {
    // Net = 50 - 6 = 44 ft. With 10% waste = 48.4 ft. 48.4 / 8 = 6.05 -> 7 boards.
    const res = calculateBaseboardTrim({
      roomPerimeter: 50,
      doorCount: 2,
      doorWidthFeet: 3,
      boardLengthFeet: 8,
      wastePercent: 10,
      pricePerLinearFoot: 1.85,
    });
    expect(res.secondaryResults[0].value).toBe(48.4);
    expect(res.primaryResult.value).toBe(7);
  });

  it('Case 2: 72ft perimeter, 2 doors, 10% waste, 12ft boards', () => {
    // Net = 66 * 1.1 = 72.6 ft -> 72.6 / 12 = 6.05 -> 7 boards
    const res = calculateBaseboardTrim({
      roomPerimeter: 72,
      doorCount: 2,
      doorWidthFeet: 3,
      boardLengthFeet: 12,
      wastePercent: 10,
      pricePerLinearFoot: 1.85,
    });
    expect(res.primaryResult.value).toBe(7);
  });

  it('Case 3: 16ft boards for 100ft perimeter, 0 doors, 0% waste -> 7 boards', () => {
    const res = calculateBaseboardTrim({
      roomPerimeter: 100,
      doorCount: 0,
      doorWidthFeet: 3,
      boardLengthFeet: 16,
      wastePercent: 0,
      pricePerLinearFoot: 1.85,
    });
    expect(res.primaryResult.value).toBe(7);
  });
});

describe('10. Concrete Slab Calculator Formula', () => {
  it('Case 1: 10x10 slab, 4" thick, 0% waste -> 33.33 cu ft = 1.23 cu yd = 56 bags (80-lb)', () => {
    // 10 * 10 * (4/12) = 33.3333 cu ft. / 27 = 1.2345 cu yd. / 0.6 = 55.55 -> 56 bags.
    const res = calculateConcreteSlab({
      lengthFeet: 10,
      widthFeet: 10,
      thicknessInches: 4,
      bagSizeLbs: 80,
      wastePercent: 0,
      pricePerBag: 6.85,
      readyMixPricePerCuYd: 165,
    });
    expect(res.primaryResult.value).toBe(1.23);
    expect(res.secondaryResults[0].value).toBe(56);
    expect(res.secondaryResults[1].value).toBe(75); // 60-lb bags
    expect(res.secondaryResults[2].value).toBe(112); // 40-lb bags
  });

  it('Case 2: 12x20 slab, 4" thick, 10% waste -> 88 cu ft = 3.26 cu yd = 147 bags (80-lb)', () => {
    const res = calculateConcreteSlab({
      lengthFeet: 20,
      widthFeet: 12,
      thicknessInches: 4,
      bagSizeLbs: 80,
      wastePercent: 10,
      pricePerBag: 6.85,
      readyMixPricePerCuYd: 165,
    });
    expect(res.primaryResult.value).toBe(3.26);
    expect(res.secondaryResults[0].value).toBe(147);
  });

  it('Case 3: 20x20 garage slab, 6" thick, 10% waste -> 220 cu ft = 8.15 cu yd', () => {
    const res = calculateConcreteSlab({
      lengthFeet: 20,
      widthFeet: 20,
      thicknessInches: 6,
      bagSizeLbs: 80,
      wastePercent: 10,
      pricePerBag: 6.85,
      readyMixPricePerCuYd: 165,
    });
    expect(res.primaryResult.value).toBe(8.15);
  });
});

describe('11. Concrete Footing Calculator Formula', () => {
  it('Case 1: 12" diameter cylinder, 42" deep (3.5 ft), qty 1, 0% waste', () => {
    // r = 0.5 ft. Vol = pi * 0.25 * 3.5 = 2.7489 cu ft. Bags (80lb) = 2.7489 / 0.6 = 4.58 -> 5 bags
    const res = calculateConcreteFooting({
      shape: 'cylinder',
      diameterInches: 12,
      depthInches: 42,
      rectLengthInches: 16,
      rectWidthInches: 16,
      quantity: 1,
      bagSizeLbs: 80,
      wastePercent: 0,
      pricePerBag: 6.85,
    });
    expect(res.secondaryResults[0].value).toBe(2.75);
    expect(res.primaryResult.value).toBe(5);
  });

  it('Case 2: 6 deck piers, 12" diameter × 48" deep, 10% waste', () => {
    // 1 pier = pi * 0.25 * 4 = 3.1416 cu ft. * 6 * 1.1 = 20.73 cu ft. / 0.6 = 34.56 -> 35 bags
    const res = calculateConcreteFooting({
      shape: 'cylinder',
      diameterInches: 12,
      depthInches: 48,
      rectLengthInches: 16,
      rectWidthInches: 16,
      quantity: 6,
      bagSizeLbs: 80,
      wastePercent: 10,
      pricePerBag: 6.85,
    });
    expect(res.primaryResult.value).toBe(35);
  });

  it('Case 3: Rectangular footing 24"x24"x12" (2x2x1 = 4 cu ft), qty 2, 0% waste = 8 cu ft = 14 bags', () => {
    const res = calculateConcreteFooting({
      shape: 'rectangular',
      diameterInches: 12,
      depthInches: 12,
      rectLengthInches: 24,
      rectWidthInches: 24,
      quantity: 2,
      bagSizeLbs: 80,
      wastePercent: 0,
      pricePerBag: 6.85,
    });
    expect(res.secondaryResults[2].value).toBe(8);
    expect(res.primaryResult.value).toBe(14);
  });
});

describe('12. Concrete Steps Calculator Formula', () => {
  it('Case 1: 3 steps, 7.5" rise, 11" tread, 4ft wide, 0ft landing, 0% waste', () => {
    // riseFt = 0.625, runFt = 11/12 = 0.91667, width = 4. Sum(1..3) = 6.
    // Vol = 4 * 0.625 * 0.91667 * 6 = 13.75 cu ft.
    const res = calculateConcreteSteps({
      stepCount: 3,
      riserHeightInches: 7.5,
      treadDepthInches: 11,
      stairWidthFeet: 4,
      landingDepthFeet: 0,
      wastePercent: 0,
      pricePerBag80Lb: 6.85,
    });
    expect(res.secondaryResults[1].value).toBe(13.8);
    expect(res.secondaryResults[0].value).toBe(23);
  });

  it('Case 2: 3 steps + 3ft landing, 4ft wide, 0% waste', () => {
    // Landing = 4 * (3 * 0.625) * 3 = 22.5 cu ft. Total = 13.75 + 22.5 = 36.25 cu ft = 61 bags
    const res = calculateConcreteSteps({
      stepCount: 3,
      riserHeightInches: 7.5,
      treadDepthInches: 11,
      stairWidthFeet: 4,
      landingDepthFeet: 3,
      wastePercent: 0,
      pricePerBag80Lb: 6.85,
    });
    expect(res.secondaryResults[2].value).toBe(22.5);
    expect(res.secondaryResults[0].value).toBe(61);
  });

  it('Case 3: 5 steps + 4ft landing with 10% waste', () => {
    const res = calculateConcreteSteps({
      stepCount: 5,
      riserHeightInches: 7.5,
      treadDepthInches: 11,
      stairWidthFeet: 4,
      landingDepthFeet: 4,
      wastePercent: 10,
      pricePerBag80Lb: 6.85,
    });
    expect(res.primaryResult.value).toBe(3.44);
  });
});

describe('13. Brick Calculator Formula', () => {
  it('Case 1: 100 sq ft wall, 0 openings, 6.75 bricks/sq ft, 5% waste -> 709 bricks', () => {
    // 100 * 6.75 * 1.05 = 708.75 -> 709 bricks. Mortar @ 35/bag = 20.25 -> 21 bags.
    const res = calculateBrick({
      wallLengthFeet: 25,
      wallHeightFeet: 4,
      openingsSqFt: 0,
      bricksPerSqFt: 6.75,
      bricksPerMortarBag: 35,
      wastePercent: 5,
      pricePerBrick: 0.85,
      pricePerMortarBag: 11.5,
    });
    expect(res.primaryResult.value).toBe(709);
    expect(res.secondaryResults[0].value).toBe(21);
  });

  it('Case 2: 200 sq ft wall minus 20 sq ft window = 180 sq ft, 0% waste -> 1215 bricks', () => {
    const res = calculateBrick({
      wallLengthFeet: 25,
      wallHeightFeet: 8,
      openingsSqFt: 20,
      bricksPerSqFt: 6.75,
      bricksPerMortarBag: 35,
      wastePercent: 0,
      pricePerBrick: 0.85,
      pricePerMortarBag: 11.5,
    });
    expect(res.primaryResult.value).toBe(1215);
  });

  it('Case 3: Custom queen brick size (5.0 bricks/sq ft) on 100 sq ft wall, 10% waste = 550 bricks', () => {
    const res = calculateBrick({
      wallLengthFeet: 20,
      wallHeightFeet: 5,
      openingsSqFt: 0,
      bricksPerSqFt: 5,
      bricksPerMortarBag: 35,
      wastePercent: 10,
      pricePerBrick: 0.95,
      pricePerMortarBag: 11.5,
    });
    expect(res.primaryResult.value).toBe(550);
  });
});

describe('14. Paver Patio Calculator Formula', () => {
  it('Case 1: 10x12 patio (120 sq ft), 4x8" pavers (4.5/sq ft), 10% waste -> 594 pavers', () => {
    // 120 / (32/144) * 1.1 = 540 * 1.1 = 594 pavers.
    // Gravel @ 4" = 120 * (4/12) / 27 = 1.48 cu yd (2.07 tons).
    // Sand @ 1" = 120 * (1/12) / 27 = 0.37 cu yd (0.50 tons).
    const res = calculatePaverPatio({
      patioLengthFeet: 12,
      patioWidthFeet: 10,
      paverLengthInches: 8,
      paverWidthInches: 4,
      gravelBaseDepthInches: 4,
      sandDepthInches: 1,
      wastePercent: 10,
      pricePerPaver: 0.95,
      gravelPricePerTon: 48,
      sandPricePerTon: 52,
    });
    expect(res.primaryResult.value).toBe(594);
    expect(res.materials[1].quantity).toBe(2.07);
    expect(res.materials[2].quantity).toBe(0.5);
  });

  it('Case 2: 12x12 patio (144 sq ft) with 12x12" pavers, 5% waste -> 152 pavers', () => {
    const res = calculatePaverPatio({
      patioLengthFeet: 12,
      patioWidthFeet: 12,
      paverLengthInches: 12,
      paverWidthInches: 12,
      gravelBaseDepthInches: 6,
      sandDepthInches: 1,
      wastePercent: 5,
      pricePerPaver: 2.5,
      gravelPricePerTon: 48,
      sandPricePerTon: 52,
    });
    expect(res.primaryResult.value).toBe(152);
  });

  it('Case 3: 20x20 patio (400 sq ft) with 6" gravel base = 7.41 cu yd', () => {
    const res = calculatePaverPatio({
      patioLengthFeet: 20,
      patioWidthFeet: 20,
      paverLengthInches: 8,
      paverWidthInches: 4,
      gravelBaseDepthInches: 6,
      sandDepthInches: 1,
      wastePercent: 10,
      pricePerPaver: 0.95,
      gravelPricePerTon: 48,
      sandPricePerTon: 52,
    });
    expect(res.primaryResult.value).toBe(1980);
    expect(res.materials[1].quantity).toBe(10.37);
  });
});

describe('15. Retaining Wall Calculator Formula', () => {
  it('Case 1: 20ft long × 3ft high, 16"×6" blocks, +1 buried row, 0% waste', () => {
    // Blocks per row = ceil(240 / 16) = 15. Exposed rows = ceil(36 / 6) = 6 + 1 buried = 7 rows.
    // Total blocks = 15 * 7 = 105 blocks. Caps = 15.
    const res = calculateRetainingWall({
      wallLengthFeet: 20,
      wallHeightFeet: 3,
      blockLengthInches: 16,
      blockHeightInches: 6,
      includeBuriedRow: true,
      wastePercent: 0,
      pricePerBlock: 5.25,
      pricePerCapBlock: 4.5,
    });
    expect(res.primaryResult.value).toBe(105);
    expect(res.secondaryResults[0].value).toBe(15);
    expect(res.secondaryResults[2].value).toBe(7);
  });

  it('Case 2: Same wall without buried row and 5% waste', () => {
    // 15 * 6 * 1.05 = 94.5 -> 95 blocks
    const res = calculateRetainingWall({
      wallLengthFeet: 20,
      wallHeightFeet: 3,
      blockLengthInches: 16,
      blockHeightInches: 6,
      includeBuriedRow: false,
      wastePercent: 5,
      pricePerBlock: 5.25,
      pricePerCapBlock: 4.5,
    });
    expect(res.primaryResult.value).toBe(95);
  });

  it('Case 3: 12"×4" garden wall blocks on 15ft × 2ft wall (+buried row, 5% waste)', () => {
    const res = calculateRetainingWall({
      wallLengthFeet: 15,
      wallHeightFeet: 2,
      blockLengthInches: 12,
      blockHeightInches: 4,
      includeBuriedRow: true,
      wastePercent: 5,
      pricePerBlock: 2.75,
      pricePerCapBlock: 3.25,
    });
    // 15 blocks/row * 7 rows * 1.05 = 110.25 -> 111 blocks
    expect(res.primaryResult.value).toBe(111);
  });
});

describe('16. Rebar Calculator Formula', () => {
  it('Case 1: 20x20 slab, 18" OC, 3" edge clearance, 20ft bars, 10% overlap', () => {
    // Net = 19.5 x 19.5 ft. Rows = floor(19.5 / 1.5) + 1 = 14 rows each way.
    // Net linear ft = 14 * 19.5 + 14 * 19.5 = 546 ft. * 1.1 = 600.6 ft. / 20 = 30.03 -> 31 bars.
    const res = calculateRebar({
      slabLengthFeet: 20,
      slabWidthFeet: 20,
      gridSpacingInches: 18,
      edgeClearanceInches: 3,
      barLengthFeet: 20,
      overlapWastePercent: 10,
      pricePerBar: 13.5,
    });
    expect(res.secondaryResults[0].value).toBe(600.6);
    expect(res.primaryResult.value).toBe(31);
  });

  it('Case 2: 12" OC spacing increases bar count accordingly', () => {
    const res = calculateRebar({
      slabLengthFeet: 20,
      slabWidthFeet: 20,
      gridSpacingInches: 12,
      edgeClearanceInches: 3,
      barLengthFeet: 20,
      overlapWastePercent: 10,
      pricePerBar: 13.5,
    });
    // Net 19.5 -> floor(19.5/1) + 1 = 20 rows each way. 40 * 19.5 * 1.1 = 858 ft -> 43 bars.
    expect(res.primaryResult.value).toBe(43);
  });

  it('Case 3: 10x10 patio slab at 18" OC, 0% overlap', () => {
    const res = calculateRebar({
      slabLengthFeet: 10,
      slabWidthFeet: 10,
      gridSpacingInches: 18,
      edgeClearanceInches: 3,
      barLengthFeet: 20,
      overlapWastePercent: 0,
      pricePerBar: 13.5,
    });
    // Net 9.5 ft -> floor(9.5/1.5)+1 = 7 rows each way. 14 * 9.5 = 133 ft -> 7 bars.
    expect(res.primaryResult.value).toBe(7);
  });
});

describe('17. Roofing Calculator Formula', () => {
  it('Case 1: 2,000 sq ft footprint (50x40), 6/12 pitch (1.118), 10% waste, 3 bundles/sq', () => {
    // Net roof area = 2000 * sqrt(1 + 0.25) = 2236.07 sq ft.
    // With 10% waste = 2459.67 sq ft = 24.60 squares. * 3 = 73.79 -> 74 bundles.
    const res = calculateRoofing({
      footprintLengthFeet: 50,
      footprintWidthFeet: 40,
      pitchRise: 6,
      bundlesPerSquare: 3,
      ridgeLengthFeet: 50,
      wastePercent: 10,
      pricePerBundle: 42,
      underlaymentRollSqFt: 1000,
    });
    expect(res.secondaryResults[2].value).toBe(1.118);
    expect(res.secondaryResults[0].value).toBe(24.6);
    expect(res.primaryResult.value).toBe(74);
  });

  it('Case 2: 4/12 pitch factor = 1.054, 12/12 pitch factor = 1.414', () => {
    const res4 = calculateRoofing({
      footprintLengthFeet: 40,
      footprintWidthFeet: 25,
      pitchRise: 4,
      bundlesPerSquare: 3,
      ridgeLengthFeet: 40,
      wastePercent: 0,
      pricePerBundle: 42,
      underlaymentRollSqFt: 1000,
    });
    const res12 = calculateRoofing({
      footprintLengthFeet: 40,
      footprintWidthFeet: 25,
      pitchRise: 12,
      bundlesPerSquare: 3,
      ridgeLengthFeet: 40,
      wastePercent: 0,
      pricePerBundle: 42,
      underlaymentRollSqFt: 1000,
    });
    expect(res4.secondaryResults[2].value).toBe(1.054);
    expect(res12.secondaryResults[2].value).toBe(1.414);
  });

  it('Case 3: 8/12 pitch factor = 1.202 on 1,500 sq ft footprint with 15% hip-roof waste', () => {
    const res = calculateRoofing({
      footprintLengthFeet: 50,
      footprintWidthFeet: 30,
      pitchRise: 8,
      bundlesPerSquare: 3,
      ridgeLengthFeet: 50,
      wastePercent: 15,
      pricePerBundle: 42,
      underlaymentRollSqFt: 1000,
    });
    expect(res.secondaryResults[2].value).toBe(1.202);
    expect(res.primaryResult.value).toBe(63);
  });
});

describe('18. Roof Pitch Calculator Formula', () => {
  it('Case 1: 6/12 pitch -> 26.57 degrees, 50% grade, 1.118 multiplier', () => {
    const res = calculateRoofPitch({
      riseInches: 6,
      runInches: 12,
      buildingSpanFeet: 24,
    });
    expect(res.primaryResult.value).toBe(6);
    expect(res.secondaryResults[0].value).toBe(26.57);
    expect(res.secondaryResults[1].value).toBe(1.118);
    expect(res.secondaryResults[2].value).toBe(50);
  });

  it('Case 2: 12/12 pitch -> 45 degrees, 100% grade, 1.414 multiplier', () => {
    const res = calculateRoofPitch({
      riseInches: 12,
      runInches: 12,
      buildingSpanFeet: 20,
    });
    expect(res.secondaryResults[0].value).toBe(45);
    expect(res.secondaryResults[1].value).toBe(1.414);
    expect(res.secondaryResults[2].value).toBe(100);
  });

  it('Case 3: 4" rise over 12" run -> 18.43 degrees, 1.054 multiplier', () => {
    const res = calculateRoofPitch({
      riseInches: 4,
      runInches: 12,
      buildingSpanFeet: 30,
    });
    expect(res.secondaryResults[0].value).toBe(18.43);
    expect(res.secondaryResults[1].value).toBe(1.054);
  });
});

describe('19. Gutter Calculator Formula', () => {
  it('Case 1: 100ft eaves, 2 runs, 10ft story, 35ft/downspout, 24" hangers, 10% waste', () => {
    // 110 ft / 10 = 11 sections. Downspouts = ceil(100/35) = 3. Hangers = ceil(1200/24)+2 = 52.
    const res = calculateGutter({
      eaveLengthFeet: 100,
      gutterRunCount: 2,
      storyHeightFeet: 10,
      feetPerDownspout: 35,
      hangerSpacingInches: 24,
      wastePercent: 10,
      pricePerTenFootGutter: 18.5,
    });
    expect(res.primaryResult.value).toBe(11);
    expect(res.secondaryResults[0].value).toBe(3);
    expect(res.secondaryResults[2].value).toBe(52);
  });

  it('Case 2: 200ft eaves on 2-story home (20ft height)', () => {
    const res = calculateGutter({
      eaveLengthFeet: 200,
      gutterRunCount: 4,
      storyHeightFeet: 20,
      feetPerDownspout: 35,
      hangerSpacingInches: 24,
      wastePercent: 10,
      pricePerTenFootGutter: 18.5,
    });
    expect(res.primaryResult.value).toBe(22);
    expect(res.secondaryResults[0].value).toBe(6);
    expect(res.secondaryResults[1].value).toBe(12);
  });

  it('Case 3: Heavy snow load 16" OC hanger spacing on 80ft eaves', () => {
    const res = calculateGutter({
      eaveLengthFeet: 80,
      gutterRunCount: 2,
      storyHeightFeet: 10,
      feetPerDownspout: 40,
      hangerSpacingInches: 16,
      wastePercent: 0,
      pricePerTenFootGutter: 18.5,
    });
    expect(res.secondaryResults[2].value).toBe(62);
  });
});

describe('20. Siding Calculator Formula', () => {
  it('Case 1: 150ft perim × 10ft walls, 2 gables (24x6), 2 doors, 8 windows, 1 garage, 10% waste', () => {
    // Walls = 1500 + 144 = 1644. Openings = 42 + 120 + 112 = 274. Net = 1370 sq ft.
    // With 10% waste = 1507 sq ft = 15.07 squares -> 16 squares.
    const res = calculateSiding({
      wallPerimeterFeet: 150,
      wallHeightFeet: 10,
      gableCount: 2,
      gableWidthFeet: 24,
      gableHeightFeet: 6,
      doors: 2,
      windows: 8,
      garageDoors: 1,
      outsideCorners: 4,
      wastePercent: 10,
      pricePerSquare: 145,
    });
    expect(res.secondaryResults[1].value).toBe(1370);
    expect(res.primaryResult.exactValue).toBe(15.07);
    expect(res.primaryResult.value).toBe(16);
  });

  it('Case 2: Simple shed 40ft perimeter × 8ft walls, 1 door, 0 windows, 0% waste -> 299 sq ft -> 3 squares', () => {
    const res = calculateSiding({
      wallPerimeterFeet: 40,
      wallHeightFeet: 8,
      gableCount: 0,
      gableWidthFeet: 0,
      gableHeightFeet: 0,
      doors: 1,
      windows: 0,
      garageDoors: 0,
      outsideCorners: 4,
      wastePercent: 0,
      pricePerSquare: 145,
    });
    expect(res.primaryResult.value).toBe(3);
  });

  it('Case 3: Two-story home (160ft × 18ft) corner posts calculation', () => {
    const res = calculateSiding({
      wallPerimeterFeet: 160,
      wallHeightFeet: 18,
      gableCount: 2,
      gableWidthFeet: 28,
      gableHeightFeet: 8,
      doors: 2,
      windows: 14,
      garageDoors: 1,
      outsideCorners: 4,
      wastePercent: 10,
      pricePerSquare: 145,
    });
    // 4 corners * 18 ft / 10 = 7.2 -> 8 corner posts
    expect(res.secondaryResults[2].value).toBe(8);
  });
});

describe('21. Mulch Calculator Formula', () => {
  it('Case 1: 270 sq ft bed (27x10) at 3" depth, 0% waste -> 67.5 cu ft = 2.5 cu yd = 34 bags (2 cu ft)', () => {
    const res = calculateMulch({
      bedShape: 'rectangle',
      lengthFeet: 27,
      widthFeet: 10,
      diameterFeet: 0,
      depthInches: 3,
      bagSizeCuFt: 2,
      wastePercent: 0,
      pricePerBag: 4.25,
      bulkPricePerCuYd: 38,
    });
    expect(res.primaryResult.value).toBe(2.5);
    expect(res.secondaryResults[0].value).toBe(34);
  });

  it('Case 2: Circular tree bed 10ft diameter at 3" depth, 0% waste', () => {
    // Area = pi * 25 = 78.54 sq ft. Cu ft = 19.635. Cu yd = 0.73. Bags = 10.
    const res = calculateMulch({
      bedShape: 'circle',
      lengthFeet: 0,
      widthFeet: 0,
      diameterFeet: 10,
      depthInches: 3,
      bagSizeCuFt: 2,
      wastePercent: 0,
      pricePerBag: 4.25,
      bulkPricePerCuYd: 38,
    });
    expect(res.primaryResult.value).toBe(0.73);
    expect(res.secondaryResults[0].value).toBe(10);
  });

  it('Case 3: 500 sq ft bed at 4" depth with 5% waste', () => {
    const res = calculateMulch({
      bedShape: 'rectangle',
      lengthFeet: 50,
      widthFeet: 10,
      diameterFeet: 0,
      depthInches: 4,
      bagSizeCuFt: 2,
      wastePercent: 5,
      pricePerBag: 4.25,
      bulkPricePerCuYd: 38,
    });
    expect(res.primaryResult.value).toBe(6.48);
    expect(res.secondaryResults[0].value).toBe(88);
  });
});

describe('22. Gravel Calculator Formula', () => {
  it('Case 1: 10x50 driveway (500 sq ft) at 4" depth, 1.4 tons/cu yd, 0% waste', () => {
    // Cu yd = 500 * (4/12) / 27 = 6.1728 cu yd. Tons = 6.1728 * 1.4 = 8.64 tons.
    const res = calculateGravel({
      lengthFeet: 50,
      widthFeet: 10,
      depthInches: 4,
      densityTonsPerCuYd: 1.4,
      wastePercent: 0,
      pricePerTon: 52,
    });
    expect(res.secondaryResults[0].value).toBe(6.17);
    expect(res.primaryResult.value).toBe(8.64);
  });

  it('Case 2: Pea gravel path (1.35 tons/cu yd) 3x30 ft at 3" depth, 10% waste', () => {
    const res = calculateGravel({
      lengthFeet: 30,
      widthFeet: 3,
      depthInches: 3,
      densityTonsPerCuYd: 1.35,
      wastePercent: 10,
      pricePerTon: 55,
    });
    expect(res.secondaryResults[0].value).toBe(0.92);
    expect(res.primaryResult.value).toBe(1.24);
  });

  it('Case 3: 20x20 parking pad at 6" depth, 10% waste', () => {
    const res = calculateGravel({
      lengthFeet: 20,
      widthFeet: 20,
      depthInches: 6,
      densityTonsPerCuYd: 1.4,
      wastePercent: 10,
      pricePerTon: 52,
    });
    expect(res.primaryResult.value).toBe(11.41);
  });
});

describe('23. Topsoil Calculator Formula', () => {
  it('Case 1: 4x8 raised bed (32 sq ft) at 12" depth, 0% waste -> 32 cu ft = 1.19 cu yd', () => {
    const res = calculateTopsoil({
      lengthFeet: 8,
      widthFeet: 4,
      depthInches: 12,
      bagSizeCuFt: 0.75,
      densityTonsPerCuYd: 1.1,
      wastePercent: 0,
      pricePerBag: 3.48,
      bulkPricePerCuYd: 42,
    });
    expect(res.primaryResult.value).toBe(1.19);
    expect(res.secondaryResults[0].value).toBe(43); // 32 / 0.75 = 42.67 -> 43 bags
  });

  it('Case 2: 1,000 sq ft lawn topdressing at 2" depth, 10% waste', () => {
    const res = calculateTopsoil({
      lengthFeet: 50,
      widthFeet: 20,
      depthInches: 2,
      bagSizeCuFt: 1,
      densityTonsPerCuYd: 1.1,
      wastePercent: 10,
      pricePerBag: 3.98,
      bulkPricePerCuYd: 42,
    });
    expect(res.primaryResult.value).toBe(6.79);
  });

  it('Case 3: Weight calculation at 1.1 tons/cu yd for 10 cu yd = 11 tons', () => {
    const res = calculateTopsoil({
      lengthFeet: 27,
      widthFeet: 20,
      depthInches: 6,
      bagSizeCuFt: 1,
      densityTonsPerCuYd: 1.1,
      wastePercent: 0,
      pricePerBag: 3.48,
      bulkPricePerCuYd: 42,
    });
    expect(res.primaryResult.value).toBe(10);
    expect(res.secondaryResults[1].value).toBe(11);
  });
});

describe('24. Sod Calculator Formula', () => {
  it('Case 1: 1,000 sq ft lawn + 5% waste = 1,050 sq ft -> 105 rolls (10 sq ft) & 2.33 pallets (450 sq ft)', () => {
    const res = calculateSod({
      lawnLengthFeet: 40,
      lawnWidthFeet: 25,
      additionalSqFt: 0,
      rollSqFt: 10,
      sqFtPerPallet: 450,
      wastePercent: 5,
      pricePerSqFt: 0.65,
    });
    expect(res.primaryResult.value).toBe(105);
    expect(res.secondaryResults[0].value).toBe(2.33);
  });

  it('Case 2: 450 sq ft lawn with 0% waste = 1.0 pallet & 50 rolls (9 sq ft/roll)', () => {
    const res = calculateSod({
      lawnLengthFeet: 30,
      lawnWidthFeet: 15,
      additionalSqFt: 0,
      rollSqFt: 9,
      sqFtPerPallet: 450,
      wastePercent: 0,
      pricePerSqFt: 0.65,
    });
    expect(res.primaryResult.value).toBe(50);
    expect(res.secondaryResults[0].value).toBe(1);
  });

  it('Case 3: Includes additional irregular sq ft', () => {
    const res = calculateSod({
      lawnLengthFeet: 20,
      lawnWidthFeet: 20,
      additionalSqFt: 100,
      rollSqFt: 10,
      sqFtPerPallet: 500,
      wastePercent: 0,
      pricePerSqFt: 0.65,
    });
    expect(res.primaryResult.value).toBe(50);
    expect(res.secondaryResults[0].value).toBe(1);
  });
});

describe('25. Grass Seed Calculator Formula', () => {
  it('Case 1: 5,000 sq ft lawn @ 8 lbs/1,000 sq ft (Tall Fescue), 0% waste -> 40 lbs (2 × 20-lb bags)', () => {
    const res = calculateGrassSeed({
      lawnLengthFeet: 100,
      lawnWidthFeet: 50,
      seedRatePer1000SqFt: 8,
      bagSizeLbs: 20,
      wastePercent: 0,
      pricePerLb: 3.8,
    });
    expect(res.primaryResult.value).toBe(40);
    expect(res.secondaryResults[0].value).toBe(2);
  });

  it('Case 2: 2,500 sq ft lawn @ 3 lbs/1,000 sq ft (Kentucky Bluegrass), 5% waste -> 8 lbs', () => {
    const res = calculateGrassSeed({
      lawnLengthFeet: 50,
      lawnWidthFeet: 50,
      seedRatePer1000SqFt: 3,
      bagSizeLbs: 7,
      wastePercent: 5,
      pricePerLb: 4.5,
    });
    expect(res.primaryResult.exactValue).toBe(7.88);
    expect(res.primaryResult.value).toBe(8);
  });

  it('Case 3: 10,000 sq ft lawn overseeding @ 4 lbs/1,000 sq ft, 5% waste -> 42 lbs', () => {
    const res = calculateGrassSeed({
      lawnLengthFeet: 100,
      lawnWidthFeet: 100,
      seedRatePer1000SqFt: 4,
      bagSizeLbs: 20,
      wastePercent: 5,
      pricePerLb: 3.8,
    });
    expect(res.primaryResult.value).toBe(42);
  });
});

describe('26. Fence Calculator Formula', () => {
  it('Case 1: 100ft fence, 8ft spacing, 3 rails/section, 5.5" picket, 0" gap, 1 gate, 0% waste', () => {
    // Sections = ceil(100/8) = 13. Posts = 13 + 1 + 1 = 15. Rails = 13 * 3 = 39.
    // Pickets = ceil(1200 / 5.5) = 219.
    const res = calculateFence({
      fenceLengthFeet: 100,
      fenceHeightFeet: 6,
      postSpacingFeet: 8,
      railsPerSection: 3,
      picketWidthInches: 5.5,
      picketGapInches: 0,
      gateCount: 1,
      gateWidthFeet: 4,
      holeDiameterInches: 10,
      holeDepthInches: 30,
      wastePercent: 0,
      pricePerPicket: 3.15,
      pricePerPost: 16.5,
      pricePerRail: 7.5,
    });
    expect(res.secondaryResults[0].value).toBe(15);
    expect(res.secondaryResults[1].value).toBe(39);
    expect(res.primaryResult.value).toBe(219);
  });

  it('Case 2: Spaced picket fence (3.5" picket + 2" gap = 5.5" cycle) on 80ft run, 10% waste', () => {
    const res = calculateFence({
      fenceLengthFeet: 80,
      fenceHeightFeet: 4,
      postSpacingFeet: 8,
      railsPerSection: 2,
      picketWidthInches: 3.5,
      picketGapInches: 2,
      gateCount: 0,
      gateWidthFeet: 4,
      holeDiameterInches: 10,
      holeDepthInches: 24,
      wastePercent: 10,
      pricePerPicket: 2.5,
      pricePerPost: 14,
      pricePerRail: 7,
    });
    expect(res.secondaryResults[0].value).toBe(11);
    expect(res.primaryResult.value).toBe(192);
  });

  it('Case 3: 200ft privacy fence with 10% waste', () => {
    const res = calculateFence({
      fenceLengthFeet: 200,
      fenceHeightFeet: 6,
      postSpacingFeet: 8,
      railsPerSection: 3,
      picketWidthInches: 5.5,
      picketGapInches: 0,
      gateCount: 2,
      gateWidthFeet: 4,
      holeDiameterInches: 10,
      holeDepthInches: 30,
      wastePercent: 10,
      pricePerPicket: 3.15,
      pricePerPost: 16.5,
      pricePerRail: 7.5,
    });
    expect(res.secondaryResults[0].value).toBe(28);
    expect(res.primaryResult.value).toBe(480);
  });
});

describe('27. Deck Calculator Formula', () => {
  it('Case 1: 16x12 deck, 5.5" board + 0.125" gap, 16ft boards, 16" OC joists, 0% waste', () => {
    // Rows = 144 / 5.625 = 25.6. Boards/row = 16/16 = 1. Exact = 25.6 -> 26 boards.
    // Interior joists = ceil(192/16) + 1 = 13 + 2 rim/ledger = 15 joists.
    const res = calculateDeck({
      deckLengthFeet: 16,
      deckWidthFeet: 12,
      boardWidthInches: 5.5,
      boardGapInches: 0.125,
      boardLengthFeet: 16,
      joistSpacingInches: 16,
      fastenersPerSqFt: 3.5,
      wastePercent: 0,
      pricePerDeckBoard: 24,
      pricePerJoist: 19.5,
    });
    expect(res.primaryResult.value).toBe(26);
    expect(res.secondaryResults[0].value).toBe(15);
  });

  it('Case 2: 20x16 deck with 10% waste and 12" OC joists (for composite diagonal)', () => {
    const res = calculateDeck({
      deckLengthFeet: 20,
      deckWidthFeet: 16,
      boardWidthInches: 5.5,
      boardGapInches: 0.125,
      boardLengthFeet: 20,
      joistSpacingInches: 12,
      fastenersPerSqFt: 3.5,
      wastePercent: 10,
      pricePerDeckBoard: 48,
      pricePerJoist: 22,
    });
    expect(res.primaryResult.value).toBe(38);
    expect(res.secondaryResults[0].value).toBe(23);
  });

  it('Case 3: 12x12 deck using 12ft boards and 10% waste', () => {
    const res = calculateDeck({
      deckLengthFeet: 12,
      deckWidthFeet: 12,
      boardWidthInches: 5.5,
      boardGapInches: 0.125,
      boardLengthFeet: 12,
      joistSpacingInches: 16,
      fastenersPerSqFt: 3.5,
      wastePercent: 10,
      pricePerDeckBoard: 18,
      pricePerJoist: 16,
    });
    expect(res.primaryResult.value).toBe(29);
  });
});

describe('28. Drywall Calculator Formula', () => {
  it('Case 1: 12x12 room, 8ft walls + ceiling, 2 doors, 2 windows, 4x8 sheets, 10% waste', () => {
    // Walls = 384, Ceiling = 144, Openings = 72 -> Net = 456 sq ft.
    // With 10% waste = 501.6 sq ft. / 32 = 15.675 -> 16 sheets.
    // Mud = 4.56 * 1.125 = 5.13 gal -> 2 buckets (4.5-gal).
    const res = calculateDrywall({
      roomLengthFeet: 12,
      roomWidthFeet: 12,
      wallHeightFeet: 8,
      includeCeiling: true,
      doors: 2,
      windows: 2,
      sheetLengthFeet: 8,
      wastePercent: 10,
      compoundGallonsPer100SqFt: 1.125,
      screwsPerSheet: 32,
      pricePerSheet: 15.8,
    });
    expect(res.secondaryResults[0].value).toBe(456);
    expect(res.primaryResult.exactValue).toBe(15.68);
    expect(res.primaryResult.value).toBe(16);
    expect(res.secondaryResults[1].value).toBe('5.1 gal (2 buckets)');
    expect(res.secondaryResults[3].value).toBe(512); // 16 * 32 screws
  });

  it('Case 2: Same room using 4x12 sheets (48 sq ft) -> 11 sheets', () => {
    const res = calculateDrywall({
      roomLengthFeet: 12,
      roomWidthFeet: 12,
      wallHeightFeet: 8,
      includeCeiling: true,
      doors: 2,
      windows: 2,
      sheetLengthFeet: 12,
      wastePercent: 10,
      compoundGallonsPer100SqFt: 1.125,
      screwsPerSheet: 48,
      pricePerSheet: 22.5,
    });
    expect(res.primaryResult.value).toBe(11);
  });

  it('Case 3: Walls only (no ceiling) on 10x10 room, 8ft height, 0 openings, 0% waste -> 320 sq ft = 10 sheets, 1 bucket mud', () => {
    const res = calculateDrywall({
      roomLengthFeet: 10,
      roomWidthFeet: 10,
      wallHeightFeet: 8,
      includeCeiling: false,
      doors: 0,
      windows: 0,
      sheetLengthFeet: 8,
      wastePercent: 0,
      compoundGallonsPer100SqFt: 1.125,
      screwsPerSheet: 32,
      pricePerSheet: 15.8,
    });
    expect(res.primaryResult.value).toBe(10);
    expect(res.secondaryResults[1].value).toBe('3.6 gal (1 buckets)');
  });
});

describe('29. Stair Calculator Formula', () => {
  it('Case 1: 108" total rise, max riser 7.75", tread 10.5", width 36" -> 14 risers @ 7.71", 13 treads', () => {
    // ceil(108 / 7.75) = 14 risers. 108 / 14 = 7.714" riser. Treads = 13. Run = 13 * 10.5 = 136.5".
    // Stringer = sqrt(108^2 + 136.5^2) = 174.06". Passes IRC check!
    const res = calculateStair({
      totalRiseInches: 108,
      maxRiserInches: 7.75,
      treadDepthInches: 10.5,
      stairWidthInches: 36,
      stringerBoardPrice: 38,
      treadBoardPrice: 18,
    });
    expect(res.primaryResult.value).toBe(14);
    expect(res.secondaryResults[0].value).toBe(7.71);
    expect(res.secondaryResults[1].value).toBe(13);
    expect(res.complianceCheck?.passed).toBe(true);
  });

  it('Case 2: Deck stairs 36" total rise -> 5 risers @ 7.20", 4 treads @ 10.5" = 42" run', () => {
    const res = calculateStair({
      totalRiseInches: 36,
      maxRiserInches: 7.75,
      treadDepthInches: 10.5,
      stairWidthInches: 36,
      stringerBoardPrice: 38,
      treadBoardPrice: 18,
    });
    expect(res.primaryResult.value).toBe(5);
    expect(res.secondaryResults[0].value).toBe(7.2);
    expect(res.secondaryResults[1].value).toBe(4);
  });

  it('Case 3: Flags IRC non-compliance when tread depth < 10"', () => {
    const res = calculateStair({
      totalRiseInches: 108,
      maxRiserInches: 7.75,
      treadDepthInches: 9,
      stairWidthInches: 36,
      stringerBoardPrice: 38,
      treadBoardPrice: 18,
    });
    expect(res.complianceCheck?.passed).toBe(false);
  });
});

describe('30a. Square Footage Calculator Formula', () => {
  it('Case 1: Rectangle 15x20 = 300 sq ft (33.33 sq yd)', () => {
    const res = calculateSquareFootage({
      shape: 'rectangle',
      lengthFeet: 20,
      widthFeet: 15,
      secondLengthFeet: 0,
      secondWidthFeet: 0,
      diameterFeet: 0,
      wastePercent: 0,
      pricePerSqFt: 3.5,
    });
    expect(res.primaryResult.value).toBe(300);
    expect(res.secondaryResults[0].value).toBe(33.33);
  });

  it('Case 2: Circle with 20ft diameter = 314.16 sq ft', () => {
    const res = calculateSquareFootage({
      shape: 'circle',
      lengthFeet: 0,
      widthFeet: 0,
      secondLengthFeet: 0,
      secondWidthFeet: 0,
      diameterFeet: 20,
      wastePercent: 0,
      pricePerSqFt: 3.5,
    });
    expect(res.primaryResult.value).toBe(314.16);
  });

  it('Case 3: Trapezoid (bases 10 and 20, height 12) = 180 sq ft', () => {
    const res = calculateSquareFootage({
      shape: 'trapezoid',
      lengthFeet: 10,
      widthFeet: 12,
      secondLengthFeet: 20,
      secondWidthFeet: 0,
      diameterFeet: 0,
      wastePercent: 0,
      pricePerSqFt: 3.5,
    });
    expect(res.primaryResult.value).toBe(180);
  });
});

describe('30b. Cubic Yard Calculator Formula', () => {
  it('Case 1: 27x10 ft area at 12" depth, 0% waste = 270 cu ft = 10 cu yd', () => {
    const res = calculateCubicYard({
      shape: 'rectangle',
      lengthFeet: 27,
      widthFeet: 10,
      secondLengthFeet: 0,
      diameterFeet: 0,
      depthInches: 12,
      densityTonsPerCuYd: 1.4,
      wastePercent: 0,
      pricePerCuYd: 45,
    });
    expect(res.primaryResult.value).toBe(10);
    expect(res.secondaryResults[0].value).toBe(270);
    expect(res.secondaryResults[1].value).toBe(14);
  });

  it('Case 2: 10x10 area at 4" depth, 0% waste = 33.3 cu ft = 1.23 cu yd', () => {
    const res = calculateCubicYard({
      shape: 'rectangle',
      lengthFeet: 10,
      widthFeet: 10,
      secondLengthFeet: 0,
      diameterFeet: 0,
      depthInches: 4,
      densityTonsPerCuYd: 1.4,
      wastePercent: 0,
      pricePerCuYd: 45,
    });
    expect(res.primaryResult.value).toBe(1.23);
  });

  it('Case 3: Circle 12ft diameter at 6" depth, 0% waste = 2.09 cu yd', () => {
    const res = calculateCubicYard({
      shape: 'circle',
      lengthFeet: 0,
      widthFeet: 0,
      secondLengthFeet: 0,
      diameterFeet: 12,
      depthInches: 6,
      densityTonsPerCuYd: 1.4,
      wastePercent: 0,
      pricePerCuYd: 45,
    });
    expect(res.primaryResult.value).toBe(2.09);
  });
});

describe('30c. Board Foot Calculator Formula', () => {
  it('Case 1: 1" × 12" × 12 ft (144 in), qty 1 = 12 board feet', () => {
    const res = calculateBoardFoot({
      thicknessInches: 1,
      widthInches: 12,
      lengthFeet: 12,
      quantity: 1,
      wastePercent: 0,
      pricePerBoardFoot: 6.5,
    });
    expect(res.primaryResult.value).toBe(12);
  });

  it('Case 2: 2" × 4" × 8 ft, qty 10 = 53.33 board feet', () => {
    const res = calculateBoardFoot({
      thicknessInches: 2,
      widthInches: 4,
      lengthFeet: 8,
      quantity: 10,
      wastePercent: 0,
      pricePerBoardFoot: 6.5,
    });
    expect(res.primaryResult.value).toBe(53.33);
  });

  it('Case 3: 4" × 4" × 8 ft post, qty 4, +15% waste = 49.07 board feet', () => {
    // 1 post = (4*4*96)/144 = 10.6667 bd ft. * 4 = 42.6667 * 1.15 = 49.07
    const res = calculateBoardFoot({
      thicknessInches: 4,
      widthInches: 4,
      lengthFeet: 8,
      quantity: 4,
      wastePercent: 15,
      pricePerBoardFoot: 6.5,
    });
    expect(res.primaryResult.value).toBe(49.07);
  });
});

describe('State Cost Formula (Section 6)', () => {
  it('Case 1: National average inputs (wage ratio 1.0, RPP 100) yield multiplier 1.0000 and 0% diff', () => {
    const res = calculateStateCost({
      nationalLowPerUnit: 4.0,
      nationalTypicalPerUnit: 5.5,
      nationalHighPerUnit: 7.5,
      typicalProjectSize: 2000,
      laborShare: 0.6,
      stateTradeWage: 25.0,
      nationalTradeWage: 25.0,
      stateRpp: 100.0,
    });
    expect(res.multiplier).toBe(1);
    expect(res.percentDiffFromNational).toBe(0);
    expect(res.totalProject.typical).toBe(11000);
  });

  it('Case 2: High-cost state (wage $35 vs $25 = 1.4, RPP 112.5, laborShare 0.6) -> multiplier 1.29', () => {
    // 0.6 * (35/25) + 0.4 * (112.5/100) = 0.6 * 1.4 + 0.4 * 1.125 = 0.84 + 0.45 = 1.29
    const res = calculateStateCost({
      nationalLowPerUnit: 4.0,
      nationalTypicalPerUnit: 5.0,
      nationalHighPerUnit: 7.0,
      typicalProjectSize: 1000,
      laborShare: 0.6,
      stateTradeWage: 35.0,
      nationalTradeWage: 25.0,
      stateRpp: 112.5,
    });
    expect(res.multiplier).toBe(1.29);
    expect(res.percentDiffFromNational).toBe(29);
    expect(res.perUnit.typical).toBe(6.45);
    expect(res.totalProject.typical).toBe(6450);
  });

  it('Case 3: Lower-cost state (wage $20 vs $25 = 0.8, RPP 90.0, laborShare 0.5) -> multiplier 0.85', () => {
    // 0.5 * 0.8 + 0.5 * 0.9 = 0.40 + 0.45 = 0.85 (-15%)
    const res = calculateStateCost({
      nationalLowPerUnit: 10,
      nationalTypicalPerUnit: 20,
      nationalHighPerUnit: 30,
      typicalProjectSize: 100,
      laborShare: 0.5,
      stateTradeWage: 20,
      nationalTradeWage: 25,
      stateRpp: 90,
    });
    expect(res.multiplier).toBe(0.85);
    expect(res.percentDiffFromNational).toBe(-15);
    expect(res.totalProject.typical).toBe(1700);
  });
});
