import type { CalculationResult, QuickReferenceRow } from './types';
import { calculatePaint, getPaintQuickReference } from './paint-calculator';
import { calculateExteriorPaint, getExteriorPaintQuickReference } from './exterior-paint-calculator';
import { calculateDeckStain, getDeckStainQuickReference } from './deck-stain-calculator';
import { calculateWallpaper, getWallpaperQuickReference } from './wallpaper-calculator';
import { calculateFlooring, getFlooringQuickReference } from './flooring-calculator';
import { calculateTile, getTileQuickReference } from './tile-calculator';
import { calculateGrout, getGroutQuickReference } from './grout-calculator';
import { calculateCarpet, getCarpetQuickReference } from './carpet-calculator';
import { calculateBaseboardTrim, getBaseboardTrimQuickReference } from './baseboard-trim-calculator';
import { calculateConcreteSlab, getConcreteSlabQuickReference } from './concrete-slab-calculator';
import {
  calculateConcreteFooting,
  getConcreteFootingQuickReference,
} from './concrete-footing-calculator';
import { calculateConcreteSteps, getConcreteStepsQuickReference } from './concrete-steps-calculator';
import { calculateBrick, getBrickQuickReference } from './brick-calculator';
import { calculatePaverPatio, getPaverPatioQuickReference } from './paver-patio-calculator';
import { calculateRetainingWall, getRetainingWallQuickReference } from './retaining-wall-calculator';
import { calculateRebar, getRebarQuickReference } from './rebar-calculator';
import { calculateRoofing, getRoofingQuickReference } from './roofing-calculator';
import { calculateRoofPitch, getRoofPitchQuickReference } from './roof-pitch-calculator';
import { calculateGutter, getGutterQuickReference } from './gutter-calculator';
import { calculateSiding, getSidingQuickReference } from './siding-calculator';
import { calculateMulch, getMulchQuickReference } from './mulch-calculator';
import { calculateGravel, getGravelQuickReference } from './gravel-calculator';
import { calculateTopsoil, getTopsoilQuickReference } from './topsoil-calculator';
import { calculateSod, getSodQuickReference } from './sod-calculator';
import { calculateGrassSeed, getGrassSeedQuickReference } from './grass-seed-calculator';
import { calculateFence, getFenceQuickReference } from './fence-calculator';
import { calculateDeck, getDeckQuickReference } from './deck-calculator';
import { calculateDrywall, getDrywallQuickReference } from './drywall-calculator';
import { calculateStair, getStairQuickReference } from './stair-calculator';
import { calculateSquareFootage, getSquareFootageQuickReference } from './square-footage-calculator';
import { calculateCubicYard, getCubicYardQuickReference } from './cubic-yard-calculator';
import { calculateBoardFoot, getBoardFootQuickReference } from './board-foot-calculator';

export * from './types';
export * from './units';
export * from './state-cost';
export * from './paint-calculator';
export * from './exterior-paint-calculator';
export * from './deck-stain-calculator';
export * from './wallpaper-calculator';
export * from './flooring-calculator';
export * from './tile-calculator';
export * from './grout-calculator';
export * from './carpet-calculator';
export * from './baseboard-trim-calculator';
export * from './concrete-slab-calculator';
export * from './concrete-footing-calculator';
export * from './concrete-steps-calculator';
export * from './brick-calculator';
export * from './paver-patio-calculator';
export * from './retaining-wall-calculator';
export * from './rebar-calculator';
export * from './roofing-calculator';
export * from './roof-pitch-calculator';
export * from './gutter-calculator';
export * from './siding-calculator';
export * from './mulch-calculator';
export * from './gravel-calculator';
export * from './topsoil-calculator';
export * from './sod-calculator';
export * from './grass-seed-calculator';
export * from './fence-calculator';
export * from './deck-calculator';
export * from './drywall-calculator';
export * from './stair-calculator';
export * from './square-footage-calculator';
export * from './cubic-yard-calculator';
export * from './board-foot-calculator';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyFormulaFn = (input: any) => CalculationResult;

