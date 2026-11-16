import { useState, useEffect, useMemo, useRef } from 'preact/hooks';
import LucideIcon from './LucideIcon';
import { getCategoryIconName } from '../lib/lucide-icons';
import { SCHEMATIC_PATHS, type SchematicKind } from '../lib/schematics';

export interface SearchableItem {
  slug: string;
  title: string;
  shortTitle?: string;
  category: string;
  categoryName: string;
  description: string;
  inputsLabel?: string;
  outputsLabel?: string;
  popularityRank?: number;
  recentOrder?: number;
  schematic?: SchematicKind;
  href: string;
  type: 'calculator' | 'cost';
}

export interface SearchBoxProps {
  items: SearchableItem[];
  categories?: { slug: string; name: string }[];
  placeholder?: string;
  showGridFilter?: boolean;
}

interface RecentEntry {
  slug: string;
  shortName: string;
  categoryName: string;
  href: string;
}

type SortMode = 'popular' | 'az' | 'recent';

const SUGGESTIONS = [
  'Concrete Slab',
  'Paint',
  'Drywall',
  'Stair Stringers',
  'Mulch',
  'Roofing Shingles',
];

export default function SearchBox({
  items,
  categories = [],
  placeholder = 'Search calculators & cost guides (paint, slab, roof, mulch)...',
  showGridFilter = false,
}: SearchBoxProps) {
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState<SortMode>('popular');
  const [recentItems, setRecentItems] = useState<RecentEntry[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const q = params.get('q');
    const cat = params.get('category');
    if (q) {
      setQuery(q);
    } else if (inputRef.current && inputRef.current.value) {
      setQuery(inputRef.current.value);
      setIsOpen(true);
    }
    if (cat) setSelectedCategory(cat);

    if (showGridFilter) {
      try {
        const raw = localStorage.getItem('buildmath_recent_calculators');
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) setRecentItems(parsed.slice(0, 4));
        }
      } catch {}
    }
  }, [showGridFilter]);

  useEffect(() => {
    if (typeof window === 'undefined' || showGridFilter) return;
    const handleOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleGlobalKey = (e: KeyboardEvent) => {
      if (
        e.key === '/' &&
        document.activeElement?.tagName !== 'INPUT' &&
        document.activeElement?.tagName !== 'TEXTAREA' &&
        document.activeElement?.tagName !== 'SELECT'
      ) {
        e.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    window.addEventListener('keydown', handleGlobalKey);
    return () => {
      document.removeEventListener('mousedown', handleOutside);
      window.removeEventListener('keydown', handleGlobalKey);
    };
  }, [showGridFilter]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const item of items) {
      counts[item.category] = (counts[item.category] || 0) + 1;
    }
    return counts;
  }, [items]);

  const filteredAndSorted = useMemo(() => {
    const q = query.trim().toLowerCase();
    const matched = items.filter((item) => {
      if (selectedCategory !== 'all' && item.category !== selectedCategory) {
        return false;
      }
      if (!q) return true;
      const haystack = `${item.title} ${item.shortTitle || ''} ${item.categoryName} ${item.description} ${item.inputsLabel || ''} ${item.outputsLabel || ''}`.toLowerCase();
      const tokens = q.split(/\s+/);
      return tokens.every((tok) => haystack.includes(tok));
    });

    if (!showGridFilter) return matched;

    return [...matched].sort((a, b) => {
      if (sortBy === 'az') {
        return a.title.localeCompare(b.title);
      }
      if (sortBy === 'recent') {
        return (b.recentOrder ?? 0) - (a.recentOrder ?? 0);
      }
      return (a.popularityRank ?? 99) - (b.popularityRank ?? 99);
    });
  }, [items, query, selectedCategory, sortBy, showGridFilter]);

  const popularShortcuts = useMemo(
    () =>
      [...items]
        .filter((i) => i.type === 'calculator')
        .sort((a, b) => (a.popularityRank ?? 99) - (b.popularityRank ?? 99))
        .slice(0, 4),
    [items]
  );

  if (showGridFilter) {
    return (
      <div>
        {/* Product-Grade Search & Sort Control Panel */}
        <div class="bm-panel p-5 sm:p-6 mb-6">
          <div class="flex flex-col lg:flex-row lg:items-center gap-3.5">
            <div class="relative flex-1">
              <label htmlFor="hub-search-input" class="sr-only">
                Search calculators
              </label>
              <span
                aria-hidden="true"
                class="pointer-events-none absolute inset-y-0 left-4 flex items-center text-ink-muted"
              >
                <LucideIcon name="search" size={19} />
              </span>
              <input
                ref={inputRef}
                id="hub-search-input"
                type="search"
                value={query}
                onInput={(e) => setQuery((e.target as HTMLInputElement).value)}
                placeholder={placeholder}
                class="bm-input !min-h-[52px] pl-11 pr-11 text-sm sm:text-base"
              />
              {query && (
                <button
                  type="button"
                  aria-label="Clear search"
                  onClick={() => setQuery('')}
                  class="absolute inset-y-0 right-3 flex items-center px-1.5 text-ink-muted hover:text-ink"
                >
                  <LucideIcon name="x" size={16} />
                </button>
              )}
            </div>

            {/* Sort Controls */}
            <div class="flex flex-wrap items-center justify-between lg:justify-end gap-2.5 shrink-0">
              <div
                role="group"
                aria-label="Sort calculators"
                class="inline-flex items-center rounded-lg bg-canvas border border-hairline p-1 text-xs"
              >
                <span class="hidden sm:inline-flex items-center gap-1 px-2 font-mono text-[10px] uppercase text-ink-muted">
                  <LucideIcon name="arrow-up-down" size={12} />
                  Sort
                </span>
                {[
                  { id: 'popular', label: 'Popular' },
                  { id: 'az', label: 'A–Z' },
                  { id: 'recent', label: 'Recently Added' },
                ].map((opt) => {
                  const active = sortBy === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      aria-pressed={active}
                      onClick={() => setSortBy(opt.id as SortMode)}
                      class={`px-2.5 py-1.5 rounded-md font-medium transition-colors min-h-[32px] ${
                        active
                          ? 'bg-graphite-900 text-[#F8F8F5] dark:bg-lime-500 dark:text-graphite-900 font-semibold'
                          : 'text-ink-muted hover:text-ink'
                      }`}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>

              <span class="font-mono text-xs text-ink-muted tabular-nums px-2">
                {filteredAndSorted.length} / {items.length}
              </span>
            </div>
          </div>

          {/* Search Suggestions Row */}
          <div class="mt-3 flex flex-wrap items-center gap-1.5 text-xs">
            <span class="font-mono text-[10px] uppercase tracking-wider text-ink-muted mr-1">
              Suggestions:
            </span>
            {SUGGESTIONS.map((term) => (
              <button
                key={term}
                type="button"
                onClick={() => {
                  setSelectedCategory('all');
                  setQuery(term);
                }}
                class="px-2.5 py-1 rounded-md bg-canvas border border-hairline hover:border-blueprint text-ink-body hover:text-ink transition-colors text-[11px]"
              >
                {term}
              </button>
            ))}
            {(query || selectedCategory !== 'all') && (
              <button
                type="button"
                onClick={() => {
                  setQuery('');
                  setSelectedCategory('all');
                }}
                class="ml-auto inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-mono font-semibold text-blueprint hover:underline"
              >
                <LucideIcon name="rotate-ccw" size={12} />
                Clear Filters
              </button>
            )}
          </div>

          {/* Category Filters with Counts */}
          {categories.length > 0 && (
            <div
              class="mt-4 pt-4 border-t border-hairline flex flex-wrap gap-1.5"
              role="group"
              aria-label="Filter by category"
            >
              <button
                type="button"
                onClick={() => setSelectedCategory('all')}
                aria-pressed={selectedCategory === 'all'}
                class={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors min-h-[34px] ${
                  selectedCategory === 'all'
                    ? 'bg-graphite-900 text-[#F8F8F5] dark:bg-lime-500 dark:text-graphite-900 font-semibold'
                    : 'bg-canvas text-ink-muted border border-hairline hover:text-ink hover:border-hairline-strong'
                }`}
              >
                <span>All Trades</span>
                <span class="font-mono text-[10px] opacity-75 tabular-nums">({items.length})</span>
              </button>
              {categories.map((cat) => {
                const isActive = selectedCategory === cat.slug;
                return (
                  <button
                    key={cat.slug}
                    type="button"
                    onClick={() => setSelectedCategory(cat.slug)}
                    aria-pressed={isActive}
                    class={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors min-h-[34px] ${
                      isActive
                        ? 'bg-graphite-900 text-[#F8F8F5] dark:bg-lime-500 dark:text-graphite-900 font-semibold'
                        : 'bg-canvas text-ink-muted border border-hairline hover:text-ink hover:border-hairline-strong'
                    }`}
                  >
                    <LucideIcon
                      name={getCategoryIconName(cat.slug)}
                      size={13}
                      class={isActive ? 'text-lime-500 dark:text-graphite-900' : 'text-blueprint'}
                    />
                    <span>{cat.name}</span>
                    <span class="font-mono text-[10px] opacity-75 tabular-nums">
                      ({categoryCounts[cat.slug] || 0})
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Quick Discovery Strip: Recently Used (if any) + Popular Tools */}
        {!query && selectedCategory === 'all' && (
          <div class="mb-7 grid grid-cols-1 lg:grid-cols-12 gap-4">
            <div class={`${recentItems.length > 0 ? 'lg:col-span-7' : 'lg:col-span-12'} bm-panel p-4`}>
              <div class="flex items-center justify-between gap-2 mb-2.5">
                <span class="font-mono text-[10px] font-semibold uppercase tracking-wider text-blueprint">
                  Popular Construction Calculators
                </span>
                <span class="font-mono text-[10px] text-ink-muted">Most frequently launched</span>
              </div>
              <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {popularShortcuts.map((pop) => (
                  <a
                    key={pop.slug}
                    href={pop.href}
                    class="px-3 py-2 rounded-lg bg-canvas border border-hairline hover:border-blueprint text-xs font-semibold text-ink hover:text-blueprint transition-colors flex items-center justify-between gap-1.5"
                  >
                    <span class="truncate">{pop.shortTitle || pop.title}</span>
                    <LucideIcon name="arrow-up-right" size={12} class="shrink-0 opacity-70" />
                  </a>
                ))}
              </div>
            </div>

            {recentItems.length > 0 && (
              <div class="lg:col-span-5 bm-panel p-4">
                <div class="flex items-center gap-1.5 mb-2.5">
                  <LucideIcon name="clock" size={13} class="text-blueprint" />
                  <span class="font-mono text-[10px] font-semibold uppercase tracking-wider text-ink-muted">
                    Recently Used
                  </span>
                </div>
                <div class="grid grid-cols-2 gap-2">
                  {recentItems.slice(0, 4).map((rec) => (
                    <a
                      key={rec.slug}
                      href={rec.href}
                      class="px-3 py-2 rounded-lg bg-surface-subtle/60 border border-hairline hover:border-blueprint text-xs font-medium text-ink hover:text-blueprint transition-colors flex items-center justify-between gap-1"
                    >
                      <span class="truncate">{rec.shortName}</span>
                      <LucideIcon name="arrow-right" size={12} class="shrink-0 opacity-60" />
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Structured 3-Part Calculator Cards */}
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAndSorted.map((item) => {
            const sch = item.schematic && SCHEMATIC_PATHS[item.schematic] ? SCHEMATIC_PATHS[item.schematic] : null;
            return (
              <a
                key={item.href}
                href={item.href}
                class="bm-panel bm-panel-hover p-5 group flex flex-col justify-between hover:border-blueprint/75"
              >
                <div>
                  <div class="flex items-center justify-between gap-2 mb-3">
                    <span class="inline-flex items-center gap-1.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-blueprint bg-blueprint-soft px-2 py-1 rounded">
                      <LucideIcon name={getCategoryIconName(item.category)} size={12} />
                      {item.categoryName}
                    </span>
                    {sch && (
                      <svg
                        viewBox="0 0 32 22"
                        width="32"
                        height="22"
                        aria-hidden="true"
                        class="text-blueprint opacity-75 group-hover:opacity-100 transition-opacity shrink-0"
                        dangerouslySetInnerHTML={{ __html: sch }}
                      />
                    )}
                  </div>

                  <h3 class="text-base font-bold text-ink group-hover:text-blueprint transition-colors">
                    {item.title}
                  </h3>
                  <p class="mt-1 text-xs sm:text-[13px] text-ink-muted leading-snug line-clamp-2">
                    {item.description}
                  </p>

                  {(item.inputsLabel || item.outputsLabel) && (
                    <dl class="mt-3.5 pt-3 border-t border-hairline space-y-1.5 text-[11px]">
                      {item.inputsLabel && (
                        <div class="flex items-baseline gap-2">
                          <dt class="font-mono font-semibold uppercase text-ink-muted w-14 shrink-0">
                            Inputs:
                          </dt>
                          <dd class="text-ink-body truncate">{item.inputsLabel}</dd>
                        </div>
                      )}
                      {item.outputsLabel && (
                        <div class="flex items-baseline gap-2">
                          <dt class="font-mono font-semibold uppercase text-ink-muted w-14 shrink-0">
                            Outputs:
                          </dt>
                          <dd class="text-ink font-medium truncate">{item.outputsLabel}</dd>
                        </div>
                      )}
                    </dl>
                  )}
                </div>

                <div class="mt-4 pt-3 border-t border-hairline flex items-center justify-between text-xs font-semibold text-ink">
                  <span class="group-hover:text-blueprint transition-colors">Open Calculator</span>
                  <LucideIcon
                    name="arrow-right"
                    size={14}
                    class="text-blueprint group-hover:translate-x-0.5 transition-transform"
                  />
                </div>
              </a>
            );
          })}
        </div>

        {filteredAndSorted.length === 0 && (
          <div class="bm-panel p-10 text-center my-4">
            <div class="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-lg bg-surface-subtle border border-hairline text-ink-muted">
              <LucideIcon name="search" size={20} />
            </div>
            <h3 class="text-base font-bold text-ink">
              No calculators matched "{query}"
            </h3>
            <p class="mt-1 text-sm text-ink-muted max-w-md mx-auto">
              Try a broader keyword or jump straight to a common estimation tool:
            </p>
            <div class="mt-5 flex flex-wrap items-center justify-center gap-2">
              {['paint', 'concrete', 'roof', 'mulch', 'drywall'].map((term) => (
                <button
                  key={term}
                  type="button"
                  onClick={() => {
                    setSelectedCategory('all');
                    setQuery(term);
                  }}
                  class="px-3 py-1.5 rounded-md text-xs font-mono font-medium bg-surface-subtle border border-hairline hover:border-blueprint text-ink transition-colors capitalize"
                >
                  {term}
                </button>
              ))}
              <button
                type="button"
                onClick={() => {
                  setQuery('');
                  setSelectedCategory('all');
                }}
                class="bm-btn-lime text-xs min-h-[34px] px-3 py-1.5"
              >
                Show All {items.length} Tools
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Command-Bar Instant Search for Hero / 404
  const dropdownMatches = query.trim() ? filteredAndSorted.slice(0, 8) : [];

  const handleKeyDown = (e: KeyboardEvent) => {
    if (!dropdownMatches.length) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((prev) => (prev + 1) % dropdownMatches.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((prev) => (prev <= 0 ? dropdownMatches.length - 1 : prev - 1));
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      setActiveIndex(-1);
    } else if (e.key === 'Enter' && activeIndex >= 0 && dropdownMatches[activeIndex]) {
      e.preventDefault();
      window.location.href = dropdownMatches[activeIndex].href;
    }
  };

  return (
    <div ref={containerRef} class="relative w-full max-w-2xl mx-auto">
      <form
        action="/calculators/"
        method="get"
        class="relative flex items-center rounded-xl bg-surface border border-hairline-strong shadow-sm focus-within:border-blueprint focus-within:ring-4 focus-within:ring-blueprint-soft transition-all"
      >
        <label htmlFor="hero-search-input" class="sr-only">
          Search calculators and cost guides
        </label>
        <span
          aria-hidden="true"
          class="pointer-events-none absolute inset-y-0 left-4 flex items-center text-ink-muted"
        >
          <LucideIcon name="search" size={18} />
        </span>
        <input
          ref={inputRef}
          id="hero-search-input"
          name="q"
          type="search"
          autocomplete="off"
          value={query}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          onInput={(e) => {
            setQuery((e.target as HTMLInputElement).value);
            setActiveIndex(-1);
            setIsOpen(true);
          }}
          placeholder={placeholder}
          class="w-full min-h-[54px] pl-11 pr-24 sm:pr-32 py-3 bg-transparent text-ink text-sm sm:text-base placeholder:text-ink-muted focus:outline-none"
        />
        <div class="absolute right-2 flex items-center gap-1.5">
          {!query && (
            <kbd class="hidden sm:inline-flex items-center px-1.5 py-0.5 text-[11px] font-mono font-medium text-ink-muted bg-surface-subtle border border-hairline rounded">
              /
            </kbd>
          )}
          <button
            type="submit"
            class="bm-btn-lime min-h-[38px] px-4 py-1.5 text-xs sm:text-sm font-semibold"
          >
            Search
          </button>
        </div>
      </form>

      {isOpen && dropdownMatches.length > 0 && (
        <ul
          role="listbox"
          aria-label="Search suggestions"
          class="absolute z-40 mt-2 w-full rounded-xl bg-surface border border-hairline-strong shadow-2xl divide-y divide-hairline overflow-hidden text-left"
        >
          {dropdownMatches.map((item, idx) => (
            <li key={item.href}>
              <a
                href={item.href}
                class={`flex items-center justify-between gap-3 px-4 py-3 transition-colors ${
                  idx === activeIndex ? 'bg-surface-subtle' : 'hover:bg-surface-subtle/70'
                }`}
              >
                <div class="flex items-start gap-3 min-w-0">
                  <span class="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-surface-subtle border border-hairline text-blueprint">
                    <LucideIcon
                      name={item.type === 'calculator' ? getCategoryIconName(item.category) : 'bar-chart-3'}
                      size={14}
                    />
                  </span>
                  <div class="min-w-0">
                    <div class="text-sm font-semibold text-ink truncate">
                      {item.title}
                    </div>
                    <div class="text-xs text-ink-muted line-clamp-1">
                      {item.inputsLabel ? `Inputs: ${item.inputsLabel}` : item.description}
                    </div>
                  </div>
                </div>
                <span class="shrink-0 font-mono text-[10px] font-semibold uppercase tracking-wider px-2 py-1 rounded bg-blueprint-soft text-blueprint">
                  {item.type === 'calculator' ? item.categoryName : 'Cost Guide'}
                </span>
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
