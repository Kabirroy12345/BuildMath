import { ceilUnits, computeCostRange, roundTo, sumMaterialCosts } from './units';
import type { CalculationResult, QuickReferenceRow } from './types';

export interface GravelCalculatorInput {
  lengthFeet: number; // ft
  widthFeet: number; // ft
  depthInches: number; // default 3 in (driveways 4-6", paths 2-3")
  densityTonsPerCuYd: number; // default 1.4 tons/cu yd (editable by material type)
  wastePercent: number; // default 10% (compaction & settling)
  pricePerTon: number; // default $52/ton
}

/**
 * Gravel / Crushed Stone Calculator Formula:
 * cu yd = area × (depth in ÷ 12) ÷ 27 × (1 + waste%)
 * tons = cu yd × density (default 1.4 tons/cu yd, editable by material type).
 */
export function calculateGravel(input: GravelCalculatorInput): CalculationResult {
  const areaSqFt = Math.max(0, input.lengthFeet) * Math.max(0, input.widthFeet);
  const depthIn = Math.max(0.5, input.depthInches || 3);
  const density = Math.max(0.8, input.densityTonsPerCuYd || 1.4);
  const wasteFactor = 1 + Math.max(0, input.wastePercent ?? 10) / 100;

  const netCuFt = areaSqFt * (depthIn / 12);
  const totalCuFt = netCuFt * wasteFactor;
  const netCuYd = netCuFt / 27;
  const totalCuYd = totalCuFt / 27;

  const exactTons = totalCuYd * density;
  const totalLbs = exactTons * 2000;
  const bags50Lb = ceilUnits(totalLbs / 50); // 0.5 cu ft / ~50 lb bags

  // Landscape fabric (3 ft × 100 ft = 300 sq ft rolls)
  const fabricRolls = ceilUnits((areaSqFt * 1.1) / 300);

  const gravelCost = computeCostRange(roundTo(exactTons, 2), input.pricePerTon || 52);
  const fabricCost = computeCostRange(fabricRolls, 34);

  const materials = [
    {
      id: 'bulk-crushed-gravel-tons',
      name: `Crushed Stone / Pea Gravel (${density} tons/yd³)`,
      quantity: roundTo(exactTons, 2),
      exactQuantity: roundTo(exactTons, 2),
      unit: 'tons',
      unitPrice: input.pricePerTon || 52,
      totalLow: gravelCost.low,
      totalTypical: gravelCost.typical,
      totalHigh: gravelCost.high,
      productId: 'prod-gravel-bulk',
      note: `Equals ${roundTo(totalCuYd, 2)} cubic yards (or ${bags50Lb} × 50-lb bags for small areas)`,
    },
    {
      id: 'heavy-duty-landscape-fabric',
      name: 'Woven Geotextile Landscape Fabric (3 ft × 100 ft Roll)',
      quantity: fabricRolls,
      exactQuantity: roundTo((areaSqFt * 1.1) / 300, 2),
      unit: 'rolls',
      unitPrice: 34,
      totalLow: fabricCost.low,
      totalTypical: fabricCost.typical,
      totalHigh: fabricCost.high,
      productId: 'prod-landscape-fabric',
      note: 'Prevents gravel from sinking into subsoil & blocks weeds',
    },
  ];

  return {
    primaryResult: {
      label: 'Gravel Weight Needed',
      value: roundTo(exactTons, 2),
      exactValue: roundTo(netCuYd * density, 2),
      unit: 'tons',
      subtitle: `${roundTo(totalCuYd, 2)} cubic yards (${roundTo(totalCuFt, 1)} cu ft w/ ${input.wastePercent ?? 10}% compaction factor)`,
    },
    secondaryResults: [
      {
        label: 'Volume in Cubic Yards',
        value: roundTo(totalCuYd, 2),
        exactValue: roundTo(netCuYd, 2),
        unit: 'cu yd',
        highlight: true,
      },
      {
        label: 'Volume in Cubic Feet',
        value: roundTo(totalCuFt, 1),
        unit: 'cu ft',
      },
      {
        label: '50-lb Bags Equivalent (0.5 cu ft)',
        value: bags50Lb,
        unit: 'bags',
      },
      {
        label: 'Total Weight in Pounds',
        value: Math.round(totalLbs).toLocaleString(),
        unit: 'lbs',
      },
    ],
    materials,
    costEstimate: sumMaterialCosts(materials),
  };
}

export function getGravelQuickReference(): QuickReferenceRow[] {
  const projects = [
    { name: 'Garden Path (3×25 ft, 2" deep)', l: 25, w: 3, d: 2 },
    { name: 'Fire Pit Patio (12×12 ft, 3" deep)', l: 12, w: 12, d: 3 },
    { name: 'RV / Boat Parking Pad (12×30 ft, 4" deep)', l: 30, w: 12, d: 4 },
    { name: 'Single Driveway (10×50 ft, 4" deep)', l: 50, w: 10, d: 4 },
    { name: 'Double Driveway (20×50 ft, 4" deep)', l: 50, w: 20, d: 4 },
    { name: 'Long Country Driveway (12×150 ft, 6" deep)', l: 150, w: 12, d: 6 },
  ];
  return projects.map((p) => {
    const res = calculateGravel({
      lengthFeet: p.l,
      widthFeet: p.w,
      depthInches: p.d,
      densityTonsPerCuYd: 1.4,
      wastePercent: 10,
      pricePerTon: 52,
    });
    return {
      scenario: p.name,
      col1: `${p.l * p.w} sq ft`,
      col2: `${res.secondaryResults[0].value} cu yd`,
      col3: `${res.primaryResult.value} tons`,
    };
  });
}
