// Special functions: lnGamma, regularised incomplete gamma and beta, erf/erfc.
// Accuracy target: relative error < 1e-12 in the body, accurate tails.

const EPS = 1e-16;
const FPMIN = 1e-300;

// Lanczos approximation (g = 7, n = 9), relative error ~1e-15.
const LANCZOS = [
  0.99999999999980993, 676.5203681218851, -1259.1392167224028, 771.32342877765313,
  -176.61502916214059, 12.507343278686905, -0.13857109526572012, 9.9843695780195716e-6,
  1.5056327351493116e-7,
];

export function lnGamma(x: number): number {
  if (x < 0.5) {
    // Reflection formula
    return Math.log(Math.PI / Math.abs(Math.sin(Math.PI * x))) - lnGamma(1 - x);
  }
  x -= 1;
  let a = LANCZOS[0];
  const t = x + 7.5;
  for (let i = 1; i < 9; i++) a += LANCZOS[i] / (x + i);
  return 0.5 * Math.log(2 * Math.PI) + (x + 0.5) * Math.log(t) - t + Math.log(a);
}

export function gamma(x: number): number {
  if (Number.isInteger(x) && x > 0 && x < 171) {
    let r = 1;
    for (let i = 2; i < x; i++) r *= i;
    return r;
  }
  const s = x < 0.5 ? Math.sign(Math.sin(Math.PI * x)) : 1;
  return s * Math.exp(lnGamma(x));
}

const LNFACT: number[] = [0];
export function lnFactorial(n: number): number {
  if (n < 0) return NaN;
  if (n < 2000) {
    while (LNFACT.length <= n) LNFACT.push(LNFACT[LNFACT.length - 1] + Math.log(LNFACT.length));
    return LNFACT[n];
  }
  return lnGamma(n + 1);
}

export function lnChoose(n: number, k: number): number {
  if (k < 0 || k > n) return -Infinity;
  return lnFactorial(n) - lnFactorial(k) - lnFactorial(n - k);
}

/** Regularised lower incomplete gamma P(a, x). */
export function gammaP(a: number, x: number): number {
  if (x <= 0) return 0;
  if (!isFinite(x)) return 1;
  if (x < a + 1) return gser(a, x);
  return 1 - gcf(a, x);
}

/** Regularised upper incomplete gamma Q(a, x) = 1 - P(a, x). */
export function gammaQ(a: number, x: number): number {
  if (x <= 0) return 1;
  if (!isFinite(x)) return 0;
  if (x < a + 1) return 1 - gser(a, x);
  return gcf(a, x);
}

function gser(a: number, x: number): number {
  let ap = a;
  let sum = 1 / a;
  let del = sum;
  for (let n = 0; n < 100000; n++) {
    ap += 1;
    del *= x / ap;
    sum += del;
    if (Math.abs(del) < Math.abs(sum) * EPS) break;
  }
  return sum * Math.exp(-x + a * Math.log(x) - lnGamma(a));
}

function gcf(a: number, x: number): number {
  // Modified Lentz continued fraction
  let b = x + 1 - a;
  let c = 1 / FPMIN;
  let d = 1 / b;
  let h = d;
  for (let i = 1; i < 100000; i++) {
    const an = -i * (i - a);
    b += 2;
    d = an * d + b;
    if (Math.abs(d) < FPMIN) d = FPMIN;
    c = b + an / c;
    if (Math.abs(c) < FPMIN) c = FPMIN;
    d = 1 / d;
    const del = d * c;
    h *= del;
    if (Math.abs(del - 1) < EPS) break;
  }
  return Math.exp(-x + a * Math.log(x) - lnGamma(a)) * h;
}

