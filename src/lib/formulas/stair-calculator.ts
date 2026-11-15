import { ceilUnits, computeCostRange, roundTo, sumMaterialCosts } from './units';
import type { CalculationResult, QuickReferenceRow } from './types';

export interface StairCalculatorInput {
  totalRiseInches: number; // floor-to-floor vertical height in inches (e.g. 108" for 9 ft)
  maxRiserInches: number; // default 7.75 in (IRC R311.7.5.1 max riser height)
  treadDepthInches: number; // default 10.5 in (IRC R311.7.5.2 min tread depth is 10")
  stairWidthInches: number; // default 36 in (IRC min width 36")
  stringerBoardPrice: number; // default $38 per 2x12x16 pressure-treated stringer board
  treadBoardPrice: number; // default $18 per step tread
}

/**
 * Stair Calculator Formula:
 * number of risers = ceil(total rise ÷ maxRiser (7.75")).
 * Riser height = total rise ÷ risers.
 * Treads = risers − 1.
 * Total run = treads × tread depth (min 10").
 * Stringer length = √(rise² + run²).
 * Includes IRC R311.7.5 compliance check and stringer SVG diagram data.
 */
export function calculateStair(input: StairCalculatorInput): CalculationResult {
  const totalRiseIn = Math.max(7, input.totalRiseInches || 108);
  const targetMaxRiser = Math.max(4, Math.min(9.5, input.maxRiserInches || 7.75));
  const treadDepthIn = Math.max(6, input.treadDepthInches || 10.5);
  const stairWidthIn = Math.max(24, input.stairWidthInches || 36);

  const risers = Math.max(1, ceilUnits(totalRiseIn / targetMaxRiser));
  const actualRiserHeightIn = totalRiseIn / risers;
  const treads = Math.max(1, risers - 1);
  const totalRunIn = treads * treadDepthIn;
  const stringerLengthIn = Math.sqrt(Math.pow(totalRiseIn, 2) + Math.pow(totalRunIn, 2));
  const stringerLengthFt = stringerLengthIn / 12;
  const stairAngleDeg = Math.atan(totalRiseIn / totalRunIn) * (180 / Math.PI);

  // Number of 2x12 stringers needed (1 every 16" of stair width, min 3 for 36" width)
  const stringerCount = Math.max(3, ceilUnits(stairWidthIn / 16) + 1);

  // IRC 2024 Section R311.7 Compliance Check
  const riserCompliant = actualRiserHeightIn <= 7.75 && actualRiserHeightIn >= 4.0;
  const treadCompliant = treadDepthIn >= 10.0;
  const widthCompliant = stairWidthIn >= 36.0;
  const allCompliant = riserCompliant && treadCompliant && widthCompliant;

  const details: string[] = [
    `Riser height ${roundTo(actualRiserHeightIn, 2)}" ${riserCompliant ? 'PASSES' : 'FAILS'} IRC R311.7.5.1 (max 7.75", min 4.0")`,
    `Tread depth ${roundTo(treadDepthIn, 2)}" ${treadCompliant ? 'PASSES' : 'FAILS'} IRC R311.7.5.2 (min 10.0" nosing-to-nosing)`,
    `Stair width ${roundTo(stairWidthIn, 1)}" ${widthCompliant ? 'PASSES' : 'FAILS'} IRC R311.7.1 (min 36" clear width)`,
  ];

  const stringerCost = computeCostRange(stringerCount, input.stringerBoardPrice || 38);
  const treadsCost = computeCostRange(treads, input.treadBoardPrice || 18);

  const materials = [
    {
      id: 'stair-stringer-2x12',
      name: `2×12 Stair Stringer Lumber (${ceilUnits(stringerLengthFt + 2)}-ft Boards)`,
      quantity: stringerCount,
      exactQuantity: stringerCount,
      unit: 'stringers',
      unitPrice: input.stringerBoardPrice || 38,
      totalLow: stringerCost.low,
      totalTypical: stringerCost.typical,
      totalHigh: stringerCost.high,
      productId: 'prod-stair-stringer',
      note: `Each stringer is ${roundTo(stringerLengthFt, 2)} ft (${roundTo(stringerLengthIn, 1)}") long`,
    },
    {
      id: 'stair-tread-boards',
      name: `Stair Treads & Riser Boards (${stairWidthIn}" Wide)`,
      quantity: treads,
      exactQuantity: treads,
      unit: 'treads',
      unitPrice: input.treadBoardPrice || 18,
      totalLow: treadsCost.low,
      totalTypical: treadsCost.typical,
      totalHigh: treadsCost.high,
      productId: 'prod-stair-treads',
      note: `${treads} treads (${treadDepthIn}" deep) + ${risers} risers (${roundTo(actualRiserHeightIn, 2)}" high)`,
    },
  ];

  return {
    primaryResult: {
      label: 'Number of Risers (Steps)',
      value: risers,
      exactValue: roundTo(totalRiseIn / targetMaxRiser, 2),
      unit: 'risers',
      subtitle: `${roundTo(actualRiserHeightIn, 2)}" riser height × ${treads} treads (${roundTo(totalRunIn / 12, 2)} ft total run)`,
    },
    secondaryResults: [
      {
        label: 'Exact Riser Height',
        value: roundTo(actualRiserHeightIn, 2),
        unit: 'inches',
        highlight: true,
      },
      {
        label: 'Number of Treads',
        value: treads,
        unit: 'treads',
      },
      {
        label: 'Total Horizontal Run',
        value: `${roundTo(totalRunIn, 1)}" (${roundTo(totalRunIn / 12, 2)} ft)`,
        unit: '',
      },
      {
        label: 'Stringer Board Length',
        value: `${roundTo(stringerLengthIn, 1)}" (${roundTo(stringerLengthFt, 2)} ft)`,
        unit: '',
      },
      {
        label: 'Stair Slope Angle',
        value: roundTo(stairAngleDeg, 1),
        unit: 'degrees (°)',
      },
    ],
    materials,
    costEstimate: sumMaterialCosts(materials),
    complianceCheck: {
      passed: allCompliant,
      codeReference: 'IRC Section R311.7.5 (Residential Stairways)',
      message: allCompliant
        ? 'Meets IRC Residential Building Code Requirements'
        : 'Attention: One or more dimensions exceed IRC Residential Stair Code limits',
      details,
    },
    diagramData: {
      type: 'stair-stringer',
      risers,
      treads,
      riserHeightIn: roundTo(actualRiserHeightIn, 2),
      treadDepthIn: roundTo(treadDepthIn, 2),
      totalRiseIn: roundTo(totalRiseIn, 1),
      totalRunIn: roundTo(totalRunIn, 1),
      stringerLengthIn: roundTo(stringerLengthIn, 1),
      angleDeg: roundTo(stairAngleDeg, 1),
    },
  };
}

export function getStairQuickReference(): QuickReferenceRow[] {
  const heights = [
    { name: '24" Deck Step-Down (2 ft total rise)', r: 24 },
    { name: '36" Porch Height (3 ft total rise)', r: 36 },
    { name: '60" Split-Level Flight (5 ft total rise)', r: 60 },
    { name: '96" Standard 8-ft Ceiling + Joist (8 ft rise)', r: 105 },
    { name: '108" Standard 9-ft Story Flight (9 ft + joist)', r: 117 },
  ];
  return heights.map((h) => {
    const res = calculateStair({
      totalRiseInches: h.r,
      maxRiserInches: 7.75,
      treadDepthInches: 10.5,
      stairWidthInches: 36,
      stringerBoardPrice: 38,
      treadBoardPrice: 18,
    });
    return {
      scenario: h.name,
      col1: `${res.primaryResult.value} risers @ ${res.secondaryResults[0].value}"`,
      col2: `${res.secondaryResults[1].value} treads (${res.secondaryResults[2].value})`,
      col3: `${res.secondaryResults[3].value} stringer`,
    };
  });
}
