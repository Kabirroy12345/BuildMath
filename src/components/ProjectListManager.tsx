import { useState, useEffect, useMemo } from 'preact/hooks';
import type { MaterialLineItem } from '../lib/formulas/types';
import LucideIcon from './LucideIcon';

export interface SavedProjectEntry {
  id: string;
  slug: string;
  title: string;
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

  // Consolidate identical materials across multiple saved calculations
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

  const handleCopyText = () => {
    const lines: string[] = [
      'BuildMath Project Workspace — Material Shopping List',
      '===================================================',
      '',
    ];
    for (const entry of entries) {
      lines.push(`${entry.title}: ${entry.primaryValue} ${entry.primaryUnit} (Est. $${entry.costTypical})`);
      for (const m of entry.materials) {
        lines.push(`  - ${m.quantity} ${m.unit} ${m.name} ($${m.totalTypical})`);
      }
      lines.push('');
    }
    if (consolidatedMaterials.length > 0) {
      lines.push('Consolidated Purchase Summary:');
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
      {/* Workspace Navigation Tabs */}
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

        {entries.length > 0 && (
          <div class="flex items-center gap-2">
            <button type="button" onClick={handleCopyText} class="bm-btn-secondary text-xs min-h-[36px] px-3 py-1.5">
              <LucideIcon name={copied ? 'check' : 'copy'} size={13} />
              <span>{copied ? 'Copied BOM' : 'Copy List'}</span>
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              class="bm-btn-graphite text-xs min-h-[36px] px-3 py-1.5"
            >
              <LucideIcon name="download" size={13} />
              <span>Export PDF</span>
            </button>
          </div>
        )}
      </div>

      {/* TAB 1: SHOPPING LIST & CONSOLIDATED BOM */}
      {tab === 'bom' && (
        <>
          {entries.length === 0 ? (
            <div class="bm-panel p-10 text-center">
              <div class="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-surface-subtle border border-hairline text-blueprint">
                <LucideIcon name="clipboard-list" size={22} />
              </div>
              <h2 class="text-xl font-bold text-ink mb-2">
                Your Project Workspace is Empty
              </h2>
              <p class="text-sm text-ink-muted max-w-md mx-auto mb-6 leading-relaxed">
                Open any of our 32 calculators and click <strong>+ Add to My Project List</strong> to combine room takeoffs, consolidate hardware store quantities, and export a printable PDF worksheet.
              </p>
              <a href="/calculators/" class="bm-btn-lime text-sm">
                <span>Browse All Calculators</span>
                <LucideIcon name="arrow-right" size={16} />
              </a>
            </div>
          ) : (
            <div class="space-y-6">
              {/* Total Budget Telemetry Header */}
              <div class="bm-instrument p-6 flex flex-col md:flex-row md:items-center justify-between gap-5">
                <div>
                  <div class="flex items-center gap-2 font-mono text-[11px] uppercase tracking-wider text-[#9BA1AA]">
                    <span class="h-1.5 w-1.5 rounded-full bg-lime-500"></span>
                    <span>
                      Combined Project Total // {entries.length} {entries.length === 1 ? 'Calculation' : 'Calculations'} · {consolidatedMaterials.length} Material SKUs
                    </span>
                  </div>
                  <div class="mt-2 flex flex-wrap items-baseline gap-3">
                    <span class="text-3xl sm:text-4xl font-extrabold text-lime-500 tabular-nums tracking-tight">
                      ${totalTypical.toLocaleString()}
                    </span>
                    <span class="font-mono text-xs text-[#9BA1AA] tabular-nums">
                      Est. Range: ${totalLow.toLocaleString()} – ${totalHigh.toLocaleString()}
                    </span>
                  </div>
                </div>
                <div class="no-print flex flex-wrap gap-2">
                  <button type="button" onClick={handleCopyText} class="bm-btn-lime text-xs min-h-[38px]">
                    <LucideIcon name={copied ? 'check' : 'copy'} size={14} />
                    <span>{copied ? 'Copied BOM' : 'Copy Shopping List'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => window.print()}
                    class="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-medium bg-graphite-800 hover:bg-graphite-700 text-[#F8F8F5] border border-graphite-700 transition-colors min-h-[38px]"
                  >
                    <LucideIcon name="printer" size={14} />
                    <span>Export PDF / Print</span>
                  </button>
                  <button
                    type="button"
                    onClick={clearAllBom}
                    class="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-red-300 hover:bg-red-950/60 transition-colors min-h-[38px]"
                  >
                    <LucideIcon name="trash-2" size={14} />
                    <span>Clear All</span>
                  </button>
                </div>
              </div>

              {/* Consolidated Purchase Table (if >= 1 material item) */}
              {consolidatedMaterials.length > 0 && (
                <section class="bm-panel overflow-hidden" aria-label="Consolidated hardware store summary">
                  <div class="px-5 py-3.5 border-b border-hairline bg-surface-subtle/50 flex items-center justify-between">
                    <h2 class="text-sm font-bold text-ink">
                      Consolidated Hardware Store Shopping List
                    </h2>
                    <span class="font-mono text-[11px] text-ink-muted">Grouped across all saved rooms</span>
                  </div>
                  <div class="overflow-x-auto">
                    <table class="w-full text-left border-collapse text-xs sm:text-sm tabular-nums">
                      <thead>
                        <tr class="border-b border-hairline bg-surface-subtle/40 font-mono text-[10px] uppercase text-ink-muted">
                          <th class="py-2.5 px-4 font-semibold">Material Item</th>
                          <th class="py-2.5 px-4 font-semibold">Total Quantity</th>
                          <th class="py-2.5 px-4 font-semibold text-right">Est. Subtotal</th>
                        </tr>
                      </thead>
                      <tbody class="divide-y divide-hairline">
                        {consolidatedMaterials.map((cm) => (
                          <tr key={`${cm.name}-${cm.unit}`}>
                            <td class="py-2.5 px-4 font-medium text-ink">{cm.name}</td>
                            <td class="py-2.5 px-4 font-mono font-bold text-blueprint">
                              {cm.quantity.toLocaleString()} {cm.unit}
                            </td>
                            <td class="py-2.5 px-4 text-right font-mono font-semibold text-ink">
                              ${cm.totalTypical.toLocaleString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>
              )}

              {/* Individual Saved Takeoffs */}
              <div class="space-y-4">
                {entries.map((entry, idx) => (
                  <div key={entry.id} class="bm-panel overflow-hidden">
                    <div class="px-5 py-4 bg-surface-subtle/40 border-b border-hairline flex flex-wrap items-center justify-between gap-3">
                      <div class="flex items-start gap-3">
                        <span class="font-mono text-xs font-semibold text-ink-muted bg-surface border border-hairline px-2 py-1 rounded tabular-nums">
                          #{String(idx + 1).padStart(2, '0')}
                        </span>
                        <div>
                          <a
                            href={entry.shareUrl || `/calculators/${entry.slug}/`}
                            class="text-base sm:text-lg font-bold text-ink hover:text-blueprint transition-colors"
                          >
                            {entry.title}
                          </a>
                          <div class="mt-0.5 font-mono text-xs text-blueprint font-semibold tabular-nums">
                            {entry.primaryLabel}: {entry.primaryValue} {entry.primaryUnit} • Est. $
                            {entry.costTypical.toLocaleString()}
                          </div>
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
                          class="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                        >
                          <LucideIcon name="trash-2" size={13} />
                          <span>Remove</span>
                        </button>
                      </div>
                    </div>

                    <div class="p-4 sm:p-5">
                      <ul class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {entry.materials.map((m) => (
                          <li
                            key={m.name}
                            class="flex items-center justify-between gap-3 text-xs sm:text-sm px-3.5 py-2.5 rounded-lg bg-canvas border border-hairline"
                          >
                            <span class="font-medium text-ink tabular-nums">
                              <strong class="font-bold">{m.quantity.toLocaleString()} {m.unit}</strong> — {m.name}
                            </span>
                            <span class="font-mono font-semibold text-ink tabular-nums shrink-0">
                              ${m.totalTypical.toLocaleString()}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
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
                On any calculator page, adjust your dimensions or thickness (for example, a 4-inch vs. 6-inch concrete slab) and click <strong>Compare Scenario</strong> to view estimates side-by-side.
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
                Whenever you click Calculate Estimate, Copy, Share, or Add to Project on any calculator, a snapshot with your inputs is saved here locally.
              </p>
            </div>
          ) : (
            <div class="space-y-3">
              <div class="flex items-center justify-between">
                <span class="font-mono text-xs text-ink-muted">
                  Last {historyItems.length} saved calculation snapshots
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