/** Regularised incomplete beta I_x(a, b). */
export function betaI(x: number, a: number, b: number): number {
  if (x <= 0) return 0;
  if (x >= 1) return 1;
  const lbt = lnGamma(a + b) - lnGamma(a) - lnGamma(b) + a * Math.log(x) + b * Math.log1p(-x);
  const bt = Math.exp(lbt);
  if (x < (a + 1) / (a + b + 2)) return (bt * betacf(x, a, b)) / a;
  return 1 - (bt * betacf(1 - x, b, a)) / b;
}

/** Complement 1 - I_x(a, b), computed without cancellation. */
export function betaIc(x: number, a: number, b: number): number {
  return betaI(1 - x, b, a);
}

function betacf(x: number, a: number, b: number): number {
  const qab = a + b;
  const qap = a + 1;
  const qam = a - 1;
  let c = 1;
  let d = 1 - (qab * x) / qap;
  if (Math.abs(d) < FPMIN) d = FPMIN;
  d = 1 / d;
  let h = d;
  for (let m = 1; m < 100000; m++) {
    const m2 = 2 * m;
    let aa = (m * (b - m) * x) / ((qam + m2) * (a + m2));
    d = 1 + aa * d;
    if (Math.abs(d) < FPMIN) d = FPMIN;
    c = 1 + aa / c;
    if (Math.abs(c) < FPMIN) c = FPMIN;
    d = 1 / d;
    h *= d * c;
    aa = (-(a + m) * (qab + m) * x) / ((a + m2) * (qap + m2));
    d = 1 + aa * d;
    if (Math.abs(d) < FPMIN) d = FPMIN;
    c = 1 + aa / c;
    if (Math.abs(c) < FPMIN) c = FPMIN;
    d = 1 / d;
    const del = d * c;
    h *= del;
    if (Math.abs(del - 1) < EPS) break;
  }
  return h;
}

/** erfc(x) via incomplete gamma: erfc(x) = Q(1/2, x^2) for x >= 0. Accurate in the far tail. */
export function erfc(x: number): number {
  if (isNaN(x)) return NaN;
  if (x >= 0) return gammaQ(0.5, x * x);
  return 1 + gammaP(0.5, x * x);
}

export function erf(x: number): number {
  if (x >= 0) return gammaP(0.5, x * x);
  return -gammaP(0.5, x * x);
}

/**
 * Generic inversion of a monotone increasing CDF on [lo, hi] (hi may be Infinity).
 * Uses cdf when p <= 0.5 and sf otherwise, so right-tail quantiles keep full precision.
 */
export function invertCdf(
  p: number,
  cdf: (x: number) => number,
  sf: (x: number) => number,
  lo: number,
  hi: number,
  start = 1,
  qExact?: number,
): number {
  if (!(p >= 0 && p <= 1)) return NaN;
  const q = qExact ?? 1 - p;
  if (p === 0 && qExact === undefined) return lo;
  if (q === 0) return hi;
  if (p === 0) return lo;
  const useSf = qExact !== undefined ? q < 0.5 : p > 0.5;
  // g(x) increasing, root of g(x) = 0
  const g = useSf ? (x: number) => q - sf(x) : (x: number) => cdf(x) - p;
  let a = lo;
  let b = hi;
  if (!isFinite(b)) {
    b = Math.max(start, lo + 1);
    let guard = 0;
    while (g(b) < 0 && guard++ < 2000) {
      a = b;
      b *= 2;
    }
  }
  if (!isFinite(a)) {
    a = Math.min(-start, hi - 1);
    let guard = 0;
    while (g(a) > 0 && guard++ < 2000) {
      b = a;
      a *= 2;
    }
  }
  // Bisection with interpolation fallback (Illinois / regula falsi + bisection guard)
  for (let i = 0; i < 400; i++) {
    const m = 0.5 * (a + b);
    if (m === a || m === b) break;
    const gm = g(m);
    if (gm === 0) return m;
    if (gm < 0) a = m;
    else b = m;
    if (Math.abs(b - a) <= 1e-15 * Math.max(Math.abs(a), Math.abs(b), 1e-300)) break;
  }
  return 0.5 * (a + b);
}
