import { useState, useEffect, useMemo } from 'preact/hooks';

export interface SearchableItem {
  slug: string;
  title: string;
  shortTitle?: string;
  category: string;
  categoryName: string;
  description: string;
  href: string;
  type: 'calculator' | 'cost';
}

export interface SearchBoxProps {
  items: SearchableItem[];
  categories?: { slug: string; name: string }[];
  placeholder?: string;
  showGridFilter?: boolean;
}

export default function SearchBox({
  items,
  categories = [],
  placeholder = 'Search 30+ calculators & cost guides (e.g., paint, concrete slab, roof pitch, mulch)...',
  showGridFilter = false,
}: SearchBoxProps) {
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const q = params.get('q');
    const cat = params.get('category');
    if (q) setQuery(q);
    if (cat) setSelectedCategory(cat);
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((item) => {
      if (selectedCategory !== 'all' && item.category !== selectedCategory) {
        return false;
      }
      if (!q) return true;
      const haystack = `${item.title} ${item.shortTitle || ''} ${item.categoryName} ${item.description}`.toLowerCase();
      const tokens = q.split(/\s+/);
      return tokens.every((tok) => haystack.includes(tok));
    });
  }, [items, query, selectedCategory]);

  if (showGridFilter) {
    return (
      <div>
        <div class="flex flex-col md:flex-row gap-3 mb-6">
          <div class="relative flex-1">
            <label htmlFor="hub-search-input" class="sr-only">
              Search calculators
            </label>
            <input
              id="hub-search-input"
              type="search"
              value={query}
              onInput={(e) => setQuery((e.target as HTMLInputElement).value)}
              placeholder={placeholder}
              class="input-field pl-10"
            />
            <span
              aria-hidden="true"
              class="pointer-events-none absolute inset-y-0 left-3.5 flex items-center text-slate-400"
            >
              🔍
            </span>
          </div>
          {categories.length > 0 && (
            <div class="flex flex-wrap gap-1.5" role="group" aria-label="Filter by category">
              <button
                type="button"
                onClick={() => setSelectedCategory('all')}
                aria-pressed={selectedCategory === 'all'}
                class={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors min-h-[40px] ${
                  selectedCategory === 'all'
                    ? 'bg-brand-600 text-white'
                    : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-100'
                }`}
              >
                All ({items.length})
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.slug}
                  type="button"
                  onClick={() => setSelectedCategory(cat.slug)}
                  aria-pressed={selectedCategory === cat.slug}
                  class={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors min-h-[40px] ${
                    selectedCategory === cat.slug
                      ? 'bg-brand-600 text-white'
                      : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-100'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          )}
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((item) => (
            <a
              key={item.href}
              href={item.href}
              class="card p-5 hover:border-brand-500 dark:hover:border-brand-500 transition-all group flex flex-col justify-between"
            >
              <div>
                <span class="inline-block text-[11px] font-semibold uppercase tracking-wider text-brand-700 dark:text-brand-300 bg-brand-50 dark:bg-brand-950 px-2.5 py-0.5 rounded mb-2">
                  {item.categoryName}
                </span>
                <h3 class="text-base font-bold text-slate-900 dark:text-white group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                  {item.title}
                </h3>
                <p class="mt-1.5 text-xs sm:text-sm text-slate-600 dark:text-slate-400 line-clamp-2">
                  {item.description}
                </p>
              </div>
              <span class="mt-4 inline-flex items-center text-xs font-semibold text-brand-600 dark:text-brand-400">
                Open Calculator →
              </span>
            </a>
          ))}
        </div>

        {filtered.length === 0 && (
          <div class="card p-8 text-center text-slate-600 dark:text-slate-400">
            No calculators matched "{query}". Try searching for "paint", "concrete", "roof", or "mulch".
          </div>
        )}
      </div>
    );
  }

  // Dropdown instant search bar for Hero
  const dropdownMatches = query.trim() ? filtered.slice(0, 8) : [];

  return (
    <div class="relative w-full max-w-2xl mx-auto">
      <form action="/calculators/" method="get" class="relative flex items-center">
        <label htmlFor="hero-search-input" class="sr-only">
          Search calculators and cost guides
        </label>
        <span
          aria-hidden="true"
          class="pointer-events-none absolute inset-y-0 left-4 flex items-center text-slate-400 text-lg"
        >
          🔍
        </span>
        <input
          id="hero-search-input"
          name="q"
          type="search"
          autocomplete="off"
          value={query}
          onFocus={() => setIsOpen(true)}
          onInput={(e) => {
            setQuery((e.target as HTMLInputElement).value);
            setIsOpen(true);
          }}
          placeholder={placeholder}
          class="w-full min-h-[54px] pl-12 pr-28 py-3 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-base shadow-md focus:border-brand-600 focus:outline-none"
        />
        <button
          type="submit"
          class="absolute right-2 px-4 py-2 rounded-lg bg-brand-600 hover:bg-brand-700 text-white font-semibold text-sm min-h-[40px]"
        >
          Search
        </button>
      </form>

      {isOpen && dropdownMatches.length > 0 && (
        <ul
          role="listbox"
          aria-label="Search suggestions"
          class="absolute z-40 mt-2 w-full rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-xl divide-y divide-slate-100 dark:divide-slate-800 overflow-hidden text-left"
        >
          {dropdownMatches.map((item) => (
            <li key={item.href}>
              <a
                href={item.href}
                class="flex items-center justify-between gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/70 transition-colors"
              >
                <div>
                  <div class="text-sm font-bold text-slate-900 dark:text-white">
                    {item.title}
                  </div>
                  <div class="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">
                    {item.description}
                  </div>
                </div>
                <span class="shrink-0 text-[11px] font-semibold px-2 py-0.5 rounded bg-brand-50 dark:bg-brand-950 text-brand-700 dark:text-brand-300">
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
