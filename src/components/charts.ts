// Hand-rolled SVG charts.
import { fmt } from '../ui/core.ts';

const NS = 'http://www.w3.org/2000/svg';
function s<K extends keyof SVGElementTagNameMap>(tag: K, attrs: Record<string, any> = {}, text?: string) {
  const el = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) if (v !== undefined && v !== null) el.setAttribute(k, String(v));
  if (text !== undefined) el.textContent = text;
  return el;
}

interface Frame { W: number; H: number; L: number; R: number; T: number; B: number; x0: number; x1: number; y0: number; y1: number }
function frame(W: number, H: number, x0: number, x1: number, y0: number, y1: number, pad = { L: 52, R: 16, T: 14, B: 34 }): Frame {
  if (x1 === x0) x1 = x0 + 1;
  if (y1 === y0) y1 = y0 + 1;
  return { W, H, ...pad, x0, x1, y0, y1 };
}
const X = (f: Frame, x: number) => f.L + ((x - f.x0) / (f.x1 - f.x0)) * (f.W - f.L - f.R);
const Y = (f: Frame, y: number) => f.H - f.B - ((y - f.y0) / (f.y1 - f.y0)) * (f.H - f.T - f.B);

function niceTicks(a: number, b: number, n = 6) {
  const span = b - a;
  if (!(span > 0)) return [a];
  const step0 = span / n;
  const mag = Math.pow(10, Math.floor(Math.log10(step0)));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((st) => span / st <= n) ?? 10 * mag;
  const out: number[] = [];
  for (let v = Math.ceil(a / step) * step; v <= b + 1e-9 * span; v += step) out.push(+v.toPrecision(12));
  return out;
}

