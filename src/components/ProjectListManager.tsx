import { useState, useEffect } from 'preact/hooks';
import type { MaterialLineItem } from '../lib/formulas/types';

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
    } catch (e) {}
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
    const lines: string[] = ['BuildMath Combined Project Shopping List', '========================================', ''];
    for (const entry of entries) {
      lines.push(`${entry.title}: ${entry.primaryValue} ${entry.primaryUnit} (Est. $${entry.costTypical})`);
      for (const m of entry.materials) {
        lines.push(`  - ${m.quantity} ${m.unit} ${m.name} ($${m.totalTypical})`);
      }
      lines.push('');
    }
    lines.push(`Grand Total Estimate: $${totalTypical.toLocaleString()} (Range: $${totalLow.toLocaleString()} - $${totalHigh.toLocaleString()})`);
    if (navigator.clipboard) {
      navigator.clipboard.writeText(lines.join('\n')).catch(() => {});
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  if (entries.length === 0) {
    return (
      <div class="card p-8 text-center my-6">
        <h2 class="text-xl font-bold text-slate-900 dark:text-white mb-2">
          Your Project Shopping List is Empty
        </h2>
        <p class="text-sm text-slate-600 dark:text-slate-400 max-w-md mx-auto mb-6">
          Use any of our 32 DIY calculators and click <strong>"+ Add to My Project List"</strong> to combine materials and cost estimates into one printable shopping list.
        </p>
        <a href="/calculators/" class="btn-primary">
          Browse All Calculators →
        </a>
      </div>
    );
  }

  return (
    <div class="my-6 space-y-6">
      {/* Summary Header Card */}
      <div class="card p-6 bg-slate-900 text-white dark:bg-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span class="text-xs uppercase tracking-wider text-slate-300">
            Combined Project Total ({entries.length} {entries.length === 1 ? 'Calculation' : 'Calculations'})
          </span>
          <div class="text-3xl font-extrabold text-accent-500 mt-1">
            ${totalTypical.toLocaleString()}{' '}
            <span class="text-sm font-normal text-slate-300">
              (Range: ${totalLow.toLocaleString()} – ${totalHigh.toLocaleString()})
            </span>
          </div>
        </div>
        <div class="no-print flex flex-wrap gap-2">
          <button type="button" onClick={handleCopyText} class="btn-accent text-xs">
            {copied ? '✓ Copied to Clipboard' : 'Copy Shopping List'}
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            class="btn-secondary text-xs !bg-slate-800 !text-white !border-slate-700"
          >
            Print List
          </button>
          <button
            type="button"
            onClick={clearAll}
            class="px-3 py-2 rounded-lg text-xs font-medium text-red-300 hover:bg-red-950/50 transition-colors"
          >
            Clear All
          </button>
        </div>
      </div>

      {/* Saved Items */}
      <div class="space-y-4">
        {entries.map((entry) => (
          <div key={entry.id} class="card p-5">
            <div class="flex flex-wrap items-start justify-between gap-3 pb-3 mb-3 border-b border-slate-200 dark:border-slate-800">
              <div>
                <a
                  href={entry.shareUrl || `/calculators/${entry.slug}/`}
                  class="text-lg font-bold text-slate-900 dark:text-white hover:text-brand-600"
                >
                  {entry.title}
                </a>
                <div class="text-sm text-brand-700 dark:text-brand-300 font-semibold">
                  {entry.primaryLabel}: {entry.primaryValue} {entry.primaryUnit} • Est. $
                  {entry.costTypical.toLocaleString()}
                </div>
              </div>
              <button
                type="button"
                onClick={() => removeEntry(entry.id)}
                class="no-print text-xs font-medium text-red-600 dark:text-red-400 hover:underline"
              >
                Remove
              </button>
            </div>

            <ul class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {entry.materials.map((m) => (
                <li
                  key={m.name}
                  class="flex items-center justify-between text-xs sm:text-sm p-2.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800"
                >
                  <span class="font-medium text-slate-800 dark:text-slate-200">
                    {m.quantity.toLocaleString()} {m.unit} — {m.name}
                  </span>
                  <span class="font-semibold text-slate-900 dark:text-white">
                    ${m.totalTypical.toLocaleString()}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
