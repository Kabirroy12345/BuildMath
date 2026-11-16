import { useState, useMemo } from 'preact/hooks';
import { calculateStateJobCost, type JobCostData, type StateCostData } from '../lib/formulas/state-cost';
import LucideIcon from './LucideIcon';

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

  const laborPct = Math.round(job.laborShare * 100);
  const matPct = 100 - laborPct;

  return (
    <div class="my-6 bm-panel overflow-hidden">
      <div class="px-5 py-4 border-b border-hairline bg-surface-subtle/50 flex flex-wrap items-center justify-between gap-3">
        <div>
          <span class="font-mono text-[11px] font-semibold uppercase tracking-wider text-blueprint">
            Interactive {state.name} Cost Model
          </span>
          <h2 class="text-base sm:text-lg font-bold text-ink mt-0.5">
            Customize {job.name} Scope &amp; Spec Level
          </h2>
        </div>
        <span class="bm-eyebrow tabular-nums">
          Regional Index: {(result.compositeMultiplier * 100).toFixed(1)}% of US Avg
        </span>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-12">
        <div class="md:col-span-6 p-5 sm:p-6 space-y-5 border-b md:border-b-0 md:border-r border-hairline">
          <div>
            <label
              htmlFor="estimator-size-input"
              class="block text-sm font-semibold text-ink mb-1.5"
            >
              Project Size
            </label>
            <div class="relative">
              <input
                id="estimator-size-input"
                type="number"
                inputMode="decimal"
                min={1}
                max={100000}
                value={size}
                onInput={(e) => setSize(Math.max(1, parseFloat((e.target as HTMLInputElement).value) || 1))}
                class="bm-input pr-20 tabular-nums"
              />
              <span class="pointer-events-none absolute inset-y-0 right-3 flex items-center font-mono text-xs text-ink-muted">
                {job.unitPlural || job.unit}
              </span>
            </div>
          </div>

          <div>
            <span class="block text-sm font-semibold text-ink mb-2">
              Material &amp; Finish Specification
            </span>
            <div class="grid grid-cols-3 gap-2 p-1 rounded-lg bg-surface-subtle border border-hairline" role="group" aria-label="Material finish grade">
              {[
                { id: 'budget', label: 'Economy' },
                { id: 'typical', label: 'Mid-Grade' },
                { id: 'highEnd', label: 'Premium' },
              ].map((opt) => {
                const active = tier === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setTier(opt.id as 'budget' | 'typical' | 'highEnd')}
                    aria-pressed={active}
                    class={`py-2 px-2.5 rounded-md text-xs font-semibold transition-all min-h-[38px] ${
                      active
                        ? 'bg-graphite-900 text-[#F8F8F5] dark:bg-lime-500 dark:text-graphite-900 shadow-sm'
                        : 'text-ink-muted hover:text-ink'
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          {relatedCalculatorSlug && (
            <div class="pt-1">
              <a
                href={`/calculators/${relatedCalculatorSlug}/`}
                class="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-blueprint hover:underline"
              >
                <LucideIcon name="calculator" size={15} />
                <span>Calculate exact DIY material quantities instead</span>
                <LucideIcon name="arrow-right" size={14} />
              </a>
            </div>
          )}
        </div>

        <div
          aria-live="polite"
          class="md:col-span-6 p-5 sm:p-6 bg-graphite-900 text-[#F8F8F5] flex flex-col justify-between space-y-5"
        >
          <div>
            <div class="flex items-center gap-2 font-mono text-[11px] uppercase tracking-wider text-[#9BA1AA]">
              <span class="h-1.5 w-1.5 rounded-full bg-lime-500"></span>
              <span>
                {state.name} Estimate ({size.toLocaleString()} {job.unit})
              </span>
            </div>
            <div class="mt-2 text-3xl sm:text-4xl font-extrabold text-lime-500 tabular-nums tracking-tight">
              ${result.typical.toLocaleString()}
            </div>
            <div class="mt-1 font-mono text-xs text-[#9BA1AA] tabular-nums">
              Range:{' '}
              <span class="text-[#F8F8F5] font-semibold">
                ${result.low.toLocaleString()} – ${result.high.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Visual Labor vs Materials Split Bar */}
          <div class="space-y-2.5 pt-4 border-t border-graphite-700">
            <div class="h-2 w-full rounded-full bg-graphite-800 overflow-hidden flex">
              <div
                style={{ width: `${laborPct}%` }}
                class="h-full bg-[#6FA3D2]"
                title={`Labor: ${laborPct}%`}
              />
              <div
                style={{ width: `${matPct}%` }}
                class="h-full bg-[#C6F36A]"
                title={`Materials: ${matPct}%`}
              />
            </div>

            <div class="grid grid-cols-2 gap-3 text-xs">
              <div class="p-2.5 rounded-lg bg-graphite-950/70 border border-graphite-700">
                <span class="flex items-center gap-1.5 text-[#9BA1AA]">
                  <span class="h-2 w-2 rounded-sm bg-[#6FA3D2]"></span>
                  Labor ({laborPct}%)
                </span>
                <span class="mt-1 block text-sm font-bold text-[#F8F8F5] tabular-nums">
                  ${result.laborCost.toLocaleString()}
                </span>
              </div>
              <div class="p-2.5 rounded-lg bg-graphite-950/70 border border-graphite-700">
                <span class="flex items-center gap-1.5 text-[#9BA1AA]">
                  <span class="h-2 w-2 rounded-sm bg-[#C6F36A]"></span>
                  Materials ({matPct}%)
                </span>
                <span class="mt-1 block text-sm font-bold text-[#F8F8F5] tabular-nums">
                  ${result.materialCost.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
