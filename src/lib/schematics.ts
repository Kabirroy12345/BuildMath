export type SchematicKind =
  | 'room'
  | 'slab'
  | 'cylinder'
  | 'steps'
  | 'roof'
  | 'pitch'
  | 'grid'
  | 'fence'
  | 'volume';

export const SCHEMATIC_PATHS: Record<SchematicKind, string> = {
  room: '<rect x="5" y="4" width="22" height="14" rx="1.5" fill="rgba(71,121,168,0.14)" stroke="currentColor" stroke-width="1.4"/><line x1="9" y1="18" x2="14" y2="18" stroke="#C6F36A" stroke-width="2"/><line x1="20" y1="4" x2="24" y2="4" stroke="#C6F36A" stroke-width="2"/>',
  slab: '<polygon points="4,9 21,5 28,9 11,13" fill="rgba(71,121,168,0.18)" stroke="currentColor" stroke-width="1.3"/><polygon points="4,9 11,13 11,18 4,14" fill="rgba(198,243,106,0.22)" stroke="currentColor" stroke-width="1.2"/><polygon points="11,13 28,9 28,14 11,18" fill="none" stroke="currentColor" stroke-width="1.2"/>',
  cylinder:
    '<ellipse cx="16" cy="5.5" rx="7.5" ry="2.5" fill="rgba(71,121,168,0.18)" stroke="currentColor" stroke-width="1.3"/><path d="M8.5 5.5v11c0 1.4 3.4 2.5 7.5 2.5s7.5-1.1 7.5-2.5v-11" fill="none" stroke="currentColor" stroke-width="1.3"/>',
  steps:
    '<polyline points="4,18 4,14 10,14 10,10 16,10 16,6 22,6 22,3 27,3 27,18 4,18" fill="rgba(71,121,168,0.16)" stroke="currentColor" stroke-width="1.4"/>',
  roof: '<polygon points="4,15 16,5 28,15" fill="rgba(71,121,168,0.18)" stroke="currentColor" stroke-width="1.4"/><line x1="4" y1="15" x2="28" y2="15" stroke="currentColor" stroke-width="1.4"/><line x1="16" y1="5" x2="16" y2="15" stroke="#C6F36A" stroke-width="1.2" stroke-dasharray="2 1.5"/>',
  pitch:
    '<polygon points="5,17 26,17 26,5" fill="rgba(71,121,168,0.18)" stroke="currentColor" stroke-width="1.4"/><rect x="23" y="14" width="3" height="3" fill="none" stroke="currentColor" stroke-width="1"/>',
  grid: '<rect x="5" y="4" width="22" height="14" fill="rgba(71,121,168,0.12)" stroke="currentColor" stroke-width="1.3"/><line x1="12.3" y1="4" x2="12.3" y2="18" stroke="currentColor" stroke-width="1"/><line x1="19.6" y1="4" x2="19.6" y2="18" stroke="currentColor" stroke-width="1"/><line x1="5" y1="11" x2="27" y2="11" stroke="currentColor" stroke-width="1"/>',
  fence:
    '<rect x="5" y="4" width="2.5" height="14" fill="currentColor"/><rect x="14.75" y="4" width="2.5" height="14" fill="currentColor"/><rect x="24.5" y="4" width="2.5" height="14" fill="currentColor"/><line x1="7.5" y1="7.5" x2="24.5" y2="7.5" stroke="#C6F36A" stroke-width="1.5"/><line x1="7.5" y1="13.5" x2="24.5" y2="13.5" stroke="#C6F36A" stroke-width="1.5"/>',
  volume:
    '<rect x="7" y="7" width="13" height="11" fill="rgba(71,121,168,0.16)" stroke="currentColor" stroke-width="1.3"/><polygon points="7,7 12,3.5 25,3.5 20,7" fill="none" stroke="currentColor" stroke-width="1.2"/><polygon points="20,7 25,3.5 25,14.5 20,18" fill="none" stroke="currentColor" stroke-width="1.2"/>',
};
