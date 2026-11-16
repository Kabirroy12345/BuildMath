import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import LucideIcon from './LucideIcon';

type LayerId = 'all' | 'foundation' | 'roof' | 'envelope' | 'porch';

interface Segment3D {
  x1: number;
  y1: number;
  z1: number;
  x2: number;
  y2: number;
  z2: number;
  layer: Exclude<LayerId, 'all'> | 'grid';
  role: 'primary' | 'secondary' | 'detail' | 'dashed';
  hot?: boolean;
}

interface CalloutAnchor {
  x: number;
  y: number;
  z: number;
  text: string;
  layer: Exclude<LayerId, 'all'>;
}

interface LayerSpec {
  id: LayerId;
  code: string;
  label: string;
  summary: string;
  specBadge: string;
  links: { label: string; href: string }[];
}

const LAYER_SPECS: LayerSpec[] = [
  {
    id: 'all',
    code: '00',
    label: 'Full Residence',
    summary: 'Complete 2-story residential structural wireframe: footing slab, porch framing, stud envelope, and gabled rafter trusses.',
    specBadge: '32 INTEGRATED TRADE CALCULATORS',
    links: [
      { label: 'Explore All 32 Tools', href: '/calculators/' },
      { label: 'Open Project BOM', href: '/my-project/' },
    ],
  },
  {
    id: 'foundation',
    code: '01',
    label: 'Foundation & Patio',
    summary: '4-inch perimeter footing slab, contraction control joints, courtyard patio pad, and 3-riser entry concrete steps.',
    specBadge: 'ACI 318 · 4" SLAB & FOOTINGS',
    links: [
      { label: 'Concrete Slab', href: '/calculators/concrete-slab-calculator/' },
      { label: 'Footings', href: '/calculators/concrete-footing-calculator/' },
      { label: 'Paver Patio', href: '/calculators/paver-patio-calculator/' },
    ],
  },
  {
    id: 'roof',
    code: '02',
    label: 'Roof & Rafters',
    summary: 'Multi-gable structural roof framing with 6/12 pitch slope, collar ties, overhanging eaves, gutters, and chimney stack.',
    specBadge: 'ARMA · 6/12 PITCH & RAFTERS',
    links: [
      { label: 'Roofing Shingles', href: '/calculators/roofing-calculator/' },
      { label: 'Roof Pitch', href: '/calculators/roof-pitch-calculator/' },
      { label: 'Gutters', href: '/calculators/gutter-calculator/' },
    ],
  },
  {
    id: 'envelope',
    code: '03',
    label: 'Walls & Envelope',
    summary: 'First and second story wall framing, recessed window sashes with mullions, garage wing enclosure, and net painted area.',
    specBadge: 'USG / MPI · DEDUCTED OPENINGS',
    links: [
      { label: 'Interior Paint', href: '/calculators/paint-calculator/' },
      { label: 'Drywall Sheets', href: '/calculators/drywall-calculator/' },
      { label: 'Exterior Siding', href: '/calculators/siding-calculator/' },
    ],
  },
  {
    id: 'porch',
    code: '04',
    label: 'Porch, Deck & Stairs',
    summary: 'Covered entry deck joists, four structural porch columns, guard balusters, pergola courtyard wing, and entry stringers.',
    specBadge: 'AWC DCA6 · IRC STAIR RISE',
    links: [
      { label: 'Deck Framing', href: '/calculators/deck-calculator/' },
      { label: 'Stair Stringers', href: '/calculators/stair-calculator/' },
      { label: 'Wood Fence', href: '/calculators/fence-calculator/' },
    ],
  },
];

function addBox(
  out: Segment3D[],
  x1: number,
  y1: number,
  z1: number,
  x2: number,
  y2: number,
  z2: number,
  layer: Segment3D['layer'],
  role: Segment3D['role'] = 'primary',
  hotCorners = false
) {
  const edges: [number, number, number, number, number, number][] = [
    [x1, y1, z1, x2, y1, z1],
    [x2, y1, z1, x2, y1, z2],
    [x2, y1, z2, x1, y1, z2],
    [x1, y1, z2, x1, y1, z1],
    [x1, y2, z1, x2, y2, z1],
    [x2, y2, z1, x2, y2, z2],
    [x2, y2, z2, x1, y2, z2],
    [x1, y2, z2, x1, y2, z1],
    [x1, y1, z1, x1, y2, z1],
    [x2, y1, z1, x2, y2, z1],
    [x2, y1, z2, x2, y2, z2],
    [x1, y1, z2, x1, y2, z2],
  ];
  edges.forEach((e, idx) => {
    out.push({
      x1: e[0],
      y1: e[1],
      z1: e[2],
      x2: e[3],
      y2: e[4],
      z2: e[5],
      layer,
      role,
      hot: hotCorners && idx < 4,
    });
  });
}

