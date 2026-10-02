// SPC: control chart constants, Xbar-R / Xbar-s limits, Western Electric rules, shift detection.
import { mean, sdS, range } from '../stats/desc.ts';
import { normCdf } from '../stats/dist.ts';

export interface Const { n: number; A2: number; A3: number; d2: number; D3: number; D4: number; B3: number; B4: number; c4: number }

// Standard (AIAG / Montgomery) table, 3-4 decimals, as used in the course.
const RAW: number[][] = [
  [2, 1.88, 2.659, 1.128, 0, 3.267, 0, 3.267, 0.7979],
  [3, 1.023, 1.954, 1.693, 0, 2.574, 0, 2.568, 0.8862],
  [4, 0.729, 1.628, 2.059, 0, 2.282, 0, 2.266, 0.9213],
  [5, 0.577, 1.427, 2.326, 0, 2.114, 0, 2.089, 0.94],
  [6, 0.483, 1.287, 2.534, 0, 2.004, 0.03, 1.97, 0.9515],
  [7, 0.419, 1.182, 2.704, 0.076, 1.924, 0.118, 1.882, 0.9594],
  [8, 0.373, 1.099, 2.847, 0.136, 1.864, 0.185, 1.815, 0.965],
  [9, 0.337, 1.032, 2.97, 0.184, 1.816, 0.239, 1.761, 0.9693],
  [10, 0.308, 0.975, 3.078, 0.223, 1.777, 0.284, 1.716, 0.9727],
  [11, 0.285, 0.927, 3.173, 0.256, 1.744, 0.321, 1.679, 0.9754],
  [12, 0.266, 0.886, 3.258, 0.283, 1.717, 0.354, 1.646, 0.9776],
  [13, 0.249, 0.85, 3.336, 0.307, 1.693, 0.382, 1.618, 0.9794],
  [14, 0.235, 0.817, 3.407, 0.328, 1.672, 0.406, 1.594, 0.981],
  [15, 0.223, 0.789, 3.472, 0.347, 1.653, 0.428, 1.572, 0.9823],
  [16, 0.212, 0.763, 3.532, 0.363, 1.637, 0.448, 1.552, 0.9835],
  [17, 0.203, 0.739, 3.588, 0.378, 1.622, 0.466, 1.534, 0.9845],
  [18, 0.194, 0.718, 3.64, 0.391, 1.608, 0.482, 1.518, 0.9854],
  [19, 0.187, 0.698, 3.689, 0.403, 1.597, 0.497, 1.503, 0.9862],
  [20, 0.18, 0.68, 3.735, 0.415, 1.585, 0.51, 1.49, 0.9869],
  [21, 0.173, 0.663, 3.778, 0.425, 1.575, 0.523, 1.477, 0.9876],
  [22, 0.167, 0.647, 3.819, 0.434, 1.566, 0.534, 1.466, 0.9882],
  [23, 0.162, 0.633, 3.858, 0.443, 1.557, 0.545, 1.455, 0.9887],
  [24, 0.157, 0.619, 3.895, 0.451, 1.548, 0.555, 1.445, 0.9892],
  [25, 0.153, 0.606, 3.931, 0.459, 1.541, 0.565, 1.435, 0.9896],
];
export const CONSTANTS: Const[] = RAW.map(([n, A2, A3, d2, D3, D4, B3, B4, c4]) => ({ n, A2, A3, d2, D3, D4, B3, B4, c4 }));
export function constFor(n: number): Const {
  const c = CONSTANTS.find((k) => k.n === n);
  if (!c) throw new Error(`Subgroepgrootte n = ${n} niet ondersteund (2 tot 25).`);
  return c;
}

export interface Limits { CL: number; UCL: number; LCL: number }
export interface ChartOut {
  n: number;
  k: number;
  xbars: number[];
  disp: number[]; // ranges or s
  Xbarbar: number;
  dispBar: number;
  xLim: Limits;
  dLim: Limits;
  sigmaHat: number;
  kind: 'R' | 's';
  c: Const;
}

