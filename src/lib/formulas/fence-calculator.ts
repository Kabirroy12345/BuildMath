import { ceilUnits, computeCostRange, roundTo, sumMaterialCosts } from './units';
import type { CalculationResult, QuickReferenceRow } from './types';

export interface FenceCalculatorInput {
  fenceLengthFeet: number; // total linear ft
  fenceHeightFeet: number; // 4, 6, or 8 ft (default 6 ft)
  postSpacingFeet: number; // default 8 ft on center
  railsPerSection: number; // default 3 for 6-ft fence (2 for 4-ft)
  picketWidthInches: number; // default 5.5 in (1x6 dog-ear picket)
  picketGapInches: number; // default 0 in (privacy) or 0.5-2.0 in (spaced picket)
  gateCount: number; // number of gates (default 1)
  gateWidthFeet: number; // default 4 ft per gate
  holeDiameterInches: number; // default 10 in
  holeDepthInches: number; // default 30 in
  wastePercent: number; // default 10%
  pricePerPicket: number; // default $3.15
  pricePerPost: number; // default $16.50
  pricePerRail: number; // default $7.50
}

/**
 * Fence Calculator Formula:
 * posts = ceil(length ÷ post spacing) + 1 (+ gate posts).
 * Rails = sections × rails per section.
 * Pickets = ceil(length_in ÷ (picket width + gap)).
 * Concrete bags per post hole = (hole cylinder volume − 4×4 post volume) ÷ bag yield.
 */
