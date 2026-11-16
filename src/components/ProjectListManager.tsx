import { useState, useEffect, useMemo } from 'preact/hooks';
import type { MaterialLineItem } from '../lib/formulas/types';
import LucideIcon from './LucideIcon';
import { getCategoryIconName } from '../lib/lucide-icons';

export function fmtUsd(n: number): string {
  const hasCents = Math.abs(n % 1) > 0.005;
  return `$${n.toLocaleString('en-US', {
    minimumFractionDigits: hasCents ? 2 : 0,
    maximumFractionDigits: 2,
  })}`;
}

export interface SavedProjectEntry {
  id: string;
  slug: string;
  title: string;
  category?: string;
  categoryName?: string;
  timestamp: string;
  primaryLabel: string;
  primaryValue: number | string;
  primaryUnit: string;
  costLow: number;
  costTypical: number;
  costHigh: number;
  materials: MaterialLineItem[];
  shareUrl: string;
}

export interface CompareScenarioEntry {
  id: string;
  slug: string;
  title: string;
  scenarioLabel: string;
  primaryLabel: string;
  primaryValue: number | string;
  primaryUnit: string;
  costLow: number;
  costTypical: number;
  costHigh: number;
  secondaryResults?: { label: string; value: number | string; unit: string }[];
  restoreUrl: string;
}

export interface HistoryEntry {
  id: string;
  slug: string;
  title: string;
  shortName: string;
  timestamp: string;
  primaryLabel: string;
  primaryValue: number | string;
  primaryUnit: string;
  costTypical: number;
  costLow: number;
  costHigh: number;
  inputsSummary: string;
  restoreUrl: string;
}

type WorkspaceTab = 'bom' | 'compare' | 'history';

function inferCategoryMeta(slug: string, cat?: string, catName?: string): { slug: string; name: string } {
  if (cat && catName) return { slug: cat, name: catName };
  if (/paint|stain|wallpaper/.test(slug)) return { slug: 'painting', name: 'Painting & Wallpapering' };
  if (/flooring|tile|grout|carpet|baseboard/.test(slug)) return { slug: 'flooring', name: 'Flooring, Tile & Trim' };
  if (/concrete|brick|paver|retaining|rebar/.test(slug)) return { slug: 'concrete-masonry', name: 'Concrete & Masonry' };
  if (/roof|gutter|siding/.test(slug)) return { slug: 'roofing', name: 'Roofing, Siding & Gutters' };
  if (/mulch|gravel|topsoil|sod|grass-seed/.test(slug)) return { slug: 'landscaping', name: 'Landscaping & Yard' };
  if (/fence|deck/.test(slug)) return { slug: 'fencing-decking', name: 'Fencing & Decking' };
  if (/drywall|stair/.test(slug)) return { slug: 'drywall-walls', name: 'Drywall, Framing & Stairs' };
  return { slug: 'general-conversions', name: 'General & Volume' };
}

