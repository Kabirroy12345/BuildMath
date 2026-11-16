import { useState, useEffect, useMemo, useRef } from 'preact/hooks';
import { runCalculatorFormula } from '../lib/formulas';
import { feetInchesToDecimalFeet, metersToFeet, sqMetersToSqFeet } from '../lib/formulas/units';
import type { CalculationResult } from '../lib/formulas/types';
import LucideIcon from './LucideIcon';
import { getCategoryIconName } from '../lib/lucide-icons';

export interface CalculatorField {
  name: string;
  label: string;
  type: 'number' | 'select' | 'boolean' | 'slider';
  defaultValue: number | string | boolean;
  unit?: string;
  min?: number;
  max?: number;
  step?: number;
  acceptsFeetInches?: boolean;
  isEditableDefault?: boolean;
  tooltip?: string;
  options?: { label: string; value: string | number }[];
}

export interface ProductItem {
  id: string;
  name: string;
  retailer: string;
  priceIndication: string;
}

export type CalculatorDiagramType =
  | 'room-walls'
  | 'roof-pitch'
  | 'stair-stringer'
  | 'fence-layout'
  | 'concrete-slab'
  | 'concrete-footing'
  | 'deck-layout'
  | 'paver-grid'
  | null;

export interface CalculatorWidgetProps {
  slug: string;
  title: string;
  shortName?: string;
  category?: string;
  categoryName?: string;
  fields: CalculatorField[];
  diagramType?: CalculatorDiagramType;
  productsMap: Record<string, ProductItem>;
  affiliateDisclosure: string;
  affiliateEnabled: boolean;
}

// Keep unit prices & technical coverage/yield constants tucked inside collapsible calibration drawer;
// expose all project geometry (thickness, depth, pitch, sheet/bag/board size) upfront.
const CALIBRATION_ONLY_FIELDS = new Set([
  'pricePerGallon',
  'primerPricePerGallon',
  'pricePerDoubleRoll',
  'pricePerSqFt',
  'underlaymentPricePerRoll',
  'pricePerTile',
  'thinsetBagPrice',
  'pricePerBag',
  'padPricePerSqYd',
  'pricePerSqYd',
  'pricePerLinearFoot',
  'readyMixPricePerCuYd',
  'pricePerBag80Lb',
  'pricePerBrick',
  'pricePerMortarBag',
  'pricePerPaver',
  'gravelPricePerTon',
  'sandPricePerTon',
  'pricePerBlock',
  'pricePerCapBlock',
  'pricePerBar',
  'pricePerBundle',
  'pricePerTenFootGutter',
  'pricePerSquare',
  'bulkPricePerCuYd',
  'pricePerTon',
  'pricePerLb',
  'pricePerPicket',
  'pricePerPost',
  'pricePerRail',
  'pricePerDeckBoard',
  'pricePerJoist',
  'pricePerSheet',
  'stringerBoardPrice',
  'treadBoardPrice',
  'pricePerCuYd',
  'pricePerBoardFoot',
  'coveragePerGallon',
  'primerCoveragePerGallon',
  'firstCoatCoverage',
  'secondCoatCoverage',
  'usableSingleRollCoverage',
  'underlaymentRollSqFt',
  'thinsetCoverageSqFt',
  'groutDensityLbPerCuFt',
  'doorWidthFeet',
  'bricksPerMortarBag',
  'sandDepthInches',
  'edgeClearanceInches',
  'bundlesPerSquare',
  'feetPerDownspout',
  'hangerSpacingInches',
  'densityTonsPerCuYd',
  'holeDiameterInches',
  'holeDepthInches',
  'fastenersPerSqFt',
  'compoundGallonsPer100SqFt',
  'screwsPerSheet',
  'maxRiserInches',
  'treadDepthInches',
  'stairWidthInches',
]);

const DIMENSION_NAME_PATTERN =
  /^(length|width|height|perimeter|depth|diameter|span|rise|area|stepCount|shape|bedShape|roomLength|roomWidth|wallHeight|housePerimeter|wallPerimeter|footprint|ridgeLength|eaveLength|slabLength|slabWidth|lawnLength|lawnWidth|fenceLength|deckLength|deckWidth|patioLength|patioWidth|wallLength|totalRise|stairWidth|landingDepth|tileWidth|tileLength|paverLength|paverWidth|secondArea|secondLength|secondWidth|rectLength|rectWidth|thicknessInches|depthInches|pitchRise|runInches|railingHeight|riserHeightInches)/i;

function isDimensionField(field: CalculatorField): boolean {
  return DIMENSION_NAME_PATTERN.test(field.name);
}

function buildInitialValues(fields: CalculatorField[]): Record<string, number | string | boolean> {
  const map: Record<string, number | string | boolean> = {};
  for (const f of fields) {
    map[f.name] = f.defaultValue;
  }
  return map;
}

function buildInitialSplits(
  fields: CalculatorField[],
  values: Record<string, number | string | boolean>
): Record<string, { feet: number; inches: number }> {
  const splits: Record<string, { feet: number; inches: number }> = {};
  for (const f of fields) {
    if (f.acceptsFeetInches) {
      const val = Number(values[f.name]) || 0;
      const ft = Math.floor(val);
      const inch = Math.round((val - ft) * 12);
      splits[f.name] = { feet: ft, inches: inch === 12 ? 0 : inch };
    }
  }
  return splits;
}

