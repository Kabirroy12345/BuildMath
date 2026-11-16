import { useState, useEffect } from 'preact/hooks';
import LucideIcon from './LucideIcon';

export interface HeroSpecimenItem {
  id: 'slab' | 'paint' | 'roof' | 'drywall';
  tabLabel: string;
  eyebrow: string;
  standardTag: string;
  slug: string;
  dimensionsLabel: string;
  primaryLabel: string;
  primaryValue: string;
  primaryMeta: string;
  secondaryLabel: string;
  secondaryValue: string;
  secondaryMeta: string;
  copySummary: string;
}

interface HeroSpecimenConsoleProps {
  specimens: HeroSpecimenItem[];
}

function SpecimenBlueprintSvg({ id }: { id: HeroSpecimenItem['id'] }) {
  if (id === 'paint') {
    return (
      <svg viewBox="0 0 280 96" class="w-full h-24" role="img" aria-label="Interior wall elevation and door/window deduction schematic">
        {/* Room elevation frame */}
        <rect x="42" y="14" width="196" height="62" fill="rgba(71,121,168,0.14)" stroke="#6FA3D2" stroke-width="1.6" />
        {/* Deducted Door & Window cutouts */}
        <rect x="64" y="34" width="24" height="42" fill="#0D1013" stroke="#C6F36A" stroke-width="1.35" stroke-dasharray="3 2" />
        <rect x="150" y="26" width="38" height="24" fill="#0D1013" stroke="#C6F36A" stroke-width="1.35" stroke-dasharray="3 2" />
        <line x1="169" y1="26" x2="169" y2="50" stroke="#6FA3D2" stroke-width="1" />
        <line x1="150" y1="38" x2="188" y2="38" stroke="#6FA3D2" stroke-width="1" />
        {/* Dimension arrows */}
        <line x1="28" y1="14" x2="28" y2="76" stroke="#9BA1AA" stroke-width="1" />
        <text x="20" y="48" font-size="8.5" font-family="JetBrains Mono, monospace" fill="#6FA3D2" text-anchor="middle" transform="rotate(-90 20 48)">
          8 FT
        </text>
        <text x="140" y="90" font-size="9.5" font-family="JetBrains Mono, monospace" fill="#C6F36A" text-anchor="middle">
          12×12×8 FT · 2 DOORS + 2 WINDOWS DEDUCTED · 2 COATS
        </text>
      </svg>
    );
  }

  if (id === 'roof') {
    return (
      <svg viewBox="0 0 280 96" class="w-full h-24" role="img" aria-label="Gable roof 6/12 pitch multiplier schematic">
        {/* Gable roof profile */}
        <polygon points="44,68 140,18 236,68" fill="rgba(71,121,168,0.16)" stroke="#6FA3D2" stroke-width="1.75" />
        <line x1="140" y1="18" x2="140" y2="68" stroke="#9BA1AA" stroke-width="1" stroke-dasharray="3 3" />
        {/* 6/12 Pitch triangle inset */}
        <polyline points="86,46 116,46 116,30" fill="none" stroke="#C6F36A" stroke-width="1.6" />
        <text x="103" y="56" font-size="8" font-family="JetBrains Mono, monospace" fill="#C6F36A" text-anchor="middle">
          12
        </text>
        <text x="124" y="40" font-size="8" font-family="JetBrains Mono, monospace" fill="#C6F36A">
          6
        </text>
        <text x="140" y="90" font-size="9.5" font-family="JetBrains Mono, monospace" fill="#C6F36A" text-anchor="middle">
          50×40 FT FOOTPRINT · 6/12 PITCH (×1.118) + 10% WASTE
        </text>
      </svg>
    );
  }

  if (id === 'drywall') {
    return (
      <svg viewBox="0 0 280 96" class="w-full h-24" role="img" aria-label="4x8 drywall sheet hanging staggered grid diagram">
        {/* Staggered horizontal drywall panel bays */}
        <rect x="44" y="14" width="64" height="30" fill="rgba(71,121,168,0.18)" stroke="#6FA3D2" stroke-width="1.5" />
        <rect x="108" y="14" width="64" height="30" fill="rgba(71,121,168,0.12)" stroke="#6FA3D2" stroke-width="1.5" />
        <rect x="172" y="14" width="64" height="30" fill="rgba(198,243,106,0.16)" stroke="#C6F36A" stroke-width="1.5" />
        <rect x="44" y="44" width="32" height="30" fill="rgba(71,121,168,0.1)" stroke="#6FA3D2" stroke-width="1.5" />
        <rect x="76" y="44" width="64" height="30" fill="rgba(198,243,106,0.18)" stroke="#C6F36A" stroke-width="1.5" />
        <rect x="140" y="44" width="64" height="30" fill="rgba(71,121,168,0.18)" stroke="#6FA3D2" stroke-width="1.5" />
        <rect x="204" y="44" width="32" height="30" fill="rgba(71,121,168,0.1)" stroke="#6FA3D2" stroke-width="1.5" />
        <text x="108" y="63" font-size="8" font-family="JetBrains Mono, monospace" fill="#C6F36A" text-anchor="middle">
          4×8 FT
        </text>
        <text x="140" y="90" font-size="9.5" font-family="JetBrains Mono, monospace" fill="#C6F36A" text-anchor="middle">
          12×12×8 FT ROOM + CEILING · USG SCREW &amp; MUD SPEC
        </text>
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 280 96" class="w-full h-24" role="img" aria-label="Technical concrete slab dimension diagram">
      <polygon points="38,34 194,16 242,42 86,60" fill="rgba(71,121,168,0.22)" stroke="#6FA3D2" stroke-width="1.75" />
      <polygon points="38,34 86,60 86,74 38,48" fill="rgba(198,243,106,0.22)" stroke="#C6F36A" stroke-width="1.5" />
      <polygon points="86,60 242,42 242,56 86,74" fill="rgba(71,121,168,0.12)" stroke="#6FA3D2" stroke-width="1.5" />
      <text x="140" y="90" font-size="9.5" font-family="JetBrains Mono, monospace" fill="#C6F36A" text-anchor="middle">
        12 FT (L) × 10 FT (W) × 4 IN (THICK) + 10% WASTE
      </text>
    </svg>
  );
}

export default function HeroSpecimenConsole({ specimens }: HeroSpecimenConsoleProps) {
  const [activeIdx, setActiveIdx] = useState(0);
  const [paused, setPaused] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined' || specimens.length <= 1) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (paused) return;

    const timer = window.setInterval(() => {
      setActiveIdx((prev) => (prev + 1) % specimens.length);
    }, 5200);
    return () => window.clearInterval(timer);
  }, [paused, specimens.length]);

  const current = specimens[activeIdx] || specimens[0];
  if (!current) return null;

  const handleCopySpec = async () => {
    try {
      await navigator.clipboard.writeText(current.copySummary);
      setCopiedId(current.id);
      setPaused(true);
      setTimeout(() => setCopiedId((prev) => (prev === current.id ? null : prev)), 2000);
    } catch {}
  };

  return (
    <div
      class="lg:col-span-5 bm-instrument-rim overflow-hidden"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Top Specimen Telemetry Header + 4-Step Progress Bar (rive.app state switcher) */}
      <div class="px-4 py-3 border-b border-graphite-700 bg-graphite-950/75 space-y-2.5">
        <div class="flex items-center justify-between gap-2">
          <span class="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-wider text-[#D2D6DC]">
            <span class="h-1.5 w-1.5 rounded-full bg-lime-500"></span>
            <span>
              {String(activeIdx + 1).padStart(2, '0')} / {String(specimens.length).padStart(2, '0')} · {current.eyebrow}
            </span>
          </span>
          <span class="font-mono text-[10px] text-[#6FA3D2] shrink-0">{current.standardTag}</span>
        </div>

        <div class="grid grid-cols-4 gap-1.5" role="tablist" aria-label="Switch worked construction specimen">
          {specimens.map((item, idx) => {
            const active = idx === activeIdx;
            return (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => {
                  setActiveIdx(idx);
                  setPaused(true);
                }}
                class={`text-left px-2 py-1 rounded transition-colors font-mono text-[10px] truncate ${
                  active
                    ? 'bg-graphite-800 text-[#F8F8F5] border border-lime-500/55 font-semibold'
                    : 'bg-graphite-950/60 text-[#8E949D] border border-graphite-700/80 hover:text-[#D2D6DC]'
                }`}
              >
                <span class={`inline-block w-1.5 h-1.5 rounded-full mr-1.5 ${active ? 'bg-lime-500' : 'bg-graphite-700'}`}></span>
                {item.tabLabel}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main CAD Diagram + Live Spec Outputs */}
      <div class="p-5 space-y-4">
        <div class="bm-corner-ticks p-3.5 rounded-lg bg-graphite-950 border border-graphite-700 bm-cad-grid">
          <SpecimenBlueprintSvg id={current.id} />
        </div>

        <div class="grid grid-cols-2 gap-2.5">
          <div class="p-3 rounded-lg bg-graphite-950 border border-graphite-700">
            <span class="font-mono text-[10px] uppercase text-[#9BA1AA] block truncate">
              {current.primaryLabel}
            </span>
            <strong class="text-xl sm:text-[22px] font-extrabold text-lime-500 tabular-nums mt-0.5 block">
              {current.primaryValue}
            </strong>
            <span class="font-mono text-[10px] text-[#9BA1AA] block truncate mt-0.5">
              {current.primaryMeta}
            </span>
          </div>

          <div class="p-3 rounded-lg bg-graphite-950 border border-graphite-700">
            <span class="font-mono text-[10px] uppercase text-[#9BA1AA] block truncate">
              {current.secondaryLabel}
            </span>
            <strong class="text-xl sm:text-[22px] font-extrabold text-[#F8F8F5] tabular-nums mt-0.5 block">
              {current.secondaryValue}
            </strong>
            <span class="font-mono text-[10px] text-[#6FA3D2] block truncate mt-0.5">
              {current.secondaryMeta}
            </span>
          </div>
        </div>

        {/* Copyable CLI/BOM Spec Strip + Direct Instrument Launch (rive.app inline copy box) */}
        <div class="p-2.5 rounded-lg bg-graphite-950 border border-graphite-700 flex items-center justify-between gap-2">
          <span class="font-mono text-[10px] text-[#D2D6DC] truncate">
            {current.dimensionsLabel}
          </span>
          <button
            type="button"
            onClick={handleCopySpec}
            aria-label={`Copy ${current.tabLabel} sample specification`}
            class="inline-flex items-center gap-1 px-2 py-1 rounded bg-graphite-800 hover:bg-lime-500 text-[#F8F8F5] hover:text-[#17191C] border border-graphite-700 font-mono text-[10px] font-semibold transition-colors shrink-0"
          >
            <LucideIcon name={copiedId === current.id ? 'check' : 'copy'} size={11} />
            <span>{copiedId === current.id ? 'COPIED' : 'COPY SPEC'}</span>
          </button>
        </div>

        <div class="pt-1 flex items-center justify-between gap-2 text-xs">
          <span class="font-mono text-[11px] text-[#9BA1AA]">Inputs, waste &amp; prices editable live</span>
          <a
            href={`/calculators/${current.slug}/`}
            class="bm-arrow-glide inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-lime-500/15 hover:bg-lime-500 text-lime-500 hover:text-graphite-900 border border-lime-500/40 font-semibold transition-colors shrink-0"
          >
            <span>Launch Tool</span>
            <LucideIcon name="arrow-right" size={13} />
          </a>
        </div>
      </div>
    </div>
  );
}
