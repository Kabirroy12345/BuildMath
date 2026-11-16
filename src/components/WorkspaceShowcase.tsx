import { useState, useEffect, useMemo } from 'preact/hooks';
import LucideIcon from './LucideIcon';
import { fmtUsd, type SavedProjectEntry } from './ProjectListManager';

const SAMPLE_PREVIEW = [
  {
    trade: 'Painting & Wallpapering',
    calc: 'Interior Paint Calculator',
    output: '2 gal (12×12 room, 2 coats)',
    cost: 84,
    href: '/calculators/paint-calculator/',
  },
  {
    trade: 'Drywall, Framing & Stairs',
    calc: 'Drywall Calculator',
    output: '14 × 4×8 sheets + 2 mud buckets',
    cost: 224,
    href: '/calculators/drywall-calculator/',
  },
  {
    trade: 'Flooring, Tile & Trim',
    calc: 'Baseboard Trim Calculator',
    output: '6 × 12-ft sticks + 10% waste',
    cost: 133,
    href: '/calculators/baseboard-trim-calculator/',
  },
];

export default function WorkspaceShowcase() {
  const [entries, setEntries] = useState<SavedProjectEntry[]>([]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const raw = localStorage.getItem('buildmath_project_list');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) setEntries(parsed);
      }
    } catch {}
  }, []);

  const hasSaved = entries.length > 0;
  const liveTotal = entries.reduce((sum, e) => sum + (e.costTypical || 0), 0);
  const liveRangeLow = entries.reduce((sum, e) => sum + (e.costLow || 0), 0);
  const liveRangeHigh = entries.reduce((sum, e) => sum + (e.costHigh || 0), 0);

  const liveMaterials = useMemo(() => {
    const map = new Map<string, { name: string; unit: string; qty: number; cost: number }>();
    for (const entry of entries) {
      for (const m of entry.materials || []) {
        const key = `${m.name}::${m.unit}`;
        const cur = map.get(key);
        if (cur) {
          cur.qty += m.quantity;
          cur.cost += m.totalTypical;
        } else {
          map.set(key, { name: m.name, unit: m.unit, qty: m.quantity, cost: m.totalTypical });
        }
      }
    }
    return Array.from(map.values());
  }, [entries]);

  return (
    <section class="mb-16 bm-panel overflow-hidden" aria-labelledby="workspace-showcase-heading">
      <div class="grid grid-cols-1 lg:grid-cols-12">
        {/* Left Explanatory Column */}
        <div class="lg:col-span-5 p-6 sm:p-8 flex flex-col justify-between bg-surface border-b lg:border-b-0 lg:border-r border-hairline">
          <div>
            <div class="inline-flex items-center gap-2 bm-eyebrow-blue mb-3">
              <LucideIcon name="clipboard-list" size={13} />
              <span>Project Workspace // Client-Side BOM</span>
            </div>

            <h2 id="workspace-showcase-heading" class="text-2xl sm:text-3xl font-extrabold text-ink tracking-tight">
              Combine Multiple Calculations Into One Store Shopping List
            </h2>
            <p class="mt-3 text-sm text-ink-body leading-relaxed">
              Remodeling involves multiple trades. Save takeoffs from any calculator into your private browser workspace to group quantities by trade, merge duplicate materials, compare cost scenarios, and export a clean PDF worksheet.
            </p>

            <ul class="mt-5 space-y-2.5 text-xs sm:text-sm text-ink-body">
              <li class="flex items-start gap-2.5">
                <LucideIcon name="check" size={15} class="text-blueprint mt-0.5 shrink-0" />
                <span><strong class="text-ink">Grouped by Trade:</strong> Separate painting, drywall, flooring, and concrete subtotals cleanly.</span>
              </li>
              <li class="flex items-start gap-2.5">
                <LucideIcon name="check" size={15} class="text-blueprint mt-0.5 shrink-0" />
                <span><strong class="text-ink">Combined Materials:</strong> Automatically sum identical SKUs across rooms before heading to the store.</span>
              </li>
              <li class="flex items-start gap-2.5">
                <LucideIcon name="check" size={15} class="text-blueprint mt-0.5 shrink-0" />
                <span><strong class="text-ink">Zero Sign-Up Storage:</strong> Persisted locally in your browser with 1-click PDF/Print export and clipboard copy.</span>
              </li>
            </ul>
          </div>

          <div class="mt-6 pt-5 border-t border-hairline flex flex-wrap items-center gap-2.5">
            <a href="/my-project/" class="bm-btn-lime text-xs sm:text-sm font-bold">
              <span>{hasSaved ? `Open Workspace (${entries.length})` : 'Open Project Workspace'}</span>
              <LucideIcon name="arrow-right" size={15} />
            </a>
            <a href="/calculators/concrete-slab-calculator/" class="bm-btn-secondary text-xs sm:text-sm">
              Try a Calculation
            </a>
          </div>
        </div>

        {/* Right Live / Sample Workspace Panel */}
        <div class="lg:col-span-7 bg-graphite-900 text-[#F8F8F5] p-6 sm:p-8 flex flex-col justify-between">
          <div>
            <div class="flex flex-wrap items-center justify-between gap-2 pb-4 mb-5 border-b border-graphite-700">
              <div class="flex items-center gap-2 font-mono text-[11px] uppercase tracking-wider text-[#D2D6DC]">
                <span class="h-2 w-2 rounded-full bg-lime-500"></span>
                <span>
                  {hasSaved ? 'LIVE BROWSER WORKSPACE' : 'SAMPLE PREVIEW // YOUR WORKSPACE IS EMPTY'}
                </span>
              </div>
              {hasSaved ? (
                <a href="/my-project/" class="font-mono text-xs text-lime-500 hover:underline">
                  Manage &amp; Export PDF →
                </a>
              ) : (
                <span class="font-mono text-[10px] px-2 py-0.5 rounded bg-graphite-800 border border-graphite-700 text-[#9BA1AA]">
                  Example Guest Room Takeoff
                </span>
              )}
            </div>

            {hasSaved ? (
              <div class="space-y-4">
                <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div class="p-3.5 rounded-lg bg-graphite-950 border border-graphite-700">
                    <span class="font-mono text-[10px] uppercase text-[#9BA1AA] block">Total Budget</span>
                    <strong class="text-xl sm:text-2xl font-extrabold text-lime-500 tabular-nums mt-0.5 block">
                      {fmtUsd(liveTotal)}
                    </strong>
                    <span class="font-mono text-[10px] text-[#9BA1AA] tabular-nums">
                      {fmtUsd(liveRangeLow)}–{fmtUsd(liveRangeHigh)}
                    </span>
                  </div>
                  <div class="p-3.5 rounded-lg bg-graphite-950 border border-graphite-700">
                    <span class="font-mono text-[10px] uppercase text-[#9BA1AA] block">Saved Takeoffs</span>
                    <strong class="text-xl sm:text-2xl font-extrabold text-[#F8F8F5] tabular-nums mt-0.5 block">
                      {entries.length}
                    </strong>
                    <span class="font-mono text-[10px] text-[#6FA3D2]">Active calculations</span>
                  </div>
                  <div class="col-span-2 sm:col-span-1 p-3.5 rounded-lg bg-graphite-950 border border-graphite-700">
                    <span class="font-mono text-[10px] uppercase text-[#9BA1AA] block">Unique SKUs</span>
                    <strong class="text-xl sm:text-2xl font-extrabold text-[#F8F8F5] tabular-nums mt-0.5 block">
                      {liveMaterials.length}
                    </strong>
                    <span class="font-mono text-[10px] text-[#9BA1AA]">Merged line items</span>
                  </div>
                </div>

                <div class="rounded-lg bg-graphite-950 border border-graphite-700 divide-y divide-graphite-700">
                  {liveMaterials.slice(0, 4).map((m) => (
                    <div key={`${m.name}-${m.unit}`} class="px-3.5 py-2.5 flex items-center justify-between gap-2 text-xs">
                      <span class="text-[#F8F8F5] truncate">
                        <strong class="font-mono text-lime-500 tabular-nums">
                          {m.qty.toLocaleString()} {m.unit}
                        </strong>{' '}
                        — {m.name}
                      </span>
                      <span class="font-mono text-[#D2D6DC] tabular-nums shrink-0">
                        {fmtUsd(m.cost)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div class="space-y-4">
                <div class="grid grid-cols-3 gap-3">
                  <div class="p-3 rounded-lg bg-graphite-950 border border-graphite-700">
                    <span class="font-mono text-[10px] uppercase text-[#9BA1AA] block">Example Total</span>
                    <strong class="text-lg sm:text-2xl font-extrabold text-lime-500 tabular-nums mt-0.5 block">
                      $441
                    </strong>
                  </div>
                  <div class="p-3 rounded-lg bg-graphite-950 border border-graphite-700">
                    <span class="font-mono text-[10px] uppercase text-[#9BA1AA] block">Trades Grouped</span>
                    <strong class="text-lg sm:text-2xl font-extrabold text-[#F8F8F5] tabular-nums mt-0.5 block">
                      3
                    </strong>
                  </div>
                  <div class="p-3 rounded-lg bg-graphite-950 border border-graphite-700">
                    <span class="font-mono text-[10px] uppercase text-[#9BA1AA] block">Export Ready</span>
                    <strong class="text-sm sm:text-base font-mono font-bold text-[#6FA3D2] mt-1 block">
                      PDF · Copy
                    </strong>
                  </div>
                </div>

                <div class="rounded-lg bg-graphite-950 border border-graphite-700 divide-y divide-graphite-700">
                  {SAMPLE_PREVIEW.map((row) => (
                    <a
                      key={row.calc}
                      href={row.href}
                      class="px-3.5 py-2.5 flex items-center justify-between gap-3 hover:bg-graphite-800/70 transition-colors text-xs"
                    >
                      <div class="min-w-0">
                        <span class="font-mono text-[10px] text-[#6FA3D2] uppercase block">{row.trade}</span>
                        <span class="font-semibold text-[#F8F8F5]">{row.calc}</span>
                        <span class="text-[#9BA1AA] block sm:inline sm:ml-2">{row.output}</span>
                      </div>
                      <span class="font-mono font-semibold text-lime-500 tabular-nums shrink-0">
                        ${row.cost}
                      </span>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div class="mt-5 pt-4 border-t border-graphite-700 flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono text-[#9BA1AA]">
            <span>Stored privately in browser localStorage</span>
            <a href="/my-project/" class="text-[#F8F8F5] hover:text-lime-500 transition-colors">
              Launch Full Project Workspace →
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
