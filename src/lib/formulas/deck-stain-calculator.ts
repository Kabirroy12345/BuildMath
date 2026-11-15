import { ceilUnits, computeCostRange, roundTo, sumMaterialCosts } from './units';
import type { CalculationResult, QuickReferenceRow } from './types';

export interface DeckStainCalculatorInput {
  deckLength: number; // ft
  deckWidth: number; // ft
  railingLength: number; // linear ft
  railingHeight: number; // ft (default 3 ft)
  stairSteps: number; // number of steps
  stairWidth: number; // ft (default 4 ft)
  coats: number; // 1 or 2
  firstCoatCoverage: number; // default 200 sq ft/gal
  secondCoatCoverage: number; // default 300 sq ft/gal
  wastePercent: number; // default 5%
  pricePerGallon: number; // default $48
}

/**
 * Deck Stain Calculator Formula:
 * total area = deck area + railings (linear ft × height × 2 sides) + stairs.
 * Default coverage 200 sq ft/gal for the 1st coat, 300 sq ft/gal for the 2nd.
 */
export function calculateDeckStain(input: DeckStainCalculatorInput): CalculationResult {
  const deckArea = Math.max(0, input.deckLength) * Math.max(0, input.deckWidth);
  const railingArea =
    Math.max(0, input.railingLength) * Math.max(0, input.railingHeight || 3) * 2;
  // Each step has ~10" tread + ~7.5" riser = ~1.5 ft depth × stairWidth
  const stairsArea = Math.max(0, Math.floor(input.stairSteps)) * Math.max(0, input.stairWidth || 4) * 1.5;

  const totalStainableArea = deckArea + railingArea + stairsArea;
  const cov1 = Math.max(50, input.firstCoatCoverage || 200);
  const cov2 = Math.max(50, input.secondCoatCoverage || 300);
  const coats = Math.max(1, Math.min(3, Math.floor(input.coats || 2)));
  const wasteFactor = 1 + Math.max(0, input.wastePercent ?? 5) / 100;

  let rawGallons = totalStainableArea / cov1;
  if (coats >= 2) {
    rawGallons += totalStainableArea / cov2;
  }
  if (coats >= 3) {
    rawGallons += totalStainableArea / cov2;
  }

  const exactGallons = rawGallons * wasteFactor;
  const roundedGallons = ceilUnits(exactGallons);

  const stainCost = computeCostRange(roundedGallons, input.pricePerGallon || 48);
  const cleanerCost = computeCostRange(ceilUnits(totalStainableArea / 400), 22);

  const materials = [
    {
      id: 'deck-stain-gallon',
      name: 'Penetrating Exterior Wood Deck Stain (1-Gal)',
      quantity: roundedGallons,
      exactQuantity: roundTo(exactGallons, 2),
      unit: 'gallons',
      unitPrice: input.pricePerGallon || 48,
      totalLow: stainCost.low,
      totalTypical: stainCost.typical,
      totalHigh: stainCost.high,
      productId: 'prod-deck-stain',
      note: `${coats} coat(s): 1st coat @ ${cov1} sq ft/gal${coats > 1 ? `, 2nd @ ${cov2} sq ft/gal` : ''}`,
    },
    {
      id: 'deck-cleaner-brightener',
      name: 'Wood Deck Cleaner & Brightener Concentrate',
      quantity: ceilUnits(totalStainableArea / 400),
      exactQuantity: roundTo(totalStainableArea / 400, 2),
      unit: 'gallons',
      unitPrice: 22,
      totalLow: cleanerCost.low,
      totalTypical: cleanerCost.typical,
      totalHigh: cleanerCost.high,
      productId: 'prod-deck-cleaner',
      note: 'Prep cleaner before staining (~400 sq ft/gal)',
    },
  ];

  return {
    primaryResult: {
      label: 'Deck Stain Needed',
      value: roundedGallons,
      exactValue: roundTo(exactGallons, 2),
      unit: 'gallons',
      subtitle: `Covers ${roundTo(totalStainableArea, 0)} total sq ft across ${coats} coat(s)`,
    },
    secondaryResults: [
      {
        label: 'Total Stainable Surface',
        value: roundTo(totalStainableArea, 1),
        unit: 'sq ft',
        highlight: true,
      },
      {
        label: 'Deck Floor Area',
        value: roundTo(deckArea, 1),
        unit: 'sq ft',
      },
      {
        label: 'Railing Surface (Both Sides)',
        value: roundTo(railingArea, 1),
        unit: 'sq ft',
      },
      {
        label: 'Stair Treads & Risers',
        value: roundTo(stairsArea, 1),
        unit: 'sq ft',
      },
    ],
    materials,
    costEstimate: sumMaterialCosts(materials),
  };
}

export function getDeckStainQuickReference(): QuickReferenceRow[] {
  const decks = [
    { name: '10×10 ft Deck + 20 ft Railing', l: 10, w: 10, r: 20, s: 3 },
    { name: '12×12 ft Deck + 24 ft Railing', l: 12, w: 12, r: 24, s: 4 },
    { name: '12×16 ft Deck + 28 ft Railing', l: 16, w: 12, r: 28, s: 5 },
    { name: '16×20 ft Deck + 36 ft Railing', l: 20, w: 16, r: 36, s: 6 },
    { name: '20×24 ft Deck + 44 ft Railing', l: 24, w: 20, r: 44, s: 8 },
  ];
  return decks.map((d) => {
    const res = calculateDeckStain({
      deckLength: d.l,
      deckWidth: d.w,
      railingLength: d.r,
      railingHeight: 3,
      stairSteps: d.s,
      stairWidth: 4,
      coats: 2,
      firstCoatCoverage: 200,
      secondCoatCoverage: 300,
      wastePercent: 5,
      pricePerGallon: 48,
    });
    return {
      scenario: d.name,
      col1: `${res.secondaryResults[0].value} sq ft`,
      col2: `${res.primaryResult.exactValue} gal`,
      col3: `${res.primaryResult.value} gallons`,
    };
  });
}
