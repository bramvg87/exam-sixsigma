// Probability distributions: cdf, sf, inverse, pdf/pmf.
import { betaI, betaIc, erfc, gammaP, gammaQ, invertCdf, lnChoose, lnGamma, lnFactorial } from './special.ts';

const SQRT2 = Math.SQRT2;

// ---------- Normal ----------
export function normPdf(x: number, mu = 0, sigma = 1): number {
  const z = (x - mu) / sigma;
  return Math.exp(-0.5 * z * z) / (sigma * Math.sqrt(2 * Math.PI));
}
export function normCdf(x: number, mu = 0, sigma = 1): number {
  const z = (x - mu) / sigma;
  return 0.5 * erfc(-z / SQRT2);
}
export function normSf(x: number, mu = 0, sigma = 1): number {
  const z = (x - mu) / sigma;
  return 0.5 * erfc(z / SQRT2);
}

/** Acklam's rational approximation followed by Halley refinement steps. */
export function normInv(p: number, mu = 0, sigma = 1): number {
  if (!(p >= 0 && p <= 1)) return NaN;
  if (p === 0) return -Infinity;
  if (p === 1) return Infinity;
  const a = [-3.969683028665376e1, 2.209460984245205e2, -2.759285104469687e2, 1.38357751867269e2, -3.066479806614716e1, 2.506628277459239];
  const b = [-5.447609879822406e1, 1.615858368580409e2, -1.556989798598866e2, 6.680131188771972e1, -1.328068155288572e1];
  const c = [-7.784894002430293e-3, -3.223964580411365e-1, -2.400758277161838, -2.549732539343734, 4.374664141464968, 2.938163982698783];
  const d = [7.784695709041462e-3, 3.224671290700398e-1, 2.445134137142996, 3.754408661907416];
  const pl = 0.02425;
  let x: number;
  if (p < pl) {
    const q = Math.sqrt(-2 * Math.log(p));
    x = (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
  } else if (p <= 1 - pl) {
    const q = p - 0.5;
    const r = q * q;
    x = ((((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q) / (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1);
  } else {
    const q = Math.sqrt(-2 * Math.log1p(-p));
    x = -(((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
  }
  // Halley refinement (use the tail that keeps precision)
  for (let i = 0; i < 3; i++) {
    let e: number;
    if (p < 0.5) e = normCdf(x) - p;
    else e = -(normSf(x) - (1 - p));
    const u = e * Math.sqrt(2 * Math.PI) * Math.exp((x * x) / 2);
    x = x - u / (1 + (x * u) / 2);
  }
  return mu + sigma * x;
}
/** Inverse of the right tail: x with P(X > x) = q. */
export function normInvRt(q: number, mu = 0, sigma = 1): number {
  return mu - sigma * normInv(q);
}

// ---------- Student t ----------
export function tPdf(x: number, df: number): number {
  return Math.exp(lnGamma((df + 1) / 2) - lnGamma(df / 2) - 0.5 * Math.log(df * Math.PI) - ((df + 1) / 2) * Math.log1p((x * x) / df));
}
export function tCdf(x: number, df: number): number {
  if (!isFinite(x)) return x > 0 ? 1 : 0;
  const xx = df / (df + x * x);
  const tail = 0.5 * betaI(xx, df / 2, 0.5);
  return x > 0 ? 1 - tail : tail;
}
export function tSf(x: number, df: number): number {
  return tCdf(-x, df);
}
export function tInv(p: number, df: number): number {
  if (p === 0.5) return 0;
  if (p < 0.5) return -tInvRt(p, df);
  return tInvRt(1 - p, df);
}
/** x with P(T > x) = q. */
export function tInvRt(q: number, df: number): number {
  if (q === 0.5) return 0;
  if (q > 0.5) return -tInvRt(1 - q, df);
  // For x > 0: P(T > x) = 0.5 * I_{df/(df+x^2)}(df/2, 1/2). Solve via bisection on x.
  return invertCdf(1 - q, (x) => tCdf(x, df), (x) => tSf(x, df), 0, Infinity, 2, q);
}

// ---------- Chi-square ----------
export function chi2Pdf(x: number, df: number): number {
  if (x < 0) return 0;
  if (x === 0) return df === 2 ? 0.5 : df < 2 ? Infinity : 0;
  return Math.exp((df / 2 - 1) * Math.log(x) - x / 2 - (df / 2) * Math.LN2 - lnGamma(df / 2));
}
export function chi2Cdf(x: number, df: number): number {
  return gammaP(df / 2, x / 2);
}
export function chi2Sf(x: number, df: number): number {
  return gammaQ(df / 2, x / 2);
}
export function chi2Inv(p: number, df: number): number {
  return invertCdf(p, (x) => chi2Cdf(x, df), (x) => chi2Sf(x, df), 0, Infinity, df);
}
export function chi2InvRt(q: number, df: number): number {
  return invertCdf(1 - q, (x) => chi2Cdf(x, df), (x) => chi2Sf(x, df), 0, Infinity, df, q);
}

// ---------- F ----------
export function fPdf(x: number, d1: number, d2: number): number {
  if (x < 0) return 0;
  if (x === 0) return d1 === 2 ? 1 : d1 < 2 ? Infinity : 0;
  const lb = lnGamma(d1 / 2) + lnGamma(d2 / 2) - lnGamma((d1 + d2) / 2);
  return Math.exp(0.5 * (d1 * Math.log(d1 * x) + d2 * Math.log(d2) - (d1 + d2) * Math.log(d1 * x + d2)) - Math.log(x) - lb);
}
export function fCdf(x: number, d1: number, d2: number): number {
  if (x <= 0) return 0;
  return betaI((d1 * x) / (d1 * x + d2), d1 / 2, d2 / 2);
}
export function fSf(x: number, d1: number, d2: number): number {
  if (x <= 0) return 1;
  return betaI(d2 / (d2 + d1 * x), d2 / 2, d1 / 2);
}
export function fInv(p: number, d1: number, d2: number): number {
  return invertCdf(p, (x) => fCdf(x, d1, d2), (x) => fSf(x, d1, d2), 0, Infinity, 1);
}
export function fInvRt(q: number, d1: number, d2: number): number {
  return invertCdf(1 - q, (x) => fCdf(x, d1, d2), (x) => fSf(x, d1, d2), 0, Infinity, 1, q);
}

// ---------- Beta ----------
export function betaPdf(x: number, a: number, b: number): number {
  if (x < 0 || x > 1) return 0;
  return Math.exp((a - 1) * Math.log(x) + (b - 1) * Math.log1p(-x) - (lnGamma(a) + lnGamma(b) - lnGamma(a + b)));
}
export function betaCdf(x: number, a: number, b: number): number {
  return betaI(x, a, b);
}
export function betaSf(x: number, a: number, b: number): number {
  if (x <= 0) return 1;
  if (x >= 1) return 0;
  return betaIc(x, a, b);
}
export function betaInv(p: number, a: number, b: number): number {
  return invertCdf(p, (x) => betaCdf(x, a, b), (x) => betaSf(x, a, b), 0, 1);
}

// ---------- Exponential, uniform ----------
export const expCdf = (x: number, lam: number) => (x <= 0 ? 0 : -Math.expm1(-lam * x));
export const expSf = (x: number, lam: number) => (x <= 0 ? 1 : Math.exp(-lam * x));
export const expPdf = (x: number, lam: number) => (x < 0 ? 0 : lam * Math.exp(-lam * x));
export const expInv = (p: number, lam: number) => -Math.log1p(-p) / lam;
export const unifCdf = (x: number, a: number, b: number) => (x <= a ? 0 : x >= b ? 1 : (x - a) / (b - a));
export const unifPdf = (x: number, a: number, b: number) => (x < a || x > b ? 0 : 1 / (b - a));
export const unifInv = (p: number, a: number, b: number) => a + p * (b - a);

// ---------- Binomial ----------
export function binomPmf(k: number, n: number, p: number): number {
  if (k < 0 || k > n || !Number.isInteger(k)) return 0;
  if (p === 0) return k === 0 ? 1 : 0;
  if (p === 1) return k === n ? 1 : 0;
  return Math.exp(lnChoose(n, k) + k * Math.log(p) + (n - k) * Math.log1p(-p));
}
/** P(X <= k) */
export function binomCdf(k: number, n: number, p: number): number {
  k = Math.floor(k);
  if (k < 0) return 0;
  if (k >= n) return 1;
  if (p === 0) return 1;
  if (p === 1) return 0;
  // P(X <= k) = I_{1-p}(n-k, k+1)
  return betaI(1 - p, n - k, k + 1);
}
/** P(X > k) */
export function binomSf(k: number, n: number, p: number): number {
  k = Math.floor(k);
  if (k < 0) return 1;
  if (k >= n) return 0;
  if (p === 0) return 0;
  if (p === 1) return 1;
  return betaI(p, k + 1, n - k);
}
/** Smallest k with P(X <= k) >= alpha (Excel BINOM.INV). */
export function binomInv(n: number, p: number, alpha: number): number {
  let lo = 0;
  let hi = n;
  while (lo < hi) {
    const m = Math.floor((lo + hi) / 2);
    if (binomCdf(m, n, p) >= alpha) hi = m;
    else lo = m + 1;
  }
  return lo;
}

// ---------- Poisson ----------
export function poisPmf(k: number, lam: number): number {
  if (k < 0 || !Number.isInteger(k)) return 0;
  if (lam === 0) return k === 0 ? 1 : 0;
  return Math.exp(k * Math.log(lam) - lam - lnFactorial(k));
}
export function poisCdf(k: number, lam: number): number {
  k = Math.floor(k);
  if (k < 0) return 0;
  return gammaQ(k + 1, lam);
}
export function poisSf(k: number, lam: number): number {
  k = Math.floor(k);
  if (k < 0) return 1;
  return gammaP(k + 1, lam);
}
export function poisInv(lam: number, alpha: number): number {
  let k = 0;
  let hi = Math.max(10, Math.ceil(lam + 20 * Math.sqrt(lam) + 20));
  while (poisCdf(hi, lam) < alpha) hi *= 2;
  let lo = k;
  while (lo < hi) {
    const m = Math.floor((lo + hi) / 2);
    if (poisCdf(m, lam) >= alpha) hi = m;
    else lo = m + 1;
  }
  return lo;
}

// ---------- Hypergeometric (population N, successes K, draws n) ----------
export function hyperPmf(k: number, N: number, K: number, n: number): number {
  if (!Number.isInteger(k)) return 0;
  const lo = Math.max(0, n - (N - K));
  const hi = Math.min(n, K);
  if (k < lo || k > hi) return 0;
  return Math.exp(lnChoose(K, k) + lnChoose(N - K, n - k) - lnChoose(N, n));
}
export function hyperCdf(k: number, N: number, K: number, n: number): number {
  k = Math.floor(k);
  const lo = Math.max(0, n - (N - K));
  const hi = Math.min(n, K);
  if (k < lo) return 0;
  if (k >= hi) return 1;
  const mean = (n * K) / N;
  let s = 0;
  if (k <= mean) {
    for (let i = lo; i <= k; i++) s += hyperPmf(i, N, K, n);
    return Math.min(1, s);
  }
  for (let i = k + 1; i <= hi; i++) s += hyperPmf(i, N, K, n);
  return Math.max(0, 1 - s);
}
export function hyperSf(k: number, N: number, K: number, n: number): number {
  k = Math.floor(k);
  const lo = Math.max(0, n - (N - K));
  const hi = Math.min(n, K);
  if (k < lo) return 1;
  if (k >= hi) return 0;
  const mean = (n * K) / N;
  let s = 0;
  if (k >= mean) {
    for (let i = k + 1; i <= hi; i++) s += hyperPmf(i, N, K, n);
    return Math.min(1, s);
  }
  for (let i = lo; i <= k; i++) s += hyperPmf(i, N, K, n);
  return Math.max(0, 1 - s);
}

// ---------- Noncentral t (Lenth 1989, AS 243) ----------
export function nctCdf(t: number, df: number, delta: number): number {
  let tt = t;
  let del = delta;
  let negdel = false;
  if (t < 0) {
    negdel = true;
    tt = -t;
    del = -delta;
  }
  let tnc = 0;
  const x = (tt * tt) / (tt * tt + df);
  if (x > 0) {
    const lambda = del * del;
    let p = 0.5 * Math.exp(-0.5 * lambda);
    let q = Math.sqrt(2 / Math.PI) * p * del;
    let s = 0.5 - p;
    let a = 0.5;
    const b = 0.5 * df;
    const rxb = Math.pow(1 - x, b);
    const albeta = 0.5 * Math.log(Math.PI) + lnGamma(b) - lnGamma(a + b);
    let xodd = betaI(x, a, b);
    let godd = 2 * rxb * Math.exp(a * Math.log(x) - albeta);
    let xeven = 1 - rxb;
    let geven = b * x * rxb;
    tnc = p * xodd + q * xeven;
    let en = 1;
    for (let it = 0; it < 5000; it++) {
      a += 1;
      xodd -= godd;
      xeven -= geven;
      godd *= (x * (a + b - 1)) / a;
      geven *= (x * (a + b - 0.5)) / (a + 0.5);
      p *= lambda / (2 * en);
      q *= lambda / (2 * en + 1);
      s -= p;
      en += 1;
      tnc += p * xodd + q * xeven;
      const errbd = 2 * s * (xodd - godd);
      if (Math.abs(errbd) < 1e-14 && en > lambda / 2) break;
    }
  }
  tnc += normCdf(-del);
  if (negdel) tnc = 1 - tnc;
  return Math.min(1, Math.max(0, tnc));
}
export function nctInv(p: number, df: number, delta: number): number {
  return invertCdf(p, (x) => nctCdf(x, df, delta), (x) => 1 - nctCdf(x, df, delta), -Infinity, Infinity, Math.max(1, Math.abs(delta) * 2));
}
