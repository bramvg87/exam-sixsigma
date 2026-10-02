// Hypothesis tests and confidence intervals (summary statistics in, numbers out).
import * as D from '../stats/dist.ts';
import { mean, sdS, varS } from '../stats/desc.ts';

export type Side = 'left' | 'right' | 'two';

export interface TestOut {
  stat: number;
  df?: number;
  df2?: number;
  p: number;
  crit: number[]; // critical value(s) in the statistic's scale
  reject: boolean;
  ci: [number, number]; // CI for the parameter (one-sided -> one infinite end)
}

function pFromStat(side: Side, cdf: number, sf: number): number {
  if (side === 'left') return cdf;
  if (side === 'right') return sf;
  return Math.min(1, 2 * Math.min(cdf, sf));
}

// ---------- Z test mean (sigma known) ----------
export function zMean(xbar: number, sigma: number, n: number, mu0: number, alpha: number, side: Side): TestOut {
  const se = sigma / Math.sqrt(n);
  const z = (xbar - mu0) / se;
  const p = pFromStat(side, D.normCdf(z), D.normSf(z));
  const za = D.normInv(1 - alpha);
  const za2 = D.normInv(1 - alpha / 2);
  const crit = side === 'left' ? [-za] : side === 'right' ? [za] : [-za2, za2];
  const ci: [number, number] =
    side === 'left' ? [-Infinity, xbar + za * se] : side === 'right' ? [xbar - za * se, Infinity] : [xbar - za2 * se, xbar + za2 * se];
  return { stat: z, p, crit, reject: p < alpha, ci };
}

// ---------- t test mean ----------
export function tMean(xbar: number, s: number, n: number, mu0: number, alpha: number, side: Side): TestOut {
  const df = n - 1;
  const se = s / Math.sqrt(n);
  const t = (xbar - mu0) / se;
  const p = pFromStat(side, D.tCdf(t, df), D.tSf(t, df));
  const ta = D.tInvRt(alpha, df);
  const ta2 = D.tInvRt(alpha / 2, df);
  const crit = side === 'left' ? [-ta] : side === 'right' ? [ta] : [-ta2, ta2];
  const ci: [number, number] =
    side === 'left' ? [-Infinity, xbar + ta * se] : side === 'right' ? [xbar - ta * se, Infinity] : [xbar - ta2 * se, xbar + ta2 * se];
  return { stat: t, df, p, crit, reject: p < alpha, ci };
}

// ---------- chi2 test variance ----------
/** CI is for sigma^2. */
export function chi2Var(s: number, n: number, sigma0: number, alpha: number, side: Side): TestOut {
  const df = n - 1;
  const ss = df * s * s;
  const chi = ss / (sigma0 * sigma0);
  const p = pFromStat(side, D.chi2Cdf(chi, df), D.chi2Sf(chi, df));
  const crit =
    side === 'left'
      ? [D.chi2Inv(alpha, df)]
      : side === 'right'
        ? [D.chi2InvRt(alpha, df)]
        : [D.chi2Inv(alpha / 2, df), D.chi2InvRt(alpha / 2, df)];
  // HA: sigma > sigma0 (right) -> lower bound; HA: sigma < sigma0 (left) -> upper bound
  const ci: [number, number] =
    side === 'right'
      ? [ss / D.chi2InvRt(alpha, df), Infinity]
      : side === 'left'
        ? [0, ss / D.chi2Inv(alpha, df)]
        : [ss / D.chi2InvRt(alpha / 2, df), ss / D.chi2Inv(alpha / 2, df)];
  return { stat: chi, df, p, crit, reject: p < alpha, ci };
}

// ---------- F test two variances ----------
/** Test H0: sigma1^2 = sigma2^2 with F = s1^2/s2^2. CI is for sigma1^2/sigma2^2. */
export function fTest(s1sq: number, n1: number, s2sq: number, n2: number, alpha: number, side: Side): TestOut {
  const d1 = n1 - 1;
  const d2 = n2 - 1;
  const F = s1sq / s2sq;
  const p = pFromStat(side, D.fCdf(F, d1, d2), D.fSf(F, d1, d2));
  const crit =
    side === 'left' ? [D.fInv(alpha, d1, d2)] : side === 'right' ? [D.fInvRt(alpha, d1, d2)] : [D.fInv(alpha / 2, d1, d2), D.fInvRt(alpha / 2, d1, d2)];
  const ci = ratioCI(s1sq, n1, s2sq, n2, alpha, side === 'right' ? 'lower' : side === 'left' ? 'upper' : 'two');
  return { stat: F, df: d1, df2: d2, p, crit, reject: p < alpha, ci };
}

/**
 * CI for rho = sigma_a^2 / sigma_b^2 (a in numerator).
 * Pivot: (s_b^2/s_a^2) * rho ~ F(n_b-1, n_a-1)... equivalently
 * rho in [ (s_a^2/s_b^2) * F_{alpha/2}(n_b-1; n_a-1) , (s_a^2/s_b^2) * F_{1-alpha/2}(n_b-1; n_a-1) ].
 * With a = 2, b = 1 this is the course formula (s2^2/s1^2) * F(alpha; n1-1; n2-1).
 */
