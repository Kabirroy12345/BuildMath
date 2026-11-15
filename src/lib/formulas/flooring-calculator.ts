import { ceilUnits, computeCostRange, roundTo, sumMaterialCosts } from './units';
import type { CalculationResult, QuickReferenceRow } from './types';

export interface FlooringCalculatorInput {
  roomLength: number; // ft
  roomWidth: number; // ft
  secondAreaLength: number; // ft (for L-shape or closet / 2nd rectangle)
  secondAreaWidth: number; // ft
  sqFtPerBox: number; // default 20 sq ft per box
  wastePercent: number; // 10% straight lay, 15% diagonal/herringbone
  underlaymentRollSqFt: number; // default 100 sq ft per roll
  pricePerSqFt: number; // default $3.49/sq ft
  underlaymentPricePerRoll: number; // default $45/roll
}

/**
 * Flooring Calculator (Laminate / Hardwood / LVP) Formula:
 * room area = (L1 × W1) + (L2 × W2)
 * total sq ft = room area × (1 + waste%)
 * boxes = ceil(total sq ft ÷ sq ft per box)
 */
export function calculateFlooring(input: FlooringCalculatorInput): CalculationResult {
  const area1 = Math.max(0, input.roomLength) * Math.max(0, input.roomWidth);
  const area2 = Math.max(0, input.secondAreaLength || 0) * Math.max(0, input.secondAreaWidth || 0);
  const netArea = area1 + area2;

  const wasteFactor = 1 + Math.max(0, input.wastePercent ?? 10) / 100;
  const totalSqFtNeeded = netArea * wasteFactor;
  const boxCoverage = Math.max(1, input.sqFtPerBox || 20);

  const exactBoxes = totalSqFtNeeded / boxCoverage;
  const roundedBoxes = ceilUnits(exactBoxes);
  const totalSqFtPurchased = roundTo(roundedBoxes * boxCoverage, 1);

  const underlaymentCoverage = Math.max(25, input.underlaymentRollSqFt || 100);
  const exactUnderlaymentRolls = netArea / underlaymentCoverage;
  const roundedUnderlaymentRolls = ceilUnits(exactUnderlaymentRolls);

  const unitBoxPrice = roundTo((input.pricePerSqFt || 3.49) * boxCoverage, 2);
  const flooringCost = computeCostRange(roundedBoxes, unitBoxPrice);
  const underlaymentCost = computeCostRange(
    roundedUnderlaymentRolls,
    input.underlaymentPricePerRoll || 45
  );

  const materials = [
    {
      id: 'flooring-boxes',
      name: `Flooring Planks (${boxCoverage} sq ft/box)`,
      quantity: roundedBoxes,
      exactQuantity: roundTo(exactBoxes, 2),
      unit: 'boxes',
      unitPrice: unitBoxPrice,
      totalLow: flooringCost.low,
      totalTypical: flooringCost.typical,
      totalHigh: flooringCost.high,
      productId: 'prod-flooring-lvp',
      note: `Provides ${totalSqFtPurchased} sq ft total (includes ${input.wastePercent ?? 10}% waste)`,
    },
    {
      id: 'flooring-underlayment',
      name: `Acoustic Moisture Barrier Underlayment (${underlaymentCoverage} sq ft roll)`,
      quantity: roundedUnderlaymentRolls,
      exactQuantity: roundTo(exactUnderlaymentRolls, 2),
      unit: 'rolls',
      unitPrice: input.underlaymentPricePerRoll || 45,
      totalLow: underlaymentCost.low,
      totalTypical: underlaymentCost.typical,
      totalHigh: underlaymentCost.high,
      productId: 'prod-flooring-underlayment',
      note: '3-in-1 foam underlayment with vapor barrier tape',
    },
  ];

  return {
    primaryResult: {
      label: 'Boxes of Flooring Needed',
      value: roundedBoxes,
      exactValue: roundTo(exactBoxes, 2),
      unit: 'boxes',
      subtitle: `${roundTo(totalSqFtNeeded, 1)} sq ft needed (${totalSqFtPurchased} sq ft in ${roundedBoxes} boxes)`,
    },
    secondaryResults: [
      {
        label: 'Total Flooring Required (w/ Waste)',
        value: roundTo(totalSqFtNeeded, 1),
        unit: 'sq ft',
        highlight: true,
      },
      {
        label: 'Net Room Footprint',
        value: roundTo(netArea, 1),
        unit: 'sq ft',
      },
      {
        label: 'Total Purchased in Full Boxes',
        value: totalSqFtPurchased,
        unit: 'sq ft',
      },
      {
        label: 'Underlayment Rolls (100 sq ft)',
        value: roundedUnderlaymentRolls,
        exactValue: roundTo(exactUnderlaymentRolls, 2),
        unit: 'rolls',
      },
    ],
    materials,
    costEstimate: sumMaterialCosts(materials),
  };
}

export function getFlooringQuickReference(): QuickReferenceRow[] {
  const rooms = [
    { name: 'Small Hallway / Entry (5×12 ft)', l: 12, w: 5 },
    { name: 'Guest Bedroom (10×12 ft)', l: 12, w: 10 },
    { name: 'Standard Bedroom (12×14 ft)', l: 14, w: 12 },
    { name: 'Living Room (15×20 ft)', l: 20, w: 15 },
    { name: 'First-Floor Open Plan (20×30 ft)', l: 30, w: 20 },
    { name: 'Whole Main Level (1,000 sq ft)', l: 40, w: 25 },
  ];
  return rooms.map((r) => {
    const res = calculateFlooring({
      roomLength: r.l,
      roomWidth: r.w,
      secondAreaLength: 0,
      secondAreaWidth: 0,
      sqFtPerBox: 20,
      wastePercent: 10,
      underlaymentRollSqFt: 100,
      pricePerSqFt: 3.49,
      underlaymentPricePerRoll: 45,
    });
    return {
      scenario: r.name,
      col1: `${r.l * r.w} sq ft`,
      col2: `${res.secondaryResults[0].value} sq ft`,
      col3: `${res.primaryResult.value} boxes (20 sq ft/box)`,
    };
  });
}
