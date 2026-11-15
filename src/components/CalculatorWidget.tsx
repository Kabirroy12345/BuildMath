import { useState, useEffect, useMemo, useRef } from 'preact/hooks';
import { runCalculatorFormula } from '../lib/formulas';
import { feetInchesToDecimalFeet, metersToFeet, sqMetersToSqFeet } from '../lib/formulas/units';
import type { CalculationResult } from '../lib/formulas/types';

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

export interface CalculatorWidgetProps {
  slug: string;
  title: string;
  fields: CalculatorField[];
  diagramType?: 'room-walls' | 'roof-pitch' | 'stair-stringer' | 'fence-layout' | null;
  productsMap: Record<string, ProductItem>;
  affiliateDisclosure: string;
  affiliateEnabled: boolean;
}

export default function CalculatorWidget({
  slug,
  title,
  fields,
  diagramType,
  productsMap,
  affiliateDisclosure,
  affiliateEnabled,
}: CalculatorWidgetProps) {
  const initialValues = useMemo(() => {
    const map: Record<string, number | string | boolean> = {};
    for (const f of fields) {
      map[f.name] = f.defaultValue;
    }
    return map;
  }, [fields]);

  const [values, setValues] = useState<Record<string, number | string | boolean>>(initialValues);
  const [unitSystem, setUnitSystem] = useState<'imperial' | 'metric'>('imperial');
  const [inchesSplit, setInchesSplit] = useState<Record<string, { feet: number; inches: number }>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showDefaults, setShowDefaults] = useState<boolean>(false);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [savedProject, setSavedProject] = useState<boolean>(false);
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
    }

    const splits: Record<string, { feet: number; inches: number }> = {};
    for (const f of fields) {
      if (f.acceptsFeetInches) {
        const val = Number(updated[f.name]) || 0;
        const ft = Math.floor(val);
        const inch = Math.round((val - ft) * 12);
        splits[f.name] = { feet: ft, inches: inch === 12 ? 0 : inch };
      }
    }
    setInchesSplit(splits);
  }, [fields, initialValues]);

  const validateAndSet = (field: CalculatorField, rawVal: number | string | boolean) => {
    const nextErrors = { ...errors };

    if (field.type === 'number' || field.type === 'slider') {
      const num = Number(rawVal);
      if (isNaN(num)) {
        nextErrors[field.name] = 'Please enter a valid number.';
      } else if (field.min !== undefined && num < field.min) {
        nextErrors[field.name] = `Minimum allowed value is ${field.min}.`;
      } else if (field.max !== undefined && num > field.max) {
        nextErrors[field.name] = `Maximum allowed value is ${field.max}.`;
      } else {
        delete nextErrors[field.name];
      }
    } else {
      delete nextErrors[field.name];
    }

    setErrors(nextErrors);
    setValues((prev) => ({ ...prev, [field.name]: rawVal }));
    setSavedProject(false);
  };

  const handleFeetInchesChange = (field: CalculatorField, part: 'feet' | 'inches', numVal: number) => {
    const current = inchesSplit[field.name] || { feet: Math.floor(Number(values[field.name]) || 0), inches: 0 };
    const updated = {
      ...current,
      [part]: Math.max(0, numVal || 0),
    };
    setInchesSplit((prev) => ({ ...prev, [field.name]: updated }));
    const decimalFt = Number(feetInchesToDecimalFeet(updated.feet, updated.inches).toFixed(4));
    validateAndSet(field, decimalFt);
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

  const primaryFields = fields.filter((f) => !f.isEditableDefault || f.name === 'wastePercent');
  const advancedFields = fields.filter((f) => f.isEditableDefault && f.name !== 'wastePercent');

  const handleShareUrl = () => {
    if (typeof window === 'undefined') return;
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
    const queryStr = params.toString();
    const shareUrl = `${window.location.origin}${window.location.pathname}${queryStr ? `?${queryStr}` : ''}`;
    window.history.replaceState({}, '', shareUrl);
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
      const entry = {
        id: `${slug}-${Date.now()}`,
        slug,
        title,
        timestamp: new Date().toISOString(),
        primaryLabel: output.primaryResult.label,
        primaryValue: output.primaryResult.value,
        primaryUnit: output.primaryResult.unit,
        costLow: output.costEstimate.low,
        costTypical: output.costEstimate.typical,
        costHigh: output.costEstimate.high,
        materials: output.materials,
        shareUrl: window.location.pathname,
      };
      existing.push(entry);
      localStorage.setItem(key, JSON.stringify(existing));
      window.dispatchEvent(new CustomEvent('buildmath:project-updated'));
      setSavedProject(true);
    } catch (e) {
      console.error('Could not save to localStorage', e);
    }
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

  return (
    <div class="my-6">
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left column: Inputs */}
        <div class="lg:col-span-7 card p-5 sm:p-6">
          <div class="flex flex-wrap items-center justify-between gap-3 pb-4 mb-5 border-b border-slate-200 dark:border-slate-800">
            <h2 class="text-lg font-bold text-slate-900 dark:text-white">
              Enter Measurements
            </h2>
            <div
              role="group"
              aria-label="Measurement unit system"
              class="inline-flex rounded-lg bg-slate-100 dark:bg-slate-800 p-1 text-xs font-semibold"
            >
              <button
                type="button"
                onClick={() => setUnitSystem('imperial')}
                aria-pressed={unitSystem === 'imperial'}
                class={`px-3 py-1.5 rounded-md transition-colors min-h-[34px] ${
                  unitSystem === 'imperial'
                    ? 'bg-white dark:bg-slate-900 text-brand-700 dark:text-brand-300 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                Imperial (ft / in)
              </button>
              <button
                type="button"
                onClick={() => setUnitSystem('metric')}
                aria-pressed={unitSystem === 'metric'}
                class={`px-3 py-1.5 rounded-md transition-colors min-h-[34px] ${
                  unitSystem === 'metric'
                    ? 'bg-white dark:bg-slate-900 text-brand-700 dark:text-brand-300 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                Metric (m / cm)
              </button>
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {primaryFields.map((field) => {
              const err = errors[field.name];
              const isSlider = field.type === 'slider' || field.name === 'wastePercent';
              return (
                <div
                  key={field.name}
                  class={field.type === 'boolean' || isSlider ? 'sm:col-span-2' : ''}
                >
                  <div class="flex items-center justify-between gap-2 mb-1.5">
                    <label
                      htmlFor={`field-${field.name}`}
                      class="block text-sm font-semibold text-slate-800 dark:text-slate-200"
                    >
                      {field.label}
                      {field.unit && (
                        <span class="ml-1 text-xs font-normal text-slate-500 dark:text-slate-400">
                          ({displayUnit(field.unit)})
                        </span>
                      )}
                    </label>
                    {field.tooltip && (
                      <span
                        class="text-xs text-slate-500 dark:text-slate-400 cursor-help border-b border-dotted border-slate-400"
                        title={field.tooltip}
                      >
                        Info
                      </span>
                    )}
                  </div>

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
                          onInput={(e) =>
                            handleFeetInchesChange(field, 'feet', parseFloat((e.target as HTMLInputElement).value))
                          }
                          aria-invalid={!!err}
                          aria-describedby={err ? `err-${field.name}` : undefined}
                          class="input-field pr-9"
                        />
                        <span class="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs text-slate-400">
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
                          onInput={(e) =>
                            handleFeetInchesChange(field, 'inches', parseFloat((e.target as HTMLInputElement).value))
                          }
                          class="input-field pr-9"
                        />
                        <span class="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs text-slate-400">
                          in
                        </span>
                      </div>
                    </div>
                  ) : isSlider ? (
                    <div class="flex items-center gap-4">
                      <input
                        id={`field-${field.name}`}
                        type="range"
                        min={field.min ?? 0}
                        max={field.max ?? 30}
                        step={field.step ?? 1}
                        value={Number(values[field.name]) || 0}
                        onInput={(e) =>
                          validateAndSet(field, parseFloat((e.target as HTMLInputElement).value))
                        }
                        class="w-full accent-brand-600 h-2 bg-slate-200 dark:bg-slate-700 rounded-lg cursor-pointer"
                      />
                      <span class="min-w-[3.5rem] text-center font-bold text-sm px-2.5 py-1.5 rounded-md bg-brand-50 dark:bg-brand-950 text-brand-700 dark:text-brand-300 border border-brand-200 dark:border-brand-800">
                        {values[field.name]}%
                      </span>
                    </div>
                  ) : field.type === 'number' ? (
                    <input
                      id={`field-${field.name}`}
                      type="number"
                      inputMode="decimal"
                      min={field.min}
                      max={field.max}
                      step={field.step ?? 'any'}
                      value={values[field.name] as number}
                      onInput={(e) =>
                        validateAndSet(field, parseFloat((e.target as HTMLInputElement).value) || 0)
                      }
                      aria-invalid={!!err}
                      aria-describedby={err ? `err-${field.name}` : undefined}
                      class="input-field"
                    />
                  ) : field.type === 'select' ? (
                    <select
                      id={`field-${field.name}`}
                      value={String(values[field.name])}
                      onChange={(e) => {
                        const raw = (e.target as HTMLSelectElement).value;
                        const parsed = isNaN(Number(raw)) ? raw : Number(raw);
                        validateAndSet(field, parsed);
                      }}
                      class="input-field"
                    >
                      {field.options?.map((opt) => (
                        <option key={String(opt.value)} value={String(opt.value)}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <label
                      htmlFor={`field-${field.name}`}
                      class="flex items-center gap-3 p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 cursor-pointer"
                    >
                      <input
                        id={`field-${field.name}`}
                        type="checkbox"
                        checked={Boolean(values[field.name])}
                        onChange={(e) =>
                          validateAndSet(field, (e.target as HTMLInputElement).checked)
                        }
                        class="h-5 w-5 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                      />
                      <span class="text-sm text-slate-700 dark:text-slate-300">
                        {field.tooltip || field.label}
                      </span>
                    </label>
                  )}

                  {field.tooltip && field.type !== 'boolean' && (
                    <p class="mt-1 text-xs text-slate-500 dark:text-slate-400">
                      {field.tooltip}
                    </p>
                  )}

                  {err && (
                    <p id={`err-${field.name}`} role="alert" class="mt-1 text-xs font-medium text-red-600 dark:text-red-400">
                      {err}
                    </p>
                  )}
                </div>
              );
            })}
          </div>

          {advancedFields.length > 0 && (
            <div class="mt-6 pt-4 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setShowDefaults(!showDefaults)}
                aria-expanded={showDefaults}
                class="flex w-full items-center justify-between text-left text-sm font-semibold text-brand-700 dark:text-brand-300 hover:underline py-1"
              >
                <span>
                  Customize Coverage Rates & Unit Prices ({advancedFields.length} editable defaults)
                </span>
                <span aria-hidden="true">{showDefaults ? '▲' : '▼'}</span>
              </button>

              {showDefaults && (
                <div class="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                  {advancedFields.map((field) => (
                    <div key={field.name}>
                      <label
                        htmlFor={`field-${field.name}`}
                        class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
                      >
                        {field.label}{' '}
                        {field.unit && <span class="text-slate-500">({field.unit})</span>}
                      </label>
                      <input
                        id={`field-${field.name}`}
                        type="number"
                        inputMode="decimal"
                        min={field.min}
                        max={field.max}
                        step={field.step ?? 'any'}
                        value={values[field.name] as number}
                        onInput={(e) =>
                          validateAndSet(field, parseFloat((e.target as HTMLInputElement).value) || 0)
                        }
                        class="input-field text-sm min-h-[40px]"
                      />
                      {field.tooltip && (
                        <p class="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                          {field.tooltip}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right column: Live Results Panel */}
        <div
          ref={resultsRef}
          aria-live="polite"
          aria-atomic="true"
          class="lg:col-span-5 card p-5 sm:p-6 border-2 border-brand-600/80 dark:border-brand-500/80 bg-gradient-to-b from-brand-50/40 to-white dark:from-slate-900 dark:to-slate-900"
        >
          <div class="flex items-center justify-between gap-2 mb-3">
            <span class="text-xs font-bold uppercase tracking-wider text-brand-700 dark:text-brand-300 bg-brand-100 dark:bg-brand-950 px-2.5 py-1 rounded-md">
              Estimated Quantity
            </span>
            <button
              type="button"
              onClick={() => window.print()}
              class="no-print text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-brand-600 underline"
            >
              Print Estimate
            </button>
          </div>

          <div class="my-3 p-4 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 shadow-sm">
            <div class="text-sm font-medium text-slate-600 dark:text-slate-400">
              {output.primaryResult.label}
            </div>
            <div class="mt-1 flex items-baseline gap-2 flex-wrap">
              <span
                data-testid="primary-result-value"
                class="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight"
              >
                {output.primaryResult.value}
              </span>
              <span class="text-lg font-semibold text-brand-700 dark:text-brand-400">
                {output.primaryResult.unit}
              </span>
            </div>
            <div class="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Exact unrounded calculation:{' '}
              <strong class="text-slate-700 dark:text-slate-300">
                {output.primaryResult.exactValue} {output.primaryResult.unit}
              </strong>
              {output.primaryResult.subtitle && ` • ${output.primaryResult.subtitle}`}
            </div>

            {/* High-converting Primary Material Buy CTA right under the main result */}
            {affiliateEnabled && output.materials.length > 0 && (() => {
              const primaryMat = output.materials[0];
              const primaryProd = primaryMat?.productId ? productsMap[primaryMat.productId] : undefined;
              if (!primaryProd) return null;
              return (
                <div class="no-print mt-3.5 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <a
                    href={`/go/${primaryProd.id}/`}
                    target="_blank"
                    rel="sponsored nofollow noopener"
                    data-testid="primary-affiliate-cta"
                    class="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-xs sm:text-sm font-bold bg-accent-500 hover:bg-accent-600 text-slate-950 shadow-sm transition-colors"
                  >
                    <span>
                      Buy {primaryMat.quantity.toLocaleString()} {primaryMat.unit} ({primaryMat.name}) at {primaryProd.retailer} ↗
                    </span>
                  </a>
                </div>
              );
            })()}
          </div>

          {output.complianceCheck && (
            <div
              class={`my-3 p-3.5 rounded-lg border text-xs font-medium ${
                output.complianceCheck.passed
                  ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
                  : 'bg-amber-50 dark:bg-amber-950/50 border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200'
              }`}
            >
              {output.complianceCheck.message}
            </div>
          )}

          <div class="my-4 space-y-2">
            {output.secondaryResults.map((sec) => (
              <div
                key={sec.label}
                class="flex items-center justify-between text-sm py-1.5 border-b border-slate-200/70 dark:border-slate-800 last:border-0"
              >
                <span class="text-slate-600 dark:text-slate-400">{sec.label}</span>
                <span class="font-semibold text-slate-900 dark:text-slate-100">
                  {sec.value} {sec.unit || ''}
                </span>
              </div>
            ))}
          </div>

          {diagramType && (
            <div class="my-4 p-3 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
              <div class="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">
                Visual Geometry Preview
              </div>
              {diagramType === 'roof-pitch' && (
                <svg viewBox="0 0 260 110" class="w-full h-24" role="img" aria-label="Roof pitch right triangle diagram">
                  <polygon points="20,90 220,90 220,25" fill="rgba(2,132,199,0.12)" stroke="#0284c7" stroke-width="2.5" />
                  <text x="115" y="104" font-size="11" fill="currentColor" text-anchor="middle">
                    Run: 12 in
                  </text>
                  <text x="226" y="60" font-size="11" fill="currentColor">
                    Rise: {values.rise || 6}"
                  </text>
                  <text x="95" y="50" font-size="11" font-weight="bold" fill="#0284c7">
                    Slope ×{output.primaryResult.exactValue}
                  </text>
                </svg>
              )}
              {diagramType === 'stair-stringer' && (
                <svg viewBox="0 0 260 110" class="w-full h-24" role="img" aria-label="Stair stringer rise and run diagram">
                  <polyline
                    points="20,95 20,75 65,75 65,55 110,55 110,35 155,35 155,15 200,15 200,95 20,95"
                    fill="rgba(2,132,199,0.12)"
                    stroke="#0284c7"
                    stroke-width="2"
                  />
                  <text x="110" y="107" font-size="10" fill="currentColor" text-anchor="middle">
                    Total Run • {output.primaryResult.value} Risers
                  </text>
                </svg>
              )}
              {diagramType === 'room-walls' && (
                <svg viewBox="0 0 260 100" class="w-full h-20" role="img" aria-label="Room perimeter and walls diagram">
                  <rect x="40" y="15" width="180" height="65" rx="4" fill="rgba(2,132,199,0.1)" stroke="#0284c7" stroke-width="2" />
                  <text x="130" y="52" font-size="11" font-weight="bold" fill="#0284c7" text-anchor="middle">
                    {values.roomLength || 12}' × {values.roomWidth || 12}' ({values.wallHeight || 8}' H)
                  </text>
                </svg>
              )}
              {diagramType === 'fence-layout' && (
                <svg viewBox="0 0 260 90" class="w-full h-20" role="img" aria-label="Fence post and rail section diagram">
                  <rect x="25" y="15" width="8" height="65" fill="#0284c7" />
                  <rect x="125" y="15" width="8" height="65" fill="#0284c7" />
                  <rect x="225" y="15" width="8" height="65" fill="#0284c7" />
                  <line x1="33" y1="30" x2="225" y2="30" stroke="#0284c7" stroke-width="3" />
                  <line x1="33" y1="60" x2="225" y2="60" stroke="#0284c7" stroke-width="3" />
                  <text x="130" y="86" font-size="10" fill="currentColor" text-anchor="middle">
                    Post Spacing: {values.postSpacing || 8} ft OC
                  </text>
                </svg>
              )}
            </div>
          )}

          <div class="my-4 p-4 rounded-xl bg-slate-900 text-white dark:bg-slate-800">
            <div class="flex items-center justify-between text-xs text-slate-300 mb-1">
              <span>Estimated Material Cost (US Avg)</span>
              <span>Typical: ${output.costEstimate.typical.toLocaleString()}</span>
            </div>
            <div class="text-2xl font-extrabold text-accent-500">
              ${output.costEstimate.low.toLocaleString()} – ${output.costEstimate.high.toLocaleString()}
            </div>
            <p class="text-[11px] text-slate-300 mt-1">
              Based on editable unit prices. Adjust prices in "Customize Coverage Rates & Unit Prices" to match your local store.
            </p>
          </div>

          <div class="mt-5">
            <h3 class="text-sm font-bold text-slate-900 dark:text-white mb-2.5">
              Materials Shopping List
            </h3>
            <ul class="space-y-2.5">
              {output.materials.map((item) => {
                const product = item.productId ? productsMap[item.productId] : undefined;
                return (
                  <li
                    key={item.name}
                    class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-lg bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800"
                  >
                    <div>
                      <div class="text-sm font-semibold text-slate-900 dark:text-slate-100">
                        {item.quantity.toLocaleString()} {item.unit} — {item.name}
                      </div>
                      <div class="text-xs text-slate-500 dark:text-slate-400">
                        Est. ${item.totalTypical.toLocaleString()} (${item.unitPrice}/{item.unit})
                      </div>
                    </div>
                    {affiliateEnabled && product && (
                      <a
                        href={`/go/${product.id}/`}
                        target="_blank"
                        rel="sponsored nofollow noopener"
                        class="no-print inline-flex items-center justify-center px-3 py-1.5 rounded-md text-xs font-semibold bg-accent-500 hover:bg-accent-600 text-slate-950 transition-colors shrink-0"
                      >
                        Shop at {product.retailer} ↗
                      </a>
                    )}
                  </li>
                );
              })}
            </ul>
            {affiliateEnabled && (
              <p class="no-print mt-2.5 text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                {affiliateDisclosure}
              </p>
            )}
          </div>

          <div class="no-print mt-5 pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row gap-2.5">
            <button
              type="button"
              onClick={handleAddToProject}
              data-testid="add-to-project-btn"
              class="btn-primary flex-1 text-sm"
            >
              {savedProject ? '✓ Saved to My Project List' : '+ Add to My Project List'}
            </button>
            <button
              type="button"
              onClick={handleShareUrl}
              data-testid="share-url-btn"
              class="btn-secondary text-sm"
            >
              {copiedLink ? '✓ Link Copied!' : 'Share Calculation'}
            </button>
          </div>
          {savedProject && (
            <p class="no-print mt-2 text-xs text-center text-brand-700 dark:text-brand-300">
              Added! <a href="/my-project/" class="underline font-semibold">View your combined project shopping list →</a>
            </p>
          )}
        </div>
      </div>

      <div class="sticky-mobile-calc-bar lg:hidden fixed bottom-0 inset-x-0 z-40 bg-slate-900/95 text-white px-4 py-3 border-t border-slate-700 flex items-center justify-between gap-3 backdrop-blur">
        <div>
          <div class="text-[11px] text-slate-300">{output.primaryResult.label}</div>
          <div class="text-base font-extrabold text-accent-500">
            {output.primaryResult.value} {output.primaryResult.unit} (${output.costEstimate.typical.toLocaleString()})
          </div>
        </div>
        <button
          type="button"
          onClick={scrollToResults}
          class="px-4 py-2 rounded-lg bg-brand-600 text-white font-semibold text-xs shrink-0"
        >
          View Full List ↓
        </button>
      </div>
    </div>
  );
}
