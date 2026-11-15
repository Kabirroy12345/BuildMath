import { ceilUnits, computeCostRange, roundTo, sumMaterialCosts } from './units';
import type { CalculationResult, QuickReferenceRow } from './types';

export interface BaseboardTrimCalculatorInput {
  roomPerimeter: number; // linear ft
  doorCount: number; // number of doorways
  doorWidthFeet: number; // default 3 ft per door opening
  boardLengthFeet: number; // 8, 12, or 16 ft boards
  wastePercent: number; // default 10%
  pricePerLinearFoot: number; // default $1.85/linear ft
}

/**
 * Baseboard / Trim Calculator Formula:
 * net linear ft = (perimeter − door count × door width) × (1 + waste%)
 * pieces = ceil(net linear ft ÷ board length)
 */
export function calculateBaseboardTrim(input: BaseboardTrimCalculatorInput): CalculationResult {
  const perim = Math.max(0, input.roomPerimeter);
  const doors = Math.max(0, Math.floor(input.doorCount));
  const doorW = Math.max(0, input.doorWidthFeet || 3);
  const boardLen = [8, 12, 16].includes(Number(input.boardLengthFeet))
    ? Number(input.boardLengthFeet)
    : Math.max(4, input.boardLengthFeet || 8);
  const wasteFactor = 1 + Math.max(0, input.wastePercent ?? 10) / 100;

  const netPerimeter = Math.max(0, perim - doors * doorW);
  const totalLinearFt = netPerimeter * wasteFactor;

  const exactPieces = totalLinearFt / boardLen;
  const roundedPieces = ceilUnits(exactPieces);

  const pieces8ft = ceilUnits(totalLinearFt / 8);
  const pieces12ft = ceilUnits(totalLinearFt / 12);
  const pieces16ft = ceilUnits(totalLinearFt / 16);

  // Caulk tubes (~50 linear ft per 10-oz tube along top + bottom seams)
  const caulkTubes = Math.max(1, ceilUnits(totalLinearFt / 50));

  const unitBoardPrice = roundTo((input.pricePerLinearFoot || 1.85) * boardLen, 2);
  const trimCost = computeCostRange(roundedPieces, unitBoardPrice);
  const caulkCost = computeCostRange(caulkTubes, 6.5);

  const materials = [
    {
      id: 'baseboard-trim-boards',
      name: `Primed MDF / Pine Baseboard Moulding (${boardLen}-ft Boards)`,
      quantity: roundedPieces,
      exactQuantity: roundTo(exactPieces, 2),
      unit: `boards (${boardLen} ft)`,
      unitPrice: unitBoardPrice,
      totalLow: trimCost.low,
      totalTypical: trimCost.typical,
      totalHigh: trimCost.high,
      productId: 'prod-baseboard-trim',
      note: `${roundTo(totalLinearFt, 1)} total linear ft (includes ${input.wastePercent ?? 10}% miter cut waste)`,
    },
    {
      id: 'paintable-trim-caulk',
      name: 'Paintable Acrylic Latex Trim Caulk (10.1 oz) & 16-Ga Brad Nails',
      quantity: caulkTubes,
      exactQuantity: roundTo(totalLinearFt / 50, 2),
      unit: 'tubes',
      unitPrice: 6.5,
      totalLow: caulkCost.low,
      totalTypical: caulkCost.typical,
      totalHigh: caulkCost.high,
      productId: 'prod-trim-caulk',
      note: 'For sealing top wall gap and mitered corner joints',
    },
  ];

  return {
    primaryResult: {
      label: `${boardLen}-ft Baseboard Pieces Needed`,
      value: roundedPieces,
      exactValue: roundTo(exactPieces, 2),
      unit: `boards (${boardLen} ft)`,
      subtitle: `${roundTo(totalLinearFt, 1)} total linear ft needed after door deductions`,
    },
    secondaryResults: [
      {
        label: 'Total Linear Feet (w/ Waste)',
        value: roundTo(totalLinearFt, 1),
        unit: 'linear ft',
        highlight: true,
      },
      {
        label: 'If Buying 8-ft Boards',
        value: pieces8ft,
        unit: 'boards',
      },
      {
        label: 'If Buying 12-ft Boards',
        value: pieces12ft,
        unit: 'boards',
      },
      {
        label: 'If Buying 16-ft Boards',
        value: pieces16ft,
        unit: 'boards',
      },
    ],
    materials,
    costEstimate: sumMaterialCosts(materials),
  };
}

export function getBaseboardTrimQuickReference(): QuickReferenceRow[] {
  const rooms = [
    { name: 'Small Bathroom (28 ft perimeter, 1 door)', p: 28, d: 1 },
    { name: '10×12 ft Bedroom (44 ft perimeter, 2 doors)', p: 44, d: 2 },
    { name: '12×15 ft Bedroom (54 ft perimeter, 2 doors)', p: 54, d: 2 },
    { name: '16×20 ft Living Room (72 ft perimeter, 2 doors)', p: 72, d: 2 },
    { name: 'Whole Floor Remodel (220 ft perimeter, 8 doors)', p: 220, d: 8 },
  ];
  return rooms.map((r) => {
    const res = calculateBaseboardTrim({
      roomPerimeter: r.p,
      doorCount: r.d,
      doorWidthFeet: 3,
      boardLengthFeet: 8,
      wastePercent: 10,
      pricePerLinearFoot: 1.85,
    });
    return {
      scenario: r.name,
      col1: `${res.secondaryResults[0].value} linear ft`,
      col2: `${res.secondaryResults[1].value} pcs (8-ft)`,
      col3: `${res.secondaryResults[2].value} pcs (12-ft) / ${res.secondaryResults[3].value} pcs (16-ft)`,
    };
  });
}
