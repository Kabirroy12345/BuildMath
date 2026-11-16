import { useState, useEffect } from 'preact/hooks';
import LucideIcon from './LucideIcon';
import { getCategoryIconName } from '../lib/lucide-icons';

export interface RecentCalculatorEntry {
  slug: string;
  shortName: string;
  category: string;
  categoryName: string;
  href: string;
  timestamp: number;
}

const STORAGE_KEY = 'buildmath_recent_calculators';

export default function RecentCalculators() {
  const [recent, setRecent] = useState<RecentCalculatorEntry[]>([]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        setRecent(parsed.slice(0, 4));
      }
    } catch {
      // Ignore invalid local storage payloads
    }
  }, []);

  if (recent.length === 0) return null;

  const clearHistory = () => {
    setRecent([]);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {}
  };

  return (
    <section class="mb-12" aria-labelledby="recent-tools-heading">
      <div class="flex items-center justify-between gap-4 mb-4">
        <div class="flex items-center gap-2.5">
          <LucideIcon name="clock" size={16} class="text-blueprint" />
          <h2 id="recent-tools-heading" class="text-sm font-mono font-semibold uppercase tracking-wider text-ink-muted">
            Recently Used Instruments
          </h2>
        </div>
        <button
          type="button"
          onClick={clearHistory}
          class="text-xs font-mono text-ink-muted hover:text-ink underline-offset-4 hover:underline"
        >
          Clear
        </button>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {recent.map((item) => (
          <a
            key={item.slug}
            href={item.href}
            class="bm-panel bm-panel-hover p-3.5 flex items-center justify-between gap-3 group hover:border-blueprint/60"
          >
            <div class="flex items-center gap-3 min-w-0">
              <span class="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-surface-subtle border border-hairline text-blueprint">
                <LucideIcon name={getCategoryIconName(item.category)} size={15} />
              </span>
              <div class="min-w-0">
                <div class="text-xs font-mono text-ink-muted truncate">{item.categoryName}</div>
                <div class="text-sm font-semibold text-ink group-hover:text-blueprint truncate transition-colors">
                  {item.shortName}
                </div>
              </div>
            </div>
            <LucideIcon
              name="arrow-right"
              size={14}
              class="text-ink-muted group-hover:text-blueprint group-hover:translate-x-0.5 transition-all"
            />
          </a>
        ))}
      </div>
    </section>
  );
}