export function calculateFence(input: FenceCalculatorInput): CalculationResult {
  const totalLengthFt = Math.max(0, input.fenceLengthFeet);
  const gates = Math.max(0, Math.floor(input.gateCount ?? 1));
  const gateWidthFt = Math.max(0, input.gateWidthFeet || 4);
  const spacingFt = Math.max(4, input.postSpacingFeet || 8);
  const railsPerSec = Math.max(2, Math.min(4, Math.floor(input.railsPerSection || 3)));
  const picketW = Math.max(1, input.picketWidthInches || 5.5);
  const picketGap = Math.max(0, input.picketGapInches ?? 0);
  const wasteFactor = 1 + Math.max(0, input.wastePercent ?? 10) / 100;

  const sections = ceilUnits(totalLengthFt / spacingFt);
  const posts = sections + 1 + gates;
  const totalRails = ceilUnits(sections * railsPerSec * (1 + (input.wastePercent ?? 10) / 200));

  const lengthInches = totalLengthFt * 12;
  const exactPickets = (lengthInches / (picketW + picketGap)) * wasteFactor;
  const roundedPickets = ceilUnits(exactPickets);

  // Post hole concrete math: cylinder hole minus submerged 4x4 (actual 3.5" x 3.5") post
  const holeRadiusFt = Math.max(6, input.holeDiameterInches || 10) / 2 / 12;
  const holeDepthFt = Math.max(18, input.holeDepthInches || 30) / 12;
  const holeVolCuFt = Math.PI * holeRadiusFt * holeRadiusFt * holeDepthFt;
  const postVolCuFt = (3.5 / 12) * (3.5 / 12) * holeDepthFt;
  const netConcretePerHoleCuFt = Math.max(0.3, holeVolCuFt - postVolCuFt);
  const totalConcreteCuFt = netConcretePerHoleCuFt * posts;
  const concreteBags50Lb = ceilUnits(totalConcreteCuFt / 0.375); // 50-lb fast-setting bag = 0.375 cu ft

  const picketCost = computeCostRange(roundedPickets, input.pricePerPicket || 3.15);
  const postCost = computeCostRange(posts, input.pricePerPost || 16.5);
  const railCost = computeCostRange(totalRails, input.pricePerRail || 7.5);
  const concreteCost = computeCostRange(concreteBags50Lb, 6.45);

  const materials = [
    {
      id: 'fence-pickets-cedar-pt',
      name: `Wood Fence Pickets (${picketW}" Wide × ${input.fenceHeightFeet || 6}' High)`,
      quantity: roundedPickets,
      exactQuantity: roundTo(exactPickets, 1),
      unit: 'pickets',
      unitPrice: input.pricePerPicket || 3.15,
      totalLow: picketCost.low,
      totalTypical: picketCost.typical,
      totalHigh: picketCost.high,
      productId: 'prod-fence-pickets',
      note: `Includes ${input.wastePercent ?? 10}% culling & cut waste`,
    },
    {
      id: 'pressure-treated-4x4-posts',
      name: '4×4×8 ft Ground-Contact Pressure-Treated Fence Posts',
      quantity: posts,
      exactQuantity: posts,
      unit: 'posts',
      unitPrice: input.pricePerPost || 16.5,
      totalLow: postCost.low,
      totalTypical: postCost.typical,
      totalHigh: postCost.high,
      productId: 'prod-fence-posts',
      note: `${sections} bays at ${spacingFt} ft OC + end & gate posts`,
    },
    {
      id: 'fence-2x4-rails',
      name: `2×4×${spacingFt} ft Pressure-Treated Horizontal Stringer Rails`,
      quantity: totalRails,
      exactQuantity: sections * railsPerSec,
      unit: 'rails',
      unitPrice: input.pricePerRail || 7.5,
      totalLow: railCost.low,
      totalTypical: railCost.typical,
      totalHigh: railCost.high,
      productId: 'prod-fence-rails',
      note: `${railsPerSec} rails per section across ${sections} sections`,
    },
    {
      id: 'fast-set-post-concrete',
      name: 'Fast-Setting Post Hole Concrete Mix (50-lb Bags)',
      quantity: concreteBags50Lb,
      exactQuantity: roundTo(totalConcreteCuFt / 0.375, 1),
      unit: 'bags',
      unitPrice: 6.45,
      totalLow: concreteCost.low,
      totalTypical: concreteCost.typical,
      totalHigh: concreteCost.high,
      productId: 'prod-post-concrete',
      note: `~${roundTo(concreteBags50Lb / posts, 1)} bags per hole (${input.holeDiameterInches || 10}" × ${input.holeDepthInches || 30}" deep)`,
    },
  ];

  return {
    primaryResult: {
      label: 'Fence Pickets Needed',
      value: roundedPickets,
      exactValue: roundTo(exactPickets, 1),
      unit: 'pickets',
      subtitle: `${posts} posts · ${totalRails} rails · ${concreteBags50Lb} bags post concrete`,
    },
    secondaryResults: [
      {
        label: '4×4 Fence Posts',
        value: posts,
        unit: 'posts',
        highlight: true,
      },
      {
        label: '2×4 Horizontal Rails',
        value: totalRails,
        unit: 'rails',
      },
      {
        label: 'Fence Sections (Bays)',
        value: sections,
        unit: 'sections',
      },
      {
        label: 'Post Hole Concrete (50-lb Bags)',
        value: concreteBags50Lb,
        unit: 'bags',
      },
    ],
    materials,
    costEstimate: sumMaterialCosts(materials),
    diagramData: {
      type: 'fence-layout',
      totalLengthFt,
      postSpacingFeet: spacingFt,
      sections,
      posts,
      railsPerSection: railsPerSec,
      heightFeet: input.fenceHeightFeet || 6,
    },
  };
}

export function getFenceQuickReference(): QuickReferenceRow[] {
  const lengths = [50, 100, 150, 200, 250, 300];
  return lengths.map((len) => {
    const res = calculateFence({
      fenceLengthFeet: len,
      fenceHeightFeet: 6,
      postSpacingFeet: 8,
      railsPerSection: 3,
      picketWidthInches: 5.5,
      picketGapInches: 0,
      gateCount: 1,
      gateWidthFeet: 4,
      holeDiameterInches: 10,
      holeDepthInches: 30,
      wastePercent: 10,
      pricePerPicket: 3.15,
      pricePerPost: 16.5,
      pricePerRail: 7.5,
    });
    return {
      scenario: `${len} Linear Feet (6-ft Privacy Fence)`,
      col1: `${res.secondaryResults[0].value} posts`,
      col2: `${res.secondaryResults[1].value} rails`,
      col3: `${res.primaryResult.value} pickets`,
    };
  });
}
