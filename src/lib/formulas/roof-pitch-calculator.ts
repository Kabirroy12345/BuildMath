import { roundTo } from './units';
import type { CalculationResult, QuickReferenceRow } from './types';

export interface RoofPitchCalculatorInput {
  riseInches: number; // vertical rise in inches (default 6)
  runInches: number; // horizontal run in inches (default 12)
  buildingSpanFeet: number; // total building width ft (rafter span = span/2 for gable)
}

/**
 * Roof Pitch Calculator Formula:
 * pitchXIn12 = (rise ÷ run) × 12
 * angleDegrees = atan(rise ÷ run) × (180 ÷ π)
 * pitchFactor = √(1 + (pitchXIn12 ÷ 12)²)
 */
export function calculateRoofPitch(input: RoofPitchCalculatorInput): CalculationResult {
  const rise = Math.max(0.1, input.riseInches || 6);
  const run = Math.max(1, input.runInches || 12);
  const spanFt = Math.max(4, input.buildingSpanFeet || 24);

  const pitchIn12 = (rise / run) * 12;
  const angleRadians = Math.atan(rise / run);
  const angleDegrees = angleRadians * (180 / Math.PI);
  const slopePercent = (rise / run) * 100;
  const pitchFactor = Math.sqrt(1 + Math.pow(pitchIn12 / 12, 2));

  const halfSpanFt = spanFt / 2;
  const totalRiseFt = halfSpanFt * (pitchIn12 / 12);
  const rafterLengthFt = halfSpanFt * pitchFactor;

  const walkability =
    pitchIn12 <= 4
      ? 'Low slope (walkable, check shingle min-slope code)'
      : pitchIn12 <= 7
        ? 'Medium slope (walkable with roofing shoes)'
        : 'Steep slope (roof jacks & harness required)';

  return {
    primaryResult: {
      label: 'Standard Roof Pitch',
      value: roundTo(pitchIn12, 2),
      exactValue: roundTo(pitchIn12, 3),
      unit: '/ 12',
      subtitle: `${roundTo(angleDegrees, 1)}° roof angle · ${roundTo(pitchFactor, 3)}× area multiplier`,
    },
    secondaryResults: [
      {
        label: 'Roof Slope Angle',
        value: roundTo(angleDegrees, 2),
        unit: 'degrees (°)',
        highlight: true,
      },
      {
        label: 'Roof Area Pitch Multiplier',
        value: roundTo(pitchFactor, 3),
        unit: '× footprint',
      },
      {
        label: 'Slope Grade Percentage',
        value: roundTo(slopePercent, 1),
        unit: '%',
      },
      {
        label: `Rafter Length (${halfSpanFt}' Half-Span)`,
        value: roundTo(rafterLengthFt, 2),
        unit: 'ft',
      },
      {
        label: 'Ridge Height Above Wall Plate',
        value: roundTo(totalRiseFt, 2),
        unit: 'ft',
      },
      {
        label: 'Walkability Classification',
        value: walkability,
        unit: '',
      },
    ],
    materials: [],
    costEstimate: { low: 0, typical: 0, high: 0 },
    diagramData: {
      type: 'roof-pitch',
      rise: roundTo(pitchIn12, 1),
      run: 12,
      angleDegrees: roundTo(angleDegrees, 1),
      pitchFactor: roundTo(pitchFactor, 3),
      rafterLengthFt: roundTo(rafterLengthFt, 2),
    },
  };
}

export function getRoofPitchQuickReference(): QuickReferenceRow[] {
  const pitches = [2, 3, 4, 5, 6, 7, 8, 9, 10, 12];
  return pitches.map((p) => {
    const res = calculateRoofPitch({
      riseInches: p,
      runInches: 12,
      buildingSpanFeet: 24,
    });
    return {
      scenario: `${p}/12 Roof Pitch`,
      col1: `${res.secondaryResults[0].value}°`,
      col2: `${res.secondaryResults[2].value}% grade`,
      col3: `${res.secondaryResults[1].value}× multiplier`,
    };
  });
}
