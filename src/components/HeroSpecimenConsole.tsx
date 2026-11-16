import { useState, useEffect, useRef, useMemo } from 'preact/hooks';
import LucideIcon from './LucideIcon';
import { calculateConcreteSlab } from '../lib/formulas/concrete-slab-calculator';
import { calculatePaint } from '../lib/formulas/paint-calculator';
import { calculateRoofing } from '../lib/formulas/roofing-calculator';
import { calculateDrywall } from '../lib/formulas/drywall-calculator';

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

interface LiveComputedView {
  primaryValue: string;
  primaryMeta: string;
  secondaryValue: string;
  secondaryMeta: string;
  dimensionsLabel: string;
  copySummary: string;
  paramLabel: string;
  paramValueDisplay: string;
  min: number;
  max: number;
  step: number;
  currentParam: number;
  normalizedRatio: number; // 0..1 for 3D canvas spring morph
}

// 3D Isometric projection helper
function isoProject(
  x: number,
  y: number,
  z: number,
  yaw: number,
  pitch: number,
  cx: number,
  cy: number,
  scale: number
): [number, number] {
  const cosY = Math.cos(yaw);
  const sinY = Math.sin(yaw);
  const cosP = Math.cos(pitch);
  const sinP = Math.sin(pitch);

  const rx = x * cosY - z * sinY;
  const rz = x * sinY + z * cosY;
  const ry = y * cosP - rz * sinP;

  return [cx + rx * scale, cy - ry * scale];
}

function drawPolygon(
  ctx: CanvasRenderingContext2D,
  pts: [number, number][],
  fill: string,
  stroke: string,
  lineWidth = 1.5
) {
  if (!pts.length) return;
  ctx.beginPath();
  ctx.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
  ctx.closePath();
  if (fill) {
    ctx.fillStyle = fill;
    ctx.fill();
  }
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = lineWidth;
    ctx.stroke();
  }
}

