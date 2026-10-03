// Confidence intervals as stand-alone estimates (not tied to a test): mean (z / t), variance and sd (chi2),
// ratio of two variances (F), plus the CLT sampling distribution of the mean.
import { normInv, tInvRt, chi2Inv, chi2InvRt, fInv, normCdf } from '../stats/dist.ts';

export type CiKind = 'two' | 'lower' | 'upper'; // lower = one-sided lower bound, upper = one-sided upper bound

export interface CiOut {
  est: number;
  lo: number;
  hi: number;
  crit: number[]; // critical value(s) used
  se?: number;
  margin?: number;
  df?: number | [number, number];
}

const tailA = (alpha: number, kind: CiKind) => (kind === 'two' ? alpha / 2 : alpha);

/** CI for mu with sigma known (z). */
export function ciMeanZ(xbar: number, sigma: number, n: number, alpha: number, kind: CiKind): CiOut {
  const se = sigma / Math.sqrt(n);
  const z = normInv(1 - tailA(alpha, kind));
  const m = z * se;
  return { est: xbar, lo: kind === 'upper' ? -Infinity : xbar - m, hi: kind === 'lower' ? Infinity : xbar + m, crit: [z], se, margin: m };
}

/** CI for mu with sigma unknown (t, df = n - 1). */
export function ciMeanT(xbar: number, s: number, n: number, alpha: number, kind: CiKind): CiOut {
  const df = n - 1;
  const se = s / Math.sqrt(n);
  const t = tInvRt(tailA(alpha, kind), df);
  const m = t * se;
  return { est: xbar, lo: kind === 'upper' ? -Infinity : xbar - m, hi: kind === 'lower' ? Infinity : xbar + m, crit: [t], se, margin: m, df };
}

/** CI for sigma^2 (chi2, df = n - 1). Returns variance bounds; take sqrt for sigma. */
export function ciVar(s: number, n: number, alpha: number, kind: CiKind): CiOut {
  const df = n - 1;
  const ss = df * s * s;
  const a = tailA(alpha, kind);
  const chiHi = chi2InvRt(a, df); // large quantile -> lower bound
  const chiLo = chi2Inv(a, df); // small quantile -> upper bound
  return {
    est: s * s,
    lo: kind === 'upper' ? 0 : ss / chiHi,
    hi: kind === 'lower' ? Infinity : ss / chiLo,
    crit: kind === 'two' ? [chiLo, chiHi] : kind === 'lower' ? [chiHi] : [chiLo],
    df,
  };
}

/** CI for rho = sigma_a^2 / sigma_b^2 (a in the numerator). Pivot (s_b^2/s_a^2) rho ~ F(n_b - 1, n_a - 1). */
export function ciRatio(saSq: number, na: number, sbSq: number, nb: number, alpha: number, kind: CiKind): CiOut {
  const r = saSq / sbSq;
  const d1 = nb - 1;
  const d2 = na - 1;
  const a = tailA(alpha, kind);
  const fLo = fInv(a, d1, d2);
  const fHi = fInv(1 - a, d1, d2);
  return {
    est: r,
    lo: kind === 'upper' ? 0 : r * fLo,
    hi: kind === 'lower' ? Infinity : r * fHi,
    crit: kind === 'two' ? [fLo, fHi] : kind === 'lower' ? [fLo] : [fHi],
    df: [d1, d2],
  };
}

/** CLT: sampling distribution of the mean of n observations from a population with mean mu, sd sigma. */
export function clt(mu: number, sigma: number, n: number, alpha: number, a?: number, b?: number) {
  const se = sigma / Math.sqrt(n);
  const z = normInv(1 - alpha / 2);
  const out: { se: number; z: number; lo: number; hi: number; pLeA?: number; pBetween?: number; pGeB?: number } = { se, z, lo: mu - z * se, hi: mu + z * se };
  if (a !== undefined) out.pLeA = normCdf(a, mu, se);
  if (b !== undefined) out.pGeB = 1 - normCdf(b, mu, se);
  if (a !== undefined && b !== undefined) out.pBetween = normCdf(b, mu, se) - normCdf(a, mu, se);
  return out;
}
