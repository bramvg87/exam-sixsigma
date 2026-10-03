// Independence: Fisher exact (2x2), Cramer's V, standardized residuals, Pearson / Spearman correlation tests,
// independence of two events, and cross-tabulation of raw categorical data.
import { hyperPmf, tSf, normInv } from '../stats/dist.ts';
import { mean, ranks } from '../stats/desc.ts';

/** Fisher exact test for a 2x2 table [[a,b],[c,d]] (conditional on the margins, hypergeometric). */
export function fisherExact(t: number[][]) {
  const [[a, b], [c, d]] = t;
  const r1 = a + b;
  const c1 = a + c;
  const N = a + b + c + d;
  const lo = Math.max(0, r1 - (N - c1));
  const hi = Math.min(r1, c1);
  const pmf = (k: number) => hyperPmf(k, N, c1, r1); // X = top-left cell
  const pObs = pmf(a);
  let pLess = 0;
  let pGreater = 0;
  let pTwo = 0;
  for (let k = lo; k <= hi; k++) {
    const p = pmf(k);
    if (k <= a) pLess += p;
    if (k >= a) pGreater += p;
    if (p <= pObs * (1 + 1e-7)) pTwo += p;
  }
  const odds = b * c === 0 ? Infinity : (a * d) / (b * c);
  return { pLess: Math.min(1, pLess), pGreater: Math.min(1, pGreater), pTwo: Math.min(1, pTwo), odds, lo, hi, pObs };
}

export const cramersV = (chi2: number, n: number, r: number, c: number) => Math.sqrt(chi2 / (n * (Math.min(r, c) - 1)));

export const stdResiduals = (t: number[][], E: number[][]) => t.map((row, i) => row.map((v, j) => (v - E[i][j]) / Math.sqrt(E[i][j])));

/** Pearson correlation with t-test for rho = 0 and Fisher-z confidence interval. */
export function pearson(x: number[], y: number[], alpha = 0.05) {
  const n = x.length;
  const mx = mean(x);
  const my = mean(y);
  let sxy = 0, sxx = 0, syy = 0;
  for (let i = 0; i < n; i++) {
    sxy += (x[i] - mx) * (y[i] - my);
    sxx += (x[i] - mx) ** 2;
    syy += (y[i] - my) ** 2;
  }
  const r = sxy / Math.sqrt(sxx * syy);
  const df = n - 2;
  const t = (r * Math.sqrt(df)) / Math.sqrt(Math.max(1e-300, 1 - r * r));
  const p = Math.min(1, 2 * tSf(Math.abs(t), df));
  const z = Math.atanh(r);
  const zc = normInv(1 - alpha / 2) / Math.sqrt(n - 3);
  const ci: [number, number] = n > 3 ? [Math.tanh(z - zc), Math.tanh(z + zc)] : [NaN, NaN];
  return { n, r, r2: r * r, df, t, p, ci, sxy, sxx, syy };
}

/** Spearman rank correlation (Pearson on average ranks) with the same t-approximation. */
export function spearman(x: number[], y: number[], alpha = 0.05) {
  return pearson(ranks(x), ranks(y), alpha);
}

/** Independence of two events from P(A), P(B) and P(A and B). */
export function eventIndependence(pA: number, pB: number, pAB: number) {
  return {
    prod: pA * pB,
    pAgivenB: pAB / pB,
    pBgivenA: pAB / pA,
    pAorB: pA + pB - pAB,
    diff: pAB - pA * pB,
    independent: Math.abs(pAB - pA * pB) < 1e-9,
  };
}

/** Cross-tabulate raw (category, category) pairs. */
export function crossTab(pairs: [string, string][]) {
  const rows: string[] = [];
  const cols: string[] = [];
  for (const [a, b] of pairs) {
    if (!rows.includes(a)) rows.push(a);
    if (!cols.includes(b)) cols.push(b);
  }
  const t = rows.map(() => cols.map(() => 0));
  for (const [a, b] of pairs) t[rows.indexOf(a)][cols.indexOf(b)]++;
  return { rows, cols, t };
}