export default function HeroSpecimenConsole({ specimens }: HeroSpecimenConsoleProps) {
  const [activeIdx, setActiveIdx] = useState(0);
  const [paused, setPaused] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Real-time interactive parameters per specimen (defaults match calculators.json!)
  const [slabThickIn, setSlabThickIn] = useState(4);
  const [paintCoats, setPaintCoats] = useState(2);
  const [roofPitch, setRoofPitch] = useState(6);
  const [drywallLenFt, setDrywallLenFt] = useState(12);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const pointerTarget = useRef({ x: 0, y: 0, hover: false });
  const simState = useRef({
    camX: 0,
    camY: 0,
    enterProg: 1,
    paramLerp: 0,
    modeId: 'slab' as HeroSpecimenItem['id'],
    paramRatio: 0,
    rawParam: 4,
  });

  const baseSpec = specimens[activeIdx] || specimens[0];

  // Auto-advance between tabs calmly unless user interacts or prefers reduced motion
  useEffect(() => {
    if (typeof window === 'undefined' || specimens.length <= 1) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (paused) return;

    const timer = window.setInterval(() => {
      setActiveIdx((prev) => (prev + 1) % specimens.length);
    }, 6400);
    return () => window.clearInterval(timer);
  }, [paused, specimens.length]);

  // Real-time deterministic calculation powered directly by BuildMath formulas
  const live = useMemo<LiveComputedView>(() => {
    const id = baseSpec?.id || 'slab';

    if (id === 'slab') {
      if (slabThickIn === 4 && baseSpec) {
        return {
          primaryValue: baseSpec.primaryValue,
          primaryMeta: baseSpec.primaryMeta,
          secondaryValue: baseSpec.secondaryValue,
          secondaryMeta: baseSpec.secondaryMeta,
          dimensionsLabel: baseSpec.dimensionsLabel,
          copySummary: baseSpec.copySummary,
          paramLabel: 'Slab Thickness',
          paramValueDisplay: `${slabThickIn}"`,
          min: 3.5,
          max: 8,
          step: 0.5,
          currentParam: slabThickIn,
          normalizedRatio: (slabThickIn - 3.5) / 4.5,
        };
      }
      const res = calculateConcreteSlab({
        lengthFeet: 12,
        widthFeet: 10,
        thicknessInches: slabThickIn,
        bagSizeLbs: 80,
        wastePercent: 10,
        pricePerBag: 6.85,
        readyMixPricePerCuYd: 165,
      });
      const bags80 = Number(res.secondaryResults[0]?.value ?? 74);
      const bags60 = Number(res.secondaryResults[1]?.value ?? 98);
      const truckVal = res.secondaryResults[4]?.value || '$268.95';
      return {
        primaryValue: `${res.primaryResult.value} yd³`,
        primaryMeta: `Net ${res.primaryResult.exactValue} yd³ · ${truckVal} truck`,
        secondaryValue: `${bags80} × 80-lb`,
        secondaryMeta: `Or ${bags60} × 60-lb · Est. $${res.costEstimate.typical.toFixed(2)}`,
        dimensionsLabel: `12 ft × 10 ft × ${slabThickIn} in + 10% waste → ${res.primaryResult.value} yd³`,
        copySummary: `BuildMath Concrete Slab (12×10 ft × ${slabThickIn} in, 10% waste): ${res.primaryResult.value} cu yd OR ${bags80} × 80-lb bags ($${res.costEstimate.typical.toFixed(2)})`,
        paramLabel: 'Slab Thickness',
        paramValueDisplay: `${slabThickIn}"`,
        min: 3.5,
        max: 8,
        step: 0.5,
        currentParam: slabThickIn,
        normalizedRatio: (slabThickIn - 3.5) / 4.5,
      };
    }

    if (id === 'paint') {
      if (paintCoats === 2 && baseSpec) {
        return {
          primaryValue: baseSpec.primaryValue,
          primaryMeta: baseSpec.primaryMeta,
          secondaryValue: baseSpec.secondaryValue,
          secondaryMeta: baseSpec.secondaryMeta,
          dimensionsLabel: baseSpec.dimensionsLabel,
          copySummary: baseSpec.copySummary,
          paramLabel: 'Finish Coats',
          paramValueDisplay: `${paintCoats} coats`,
          min: 1,
          max: 3,
          step: 1,
          currentParam: paintCoats,
          normalizedRatio: (paintCoats - 1) / 2,
        };
      }
      const res = calculatePaint({
        roomLength: 12,
        roomWidth: 12,
        wallHeight: 8,
        doors: 2,
        windows: 2,
        includeCeiling: false,
        coats: paintCoats,
        includePrimer: false,
        coveragePerGallon: 350,
        primerCoveragePerGallon: 250,
        wastePercent: 5,
        pricePerGallon: 42,
        primerPricePerGallon: 28,
      });
      return {
        primaryValue: `${res.primaryResult.value} ${res.primaryResult.unit}`,
        primaryMeta: `Exact: ${res.primaryResult.exactValue} gal · 5% waste`,
        secondaryValue: `${res.secondaryResults[0]?.value ?? 312} sq ft`,
        secondaryMeta: `Est. $${Math.round(res.costEstimate.typical)} (incl. roller kit)`,
        dimensionsLabel: `12×12×8 ft · 2 doors, 2 windows · ${paintCoats} ${paintCoats === 1 ? 'coat' : 'coats'}`,
        copySummary: `BuildMath Interior Paint (12×12×8 ft, ${paintCoats} coats): ${res.primaryResult.value} gallons ($${Math.round(res.costEstimate.typical)} incl. kit)`,
        paramLabel: 'Finish Coats',
        paramValueDisplay: `${paintCoats} ${paintCoats === 1 ? 'coat' : 'coats'}`,
        min: 1,
        max: 3,
        step: 1,
        currentParam: paintCoats,
        normalizedRatio: (paintCoats - 1) / 2,
      };
    }

    if (id === 'roof') {
      if (roofPitch === 6 && baseSpec) {
        return {
          primaryValue: baseSpec.primaryValue,
          primaryMeta: baseSpec.primaryMeta,
          secondaryValue: baseSpec.secondaryValue,
          secondaryMeta: baseSpec.secondaryMeta,
          dimensionsLabel: baseSpec.dimensionsLabel,
          copySummary: baseSpec.copySummary,
          paramLabel: 'Gable Pitch',
          paramValueDisplay: `${roofPitch}/12`,
          min: 3,
          max: 12,
          step: 1,
          currentParam: roofPitch,
          normalizedRatio: (roofPitch - 3) / 9,
        };
      }
      const res = calculateRoofing({
        footprintLengthFeet: 50,
        footprintWidthFeet: 40,
        pitchRise: roofPitch,
        bundlesPerSquare: 3,
        ridgeLengthFeet: 50,
        wastePercent: 10,
        pricePerBundle: 42,
        underlaymentRollSqFt: 1000,
      });
      return {
        primaryValue: `${res.primaryResult.value} bundles`,
        primaryMeta: `${res.secondaryResults[0]?.value} sq · ${res.secondaryResults[1]?.value} sq ft slope`,
        secondaryValue: `$${Math.round(res.costEstimate.typical).toLocaleString()}`,
        secondaryMeta: 'Shingles, felt, edge & cap',
        dimensionsLabel: `50×40 ft footprint · ${roofPitch}/12 pitch + 10% waste`,
        copySummary: `BuildMath Roofing (50×40 ft, ${roofPitch}/12 pitch): ${res.primaryResult.value} bundles (${res.secondaryResults[0]?.value} squares, Est. $${Math.round(res.costEstimate.typical).toLocaleString()})`,
        paramLabel: 'Gable Pitch',
        paramValueDisplay: `${roofPitch}/12`,
        min: 3,
        max: 12,
        step: 1,
        currentParam: roofPitch,
        normalizedRatio: (roofPitch - 3) / 9,
      };
    }

    // Drywall
    if (drywallLenFt === 12 && baseSpec) {
      return {
        primaryValue: baseSpec.primaryValue,
        primaryMeta: baseSpec.primaryMeta,
        secondaryValue: baseSpec.secondaryValue,
        secondaryMeta: baseSpec.secondaryMeta,
        dimensionsLabel: baseSpec.dimensionsLabel,
        copySummary: baseSpec.copySummary,
        paramLabel: 'Room Length',
        paramValueDisplay: `${drywallLenFt} ft`,
        min: 10,
        max: 24,
        step: 2,
        currentParam: drywallLenFt,
        normalizedRatio: (drywallLenFt - 10) / 14,
      };
    }
    const res = calculateDrywall({
      roomLengthFeet: drywallLenFt,
      roomWidthFeet: 12,
      wallHeightFeet: 8,
      includeCeiling: true,
      doors: 2,
      windows: 2,
      sheetLengthFeet: 8,
      wastePercent: 10,
      compoundGallonsPer100SqFt: 1.125,
      screwsPerSheet: 32,
      pricePerSheet: 15.8,
    });
    return {
      primaryValue: `${res.primaryResult.value} sheets`,
      primaryMeta: `${res.secondaryResults[0]?.value} sq ft · ${res.materials[1]?.quantity ?? 2} mud pails`,
      secondaryValue: `${res.secondaryResults[3]?.value ?? 512} screws`,
      secondaryMeta: `1 roll tape · Est. $${res.costEstimate.typical.toFixed(2)}`,
      dimensionsLabel: `${drywallLenFt}×12×8 ft + ceiling · 10% waste`,
      copySummary: `BuildMath Drywall (${drywallLenFt}×12×8 ft + ceiling): ${res.primaryResult.value} sheets, ${res.secondaryResults[3]?.value} screws ($${res.costEstimate.typical.toFixed(2)})`,
      paramLabel: 'Room Length',
      paramValueDisplay: `${drywallLenFt} ft`,
      min: 10,
      max: 24,
      step: 2,
      currentParam: drywallLenFt,
      normalizedRatio: (drywallLenFt - 10) / 14,
    };
  }, [baseSpec, slabThickIn, paintCoats, roofPitch, drywallLenFt]);

  // Sync target simulation parameters whenever mode or slider updates
  useEffect(() => {
    if (simState.current.modeId !== baseSpec.id) {
      simState.current.enterProg = 0;
      simState.current.modeId = baseSpec.id;
    }
    simState.current.paramRatio = live.normalizedRatio;
    simState.current.rawParam = live.currentParam;
  }, [baseSpec.id, live.normalizedRatio, live.currentParam]);

  // 60fps Interactive 3D CAD Physics Canvas Loop (rive.app interactive vector engine feel)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || typeof window === 'undefined') return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let width = 320;
    let height = 148;

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

    let rafId = 0;
    const start = performance.now();

    const drawFrame = (now: number) => {
      const t = (now - start) / 1000;
      const s = simState.current;

      // Damped spring interpolation on pointer orbit, mode entry, and slider geometry
      const idleOrbitX = reducedMotion || pointerTarget.current.hover ? 0 : Math.sin(t * 0.9) * 0.16;
      const idleOrbitY = reducedMotion || pointerTarget.current.hover ? 0 : Math.cos(t * 0.7) * 0.08;
      const tx = pointerTarget.current.hover ? pointerTarget.current.x : idleOrbitX;
      const ty = pointerTarget.current.hover ? pointerTarget.current.y : idleOrbitY;

      s.camX += (tx - s.camX) * (reducedMotion ? 1 : 0.14);
      s.camY += (ty - s.camY) * (reducedMotion ? 1 : 0.14);
      s.enterProg += (1 - s.enterProg) * (reducedMotion ? 1 : 0.12);
      s.paramLerp += (s.paramRatio - s.paramLerp) * (reducedMotion ? 1 : 0.16);

      ctx.clearRect(0, 0, width, height);

      // Subtle animated CAD grid aligned with pointer parallax
      const gxOff = s.camX * -8;
      const gyOff = s.camY * -6;
      ctx.strokeStyle = 'rgba(111, 163, 210, 0.075)';
      ctx.lineWidth = 1;
      const step = 22;
      for (let gx = (gxOff % step + step) % step; gx < width; gx += step) {
        ctx.beginPath();
        ctx.moveTo(gx, 0);
        ctx.lineTo(gx, height);
        ctx.stroke();
      }
      for (let gy = (gyOff % step + step) % step; gy < height; gy += step) {
        ctx.beginPath();
        ctx.moveTo(0, gy);
        ctx.lineTo(width, gy);
        ctx.stroke();
      }

      const cx = width * 0.5;
      const cy = height * 0.56;
      const yaw = 0.62 + s.camX * 0.24;
      const pitch = 0.44 + s.camY * 0.14;
      const unitScale = Math.min(width / 320, 1.12);

      if (s.modeId === 'slab') {
        const hw = 74 * unitScale;
        const hd = 52 * unitScale;
        const baseH = (12 + s.paramLerp * 18) * unitScale;
        const curH = Math.max(2, baseH * s.enterProg);
        const topY = -curH * 0.5;
        const botY = curH * 0.5;

        const p0 = isoProject(-hw, topY, -hd, yaw, pitch, cx, cy, 1);
        const p1 = isoProject(hw, topY, -hd, yaw, pitch, cx, cy, 1);
        const p2 = isoProject(hw, topY, hd, yaw, pitch, cx, cy, 1);
        const p3 = isoProject(-hw, topY, hd, yaw, pitch, cx, cy, 1);

        const b1 = isoProject(hw, botY, -hd, yaw, pitch, cx, cy, 1);
        const b2 = isoProject(hw, botY, hd, yaw, pitch, cx, cy, 1);
        const b3 = isoProject(-hw, botY, hd, yaw, pitch, cx, cy, 1);

        // Front & side extrusions
        drawPolygon(ctx, [p3, p2, b2, b3], 'rgba(71, 121, 168, 0.22)', '#6FA3D2', 1.4);
        drawPolygon(ctx, [p2, p1, b1, b2], 'rgba(198, 243, 106, 0.2)', '#C6F36A', 1.4);
        drawPolygon(ctx, [p0, p1, p2, p3], 'rgba(111, 163, 210, 0.24)', '#6FA3D2', 1.7);

        // Flowing animated concrete screed wave & rebar mesh across top face
        const sweep = ((t * 0.55) % 1);
        ctx.strokeStyle = 'rgba(198, 243, 106, 0.35)';
        ctx.lineWidth = 1;
        for (let r = -0.6; r <= 0.6; r += 0.4) {
          const rStart = isoProject(-hw * 0.85, topY, hd * r, yaw, pitch, cx, cy, 1);
          const rEnd = isoProject(hw * 0.85, topY, hd * r, yaw, pitch, cx, cy, 1);
          ctx.beginPath();
          ctx.moveTo(rStart[0], rStart[1]);
          ctx.lineTo(rEnd[0], rEnd[1]);
          ctx.stroke();
        }
        const waveX = -hw + sweep * (hw * 2);
        const wA = isoProject(waveX, topY, -hd, yaw, pitch, cx, cy, 1);
        const wB = isoProject(waveX, topY, hd, yaw, pitch, cx, cy, 1);
        ctx.strokeStyle = 'rgba(198, 243, 106, 0.85)';
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.moveTo(wA[0], wA[1]);
        ctx.lineTo(wB[0], wB[1]);
        ctx.stroke();
      } else if (s.modeId === 'paint') {
        // 3D L-corner room elevation with animated rising paint coat level & punched openings
        const rw = 66 * unitScale;
        const rd = 54 * unitScale;
        const rh = 44 * unitScale;
        const yBot = 24 * unitScale;
        const yTop = yBot - rh;

        const wBL = isoProject(-rw, yBot, -rd, yaw, pitch, cx, cy, 1);
        const wBC = isoProject(rw * 0.2, yBot, -rd, yaw, pitch, cx, cy, 1);
        const wBR = isoProject(rw * 0.2, yBot, rd, yaw, pitch, cx, cy, 1);
        const wTL = isoProject(-rw, yTop, -rd, yaw, pitch, cx, cy, 1);
        const wTC = isoProject(rw * 0.2, yTop, -rd, yaw, pitch, cx, cy, 1);
        const wTR = isoProject(rw * 0.2, yTop, rd, yaw, pitch, cx, cy, 1);

        // Back wall + side wall outlines
        drawPolygon(ctx, [wTL, wTC, wBC, wBL], 'rgba(71, 121, 168, 0.14)', '#6FA3D2', 1.5);
        drawPolygon(ctx, [wTC, wTR, wBR, wBC], 'rgba(71, 121, 168, 0.1)', '#6FA3D2', 1.5);

        // Animated paint coat level rising dynamically by coat count (1..3)
        const coatFillRatio = Math.min(1, (0.33 + s.paramLerp * 0.67) * s.enterProg);
        const yCoat = yBot - rh * coatFillRatio;
        const cTL = isoProject(-rw, yCoat, -rd, yaw, pitch, cx, cy, 1);
        const cTC = isoProject(rw * 0.2, yCoat, -rd, yaw, pitch, cx, cy, 1);
        const cTR = isoProject(rw * 0.2, yCoat, rd, yaw, pitch, cx, cy, 1);

        drawPolygon(ctx, [cTL, cTC, wBC, wBL], 'rgba(198, 243, 106, 0.22)', 'rgba(198, 243, 106, 0.7)', 1.2);
        drawPolygon(ctx, [cTC, cTR, wBR, wBC], 'rgba(198, 243, 106, 0.15)', 'rgba(198, 243, 106, 0.65)', 1.2);

        // Deducted door cutout on left wall + window on right wall
        const d1 = isoProject(-rw * 0.72, yBot - rh * 0.74, -rd, yaw, pitch, cx, cy, 1);
        const d2 = isoProject(-rw * 0.42, yBot - rh * 0.74, -rd, yaw, pitch, cx, cy, 1);
        const d3 = isoProject(-rw * 0.42, yBot, -rd, yaw, pitch, cx, cy, 1);
        const d4 = isoProject(-rw * 0.72, yBot, -rd, yaw, pitch, cx, cy, 1);
        drawPolygon(ctx, [d1, d2, d3, d4], '#0D1013', '#C6F36A', 1.2);

        const win1 = isoProject(rw * 0.2, yTop + rh * 0.24, -rd * 0.35, yaw, pitch, cx, cy, 1);
        const win2 = isoProject(rw * 0.2, yTop + rh * 0.24, rd * 0.35, yaw, pitch, cx, cy, 1);
        const win3 = isoProject(rw * 0.2, yTop + rh * 0.62, rd * 0.35, yaw, pitch, cx, cy, 1);
        const win4 = isoProject(rw * 0.2, yTop + rh * 0.62, -rd * 0.35, yaw, pitch, cx, cy, 1);
        drawPolygon(ctx, [win1, win2, win3, win4], '#0D1013', '#C6F36A', 1.2);
      } else if (s.modeId === 'roof') {
        // 3D Pitched Gable Roof dynamically hinging with roofPitch (3/12 .. 12/12)
        const gl = 68 * unitScale;
        const gw = 48 * unitScale;
        const curPitchRise = 3 + s.paramLerp * 9;
        const ridgeH = ((curPitchRise / 12) * gw) * 0.82 * s.enterProg;
        const baseY = 20 * unitScale;

        const rFront = isoProject(-gl, baseY - ridgeH, 0, yaw, pitch, cx, cy, 1);
        const rBack = isoProject(gl, baseY - ridgeH, 0, yaw, pitch, cx, cy, 1);

        const eFL = isoProject(-gl, baseY, -gw, yaw, pitch, cx, cy, 1);
        const eFR = isoProject(-gl, baseY, gw, yaw, pitch, cx, cy, 1);
        const eBL = isoProject(gl, baseY, -gw, yaw, pitch, cx, cy, 1);
        const eBR = isoProject(gl, baseY, gw, yaw, pitch, cx, cy, 1);

        // Far slope, Gable end triangle, Near illuminated slope
        drawPolygon(ctx, [rFront, rBack, eBL, eFL], 'rgba(71, 121, 168, 0.14)', '#6FA3D2', 1.3);
        drawPolygon(ctx, [eFL, rFront, eFR], 'rgba(13, 16, 19, 0.78)', '#6FA3D2', 1.5);
        drawPolygon(ctx, [rFront, rBack, eBR, eFR], 'rgba(71, 121, 168, 0.25)', '#6FA3D2', 1.7);

        // Shingle course contour lines sweeping up/down pitch slope
        const courses = 4;
        for (let c = 1; c < courses; c++) {
          const f = c / courses;
          const ca = isoProject(-gl, baseY - ridgeH * f, gw * (1 - f), yaw, pitch, cx, cy, 1);
          const cb = isoProject(gl, baseY - ridgeH * f, gw * (1 - f), yaw, pitch, cx, cy, 1);
          ctx.strokeStyle = c === 2 ? 'rgba(198, 243, 106, 0.75)' : 'rgba(111, 163, 210, 0.45)';
          ctx.lineWidth = c === 2 ? 1.4 : 1;
          ctx.beginPath();
          ctx.moveTo(ca[0], ca[1]);
          ctx.lineTo(cb[0], cb[1]);
          ctx.stroke();
        }
        // Highlight glowing ridge spine
        ctx.strokeStyle = '#C6F36A';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(rFront[0], rFront[1]);
        ctx.lineTo(rBack[0], rBack[1]);
        ctx.stroke();
      } else {
        // 04 Drywall: Staggered 4x8 panels snapping into 16" OC studs proportionally to roomLength
        const wallSpan = (68 + s.paramLerp * 46) * unitScale;
        const wallH = 54 * unitScale;
        const x0 = -wallSpan * 0.5;
        const yBot = 26 * unitScale;
        const yTop = yBot - wallH;

        // Vertical stud bay background frame
        const f1 = isoProject(x0, yTop, 0, yaw * 0.45, pitch * 0.65, cx, cy, 1);
        const f2 = isoProject(x0 + wallSpan, yTop, 0, yaw * 0.45, pitch * 0.65, cx, cy, 1);
        const f3 = isoProject(x0 + wallSpan, yBot, 0, yaw * 0.45, pitch * 0.65, cx, cy, 1);
        const f4 = isoProject(x0, yBot, 0, yaw * 0.45, pitch * 0.65, cx, cy, 1);
        drawPolygon(ctx, [f1, f2, f3, f4], 'rgba(13, 16, 19, 0.6)', '#282E37', 1.2);

        // Draw 16" OC framing studs
        const studCount = Math.round(5 + s.paramLerp * 4);
        ctx.strokeStyle = 'rgba(111, 163, 210, 0.35)';
        ctx.lineWidth = 1;
        for (let i = 0; i <= studCount; i++) {
          const sx = x0 + (wallSpan * i) / studCount;
          const st = isoProject(sx, yTop, 0, yaw * 0.45, pitch * 0.65, cx, cy, 1);
          const sb = isoProject(sx, yBot, 0, yaw * 0.45, pitch * 0.65, cx, cy, 1);
          ctx.beginPath();
          ctx.moveTo(st[0], st[1]);
          ctx.lineTo(sb[0], sb[1]);
          ctx.stroke();
        }

        // Animated 2 staggered courses of drywall sheets snapping in sequentially
        const panelCols = 3;
        const totalSheets = panelCols * 2;
        const revealCount = Math.max(1, s.enterProg * totalSheets);
        for (let row = 0; row < 2; row++) {
          const py0 = yTop + row * (wallH * 0.5);
          const py1 = py0 + wallH * 0.5;
          for (let col = 0; col < panelCols; col++) {
            const sheetIdx = row * panelCols + col;
            const localProg = Math.min(1, Math.max(0, revealCount - sheetIdx));
            if (localProg <= 0) continue;

            const shiftOffset = row === 1 ? wallSpan / (panelCols * 2) : 0;
            const pxStart = Math.max(x0, x0 + (col * wallSpan) / panelCols - shiftOffset);
            const pxEnd = Math.min(x0 + wallSpan, x0 + ((col + 1) * wallSpan) / panelCols - shiftOffset);
            const yOffset = (1 - localProg) * -10;
            const a = isoProject(pxStart, py0 + yOffset, 2, yaw * 0.45, pitch * 0.65, cx, cy, 1);
            const b = isoProject(pxEnd, py0 + yOffset, 2, yaw * 0.45, pitch * 0.65, cx, cy, 1);
            const c = isoProject(pxEnd, py1 + yOffset, 2, yaw * 0.45, pitch * 0.65, cx, cy, 1);
            const d = isoProject(pxStart, py1 + yOffset, 2, yaw * 0.45, pitch * 0.65, cx, cy, 1);

            const isLimeHighlight = (row + col) % 2 === 1;
            drawPolygon(
              ctx,
              [a, b, c, d],
              isLimeHighlight ? 'rgba(198, 243, 106, 0.16)' : 'rgba(71, 121, 168, 0.2)',
              isLimeHighlight ? '#C6F36A' : '#6FA3D2',
              1.35
            );
          }
        }
      }

      if (!reducedMotion) {
        rafId = requestAnimationFrame(drawFrame);
      }
    };

    rafId = requestAnimationFrame(drawFrame);
    return () => {
      cancelAnimationFrame(rafId);
      ro?.disconnect();
    };
  }, []);

  if (!baseSpec) return null;

  const handleParamChange = (val: number) => {
    setPaused(true);
    if (baseSpec.id === 'slab') setSlabThickIn(val);
    else if (baseSpec.id === 'paint') setPaintCoats(val);
    else if (baseSpec.id === 'roof') setRoofPitch(val);
    else setDrywallLenFt(val);
  };

  const handleCopySpec = async () => {
    try {
      await navigator.clipboard.writeText(live.copySummary);
      setCopiedId(baseSpec.id);
      setPaused(true);
      setTimeout(() => setCopiedId((prev) => (prev === baseSpec.id ? null : prev)), 2000);
    } catch {}
  };

  return (
    <div
      class="lg:col-span-5 bm-instrument-rim overflow-hidden"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => {
        setPaused(false);
        pointerTarget.current.hover = false;
      }}
    >
      {/* Top Specimen Telemetry Header + 4-State Switcher */}
      <div class="px-4 py-3 border-b border-graphite-700 bg-graphite-950/75 space-y-2.5">
        <div class="flex items-center justify-between gap-2">
          <span class="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-wider text-[#D2D6DC]">
            <span class="h-1.5 w-1.5 rounded-full bg-lime-500 animate-pulse"></span>
            <span>
              {String(activeIdx + 1).padStart(2, '0')} / {String(specimens.length).padStart(2, '0')} · {baseSpec.eyebrow}
            </span>
          </span>
          <span class="font-mono text-[10px] text-[#6FA3D2] shrink-0">{baseSpec.standardTag}</span>
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
                    ? 'bg-graphite-800 text-[#F8F8F5] border border-lime-500/60 font-semibold'
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

      {/* Main Interactive 3D Simulation Canvas + Real-Time Parametric Slider */}
      <div class="p-4 sm:p-5 space-y-3.5">
        <div
          class="bm-corner-ticks relative rounded-lg bg-graphite-950 border border-graphite-700 overflow-hidden cursor-crosshair"
          onPointerMove={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const nx = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
            const ny = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
            pointerTarget.current = { x: nx, y: ny, hover: true };
          }}
          onPointerLeave={() => {
            pointerTarget.current.hover = false;
          }}
        >
          <span class="pointer-events-none absolute top-2 left-2.5 font-mono text-[9px] uppercase tracking-wider text-[#6FA3D2]/85">
            INTERACTIVE 3D CAD · MOVE POINTER
          </span>
          <canvas
            ref={canvasRef}
            class="w-full h-[132px] block"
            aria-label={`Interactive 3D architectural model for ${baseSpec.eyebrow}`}
          />
          <div class="px-3 py-1.5 border-t border-graphite-700/70 bg-graphite-900/70 flex items-center justify-between gap-3">
            <label
              for="hero-specimen-slider"
              class="font-mono text-[10px] uppercase tracking-wider text-[#D2D6DC] shrink-0"
            >
              {live.paramLabel}:{' '}
              <strong class="text-lime-500 tabular-nums">{live.paramValueDisplay}</strong>
            </label>
            <input
              id="hero-specimen-slider"
              type="range"
              min={live.min}
              max={live.max}
              step={live.step}
              value={live.currentParam}
              onInput={(e) => handleParamChange(Number((e.target as HTMLInputElement).value))}
              class="bm-range max-w-[140px]"
            />
          </div>
        </div>

        {/* Live Outputs Driven by Real BuildMath Formulas */}
        <div class="grid grid-cols-2 gap-2.5">
          <div class="p-3 rounded-lg bg-graphite-950 border border-graphite-700">
            <span class="font-mono text-[10px] uppercase text-[#9BA1AA] block truncate">
              {baseSpec.primaryLabel}
            </span>
            <strong
              key={`${baseSpec.id}-${live.primaryValue}`}
              class="animate-digit-roll text-xl sm:text-[22px] font-extrabold text-lime-500 tabular-nums mt-0.5 block"
            >
              {live.primaryValue}
            </strong>
            <span class="font-mono text-[10px] text-[#9BA1AA] block truncate mt-0.5">
              {live.primaryMeta}
            </span>
          </div>

          <div class="p-3 rounded-lg bg-graphite-950 border border-graphite-700">
            <span class="font-mono text-[10px] uppercase text-[#9BA1AA] block truncate">
              {baseSpec.secondaryLabel}
            </span>
            <strong
              key={`${baseSpec.id}-sec-${live.secondaryValue}`}
              class="animate-digit-roll text-xl sm:text-[22px] font-extrabold text-[#F8F8F5] tabular-nums mt-0.5 block"
            >
              {live.secondaryValue}
            </strong>
            <span class="font-mono text-[10px] text-[#6FA3D2] block truncate mt-0.5">
              {live.secondaryMeta}
            </span>
          </div>
        </div>

        {/* Copyable CLI/BOM Spec Strip + Magnetic Launch Button */}
        <div class="p-2.5 rounded-lg bg-graphite-950 border border-graphite-700 flex items-center justify-between gap-2">
          <span class="font-mono text-[10px] text-[#D2D6DC] truncate">
            {live.dimensionsLabel}
          </span>
          <button
            type="button"
            onClick={handleCopySpec}
            aria-label={`Copy ${baseSpec.tabLabel} sample specification`}
            class="inline-flex items-center gap-1 px-2 py-1 rounded bg-graphite-800 hover:bg-lime-500 text-[#F8F8F5] hover:text-[#17191C] border border-graphite-700 font-mono text-[10px] font-semibold transition-colors shrink-0"
          >
            <LucideIcon name={copiedId === baseSpec.id ? 'check' : 'copy'} size={11} />
            <span>{copiedId === baseSpec.id ? 'COPIED' : 'COPY SPEC'}</span>
          </button>
        </div>

        <div class="pt-0.5 flex items-center justify-between gap-2 text-xs">
          <span class="font-mono text-[11px] text-[#9BA1AA]">Live formula &amp; geometry preview</span>
          <a
            href={`/calculators/${baseSpec.slug}/`}
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
