import { useState, useMemo } from 'preact/hooks';
import { calculateStateJobCost, type JobCostData, type StateCostData } from '../lib/formulas/state-cost';

export interface StateCostEstimatorProps {
  job: JobCostData;
  state: StateCostData;
  relatedCalculatorSlug?: string;
}

export default function StateCostEstimator({
  job,
  state,
  relatedCalculatorSlug,
}: StateCostEstimatorProps) {
  const [size, setSize] = useState<number>(job.typicalProjectSize);
  const [tier, setTier] = useState<'budget' | 'typical' | 'highEnd'>('typical');

  const result = useMemo(() => {
    const baseEst = calculateStateJobCost(job, state, size);
    const tierFactor = tier === 'budget' ? 0.88 : tier === 'highEnd' ? 1.22 : 1.0;
    return {
      ...baseEst,
      low: Math.round(baseEst.low * tierFactor),
      typical: Math.round(baseEst.typical * tierFactor),
      high: Math.round(baseEst.high * tierFactor),
      laborCost: Math.round(baseEst.laborCost * tierFactor),
      materialCost: Math.round(baseEst.materialCost * tierFactor),
    };
  }, [job, state, size, tier]);

  return (
    <div class="my-6 card p-5 sm:p-6 border-2 border-brand-600/80 dark:border-brand-500/80">
      <div class="flex flex-wrap items-center justify-between gap-2 pb-4 mb-5 border-b border-slate-200 dark:border-slate-800">
        <div>
          <span class="text-xs font-bold uppercase tracking-wider text-brand-700 dark:text-brand-300">
            Interactive {state.name} Estimator
          </span>
          <h2 class="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
            Customize Your {job.name} Size
          </h2>
        </div>
        <span class="text-xs px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium">
          State Multiplier: {(result.compositeMultiplier * 100).toFixed(1)}% of US Avg
        </span>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
        <div class="md:col-span-6 space-y-4">
          <div>
            <label
              htmlFor="estimator-size-input"
              class="block text-sm font-semibold text-slate-800 dark:text-slate-200 mb-1.5"
            >
              Project Size ({job.unitPlural || job.unit})
            </label>
            <input
              id="estimator-size-input"
              type="number"
              inputMode="decimal"
              min={1}
              max={100000}
              value={size}
              onInput={(e) => setSize(Math.max(1, parseFloat((e.target as HTMLInputElement).value) || 1))}
              class="input-field"
            />
          </div>

          <div>
            <span class="block text-sm font-semibold text-slate-800 dark:text-slate-200 mb-1.5">
              Material & Finish Grade
            </span>
            <div class="grid grid-cols-3 gap-2" role="group" aria-label="Material finish grade">
              {[
                { id: 'budget', label: 'Economy' },
                { id: 'typical', label: 'Mid-Grade' },
                { id: 'highEnd', label: 'Premium' },
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setTier(opt.id as 'budget' | 'typical' | 'highEnd')}
                  aria-pressed={tier === opt.id}
                  class={`py-2 px-3 rounded-lg text-xs font-semibold border transition-colors min-h-[42px] ${
                    tier === opt.id
                      ? 'bg-brand-600 text-white border-brand-600'
                      : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {relatedCalculatorSlug && (
            <div class="pt-2">
              <a
                href={`/calculators/${relatedCalculatorSlug}/`}
                class="inline-flex items-center text-xs sm:text-sm font-semibold text-brand-600 dark:text-brand-400 hover:underline"
              >
                Need exact DIY material quantities? Open the {job.name} Calculator →
              </a>
            </div>
          )}
        </div>

        <div
          aria-live="polite"
          class="md:col-span-6 p-5 rounded-xl bg-slate-900 text-white dark:bg-slate-800 space-y-3"
        >
          <div class="text-xs uppercase tracking-wider text-slate-300">
            Estimated Cost in {state.name} ({size.toLocaleString()} {job.unit})
          </div>
          <div class="text-3xl font-extrabold text-accent-500">
            ${result.typical.toLocaleString()}
          </div>
          <div class="text-xs text-slate-300">
            Typical Range:{' '}
            <strong class="text-white">
              ${result.low.toLocaleString()} – ${result.high.toLocaleString()}
            </strong>
          </div>

          <div class="pt-3 border-t border-slate-700 grid grid-cols-2 gap-3 text-xs">
            <div>
              <span class="text-slate-400 block">Est. Labor ({Math.round(job.laborShare * 100)}%)</span>
              <span class="text-sm font-bold text-white">${result.laborCost.toLocaleString()}</span>
            </div>
            <div>
              <span class="text-slate-400 block">Est. Materials ({Math.round((1 - job.laborShare) * 100)}%)</span>
              <span class="text-sm font-bold text-white">
                ${result.materialCost.toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