export function chartFromStats(xbars: number[], disp: number[], n: number, kind: 'R' | 's', excluded: Set<number> = new Set()): ChartOut {
  const c = constFor(n);
  const keep = xbars.map((_, i) => i).filter((i) => !excluded.has(i));
  if (keep.length < 2) throw new Error('Minstens 2 subgroepen nodig.');
  const X = mean(keep.map((i) => xbars[i]));
  const Db = mean(keep.map((i) => disp[i]));
  let xLim: Limits;
  let dLim: Limits;
  let sigmaHat: number;
  if (kind === 'R') {
    xLim = { CL: X, UCL: X + c.A2 * Db, LCL: X - c.A2 * Db };
    dLim = { CL: Db, UCL: c.D4 * Db, LCL: c.D3 * Db };
    sigmaHat = Db / c.d2;
  } else {
    xLim = { CL: X, UCL: X + c.A3 * Db, LCL: X - c.A3 * Db };
    dLim = { CL: Db, UCL: c.B4 * Db, LCL: c.B3 * Db };
    sigmaHat = Db / c.c4;
  }
  return { n, k: keep.length, xbars, disp, Xbarbar: X, dispBar: Db, xLim, dLim, sigmaHat, kind, c };
}

export function chartFromData(rows: number[][], kind: 'R' | 's', excluded: Set<number> = new Set()): ChartOut {
  const clean = rows.filter((r) => r.length > 0);
  const n = clean[0]?.length ?? 0;
  if (clean.some((r) => r.length !== n)) throw new Error('Alle subgroepen moeten even groot zijn (zelfde aantal waarden per rij).');
  if (n < 2) throw new Error('Subgroepgrootte moet minstens 2 zijn.');
  const xbars = clean.map(mean);
  const disp = clean.map(kind === 'R' ? range : sdS);
  return chartFromStats(xbars, disp, n, kind, excluded);
}

export interface RuleHit { index: number; rule: number; text: string }

/** Western Electric rules 1-4 on a series with centre line and sigma of the plotted statistic. */
export function westernElectric(x: number[], CL: number, sig: number): RuleHit[] {
  const hits: RuleHit[] = [];
  const z = x.map((v) => (v - CL) / sig);
  z.forEach((v, i) => {
    if (Math.abs(v) > 3) hits.push({ index: i, rule: 1, text: 'Regel 1: punt buiten 3 sigma' });
  });
  for (let i = 2; i < z.length; i++) {
    for (const s of [1, -1]) {
      const w = [z[i - 2], z[i - 1], z[i]];
      if (w.filter((v) => s * v > 2).length >= 2 && s * z[i] > 2) hits.push({ index: i, rule: 2, text: 'Regel 2: 2 van 3 opeenvolgende punten voorbij 2 sigma (zelfde kant)' });
    }
  }
  for (let i = 4; i < z.length; i++) {
    for (const s of [1, -1]) {
      const w = z.slice(i - 4, i + 1);
      if (w.filter((v) => s * v > 1).length >= 4 && s * z[i] > 1) hits.push({ index: i, rule: 3, text: 'Regel 3: 4 van 5 opeenvolgende punten voorbij 1 sigma (zelfde kant)' });
    }
  }
  for (let i = 7; i < z.length; i++) {
    for (const s of [1, -1]) {
      const w = z.slice(i - 7, i + 1);
      if (w.every((v) => s * v > 0)) hits.push({ index: i, rule: 4, text: 'Regel 4: 8 opeenvolgende punten aan dezelfde kant van de centrale lijn' });
    }
  }
  return hits;
}

/** Limits for a new subgroup size n' given sigma-hat (exercise 4). */
export function limitsForN(Xbarbar: number, sigmaHat: number, n2: number) {
  const c = constFor(n2);
  const Rbar2 = c.d2 * sigmaHat;
  return {
    c,
    xLim: { CL: Xbarbar, UCL: Xbarbar + (3 * sigmaHat) / Math.sqrt(n2), LCL: Xbarbar - (3 * sigmaHat) / Math.sqrt(n2) },
    rLim: { CL: Rbar2, UCL: c.D4 * Rbar2, LCL: c.D3 * Rbar2 },
  };
}

/** beta = P(no signal on next subgroup) for a k-sigma mean shift with L-sigma limits. */
export function shiftDetection(k: number, n: number, L = 3) {
  const s = k * Math.sqrt(n);
  const beta = normCdf(L - s) - normCdf(-L - s);
  return { beta, pDetect: 1 - beta, ARL: 1 / (1 - beta) };
}

/** Individuals and moving range chart. */
export function imr(x: number[]) {
  if (x.length < 3) throw new Error('Minstens 3 waarden nodig voor een I-MR kaart.');
  const mr = x.slice(1).map((v, i) => Math.abs(v - x[i]));
  const MRbar = mean(mr);
  const X = mean(x);
  const sigma = MRbar / 1.128;
  return { x, mr, X, MRbar, sigma, iLim: { CL: X, UCL: X + 3 * sigma, LCL: X - 3 * sigma }, mrLim: { CL: MRbar, UCL: 3.267 * MRbar, LCL: 0 } };
}
