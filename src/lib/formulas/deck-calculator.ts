import { ceilUnits, computeCostRange, roundTo, sumMaterialCosts } from './units';
import type { CalculationResult, QuickReferenceRow } from './types';

export interface DeckCalculatorInput {
  deckLengthFeet: number; // ft (along house ledger)
  deckWidthFeet: number; // ft (projection out from house)
  boardWidthInches: number; // default 5.5 in (5/4x6 or 2x6 actual width)
  boardGapInches: number; // default 0.125 in (1/8" gap)
  boardLengthFeet: number; // 12, 16, or 20 ft boards (default 16 ft)
  joistSpacingInches: number; // 12, 16, or 24 in OC (default 16" OC)
  fastenersPerSqFt: number; // default 3.5 screws/clips per sq ft
  wastePercent: number; // default 10%
  pricePerDeckBoard: number; // default $24 per 16-ft PT board ($48 for composite)
  pricePerJoist: number; // default $19.50 per 2x8/2x10 joist
}

/**
 * Deck Calculator Formula:
 * deck boards = rows (deck width ÷ (board width 5.5" + gap 1/8–3/16")) × boards per row (by length options 12/16/20 ft).
 * Joists at 16" OC (editable 12/16/24). Screws/hidden fasteners per sq ft (editable).
 */
export function calculateDeck(input: DeckCalculatorInput): CalculationResult {
  const L = Math.max(0, input.deckLengthFeet);
  const W = Math.max(0, input.deckWidthFeet);
  const areaSqFt = L * W;

  const bWidthIn = Math.max(2, input.boardWidthInches || 5.5);
  const gapIn = Math.max(0, input.boardGapInches ?? 0.125);
  const bLenFt = [12, 16, 20].includes(Number(input.boardLengthFeet))
    ? Number(input.boardLengthFeet)
    : Math.max(8, input.boardLengthFeet || 16);
  const joistOC = [12, 16, 24].includes(Number(input.joistSpacingInches))
    ? Number(input.joistSpacingInches)
    : 16;
  const wasteFactor = 1 + Math.max(0, input.wastePercent ?? 10) / 100;

  // Number of rows from house out to front rim joist
  const rows = (W * 12) / (bWidthIn + gapIn);
  const boardsPerRow = L / bLenFt;
  const exactDeckBoards = rows * boardsPerRow * wasteFactor;
  const roundedDeckBoards = ceilUnits(exactDeckBoards);

  // Framing joists + ledger + rim joists
  const interiorJoists = ceilUnits((L * 12) / joistOC) + 1;
  const rimAndLedgerBoards = ceilUnits((2 * L) / bLenFt);
  const totalFramingJoists = interiorJoists + rimAndLedgerBoards;
  const joistHangers = interiorJoists;

  // Fasteners
  const fastRate = Math.max(1, input.fastenersPerSqFt || 3.5);
  const totalFasteners = ceilUnits(areaSqFt * fastRate * 1.05);
  const fastenerBoxes = ceilUnits(totalFasteners / 350); // 350-count bucket

  const boardCost = computeCostRange(roundedDeckBoards, input.pricePerDeckBoard || 24);
  const joistCost = computeCostRange(totalFramingJoists, input.pricePerJoist || 19.5);
  const hardwareCost = computeCostRange(fastenerBoxes, 45);

  const materials = [
    {
      id: 'decking-surface-boards',
      name: `5/4×6 Decking Boards (${bLenFt}-ft Lengths)`,
      quantity: roundedDeckBoards,
      exactQuantity: roundTo(exactDeckBoards, 1),
      unit: `boards (${bLenFt} ft)`,
      unitPrice: input.pricePerDeckBoard || 24,
      totalLow: boardCost.low,
      totalTypical: boardCost.typical,
      totalHigh: boardCost.high,
      productId: 'prod-deck-boards',
      note: `${ceilUnits(rows)} rows across ${W} ft width (includes ${input.wastePercent ?? 10}% waste)`,
    },
    {
      id: 'deck-framing-joists',
      name: `2×8 / 2×10 Pressure-Treated Floor Joists (${joistOC}" OC)`,
      quantity: totalFramingJoists,
      exactQuantity: totalFramingJoists,
      unit: 'joists',
      unitPrice: input.pricePerJoist || 19.5,
      totalLow: joistCost.low,
      totalTypical: joistCost.typical,
      totalHigh: joistCost.high,
      productId: 'prod-deck-joists',
      note: `${interiorJoists} joists + ${rimAndLedgerBoards} ledger/rim boards + ${joistHangers} joist hangers`,
    },
    {
      id: 'deck-screws-fasteners',
      name: 'Exterior Deck Screws / Hidden Fasteners (350-ct Bucket)',
      quantity: fastenerBoxes,
      exactQuantity: roundTo(totalFasteners / 350, 2),
      unit: 'buckets',
      unitPrice: 45,
      totalLow: hardwareCost.low,
      totalTypical: hardwareCost.typical,
      totalHigh: hardwareCost.high,
      productId: 'prod-deck-screws',
      note: `${totalFasteners.toLocaleString()} total screws/clips (@ ${fastRate}/sq ft)`,
    },
  ];

  return {
    primaryResult: {
      label: `${bLenFt}-ft Deck Boards Needed`,
      value: roundedDeckBoards,
      exactValue: roundTo(exactDeckBoards, 1),
      unit: `boards (${bLenFt} ft)`,
      subtitle: `Covers ${roundTo(areaSqFt, 0)} sq ft (${ceilUnits(rows)} rows of ${bWidthIn}" boards)`,
    },
    secondaryResults: [
      {
        label: `Floor Joists + Rim (${joistOC}" OC)`,
        value: totalFramingJoists,
        unit: 'joists',
        highlight: true,
      },
      {
        label: 'Deck Surface Area',
        value: roundTo(areaSqFt, 0),
        unit: 'sq ft',
      },
      {
        label: 'Deck Screws / Fasteners',
        value: totalFasteners,
        unit: 'fasteners',
      },
      {
        label: 'Galvanized Joist Hangers',
        value: joistHangers,
        unit: 'hangers',
      },
    ],
    materials,
    costEstimate: sumMaterialCosts(materials),
  };
}

export function getDeckQuickReference(): QuickReferenceRow[] {
  const decks = [
    { name: '10×10 ft Entry Deck (100 sq ft)', l: 10, w: 10, bl: 12 },
    { name: '12×12 ft Backyard Deck (144 sq ft)', l: 12, w: 12, bl: 12 },
    { name: '12×16 ft Mid-Size Deck (192 sq ft)', l: 16, w: 12, bl: 16 },
    { name: '16×20 ft Entertaining Deck (320 sq ft)', l: 20, w: 16, bl: 20 },
    { name: '16×24 ft Large Family Deck (384 sq ft)', l: 24, w: 16, bl: 12 },
  ];
  return decks.map((d) => {
    const res = calculateDeck({
      deckLengthFeet: d.l,
      deckWidthFeet: d.w,
      boardWidthInches: 5.5,
      boardGapInches: 0.125,
      boardLengthFeet: d.bl,
      joistSpacingInches: 16,
      fastenersPerSqFt: 3.5,
      wastePercent: 10,
      pricePerDeckBoard: 24,
      pricePerJoist: 19.5,
    });
    return {
      scenario: d.name,
      col1: `${res.primaryResult.value} boards (${d.bl}-ft)`,
      col2: `${res.secondaryResults[0].value} joists (16" OC)`,
      col3: `${res.secondaryResults[2].value} screws`,
    };
  });
}