function addWindow(
  out: Segment3D[],
  plane: 'front' | 'right' | 'left',
  u1: number,
  v1: number,
  u2: number,
  v2: number,
  fixedCoord: number
) {
  const um = (u1 + u2) * 0.5;
  const vm = (v1 + v2) * 0.5;
  if (plane === 'front') {
    out.push(
      { x1: u1, y1: v1, z1: fixedCoord, x2: u2, y2: v1, z2: fixedCoord, layer: 'envelope', role: 'primary' },
      { x1: u2, y1: v1, z1: fixedCoord, x2: u2, y2: v2, z2: fixedCoord, layer: 'envelope', role: 'primary' },
      { x1: u2, y1: v2, z1: fixedCoord, x2: u1, y2: v2, z2: fixedCoord, layer: 'envelope', role: 'primary' },
      { x1: u1, y1: v2, z1: fixedCoord, x2: u1, y2: v1, z2: fixedCoord, layer: 'envelope', role: 'primary' },
      { x1: um, y1: v1, z1: fixedCoord, x2: um, y2: v2, z2: fixedCoord, layer: 'envelope', role: 'detail' },
      { x1: u1, y1: vm, z1: fixedCoord, x2: u2, y2: vm, z2: fixedCoord, layer: 'envelope', role: 'detail' }
    );
  } else {
    out.push(
      { x1: fixedCoord, y1: v1, z1: u1, x2: fixedCoord, y2: v1, z2: u2, layer: 'envelope', role: 'primary' },
      { x1: fixedCoord, y1: v1, z1: u2, x2: fixedCoord, y2: v2, z2: u2, layer: 'envelope', role: 'primary' },
      { x1: fixedCoord, y1: v2, z1: u2, x2: fixedCoord, y2: v2, z2: u1, layer: 'envelope', role: 'primary' },
      { x1: fixedCoord, y1: v2, z1: u1, x2: fixedCoord, y2: v1, z2: u1, layer: 'envelope', role: 'primary' },
      { x1: fixedCoord, y1: v1, z1: um, x2: fixedCoord, y2: v2, z2: um, layer: 'envelope', role: 'detail' },
      { x1: fixedCoord, y1: vm, z1: u1, x2: fixedCoord, y2: vm, z2: u2, layer: 'envelope', role: 'detail' }
    );
  }
}