export function ratioCI(sa2: number, na: number, sb2: number, nb: number, alpha: number, kind: 'lower' | 'upper' | 'two'): [number, number] {
  const r = sa2 / sb2;
  const db = nb - 1;
  const da = na - 1;
  if (kind === 'lower') return [r * D.fInv(alpha, db, da), Infinity];
  if (kind === 'upper') return [0, r * D.fInv(1 - alpha, db, da)];
  return [r * D.fInv(alpha / 2, db, da), r * D.fInv(1 - alpha / 2, db, da)];
}

// ---------- Z test proportion ----------
export function zProp(d: number, n: number, pi0: number, alpha: number, side: Side, cc: boolean) {
  const p = d / n;
  const se = Math.sqrt((pi0 * (1 - pi0)) / n);
  let pc = p;
  if (cc) {
    const h = 1 / (2 * n);
    if (side === 'left') pc = p + h;
    else if (side === 'right') pc = p - h;
    else pc = p > pi0 ? Math.max(pi0, p - h) : Math.min(pi0, p + h);
  }
  const z = (pc - pi0) / se;
  const pv = pFromStat(side, D.normCdf(z), D.normSf(z));
  const za = D.normInv(1 - alpha);
  const za2 = D.normInv(1 - alpha / 2);
  const crit = side === 'left' ? [-za] : side === 'right' ? [za] : [-za2, za2];
  // Exact binomial p-value
  let pExact: number;
  if (side === 'left') pExact = D.binomCdf(d, n, pi0);
  else if (side === 'right') pExact = 1 - D.binomCdf(d - 1, n, pi0);
  else {
    // two-sided: double the smaller tail (method used in course Excel)
    pExact = Math.min(1, 2 * Math.min(D.binomCdf(d, n, pi0), 1 - D.binomCdf(d - 1, n, pi0)));
  }
  return { p, z, pValue: pv, crit, reject: pv < alpha, pExact, rejectExact: pExact < alpha, npi0: n * pi0, nq0: n * (1 - pi0) };
}

// ---------- CI for a proportion ----------
export function clopperPearson(d: number, n: number, alpha: number, kind: 'two' | 'lower' | 'upper' = 'two'): [number, number] {
  const a = kind === 'two' ? alpha / 2 : alpha;
  const lo = d === 0 ? 0 : D.betaInv(a, d, n - d + 1);
  const hi = d === n ? 1 : D.betaInv(1 - a, d + 1, n - d);
  if (kind === 'lower') return [lo, 1];
  if (kind === 'upper') return [0, hi];
  return [lo, hi];
}
export function wilson(d: number, n: number, alpha: number, kind: 'two' | 'lower' | 'upper' = 'two'): [number, number] {
  const p = d / n;
  const z = D.normInv(1 - (kind === 'two' ? alpha / 2 : alpha));
  const c = p + (z * z) / (2 * n);
  const r = z * Math.sqrt((p * (1 - p)) / n + (z * z) / (4 * n * n));
  const den = 1 + (z * z) / n;
  const lo = (c - r) / den;
  const hi = (c + r) / den;
  if (kind === 'lower') return [lo, 1];
  if (kind === 'upper') return [0, hi];
  return [lo, hi];
}
export function wald(d: number, n: number, alpha: number, kind: 'two' | 'lower' | 'upper' = 'two', z?: number): [number, number] {
  const p = d / n;
  const zz = z ?? D.normInv(1 - (kind === 'two' ? alpha / 2 : alpha));
  const h = zz * Math.sqrt((p * (1 - p)) / n);
  if (kind === 'lower') return [p - h, 1];
  if (kind === 'upper') return [0, p + h];
  return [p - h, p + h];
}
/** Exact CI for the number of defectives D in a finite lot of N (hypergeometric), returned as fraction D/N. */
export function hyperCI(d: number, n: number, N: number, alpha: number): [number, number] {
  const a = alpha / 2;
  let lo = 0;
  for (let Dd = d; Dd <= N - (n - d); Dd++) {
    // smallest D with P(X >= d | D) > a
    if (d === 0) {
      lo = 0;
      break;
    }
    if (D.hyperSf(d - 1, N, Dd, n) > a) {
      lo = Dd;
      break;
    }
  }
  let hi = N;
  for (let Dd = N - (n - d); Dd >= d; Dd--) {
    if (d === n) {
      hi = N;
      break;
    }
    if (D.hyperCdf(d, N, Dd, n) > a) {
      hi = Dd;
      break;
    }
  }
  return [lo / N, hi / N];
}

