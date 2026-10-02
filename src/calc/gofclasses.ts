// Goodness-of-fit helpers: class probabilities under a hypothesised distribution and merging of small classes.
import { normCdf, poisCdf, poisPmf, poisSf, expCdf, unifCdf } from '../stats/dist.ts';

export type GofDist = 'pois' | 'norm' | 'exp' | 'unif' | 'equal' | 'custom';

/**
 * Poisson: x = consecutive integer counts; first class = P(X <= x0), last class = P(X >= x_last).
 * Continuous (norm/exp/unif): x = upper class bounds; first class open below, last class open above.
 */
export function classProbs(dist: GofDist, x: number[], par: { lam?: number; mu?: number; sd?: number; a?: number; b?: number; p?: number[] }): number[] {
  const m = x.length;
  if (dist === 'equal') return x.map(() => 1 / m);
  if (dist === 'custom') {
    const p = par.p!;
    const s = p.reduce((a, b) => a + b, 0);
    return p.map((v) => v / s);
  }
  if (dist === 'pois') {
    const lam = par.lam!;
    return x.map((k, i) => (i === m - 1 ? (k <= 0 ? 1 : poisSf(k - 1, lam)) : i === 0 ? poisCdf(k, lam) : poisPmf(k, lam)));
  }
  const F = (v: number) => (dist === 'norm' ? normCdf(v, par.mu!, par.sd!) : dist === 'exp' ? expCdf(v, par.lam!) : unifCdf(v, par.a!, par.b!));
  return x.map((u, i) => {
    const lo = i === 0 ? 0 : F(x[i - 1]);
    const hi = i === m - 1 ? 1 : F(u);
    return hi - lo;
  });
}

/** Class midpoints from upper bounds (first/last class get the width of their neighbour). */
export function midpoints(upper: number[], lowerFirst?: number): number[] {
  const m = upper.length;
  const lower = upper.map((_, i) => (i === 0 ? lowerFirst ?? upper[0] - (upper[1] - upper[0]) : upper[i - 1]));
  const up = upper.map((u, i) => (i === m - 1 ? lower[i] + (lower[i] - lower[i - 1]) : u));
  return up.map((u, i) => (lower[i] + u) / 2);
}

export interface GofClass { label: string; O: number; p: number; E: number }
/** Merge adjacent classes from the left until each E >= minE; a small last group joins its left neighbour. */
export function mergeSmall(cls: GofClass[], minE = 5): GofClass[] {
  const out: GofClass[] = [];
  let cur: GofClass | null = null;
  for (const c of cls) {
    cur = cur ? { label: cur.label.split(' .. ')[0] + ' .. ' + c.label, O: cur.O + c.O, p: cur.p + c.p, E: cur.E + c.E } : { ...c };
    if (cur.E >= minE) {
      out.push(cur);
      cur = null;
    }
  }
  if (cur) {
    if (out.length) {
      const l = out.pop()!;
      out.push({ label: l.label.split(' .. ')[0] + ' .. ' + cur.label.split(' .. ').pop(), O: l.O + cur.O, p: l.p + cur.p, E: l.E + cur.E });
    } else out.push(cur);
  }
  return out;
}