export const formulaRegistry: Record<string, AnyFormulaFn> = {
  'paint-calculator': calculatePaint,
  'exterior-paint-calculator': calculateExteriorPaint,
  'deck-stain-calculator': calculateDeckStain,
  'wallpaper-calculator': calculateWallpaper,
  'flooring-calculator': calculateFlooring,
  'tile-calculator': calculateTile,
  'grout-calculator': calculateGrout,
  'carpet-calculator': calculateCarpet,
  'baseboard-trim-calculator': calculateBaseboardTrim,
  'concrete-slab-calculator': calculateConcreteSlab,
  'concrete-footing-calculator': calculateConcreteFooting,
  'concrete-steps-calculator': calculateConcreteSteps,
  'brick-calculator': calculateBrick,
  'paver-patio-calculator': calculatePaverPatio,
  'retaining-wall-calculator': calculateRetainingWall,
  'rebar-calculator': calculateRebar,
  'roofing-calculator': calculateRoofing,
  'roof-pitch-calculator': calculateRoofPitch,
  'gutter-calculator': calculateGutter,
  'siding-calculator': calculateSiding,
  'mulch-calculator': calculateMulch,
  'gravel-calculator': calculateGravel,
  'topsoil-calculator': calculateTopsoil,
  'sod-calculator': calculateSod,
  'grass-seed-calculator': calculateGrassSeed,
  'fence-calculator': calculateFence,
  'deck-calculator': calculateDeck,
  'drywall-calculator': calculateDrywall,
  'stair-calculator': calculateStair,
  'square-footage-calculator': calculateSquareFootage,
  'cubic-yard-calculator': calculateCubicYard,
  'board-foot-calculator': calculateBoardFoot,
};

export const quickReferenceRegistry: Record<string, () => QuickReferenceRow[]> = {
  'paint-calculator': getPaintQuickReference,
  'exterior-paint-calculator': getExteriorPaintQuickReference,
  'deck-stain-calculator': getDeckStainQuickReference,
  'wallpaper-calculator': getWallpaperQuickReference,
  'flooring-calculator': getFlooringQuickReference,
  'tile-calculator': getTileQuickReference,
  'grout-calculator': getGroutQuickReference,
  'carpet-calculator': getCarpetQuickReference,
  'baseboard-trim-calculator': getBaseboardTrimQuickReference,
  'concrete-slab-calculator': getConcreteSlabQuickReference,
  'concrete-footing-calculator': getConcreteFootingQuickReference,
  'concrete-steps-calculator': getConcreteStepsQuickReference,
  'brick-calculator': getBrickQuickReference,
  'paver-patio-calculator': getPaverPatioQuickReference,
  'retaining-wall-calculator': getRetainingWallQuickReference,
  'rebar-calculator': getRebarQuickReference,
  'roofing-calculator': getRoofingQuickReference,
  'roof-pitch-calculator': getRoofPitchQuickReference,
  'gutter-calculator': getGutterQuickReference,
  'siding-calculator': getSidingQuickReference,
  'mulch-calculator': getMulchQuickReference,
  'gravel-calculator': getGravelQuickReference,
  'topsoil-calculator': getTopsoilQuickReference,
  'sod-calculator': getSodQuickReference,
  'grass-seed-calculator': getGrassSeedQuickReference,
  'fence-calculator': getFenceQuickReference,
  'deck-calculator': getDeckQuickReference,
  'drywall-calculator': getDrywallQuickReference,
  'stair-calculator': getStairQuickReference,
  'square-footage-calculator': getSquareFootageQuickReference,
  'cubic-yard-calculator': getCubicYardQuickReference,
  'board-foot-calculator': getBoardFootQuickReference,
};

export function runCalculatorFormula(
  slug: string,
  values: Record<string, number | string | boolean>
): CalculationResult {
  const fn = formulaRegistry[slug];
  if (!fn) {
    throw new Error(`No formula registered for calculator slug: ${slug}`);
  }
  return fn(values);
}

export function getQuickReferenceForSlug(slug: string): QuickReferenceRow[] {
  const fn = quickReferenceRegistry[slug];
  return fn ? fn() : [];
}

export function getQuickReferenceTable(
  slug: string,
  customHeaders?: string[],
  customTitle?: string
) {
  const rows = getQuickReferenceForSlug(slug);
  return {
    title: customTitle || 'Quick-Reference Material Chart',
    headers: customHeaders && customHeaders.length === 4
      ? customHeaders
      : ['Project Size / Scenario', 'Primary Quantity', 'Secondary Quantity', 'Typical Material Cost'],
    rows: rows.map((r) => [r.scenario, r.col1, r.col2, r.col3]),
    footnote: 'Values pre-computed using standard trade coverage defaults. Use the interactive calculator above to customize for your exact project.',
  };
}

