import { useState, useEffect } from 'preact/hooks';
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

export default function ProjectListManager() {
  const [entries, setEntries] = useState<SavedProjectEntry[]>([]);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const raw = localStorage.getItem('buildmath_project_list');
      if (raw) {
        setEntries(JSON.parse(raw));
      }
    } catch (e) {
      console.error('Failed to read project list', e);
    }
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

  const clearAll = () => {
    updateStorage([]);
  };

  const totalLow = entries.reduce((sum, e) => sum + (e.costLow || 0), 0);
  const totalTypical = entries.reduce((sum, e) => sum + (e.costTypical || 0), 0);
  const totalHigh = entries.reduce((sum, e) => sum + (e.costHigh || 0), 0);

  const handleCopyText = () => {
    const lines: string[] = ['BuildMath Combined Project Bill of Materials', '===========================================', ''];
    for (const entry of entries) {
      lines.push(`${entry.title}: ${entry.primaryValue} ${entry.primaryUnit} (Est. $${entry.costTypical})`);
      for (const m of entry.materials) {
        lines.push(`  - ${m.quantity} ${m.unit} ${m.name} ($${m.totalTypical})`);
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

  if (entries.length === 0) {
    return (
      <div class="bm-panel p-10 text-center my-6">
        <div class="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-surface-subtle border border-hairline text-blueprint">
          <LucideIcon name="clipboard-list" size={22} />
        </div>
        <h2 class="text-xl font-bold text-ink mb-2">
          Your Project Shopping List is Empty
        </h2>
        <p class="text-sm text-ink-muted max-w-md mx-auto mb-6 leading-relaxed">
          Open any of our 32 DIY calculators and click <strong>+ Add to My Project List</strong> to aggregate materials and hardware store budgets in one printable takeoff sheet.
        </p>
        <a href="/calculators/" class="bm-btn-lime text-sm">
          <span>Browse All Calculators</span>
          <LucideIcon name="arrow-right" size={16} />
        </a>
      </div>
    );
  }

  return (
    <div class="my-6 space-y-6">
      {/* Combined Budget Readout Header */}
      <div class="bm-instrument p-6 flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div>
          <div class="flex items-center gap-2 font-mono text-[11px] uppercase tracking-wider text-[#9BA1AA]">
            <span class="h-1.5 w-1.5 rounded-full bg-lime-500"></span>
            <span>
              Combined Project BOM // {entries.length} {entries.length === 1 ? 'Takeoff' : 'Takeoffs'}
            </span>
          </div>
          <div class="mt-2 flex flex-wrap items-baseline gap-3">
            <span class="text-3xl sm:text-4xl font-extrabold text-lime-500 tabular-nums tracking-tight">
              ${totalTypical.toLocaleString()}
            </span>
            <span class="font-mono text-xs text-[#9BA1AA] tabular-nums">
              Range: ${totalLow.toLocaleString()} – ${totalHigh.toLocaleString()}
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
            <span>Print</span>
          </button>
          <button
            type="button"
            onClick={clearAll}
            class="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-red-300 hover:bg-red-950/60 border border-transparent hover:border-red-900 transition-colors min-h-[38px]"
          >
            <LucideIcon name="trash-2" size={14} />
            <span>Clear All</span>
          </button>
        </div>
      </div>

      {/* Individual Takeoff Cards */}
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
              <button
                type="button"
                onClick={() => removeEntry(entry.id)}
                class="no-print inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
              >
                <LucideIcon name="trash-2" size={13} />
                <span>Remove</span>
              </button>
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
  );
}