function buildHouseGeometry(): { segments: Segment3D[]; callouts: CalloutAnchor[] } {
  const s: Segment3D[] = [];

  // 1. ARCHITECTURAL BLUEPRINT GROUND SHEET (y = 0)
  for (let gx = -22; gx <= 22; gx += 4) {
    s.push({ x1: gx, y1: 0, z1: -18, x2: gx, y2: 0, z2: 18, layer: 'grid', role: 'detail' });
  }
  for (let gz = -18; gz <= 18; gz += 4) {
    s.push({ x1: -22, y1: 0, z1: gz, x2: 22, y2: 0, z2: gz, layer: 'grid', role: 'detail' });
  }
  // Outer site setback dashed lines & architectural CAD dimension rails
  addBox(s, -15, 0, -10.5, 14.5, 0, 14, 'grid', 'dashed');
  s.push(
    { x1: -9, y1: 0, z1: 14.8, x2: 11, y2: 0, z2: 14.8, layer: 'grid', role: 'secondary' },
    { x1: -9, y1: 0, z1: 14.2, x2: -9, y2: 0, z2: 15.4, layer: 'grid', role: 'secondary' },
    { x1: 11, y1: 0, z1: 14.2, x2: 11, y2: 0, z2: 15.4, layer: 'grid', role: 'secondary' },
    { x1: 15.2, y1: 0, z1: -6, x2: 15.2, y2: 0, z2: 12.5, layer: 'grid', role: 'secondary' },
    { x1: 14.6, y1: 0, z1: -6, x2: 15.8, y2: 0, z2: -6, layer: 'grid', role: 'secondary' },
    { x1: 14.6, y1: 0, z1: 12.5, x2: 15.8, y2: 0, z2: 12.5, layer: 'grid', role: 'secondary' },
    // Extended projection leader guidelines sweeping onto blueprint floor
    { x1: -9, y1: 0, z1: 5, x2: -19, y2: 0, z2: 5, layer: 'grid', role: 'dashed' },
    { x1: -9, y1: 0, z1: -6, x2: -19, y2: 0, z2: -6, layer: 'grid', role: 'dashed' },
    { x1: 3, y1: 0, z1: 5, x2: 3, y2: 0, z2: 16.5, layer: 'grid', role: 'dashed' },
    { x1: 11, y1: 0, z1: 4, x2: 18, y2: 0, z2: 4, layer: 'grid', role: 'dashed' }
  );

  // Architectural North Compass Star on ground sheet front-left
  s.push(
    { x1: -16.5, y1: 0, z1: 11, x2: -16.5, y2: 0, z2: 14, layer: 'grid', role: 'secondary' },
    { x1: -18, y1: 0, z1: 12.5, x2: -15, y2: 0, z2: 12.5, layer: 'grid', role: 'secondary' },
    { x1: -16.5, y1: 0, z1: 11, x2: -16.0, y2: 0, z2: 12.5, layer: 'grid', role: 'primary' },
    { x1: -16.5, y1: 0, z1: 11, x2: -17.0, y2: 0, z2: 12.5, layer: 'grid', role: 'primary' }
  );

  // 2. FOUNDATION & PATIO SLAB LAYER
  // Perimeter stem footings below main footprint
  addBox(s, -9.3, -0.7, -6.3, 11.3, 0, 5.3, 'foundation', 'secondary', true);
  addBox(s, -9, 0, -6, 11, 0.55, 5, 'foundation', 'primary', true);
  // Concrete control joints across main slab
  for (let cx = -5; cx <= 7; cx += 4) {
    s.push({ x1: cx, y1: 0.55, z1: -6, x2: cx, y2: 0.55, z2: 5, layer: 'foundation', role: 'detail' });
  }
  // Courtyard Paver Patio Pad in foreground right
  addBox(s, 2.2, 0, 6.2, 10.2, 0.25, 12.6, 'foundation', 'primary', true);
  for (let px = 4.2; px < 10; px += 2) {
    s.push({ x1: px, y1: 0.25, z1: 6.2, x2: px, y2: 0.25, z2: 12.6, layer: 'foundation', role: 'detail' });
  }
  for (let pz = 8.2; pz < 12.5; pz += 2.1) {
    s.push({ x1: 2.2, y1: 0.25, z1: pz, x2: 10.2, y2: 0.25, z2: pz, layer: 'foundation', role: 'detail' });
  }
  // Entry Concrete Steps (3 risers descending +Z from porch edge z=8.4 -> 10.8)
  for (let step = 0; step < 3; step++) {
    const zA = 8.4 + step * 0.8;
    const zB = zA + 0.8;
    const yTop = 0.55 - step * 0.16;
    addBox(s, -6.2, 0, zA, -2.6, yTop, zB, 'foundation', 'primary');
  }

  // 3. PORCH, DECK, COLUMNS & COURTYARD PERGOLA LAYER
  // Covered Front Porch Deck Platform
  addBox(s, -9, 0.55, 5, 1.5, 0.72, 8.4, 'porch', 'primary', true);
  // Individual deck planks along X
  for (let dz = 5.5; dz < 8.4; dz += 0.55) {
    s.push({ x1: -9, y1: 0.72, z1: dz, x2: 1.5, y2: 0.72, z2: dz, layer: 'porch', role: 'detail' });
  }
  // 4 Architectural Porch Columns (with top capitals) supporting porch beam at y=5.05
  [-8.6, -6.3, -2.5, 1.1].forEach((colX) => {
    addBox(s, colX - 0.18, 0.72, 7.9, colX + 0.18, 5.05, 8.26, 'porch', 'primary', true);
  });
  // Porch Overhead Header Beam
  addBox(s, -9.1, 4.95, 7.85, 1.6, 5.25, 8.35, 'porch', 'primary');
  // Porch Guard Rail & Balusters (left & right of entry stair opening [-6.2, -2.6])
  s.push(
    { x1: -8.6, y1: 1.85, z1: 8.1, x2: -6.3, y2: 1.85, z2: 8.1, layer: 'porch', role: 'secondary' },
    { x1: -2.5, y1: 1.85, z1: 8.1, x2: 1.1, y2: 1.85, z2: 8.1, layer: 'porch', role: 'secondary' },
    { x1: 1.1, y1: 1.85, z1: 5.0, x2: 1.1, y2: 1.85, z2: 8.1, layer: 'porch', role: 'secondary' }
  );
  for (let bx = -8.1; bx <= -6.7; bx += 0.45) {
    s.push({ x1: bx, y1: 0.72, z1: 8.1, x2: bx, y2: 1.85, z2: 8.1, layer: 'porch', role: 'detail' });
  }
  for (let bx = -2.0; bx <= 0.8; bx += 0.52) {
    s.push({ x1: bx, y1: 0.72, z1: 8.1, x2: bx, y2: 1.85, z2: 8.1, layer: 'porch', role: 'detail' });
  }
  // Left Wing Architectural Pergola / Terrace Framing (matches left CAD wing in reference)
  addBox(s, -13.5, 0, -1.5, -9, 0.4, 5.0, 'porch', 'secondary');
  [
    [-13.2, 4.7],
    [-13.2, -1.2],
  ].forEach(([px, pz]) => {
    addBox(s, px - 0.16, 0.4, pz - 0.16, px + 0.16, 4.8, pz + 0.16, 'porch', 'primary');
  });
  s.push(
    { x1: -13.5, y1: 4.8, z1: -1.4, x2: -13.5, y2: 4.8, z2: 4.9, layer: 'porch', role: 'primary' },
    { x1: -13.5, y1: 4.8, z1: 4.9, x2: -9, y2: 4.8, z2: 4.9, layer: 'porch', role: 'secondary' },
    { x1: -13.5, y1: 4.8, z1: -1.4, x2: -9, y2: 4.8, z2: -1.4, layer: 'porch', role: 'secondary' }
  );
  for (let pz = -0.6; pz <= 4.4; pz += 1.0) {
    s.push({ x1: -13.6, y1: 4.9, z1: pz, x2: -9, y2: 4.9, z2: pz, layer: 'porch', role: 'detail' });
  }

  // 4. ENVELOPE, WALL FRAMING, DOORS & WINDOWS LAYER
  // Main First Floor Core Volume
  addBox(s, -9, 0.55, -6, 3, 5.4, 5, 'envelope', 'primary', true);
  // Right 1-Story Garage / Studio Wing
  addBox(s, 3, 0.55, -5.5, 11, 5.1, 4.5, 'envelope', 'primary', true);
  // Second Story Upper Volume (set slightly cantilevered / stacked over main core)
  addBox(s, -9, 5.4, -6, 3, 9.7, 5, 'envelope', 'primary', true);

  // Subtle exterior stud bay / wall framing verticals across front & side facades
  [-6, -3, 0, 7].forEach((sx) => {
    const wallTop = sx <= 3 ? 5.4 : 5.1;
    const zPos = sx <= 3 ? 5 : 4.5;
    s.push({ x1: sx, y1: 0.55, z1: zPos, x2: sx, y2: wallTop, z2: zPos, layer: 'envelope', role: 'detail' });
  });
  // Horizontal floor-plate trim band separating 1st & 2nd stories
  s.push(
    { x1: -9.15, y1: 5.4, z1: 5.05, x2: 3.15, y2: 5.4, z2: 5.05, layer: 'envelope', role: 'secondary' },
    { x1: -9.15, y1: 5.4, z1: -6.05, x2: -9.15, y2: 5.4, z2: 5.05, layer: 'envelope', role: 'secondary' },
    { x1: 3.15, y1: 5.4, z1: -6.05, x2: 3.15, y2: 5.4, z2: 5.05, layer: 'envelope', role: 'secondary' }
  );

  // Front Door + Recessed Sidelights (centered above porch stair landing)
  addBox(s, -5.3, 0.72, 4.88, -3.5, 4.3, 5.02, 'envelope', 'primary');
  s.push({ x1: -4.4, y1: 0.72, z1: 5.0, x2: -4.4, y2: 4.3, z2: 5.0, layer: 'envelope', role: 'detail' });

  // Detailed Multi-Pane Architectural Windows
  addWindow(s, 'front', -8.0, 2.0, -5.8, 4.2, 5.0);
  addWindow(s, 'front', -2.0, 1.8, 1.2, 4.2, 5.0);
  addWindow(s, 'front', -8.0, 6.4, -5.6, 8.7, 5.0);
  addWindow(s, 'front', -4.2, 6.4, -1.8, 8.7, 5.0);
  addWindow(s, 'front', -0.4, 6.4, 2.0, 8.7, 5.0);
  // Right Wing Garage / Double Glass Entry Bay Facing Front
  addWindow(s, 'front', 4.3, 0.75, 9.7, 4.1, 4.5);
  // Side Windows on Right Wing & Left Core
  addWindow(s, 'right', -3.6, 2.1, 2.2, 4.1, 11.0);
  addWindow(s, 'left', -3.8, 6.4, 2.2, 8.6, -9.0);
  // Subtle interior stair stringer diagonal inside core (visible in wireframe!)
  for (let step = 0; step < 6; step++) {
    const sx1 = -1.2 + step * 0.55;
    const sy1 = 0.7 + step * 0.78;
    s.push(
      { x1: sx1, y1: sy1, z1: -1.5, x2: sx1 + 0.55, y2: sy1, z2: -1.5, layer: 'envelope', role: 'detail' },
      { x1: sx1 + 0.55, y1: sy1, z1: -1.5, x2: sx1 + 0.55, y2: sy1 + 0.78, z2: -1.5, layer: 'envelope', role: 'detail' }
    );
  }

  // 5. ROOF, RAFTERS, TRUSSES, GUTTERS & CHIMNEY LAYER
  // Main 2-Story Gable Roof (ridge along X from -9.9 to +3.9 at z = -0.5, peak y = 13.5, eaves y = 9.5)
  const mrX1 = -9.9;
  const mrX2 = 3.9;
  const mrZ1 = -6.9;
  const mrZ2 = 5.9;
  const mrEave = 9.5;
  const mrPeak = 13.5;
  const mrRidgeZ = -0.5;

  // Main Roof Eaves, Ridge Beam & Both Gable Triangles
  s.push(
    { x1: mrX1, y1: mrPeak, z1: mrRidgeZ, x2: mrX2, y2: mrPeak, z2: mrRidgeZ, layer: 'roof', role: 'primary', hot: true },
    { x1: mrX1, y1: mrEave, z1: mrZ1, x2: mrX2, y2: mrEave, z2: mrZ1, layer: 'roof', role: 'primary', hot: true },
    { x1: mrX1, y1: mrEave, z1: mrZ2, x2: mrX2, y2: mrEave, z2: mrZ2, layer: 'roof', role: 'primary', hot: true },
    // Left gable triangle
    { x1: mrX1, y1: mrEave, z1: mrZ1, x2: mrX1, y2: mrPeak, z2: mrRidgeZ, layer: 'roof', role: 'primary' },
    { x1: mrX1, y1: mrEave, z1: mrZ2, x2: mrX1, y2: mrPeak, z2: mrRidgeZ, layer: 'roof', role: 'primary' },
    { x1: mrX1, y1: mrEave, z1: mrZ1, x2: mrX1, y2: mrEave, z2: mrZ2, layer: 'roof', role: 'secondary' },
    // Right gable triangle
    { x1: mrX2, y1: mrEave, z1: mrZ1, x2: mrX2, y2: mrPeak, z2: mrRidgeZ, layer: 'roof', role: 'primary' },
    { x1: mrX2, y1: mrEave, z1: mrZ2, x2: mrX2, y2: mrPeak, z2: mrRidgeZ, layer: 'roof', role: 'primary' },
    { x1: mrX2, y1: mrEave, z1: mrZ1, x2: mrX2, y2: mrEave, z2: mrZ2, layer: 'roof', role: 'secondary' }
  );

  // Exposed Rafter Pairs + Collar Ties along Main Roof
  for (let rx = -8.4; rx <= 2.6; rx += 1.8) {
    s.push(
      { x1: rx, y1: mrEave, z1: mrZ1, x2: rx, y2: mrPeak, z2: mrRidgeZ, layer: 'roof', role: 'detail' },
      { x1: rx, y1: mrEave, z1: mrZ2, x2: rx, y2: mrPeak, z2: mrRidgeZ, layer: 'roof', role: 'detail' },
      // Truss Collar Tie
      { x1: rx, y1: 11.4, z1: -3.8, x2: rx, y2: 11.4, z2: 2.8, layer: 'roof', role: 'detail' }
    );
  }
  // Longitudinal Purlin / Shingle Course Horizontal Lines on Main Front & Back Slope
  [0.35, 0.7].forEach((f) => {
    const py = mrEave + (mrPeak - mrEave) * f;
    const pzFront = mrZ2 + (mrRidgeZ - mrZ2) * f;
    const pzBack = mrZ1 + (mrRidgeZ - mrZ1) * f;
    s.push(
      { x1: mrX1, y1: py, z1: pzFront, x2: mrX2, y2: py, z2: pzFront, layer: 'roof', role: 'detail' },
      { x1: mrX1, y1: py, z1: pzBack, x2: mrX2, y2: py, z2: pzBack, layer: 'roof', role: 'detail' }
    );
  });

  // Porch Shed Roof connecting main wall (y=6.6, z=5.0) to porch overhang beam (y=5.15, z=8.8)
  s.push(
    { x1: -9.4, y1: 6.55, z1: 5.0, x2: 1.9, y2: 6.55, z2: 5.0, layer: 'roof', role: 'primary' },
    { x1: -9.4, y1: 5.15, z1: 8.85, x2: 1.9, y2: 5.15, z2: 8.85, layer: 'roof', role: 'primary', hot: true },
    { x1: -9.4, y1: 6.55, z1: 5.0, x2: -9.4, y2: 5.15, z2: 8.85, layer: 'roof', role: 'primary' },
    { x1: 1.9, y1: 6.55, z1: 5.0, x2: 1.9, y2: 5.15, z2: 8.85, layer: 'roof', role: 'primary' }
  );
  for (let px = -7.8; px <= 1.2; px += 1.5) {
    s.push({ x1: px, y1: 6.55, z1: 5.0, x2: px, y2: 5.15, z2: 8.85, layer: 'roof', role: 'detail' });
  }

  // Right Wing Cross-Gable Roof (ridge running along Z from z=-6.3 to z=5.2 centered at x=7.2)
  const rwX1 = 3.0;
  const rwX2 = 11.8;
  const rwRidgeX = 7.4;
  const rwZ1 = -6.2;
  const rwZ2 = 5.3;
  const rwEave = 5.0;
  const rwPeak = 8.4;

  s.push(
    { x1: rwRidgeX, y1: rwPeak, z1: rwZ1, x2: rwRidgeX, y2: rwPeak, z2: rwZ2, layer: 'roof', role: 'primary', hot: true },
    { x1: rwX1, y1: rwEave, z1: rwZ1, x2: rwX1, y2: rwEave, z2: rwZ2, layer: 'roof', role: 'secondary' },
    { x1: rwX2, y1: rwEave, z1: rwZ1, x2: rwX2, y2: rwEave, z2: rwZ2, layer: 'roof', role: 'primary', hot: true },
    // Front Gable Triangle facing viewer!
    { x1: rwX1, y1: rwEave, z1: rwZ2, x2: rwRidgeX, y2: rwPeak, z2: rwZ2, layer: 'roof', role: 'primary' },
    { x1: rwX2, y1: rwEave, z1: rwZ2, x2: rwRidgeX, y2: rwPeak, z2: rwZ2, layer: 'roof', role: 'primary' },
    { x1: rwX1, y1: rwEave, z1: rwZ2, x2: rwX2, y2: rwEave, z2: rwZ2, layer: 'roof', role: 'primary' },
    // Back Gable Triangle
    { x1: rwX1, y1: rwEave, z1: rwZ1, x2: rwRidgeX, y2: rwPeak, z2: rwZ1, layer: 'roof', role: 'secondary' },
    { x1: rwX2, y1: rwEave, z1: rwZ1, x2: rwRidgeX, y2: rwPeak, z2: rwZ1, layer: 'roof', role: 'secondary' }
  );
  for (let rz = -4.5; rz <= 4.0; rz += 1.7) {
    s.push(
      { x1: rwX1, y1: rwEave, z1: rz, x2: rwRidgeX, y2: rwPeak, z2: rz, layer: 'roof', role: 'detail' },
      { x1: rwX2, y1: rwEave, z1: rz, x2: rwRidgeX, y2: rwPeak, z2: rz, layer: 'roof', role: 'detail' }
    );
  }

  // Architectural Chimney Stack piercing back roof slope
  addBox(s, -6.5, 9.5, -4.6, -5.0, 14.8, -3.1, 'roof', 'primary', true);
  addBox(s, -6.7, 14.5, -4.8, -4.8, 14.95, -2.9, 'roof', 'secondary');

  const callouts: CalloutAnchor[] = [
    { x: -3.0, y: 14.1, z: -0.5, text: '6/12 GABLE · 13\'-6" PEAK', layer: 'roof' },
    { x: -1.5, y: 4.5, z: 5.1, text: 'EXTERIOR ENVELOPE + OPENING DEDUCTIONS', layer: 'envelope' },
    { x: 6.2, y: 0.4, z: 13.0, text: 'COURTYARD PATIO SLAB · 4" BASE', layer: 'foundation' },
    { x: -4.4, y: 2.2, z: 9.2, text: 'COVERED PORCH + 3-RISER STAIRS', layer: 'porch' },
  ];

  return { segments: s, callouts };
}