function svgRoot(f: Frame, title?: string) {
  const svg = s('svg', { viewBox: `0 0 ${f.W} ${f.H}`, class: 'chart', role: 'img' });
  if (title) svg.appendChild(s('title', {}, title));
  return svg;
}
function axes(svg: SVGElement, f: Frame, xl?: string, yl?: string, yTicks = true) {
  const g = s('g', { class: 'axes' });
  for (const t of niceTicks(f.x0, f.x1)) {
    g.appendChild(s('line', { x1: X(f, t), x2: X(f, t), y1: f.H - f.B, y2: f.H - f.B + 4 }));
    g.appendChild(s('text', { x: X(f, t), y: f.H - f.B + 16, 'text-anchor': 'middle' }, fmt(t, 4)));
  }
  if (yTicks)
    for (const t of niceTicks(f.y0, f.y1, 5)) {
      g.appendChild(s('line', { x1: f.L - 4, x2: f.W - f.R, y1: Y(f, t), y2: Y(f, t), class: 'gridline' }));
      g.appendChild(s('text', { x: f.L - 6, y: Y(f, t) + 4, 'text-anchor': 'end' }, fmt(t, 3)));
    }
  g.appendChild(s('line', { x1: f.L, x2: f.W - f.R, y1: f.H - f.B, y2: f.H - f.B }));
  g.appendChild(s('line', { x1: f.L, x2: f.L, y1: f.T, y2: f.H - f.B }));
  if (xl) g.appendChild(s('text', { x: (f.L + f.W - f.R) / 2, y: f.H - 4, 'text-anchor': 'middle', class: 'axlabel' }, xl));
  if (yl) g.appendChild(s('text', { x: 12, y: (f.T + f.H - f.B) / 2, 'text-anchor': 'middle', class: 'axlabel', transform: `rotate(-90 12 ${(f.T + f.H - f.B) / 2})` }, yl));
  svg.appendChild(g);
}
const path = (pts: [number, number][]) => pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(2)},${p[1].toFixed(2)}`).join('');

export interface DensityOpts {
  pdf: (x: number) => number;
  x0: number;
  x1: number;
  shade?: [number, number][]; // intervals to shade
  discrete?: { k0: number; k1: number; shadeK?: (k: number) => boolean };
  vlines?: { x: number; label: string; cls?: string }[];
  xlabel?: string;
}
/** Density (continuous) or pmf (discrete) plot with shaded regions. */
export function densityPlot(o: DensityOpts, W = 640, H = 240): SVGElement {
  let ymax = 0;
  const N = 300;
  const pts: [number, number][] = [];
  if (!o.discrete) {
    for (let i = 0; i <= N; i++) {
      const x = o.x0 + ((o.x1 - o.x0) * i) / N;
      const y = o.pdf(x);
      if (isFinite(y)) ymax = Math.max(ymax, y);
      pts.push([x, y]);
    }
  } else {
    for (let k = o.discrete.k0; k <= o.discrete.k1; k++) ymax = Math.max(ymax, o.pdf(k));
  }
  ymax = ymax > 0 ? ymax * 1.08 : 1;
  const f = frame(W, H, o.x0, o.x1, 0, ymax);
  const svg = svgRoot(f, 'Verdeling');
  axes(svg, f, o.xlabel, undefined, true);
  if (!o.discrete) {
    for (const [a, b] of o.shade ?? []) {
      const lo = Math.max(a, o.x0);
      const hi = Math.min(b, o.x1);
      if (!(hi > lo)) continue;
      const sp: [number, number][] = [[X(f, lo), Y(f, 0)]];
      for (let i = 0; i <= 120; i++) {
        const x = lo + ((hi - lo) * i) / 120;
        sp.push([X(f, x), Y(f, Math.min(o.pdf(x), ymax))]);
      }
      sp.push([X(f, hi), Y(f, 0)]);
      svg.appendChild(s('path', { d: path(sp) + 'Z', class: 'shade' }));
    }
    svg.appendChild(s('path', { d: path(pts.map(([x, y]) => [X(f, x), Y(f, Math.min(y, ymax))])), class: 'curve' }));
  } else {
    const { k0, k1, shadeK } = o.discrete;
    const bw = Math.max(1, Math.min(18, ((f.W - f.L - f.R) / (k1 - k0 + 1)) * 0.7));
    for (let k = k0; k <= k1; k++) {
      const y = o.pdf(k);
      svg.appendChild(s('rect', { x: X(f, k) - bw / 2, y: Y(f, y), width: bw, height: Math.max(0, Y(f, 0) - Y(f, y)), class: shadeK?.(k) ? 'bar on' : 'bar' }));
    }
  }
  for (const v of o.vlines ?? []) {
    if (!(v.x >= o.x0 && v.x <= o.x1)) continue;
    svg.appendChild(s('line', { x1: X(f, v.x), x2: X(f, v.x), y1: f.T, y2: f.H - f.B, class: 'vline ' + (v.cls ?? '') }));
    svg.appendChild(s('text', { x: X(f, v.x) + 3, y: f.T + 10, class: 'vlabel' }, v.label));
  }
  return svg;
}

export interface Series { pts: [number, number][]; cls?: string; label?: string; dots?: boolean; flags?: boolean[]; marker?: 'dot' | 'ring' | 'cross' }
export interface LineOpts {
  series: Series[];
  hlines?: { y: number; label: string; cls?: string }[];
  vlines?: { x: number; label: string; cls?: string }[];
  xlabel?: string;
  ylabel?: string;
  x0?: number;
  x1?: number;
  y0?: number;
  y1?: number;
  bands?: { lo: [number, number][]; hi: [number, number][]; cls?: string }[];
}
export function lineChart(o: LineOpts, W = 640, H = 260): SVGElement {
  const xs = o.series.flatMap((se) => se.pts.map((p) => p[0])).concat((o.vlines ?? []).map((v) => v.x));
  const ys = o.series.flatMap((se) => se.pts.map((p) => p[1])).concat((o.hlines ?? []).map((v) => v.y)).concat((o.bands ?? []).flatMap((b) => [...b.lo, ...b.hi].map((p) => p[1])));
  const fx = xs.filter(isFinite);
  const fy = ys.filter(isFinite);
  let x0 = o.x0 ?? Math.min(...fx);
  let x1 = o.x1 ?? Math.max(...fx);
  let y0 = o.y0 ?? Math.min(...fy);
  let y1 = o.y1 ?? Math.max(...fy);
  const py = (y1 - y0) * 0.08 || 1;
  if (o.y0 === undefined) y0 -= py;
  if (o.y1 === undefined) y1 += py;
  if (o.x0 === undefined && o.x1 === undefined) {
    const px = (x1 - x0) * 0.03 || 1;
    x0 -= px;
    x1 += px;
  }
  const f = frame(W, H, x0, x1, y0, y1, { L: 56, R: 70, T: 14, B: 36 });
  const svg = svgRoot(f);
  axes(svg, f, o.xlabel, o.ylabel);
  for (const b of o.bands ?? []) {
    const d = path(b.lo.map(([x, y]) => [X(f, x), Y(f, y)])) + path([...b.hi].reverse().map(([x, y]) => [X(f, x), Y(f, y)])).replace(/^M/, 'L') + 'Z';
    svg.appendChild(s('path', { d, class: 'band ' + (b.cls ?? '') }));
  }
  for (const hl of o.hlines ?? []) {
    if (!isFinite(hl.y)) continue;
    svg.appendChild(s('line', { x1: f.L, x2: f.W - f.R, y1: Y(f, hl.y), y2: Y(f, hl.y), class: 'hline ' + (hl.cls ?? '') }));
    svg.appendChild(s('text', { x: f.W - f.R + 4, y: Y(f, hl.y) + 4, class: 'hlabel' }, hl.label));
  }
  for (const v of o.vlines ?? []) {
    svg.appendChild(s('line', { x1: X(f, v.x), x2: X(f, v.x), y1: f.T, y2: f.H - f.B, class: 'vline ' + (v.cls ?? '') }));
    svg.appendChild(s('text', { x: X(f, v.x) + 3, y: f.T + 10, class: 'vlabel' }, v.label));
  }
  for (const se of o.series) {
    const pts = se.pts.filter((p) => isFinite(p[0]) && isFinite(p[1]));
    if (!se.dots || se.cls?.includes('connect')) svg.appendChild(s('path', { d: path(pts.map(([x, y]) => [X(f, x), Y(f, y)])), class: 'series ' + (se.cls ?? '') }));
    if (se.dots)
      se.pts.forEach(([x, y], i) => {
        if (!isFinite(x) || !isFinite(y)) return;
        const cx = X(f, x), cy = Y(f, y);
        if (se.marker === 'cross') {
          const d = 5;
          svg.appendChild(s('path', { d: `M${cx - d},${cy - d}L${cx + d},${cy + d}M${cx - d},${cy + d}L${cx + d},${cy - d}`, class: 'xmark ' + (se.cls ?? '') }));
        } else if (se.marker === 'ring') svg.appendChild(s('circle', { cx, cy, r: 5, class: 'ring ' + (se.cls ?? '') }));
        else svg.appendChild(s('circle', { cx, cy, r: 3.6, class: 'dot ' + (se.flags?.[i] ? 'flag ' : '') + (se.cls ?? '') }));
      });
  }
  return svg;
}

/** Control chart: points connected, CL/UCL/LCL, flagged points in red, optional excluded points. */
export function controlChart(values: number[], CL: number, UCL: number, LCL: number, flags: boolean[], label: string, excluded: Set<number> = new Set(), zones = true): SVGElement {
  const pts = values.map((v, i) => [i + 1, v] as [number, number]);
  const sig = (UCL - CL) / 3;
  const hl = [
    { y: UCL, label: 'UCL ' + fmt(UCL), cls: 'ucl' },
    { y: CL, label: 'CL ' + fmt(CL), cls: 'cl' },
    { y: LCL, label: 'LCL ' + fmt(LCL), cls: 'ucl' },
  ];
  if (zones && sig > 0) hl.push({ y: CL + sig, label: '', cls: 'zone' }, { y: CL - sig, label: '', cls: 'zone' }, { y: CL + 2 * sig, label: '', cls: 'zone' }, { y: CL - 2 * sig, label: '', cls: 'zone' });
  const svg = lineChart({ series: [{ pts, cls: 'connect', dots: true, flags: flags.map((fl, i) => fl || excluded.has(i)) }], hlines: hl, xlabel: 'Subgroep', ylabel: label, x0: 0.5, x1: values.length + 0.5 }, 680, 250);
  return svg;
}

export function scatterChart(x: number[], y: number[], extra: Partial<LineOpts> = {}, W = 640, H = 280) {
  return lineChart({ ...extra, series: [{ pts: x.map((v, i) => [v, y[i]] as [number, number]), dots: true }, ...(extra.series ?? [])] }, W, H);
}

export function barChart(labels: string[], values: number[], opts: { refLine?: number; refLabel?: string; ylabel?: string; highlight?: boolean[] } = {}, W = 640, H = 260): SVGElement {
  const vmax = Math.max(...values.map(Math.abs), opts.refLine ?? 0) * 1.1 || 1;
  const f = frame(W, H, 0, labels.length, 0, vmax, { L: 52, R: 16, T: 14, B: 46 });
  const svg = svgRoot(f);
  for (const t of niceTicks(0, vmax, 5)) {
    svg.appendChild(s('line', { x1: f.L, x2: f.W - f.R, y1: Y(f, t), y2: Y(f, t), class: 'gridline' }));
    svg.appendChild(s('text', { x: f.L - 6, y: Y(f, t) + 4, 'text-anchor': 'end', class: 'axes-t' }, fmt(t, 3)));
  }
  const bw = ((f.W - f.L - f.R) / labels.length) * 0.7;
  labels.forEach((l, i) => {
    const v = Math.abs(values[i]);
    const x = X(f, i + 0.5);
    svg.appendChild(s('rect', { x: x - bw / 2, y: Y(f, v), width: bw, height: Y(f, 0) - Y(f, v), class: 'bar' + (opts.highlight?.[i] ? ' on' : '') }));
    svg.appendChild(s('text', { x, y: f.H - f.B + 14, 'text-anchor': 'middle', class: 'axes-t' }, l));
  });
  if (opts.refLine !== undefined) {
    svg.appendChild(s('line', { x1: f.L, x2: f.W - f.R, y1: Y(f, opts.refLine), y2: Y(f, opts.refLine), class: 'hline ucl' }));
    svg.appendChild(s('text', { x: f.W - f.R - 4, y: Y(f, opts.refLine) - 4, 'text-anchor': 'end', class: 'hlabel' }, opts.refLabel ?? ''));
  }
  svg.appendChild(s('line', { x1: f.L, x2: f.W - f.R, y1: f.H - f.B, y2: f.H - f.B, class: 'axisline' }));
  if (opts.ylabel) svg.appendChild(s('text', { x: 12, y: (f.T + f.H - f.B) / 2, 'text-anchor': 'middle', class: 'axlabel', transform: `rotate(-90 12 ${(f.T + f.H - f.B) / 2})` }, opts.ylabel));
  return svg;
}

export function chartBox(...els: (SVGElement | HTMLElement)[]) {
  const d = document.createElement('div');
  d.className = 'chartbox';
  els.forEach((e) => d.appendChild(e));
  return d;
}