export default function CalculatorWidget({
  slug,
  title,
  shortName,
  category = 'general-conversions',
  categoryName = 'Calculator',
  fields,
  diagramType,
  productsMap,
  affiliateDisclosure,
  affiliateEnabled,
}: CalculatorWidgetProps) {
  const initialValues = useMemo(() => buildInitialValues(fields), [fields]);

  const [values, setValues] = useState<Record<string, number | string | boolean>>(initialValues);
  const [rawStrings, setRawStrings] = useState<Record<string, string>>({});
  const [unitSystem, setUnitSystem] = useState<'imperial' | 'metric'>('imperial');
  const [inchesSplit, setInchesSplit] = useState<Record<string, { feet: number; inches: number }>>(() =>
    buildInitialSplits(fields, initialValues)
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showDefaults, setShowDefaults] = useState<boolean>(false);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [copiedResult, setCopiedResult] = useState<boolean>(false);
  const [savedProject, setSavedProject] = useState<boolean>(false);
  const [savedCompare, setSavedCompare] = useState<boolean>(false);
  const [pulseResult, setPulseResult] = useState<boolean>(false);
  const [calculatedNotice, setCalculatedNotice] = useState<boolean>(false);
  const resultsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const updated: Record<string, number | string | boolean> = { ...initialValues };
    let hasQuery = false;

    for (const f of fields) {
      if (params.has(f.name)) {
        hasQuery = true;
        const raw = params.get(f.name)!;
        if (f.type === 'boolean') {
          updated[f.name] = raw === 'true' || raw === '1';
        } else if (f.type === 'select') {
          updated[f.name] = isNaN(Number(raw)) ? raw : Number(raw);
        } else {
          const num = parseFloat(raw);
          if (!isNaN(num)) {
            updated[f.name] = num;
          }
        }
      }
    }

    if (params.get('units') === 'metric') {
      setUnitSystem('metric');
    }

    if (hasQuery) {
      setValues(updated);
      setInchesSplit(buildInitialSplits(fields, updated));
    }

    try {
      const recentKey = 'buildmath_recent_calculators';
      const existingRaw = localStorage.getItem(recentKey);
      const parsed = existingRaw ? JSON.parse(existingRaw) : [];
      const list = Array.isArray(parsed) ? parsed.filter((item) => item?.slug !== slug) : [];
      list.unshift({
        slug,
        shortName: shortName || title,
        category,
        categoryName,
        href: `/calculators/${slug}/`,
        timestamp: Date.now(),
      });
      localStorage.setItem(recentKey, JSON.stringify(list.slice(0, 6)));
    } catch {}
  }, [fields, initialValues, slug, title, shortName, category, categoryName]);

  const validateValue = (field: CalculatorField, rawVal: number | string | boolean): string | null => {
    if (field.type === 'number' || field.type === 'slider') {
      const num = Number(rawVal);
      if (rawVal === '' || isNaN(num)) {
        return 'Please enter a valid number.';
      }
      if (field.min !== undefined && num < field.min) {
        return `Minimum value is ${field.min}.`;
      }
      if (field.max !== undefined && num > field.max) {
        return `Maximum value is ${field.max}.`;
      }
    }
    return null;
  };

  const validateAndSet = (
    field: CalculatorField,
    rawVal: number | string | boolean,
    rawStr?: string
  ) => {
    const nextErrors = { ...errors };

    if (rawStr !== undefined) {
      setRawStrings((prev) => ({ ...prev, [field.name]: rawStr }));
    } else {
      setRawStrings((prev) => {
        if (!(field.name in prev)) return prev;
        const copy = { ...prev };
        delete copy[field.name];
        return copy;
      });
    }

    if (rawStr !== undefined && rawStr.trim() === '') {
      nextErrors[field.name] = 'Enter a measurement value.';
      setErrors(nextErrors);
      return;
    }

    const msg = validateValue(field, rawVal);
    if (msg) {
      nextErrors[field.name] = msg;
    } else {
      delete nextErrors[field.name];
    }

    setErrors(nextErrors);
    setValues((prev) => ({ ...prev, [field.name]: rawVal }));
    setSavedProject(false);
    setSavedCompare(false);
  };

  const handleFeetInchesChange = (field: CalculatorField, part: 'feet' | 'inches', rawInput: string) => {
    const numVal = rawInput === '' ? 0 : parseFloat(rawInput);
    const current = inchesSplit[field.name] || {
      feet: Math.floor(Number(values[field.name]) || 0),
      inches: 0,
    };
    const safePartVal = isNaN(numVal) ? 0 : Math.max(0, numVal);
    const updated = {
      ...current,
      [part]: safePartVal,
    };
    setInchesSplit((prev) => ({ ...prev, [field.name]: updated }));
    const decimalFt = Number(feetInchesToDecimalFeet(updated.feet, updated.inches).toFixed(4));
    validateAndSet(field, decimalFt);
  };

  const handleUnitSystemSwitch = (nextUnit: 'imperial' | 'metric') => {
    if (nextUnit === unitSystem) return;
    setUnitSystem(nextUnit);
    setRawStrings({});
    if (nextUnit === 'imperial') {
      setInchesSplit(buildInitialSplits(fields, values));
    }
  };

  const handleReset = () => {
    setValues(initialValues);
    setRawStrings({});
    setUnitSystem('imperial');
    setInchesSplit(buildInitialSplits(fields, initialValues));
    setErrors({});
    setSavedProject(false);
    setSavedCompare(false);
    setCopiedLink(false);
    setCopiedResult(false);
    if (typeof window !== 'undefined' && window.location.search) {
      window.history.replaceState({}, '', window.location.pathname);
    }
  };

  const formulaInputValues = useMemo(() => {
    if (unitSystem === 'imperial') return values;
    const converted: Record<string, number | string | boolean> = { ...values };
    for (const f of fields) {
      if ((f.type === 'number' || f.type === 'slider') && !f.isEditableDefault) {
        const v = Number(values[f.name]) || 0;
        if (f.unit === 'ft') {
          converted[f.name] = metersToFeet(v);
        } else if (f.unit === 'sq ft') {
          converted[f.name] = sqMetersToSqFeet(v);
        } else if (f.unit === 'in') {
          converted[f.name] = v / 2.54;
        }
      }
    }
    return converted;
  }, [values, unitSystem, fields]);

  const output: CalculationResult = useMemo(() => {
    return runCalculatorFormula(slug, formulaInputValues);
  }, [slug, formulaInputValues]);

  // Surface dimensional & project option parameters upfront; keep prices & engineering yield rates in calibration drawer
  const primaryFields = useMemo(
    () => fields.filter((f) => !CALIBRATION_ONLY_FIELDS.has(f.name)),
    [fields]
  );
  const advancedFields = useMemo(
    () => fields.filter((f) => CALIBRATION_ONLY_FIELDS.has(f.name)),
    [fields]
  );

  const dimensionFields = useMemo(
    () => (primaryFields.length >= 4 ? primaryFields.filter(isDimensionField) : primaryFields),
    [primaryFields]
  );
  const specFields = useMemo(
    () => (primaryFields.length >= 4 ? primaryFields.filter((f) => !isDimensionField(f)) : []),
    [primaryFields]
  );

  const buildShareQuery = () => {
    const params = new URLSearchParams();
    for (const f of fields) {
      const val = values[f.name];
      if (val !== undefined && val !== f.defaultValue) {
        params.set(f.name, String(val));
      }
    }
    if (unitSystem === 'metric') {
      params.set('units', 'metric');
    }
    const qs = params.toString();
    return `${typeof window !== 'undefined' ? window.location.pathname : `/calculators/${slug}/`}${qs ? `?${qs}` : ''}`;
  };

  const recordHistorySnapshot = () => {
    if (typeof window === 'undefined') return;
    try {
      const historyKey = 'buildmath_calc_history';
      const existingRaw = localStorage.getItem(historyKey);
      const existing = existingRaw ? JSON.parse(existingRaw) : [];
      const sharePath = buildShareQuery();
      const summaryInputs = primaryFields
        .slice(0, 4)
        .map((f) => `${f.label}: ${values[f.name]}${f.unit ? ` ${displayUnit(f.unit)}` : ''}`)
        .join(' · ');

      const entry = {
        id: `${slug}-${Date.now()}`,
        slug,
        title,
        shortName: shortName || title,
        timestamp: new Date().toISOString(),
        primaryLabel: output.primaryResult.label,
        primaryValue: output.primaryResult.value,
        primaryUnit: output.primaryResult.unit,
        costTypical: output.costEstimate.typical,
        costLow: output.costEstimate.low,
        costHigh: output.costEstimate.high,
        inputsSummary: summaryInputs,
        restoreUrl: sharePath,
      };
      const deduped = Array.isArray(existing)
        ? existing.filter((item) => !(item.slug === slug && item.inputsSummary === summaryInputs))
        : [];
      deduped.unshift(entry);
      localStorage.setItem(historyKey, JSON.stringify(deduped.slice(0, 15)));
    } catch {}
  };

  const handleCalculateConfirm = () => {
    const nextErrors: Record<string, string> = { ...errors };
    let firstInvalidId: string | null = null;
    for (const f of fields) {
      if (f.name in rawStrings && rawStrings[f.name].trim() === '') {
        nextErrors[f.name] = 'Enter a measurement value.';
        if (!firstInvalidId) firstInvalidId = `field-${f.name}`;
        continue;
      }
      const msg = validateValue(f, values[f.name]);
      if (msg) {
        nextErrors[f.name] = msg;
        if (!firstInvalidId) firstInvalidId = `field-${f.name}`;
      }
    }
    setErrors(nextErrors);
    if (firstInvalidId && typeof document !== 'undefined') {
      document.getElementById(firstInvalidId)?.focus();
      return;
    }

    recordHistorySnapshot();
    setPulseResult(false);
    requestAnimationFrame(() => setPulseResult(true));
    setCalculatedNotice(true);
    setTimeout(() => setCalculatedNotice(false), 1800);

    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleCopyResult = () => {
    if (typeof window === 'undefined') return;
    recordHistorySnapshot();
    const lines = [
      `${title} — BuildMath Estimate`,
      `Primary Quantity: ${output.primaryResult.value} ${output.primaryResult.unit} (Net unrounded: ${output.primaryResult.exactValue} ${output.primaryResult.unit})`,
      `Material Cost Estimate: $${output.costEstimate.typical.toLocaleString()} ($${output.costEstimate.low.toLocaleString()} - $${output.costEstimate.high.toLocaleString()})`,
      '',
      'Materials Shopping List:',
      ...output.materials.map(
        (m) => `- ${m.quantity.toLocaleString()} ${m.unit} ${m.name} (Est. $${m.totalTypical.toLocaleString()})`
      ),
    ];
    if (navigator.clipboard) {
      navigator.clipboard.writeText(lines.join('\n')).catch(() => {});
    }
    setCopiedResult(true);
    setTimeout(() => setCopiedResult(false), 2200);
  };

  const handleShareUrl = () => {
    if (typeof window === 'undefined') return;
    const sharePath = buildShareQuery();
    const shareUrl = `${window.location.origin}${sharePath}`;
    window.history.replaceState({}, '', shareUrl);
    recordHistorySnapshot();
    if (navigator.clipboard) {
      navigator.clipboard.writeText(shareUrl).catch(() => {});
    }
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleAddToProject = () => {
    if (typeof window === 'undefined') return;
    try {
      const key = 'buildmath_project_list';
      const existingRaw = localStorage.getItem(key);
      const existing = existingRaw ? JSON.parse(existingRaw) : [];
      const sharePath = buildShareQuery();
      const entry = {
        id: `${slug}-${Date.now()}`,
        slug,
        title,
        category,
        categoryName,
        timestamp: new Date().toISOString(),
        primaryLabel: output.primaryResult.label,
        primaryValue: output.primaryResult.value,
        primaryUnit: output.primaryResult.unit,
        costLow: output.costEstimate.low,
        costTypical: output.costEstimate.typical,
        costHigh: output.costEstimate.high,
        materials: output.materials,
        shareUrl: sharePath,
      };
      existing.push(entry);
      localStorage.setItem(key, JSON.stringify(existing));
      recordHistorySnapshot();
      window.dispatchEvent(new CustomEvent('buildmath:project-updated'));
      setSavedProject(true);
    } catch (e) {
      console.error('Could not save to localStorage', e);
    }
  };

  const handleSaveToCompare = () => {
    if (typeof window === 'undefined') return;
    try {
      const compareKey = 'buildmath_compare_list';
      const existingRaw = localStorage.getItem(compareKey);
      const existing = existingRaw ? JSON.parse(existingRaw) : [];
      const list = Array.isArray(existing) ? existing : [];
      const scenarioLabel = primaryFields
        .slice(0, 3)
        .map((f) => `${values[f.name]}${f.unit ? ` ${displayUnit(f.unit)}` : ''}`)
        .join(' × ');
      list.unshift({
        id: `${slug}-${Date.now()}`,
        slug,
        title,
        scenarioLabel: scenarioLabel || 'Default Scenario',
        primaryLabel: output.primaryResult.label,
        primaryValue: output.primaryResult.value,
        primaryUnit: output.primaryResult.unit,
        costLow: output.costEstimate.low,
        costTypical: output.costEstimate.typical,
        costHigh: output.costEstimate.high,
        secondaryResults: output.secondaryResults.slice(0, 4),
        restoreUrl: buildShareQuery(),
      });
      localStorage.setItem(compareKey, JSON.stringify(list.slice(0, 3)));
      recordHistorySnapshot();
      setSavedCompare(true);
    } catch {}
  };

  const scrollToResults = () => {
    resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const displayUnit = (u?: string) => {
    if (!u) return '';
    if (unitSystem === 'imperial') return u;
    if (u === 'ft') return 'm';
    if (u === 'sq ft') return 'sq m';
    if (u === 'in') return 'cm';
    return u;
  };

  const renderField = (field: CalculatorField) => {
    const err = errors[field.name];
    const isSlider = field.type === 'slider' || field.name === 'wastePercent' || field.name === 'overlapWastePercent';
    const isSegmented =
      field.type === 'select' &&
      field.options &&
      field.options.length >= 2 &&
      field.options.length <= 4 &&
      field.options.every((opt) => String(opt.label).length <= 26);
    const unitBadge = displayUnit(field.unit);
    const spanFull = field.type === 'boolean' || isSlider || isSegmented;

    const currentNumberVal =
      field.name in rawStrings ? rawStrings[field.name] : String(values[field.name] ?? '');

    return (
      <div key={field.name} class={spanFull ? 'sm:col-span-2' : ''}>
        {field.type !== 'boolean' && (
          <div class="flex items-center justify-between gap-2 mb-1.5">
            <label
              htmlFor={`field-${field.name}`}
              id={isSegmented ? `label-${field.name}` : undefined}
              class="block text-xs sm:text-sm font-semibold text-ink"
            >
              {field.label}
            </label>
            {field.unit && !isSlider && (
              <span class="font-mono text-[11px] text-ink-muted uppercase">{unitBadge}</span>
            )}
          </div>
        )}

        {field.type === 'number' && field.acceptsFeetInches && unitSystem === 'imperial' ? (
          <div class="grid grid-cols-2 gap-2">
            <div class="relative">
              <input
                id={`field-${field.name}`}
                type="number"
                inputMode="decimal"
                min={0}
                max={field.max || 5000}
                step="1"
                value={inchesSplit[field.name]?.feet ?? Math.floor(Number(values[field.name]) || 0)}
                onInput={(e) => handleFeetInchesChange(field, 'feet', (e.target as HTMLInputElement).value)}
                aria-invalid={!!err}
                aria-describedby={err ? `err-${field.name}` : undefined}
                class={`bm-input pr-10 ${err ? '!border-red-500' : ''}`}
              />
              <span class="pointer-events-none absolute inset-y-0 right-3 flex items-center font-mono text-xs text-ink-muted">
                ft
              </span>
            </div>
            <div class="relative">
              <input
                id={`field-${field.name}-in`}
                aria-label={`${field.label} inches`}
                type="number"
                inputMode="decimal"
                min={0}
                max={11.9}
                step="0.5"
                value={inchesSplit[field.name]?.inches ?? 0}
                onInput={(e) => handleFeetInchesChange(field, 'inches', (e.target as HTMLInputElement).value)}
                class="bm-input pr-10"
              />
              <span class="pointer-events-none absolute inset-y-0 right-3 flex items-center font-mono text-xs text-ink-muted">
                in
              </span>
            </div>
          </div>
        ) : isSlider ? (
          <div class="p-3 rounded-lg bg-surface-subtle/70 border border-hairline flex items-center gap-3.5">
            <input
              id={`field-${field.name}-slider`}
              aria-label={`${field.label} slider`}
              type="range"
              min={field.min ?? 0}
              max={field.max ?? 30}
              step={field.step ?? 1}
              value={Number(values[field.name]) || 0}
              onInput={(e) => validateAndSet(field, parseFloat((e.target as HTMLInputElement).value))}
              class="bm-range flex-1"
            />
            <div class="relative w-20 shrink-0">
              <input
                id={`field-${field.name}`}
                type="number"
                inputMode="decimal"
                min={field.min ?? 0}
                max={field.max ?? 50}
                step={field.step ?? 1}
                value={currentNumberVal}
                onInput={(e) => {
                  const str = (e.target as HTMLInputElement).value;
                  const parsed = parseFloat(str);
                  validateAndSet(field, isNaN(parsed) ? str : parsed, str);
                }}
                aria-invalid={!!err}
                class="bm-input !min-h-[34px] !py-1 pr-6 text-right font-mono text-xs font-bold"
              />
              <span class="pointer-events-none absolute inset-y-0 right-2 flex items-center font-mono text-[11px] text-ink-muted">
                %
              </span>
            </div>
          </div>
        ) : field.type === 'number' ? (
          <div class="relative">
            <input
              id={`field-${field.name}`}
              type="number"
              inputMode="decimal"
              min={field.min}
              max={field.max}
              step={field.step ?? 'any'}
              value={currentNumberVal}
              onInput={(e) => {
                const str = (e.target as HTMLInputElement).value;
                const parsed = parseFloat(str);
                validateAndSet(field, isNaN(parsed) ? str : parsed, str);
              }}
              aria-invalid={!!err}
              aria-describedby={err ? `err-${field.name}` : undefined}
              class={`bm-input ${unitBadge ? 'pr-14' : ''} ${err ? '!border-red-500' : ''}`}
            />
            {unitBadge && (
              <span class="pointer-events-none absolute inset-y-0 right-3 flex items-center font-mono text-[11px] text-ink-muted">
                {unitBadge}
              </span>
            )}
          </div>
        ) : isSegmented && field.options ? (
          <div
            id={`field-${field.name}`}
            role="group"
            aria-labelledby={`label-${field.name}`}
            class="flex flex-wrap gap-1.5 p-1 rounded-lg bg-surface-subtle border border-hairline"
          >
            {field.options.map((opt) => {
              const isSelected = String(values[field.name]) === String(opt.value);
              return (
                <button
                  key={String(opt.value)}
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() => validateAndSet(field, opt.value)}
                  class={`flex-1 min-w-[84px] px-3 py-2 rounded-md text-xs font-medium transition-all min-h-[36px] ${
                    isSelected
                      ? 'bg-graphite-900 text-[#F8F8F5] dark:bg-lime-500 dark:text-graphite-900 font-semibold shadow-sm'
                      : 'text-ink-muted hover:text-ink hover:bg-surface/60'
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        ) : field.type === 'select' ? (
          <div class="relative">
            <select
              id={`field-${field.name}`}
              value={String(values[field.name])}
              onChange={(e) => {
                const raw = (e.target as HTMLSelectElement).value;
                const parsed = isNaN(Number(raw)) ? raw : Number(raw);
                validateAndSet(field, parsed);
              }}
              class="bm-input appearance-none pr-9 cursor-pointer"
            >
              {field.options?.map((opt) => (
                <option key={String(opt.value)} value={String(opt.value)}>
                  {opt.label}
                </option>
              ))}
            </select>
            <span class="pointer-events-none absolute inset-y-0 right-3 flex items-center text-ink-muted">
              <LucideIcon name="chevron-down" size={15} />
            </span>
          </div>
        ) : (
          <label
            htmlFor={`field-${field.name}`}
            class={`flex items-center justify-between gap-3 px-3.5 py-3 rounded-lg border cursor-pointer transition-colors ${
              values[field.name]
                ? 'border-blueprint bg-blueprint-soft'
                : 'border-hairline bg-surface-subtle/60 hover:border-hairline-strong'
            }`}
          >
            <div class="min-w-0">
              <span class="block text-xs sm:text-sm font-semibold text-ink">
                {field.label}
              </span>
              {field.tooltip && field.tooltip !== field.label && (
                <span class="block text-[11px] text-ink-muted mt-0.5 leading-snug">
                  {field.tooltip}
                </span>
              )}
            </div>
            <input
              id={`field-${field.name}`}
              type="checkbox"
              checked={Boolean(values[field.name])}
              onChange={(e) => validateAndSet(field, (e.target as HTMLInputElement).checked)}
              class="h-5 w-5 rounded border-hairline-strong text-blueprint accent-[#4779A8] dark:accent-[#C6F36A] shrink-0"
            />
          </label>
        )}

        {field.tooltip && field.type !== 'boolean' && (
          <p class="mt-1.5 flex items-start gap-1.5 text-[11px] text-ink-muted leading-snug">
            <LucideIcon name="info" size={12} class="mt-0.5 text-blueprint shrink-0" />
            <span>{field.tooltip}</span>
          </p>
        )}

        {err && (
          <p
            id={`err-${field.name}`}
            role="alert"
            class="mt-1.5 flex items-center gap-1 text-xs font-medium text-red-600 dark:text-red-400"
          >
            <LucideIcon name="alert-triangle" size={13} />
            <span>{err}</span>
          </p>
        )}
      </div>
    );
  };

  // Dynamic CAD blueprint label extraction across calculator schemas
  const blueprintLen =
    values.roomLengthFeet ??
    values.roomLength ??
    values.lengthFeet ??
    values.patioLengthFeet ??
    values.deckLengthFeet ??
    values.areaLength ??
    12;
  const blueprintWid =
    values.roomWidthFeet ??
    values.roomWidth ??
    values.widthFeet ??
    values.patioWidthFeet ??
    values.deckWidthFeet ??
    values.areaWidth ??
    12;
  const blueprintHt = values.wallHeightFeet ?? values.wallHeight ?? 8;
  const pitchRiseVal = values.riseInches ?? values.pitchRise ?? values.rise ?? 6;
  const postSpaceVal = values.postSpacingFeet ?? values.postSpacing ?? 8;

  // Detect waste % & alternative delivery / bulk comparison rows for enhanced Results Dashboard
  const wasteFieldValue =
    values.wastePercent !== undefined
      ? Number(values.wastePercent)
      : values.overlapWastePercent !== undefined
        ? Number(values.overlapWastePercent)
        : null;

  const highlightedStats = output.secondaryResults.filter((s) => s.highlight || /bags needed/i.test(s.label));
  const deliveryEstimate = output.secondaryResults.find((s) => /truck|bulk delivery/i.test(s.label));
  const detailMetrics = output.secondaryResults.filter(
    (s) => !highlightedStats.includes(s) && s !== deliveryEstimate
  );

  return (
    <div class="my-6 pb-20 lg:pb-0">
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT DECK: Engineering Input Workbench */}
        <div class="lg:col-span-7 bm-panel overflow-hidden">
          <div class="px-5 py-4 border-b border-hairline bg-surface-subtle/50 flex flex-wrap items-center justify-between gap-3">
            <div class="flex items-center gap-2.5">
              <span class="flex h-8 w-8 items-center justify-center rounded-md bg-surface border border-hairline text-blueprint">
                <LucideIcon name={getCategoryIconName(category)} size={16} />
              </span>
              <div>
                <h2 class="text-sm sm:text-base font-bold text-ink leading-tight">
                  Input Parameters
                </h2>
                <span class="font-mono text-[10px] uppercase tracking-wider text-ink-muted">
                  Real-time unit conversion &amp; takeoff
                </span>
              </div>
            </div>

            <div class="flex items-center gap-2">
              <div
                role="group"
                aria-label="Measurement unit system"
                class="inline-flex rounded-lg bg-canvas border border-hairline p-0.5 text-xs font-medium"
              >
                <button
                  type="button"
                  onClick={() => handleUnitSystemSwitch('imperial')}
                  aria-pressed={unitSystem === 'imperial'}
                  class={`px-2.5 py-1.5 rounded-md font-mono text-[11px] transition-colors min-h-[32px] ${
                    unitSystem === 'imperial'
                      ? 'bg-graphite-900 text-[#F8F8F5] dark:bg-lime-500 dark:text-graphite-900 font-semibold'
                      : 'text-ink-muted hover:text-ink'
                  }`}
                >
                  ft / in
                </button>
                <button
                  type="button"
                  onClick={() => handleUnitSystemSwitch('metric')}
                  aria-pressed={unitSystem === 'metric'}
                  class={`px-2.5 py-1.5 rounded-md font-mono text-[11px] transition-colors min-h-[32px] ${
                    unitSystem === 'metric'
                      ? 'bg-graphite-900 text-[#F8F8F5] dark:bg-lime-500 dark:text-graphite-900 font-semibold'
                      : 'text-ink-muted hover:text-ink'
                  }`}
                >
                  m / cm
                </button>
              </div>

              <button
                type="button"
                onClick={handleReset}
                title="Reset all inputs to published defaults"
                aria-label="Reset inputs to defaults"
                class="inline-flex items-center justify-center h-[36px] w-[36px] rounded-lg border border-hairline bg-surface text-ink-muted hover:text-ink hover:border-hairline-strong transition-colors"
              >
                <LucideIcon name="rotate-ccw" size={15} />
              </button>
            </div>
          </div>

          <div class="p-5 sm:p-6 space-y-6">
            <div>
              {specFields.length > 0 && (
                <div class="flex items-center gap-2 mb-3.5">
                  <span class="font-mono text-[11px] font-semibold uppercase tracking-wider text-blueprint">
                    01 // Project Dimensions &amp; Geometry
                  </span>
                  <div class="h-px flex-1 bg-hairline"></div>
                </div>
              )}
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {dimensionFields.map((field) => renderField(field))}
              </div>
            </div>

            {specFields.length > 0 && (
              <div>
                <div class="flex items-center gap-2 mb-3.5">
                  <span class="font-mono text-[11px] font-semibold uppercase tracking-wider text-blueprint">
                    02 // Options, Packaging &amp; Waste Allowance
                  </span>
                  <div class="h-px flex-1 bg-hairline"></div>
                </div>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {specFields.map((field) => renderField(field))}
                </div>
              </div>
            )}

            {advancedFields.length > 0 && (
              <div class="pt-4 border-t border-hairline">
                <button
                  type="button"
                  onClick={() => setShowDefaults(!showDefaults)}
                  aria-expanded={showDefaults}
                  class="flex w-full items-center justify-between gap-3 px-3.5 py-2.5 rounded-lg bg-surface-subtle/60 border border-hairline hover:border-hairline-strong text-left transition-colors"
                >
                  <span class="flex items-center gap-2 text-xs sm:text-sm font-semibold text-ink">
                    <LucideIcon name="sliders-horizontal" size={15} class="text-blueprint" />
                    <span>Customize Unit Prices &amp; Coverage Rates</span>
                    <span class="font-mono text-[10px] text-ink-muted bg-surface px-1.5 py-0.5 rounded border border-hairline">
                      {advancedFields.length} defaults
                    </span>
                  </span>
                  <LucideIcon
                    name="chevron-down"
                    size={16}
                    class={`text-ink-muted transition-transform duration-150 ${showDefaults ? 'rotate-180' : ''}`}
                  />
                </button>

                {showDefaults && (
                  <div class="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-lg bg-canvas border border-hairline">
                    {advancedFields.map((field) => renderField(field))}
                  </div>
                )}
              </div>
            )}

            {/* Primary Calculate & Reset Bar */}
            <div class="no-print pt-4 border-t border-hairline flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
              <button
                type="button"
                onClick={handleCalculateConfirm}
                data-testid="calculate-btn"
                class="bm-btn-lime flex-1 font-bold text-sm"
              >
                <LucideIcon name="calculator" size={16} />
                <span>{calculatedNotice ? 'Estimate Updated' : 'Calculate Estimate'}</span>
              </button>
              <button
                type="button"
                onClick={handleReset}
                data-testid="reset-btn"
                class="bm-btn-secondary text-sm px-4"
              >
                <LucideIcon name="rotate-ccw" size={15} />
                <span>Reset Defaults</span>
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT DECK: Project Estimate & Material Purchasing Dashboard */}
        <div
          ref={resultsRef}
          aria-live="polite"
          aria-atomic="true"
          class={`lg:col-span-5 bm-instrument-rim overflow-hidden lg:sticky lg:top-20 ${
            pulseResult ? 'animate-result-pulse' : ''
          }`}
        >
          {/* Dashboard Header Bar */}
          <div class="px-5 py-3.5 border-b border-graphite-700 bg-graphite-950/60 flex items-center justify-between gap-2">
            <span class="inline-flex items-center gap-2 font-mono text-[11px] font-semibold uppercase tracking-wider text-[#D2D6DC]">
              <span class="h-2 w-2 rounded-full bg-lime-500"></span>
              <span>Project Estimate · Calculated</span>
            </span>
            <div class="no-print flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleCopyResult}
                aria-label="Copy results"
                class="inline-flex items-center gap-1 px-2 py-1 rounded text-[11px] font-mono text-[#9BA1AA] hover:text-[#F8F8F5] hover:bg-graphite-800 transition-colors"
              >
                <LucideIcon name={copiedResult ? 'check' : 'copy'} size={13} class={copiedResult ? 'text-lime-500' : ''} />
                <span>{copiedResult ? 'Copied' : 'Copy Results'}</span>
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                aria-label="Export PDF or Print estimate"
                class="inline-flex items-center gap-1 px-2 py-1 rounded text-[11px] font-mono text-[#9BA1AA] hover:text-[#F8F8F5] hover:bg-graphite-800 transition-colors"
              >
                <LucideIcon name="printer" size={13} />
                <span>Export PDF</span>
              </button>
            </div>
          </div>

          <div class="p-5 sm:p-6 space-y-5">
            {/* Hero Result Display */}
            <div class="bm-corner-ticks p-4 sm:p-5 rounded-lg bg-graphite-950 border border-graphite-700">
              <div class="flex items-center justify-between gap-2">
                <span class="text-xs font-mono uppercase tracking-wider text-[#9BA1AA]">
                  {output.primaryResult.label}
                </span>
                {wasteFieldValue !== null && wasteFieldValue > 0 && (
                  <span class="font-mono text-[10px] px-2 py-0.5 rounded bg-lime-500/15 text-lime-500 border border-lime-500/30">
                    Incl. {wasteFieldValue}% waste
                  </span>
                )}
              </div>

              <div class="mt-2 flex items-baseline gap-2.5 flex-wrap">
                <span
                  data-testid="primary-result-value"
                  class="text-4xl sm:text-5xl font-extrabold text-[#F8F8F5] tracking-tight tabular-nums leading-none"
                >
                  {output.primaryResult.value}
                </span>
                <span class="text-base sm:text-lg font-mono font-semibold text-lime-500">
                  {output.primaryResult.unit}
                </span>
              </div>

              <div class="mt-3 pt-3 border-t border-graphite-700/80 flex flex-wrap items-center justify-between gap-2 font-mono text-[11px] text-[#9BA1AA]">
                <span class="tabular-nums">
                  {wasteFieldValue !== null && wasteFieldValue > 0 ? 'Net pre-waste base:' : 'Unrounded exact:'}{' '}
                  <strong class="text-[#F8F8F5]">
                    {output.primaryResult.exactValue} {output.primaryResult.unit}
                  </strong>
                </span>
                {output.primaryResult.subtitle && (
                  <span class="text-[#6FA3D2]">{output.primaryResult.subtitle}</span>
                )}
              </div>

              {affiliateEnabled && output.materials.length > 0 && (() => {
                const primaryMat = output.materials[0];
                const primaryProd = primaryMat?.productId ? productsMap[primaryMat.productId] : undefined;
                if (!primaryProd) return null;
                return (
                  <div class="no-print mt-4 pt-3 border-t border-graphite-700">
                    <a
                      href={`/go/${primaryProd.id}/`}
                      target="_blank"
                      rel="sponsored nofollow noopener"
                      data-testid="primary-affiliate-cta"
                      class="w-full bm-btn-lime text-xs sm:text-sm font-bold"
                    >
                      <span>
                        Check {primaryMat.quantity.toLocaleString()} {primaryMat.unit} at {primaryProd.retailer}
                      </span>
                      <LucideIcon name="arrow-up-right" size={15} />
                    </a>
                  </div>
                );
              })()}
            </div>

            {/* Code Compliance Banner */}
            {output.complianceCheck && (
              <div
                class={`p-3.5 rounded-lg border text-xs leading-relaxed flex items-start gap-2.5 ${
                  output.complianceCheck.passed
                    ? 'bg-emerald-950/60 border-emerald-700/80 text-emerald-200'
                    : 'bg-amber-950/60 border-amber-700/80 text-amber-200'
                }`}
              >
                <LucideIcon
                  name={output.complianceCheck.passed ? 'check-circle-2' : 'alert-triangle'}
                  size={16}
                  class={output.complianceCheck.passed ? 'text-lime-500 mt-0.5' : 'text-amber-400 mt-0.5'}
                />
                <span>{output.complianceCheck.message}</span>
              </div>
            )}

            {/* Highlighted Package Equivalents (e.g. 80-lb, 60-lb, 40-lb Bags) */}
            {highlightedStats.length > 0 && (
              <div class={`grid gap-2.5 ${highlightedStats.length >= 2 ? 'grid-cols-2 sm:grid-cols-3' : 'grid-cols-1'}`}>
                {highlightedStats.map((stat) => (
                  <div
                    key={stat.label}
                    class="p-3 rounded-lg bg-graphite-800 border border-graphite-700"
                  >
                    <span class="font-mono text-[10px] uppercase tracking-wider text-[#9BA1AA] block truncate">
                      {stat.label.replace(/\s*\(.*?\)/g, '')}
                    </span>
                    <div class="mt-1 flex items-baseline gap-1.5">
                      <strong class="text-xl font-extrabold text-lime-500 tabular-nums">
                        {stat.value}
                      </strong>
                      <span class="font-mono text-[11px] text-[#D2D6DC]">{stat.unit}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Additional Technical Metrics */}
            {detailMetrics.length > 0 && (
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {detailMetrics.map((sec) => (
                  <div
                    key={sec.label}
                    class="px-3.5 py-2.5 rounded-lg bg-graphite-800/60 border border-graphite-700 flex flex-col justify-between"
                  >
                    <span class="text-[11px] text-[#9BA1AA] truncate">{sec.label}</span>
                    <span class="mt-0.5 text-sm font-bold text-[#F8F8F5] font-mono tabular-nums">
                      {sec.value} {sec.unit || ''}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* CAD Dimension Schematic Preview */}
            {diagramType && (
              <div class="p-3.5 rounded-lg bg-graphite-950 border border-graphite-700 bm-cad-grid">
                <div class="flex items-center justify-between mb-2">
                  <span class="font-mono text-[10px] uppercase tracking-wider text-[#6FA3D2]">
                    Scaled Blueprint Schematic
                  </span>
                  <span class="font-mono text-[10px] text-[#9BA1AA]">LIVE</span>
                </div>

                {diagramType === 'concrete-slab' && (
                  <svg viewBox="0 0 260 100" class="w-full h-24" role="img" aria-label="Concrete slab length width thickness diagram">
                    <polygon points="34,36 184,20 226,46 76,62" fill="rgba(71,121,168,0.22)" stroke="#6FA3D2" stroke-width="1.75" />
                    <polygon points="34,36 76,62 76,78 34,52" fill="rgba(198,243,106,0.22)" stroke="#C6F36A" stroke-width="1.5" />
                    <polygon points="76,62 226,46 226,62 76,78" fill="rgba(71,121,168,0.12)" stroke="#6FA3D2" stroke-width="1.5" />
                    <text x="130" y="94" font-size="10" font-family="JetBrains Mono, monospace" fill="#C6F36A" text-anchor="middle">
                      L {blueprintLen}' × W {blueprintWid}' × {values.thicknessInches || 4}" THICK
                    </text>
                  </svg>
                )}

                {diagramType === 'concrete-footing' && (
                  <svg viewBox="0 0 260 100" class="w-full h-24" role="img" aria-label="Concrete footing sonotube depth diagram">
                    <ellipse cx="130" cy="24" rx="34" ry="10" fill="rgba(71,121,168,0.22)" stroke="#6FA3D2" stroke-width="1.75" />
                    <path d="M96 24v46c0 5.5 15.2 10 34 10s34-4.5 34-10V24" fill="rgba(71,121,168,0.12)" stroke="#6FA3D2" stroke-width="1.75" />
                    <text x="130" y="95" font-size="10" font-family="JetBrains Mono, monospace" fill="#C6F36A" text-anchor="middle">
                      {values.shape === 'rectangular' ? `${values.rectLengthInches || 16}"×${values.rectWidthInches || 16}" PAD` : `${values.diameterInches || 12}" DIA`} × {values.depthInches || 42}" DEEP
                    </text>
                  </svg>
                )}

                {diagramType === 'roof-pitch' && (
                  <svg viewBox="0 0 260 110" class="w-full h-24" role="img" aria-label="Roof pitch right triangle diagram">
                    <polygon points="24,88 214,88 214,24" fill="rgba(71,121,168,0.18)" stroke="#6FA3D2" stroke-width="2" />
                    <rect x="206" y="80" width="8" height="8" fill="none" stroke="#6FA3D2" stroke-width="1" />
                    <text x="119" y="103" font-size="10" font-family="JetBrains Mono, monospace" fill="#9BA1AA" text-anchor="middle">
                      RUN: {values.runInches || 12} in
                    </text>
                    <text x="220" y="60" font-size="10" font-family="JetBrains Mono, monospace" fill="#C6F36A">
                      {pitchRiseVal}"
                    </text>
                    <text x="92" y="47" font-size="11" font-weight="bold" font-family="JetBrains Mono, monospace" fill="#F8F8F5">
                      ×{output.primaryResult.exactValue}
                    </text>
                  </svg>
                )}

                {diagramType === 'stair-stringer' && (
                  <svg viewBox="0 0 260 110" class="w-full h-24" role="img" aria-label="Stair stringer rise and run diagram">
                    <polyline
                      points="22,92 22,73 66,73 66,54 110,54 110,35 154,35 154,16 198,16 198,92 22,92"
                      fill="rgba(71,121,168,0.18)"
                      stroke="#6FA3D2"
                      stroke-width="2"
                    />
                    <text x="115" y="106" font-size="10" font-family="JetBrains Mono, monospace" fill="#C6F36A" text-anchor="middle">
                      {output.primaryResult.value} RISERS // {values.totalRiseInches || 108}" RISE
                    </text>
                  </svg>
                )}

                {diagramType === 'room-walls' && (
                  <svg viewBox="0 0 260 100" class="w-full h-20" role="img" aria-label="Room perimeter and walls diagram">
                    <rect x="36" y="16" width="188" height="62" rx="3" fill="rgba(71,121,168,0.16)" stroke="#6FA3D2" stroke-width="2" />
                    <text x="130" y="51" font-size="11" font-weight="bold" font-family="JetBrains Mono, monospace" fill="#C6F36A" text-anchor="middle">
                      {blueprintLen}' × {blueprintWid}' ({blueprintHt}' H)
                    </text>
                  </svg>
                )}

                {diagramType === 'fence-layout' && (
                  <svg viewBox="0 0 260 92" class="w-full h-20" role="img" aria-label="Fence post and rail section diagram">
                    <rect x="26" y="14" width="7" height="58" fill="#C6F36A" rx="1" />
                    <rect x="126" y="14" width="7" height="58" fill="#C6F36A" rx="1" />
                    <rect x="226" y="14" width="7" height="58" fill="#C6F36A" rx="1" />
                    <line x1="33" y1="28" x2="226" y2="28" stroke="#6FA3D2" stroke-width="2.5" />
                    <line x1="33" y1="54" x2="226" y2="54" stroke="#6FA3D2" stroke-width="2.5" />
                    <text x="130" y="86" font-size="10" font-family="JetBrains Mono, monospace" fill="#9BA1AA" text-anchor="middle">
                      POST SPACING: {postSpaceVal} FT OC
                    </text>
                  </svg>
                )}

                {(diagramType === 'deck-layout' || diagramType === 'paver-grid') && (
                  <svg viewBox="0 0 260 94" class="w-full h-20" role="img" aria-label="Layout grid framing preview">
                    <rect x="34" y="14" width="192" height="56" fill="rgba(71,121,168,0.14)" stroke="#6FA3D2" stroke-width="1.75" />
                    <line x1="34" y1="32" x2="226" y2="32" stroke="#37404C" stroke-width="1" />
                    <line x1="34" y1="50" x2="226" y2="50" stroke="#37404C" stroke-width="1" />
                    <line x1="82" y1="14" x2="82" y2="70" stroke="#37404C" stroke-width="1" />
                    <line x1="130" y1="14" x2="130" y2="70" stroke="#37404C" stroke-width="1" />
                    <line x1="178" y1="14" x2="178" y2="70" stroke="#37404C" stroke-width="1" />
                    <text x="130" y="86" font-size="10" font-family="JetBrains Mono, monospace" fill="#C6F36A" text-anchor="middle">
                      LAYOUT {blueprintLen}' × {blueprintWid}'
                    </text>
                  </svg>
                )}
              </div>
            )}

            {/* Material Purchasing Options (Separate Bagged vs Ready-Mix / Bulk Comparison!) */}
            {deliveryEstimate ? (
              <div class="space-y-2.5">
                <div class="font-mono text-[10px] uppercase tracking-wider text-[#9BA1AA]">
                  Material Purchasing Options
                </div>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div class="p-3.5 rounded-lg bg-graphite-800 border border-graphite-700">
                    <span class="font-mono text-[10px] uppercase text-[#9BA1AA] block">
                      Bagged Material
                    </span>
                    <div class="text-xl font-extrabold text-lime-500 mt-1 tabular-nums">
                      ${output.costEstimate.typical.toLocaleString()}
                    </div>
                    <span class="font-mono text-[11px] text-[#D2D6DC] tabular-nums">
                      Range: ${output.costEstimate.low.toLocaleString()}–${output.costEstimate.high.toLocaleString()}
                    </span>
                  </div>
                  <div class="p-3.5 rounded-lg bg-graphite-800 border border-blueprint/50">
                    <span class="font-mono text-[10px] uppercase text-[#6FA3D2] block">
                      {deliveryEstimate.label.replace(/\s*Estimate/i, '')}
                    </span>
                    <div class="text-xl font-extrabold text-[#F8F8F5] mt-1 tabular-nums">
                      {deliveryEstimate.value}
                    </div>
                    <span class="font-mono text-[11px] text-[#9BA1AA] tabular-nums">
                      {deliveryEstimate.unit}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div class="p-4 rounded-lg bg-graphite-800/80 border border-graphite-700">
                <div class="flex items-center justify-between text-xs text-[#9BA1AA] mb-1">
                  <span>Est. Material Cost (US Avg)</span>
                  <span class="font-mono text-[#F8F8F5] tabular-nums">
                    Typical: ${output.costEstimate.typical.toLocaleString()}
                  </span>
                </div>
                <div class="text-xl sm:text-2xl font-extrabold text-lime-500 tabular-nums">
                  ${output.costEstimate.low.toLocaleString()} – ${output.costEstimate.high.toLocaleString()}
                </div>
              </div>
            )}

            {/* Itemized Materials Shopping List */}
            <div>
              <div class="flex items-center justify-between mb-2">
                <h3 class="font-mono text-[11px] font-semibold uppercase tracking-wider text-[#9BA1AA]">
                  Materials Shopping List
                </h3>
                <span class="font-mono text-[11px] text-[#6FA3D2] tabular-nums">
                  {output.materials.length} {output.materials.length === 1 ? 'item' : 'items'}
                </span>
              </div>
              <ul class="space-y-2">
                {output.materials.map((item) => {
                  const product = item.productId ? productsMap[item.productId] : undefined;
                  return (
                    <li
                      key={item.name}
                      class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-3.5 py-2.5 rounded-lg bg-graphite-950/80 border border-graphite-700"
                    >
                      <div class="min-w-0">
                        <div class="text-xs sm:text-sm font-semibold text-[#F8F8F5] tabular-nums">
                          {item.quantity.toLocaleString()} {item.unit} — {item.name}
                        </div>
                        <div class="font-mono text-[11px] text-[#9BA1AA] tabular-nums">
                          Est. ${item.totalTypical.toLocaleString()} (${item.unitPrice}/{item.unit})
                        </div>
                      </div>
                      {affiliateEnabled && product && (
                        <a
                          href={`/go/${product.id}/`}
                          target="_blank"
                          rel="sponsored nofollow noopener"
                          class="no-print inline-flex items-center justify-center gap-1 px-2.5 py-1.5 rounded text-xs font-semibold bg-lime-500 hover:bg-lime-600 text-graphite-900 transition-colors shrink-0"
                        >
                          <span>{product.retailer}</span>
                          <LucideIcon name="arrow-up-right" size={12} />
                        </a>
                      )}
                    </li>
                  );
                })}
              </ul>
              {affiliateEnabled && (
                <p class="no-print mt-2.5 text-[11px] text-[#8E949D] leading-snug">
                  {affiliateDisclosure}
                </p>
              )}
            </div>

            {/* Action Dock */}
            <div class="no-print pt-4 border-t border-graphite-700 space-y-2">
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={handleAddToProject}
                  data-testid="add-to-project-btn"
                  class="bm-btn-lime text-xs font-bold"
                >
                  <LucideIcon name={savedProject ? 'check' : 'bookmark-plus'} size={15} />
                  <span>{savedProject ? '✓ Saved to My Project List' : '+ Add to My Project List'}</span>
                </button>
                <button
                  type="button"
                  onClick={handleSaveToCompare}
                  class="inline-flex items-center justify-center gap-1.5 min-h-[42px] px-3 py-2 rounded-lg text-xs font-semibold bg-graphite-800 hover:bg-graphite-700 text-[#F8F8F5] border border-graphite-700 transition-colors"
                >
                  <LucideIcon name={savedCompare ? 'check' : 'git-compare'} size={14} class={savedCompare ? 'text-lime-500' : 'text-[#6FA3D2]'} />
                  <span>{savedCompare ? 'Added to Compare' : 'Compare Scenario'}</span>
                </button>
              </div>

              <div class="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={handleCopyResult}
                  class="inline-flex items-center justify-center gap-1.5 min-h-[38px] px-2.5 py-1.5 rounded-lg text-xs font-medium bg-graphite-950 hover:bg-graphite-800 text-[#D2D6DC] border border-graphite-700 transition-colors"
                >
                  <LucideIcon name={copiedResult ? 'check' : 'copy'} size={13} class={copiedResult ? 'text-lime-500' : ''} />
                  <span>{copiedResult ? 'Copied' : 'Copy'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  class="inline-flex items-center justify-center gap-1.5 min-h-[38px] px-2.5 py-1.5 rounded-lg text-xs font-medium bg-graphite-950 hover:bg-graphite-800 text-[#D2D6DC] border border-graphite-700 transition-colors"
                >
                  <LucideIcon name="printer" size={13} />
                  <span>PDF / Print</span>
                </button>
                <button
                  type="button"
                  onClick={handleShareUrl}
                  data-testid="share-url-btn"
                  class="inline-flex items-center justify-center gap-1.5 min-h-[38px] px-2.5 py-1.5 rounded-lg text-xs font-medium bg-graphite-950 hover:bg-graphite-800 text-[#D2D6DC] border border-graphite-700 transition-colors"
                >
                  <LucideIcon name={copiedLink ? 'check' : 'share-2'} size={13} class={copiedLink ? 'text-lime-500' : ''} />
                  <span>{copiedLink ? 'Copied' : 'Share'}</span>
                </button>
              </div>
            </div>

            {(savedProject || savedCompare) && (
              <p class="no-print text-xs text-center text-[#9BA1AA]">
                Updated workspace!{' '}
                <a href="/my-project/" class="text-lime-500 hover:underline font-semibold">
                  Open My Project Workspace →
                </a>
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Compact Summary Bar */}
      <div class="sticky-mobile-calc-bar lg:hidden fixed bottom-3 inset-x-3 z-30 rounded-xl bg-graphite-900/95 text-[#F8F8F5] px-4 py-2.5 border border-graphite-700 shadow-2xl backdrop-blur-md flex items-center justify-between gap-3">
        <div class="min-w-0">
          <div class="font-mono text-[10px] uppercase tracking-wider text-[#9BA1AA] truncate">
            {output.primaryResult.label}
          </div>
          <div class="text-sm sm:text-base font-extrabold text-lime-500 tabular-nums truncate">
            {output.primaryResult.value} {output.primaryResult.unit} · ${output.costEstimate.typical.toLocaleString()}
          </div>
        </div>
        <button
          type="button"
          onClick={scrollToResults}
          class="bm-btn-lime text-xs min-h-[36px] px-3 py-1.5 shrink-0 font-bold"
        >
          <span>Full Readout</span>
          <LucideIcon name="arrow-right" size={14} />
        </button>
      </div>
    </div>
  );
}
