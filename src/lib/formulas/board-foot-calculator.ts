import { computeCostRange, roundTo } from './units';
import type { CalculationResult, QuickReferenceRow } from './types';

export interface BoardFootCalculatorInput {
  thicknessInches: number; // nominal thickness in inches (e.g. 1" for 4/4, 1.25" for 5/4, 2" for 8/4)
  widthInches: number; // board width in inches
  lengthFeet: number; // board length in feet (note: 1 ft = 12 in, so T(in)*W(in)*L(in)/144 === T(in)*W(in)*L(ft)/12)
  quantity: number; // number of boards
  wastePercent: number; // default 15% for rough lumber milling waste
  pricePerBoardFoot: number; // default $6.50 / bd ft
}

/**
 * Board Foot Calculator Formula:
 * Board feet = T(in) × W(in) × L(in) ÷ 144  (equivalent to T(in) × W(in) × L(ft) ÷ 12)
 */
export function calculateBoardFoot(input: BoardFootCalculatorInput): CalculationResult {
  const T = Math.max(0.25, input.thicknessInches || 1);
  const W = Math.max(0.5, input.widthInches || 6);
  const lengthInches = Math.max(1, input.lengthFeet || 8) * 12;
  const qty = Math.max(1, Math.floor(input.quantity || 1));
  const wasteFactor = 1 + Math.max(0, input.wastePercent ?? 0) / 100;

  const singleBoardFeet = (T * W * lengthInches) / 144;
  const netBoardFeet = singleBoardFeet * qty;
  const totalBoardFeet = netBoardFeet * wasteFactor;
  const totalLinearFeet = Math.max(0, input.lengthFeet || 8) * qty;

  const cost = computeCostRange(roundTo(totalBoardFeet, 2), input.pricePerBoardFoot || 6.5);

  return {
    primaryResult: {
      label: 'Total Board Feet',
      value: roundTo(totalBoardFeet, 2),
      exactValue: roundTo(netBoardFeet, 2),
      unit: 'bd ft',
      subtitle: `${roundTo(singleBoardFeet, 2)} bd ft per board × ${qty} board(s)`,
    },
    secondaryResults: [
      {
        label: 'Board Feet per Single Board',
        value: roundTo(singleBoardFeet, 2),
        unit: 'bd ft',
        highlight: true,
      },
      {
        label: 'Net Board Feet (No Waste)',
        value: roundTo(netBoardFeet, 2),
        unit: 'bd ft',
      },
      {
        label: 'Total Linear Footage',
        value: roundTo(totalLinearFeet, 1),
        unit: 'linear ft',
      },
      {
        label: 'Volume in Cubic Feet',
        value: roundTo(totalBoardFeet / 12, 2),
        unit: 'cu ft',
      },
    ],
    materials: [],
    costEstimate: cost,
  };
}

export function getBoardFootQuickReference(): QuickReferenceRow[] {
  const boards = [
    { name: '1×6 × 8 ft Board (4/4 Quarter)', t: 1, w: 6, l: 8 },
    { name: '1×8 × 10 ft Board (4/4 Quarter)', t: 1, w: 8, l: 10 },
    { name: '2×4 × 8 ft Framing Stud (8/4 Quarter)', t: 2, w: 4, l: 8 },
    { name: '2×6 × 12 ft Joist / Deck Board', t: 2, w: 6, l: 12 },
    { name: '2×10 × 16 ft Floor Joist', t: 2, w: 10, l: 16 },
    { name: '4×4 × 8 ft Fence / Pergola Post', t: 4, w: 4, l: 8 },
  ];
  return boards.map((b) => {
    const res = calculateBoardFoot({
      thicknessInches: b.t,
      widthInches: b.w,
      lengthFeet: b.l,
      quantity: 1,
      wastePercent: 0,
      pricePerBoardFoot: 6.5,
    });
    return {
      scenario: b.name,
      col1: `${b.t}" × ${b.w}" × ${b.l * 12}"`,
      col2: `${res.primaryResult.value} bd ft (1 board)`,
      col3: `${roundTo(res.primaryResult.value * 10, 2)} bd ft (10 boards)`,
    };
  });
}