export default function ProjectListManager() {
  const [tab, setTab] = useState<WorkspaceTab>('bom');
  const [entries, setEntries] = useState<SavedProjectEntry[]>([]);
  const [compareItems, setCompareItems] = useState<CompareScenarioEntry[]>([]);
  const [historyItems, setHistoryItems] = useState<HistoryEntry[]>([]);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const raw = localStorage.getItem('buildmath_project_list');
      if (raw) setEntries(JSON.parse(raw));
    } catch {}
    try {
      const rawCompare = localStorage.getItem('buildmath_compare_list');
      if (rawCompare) setCompareItems(JSON.parse(rawCompare));
    } catch {}
    try {
      const rawHistory = localStorage.getItem('buildmath_calc_history');
      if (rawHistory) setHistoryItems(JSON.parse(rawHistory));
    } catch {}
    if (window.location.hash === '#compare') setTab('compare');
    if (window.location.hash === '#history') setTab('history');
  }, []);

  const updateStorage = (next: SavedProjectEntry[]) => {
    setEntries(next);
    try {
      localStorage.setItem('buildmath_project_list', JSON.stringify(next));
      window.dispatchEvent(new CustomEvent('buildmath:project-updated'));
    } catch {}
  };

  const removeEntry = (id: string) => {
    updateStorage(entries.filter((e) => e.id !== id));
  };

  const clearAllBom = () => {
    updateStorage([]);
  };

  const removeCompare = (id: string) => {
    const next = compareItems.filter((c) => c.id !== id);
    setCompareItems(next);
    try {
      localStorage.setItem('buildmath_compare_list', JSON.stringify(next));
    } catch {}
  };

  const clearHistory = () => {
    setHistoryItems([]);
    try {
      localStorage.removeItem('buildmath_calc_history');
    } catch {}
  };

  const totalLow = entries.reduce((sum, e) => sum + (e.costLow || 0), 0);
  const totalTypical = entries.reduce((sum, e) => sum + (e.costTypical || 0), 0);
  const totalHigh = entries.reduce((sum, e) => sum + (e.costHigh || 0), 0);

  // Consolidated BOM across all calculations
  const consolidatedMaterials = useMemo(() => {
    const map = new Map<string, { name: string; unit: string; quantity: number; totalTypical: number }>();
    for (const entry of entries) {
      for (const m of entry.materials || []) {
        const key = `${m.name}::${m.unit}`;
        const existing = map.get(key);
        if (existing) {
          existing.quantity += m.quantity;
          existing.totalTypical += m.totalTypical;
        } else {
          map.set(key, {
            name: m.name,
            unit: m.unit,
            quantity: m.quantity,
            totalTypical: m.totalTypical,
          });
        }
      }
    }
    return Array.from(map.values());
  }, [entries]);

  // Group calculations by residential trade category
  const groupedByTrade = useMemo(() => {
    const groups = new Map<
      string,
      { tradeSlug: string; tradeName: string; items: SavedProjectEntry[]; subtotal: number }
    >();
    for (const entry of entries) {
      const meta = inferCategoryMeta(entry.slug, entry.category, entry.categoryName);
      const existing = groups.get(meta.slug);
      if (existing) {
        existing.items.push(entry);
        existing.subtotal += entry.costTypical || 0;
      } else {
        groups.set(meta.slug, {
          tradeSlug: meta.slug,
          tradeName: meta.name,
          items: [entry],
          subtotal: entry.costTypical || 0,
        });
      }
    }
    return Array.from(groups.values());
  }, [entries]);

  const handleCopyText = () => {
    const lines: string[] = [
      'BuildMath Project Workspace — Combined Bill of Materials',
      '========================================================',
      '',
    ];
    for (const group of groupedByTrade) {
      lines.push(`[${group.tradeName}] — Trade Subtotal: $${group.subtotal.toLocaleString()}`);
      for (const entry of group.items) {
        lines.push(`  • ${entry.title}: ${entry.primaryValue} ${entry.primaryUnit} (Est. $${entry.costTypical})`);
        for (const m of entry.materials) {
          lines.push(`    - ${m.quantity} ${m.unit} ${m.name} ($${m.totalTypical})`);
        }
      }
      lines.push('');
    }
    if (consolidatedMaterials.length > 0) {
      lines.push('Consolidated Hardware Store Quantities:');
      for (const cm of consolidatedMaterials) {
        lines.push(`  * ${cm.quantity.toLocaleString()} ${cm.unit} — ${cm.name} ($${cm.totalTypical.toLocaleString()})`);
      }
      lines.push('');
    }
    lines.push(
      `Grand Total Estimate: $${totalTypical.toLocaleString()} (Range: $${totalLow.toLocaleString()} - $${totalHigh.toLocaleString()})`
    );
    if (navigator.clipboard) {
      navigator.clipboard.writeText(lines.join('\n')).catch(() => {});
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div class="my-6 space-y-6">
      {/* Workspace Navigation Tabs & PDF Export */}
      <div class="no-print flex flex-wrap items-center justify-between gap-3 border-b border-hairline pb-3">
        <div role="tablist" aria-label="Workspace sections" class="flex flex-wrap gap-1.5">
          {[
            { id: 'bom', label: 'Shopping List & BOM', count: entries.length, icon: 'clipboard-list' as const },
            { id: 'compare', label: 'Compare Scenarios', count: compareItems.length, icon: 'git-compare' as const },
            { id: 'history', label: 'Calculation History', count: historyItems.length, icon: 'history' as const },
          ].map((t) => {
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setTab(t.id as WorkspaceTab)}
                class={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors min-h-[38px] ${
                  active
                    ? 'bg-graphite-900 text-[#F8F8F5] dark:bg-lime-500 dark:text-graphite-900 font-semibold'
                    : 'bg-surface border border-hairline text-ink-muted hover:text-ink'
                }`}
              >
                <LucideIcon
                  name={t.icon}
                  size={14}
                  class={active ? 'text-lime-500 dark:text-graphite-900' : 'text-blueprint'}
                />
                <span>{t.label}</span>
                <span class="font-mono text-[10px] px-1.5 py-0.5 rounded bg-black/15 dark:bg-black/20 tabular-nums">
                  {t.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* TAB 1: PROJECT SUMMARY, GROUPED CALCULATIONS & COMBINED BOM */}
      {tab === 'bom' && (
        <>
          {entries.length === 0 ? (
            <div class="bm-panel p-8 sm:p-10">
              <div class="max-w-2xl mx-auto text-center">
                <div class="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-surface-subtle border border-hairline text-blueprint">
                  <LucideIcon name="clipboard-list" size={22} />
                </div>
                <span class="bm-eyebrow mb-2">Browser Storage // Private Takeoff Sheet</span>
                <h2 class="text-xl sm:text-2xl font-bold text-ink mb-2">
                  Start Building Your Combined Project BOM
                </h2>
                <p class="text-sm text-ink-muted leading-relaxed mb-6">
                  Calculate quantities across rooms or trades and click <strong>+ Add to My Project List</strong>. Everything groups cleanly by trade here with consolidated hardware-store quantities and instant PDF export.
                </p>

                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left mb-7">
                  {[
                    { name: 'Concrete Slab Calculator', sub: 'Yards, 80/60/40-lb bags & ready-mix cost', href: '/calculators/concrete-slab-calculator/' },
                    { name: 'Interior Paint Calculator', sub: 'Wall/ceiling gallons, primer & quarts', href: '/calculators/paint-calculator/' },
                    { name: 'Drywall Sheet Calculator', sub: '4×8/4×12 panels, mud buckets, tape & screws', href: '/calculators/drywall-calculator/' },
                    { name: 'Mulch & Bed Calculator', sub: 'Cubic yards, bags & bulk delivery cost', href: '/calculators/mulch-calculator/' },
                  ].map((starter) => (
                    <a
                      key={starter.href}
                      href={starter.href}
                      class="p-3.5 rounded-lg bg-canvas border border-hairline hover:border-blueprint transition-colors flex items-center justify-between gap-3 group"
                    >
                      <div class="min-w-0">
                        <div class="text-xs sm:text-sm font-semibold text-ink group-hover:text-blueprint truncate">
                          {starter.name}
                        </div>
                        <div class="text-[11px] text-ink-muted truncate">{starter.sub}</div>
                      </div>
                      <LucideIcon name="arrow-right" size={14} class="text-blueprint shrink-0" />
                    </a>
                  ))}
                </div>

                <a href="/calculators/" class="bm-btn-lime text-sm font-bold">
                  <span>Browse All 32 Calculators</span>
                  <LucideIcon name="arrow-right" size={16} />
                </a>
              </div>
            </div>
          ) : (
            <div class="space-y-6">
              {/* Project Summary KPI Dashboard */}
              <div class="bm-instrument-rim overflow-hidden">
                <div class="px-6 py-4 border-b border-graphite-700 bg-graphite-950/60 flex flex-wrap items-center justify-between gap-3">
                  <div class="flex items-center gap-2 font-mono text-[11px] uppercase tracking-wider text-[#D2D6DC]">
                    <span class="h-2 w-2 rounded-full bg-lime-500"></span>
                    <span>Project Workspace Summary // Client-Side BOM</span>
                  </div>
                  <div class="no-print flex flex-wrap gap-2">
                    <button type="button" onClick={handleCopyText} class="bm-btn-lime bm-magnetic text-xs min-h-[36px] px-3 py-1.5 font-bold">
                      <LucideIcon name={copied ? 'check' : 'copy'} size={13} />
                      <span>{copied ? 'Copied BOM' : 'Copy Shopping List'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => window.print()}
                      class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium bg-graphite-800 hover:bg-graphite-700 text-[#F8F8F5] border border-graphite-700 transition-colors min-h-[36px]"
                    >
                      <LucideIcon name="printer" size={13} />
                      <span>Export PDF / Print</span>
                    </button>
                    <button
                      type="button"
                      onClick={clearAllBom}
                      class="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-medium text-red-300 hover:bg-red-950/60 transition-colors min-h-[36px]"
                    >
                      <LucideIcon name="trash-2" size={13} />
                      <span>Clear</span>
                    </button>
                  </div>
                </div>

                <div class="p-6 space-y-5">
                  <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div class="bm-corner-ticks p-4 rounded bg-graphite-950 border border-graphite-700">
                      <span class="font-mono text-[10px] uppercase tracking-wider text-[#9BA1AA] block">
                        Total Estimated Cost
                      </span>
                      <div
                        key={totalTypical}
                        class="animate-digit-roll mt-1 text-2xl sm:text-3xl font-extrabold text-lime-500 tabular-nums"
                      >
                        {fmtUsd(totalTypical)}
                      </div>
                      <span class="font-mono text-[11px] text-[#9BA1AA] tabular-nums block">
                        {fmtUsd(totalLow)} – {fmtUsd(totalHigh)} range
                      </span>
                    </div>
                    <div class="p-4 rounded bg-graphite-950 border border-graphite-700">
                      <span class="font-mono text-[10px] uppercase tracking-wider text-[#9BA1AA] block">
                        Saved Takeoffs
                      </span>
                      <div
                        key={entries.length}
                        class="animate-digit-roll mt-1 text-2xl sm:text-3xl font-extrabold text-[#F8F8F5] tabular-nums"
                      >
                        {entries.length}
                      </div>
                      <span class="font-mono text-[11px] text-[#6FA3D2] block">Individual calculations</span>
                    </div>
                    <div class="p-4 rounded bg-graphite-950 border border-graphite-700">
                      <span class="font-mono text-[10px] uppercase tracking-wider text-[#9BA1AA] block">
                        Active Trades
                      </span>
                      <div class="mt-1 text-2xl sm:text-3xl font-extrabold text-[#F8F8F5] tabular-nums">
                        {groupedByTrade.length}
                      </div>
                      <span class="font-mono text-[11px] text-[#9BA1AA] block">Trade groups</span>
                    </div>
                    <div class="p-4 rounded bg-graphite-950 border border-graphite-700">
                      <span class="font-mono text-[10px] uppercase tracking-wider text-[#9BA1AA] block">
                        Combined Material SKUs
                      </span>
                      <div class="mt-1 text-2xl sm:text-3xl font-extrabold text-[#F8F8F5] tabular-nums">
                        {consolidatedMaterials.length}
                      </div>
                      <span class="font-mono text-[11px] text-[#9BA1AA] block">Consolidated line items</span>
                    </div>
                  </div>

                  {/* Animated Trade Cost Allocation Strip */}
                  {groupedByTrade.length > 0 && totalTypical > 0 && (
                    <div class="p-4 rounded bg-graphite-950 border border-graphite-700 space-y-2.5">
                      <div class="flex items-center justify-between font-mono text-[10px] uppercase tracking-wider text-[#9BA1AA]">
                        <span>Budget Allocation by Trade</span>
                        <span class="text-[#6FA3D2] tabular-nums">{groupedByTrade.length} Active Trades</span>
                      </div>
                      <div class="h-2.5 w-full rounded-full bg-graphite-800 overflow-hidden flex gap-0.5">
                        {groupedByTrade.map((grp, gIdx) => {
                          const share = Math.max(4, Math.round((grp.subtotal / Math.max(1, totalTypical)) * 100));
                          const barPalette = gIdx % 3 === 0 ? 'bg-lime-500' : gIdx % 3 === 1 ? 'bg-[#6FA3D2]' : 'bg-[#F8F8F5]/75';
                          return (
                            <div
                              key={grp.tradeSlug}
                              style={{ width: `${share}%` }}
                              title={`${grp.tradeName}: ${fmtUsd(grp.subtotal)} (${share}%)`}
                              class={`h-full ${barPalette} transition-all duration-300 ease-out`}
                            />
                          );
                        })}
                      </div>
                      <div class="flex flex-wrap gap-3 text-[11px] font-mono text-[#D2D6DC] tabular-nums">
                        {groupedByTrade.map((grp, gIdx) => {
                          const share = Math.round((grp.subtotal / Math.max(1, totalTypical)) * 100);
                          const dotColor = gIdx % 3 === 0 ? 'bg-lime-500' : gIdx % 3 === 1 ? 'bg-[#6FA3D2]' : 'bg-[#F8F8F5]';
                          return (
                            <span key={grp.tradeSlug} class="inline-flex items-center gap-1.5">
                              <span class={`h-2 w-2 rounded-sm ${dotColor}`}></span>
                              <span>{grp.tradeName}:</span>
                              <strong class="text-[#F8F8F5]">{share}%</strong>
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Consolidated Hardware Store Bill of Materials */}
              {consolidatedMaterials.length > 0 && (
                <section class="bm-panel overflow-hidden" aria-label="Consolidated hardware store summary">
                  <div class="px-5 py-3.5 border-b border-hairline bg-surface-subtle/50 flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <h2 class="text-base font-bold text-ink">
                        Consolidated Hardware Store Shopping List
                      </h2>
                      <p class="text-xs text-ink-muted">
                        Duplicate material line items automatically merged into store purchase totals.
                      </p>
                    </div>
                    <span class="bm-eyebrow font-mono tabular-nums">
                      {consolidatedMaterials.length} SKUs
                    </span>
                  </div>
                  <div class="overflow-x-auto">
                    <table class="w-full text-left border-collapse text-xs sm:text-sm tabular-nums">
                      <thead>
                        <tr class="border-b border-hairline bg-surface-subtle/40 font-mono text-[10px] uppercase text-ink-muted">
                          <th class="py-2.5 px-4 font-semibold">Material Description</th>
                          <th class="py-2.5 px-4 font-semibold">Combined Quantity</th>
                          <th class="py-2.5 px-4 font-semibold text-right">Est. Cost</th>
                        </tr>
                      </thead>
                      <tbody class="divide-y divide-hairline">
                        {consolidatedMaterials.map((cm) => {
                          const skuPct = Math.min(100, Math.max(6, Math.round((cm.totalTypical / Math.max(1, totalTypical)) * 100)));
                          return (
                            <tr key={`${cm.name}-${cm.unit}`} class="hover:bg-surface-subtle/30 transition-colors">
                              <td class="py-2.5 px-4">
                                <div class="font-medium text-ink">{cm.name}</div>
                                <div class="mt-1 h-1 w-full max-w-[200px] rounded bg-surface-subtle overflow-hidden" aria-hidden="true">
                                  <div style={{ width: `${skuPct}%` }} class="h-full bg-blueprint transition-all duration-300 ease-out" />
                                </div>
                              </td>
                              <td class="py-2.5 px-4 font-mono font-bold text-blueprint align-top">
                                {cm.quantity.toLocaleString()} {cm.unit}
                              </td>
                              <td class="py-2.5 px-4 text-right font-mono font-semibold text-ink align-top">
                                {fmtUsd(cm.totalTypical)}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </section>
              )}

              {/* Grouped Calculations by Trade */}
              <div class="space-y-5">
                <div class="flex items-center justify-between">
                  <h2 class="text-lg font-bold text-ink">
                    Grouped Calculations by Trade ({groupedByTrade.length})
                  </h2>
                </div>

                {groupedByTrade.map((group) => (
                  <section key={group.tradeSlug} class="bm-panel overflow-hidden">
                    <div class="px-5 py-3.5 bg-surface-subtle/60 border-b border-hairline flex flex-wrap items-center justify-between gap-3">
                      <div class="flex items-center gap-2.5">
                        <span class="flex h-7 w-7 items-center justify-center rounded bg-surface border border-hairline text-blueprint">
                          <LucideIcon name={getCategoryIconName(group.tradeSlug)} size={14} />
                        </span>
                        <h3 class="text-sm sm:text-base font-bold text-ink">{group.tradeName}</h3>
                        <span class="font-mono text-[10px] px-2 py-0.5 rounded bg-surface border border-hairline text-ink-muted tabular-nums">
                          {group.items.length} {group.items.length === 1 ? 'takeoff' : 'takeoffs'}
                        </span>
                      </div>
                      <span class="font-mono text-xs font-bold text-ink tabular-nums">
                        Trade Subtotal: {fmtUsd(group.subtotal)}
                      </span>
                    </div>

                    <div class="divide-y divide-hairline">
                      {group.items.map((entry) => (
                        <div key={entry.id} class="p-4 sm:p-5 space-y-3">
                          <div class="flex flex-wrap items-start justify-between gap-3">
                            <div>
                              <a
                                href={entry.shareUrl || `/calculators/${entry.slug}/`}
                                class="text-base font-bold text-ink hover:text-blueprint transition-colors"
                              >
                                {entry.title}
                              </a>
                              <div class="mt-0.5 font-mono text-xs text-blueprint font-semibold tabular-nums">
                                {entry.primaryLabel}: {entry.primaryValue} {entry.primaryUnit} · Est. {fmtUsd(entry.costTypical)}
                              </div>
                            </div>
                            <div class="no-print flex items-center gap-3">
                              <a
                                href={entry.shareUrl || `/calculators/${entry.slug}/`}
                                class="text-xs font-mono text-blueprint hover:underline"
                              >
                                Edit Inputs →
                              </a>
                              <button
                                type="button"
                                onClick={() => removeEntry(entry.id)}
                                class="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                              >
                                <LucideIcon name="trash-2" size={13} />
                                <span>Remove</span>
                              </button>
                            </div>
                          </div>

                          <ul class="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {entry.materials.map((m) => (
                              <li
                                key={m.name}
                                class="flex items-center justify-between gap-3 text-xs px-3 py-2 rounded-md bg-canvas border border-hairline"
                              >
                                <span class="font-medium text-ink tabular-nums">
                                  <strong class="font-bold">{m.quantity.toLocaleString()} {m.unit}</strong> — {m.name}
                                </span>
                                <span class="font-mono font-semibold text-ink tabular-nums shrink-0">
                                  {fmtUsd(m.totalTypical)}
                                </span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </section>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* TAB 2: COMPARE SCENARIOS */}
      {tab === 'compare' && (
        <div>
          {compareItems.length === 0 ? (
            <div class="bm-panel p-10 text-center">
              <div class="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-lg bg-surface-subtle border border-hairline text-blueprint">
                <LucideIcon name="git-compare" size={20} />
              </div>
              <h2 class="text-lg font-bold text-ink mb-1">No Scenarios Saved for Comparison</h2>
              <p class="text-sm text-ink-muted max-w-md mx-auto mb-5">
                On any calculator page, adjust dimensions or thickness (e.g., 4-inch vs. 6-inch slab) and click <strong>Compare Scenario</strong> to inspect differences side-by-side.
              </p>
              <a href="/calculators/concrete-slab-calculator/" class="bm-btn-lime text-xs">
                Try Concrete Slab Comparison →
              </a>
            </div>
          ) : (
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              {compareItems.map((item) => (
                <div key={item.id} class="bm-panel overflow-hidden flex flex-col justify-between">
                  <div>
                    <div class="px-4 py-3 bg-graphite-900 text-[#F8F8F5] flex items-center justify-between gap-2">
                      <span class="font-mono text-[10px] uppercase tracking-wider text-lime-500 truncate">
                        {item.scenarioLabel}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeCompare(item.id)}
                        aria-label="Remove scenario"
                        class="text-[#9BA1AA] hover:text-red-400"
                      >
                        <LucideIcon name="x" size={14} />
                      </button>
                    </div>
                    <div class="p-4 space-y-3">
                      <div>
                        <h3 class="text-sm font-bold text-ink">{item.title}</h3>
                        <div class="text-2xl font-extrabold text-blueprint mt-1 tabular-nums">
                          {item.primaryValue} <span class="text-sm font-mono">{item.primaryUnit}</span>
                        </div>
                        <div class="font-mono text-xs text-ink-muted mt-0.5 tabular-nums">
                          Est. ${item.costTypical.toLocaleString()} (${item.costLow.toLocaleString()}–${item.costHigh.toLocaleString()})
                        </div>
                      </div>
                      {item.secondaryResults && item.secondaryResults.length > 0 && (
                        <dl class="pt-3 border-t border-hairline space-y-1.5 text-xs tabular-nums">
                          {item.secondaryResults.map((sec) => (
                            <div key={sec.label} class="flex items-center justify-between gap-2">
                              <dt class="text-ink-muted truncate">{sec.label}</dt>
                              <dd class="font-mono font-semibold text-ink shrink-0">
                                {sec.value} {sec.unit}
                              </dd>
                            </div>
                          ))}
                        </dl>
                      )}
                    </div>
                  </div>
                  <div class="px-4 py-3 border-t border-hairline bg-canvas">
                    <a href={item.restoreUrl} class="text-xs font-semibold text-blueprint hover:underline">
                      Open Scenario Inputs →
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: CALCULATION HISTORY */}
      {tab === 'history' && (
        <div>
          {historyItems.length === 0 ? (
            <div class="bm-panel p-10 text-center">
              <div class="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-lg bg-surface-subtle border border-hairline text-blueprint">
                <LucideIcon name="history" size={20} />
              </div>
              <h2 class="text-lg font-bold text-ink mb-1">No Calculation History Recorded Yet</h2>
              <p class="text-sm text-ink-muted max-w-md mx-auto">
                Whenever you calculate, copy, share, or save on any calculator, a snapshot with your input parameters is stored locally here.
              </p>
            </div>
          ) : (
            <div class="space-y-3">
              <div class="flex items-center justify-between">
                <span class="font-mono text-xs text-ink-muted">
                  Last {historyItems.length} calculation snapshots
                </span>
                <button
                  type="button"
                  onClick={clearHistory}
                  class="text-xs font-mono text-red-600 dark:text-red-400 hover:underline"
                >
                  Clear History
                </button>
              </div>
              <div class="divide-y divide-hairline bm-panel overflow-hidden">
                {historyItems.map((h) => (
                  <div key={h.id} class="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div class="min-w-0">
                      <div class="flex items-center gap-2">
                        <a href={h.restoreUrl} class="text-sm font-bold text-ink hover:text-blueprint">
                          {h.title}
                        </a>
                        <span class="font-mono text-[10px] text-ink-muted">
                          {new Date(h.timestamp).toLocaleDateString()}
                        </span>
                      </div>
                      <p class="text-xs text-ink-muted mt-0.5 truncate">{h.inputsSummary}</p>
                    </div>
                    <div class="flex items-center justify-between sm:justify-end gap-4 shrink-0">
                      <div class="text-right tabular-nums">
                        <div class="text-sm font-bold text-blueprint font-mono">
                          {h.primaryValue} {h.primaryUnit}
                        </div>
                        <div class="text-[11px] font-mono text-ink-muted">
                          Est. ${h.costTypical.toLocaleString()}
                        </div>
                      </div>
                      <a href={h.restoreUrl} class="bm-btn-secondary text-xs min-h-[34px] px-3 py-1.5">
                        Restore →
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