export default function ArchitecturalHouse3D() {
  const [activeLayer, setActiveLayer] = useState<LayerId>('all');
  const [exploded, setExploded] = useState(false);
  const [autoSpin, setAutoSpin] = useState(true);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const { segments, callouts } = useMemo(() => buildHouseGeometry(), []);
  const activeSpec = useMemo(
    () => LAYER_SPECS.find((l) => l.id === activeLayer) ?? LAYER_SPECS[0],
    [activeLayer]
  );

  const simRef = useRef({
    yaw: -0.62,
    pitch: 0.36,
    targetYaw: -0.62,
    targetPitch: 0.36,
    dragging: false,
    lastX: 0,
    lastY: 0,
    explodeProg: 0,
    targetExplode: 0,
    activeLayer: 'all' as LayerId,
    autoSpin: true,
    inView: true,
    redraw: null as (() => void) | null,
  });

  useEffect(() => {
    simRef.current.activeLayer = activeLayer;
    simRef.current.redraw?.();
  }, [activeLayer]);

  useEffect(() => {
    simRef.current.targetExplode = exploded ? 1 : 0;
    simRef.current.redraw?.();
  }, [exploded]);

  useEffect(() => {
    simRef.current.autoSpin = autoSpin;
  }, [autoSpin]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container || typeof window === 'undefined') return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reducedMotion) {
      simRef.current.autoSpin = false;
    }

    let width = 960;
    let height = 460;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      width = rect.width;
      height = rect.height;
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();

    let ro: ResizeObserver | null = null;
    if ('ResizeObserver' in window) {
      ro = new ResizeObserver(resize);
      ro.observe(canvas);
    }

    let io: IntersectionObserver | null = null;
    if ('IntersectionObserver' in window) {
      io = new IntersectionObserver(
        (entries) => {
          simRef.current.inView = entries[0]?.isIntersecting ?? true;
        },
        { threshold: 0.05 }
      );
      io.observe(container);
    }

    let rafId = 0;
    let lastTime = performance.now();

    const project = (
      x: number,
      y: number,
      z: number,
      yaw: number,
      pitch: number,
      cx: number,
      cy: number,
      scale: number
    ): [number, number, number] => {
      const cyaw = Math.cos(yaw);
      const syaw = Math.sin(yaw);
      const cpitch = Math.cos(pitch);
      const spitch = Math.sin(pitch);

      // Center model slightly around x=1, y=4.8, z=0.5
      const mx = x - 0.5;
      const my = y - 4.2;
      const mz = z - 0.8;

      const x1 = mx * cyaw - mz * syaw;
      const z1 = mx * syaw + mz * cyaw;
      const y2 = my * cpitch - z1 * spitch;
      const z2 = my * spitch + z1 * cpitch;

      const camDist = 42;
      const depth = Math.max(8, camDist + z2);
      const persp = (camDist / depth) * scale;
      return [cx + x1 * persp, cy - y2 * persp, z2];
    };

    const explodeOffsetY = (layer: Segment3D['layer'], exp: number): number => {
      if (exp <= 0.001) return 0;
      if (layer === 'roof') return exp * 4.4;
      if (layer === 'envelope') return exp * 1.4;
      if (layer === 'porch') return exp * 0.7;
      if (layer === 'foundation') return exp * -1.0;
      return 0;
    };

    const drawFrame = (now: number) => {
      const dt = Math.min(0.05, (now - lastTime) / 1000);
      lastTime = now;

      const st = simRef.current;
      if (!st.inView && !reducedMotion) {
        rafId = requestAnimationFrame(drawFrame);
        return;
      }

      if (st.autoSpin && !st.dragging && !reducedMotion) {
        st.targetYaw += dt * 0.14;
      }

      const damp = reducedMotion ? 1 : Math.min(1, dt * 8.5);
      st.yaw += (st.targetYaw - st.yaw) * damp;
      st.pitch += (st.targetPitch - st.pitch) * damp;
      st.explodeProg += (st.targetExplode - st.explodeProg) * damp;

      ctx.clearRect(0, 0, width, height);

      // Deep Sapphire-Obsidian Architectural Table Backlight
      const cx = width * 0.51;
      const cy = height * (0.55 + st.explodeProg * 0.03);
      const bgGrad = ctx.createRadialGradient(cx, cy + height * 0.04, 16, cx, cy, Math.max(width, height) * 0.68);
      bgGrad.addColorStop(0, 'rgba(21, 78, 134, 0.34)');
      bgGrad.addColorStop(0.45, 'rgba(9, 34, 66, 0.24)');
      bgGrad.addColorStop(1, 'rgba(3, 6, 11, 0)');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      const scale = Math.min(width / (36 + st.explodeProg * 4), height / (22.2 + st.explodeProg * 5.6), 22.5);
      const hotPoints: { x: number; y: number; lime: boolean }[] = [];
      const curLayer = st.activeLayer;

      // Pass 1: Blueprint floor grid & dashed lines (quiet luminous sapphire)
      ctx.lineCap = 'round';
      for (const seg of segments) {
        const yOff = explodeOffsetY(seg.layer, st.explodeProg);
        const [x1, y1] = project(seg.x1, seg.y1 + yOff, seg.z1, st.yaw, st.pitch, cx, cy, scale);
        const [x2, y2] = project(seg.x2, seg.y2 + yOff, seg.z2, st.yaw, st.pitch, cx, cy, scale);

        const isHighlighted = curLayer === 'all' || seg.layer === curLayer;
        const isLimeFocus = curLayer !== 'all' && seg.layer === curLayer;

        // Radial edge fade so outer drafting sheet melts cleanly into black borders
        const midX = (x1 + x2) * 0.5 - cx;
        const midY = (y1 + y2) * 0.5 - cy;
        const distNorm = Math.min(1, Math.hypot(midX / (width * 0.55), midY / (height * 0.6)));
        const radialFade = seg.layer === 'grid' ? Math.max(0.06, 1 - distNorm * 0.92) : Math.max(0.42, 1 - distNorm * 0.48);

        if (seg.layer === 'grid') {
          ctx.setLineDash(seg.role === 'dashed' ? [4, 4] : []);
          const baseAlpha = seg.role === 'detail' ? 0.16 : seg.role === 'secondary' ? 0.36 : 0.45;
          ctx.strokeStyle = `rgba(72, 152, 224, ${(baseAlpha * radialFade).toFixed(3)})`;
          ctx.lineWidth = seg.role === 'detail' ? 0.7 : 1;
          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
          ctx.stroke();
          continue;
        }

        ctx.setLineDash([]);
        const dimMultiplier = isHighlighted ? 1 : 0.2;

        // Soft additive cyan halo on primary structural lines
        if (seg.role === 'primary' && isHighlighted) {
          ctx.strokeStyle = isLimeFocus
            ? `rgba(198, 243, 106, ${(0.24 * radialFade).toFixed(3)})`
            : `rgba(56, 189, 248, ${(0.25 * radialFade).toFixed(3)})`;
          ctx.lineWidth = 3.2;
          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
          ctx.stroke();
        }

        const coreAlpha =
          (seg.role === 'primary' ? 0.88 : seg.role === 'secondary' ? 0.58 : 0.34) *
          dimMultiplier *
          radialFade;
        if (coreAlpha < 0.03) continue;

        ctx.strokeStyle = isLimeFocus
          ? `rgba(205, 248, 122, ${coreAlpha.toFixed(3)})`
          : seg.role === 'primary'
          ? `rgba(222, 244, 255, ${coreAlpha.toFixed(3)})`
          : `rgba(116, 186, 244, ${coreAlpha.toFixed(3)})`;
        ctx.lineWidth = seg.role === 'primary' ? 1.15 : 0.75;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();

        if (seg.hot && isHighlighted) {
          hotPoints.push({ x: x1, y: y1, lime: isLimeFocus });
          hotPoints.push({ x: x2, y: y2, lime: isLimeFocus });
        }
      }

      // Pass 2: Corner Luminous CAD Specular Flares (signature holographic pinpoints)
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < hotPoints.length; i += 2) {
        const pt = hotPoints[i];
        const g = ctx.createRadialGradient(pt.x, pt.y, 0.5, pt.x, pt.y, 8);
        if (pt.lime) {
          g.addColorStop(0, 'rgba(225, 255, 165, 0.75)');
          g.addColorStop(1, 'rgba(198, 243, 106, 0)');
        } else {
          g.addColorStop(0, 'rgba(210, 242, 255, 0.65)');
          g.addColorStop(1, 'rgba(56, 189, 248, 0)');
        }
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, 8, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();

      // Pass 3: Isolated Subsystem Callout Annotation (keeps Full Residence view unobstructed)
      if (curLayer !== 'all') {
        ctx.font = '600 9.5px "JetBrains Mono", monospace';
        ctx.textBaseline = 'middle';
        for (const c of callouts) {
          if (curLayer !== c.layer) continue;
          const yOff = explodeOffsetY(c.layer, st.explodeProg);
          const [px, py] = project(c.x, c.y + yOff, c.z, st.yaw, st.pitch, cx, cy, scale);
          if (px < 70 || px > width - 70 || py < 32 || py > height - 24) continue;

          const w = ctx.measureText(c.text).width + 12;
          const rx = px - w * 0.5;
          const ry = py - 9;
          ctx.fillStyle = 'rgba(4, 9, 16, 0.88)';
          ctx.fillRect(rx, ry, w, 18);
          ctx.strokeStyle = 'rgba(198, 243, 106, 0.82)';
          ctx.lineWidth = 1;
          ctx.strokeRect(rx, ry, w, 18);

          ctx.fillStyle = '#C6F36A';
          ctx.textAlign = 'center';
          ctx.fillText(c.text, px, py);
        }
      }

      if (!reducedMotion) {
        rafId = requestAnimationFrame(drawFrame);
      }
    };

    simRef.current.redraw = () => {
      if (reducedMotion) {
        requestAnimationFrame(drawFrame);
      }
    };
    rafId = requestAnimationFrame(drawFrame);
    return () => {
      cancelAnimationFrame(rafId);
      simRef.current.redraw = null;
      ro?.disconnect();
      io?.disconnect();
    };
  }, [segments, callouts]);

  return (
    <section class="mb-14" aria-labelledby="residence-3d-heading">
      <div class="bm-instrument-rim overflow-hidden bg-[#04070D]">
        {/* Top Telemetry & Camera Control Bar */}
        <div class="px-5 py-3.5 border-b border-graphite-700/80 bg-[#050910]/90 flex flex-wrap items-center justify-between gap-3">
          <div class="flex items-center gap-2.5">
            <span class="h-2 w-2 rounded-full bg-lime-500 animate-pulse shrink-0"></span>
            <div>
              <span class="font-mono text-[10px] uppercase tracking-wider text-[#6FA3D2] block leading-none">
                00 // INTERACTIVE 3D RESIDENCE BLUEPRINT
              </span>
              <h2 id="residence-3d-heading" class="text-sm sm:text-base font-bold text-[#F8F8F5] tracking-tight mt-0.5">
                Full-House Structural CAD Explorer
              </h2>
            </div>
          </div>

          <div class="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setExploded((v) => !v)}
              aria-pressed={exploded}
              class={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded font-mono text-[11px] font-semibold border transition-colors ${
                exploded
                  ? 'bg-lime-500 text-graphite-900 border-lime-500'
                  : 'bg-[#09121F] text-[#D2D6DC] border-graphite-700 hover:border-[#6FA3D2]'
              }`}
            >
              <LucideIcon name="layers" size={13} />
              <span>{exploded ? 'Assembled View' : 'Explode Assemblies'}</span>
            </button>

            <button
              type="button"
              onClick={() => setAutoSpin((v) => !v)}
              aria-pressed={autoSpin}
              class="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded font-mono text-[11px] font-medium bg-[#09121F] text-[#9BA1AA] hover:text-[#F8F8F5] border border-graphite-700 transition-colors"
            >
              <LucideIcon name={autoSpin ? 'compass' : 'rotate-ccw'} size={13} />
              <span>{autoSpin ? 'Pause Orbit' : 'Auto Orbit'}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                simRef.current.targetYaw = -0.62;
                simRef.current.targetPitch = 0.36;
                setExploded(false);
                setActiveLayer('all');
              }}
              class="inline-flex items-center gap-1 px-2.5 py-1.5 rounded font-mono text-[11px] font-medium bg-[#09121F] text-[#9BA1AA] hover:text-[#6FA3D2] border border-graphite-700 transition-colors"
            >
              Reset View
            </button>
          </div>
        </div>

        {/* Interactive 3D CAD Stage */}
        <div
          ref={containerRef}
          class="bm-corner-ticks relative bg-[#03060B] select-none cursor-grab active:cursor-grabbing"
          onPointerDown={(e) => {
            simRef.current.dragging = true;
            simRef.current.lastX = e.clientX;
            simRef.current.lastY = e.clientY;
            e.currentTarget.setPointerCapture(e.pointerId);
          }}
          onPointerMove={(e) => {
            if (!simRef.current.dragging) return;
            const dx = e.clientX - simRef.current.lastX;
            const dy = e.clientY - simRef.current.lastY;
            simRef.current.lastX = e.clientX;
            simRef.current.lastY = e.clientY;
            simRef.current.targetYaw += dx * 0.009;
            simRef.current.targetPitch = Math.max(0.08, Math.min(1.05, simRef.current.targetPitch + dy * 0.007));
          }}
          onPointerUp={(e) => {
            simRef.current.dragging = false;
            try {
              e.currentTarget.releasePointerCapture(e.pointerId);
            } catch {}
          }}
          onPointerCancel={() => {
            simRef.current.dragging = false;
          }}
        >
          <span class="pointer-events-none absolute top-3 left-3.5 font-mono text-[10px] uppercase tracking-wider text-[#7DD3FC]/85">
            DRAG TO ORBIT 360° · SELECT TRADE LAYER BELOW
          </span>

          <canvas
            ref={canvasRef}
            data-house-blueprint-canvas
            class="w-full h-[300px] sm:h-[380px] lg:h-[430px] block"
            aria-label="Interactive 3D holographic wireframe CAD model of a 2-story residential house showing foundation, porch, walls, and gabled rafters"
          />
        </div>

        {/* Bottom Subsystem Filter Dock + Direct Calculator Portal */}
        <div class="border-t border-graphite-700/80 bg-[#060B13]/95 px-4 sm:px-6 py-4 space-y-3">
          <div class="flex flex-wrap gap-1.5" role="tablist" aria-label="Isolate residential structural system">
            {LAYER_SPECS.map((spec) => {
              const active = spec.id === activeLayer;
              return (
                <button
                  key={spec.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setActiveLayer(spec.id)}
                  class={`px-3 py-1.5 rounded font-mono text-[11px] transition-colors ${
                    active
                      ? 'bg-lime-500 text-graphite-900 font-bold'
                      : 'bg-[#0A1320] text-[#9BA1AA] border border-graphite-700 hover:text-[#F8F8F5] hover:border-[#6FA3D2]/60'
                  }`}
                >
                  {spec.code} · {spec.label}
                </button>
              );
            })}
          </div>

          <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pt-1">
            <div class="space-y-0.5 max-w-2xl">
              <span class="font-mono text-[10px] uppercase tracking-wider text-[#6FA3D2] block">
                {activeSpec.specBadge}
              </span>
              <p class="text-xs sm:text-sm text-[#D2D6DC] leading-relaxed">
                {activeSpec.summary}
              </p>
            </div>

            <div class="flex flex-wrap items-center gap-2 shrink-0">
              {activeSpec.links.map((lk) => (
                <a
                  href={lk.href}
                  class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#0C1828] hover:bg-lime-500 hover:text-graphite-900 text-[#F8F8F5] border border-graphite-700 hover:border-lime-500 font-mono text-[11px] font-semibold transition-colors"
                >
                  <span>{lk.label}</span>
                  <LucideIcon name="arrow-up-right" size={12} />
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
