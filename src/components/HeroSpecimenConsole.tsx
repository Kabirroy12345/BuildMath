import { useState, useEffect, useRef, useMemo } from 'preact/hooks';
import LucideIcon from './LucideIcon';
import { calculateConcreteSlab } from '../lib/formulas/concrete-slab-calculator';
import { calculateRoofing } from '../lib/formulas/roofing-calculator';
import { calculateFlooring } from '../lib/formulas/flooring-calculator';
import { calculatePaint } from '../lib/formulas/paint-calculator';

export interface HeroSpecimenItem {
  id: 'concrete' | 'roofing' | 'flooring' | 'painting';
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
  normalizedRatio: number;
  dimTop: string;
  dimSide: string;
  calloutBadge: string;
}

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
  lineWidth = 1.4
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

function drawPartialLine(
  ctx: CanvasRenderingContext2D,
  a: [number, number],
  b: [number, number],
  frac: number,
  color: string,
  width = 1.4,
  dashed = false
) {
  if (frac <= 0) return;
  const f = Math.min(1, Math.max(0, frac));
  const ex = a[0] + (b[0] - a[0]) * f;
  const ey = a[1] + (b[1] - a[1]) * f;
  ctx.save();
  if (dashed) ctx.setLineDash([4, 3]);
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.beginPath();
  ctx.moveTo(a[0], a[1]);
  ctx.lineTo(ex, ey);
  ctx.stroke();
  ctx.restore();
}

function drawCalloutTag(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  label: string,
  alpha: number,
  accent = false
) {
  if (alpha <= 0.05) return;
  ctx.save();
  ctx.globalAlpha = Math.min(1, alpha);
  ctx.font = '600 9.5px "JetBrains Mono", monospace';
  const tw = ctx.measureText(label).width;
  const padX = 6;
  const bw = tw + padX * 2;
  const bh = 17;
  const rx = x - bw * 0.5;
  const ry = y - bh * 0.5;

  ctx.fillStyle = accent ? 'rgba(198, 243, 106, 0.14)' : 'rgba(16, 18, 21, 0.9)';
  ctx.strokeStyle = accent ? 'rgba(198, 243, 106, 0.75)' : 'rgba(111, 163, 210, 0.65)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.roundRect(rx, ry, bw, bh, 3);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = accent ? '#C6F36A' : '#F8F8F5';
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'center';
  ctx.fillText(label, x, y + 0.5);
  ctx.restore();
}

