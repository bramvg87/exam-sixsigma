// MSA helpers: bias study, linearity study, measurement uncertainty propagation.
import { mean, sdS } from '../stats/desc.ts';
import { tMean } from './hypo.ts';
import { regress } from './regression.ts';

/** Bias study: n repeated measurements of a reference part. Two-sided t test on H0: bias = 0. */
export function biasStudy(xbar: number, s: number, n: number, ref: number, alpha: number) {
  if (!(n >= 2)) throw new Error('Minstens 2 metingen nodig voor de bias-studie.');
  if (!(s > 0)) throw new Error('De standaardafwijking moet groter dan 0 zijn.');
  const r = tMean(xbar, s, n, ref, alpha, 'two');
  const bias = xbar - ref;
  const se = s / Math.sqrt(n);
  return { bias, se, t: r.stat, df: n - 1, p: r.p, tcrit: r.crit[1], ci: [r.ci[0] - ref, r.ci[1] - ref] as [number, number], reject: r.reject };
}

/** Linearity study (AIAG): regress bias = a + b * reference. */
export function linearityStudy(ref: number[], meas: number[], alpha: number, pv?: number) {
  if (ref.length !== meas.length) throw new Error('Referentie en meting moeten even veel waarden hebben.');
  const bias = meas.map((m, i) => m - ref[i]);
  const levels = [...new Set(ref)].sort((a, b) => a - b);
  if (levels.length < 2) throw new Error('Minstens 2 verschillende referentiewaarden nodig.');
  const fit = regress(bias, [ref], alpha);
  const [a, b] = fit.beta;
  const perRef = levels.map((lv) => {
    const bs = bias.filter((_, i) => ref[i] === lv);
    const n = bs.length;
    const m = mean(bs);
    const s = n >= 2 ? sdS(bs) : NaN;
    const t = n >= 2 && s > 0 ? tMean(m, s, n, 0, alpha, 'two') : null;
    return { ref: lv, n, bias: m, s, t: t?.stat ?? NaN, p: t?.p ?? NaN };
  });
  return {
    bias, fit, a, b,
    seA: fit.se[0], seB: fit.se[1], tA: fit.t[0], tB: fit.t[1], pA: fit.p[0], pB: fit.p[1], ciA: fit.ci[0], ciB: fit.ci[1],
    R2: fit.R2, s: fit.s, df: fit.dfE, tc: fit.tc,
    linearity: pv !== undefined ? Math.abs(b) * pv : NaN,
    pctLin: 100 * Math.abs(b),
    perRef,
  };
}

/**
 * Build a balanced two-factor cell structure from long-format records (a level, b level, response).
 * Levels keep their order of first appearance. cells[i][j] = replicates of (a_i, b_j).
 */
export function buildCells(recs: { a: string; b: string; y: number }[], aName = 'A', bName = 'B') {
  if (!recs.length) throw new Error('Geen waarnemingen gevonden.');
  const aL: string[] = [];
  const bL: string[] = [];
  for (const r of recs) {
    if (!aL.includes(r.a)) aL.push(r.a);
    if (!bL.includes(r.b)) bL.push(r.b);
  }
  const cells: number[][][] = aL.map(() => bL.map(() => [] as number[]));
  for (const r of recs) cells[aL.indexOf(r.a)][bL.indexOf(r.b)].push(r.y);
  const r0 = cells[0][0].length;
  for (let i = 0; i < aL.length; i++)
    for (let j = 0; j < bL.length; j++) {
      const n = cells[i][j].length;
      if (n === 0) throw new Error(`Ontbrekende combinatie: ${aName} = ${aL[i]}, ${bName} = ${bL[j]} heeft geen waarnemingen.`);
      if (n !== r0) throw new Error(`Ongebalanceerd ontwerp: ${aName} = ${aL[i]}, ${bName} = ${bL[j]} heeft ${n} waarneming(en), ${aName} = ${aL[0]}, ${bName} = ${bL[0]} heeft er ${r0}. Elke combinatie moet even veel herhalingen hebben.`);
    }
  return { aLevels: aL, bLevels: bL, cells, r: r0 };
}

export interface UTerm { x: number; u: number; c: number }

/** y = sum c_i x_i ; u_c = sqrt(sum c_i^2 u_i^2) (independent inputs). */
export function uSum(terms: UTerm[]) {
  const y = terms.reduce((s, t) => s + t.c * t.x, 0);
  const contrib = terms.map((t) => (t.c * t.u) ** 2);
  const uc = Math.sqrt(contrib.reduce((s, v) => s + v, 0));
  return { y, uc, contrib };
}

/** y = prod x_i^{n_i} ; u_c/|y| = sqrt(sum (n_i u_i / x_i)^2). */
export function uProd(terms: UTerm[]) {
  if (terms.some((t) => t.x === 0)) throw new Error('Relatieve onzekerheid: geen enkele waarde mag 0 zijn.');
  const y = terms.reduce((s, t) => s * Math.pow(t.x, t.c), 1);
  const rel = terms.map((t) => (t.c * t.u) / t.x);
  const contrib = rel.map((r) => r * r);
  const urel = Math.sqrt(contrib.reduce((s, v) => s + v, 0));
  return { y, urel, uc: urel * Math.abs(y), rel, contrib };
}