// ---------- Two samples ----------
export function pooledT(x1: number, s1: number, n1: number, x2: number, s2: number, n2: number, d0: number, alpha: number, side: Side) {
  const df = n1 + n2 - 2;
  const sp2 = ((n1 - 1) * s1 * s1 + (n2 - 1) * s2 * s2) / df;
  const se = Math.sqrt(sp2 * (1 / n1 + 1 / n2));
  const t = (x1 - x2 - d0) / se;
  const p = pFromStat(side, D.tCdf(t, df), D.tSf(t, df));
  const ta = D.tInvRt(alpha, df);
  const ta2 = D.tInvRt(alpha / 2, df);
  const diff = x1 - x2;
  const ci: [number, number] =
    side === 'left' ? [-Infinity, diff + ta * se] : side === 'right' ? [diff - ta * se, Infinity] : [diff - ta2 * se, diff + ta2 * se];
  const crit = side === 'left' ? [-ta] : side === 'right' ? [ta] : [-ta2, ta2];
  return { t, df, sp2, sp: Math.sqrt(sp2), se, p, crit, ci, reject: p < alpha };
}
export function welchT(x1: number, s1: number, n1: number, x2: number, s2: number, n2: number, d0: number, alpha: number, side: Side) {
  const v1 = (s1 * s1) / n1;
  const v2 = (s2 * s2) / n2;
  const se = Math.sqrt(v1 + v2);
  const df = ((v1 + v2) * (v1 + v2)) / ((v1 * v1) / (n1 - 1) + (v2 * v2) / (n2 - 1));
  const t = (x1 - x2 - d0) / se;
  const p = pFromStat(side, D.tCdf(t, df), D.tSf(t, df));
  const ta = D.tInvRt(alpha, df);
  const ta2 = D.tInvRt(alpha / 2, df);
  const diff = x1 - x2;
  const ci: [number, number] =
    side === 'left' ? [-Infinity, diff + ta * se] : side === 'right' ? [diff - ta * se, Infinity] : [diff - ta2 * se, diff + ta2 * se];
  const crit = side === 'left' ? [-ta] : side === 'right' ? [ta] : [-ta2, ta2];
  return { t, df, se, p, crit, ci, reject: p < alpha };
}
export function pairedT(a: number[], b: number[], d0: number, alpha: number, side: Side) {
  if (a.length !== b.length) throw new Error('Gepaarde toets: beide kolommen moeten even veel waarden hebben.');
  const v = a.map((x, i) => x - b[i]);
  const vb = mean(v);
  const sv = sdS(v);
  return { diffs: v, vbar: vb, sv, n: v.length, ...tMean(vb, sv, v.length, d0, alpha, side) };
}
export function twoSampleRaw(a: number[], b: number[], d0: number, alpha: number, side: Side) {
  const x1 = mean(a), s1 = sdS(a), x2 = mean(b), s2 = sdS(b);
  return {
    x1, s1, n1: a.length, x2, s2, n2: b.length,
    pooled: pooledT(x1, s1, a.length, x2, s2, b.length, d0, alpha, side),
    welch: welchT(x1, s1, a.length, x2, s2, b.length, d0, alpha, side),
    f: fTest(varS(a), a.length, varS(b), b.length, 0.05, 'two'),
  };
}

// ---------- Sample size and power ----------
export function nMeanMargin(sigma: number, E: number, alpha: number) {
  const z = D.normInv(1 - alpha / 2);
  const n = Math.pow((z * sigma) / E, 2);
  return { z, nExact: n, n: Math.ceil(n - 1e-9) };
}
export function nMeanShift(sigma: number, delta: number, alpha: number, beta: number, twoSided: boolean) {
  const za = D.normInv(1 - (twoSided ? alpha / 2 : alpha));
  const zb = D.normInv(1 - beta);
  const n = Math.pow(((za + zb) * sigma) / delta, 2);
  return { za, zb, nExact: n, n: Math.ceil(n - 1e-9) };
}
export function nPropMargin(p: number, E: number, alpha: number) {
  const z = D.normInv(1 - alpha / 2);
  const n = (z * z * p * (1 - p)) / (E * E);
  return { z, nExact: n, n: Math.ceil(n - 1e-9) };
}
export function nPropShift(pi0: number, pi1: number, alpha: number, beta: number, twoSided: boolean) {
  const za = D.normInv(1 - (twoSided ? alpha / 2 : alpha));
  const zb = D.normInv(1 - beta);
  const n = Math.pow((za * Math.sqrt(pi0 * (1 - pi0)) + zb * Math.sqrt(pi1 * (1 - pi1))) / (pi1 - pi0), 2);
  return { za, zb, nExact: n, n: Math.ceil(n - 1e-9) };
}
/** beta for a Z test of the mean with true shift delta (>0) at sample size n. */
export function betaMean(sigma: number, delta: number, n: number, alpha: number, twoSided: boolean) {
  const sh = (Math.abs(delta) * Math.sqrt(n)) / sigma;
  if (!twoSided) {
    const za = D.normInv(1 - alpha);
    const beta = D.normCdf(za - sh);
    return { beta, power: 1 - beta, za };
  }
  const za = D.normInv(1 - alpha / 2);
  const beta = D.normCdf(za - sh) - D.normCdf(-za - sh);
  return { beta, power: 1 - beta, za };
}