export default function HeroSpecimenConsole({ specimens }: HeroSpecimenConsoleProps) {
  const [activeIdx, setActiveIdx] = useState(0);
  const [paused, setPaused] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Interactive per-trade parameter defaults matching calculators.json
  const [slabThickIn, setSlabThickIn] = useState(4);
  const [roofPitch, setRoofPitch] = useState(6);
  const [floorLenFt, setFloorLenFt] = useState(15);
  const [paintCoats, setPaintCoats] = useState(2);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const pointerTarget = useRef({ x: 0, y: 0, hover: false });
  const simState = useRef({
    camX: 0,
    camY: 0,
    assembleProg: 0, // Progressive blueprint assembly 0 -> 1 on load & switch!
    paramLerp: 0,
    modeId: 'concrete' as HeroSpecimenItem['id'],
    paramRatio: 0,
    dimTop: '12 FT × 10 FT',
    dimSide: '4" SLAB',
    calloutBadge: '+10% WASTE',
  });

  const baseSpec = specimens[activeIdx] || specimens[0];

  useEffect(() => {
    if (typeof window === 'undefined' || specimens.length <= 1) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (paused) return;

    const timer = window.setInterval(() => {
      setActiveIdx((prev) => (prev + 1) % specimens.length);
    }, 6800);
    return () => window.clearInterval(timer);
  }, [paused, specimens.length]);

  const live = useMemo<LiveComputedView>(() => {
    const id = baseSpec?.id || 'concrete';

    if (id === 'concrete') {
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
        primaryValue: slabThickIn === 4 && baseSpec ? baseSpec.primaryValue : `${res.primaryResult.value} yd³`,
        primaryMeta: slabThickIn === 4 && baseSpec ? baseSpec.primaryMeta : `Net ${res.primaryResult.exactValue} yd³ · ${truckVal} truck`,
        secondaryValue: slabThickIn === 4 && baseSpec ? baseSpec.secondaryValue : `${bags80} × 80-lb`,
        secondaryMeta: slabThickIn === 4 && baseSpec ? baseSpec.secondaryMeta : `Or ${bags60} × 60-lb · $${res.costEstimate.typical.toFixed(2)}`,
        dimensionsLabel: `12 ft × 10 ft × ${slabThickIn} in + 10% waste → ${res.primaryResult.value} yd³`,
        copySummary: `BuildMath Concrete Slab (12×10 ft × ${slabThickIn} in, 10% waste): ${res.primaryResult.value} cu yd OR ${bags80} × 80-lb bags ($${res.costEstimate.typical.toFixed(2)})`,
        paramLabel: 'Slab Thickness',
        paramValueDisplay: `${slabThickIn}"`,
        min: 3.5,
        max: 8,
        step: 0.5,
        currentParam: slabThickIn,
        normalizedRatio: (slabThickIn - 3.5) / 4.5,
        dimTop: '12 FT × 10 FT',
        dimSide: `${slabThickIn}" THICK`,
        calloutBadge: `${res.primaryResult.value} YD³ · +10% WASTE`,
      };
    }

    if (id === 'roofing') {
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
        primaryValue: roofPitch === 6 && baseSpec ? baseSpec.primaryValue : `${res.primaryResult.value} bundles`,
        primaryMeta: roofPitch === 6 && baseSpec ? baseSpec.primaryMeta : `${res.secondaryResults[0]?.value} sq · ${res.secondaryResults[1]?.value} sq ft`,
        secondaryValue: roofPitch === 6 && baseSpec ? baseSpec.secondaryValue : `$${Math.round(res.costEstimate.typical).toLocaleString()}`,
        secondaryMeta: 'Shingles, felt, edge & cap',
        dimensionsLabel: `50×40 ft footprint · ${roofPitch}/12 pitch + 10% waste`,
        copySummary: `BuildMath Roofing (50×40 ft, ${roofPitch}/12 pitch): ${res.primaryResult.value} bundles (${res.secondaryResults[0]?.value} sq, $${Math.round(res.costEstimate.typical).toLocaleString()})`,
        paramLabel: 'Gable Pitch',
        paramValueDisplay: `${roofPitch}/12`,
        min: 3,
        max: 12,
        step: 1,
        currentParam: roofPitch,
        normalizedRatio: (roofPitch - 3) / 9,
        dimTop: '50 FT RIDGE',
        dimSide: `${roofPitch}/12 PITCH`,
        calloutBadge: `${res.primaryResult.value} BUNDLES`,
      };
    }

    if (id === 'flooring') {
      const res = calculateFlooring({
        roomLength: floorLenFt,
        roomWidth: 12,
        secondAreaLength: 0,
        secondAreaWidth: 0,
        sqFtPerBox: 20,
        wastePercent: 10,
        underlaymentRollSqFt: 100,
        pricePerSqFt: 3.49,
        underlaymentPricePerRoll: 45,
      });
      return {
        primaryValue: floorLenFt === 15 && baseSpec ? baseSpec.primaryValue : `${res.primaryResult.value} boxes`,
        primaryMeta: floorLenFt === 15 && baseSpec ? baseSpec.primaryMeta : `${res.secondaryResults[0]?.value} sq ft w/ 10% waste`,
        secondaryValue: floorLenFt === 15 && baseSpec ? baseSpec.secondaryValue : `$${Math.round(res.costEstimate.typical).toLocaleString()}`,
        secondaryMeta: `${res.secondaryResults[3]?.value ?? 2} underlayment rolls`,
        dimensionsLabel: `${floorLenFt}×12 ft room · 20 sq ft/box + 10% waste`,
        copySummary: `BuildMath Flooring (${floorLenFt}×12 ft, 10% waste): ${res.primaryResult.value} boxes (${res.secondaryResults[0]?.value} sq ft, $${Math.round(res.costEstimate.typical).toLocaleString()})`,
        paramLabel: 'Room Length',
        paramValueDisplay: `${floorLenFt} ft`,
        min: 10,
        max: 24,
        step: 1,
        currentParam: floorLenFt,
        normalizedRatio: (floorLenFt - 10) / 14,
        dimTop: `${floorLenFt} FT LENGTH`,
        dimSide: '12 FT WIDE',
        calloutBadge: `${res.primaryResult.value} BOXES · +10% CUTS`,
      };
    }

    // 04 Painting
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
      primaryValue: paintCoats === 2 && baseSpec ? baseSpec.primaryValue : `${res.primaryResult.value} ${res.primaryResult.unit}`,
      primaryMeta: paintCoats === 2 && baseSpec ? baseSpec.primaryMeta : `Exact: ${res.primaryResult.exactValue} gal · 5% waste`,
      secondaryValue: `${res.secondaryResults[0]?.value ?? 312} sq ft`,
      secondaryMeta: `Est. $${Math.round(res.costEstimate.typical)} (incl. supplies)`,
      dimensionsLabel: `12×12×8 ft · 2 doors & windows excluded · ${paintCoats} ${paintCoats === 1 ? 'coat' : 'coats'}`,
      copySummary: `BuildMath Interior Paint (12×12×8 ft, ${paintCoats} coats): ${res.primaryResult.value} gallons ($${Math.round(res.costEstimate.typical)})`,
      paramLabel: 'Finish Coats',
      paramValueDisplay: `${paintCoats} ${paintCoats === 1 ? 'coat' : 'coats'}`,
      min: 1,
      max: 3,
      step: 1,
      currentParam: paintCoats,
      normalizedRatio: (paintCoats - 1) / 2,
      dimTop: '12×12×8 FT ROOM',
      dimSide: '-72 SF OPENINGS',
      calloutBadge: `${res.primaryResult.value} GAL (${paintCoats} COATS)`,
    };
  }, [baseSpec, slabThickIn, roofPitch, floorLenFt, paintCoats]);

  useEffect(() => {
    if (simState.current.modeId !== baseSpec.id) {
      simState.current.assembleProg = 0; // Retrigger progressive drafting assembly!
      simState.current.modeId = baseSpec.id;
    }
    simState.current.paramRatio = live.normalizedRatio;
    simState.current.dimTop = live.dimTop;
    simState.current.dimSide = live.dimSide;
    simState.current.calloutBadge = live.calloutBadge;
  }, [baseSpec.id, live]);

  // 60fps Progressive Architectural Blueprint Assembly + Interactive 3D CAD Physics
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || typeof window === 'undefined') return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reducedMotion) simState.current.assembleProg = 1;

    let width = 340;
    let height = 166;

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

      // Smooth damped camera tracking & progressive blueprint assembly progress
      const idleX = reducedMotion || pointerTarget.current.hover ? 0 : Math.sin(t * 0.75) * 0.14;
      const idleY = reducedMotion || pointerTarget.current.hover ? 0 : Math.cos(t * 0.6) * 0.07;
      const tx = pointerTarget.current.hover ? pointerTarget.current.x : idleX;
      const ty = pointerTarget.current.hover ? pointerTarget.current.y : idleY;

      s.camX += (tx - s.camX) * (reducedMotion ? 1 : 0.14);
      s.camY += (ty - s.camY) * (reducedMotion ? 1 : 0.14);
      s.paramLerp += (s.paramRatio - s.paramLerp) * (reducedMotion ? 1 : 0.16);
      s.assembleProg = reducedMotion ? 1 : Math.min(1, s.assembleProg + 0.022);

      // Four distinct construction assembly stages
      const outlineFrac = Math.min(1, s.assembleProg / 0.34);
      const fillFrac = Math.min(1, Math.max(0, (s.assembleProg - 0.24) / 0.38));
      const dimFrac = Math.min(1, Math.max(0, (s.assembleProg - 0.52) / 0.3));
      const tagAlpha = Math.min(1, Math.max(0, (s.assembleProg - 0.72) / 0.28));

      ctx.clearRect(0, 0, width, height);

      // Animated blueprint coordinate grid fading subtly outward from center
      const gridAlpha = 0.08 * Math.min(1, outlineFrac * 1.4);
      ctx.strokeStyle = `rgba(111, 163, 210, ${gridAlpha.toFixed(3)})`;
      ctx.lineWidth = 1;
      const gStep = 24;
      const gxOff = s.camX * -8;
      const gyOff = s.camY * -6;
      for (let gx = (gxOff % gStep + gStep) % gStep; gx < width; gx += gStep) {
        ctx.beginPath();
        ctx.moveTo(gx, 0);
        ctx.lineTo(gx, height);
        ctx.stroke();
      }
      for (let gy = (gyOff % gStep + gStep) % gStep; gy < height; gy += gStep) {
        ctx.beginPath();
        ctx.moveTo(0, gy);
        ctx.lineTo(width, gy);
        ctx.stroke();
      }

      const cx = width * 0.5;
      const cy = height * 0.51;
      const yaw = 0.62 + s.camX * 0.22;
      const pitch = 0.44 + s.camY * 0.14;
      const unitScale = Math.min(width / 340, 1.08);
      const topTagAnchor: [number, number] = [Math.max(58, width * 0.19), height - 16];
      const sideTagAnchor: [number, number] = [width - 54, 20];
      const badgeAnchor: [number, number] = [Math.min(width - 78, width * 0.79), height - 16];

      if (s.modeId === 'concrete') {
        const hw = 74 * unitScale;
        const hd = 52 * unitScale;
        const baseH = (12 + s.paramLerp * 18) * unitScale;
        const curH = baseH * fillFrac;
        const topY = -curH * 0.5;
        const botY = curH * 0.5;

        // Dashed +10% waste margin perimeter bounding the slab
        const wPad = 10 * unitScale;
        const w0 = isoProject(-hw - wPad, botY, -hd - wPad, yaw, pitch, cx, cy, 1);
        const w1 = isoProject(hw + wPad, botY, -hd - wPad, yaw, pitch, cx, cy, 1);
        const w2 = isoProject(hw + wPad, botY, hd + wPad, yaw, pitch, cx, cy, 1);
        const w3 = isoProject(-hw - wPad, botY, hd + wPad, yaw, pitch, cx, cy, 1);
        drawPartialLine(ctx, w0, w1, dimFrac, 'rgba(198, 243, 106, 0.4)', 1, true);
        drawPartialLine(ctx, w1, w2, dimFrac, 'rgba(198, 243, 106, 0.4)', 1, true);
        drawPartialLine(ctx, w2, w3, dimFrac, 'rgba(198, 243, 106, 0.4)', 1, true);
        drawPartialLine(ctx, w3, w0, dimFrac, 'rgba(198, 243, 106, 0.4)', 1, true);

        const p0 = isoProject(-hw, topY, -hd, yaw, pitch, cx, cy, 1);
        const p1 = isoProject(hw, topY, -hd, yaw, pitch, cx, cy, 1);
        const p2 = isoProject(hw, topY, hd, yaw, pitch, cx, cy, 1);
        const p3 = isoProject(-hw, topY, hd, yaw, pitch, cx, cy, 1);

        const b1 = isoProject(hw, botY, -hd, yaw, pitch, cx, cy, 1);
        const b2 = isoProject(hw, botY, hd, yaw, pitch, cx, cy, 1);
        const b3 = isoProject(-hw, botY, hd, yaw, pitch, cx, cy, 1);

        if (fillFrac > 0.05) {
          ctx.save();
          ctx.globalAlpha = fillFrac;
          drawPolygon(ctx, [p3, p2, b2, b3], 'rgba(71, 121, 168, 0.24)', 'rgba(111, 163, 210, 0.6)', 1);
          drawPolygon(ctx, [p2, p1, b1, b2], 'rgba(198, 243, 106, 0.22)', 'rgba(198, 243, 106, 0.65)', 1);
          drawPolygon(ctx, [p0, p1, p2, p3], 'rgba(71, 121, 168, 0.22)', 'transparent', 0);
          ctx.restore();
        }

        // Edge-by-edge blueprint outline tracing
        drawPartialLine(ctx, p0, p1, outlineFrac * 2, '#6FA3D2', 1.65);
        drawPartialLine(ctx, p1, p2, outlineFrac * 2 - 0.35, '#6FA3D2', 1.65);
        drawPartialLine(ctx, p2, p3, outlineFrac * 2 - 0.7, '#6FA3D2', 1.65);
        drawPartialLine(ctx, p3, p0, outlineFrac * 2 - 1.0, '#6FA3D2', 1.65);

        // Animated dimension leader callouts
        const extStart = isoProject(hw + wPad, topY, -hd - wPad, yaw, pitch, cx, cy, 1);
        const extEnd: [number, number] = [sideTagAnchor[0], sideTagAnchor[1] + 9];
        drawPartialLine(ctx, extStart, extEnd, dimFrac, '#C6F36A', 1.1);
      } else if (s.modeId === 'roofing') {
        const gl = 68 * unitScale;
        const gw = 48 * unitScale;
        const pitchVal = 3 + s.paramLerp * 9;
        const ridgeH = ((pitchVal / 12) * gw) * 0.85 * Math.max(0.25, fillFrac);
        const baseY = 24 * unitScale;

        const rFront = isoProject(-gl, baseY - ridgeH, 0, yaw, pitch, cx, cy, 1);
        const rBack = isoProject(gl, baseY - ridgeH, 0, yaw, pitch, cx, cy, 1);
        const eFL = isoProject(-gl, baseY, -gw, yaw, pitch, cx, cy, 1);
        const eFR = isoProject(-gl, baseY, gw, yaw, pitch, cx, cy, 1);
        const eBL = isoProject(gl, baseY, -gw, yaw, pitch, cx, cy, 1);
        const eBR = isoProject(gl, baseY, gw, yaw, pitch, cx, cy, 1);

        if (fillFrac > 0.05) {
          ctx.save();
          ctx.globalAlpha = fillFrac;
          drawPolygon(ctx, [rFront, rBack, eBL, eFL], 'rgba(71, 121, 168, 0.14)', 'rgba(111, 163, 210, 0.5)', 1.2);
          drawPolygon(ctx, [eFL, rFront, eFR], 'rgba(16, 18, 21, 0.82)', 'transparent', 0);
          drawPolygon(ctx, [rFront, rBack, eBR, eFR], 'rgba(71, 121, 168, 0.25)', 'transparent', 0);
          // Progressive shingle courses across front slope
          for (let c = 1; c <= 4; c++) {
            const f = c / 5;
            const ca = isoProject(-gl, baseY - ridgeH * f, gw * (1 - f), yaw, pitch, cx, cy, 1);
            const cb = isoProject(gl, baseY - ridgeH * f, gw * (1 - f), yaw, pitch, cx, cy, 1);
            drawPartialLine(ctx, ca, cb, dimFrac, c === 3 ? '#C6F36A' : 'rgba(111, 163, 210, 0.45)', c === 3 ? 1.4 : 1);
          }
          ctx.restore();
        }

        drawPartialLine(ctx, eFR, rFront, outlineFrac * 2, '#6FA3D2', 1.7);
        drawPartialLine(ctx, rFront, eFL, outlineFrac * 2 - 0.3, '#6FA3D2', 1.7);
        drawPartialLine(ctx, rFront, rBack, outlineFrac * 2 - 0.5, '#C6F36A', 2);
        drawPartialLine(ctx, eFR, eBR, outlineFrac * 2 - 0.7, '#6FA3D2', 1.5);
        drawPartialLine(ctx, rBack, eBR, outlineFrac * 2 - 0.9, '#6FA3D2', 1.5);
      } else if (s.modeId === 'flooring') {
        // 3D Architectural Floor Plan with Progressive Tile/Plank Rows + Waste Cut Allowance Strip
        const rw = (64 + s.paramLerp * 34) * unitScale;
        const rd = 50 * unitScale;
        const fy = 12 * unitScale;

        const c0 = isoProject(-rw, fy, -rd, yaw, pitch * 1.15, cx, cy, 1);
        const c1 = isoProject(rw, fy, -rd, yaw, pitch * 1.15, cx, cy, 1);
        const c2 = isoProject(rw, fy, rd, yaw, pitch * 1.15, cx, cy, 1);
        const c3 = isoProject(-rw, fy, rd, yaw, pitch * 1.15, cx, cy, 1);

        if (fillFrac > 0.05) {
          ctx.save();
          ctx.globalAlpha = fillFrac;
          drawPolygon(ctx, [c0, c1, c2, c3], 'rgba(71, 121, 168, 0.14)', 'transparent', 0);

          // Highlight rightmost 10% strip as Waste Cut Allowance band
          const wX = rw * 0.8;
          const ws0 = isoProject(wX, fy, -rd, yaw, pitch * 1.15, cx, cy, 1);
          const ws3 = isoProject(wX, fy, rd, yaw, pitch * 1.15, cx, cy, 1);
          drawPolygon(ctx, [ws0, c1, c2, ws3], 'rgba(198, 243, 106, 0.18)', 'rgba(198, 243, 106, 0.55)', 1);

          // Progressive plank grid rows assembling left-to-right
          const rows = 4;
          const cols = 5;
          const totalTiles = rows * cols;
          const visibleTiles = totalTiles * fillFrac;
          for (let r = 0; r < rows; r++) {
            const zA = -rd + (r * (rd * 2)) / rows;
            const zB = -rd + ((r + 1) * (rd * 2)) / rows;
            for (let col = 0; col < cols; col++) {
              const tIdx = r * cols + col;
              if (tIdx > visibleTiles) continue;
              const xA = -rw + (col * (rw + wX)) / cols;
              const xB = -rw + ((col + 1) * (rw + wX)) / cols;
              const t0 = isoProject(xA, fy, zA, yaw, pitch * 1.15, cx, cy, 1);
              const t1 = isoProject(xB, fy, zA, yaw, pitch * 1.15, cx, cy, 1);
              const t2 = isoProject(xB, fy, zB, yaw, pitch * 1.15, cx, cy, 1);
              const t3 = isoProject(xA, fy, zB, yaw, pitch * 1.15, cx, cy, 1);
              drawPolygon(ctx, [t0, t1, t2, t3], 'rgba(111, 163, 210, 0.1)', 'rgba(111, 163, 210, 0.45)', 0.9);
            }
          }
          ctx.restore();
        }

        drawPartialLine(ctx, c0, c1, outlineFrac * 2, '#6FA3D2', 1.7);
        drawPartialLine(ctx, c1, c2, outlineFrac * 2 - 0.3, '#C6F36A', 1.7);
        drawPartialLine(ctx, c2, c3, outlineFrac * 2 - 0.6, '#6FA3D2', 1.7);
        drawPartialLine(ctx, c3, c0, outlineFrac * 2 - 0.9, '#6FA3D2', 1.7);
      } else {
        // 04 Painting: 3D Room Corner Walls Filling Coat-by-Coat w/ Excluded Door & Window Openings
        const rw = 66 * unitScale;
        const rd = 54 * unitScale;
        const rh = 46 * unitScale;
        const yBot = 26 * unitScale;
        const yTop = yBot - rh;

        const wBL = isoProject(-rw, yBot, -rd, yaw, pitch, cx, cy, 1);
        const wBC = isoProject(rw * 0.22, yBot, -rd, yaw, pitch, cx, cy, 1);
        const wBR = isoProject(rw * 0.22, yBot, rd, yaw, pitch, cx, cy, 1);
        const wTL = isoProject(-rw, yTop, -rd, yaw, pitch, cx, cy, 1);
        const wTC = isoProject(rw * 0.22, yTop, -rd, yaw, pitch, cx, cy, 1);
        const wTR = isoProject(rw * 0.22, yTop, rd, yaw, pitch, cx, cy, 1);

        if (fillFrac > 0.05) {
          ctx.save();
          ctx.globalAlpha = fillFrac;
          drawPolygon(ctx, [wTL, wTC, wBC, wBL], 'rgba(71, 121, 168, 0.14)', 'transparent', 0);
          drawPolygon(ctx, [wTC, wTR, wBR, wBC], 'rgba(71, 121, 168, 0.1)', 'transparent', 0);

          const coatFill = Math.min(1, (0.35 + s.paramLerp * 0.65) * fillFrac);
          const yCoat = yBot - rh * coatFill;
          const cTL = isoProject(-rw, yCoat, -rd, yaw, pitch, cx, cy, 1);
          const cTC = isoProject(rw * 0.22, yCoat, -rd, yaw, pitch, cx, cy, 1);
          const cTR = isoProject(rw * 0.22, yCoat, rd, yaw, pitch, cx, cy, 1);

          drawPolygon(ctx, [cTL, cTC, wBC, wBL], 'rgba(198, 243, 106, 0.22)', '#C6F36A', 1.1);
          drawPolygon(ctx, [cTC, cTR, wBR, wBC], 'rgba(198, 243, 106, 0.14)', '#C6F36A', 1.1);

          // Excluded Door & Window Cutouts
          const d1 = isoProject(-rw * 0.72, yBot - rh * 0.72, -rd, yaw, pitch, cx, cy, 1);
          const d2 = isoProject(-rw * 0.42, yBot - rh * 0.72, -rd, yaw, pitch, cx, cy, 1);
          const d3 = isoProject(-rw * 0.42, yBot, -rd, yaw, pitch, cx, cy, 1);
          const d4 = isoProject(-rw * 0.72, yBot, -rd, yaw, pitch, cx, cy, 1);
          drawPolygon(ctx, [d1, d2, d3, d4], '#101215', '#C6F36A', 1.2);

          const win1 = isoProject(rw * 0.22, yTop + rh * 0.24, -rd * 0.36, yaw, pitch, cx, cy, 1);
          const win2 = isoProject(rw * 0.22, yTop + rh * 0.24, rd * 0.36, yaw, pitch, cx, cy, 1);
          const win3 = isoProject(rw * 0.22, yTop + rh * 0.62, rd * 0.36, yaw, pitch, cx, cy, 1);
          const win4 = isoProject(rw * 0.22, yTop + rh * 0.62, -rd * 0.36, yaw, pitch, cx, cy, 1);
          drawPolygon(ctx, [win1, win2, win3, win4], '#101215', '#C6F36A', 1.2);
          ctx.restore();
        }

        drawPartialLine(ctx, wTL, wTC, outlineFrac * 2, '#6FA3D2', 1.65);
        drawPartialLine(ctx, wTC, wTR, outlineFrac * 2 - 0.3, '#6FA3D2', 1.65);
        drawPartialLine(ctx, wBL, wBC, outlineFrac * 2 - 0.5, '#6FA3D2', 1.65);
        drawPartialLine(ctx, wBC, wBR, outlineFrac * 2 - 0.7, '#6FA3D2', 1.65);
        drawPartialLine(ctx, wTL, wBL, outlineFrac * 2 - 0.9, '#6FA3D2', 1.65);
        drawPartialLine(ctx, wTC, wBC, outlineFrac * 2 - 1.0, '#C6F36A', 1.4);
      }

      const isLimeSide = s.modeId === 'concrete' || s.modeId === 'roofing';
      drawCalloutTag(ctx, topTagAnchor[0], topTagAnchor[1], s.dimTop, tagAlpha, false);
      drawCalloutTag(ctx, sideTagAnchor[0], sideTagAnchor[1], s.dimSide, tagAlpha, isLimeSide);
      drawCalloutTag(ctx, badgeAnchor[0], badgeAnchor[1], s.calloutBadge, tagAlpha, true);

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
    if (baseSpec.id === 'concrete') setSlabThickIn(val);
    else if (baseSpec.id === 'roofing') setRoofPitch(val);
    else if (baseSpec.id === 'flooring') setFloorLenFt(val);
    else setPaintCoats(val);
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
      {/* Top Blueprint Telemetry Header + 4-Discipline Selector */}
      <div class="px-4 py-3 border-b border-graphite-700 bg-graphite-950/75 space-y-2.5">
        <div class="flex items-center justify-between gap-2">
          <span class="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-wider text-[#D2D6DC]">
            <span class="h-1.5 w-1.5 rounded-full bg-lime-500"></span>
            <span>
              {String(activeIdx + 1).padStart(2, '0')} / {String(specimens.length).padStart(2, '0')} · {baseSpec.eyebrow}
            </span>
          </span>
          <span class="font-mono text-[10px] text-[#6FA3D2] shrink-0">{baseSpec.standardTag}</span>
        </div>

        <div class="grid grid-cols-4 gap-1.5" role="tablist" aria-label="Select architectural blueprint specimen">
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
                <span class={`inline-block w-1.5 h-1.5 rounded-full mr-1 ${active ? 'bg-lime-500' : 'bg-graphite-700'}`}></span>
                {item.tabLabel}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Progressive Blueprint CAD Canvas + Interactive Parameter Scrubber */}
      <div class="p-4 sm:p-5 space-y-3.5">
        <div
          class="bm-corner-ticks relative rounded bg-graphite-950 border border-graphite-700 overflow-hidden cursor-crosshair"
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
            BLUEPRINT ASSEMBLY<span class="hidden sm:inline"> · ORBIT CURSOR</span>
          </span>
          <canvas
            ref={canvasRef}
            class="w-full h-[156px] block"
            aria-label={`Progressive 3D engineering blueprint for ${baseSpec.eyebrow}`}
          />
          <div class="px-3 py-1.5 border-t border-graphite-700/70 bg-graphite-800/80 flex items-center justify-between gap-3">
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
          <div class="p-3 rounded bg-graphite-950 border border-graphite-700">
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

          <div class="p-3 rounded bg-graphite-950 border border-graphite-700">
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

        {/* Copyable BOM Spec Strip + Direct Instrument Link */}
        <div class="p-2.5 rounded bg-graphite-950 border border-graphite-700 flex items-center justify-between gap-2">
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
